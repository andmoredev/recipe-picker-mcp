# Part 1 Video Script — Draft Outline

**Working title:** "The Fastest Way to Get an MCP Server Running on AWS"

---

## Flow

```
Intro & What We're Building
        ↓
Architecture Diagram
        ↓
Build the Tools (pure functions)
        ↓
Test Tools Locally (npm test)
        ↓
Wire Tools to Lambda Handler
        ↓
Create SAM Template (Lambda + Gateway)
        ↓
Deploy (sam build && sam deploy)
        ↓
Test with MCP Inspector
        ↓
Connect to ChatGPT (live demo)
        ↓
Recap & What's Next (Part 2 tease)
```

---

## Section Breakdown

### 1. Intro & Hook (30-60 sec)

**What to say:**
- "What's the fastest way to get an MCP server running on AWS?"
- "By the end of this video, you'll have a working MCP server that ChatGPT can talk to. Zero MCP protocol code."
- Quick flash of the end result (ChatGPT using the recipe tools)

**Tone:** Confident, no fluff. Show the end result first, then explain how we got there.

---

### 2. What is MCP + Architecture Diagram (2-3 min)

**What to explain:**
- MCP in one sentence: "A protocol that lets AI apps discover and call your tools"
- The problem: "You have tools/APIs. You want ChatGPT, Claude, or your own agents to use them. MCP is the standard way."
- What AgentCore Gateway does: "You describe your tools. AWS handles the MCP protocol. You never write a JSON-RPC handler."

**Diagram to show:**
```
┌─────────────┐
│  ChatGPT /  │
│  Claude     │
└──────┬──────┘
       │ MCP (Streamable HTTP)
       │
┌──────▼──────┐
│  AgentCore  │  ← Handles the MCP protocol
│  Gateway    │  ← Tool discovery, invocation, response formatting
└──────┬──────┘
       │ invoke
       │
┌──────▼──────┐
│   Lambda    │  ← Your code lives here
│  (tools)    │  ← Pure business logic
└─────────────┘
```

**Key point:** "You write the tools. Gateway does everything else."

---

### 3. Build the Tools (5-7 min)

**What to show:**
- Create `src/data/recipes.ts` — explain it's our "database" (static for now, could be DynamoDB later)
- Create `src/tools/discover-recipes.ts` — walk through the pure function
- Create `src/tools/get-recipe-details.ts`
- Create `src/tools/get-grocery-list.ts`

**Key callouts:**
- "Notice — no imports from AWS SDK, no MCP SDK, no Lambda types. These are just functions."
- "This is intentional. These tools don't know or care how they're being served."
- "This means we can test them without deploying anything."

---

### 4. Test Tools Locally (1-2 min)

**What to show:**
- Run `npm test`
- All 18 assertions pass
- Maybe show one failing test to demonstrate it catches errors (optional)

**What to say:**
- "Before I touch AWS, before I deploy anything — I know these work."
- "This is the payoff of keeping tools as pure functions."

---

### 5. Wire Tools to Lambda Handler (2-3 min)

**What to show:**
- Create `src/handler.ts`
- Explain the Gateway contract: event = tool inputs, tool name in context
- Show the `___` delimiter and prefix stripping
- The switch statement dispatching to each tool

**Key callouts:**
- "Gateway sends your Lambda the tool arguments as a flat object. Dead simple."
- "The tool name has a prefix — the target name. You strip it and route to the right function."
- "This is the only file that knows about Lambda. Everything else is portable."

---

### 6. Create SAM Template (3-4 min)

**What to show:**
- Walk through `template.yaml` section by section:
  1. Lambda function (esbuild, arm64, ESM)
  2. IAM role (Gateway → Lambda invoke permission)
  3. Gateway resource (name, auth type, protocol versions)
  4. GatewayTarget with inline tool schemas

**Key callouts:**
- "Everything in one file. One deploy creates the whole stack."
- "The tool schemas here are what MCP clients see — the names, descriptions, and input shapes."
- "AuthorizerType NONE for this demo. In production you'd use JWT or IAM."
- "We add all three protocol versions because ChatGPT uses the newest one."

---

### 7. Deploy (1-2 min)

**What to show:**
- `sam build` — show the single bundled .mjs file (7KB)
- `sam deploy --guided` (or just `sam deploy` if samconfig exists)
- Stack outputs: Gateway URL

**What to say:**
- "Build bundles everything into one file. Deploy creates the Lambda, the Gateway, the IAM role, and the target with the tool schemas. One command."

---

### 8. Test with MCP Inspector (2-3 min)

**What to show:**
- `npx @modelcontextprotocol/inspector`
- Connect to Gateway URL (Streamable HTTP transport)
- Browse the 3 tools — show the schemas match what we defined
- Call `discover_recipes` with cuisine=italian — show the result
- Call `get_grocery_list` with multiple recipe IDs — show the aggregated list

**What to say:**
- "MCP Inspector is like Postman for MCP. It connects to any MCP server and lets you poke around."
- "There are our tools. Let me call one… and there's our recipe data coming back through the full stack."

---

### 9. Connect to ChatGPT (2-3 min)

**What to show:**
- ChatGPT → Settings → Connections → Add MCP Server
- Paste the Gateway URL
- Start a conversation: "What Italian recipes do you have?"
- ChatGPT calls `discover_recipes`, shows results
- "Tell me more about the carbonara" → calls `get_recipe_details`
- "Make me a grocery list for carbonara and pizza" → calls `get_grocery_list`

**What to say:**
- "That's it. ChatGPT is now using our tools. No plugins, no custom GPTs — just MCP."
- "This works in Claude Desktop too — same URL, same tools."

---

### 10. Recap & Part 2 Tease (1-2 min)

**What to recap:**
- What we built: 3 tools → Lambda → AgentCore Gateway → MCP server
- What Gateway gave us for free: protocol handling, tool discovery, SSE transport
- Total code: ~200 lines of TypeScript, zero MCP protocol code

**Part 2 tease:**
- "But what if you want more? What if you want your server to expose prompts — template recipes. Or resources — a saved favorites list. Gateway doesn't do that. It only does tools."
- "In Part 2, we take the same tool logic and run our own MCP server on AgentCore Runtime. Full protocol control. Same tools, new superpowers."

---

## Estimated Total Runtime: 20-25 minutes

---

## Short-Form Content Ideas (reference back to long-form)

1. "MCP Server on AWS in 60 seconds" — speed run of deploy + ChatGPT connection
2. "The architecture trick that makes your MCP tools portable" — pure functions, no framework coupling
3. "ChatGPT + AWS Lambda — how it actually works" — the Gateway invocation flow
4. "This error breaks ChatGPT MCP connections" — the protocol version fix
5. "Test MCP servers without deploying" — MCP Inspector demo
