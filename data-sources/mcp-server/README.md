# MCP Server — Healthcare Payor Data Tools

A [Model Context Protocol](https://modelcontextprotocol.io) server that exposes healthcare payor data as tools. Azure AI Foundry connects to this server to retrieve live member, claims, and benefits data for Knowledge Base responses.

## Prerequisites

- Node.js 18+
- Sample data files present in `sample-data/` (see below)

## Tools Exposed

| Tool | Description |
|------|-------------|
| `lookup_member` | Retrieve member demographics, plan enrollment, and eligibility by member ID or name |
| `lookup_claim` | Retrieve claim status, adjudication details, billed/allowed/paid amounts by claim ID or member |
| `check_benefits` | Retrieve in-network/out-of-network coverage, deductibles, copays, and prior auth requirements |

## Install and Run

```bash
cd data-sources/mcp-server
npm install
npm start
```

The server communicates over **stdio** (standard MCP transport).

## Sample Data Files Required

The server reads from the following files in `sample-data/`:

```
sample-data/
  members/members.json     ← array of member objects
  claims/claims.json       ← array of claim objects
  benefits/benefits.json   ← array of benefit objects
```

See `sample-data/` subdirectories for the expected JSON schema for each file.

## Connect to Azure AI Foundry

Foundry Knowledge Base supports MCP servers via a **remote HTTP endpoint**. To expose this stdio server over HTTP, use the MCP HTTP proxy pattern or deploy as an Azure Container App:

### Option A — Local dev with stdio bridge

When testing locally, Foundry can invoke the MCP server directly if running on the same machine. Point Foundry to the server process.

### Option B — Deploy to Azure Container Apps (recommended for demo)

```bash
# Build and push container
az acr build --registry <your-acr> --image healthcare-mcp:latest .

# Deploy to Container Apps
az containerapp create \
  --name healthcare-mcp \
  --resource-group rg-knowledge-iq-demo \
  --image <your-acr>.azurecr.io/healthcare-mcp:latest \
  --target-port 3000 \
  --ingress external
```

Then in **Foundry → Knowledge bases → + Add data source → MCP Server**, enter the Container Apps URL.

## Development

```bash
npm run dev   # node --watch for auto-reload on file changes
```
