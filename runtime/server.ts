/**
 * Part 2: Full MCP Server for AgentCore Runtime
 *
 * This server uses the MCP TypeScript SDK to expose:
 * - Tools: same discover-recipes, get-recipe-details, get-grocery-list from Part 1
 * - Resources: recipe catalog (browseable), individual recipe details
 * - Prompts: meal planner prompt template
 *
 * It listens on 0.0.0.0:8000/mcp via Streamable HTTP (AgentCore Runtime contract).
 */

import { createServer } from "node:http";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { ResourceTemplate } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

// Import shared tool logic from tools/
import { discoverRecipes } from "../tools/discover-recipes.js";
import { getRecipeDetails } from "../tools/get-recipe-details.js";
import { getGroceryList } from "../tools/get-grocery-list.js";
import { recipes } from "../tools/data/recipes.js";

const PORT = 8000;

const handler = createMcpHandler(() => {
  const server = new McpServer(
    { name: "recipe-picker", version: "2.0.0" },
    { capabilities: { tools: {}, resources: {}, prompts: {} } }
  );

  // ============================================================
  // TOOLS — same logic as Part 1, now registered via MCP SDK
  // ============================================================

  server.registerTool(
    "discover_recipes",
    {
      title: "Discover Recipes",
      description:
        "Search for recipes by cuisine type and/or dietary preference. Returns a summary list of matching recipes.",
      inputSchema: z.object({
        cuisine: z
          .string()
          .optional()
          .describe("Cuisine type (e.g. italian, mexican, indian, chinese, thai)"),
        dietary: z
          .string()
          .optional()
          .describe("Dietary preference (e.g. vegetarian, vegan, gluten-free)"),
        maxResults: z
          .number()
          .optional()
          .describe("Maximum number of recipes to return (default 5)"),
      }),
    },
    async ({ cuisine, dietary, maxResults }) => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(discoverRecipes({ cuisine, dietary, maxResults })),
        },
      ],
    })
  );

  server.registerTool(
    "get_recipe_details",
    {
      title: "Get Recipe Details",
      description:
        "Get full details for a specific recipe including ingredients and step-by-step instructions.",
      inputSchema: z.object({
        recipeId: z.string().describe("The recipe ID from discover_recipes results"),
      }),
    },
    async ({ recipeId }) => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(getRecipeDetails({ recipeId })),
        },
      ],
    })
  );

  server.registerTool(
    "get_grocery_list",
    {
      title: "Get Grocery List",
      description:
        "Generate a consolidated grocery list from one or more recipes. Deduplicates and sorts alphabetically.",
      inputSchema: z.object({
        recipeIds: z
          .array(z.string())
          .describe("Array of recipe IDs to include in the grocery list"),
      }),
    },
    async ({ recipeIds }) => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(getGroceryList({ recipeIds })),
        },
      ],
    })
  );

  // ============================================================
  // RESOURCES — things Gateway CAN'T do
  // ============================================================

  // Static resource: full recipe catalog
  server.registerResource(
    "recipe-catalog",
    "recipes://catalog",
    {
      title: "Recipe Catalog",
      description: "Complete list of all available recipes with summaries",
      mimeType: "application/json",
    },
    async () => ({
      contents: [
        {
          uri: "recipes://catalog",
          mimeType: "application/json",
          text: JSON.stringify(
            recipes.map((r) => ({
              id: r.id,
              name: r.name,
              cuisine: r.cuisine,
              dietary: r.dietary,
              totalTimeMinutes: r.prepTimeMinutes + r.cookTimeMinutes,
              description: r.description,
            })),
            null,
            2
          ),
        },
      ],
    })
  );

  // Resource template: individual recipe by ID
  server.registerResource(
    "recipe",
    new ResourceTemplate("recipes://{recipeId}", {
      list: async () => ({
        resources: recipes.map((r) => ({
          uri: `recipes://${r.id}`,
          name: r.name,
          description: r.description,
          mimeType: "application/json",
        })),
      }),
    }),
    {
      title: "Recipe",
      description: "Full details for a specific recipe",
      mimeType: "application/json",
    },
    async (uri, { recipeId }) => {
      const recipe = recipes.find((r) => r.id === recipeId);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: recipe
              ? JSON.stringify(recipe, null, 2)
              : JSON.stringify({ error: `Recipe "${recipeId}" not found` }),
          },
        ],
      };
    }
  );

  // ============================================================
  // PROMPTS — things Gateway CAN'T do
  // ============================================================

  server.registerPrompt(
    "meal-planner",
    {
      title: "Meal Planner",
      description:
        "Generate a meal plan for a specified number of days based on cuisine and dietary preferences",
      argsSchema: z.object({
        days: z.string().describe("Number of days to plan for (e.g. '3', '5', '7')"),
        cuisine: z
          .string()
          .optional()
          .describe("Preferred cuisine type (e.g. italian, mixed)"),
        dietary: z
          .string()
          .optional()
          .describe("Dietary restrictions (e.g. vegetarian, gluten-free)"),
      }),
    },
    ({ days, cuisine, dietary }) => {
      let prompt = `Create a ${days}-day meal plan`;
      if (cuisine) prompt += ` focusing on ${cuisine} cuisine`;
      if (dietary) prompt += ` that is ${dietary}`;
      prompt += `.

Use the available recipe tools to:
1. First, discover recipes that match the criteria
2. Get details for the ones you select
3. Generate a consolidated grocery list for all selected recipes

Format the plan as:
- Day-by-day recipe assignments
- Brief description of each meal
- A single combined grocery list at the end`;

      return {
        messages: [
          {
            role: "user" as const,
            content: { type: "text" as const, text: prompt },
          },
        ],
      };
    }
  );

  server.registerPrompt(
    "recipe-suggestion",
    {
      title: "Recipe Suggestion",
      description: "Get a recipe suggestion based on available ingredients",
      argsSchema: z.object({
        ingredients: z
          .string()
          .describe("Comma-separated list of ingredients you have available"),
      }),
    },
    ({ ingredients }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `I have these ingredients available: ${ingredients}

Look through the recipe catalog and suggest which recipes I could make with these ingredients (or close to it). For each suggestion, explain what I'd still need to buy.

Use the discover_recipes tool to browse available options, then get_recipe_details to check ingredients.`,
          },
        },
      ],
    })
  );

  return server;
});

// ============================================================
// HTTP Server — AgentCore Runtime contract: 0.0.0.0:8000/mcp
// ============================================================

const nodeHandler = toNodeHandler(handler);

const server = createServer((req, res) => {
  // Health check endpoint (required by AgentCore Runtime)
  if (req.method === "GET" && req.url === "/ping") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "Healthy" }));
    return;
  }

  // MCP endpoint
  if (req.url === "/mcp") {
    void nodeHandler(req, res);
    return;
  }

  // 404 for everything else
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Recipe Picker MCP server listening on http://0.0.0.0:${PORT}/mcp`);
});
