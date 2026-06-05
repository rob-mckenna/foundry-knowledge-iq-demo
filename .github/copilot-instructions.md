# Copilot Instructions

## Project Overview

Demo of **Knowledge IQ** in the new Azure AI Foundry (ignore "classic" Foundry references). Demonstrates creating a Knowledge Base with multiple data sources, targeting a **healthcare payor** customer in health and life sciences.

### What This Demo Shows

1. **Knowledge Base creation** in Foundry using multiple data sources:
   - MCP server
   - Azure AI Search
   - Fabric Data Agent
   - Azure Blob Storage
2. **Sample data** and **sample endpoints** for each data source (healthcare payor domain)
3. **Prompt agent** built in Foundry with sample test prompts

### Domain Context

The customer is a **payor** (health insurance company). Sample data should reflect:
- Claims processing and adjudication
- Member benefits and eligibility
- Provider network information
- Prior authorization policies
- Formulary / pharmacy benefits
- Clinical guidelines and coverage criteria

## Architecture

```
data-sources/
  mcp-server/          # MCP server endpoint with sample healthcare data
  ai-search/           # Azure AI Search index config + sample documents
  fabric-data-agent/   # Fabric Data Agent connection config
  blob-storage/        # Sample documents for Azure Blob Storage upload
sample-data/           # Domain-specific healthcare payor sample data
agent/                 # Foundry prompt agent definition + sample prompts
docs/                  # Demo walkthrough and setup instructions
```

## Key Conventions

- **New Foundry only** — do not reference or use Azure AI Studio / classic Foundry APIs
- **Sample data must be synthetic** — no real PHI/PII. Use realistic but fictional member, provider, and claims data
- **Each data source should be independently demoable** — the Knowledge Base can be shown with any combination

## Squad Conventions

- **Decisions:** Write to `.squad/decisions/inbox/{agent}-{slug}.md` — Scribe merges into `decisions.md`
- **Append-only files:** Never rewrite `history.md`, `decisions.md`, or log files
- **Branch naming:** `squad/{issue-number}-{kebab-case-slug}`
