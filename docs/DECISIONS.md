# Decision Log

Every decision made during this build — why we chose it, what we rejected, and what it means for the viewer. This feeds directly into video script generation.

---

## Format

Each entry follows:

```
### DEC-NNN: <Short title>
**Date:** YYYY-MM-DD
**Context:** What problem or question we faced
**Decision:** What we chose
**Alternatives considered:** What else was on the table
**Why:** The reasoning
**Impact:** What this means going forward
**Video note:** How to explain this on camera
```

---

## Decisions

### DEC-001: Progressive series structure
**Date:** 2025-08-04  
**Context:** We want to teach MCP servers on AWS incrementally — starting simple and adding complexity only when the simpler approach hits a wall.  
**Decision:** Two-part series:
- Part 1: MCP server via AgentCore Gateway → use from ChatGPT/Claude Desktop
- Part 2: MCP App on AgentCore Runtime → full server control, bidirectional streaming

**Alternatives considered:**
- Single monolithic tutorial (too much for one video, viewer drops off)
- Start with Runtime directly (skips the "easy path" narrative)

**Why:** Starting with Gateway shows the fastest path to value. When we hit its limitation (no MCP App support, only tool hosting), that creates a natural "but what if we need more?" hook for Part 2. The core tool logic stays the same across both parts — we just swap the transport/hosting layer.  
**Impact:** We architect the tool logic to be independent of the hosting mechanism from day one.  
**Video note:** Open Part 1 with "What's the fastest way to get an MCP server running on AWS?" — show it working in ChatGPT in the first 2 minutes, then explain how we got there.

---

### DEC-002: Recipe Picker as the demo domain
**Date:** 2025-08-04  
**Context:** Need a demo app that is relatable, has clear tool boundaries, and doesn't require complex external dependencies.  
**Decision:** Recipe picker — tools like `discover-recipes`, `get-recipe-details`, `get-grocery-list`. Simple input/output, easy for viewers to understand what the MCP tools do.  
**Alternatives considered:**
- Todo app (overdone, boring)
- Weather app (needs external API key, adds setup friction)
- Code review tool (too meta for an intro)

**Why:** Everyone cooks. The tools have clear names. The data can be static/hardcoded initially (no database needed for Part 1). It's visual enough for thumbnails.  
**Impact:** Static recipe data in Part 1. Could evolve to DynamoDB or API-backed in a future part.  
**Video note:** "We're building a recipe picker — but the recipe is just the excuse. The real thing you're learning is how to deploy MCP tools to AWS."

---

