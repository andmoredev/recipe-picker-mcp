# Part 1: Build, Test, Deploy

Step-by-step workflow — test locally first, then deploy, then verify through the Gateway.

## Prerequisites

- Node.js 22+ (`node -v`)
- AWS CLI v2, configured with credentials (`aws sts get-caller-identity`)
- SAM CLI (`sam --version`)

## Step 1: Install dependencies

```bash
npm install
```

## Step 2: Test tool logic locally

Before deploying anything, verify the tools work. Since our tools are pure
functions (no AWS dependencies), we can test them directly.

Run the test script:
```bash
npm test
```

This calls each tool with sample inputs and shows the output. No deploy, no
Docker, no AWS credentials needed. If this passes, the logic is correct.

You can also test individual tools interactively:
```bash
npx tsx -e "
import { discoverRecipes } from './src/tools/discover-recipes.js';
console.log(JSON.stringify(discoverRecipes({ cuisine: 'italian' }), null, 2));
"
```

> **Why test locally first?** Because our tools are pure functions decoupled
> from the Lambda handler, we can verify the logic without spinning up any
> infrastructure. This is the payoff of keeping tool logic separate from
> transport.

## Step 3: Build

```bash
sam build
```

This uses esbuild to bundle the TypeScript into a single minified `.mjs` file
ready for Lambda.

## Step 4: Deploy

```bash
# First time — interactive guided setup
sam deploy --guided
```

On first deploy, `--guided` will ask:
- **Stack name**: `recipe-picker-mcp` (or whatever you prefer)
- **Region**: pick your preferred region (e.g. `us-east-1`)
- **Confirm changes**: Yes
- **Allow SAM CLI IAM role creation**: Yes
- **Save arguments to samconfig.toml**: Yes

After first deploy, subsequent deploys are just:
```bash
sam build && sam deploy
```

## Step 5: Get your MCP server URL

After deployment, the Gateway URL is in the stack outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name recipe-picker-mcp \
  --query 'Stacks[0].Outputs[?OutputKey==`GatewayUrl`].OutputValue' \
  --output text
```

The URL looks like: `https://<gateway-id>.gateway.bedrock-agentcore.<region>.amazonaws.com/mcp`

## Step 6: Test with MCP Inspector

Now that it's deployed, verify the full stack works — Lambda, Gateway, tool
schemas, everything — using MCP Inspector.

**Web UI (best for demos/video):**
```bash
npx @modelcontextprotocol/inspector
```
Then in the browser:
1. Switch transport type to **Streamable HTTP**
2. Paste your Gateway URL
3. Click **Connect**
4. Browse tools, fill in arguments, call them interactively
5. Check the raw JSON-RPC messages to see the protocol in action

**CLI (quick verification):**
```bash
# List tools
npx @modelcontextprotocol/inspector --cli \
  "https://<your-gateway-url>/mcp" \
  --method tools/list

# Call a tool
npx @modelcontextprotocol/inspector --cli \
  "https://<your-gateway-url>/mcp" \
  --method tools/call \
  --tool-name "RecipeTools___discover_recipes" \
  --tool-args-json '{"cuisine":"italian"}'
```

> **What to look for:** All 3 tools listed with correct schemas. Tool calls
> return proper JSON results wrapped in MCP content format. No errors.

## Step 7: Connect from Claude Desktop or ChatGPT

### Claude Desktop

Add to your config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "recipe-picker": {
      "url": "https://<your-gateway-url>/mcp"
    }
  }
}
```

Restart Claude Desktop. You should see the recipe tools available.

### ChatGPT

1. Go to ChatGPT → Settings → Connections → MCP Servers
2. Add server URL: `https://<your-gateway-url>/mcp`
3. The tools should appear in your chat

## Tear down

```bash
sam delete --stack-name recipe-picker-mcp
```
