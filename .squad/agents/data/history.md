# Data — History

## Project Context
- **Project:** foundry-knowledge-iq-demo — Demo of Knowledge IQ in Azure AI Foundry for a healthcare payor
- **Stack:** Azure AI Foundry, AI Search, Blob Storage, Fabric Data Agent, MCP
- **User:** Rob McKenna

## Learnings

- MCP server uses Node.js ESM (`"type": "module"`) with `@modelcontextprotocol/sdk` v1; stdio transport is standard — Foundry connects via an HTTP endpoint wrapper (e.g., Container Apps) in production.
- AI Search index uses `text-embedding-3-small` at 1536 dimensions with HNSW cosine profile; skillset uses `indexProjections` with `generatedKeyAsId` to chunk pages and project them as separate index entries.
- Blob Storage deploy script is PowerShell (not bash) to stay consistent with the Windows dev environment.
- Fabric Data Agent connection requires the Data Agent feature pre-enabled in the Fabric workspace (preview) — cannot be fully provisioned from IaC alone.
- README files in `data-sources/` were pre-scaffolded with placeholder content; replaced with actionable instructions matching the actual files created.

## Work Log

### 2026-06-05 — Scaffold data-sources/ directory

**Task:** Create config files for all four Foundry Knowledge Base data sources.

**Deliverables created:**

| Path | Description |
|------|-------------|
| `data-sources/ai-search/index-schema.json` | AI Search index: 8 fields, HNSW vector profile, semantic config |
| `data-sources/ai-search/skillset.json` | Cognitive skillset: split → key phrases → entities → OpenAI embed → merge |
| `data-sources/ai-search/README.md` | Setup: env vars, curl commands for index/skillset/indexer, Foundry connect |
| `data-sources/blob-storage/deploy.ps1` | PowerShell: create RG + storage account + container + upload from sample-data/ |
| `data-sources/blob-storage/README.md` | Deploy instructions + Foundry RBAC grant |
| `data-sources/mcp-server/package.json` | Node.js ESM package with `@modelcontextprotocol/sdk` |
| `data-sources/mcp-server/server.js` | MCP server: `lookup_member`, `lookup_claim`, `check_benefits` tools |
| `data-sources/mcp-server/README.md` | Install/run, sample-data schema, Container Apps deploy option |
| `data-sources/fabric-data-agent/connection-config.json` | Fabric connection: workspace/agent IDs, 6 tables in scope |
| `data-sources/fabric-data-agent/README.md` | Prerequisites, placeholder table, Foundry connect steps, verify query |
| `sample-data/{policies,benefits,members,claims}/` | Directories created (content TBD) |

## Cross-Team Updates (2026-06-05)

**From Mikey (Lead):** Four-source architecture finalized. Demo flow spans 45 min, 4 acts, 5 payor workflows (eligibility, prior auth, formulary, claims, provider network). All sources must be independently demoable. Architecture ADR filed — review for alignment on MCP/AI Search/Fabric/Blob roles.

**From Mouth (Domain Content):** Created 14 sample data files (3 claims, 3 members, 3 providers, 3 policies, 2 benefits). Internally consistent IDs: members MBR-2024-*, providers NPI-*, claims CLM-2026-*, PAs PA-2026-*. BluePeak Health Plan brand. Files ready for distribution to each data source per your scaffolded configs.

**From Chunk (Agent Builder):** Agent definition created (HealthBridge Assistant) with knowledge base config referencing all four sources, system prompt, and 18 sample prompts. Waiting on knowledge base assembly and data population.
