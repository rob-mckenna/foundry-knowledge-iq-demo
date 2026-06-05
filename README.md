# Knowledge IQ Demo — Azure AI Foundry (Healthcare Payor)

This repository demonstrates **Knowledge IQ** in the new Azure AI Foundry, targeting a healthcare payor audience. It shows how to build a Knowledge Base from multiple heterogeneous data sources and surface it through a Foundry prompt agent.

## What This Demo Shows

| Step | What You See |
|------|-------------|
| 1 | Connect four distinct data sources to a single Foundry Knowledge Base |
| 2 | Query across claims, benefits, prior auth, and provider data in one prompt |
| 3 | A Foundry prompt agent answering realistic payor questions end-to-end |

### Data Sources

| Source | Contents |
|--------|----------|
| **MCP Server** | Live-queryable healthcare payor data (claims, eligibility, formulary) |
| **Azure AI Search** | Pre-indexed clinical guidelines and coverage policies |
| **Fabric Data Agent** | Structured claims and member analytics from Microsoft Fabric |
| **Azure Blob Storage** | Provider directories, benefits summaries, and prior auth PDFs |

## Prerequisites

- Azure subscription with Azure AI Foundry access
- Azure AI Search service (Standard tier or above)
- Microsoft Fabric workspace with Data Agent preview enabled
- Azure Blob Storage account
- Python 3.11+ (for MCP server and scripts)
- Azure CLI (`az`) authenticated to your subscription

## Repository Structure

```
data-sources/
  mcp-server/          # MCP server endpoint + synthetic healthcare data
  ai-search/           # AI Search index config + sample documents
  fabric-data-agent/   # Fabric Data Agent connection config
  blob-storage/        # Sample documents for Blob Storage upload
sample-data/           # Shared synthetic healthcare payor data
agent/                 # Foundry prompt agent definition + test prompts
docs/                  # Demo walkthrough and setup instructions
```

## Quick Start

1. **Provision infrastructure** — follow `docs/setup.md` to deploy required Azure resources.
2. **Load sample data** — run scripts in each `data-sources/` subdirectory to populate sources.
3. **Create the Knowledge Base** — follow `docs/demo-flow.md` steps 1–3 in Azure AI Foundry.
4. **Deploy the agent** — use the definition in `agent/` to publish the prompt agent.
5. **Run test prompts** — execute the prompts in `agent/test-prompts/` to validate the demo.

## Important Notes

- **All sample data is fully synthetic.** No real PHI or PII is present anywhere in this repository.
- This demo targets the **new Azure AI Foundry** only. Do not reference Azure AI Studio or classic Foundry APIs.
- Each data source is independently demoable; the Knowledge Base works with any subset.

## Documentation

- [`docs/demo-flow.md`](docs/demo-flow.md) — Narrative walkthrough for the customer demo
- [`docs/setup.md`](docs/setup.md) — Step-by-step infrastructure setup
- [`docs/architecture.md`](docs/architecture.md) — Architecture overview and design decisions