### DEC-003: TypeScript as implementation language
**Date:** 2025-08-04  
**Context:** Need to pick a language for the MCP server.  
**Decision:** TypeScript (Node.js runtime).  
**Alternatives considered:**
- Python (good MCP SDK support, but less natural for the MCP protocol's JSON-RPC nature)
- Rust (overkill for a demo, higher barrier to entry for viewers)

**Why:** The official MCP TypeScript SDK is mature. Most web developers are familiar with TS. AgentCore Gateway and Runtime both support Node.js. It's what the previous version of this project used, so we have familiarity.  
**Impact:** Node.js 22+ for native TypeScript execution (type stripping). No build step for the server during development.  
**Video note:** "TypeScript because the MCP SDK is great and you probably already know it. If you're a Python person, the concepts transfer — it's the same protocol."

---

### DEC-004: Tool logic separate from transport
**Date:** 2025-08-04  
**Context:** Part 1 uses AgentCore Gateway (which handles the MCP protocol for us). Part 2 uses AgentCore Runtime (where we run our own MCP server). We need the tool implementations to work in both.  
**Decision:** Tool logic lives in a standalone module with pure functions. The hosting layer (Gateway config or Runtime MCP server) imports and wraps them.  
**Alternatives considered:**
- Coupling tools directly to the MCP SDK from day one (would require rewrite for Gateway)
- Using Gateway's Lambda-based tool definitions (locks us into Gateway patterns)

**Why:** Gateway just needs to know the tool schema and call a function. Runtime needs the same function wrapped in the MCP SDK's server. If the core logic is independent, we literally copy it from Part 1 to Part 2 and just wire up new transport.  
**Impact:** The project structure has a clear `tools/` directory that both hosting approaches import from.  
**Video note:** "Notice I'm not importing anything from the MCP SDK in my tool logic. That's intentional — these tools don't know or care how they're being served."

---

### DEC-005: Start with AgentCore Gateway (Part 1)
**Date:** 2025-08-04  
**Context:** AgentCore Gateway is the simplest way to expose tools as an MCP server — you define tool schemas, point to a Lambda or HTTP endpoint, and Gateway handles the MCP protocol negotiation, SSE transport, and tool dispatch.  
**Decision:** Part 1 deploys tools via AgentCore Gateway. The viewer gets an MCP-compatible endpoint they can plug into ChatGPT or Claude Desktop.  
**Alternatives considered:**
- Skip directly to Runtime (misses the "start simple" narrative)

**Why:** Gateway is zero MCP protocol code. You don't write a server — you describe tools and let AWS handle the rest. That's the ideal starting point for someone who just wants their API callable from an LLM client.  
**Impact:** Part 1 has no MCP SDK dependency. Just tool implementations + Gateway API definition + infra (SAM/CDK).  
**Video note:** "Zero MCP protocol code. We describe our tools, deploy, and it just works. But… what if you want to build an MCP App — a client that connects to your server and does agent workflows? That's where Gateway stops and Runtime begins."

---

### DEC-006: Why move to AgentCore Runtime (Part 2 hook)
**Date:** 2025-08-04  
**Context:** AgentCore Gateway is great for exposing tools, but it doesn't support the full MCP spec — specifically, it doesn't support MCP Apps (clients that maintain sessions, do multi-turn tool use, or use resources/prompts). It's tool-hosting only.  
**Decision:** Part 2 motivates Runtime by showing what Gateway can't do: full MCP server with resources, prompts, streaming, and bidirectional communication. Runtime gives you a container running your own MCP server with full protocol control.  
**Alternatives considered:**
- Just say "Runtime gives more control" (too vague, viewers won't feel the pain)

**Why:** The viewer needs to feel the limitation. "I tried to do X with Gateway and it couldn't" is the best teacher.  
**Impact:** Part 2 reuses the tool logic from Part 1, adds MCP SDK, adds resources/prompts, deploys to Runtime.  
**Video note:** "Gateway gave us tools for free. But I want my server to expose prompts — template recipes. I want resources — a saved favorites list. Gateway doesn't do that. Time to run our own MCP server."

---

### DEC-007: Clean slate approach
**Date:** 2025-08-04  
**Context:** The repo had a previous implementation that was too complex — multi-package monorepo, Dockerfile, CloudFormation, MCP App widget, auth scripts. It was hard to understand.  
**Decision:** Nuke everything and rebuild from scratch, one piece at a time, documenting every step.  
**Alternatives considered:**
- Refactor existing code (too much baggage, viewer would be confused by leftover patterns)

**Why:** For a teaching series, the viewer needs to see each piece being added and understand why. Starting from zero makes that possible. It also means we only add complexity when we need it.  
**Impact:** This repo is now empty except for .gitignore and this docs/ folder. We build up from here.  
**Video note:** "I deleted everything. If you're watching this, you're seeing the whole thing built from the ground up. No magic, no 'I prepared this earlier.'"

---

### DEC-008: SAM for infrastructure
**Date:** 2025-08-04  
**Context:** Need to deploy Lambda functions and AgentCore Gateway configuration. Need an IaC tool.  
**Decision:** AWS SAM (Serverless Application Model).  
**Alternatives considered:**
- CDK (more powerful, but more abstraction — harder to explain on camera what's actually happening)
- Raw CloudFormation (too verbose for a demo)
- Terraform (not AWS-native, adds a dependency)

**Why:** SAM is the sweet spot for serverless demos — it's declarative, the template is readable, and `sam deploy` is a single command. Viewers can see exactly what resources are being created without layers of constructs.  
**Impact:** `template.yaml` at the root for infra. `sam build && sam deploy` is the deploy workflow.  
**Video note:** "SAM because the template reads like a blueprint — you can see every resource. No magic classes hiding what's happening."

---

### DEC-009: All-in-one SAM template (Lambda + Gateway + Target)
**Date:** 2025-08-04  
**Context:** AgentCore Gateway DOES have CloudFormation resource types: `AWS::BedrockAgentCore::Gateway` and `AWS::BedrockAgentCore::GatewayTarget`. This means we can define everything — Lambda, IAM roles, Gateway, and tool schemas — in a single SAM template.  
**Decision:** Single `template.yaml` that deploys everything. One `sam deploy` command creates the Lambda, the Gateway, and wires them together with the tool schema defined inline.  
**Alternatives considered:**
- agentcore CLI (adds a tool dependency, opinionated CDK under the hood, less transparent)
- Two-step deploy with separate SAM + agentcore (unnecessary complexity now that CFN supports it)
- Boto3 scripts (fragile, harder to reproduce)

**Why:** One template = one deploy command = maximum transparency. The viewer can read the template and see exactly what's being created. No hidden CDK constructs, no extra CLI tools to install. SAM's `sam deploy --guided` is familiar to any AWS serverless developer.  
**Impact:** `template.yaml` defines: IAM role for Gateway, Lambda function, Gateway resource, GatewayTarget resource with inline tool schemas. Deploy with `sam build && sam deploy`.  
**Video note:** "Everything in one file. One deploy command. You can read this template top to bottom and know exactly what AWS is creating for you. No magic."

---

### DEC-010: Lambda event contract from Gateway
**Date:** 2025-08-04  
**Context:** Needed to understand exactly what Gateway sends to our Lambda when a tool is invoked.  
**Decision:** The event is simply the input properties (flat object matching the tool's inputSchema). The tool name comes from `context.clientContext.custom.bedrockAgentCoreToolName` in format `targetName___toolName`. Our handler strips the prefix and dispatches.  
**Alternatives considered:** N/A — this is the documented contract.  
**Why:** Understanding this contract is critical — it determines our Lambda handler's signature.  
**Impact:** Our handler needs to: 1) extract tool name from context, 2) strip the target prefix, 3) route to the correct tool function, 4) return JSON.  
**Video note:** "The event your Lambda gets is dead simple — just the arguments. The tool name? It's hiding in the context object with a prefix you need to strip. Let me show you."

