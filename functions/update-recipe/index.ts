import { DynamoDBClient, PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

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
    const recipeId = event.pathParameters?.recipeId;

    if (!recipeId) {
      return { statusCode: 400, body: JSON.stringify({ error: "recipeId is required" }) };
    }

    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: "Request body is required" }) };
    }

    // Verify recipe exists
    const existing = await dynamodb.send(
      new GetItemCommand({ TableName: TABLE_NAME, Key: { recipeId: { S: recipeId } } })
    );

    if (!existing.Item) {
      return { statusCode: 404, body: JSON.stringify({ error: "Recipe not found" }) };
    }

    const recipe: RecipeInput = JSON.parse(event.body);

    if (!recipe.name || !recipe.cuisine || !recipe.description || !recipe.ingredients || !recipe.steps) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields: name, cuisine, description, ingredients, steps" }) };
    }

    if ((recipe.prepTimeMinutes != null && (recipe.prepTimeMinutes < 0 || recipe.prepTimeMinutes > 10080)) ||
        (recipe.cookTimeMinutes != null && (recipe.cookTimeMinutes < 0 || recipe.cookTimeMinutes > 10080)) ||
        (recipe.servings != null && (recipe.servings < 1 || recipe.servings > 1000))) {
      return { statusCode: 400, body: JSON.stringify({ error: "Numeric fields out of range: prepTimeMinutes/cookTimeMinutes (0-10080), servings (1-1000)" }) };
    }

    // Regenerate embedding with updated content
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
      statusCode: 200,
      body: JSON.stringify({ recipeId, message: "Recipe updated" }),
    };
  } catch (error: any) {
    console.error("Error updating recipe:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
