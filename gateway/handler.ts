/**
 * Lambda handler for AgentCore Gateway tool invocations.
 *
 * Gateway sends us:
 *   event: the tool's input properties (flat object matching inputSchema)
 *   context.clientContext.custom.bedrockAgentCoreToolName: "targetName___toolName"
 *
 * We strip the target prefix, dispatch to the right tool function, and return JSON.
 */

import type { Context } from "aws-lambda";
import { discoverRecipes } from "../tools/discover-recipes.js";
import { getRecipeDetails } from "../tools/get-recipe-details.js";
import { getGroceryList } from "../tools/get-grocery-list.js";

// The delimiter Gateway uses between target name and tool name
const TOOL_NAME_DELIMITER = "___";

/**
 * Extract the tool name from the Gateway context.
 * Format: "targetName___toolName" → we want just "toolName"
 */
function extractToolName(context: Context): string {
  const custom = (context as any).clientContext?.custom;
  const fullToolName: string = custom?.bedrockAgentCoreToolName ?? "";

  const delimiterIndex = fullToolName.indexOf(TOOL_NAME_DELIMITER);
  if (delimiterIndex === -1) {
    // No prefix found — use the full name as-is (useful for local testing)
    return fullToolName;
  }

  return fullToolName.substring(delimiterIndex + TOOL_NAME_DELIMITER.length);
}

export async function handler(event: Record<string, unknown>, context: Context) {
  const toolName = extractToolName(context);

  switch (toolName) {
    case "discover_recipes":
      return discoverRecipes({
        cuisine: event.cuisine as string | undefined,
        dietary: event.dietary as string | undefined,
        maxResults: event.maxResults as number | undefined,
      });

    case "get_recipe_details":
      return getRecipeDetails({
        recipeId: event.recipeId as string,
      });

    case "get_grocery_list":
      return getGroceryList({
        recipeIds: event.recipeIds as string[],
      });

    default:
      return {
        error: `Unknown tool: "${toolName}". Available tools: discover_recipes, get_recipe_details, get_grocery_list`,
      };
  }
}