---

### DEC-011: Local testing strategy
**Date:** 2025-08-04  
**Context:** `sam local invoke` can't simulate AgentCore Gateway because it doesn't pass `clientContext.custom.bedrockAgentCoreToolName`. We need another way to test locally.  
**Decision:** Test tool logic directly with `npx tsx` since tools are pure functions. The handler routing can only be fully tested after deployment (or with a manual event payload).  
**Alternatives considered:**
- Mock the context object in sam local invoke (fragile, requires base64 encoding clientContext)
- Write unit tests with a test runner (good idea for Part 2, overkill for 3 simple functions now)

**Why:** The tool/transport separation (DEC-004) pays off here — since tools are pure functions, we can import and call them directly without any AWS infrastructure. This is also great for video: "Look, I can test these without deploying anything."  
**Impact:** Testing is instant — no Docker, no SAM runtime simulation needed.  
**Video note:** "Because we kept our tools as pure functions, I can test them right here in my terminal. No deploy needed. This is why the architecture matters."

---

### DEC-012: Part 1 deployment verified
**Date:** 2025-08-04  
**Context:** Deployed to us-east-1 and verified all 3 tools work through the Gateway.  
**Decision:** Gateway URL: `https://recipe-picker-bah4kuvity.gateway.bedrock-agentcore.us-east-1.amazonaws.com/mcp`  
**Verification:**
- `tools/list` returns all 3 tools with correct schemas
- `tools/call` for `discover_recipes` (cuisine=mexican) → returns Tacos al Pastor
- `tools/call` for `get_recipe_details` (recipeId=tacos-al-pastor) → returns full recipe with 8 ingredients, 6 steps
- `tools/call` for `get_grocery_list` (recipeIds=[tacos-al-pastor, veggie-stir-fry]) → returns 17 deduplicated items

**Observations:**
- Gateway wraps tool results in MCP `content` array with `type: "text"` and stringified JSON
- Tool names are prefixed with `RecipeTools___` (the target name)
- No auth needed (AuthorizerType: NONE) — curl works directly
- Response times are fast (Lambda cold start + tool execution)

