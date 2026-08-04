# MCP Recipe Picker

A progressive demo series showing how to build and deploy MCP servers on AWS — from zero to production.

## The Series

### Part 1: MCP Server via AgentCore Gateway
The fastest path to an MCP server on AWS. Define your tools, deploy, and use them from ChatGPT or Claude Desktop. Zero MCP protocol code.

**What you'll learn:**
- What MCP tools are and how to define them
- How AgentCore Gateway handles the MCP protocol for you
- Deploying with SAM/CDK
- Connecting from ChatGPT and Claude Desktop

### Part 2: Full MCP Server on AgentCore Runtime
When Gateway isn't enough — you need resources, prompts, streaming, or full protocol control. Same tool logic, new hosting layer.

**What you'll learn:**
- Why Gateway's tool-only model has limits
- Running your own MCP server on AgentCore Runtime
- Adding resources and prompts to your server
- The MCP TypeScript SDK in practice

## Architecture

```
Part 1:                          Part 2:
┌─────────────┐                  ┌─────────────┐
│ ChatGPT /   │                  │  MCP Client │
│ Claude      │                  │  (App)      │
└──────┬──────┘                  └──────┬──────┘
       │                                │
       │ MCP (SSE)                      │ MCP (SSE/stdio)
       │                                │
┌──────▼──────┐                  ┌──────▼──────┐
│  AgentCore  │                  │  AgentCore  │
│  Gateway    │                  │  Runtime    │
└──────┬──────┘                  └──────┬──────┘
       │                                │
       │ invoke                         │ (runs your server)
       │                                │
┌──────▼──────┐                  ┌──────▼──────┐
│   Lambda    │                  │ MCP Server  │
│  (tools)    │                  │ (tools +    │
│             │                  │  resources +│
└─────────────┘                  │  prompts)   │
                                 └─────────────┘

Shared: tools/ (pure tool logic, no transport coupling)
```

## Project Status

🚧 Building in public — follow along with the video series.

## Structure

```
docs/
  DECISIONS.md    # Every decision logged for video script generation
```

More files appear as we build each part.
