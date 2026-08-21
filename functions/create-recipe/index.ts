import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { randomUUID } from "crypto";

const TABLE_NAME = process.env.TABLE_NAME!;
const EMBEDDING_MODEL_ID = process.env.EMBEDDING_MODEL_ID!;

const dynamodb = new DynamoDBClient();
const bedrock = new BedrockRuntimeClient();

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface RecipeInput {
  name: string;
  cuisine: string;
  dietary?: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  description: string;
  ingredients: Ingredient[];
  steps: string[];
}

function buildEmbeddingText(recipe: RecipeInput): string {
  const ingredientNames = recipe.ingredients.map((i) => i.name).join(", ");
  const dietaryInfo = recipe.dietary?.length ? `Dietary: ${recipe.dietary.join(", ")}.` : "";

  return [
    recipe.name,
    recipe.description,
    `Cuisine: ${recipe.cuisine}.`,
    dietaryInfo,
    `Ingredients: ${ingredientNames}.`,
    `Prep time: ${recipe.prepTimeMinutes} minutes. Cook time: ${recipe.cookTimeMinutes} minutes.`,
  ]
    .filter(Boolean)
    .join(" ");
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await bedrock.send(
    new InvokeModelCommand({
      modelId: EMBEDDING_MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({ inputText: text, dimensions: 1024, normalize: true }),
    })
  );
  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.embedding;
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: "Request body is required" }) };
    }

    const recipe: RecipeInput = JSON.parse(event.body);

    if (!recipe.name || !recipe.cuisine || !recipe.description || !recipe.ingredients || !recipe.steps) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields: name, cuisine, description, ingredients, steps" }) };
    }

    if ((recipe.prepTimeMinutes != null && (!Number.isInteger(recipe.prepTimeMinutes) || recipe.prepTimeMinutes < 0 || recipe.prepTimeMinutes > 10080)) ||
        (recipe.cookTimeMinutes != null && (!Number.isInteger(recipe.cookTimeMinutes) || recipe.cookTimeMinutes < 0 || recipe.cookTimeMinutes > 10080)) ||
        (recipe.servings != null && (!Number.isInteger(recipe.servings) || recipe.servings < 1 || recipe.servings > 1000))) {
      return { statusCode: 400, body: JSON.stringify({ error: "Numeric fields must be integers in range: prepTimeMinutes/cookTimeMinutes (0-10080), servings (1-1000)" }) };
    }

    const recipeId = randomUUID();

    // Generate embedding inline
    const embeddingText = buildEmbeddingText(recipe);
    const embedding = await generateEmbedding(embeddingText);

    await dynamodb.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: {
          recipeId: { S: recipeId },
          name: { S: recipe.name },
          cuisine: { S: recipe.cuisine },
          dietary: { L: (recipe.dietary ?? []).map((d) => ({ S: d })) },
          prepTimeMinutes: { N: String(recipe.prepTimeMinutes ?? 0) },
          cookTimeMinutes: { N: String(recipe.cookTimeMinutes ?? 0) },
          servings: { N: String(recipe.servings ?? 1) },
          description: { S: recipe.description },
          ingredients: {
            L: recipe.ingredients.map((i) => ({
              M: { name: { S: i.name }, amount: { S: i.amount }, unit: { S: i.unit } },
            })),
          },
          steps: { L: recipe.steps.map((s) => ({ S: s })) },
          embedding: { L: embedding.map((v) => ({ N: String(v) })) },
        },
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify({ recipeId, message: "Recipe created" }),
    };
  } catch (error: any) {
    console.error("Error creating recipe:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