**Video note:** "Deploy done. Let me show you it works — I'll curl the MCP endpoint directly. See? Three tools, correct schemas. Now let me call one… boom, real data back. This is a working MCP server on AWS."

---

### DEC-013: MCP Inspector for visual testing
**Date:** 2025-08-04  
**Context:** Need a visual way to test and demonstrate the MCP server — curl works but isn't camera-friendly. Sunpeak is for MCP Apps (client-side widgets), not bare MCP servers.  
**Decision:** Use MCP Inspector (`@modelcontextprotocol/inspector`) — the official MCP debugging tool from the MCP project. Supports web UI, CLI, and TUI modes. Connects directly to our Gateway URL over Streamable HTTP.  
**Alternatives considered:**
- Sunpeak (designed for MCP App testing with rendered widgets — overkill and wrong use case for Part 1)
- Claude Desktop only (works but less visual control, can't see raw messages)
- Custom test script (works but not visual)

**Why:** MCP Inspector is purpose-built for this exact scenario. The web UI is perfect for video — you can visually browse tools, fill in params, call them, and see raw JSON-RPC traffic. The CLI mode is great for quick verification in terminal demos.  
**Impact:** Zero config needed — just `npx @modelcontextprotocol/inspector`, switch to Streamable HTTP transport, paste the URL.  
**Video note:** "MCP Inspector is the official testing tool for MCP servers. Think of it like Postman but for MCP. Let me connect to our Gateway… there are our three tools. I can click one, fill in the cuisine, hit call… and there's the result. You can also see the raw JSON-RPC if you want to understand what's happening under the hood."

---

### DEC-014: Two-phase testing workflow
**Date:** 2025-08-04  
**Context:** Need a clear testing story for the video — viewers should see tests pass before any deployment happens, then verify the full stack after deployment.  
**Decision:** Two testing phases:
1. **Pre-deploy:** `npm test` runs tool logic locally (18 assertions, no AWS needed)
2. **Post-deploy:** MCP Inspector verifies the full stack (Gateway → Lambda → tools → response)

**Alternatives considered:**
- Vitest/Jest (heavier setup, more dependencies, overkill for 3 pure functions)
- Only test post-deploy (loses the "test without deploying" story)

**Why:** The pre-deploy tests prove the architecture decision (DEC-004) pays off — pure functions mean instant local testing. The MCP Inspector phase then proves the full integration works. Two clear moments on camera: "watch all tests pass locally" then "watch the same tools work through the MCP protocol in the cloud."  
**Impact:** `npm test` uses `tsx` to run a simple assertion script. No test framework dependency. MCP Inspector runs via `npx` (no install needed).  
**Video note:** "Before I deploy anything — let me prove this works. `npm test`… 18 tests, all green. Now let me deploy and prove it works through the MCP protocol too. MCP Inspector, connect, call the tool… same result. Local logic → cloud endpoint, same code."

---

### DEC-015: Explicit MCP protocol versions (2026-07-28 for ChatGPT)
**Date:** 2025-08-04  
**Context:** ChatGPT returned error `-32022: no mutually supported protocol version`. ChatGPT uses the newest MCP spec `2026-07-28` (stateless, no initialize handshake). AgentCore Gateway defaults to only `2025-03-26` and `2025-11-25`.  
**Decision:** Explicitly set `ProtocolConfiguration.Mcp.SupportedVersions` to include all three versions: `2025-03-26`, `2025-11-25`, `2026-07-28`. This ensures compatibility with all current MCP clients.  
**Alternatives considered:**
- Only support latest (would break older clients like some Claude Desktop versions)
- Leave as default (ChatGPT won't connect)

**Why:** Different MCP clients use different protocol versions. ChatGPT uses `2026-07-28`, Claude Desktop may use `2025-11-25`. Supporting all three ensures maximum compatibility. The `2026-07-28` spec is simpler (stateless, no session) which aligns with our serverless architecture anyway.  
**Impact:** Added `ProtocolConfiguration` block to SAM template. Fixed immediately via `update-gateway` CLI call.  
**Video note:** "If you get a 'no mutually supported protocol version' error from ChatGPT, it's because ChatGPT uses the newest MCP spec and Gateway defaults to older ones. One line in the template fixes it — add 2026-07-28 to supported versions."
