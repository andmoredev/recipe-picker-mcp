import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const TABLE_NAME = process.env.TABLE_NAME!;
const dynamodb = new DynamoDBClient();

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const recipeId = event.pathParameters?.recipeId;

    if (!recipeId) {
      return { statusCode: 400, body: JSON.stringify({ error: "recipeId is required" }) };
    }

    await dynamodb.send(
      new DeleteItemCommand({
        TableName: TABLE_NAME,
        Key: { recipeId: { S: recipeId } },
        ConditionExpression: "attribute_exists(recipeId)",
      })
    );

    return { statusCode: 200, body: JSON.stringify({ message: "Recipe deleted" }) };
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      return { statusCode: 404, body: JSON.stringify({ error: "Recipe not found" }) };
    }
    console.error("Error deleting recipe:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
