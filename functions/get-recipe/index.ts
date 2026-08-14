import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const TABLE_NAME = process.env.TABLE_NAME!;
const dynamodb = new DynamoDBClient();

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const recipeId = event.pathParameters?.recipeId;

    if (!recipeId) {
      return { statusCode: 400, body: JSON.stringify({ error: "recipeId is required" }) };
    }

    const result = await dynamodb.send(
      new GetItemCommand({
        TableName: TABLE_NAME,
        Key: { recipeId: { S: recipeId } },
      })
    );

    if (!result.Item) {
      return { statusCode: 404, body: JSON.stringify({ error: "Recipe not found" }) };
    }

    const recipe = unmarshall(result.Item);
    // Remove the embedding from the response — it's internal
    delete recipe.embedding;

    return { statusCode: 200, body: JSON.stringify(recipe) };
  } catch (error: any) {
    console.error("Error getting recipe:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
