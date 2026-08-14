/**
 * Deploy script:
 * 1. sam build && sam deploy
 * 2. Post-deploy: ensure vector index exists on the CF-managed table
 *
 * Run: AWS_PROFILE=andmore-sandbox npx tsx scripts/deploy.ts
 */

import {
  DynamoDBClient,
  UpdateTableCommand,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import { execSync } from "child_process";

const REGION = "us-east-1";
const STACK_NAME = "recipe-embedding-pipeline";
const VECTOR_INDEX_NAME = "RecipeEmbeddingIndex";
const VECTOR_DIMENSIONS = 1024;

const dynamodb = new DynamoDBClient({ region: REGION });
const cfn = new CloudFormationClient({ region: REGION });

async function main() {
  console.log("🚀 Recipe API - Deploy\n");

  // Step 1: SAM build & deploy
  console.log("[1/2] Running SAM build & deploy...\n");
  execSync("sam build", { stdio: "inherit" });
  try {
    execSync("sam deploy --no-confirm-changeset", { stdio: "inherit" });
  } catch (err: any) {
    // "No changes to deploy" exits non-zero but is fine
    if (err.stdout?.toString().includes("No changes to deploy") ||
        err.stderr?.toString().includes("No changes to deploy") ||
        err.message?.includes("No changes to deploy")) {
      console.log("\n  ℹ️  No infrastructure changes to deploy (stack is up to date)");
    } else {
      throw err;
    }
  }

  // Step 2: Ensure vector index on the CF-managed table
  console.log("\n[2/2] Ensuring vector index on CF-managed table...");
  const tableName = await getCfManagedTableName();
  console.log(`  Table: ${tableName}`);
  await ensureVectorIndex(tableName);

  console.log("\n✅ Deployment complete!");

  // Print the API URL
  const apiUrl = await getStackOutput("ApiUrl");
  console.log(`\n  API: ${apiUrl}`);
  console.log(`  Table: ${tableName}`);
}

async function getCfManagedTableName(): Promise<string> {
  const response = await cfn.send(
    new DescribeStacksCommand({ StackName: STACK_NAME })
  );
  const outputs = response.Stacks?.[0]?.Outputs ?? [];
  const output = outputs.find((o) => o.OutputKey === "RecipesTableName");
  if (!output?.OutputValue) {
    throw new Error("Could not find RecipesTableName in stack outputs");
  }
  return output.OutputValue;
}

async function getStackOutput(key: string): Promise<string> {
  const response = await cfn.send(
    new DescribeStacksCommand({ StackName: STACK_NAME })
  );
  const outputs = response.Stacks?.[0]?.Outputs ?? [];
  const output = outputs.find((o) => o.OutputKey === key);
  return output?.OutputValue ?? "unknown";
}

async function ensureVectorIndex(tableName: string) {
  const desc = await dynamodb.send(new DescribeTableCommand({ TableName: tableName }));
  const table = desc.Table as any;
  const vectorIndexes = table?.VectorIndexes ?? [];

  const existing = vectorIndexes.find((idx: any) => idx.IndexName === VECTOR_INDEX_NAME);
  if (existing) {
    console.log(`  ✓ Vector index "${VECTOR_INDEX_NAME}" exists (status: ${existing.IndexStatus})`);
    return;
  }

  console.log(`  Creating vector index "${VECTOR_INDEX_NAME}"...`);
  await dynamodb.send(
    new UpdateTableCommand({
      TableName: tableName,
      AttributeDefinitions: [
        { AttributeName: "cuisine", AttributeType: "S" },
      ],
      VectorIndexUpdates: [
        {
          Create: {
            IndexName: VECTOR_INDEX_NAME,
            VectorAttribute: { AttributeName: "embedding" },
            SearchSchema: [
              { AttributeName: "cuisine", SearchSchemaElementType: "INLINE_FILTER" },
            ],
            Projection: { ProjectionType: "ALL" },
            Dimensions: VECTOR_DIMENSIONS,
            DistanceFunction: "COSINE",
          },
        },
      ],
    })
  );

  // Wait for table to become active
  let status = "";
  while (status !== "ACTIVE") {
    const check = await dynamodb.send(new DescribeTableCommand({ TableName: tableName }));
    status = check.Table?.TableStatus ?? "";
    if (status !== "ACTIVE") {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.log(`  ✓ Vector index created`);
}

main().catch((err) => {
  console.error("\n❌ Deploy failed:", err.message ?? err);
  process.exit(1);
});
