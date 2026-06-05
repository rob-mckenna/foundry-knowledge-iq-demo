# Data — History

## Project Context
- **Project:** foundry-knowledge-iq-demo — Demo of Knowledge IQ in Azure AI Foundry for a healthcare payor
- **Stack:** Azure AI Foundry, AI Search, Blob Storage, Fabric Data Agent, MCP
- **User:** Rob McKenna

## Learnings

- MCP server uses Node.js ESM (`"type": "module"`) with `@modelcontextprotocol/sdk` v1; stdio transport is standard — Foundry connects via an HTTP endpoint wrapper (e.g., Container Apps) in production.
- `StreamableHTTPServerTransport` (from `@modelcontextprotocol/sdk/server/streamableHttp.js`) is the right HTTP transport — wraps Node.js `http.createServer`. Each request spawns a new transport instance connected to the shared `McpServer`; `sessionIdGenerator: () => randomUUID()` enables stateful sessions. Configurable via `--transport=http` flag.
- MCP tools `get_prior_auth_requirements` and `get_clinical_coverage_criteria` read markdown policy files from `sample-data/policies/` — they do full-text line scanning to extract relevant excerpts. Good enough for demo; a real implementation would parse structured policy objects.
- `check_formulary` gracefully falls back to the `policies/formulary-guidelines.md` text search when `sample-data/formulary/` JSON files don't exist yet — keeps the demo running while Mouth populates that directory.
- AI Search needs **three** separate indexes: `healthcare-payor-docs` (general docs blob indexer), `healthbridge-formulary-index` (drug records, push API), `healthbridge-provider-index` (provider records, push API). The original `index-schema.json` only covered the docs index; added `formulary-index-schema.json` and `provider-index-schema.json` to match `knowledge-base-config.json`.
- Blob Storage `deploy.ps1` now uploads `providers/` and `formulary/` in addition to the original four folders — consistent with the full sample-data structure.
- AI Search index uses `text-embedding-3-small` at 1536 dimensions with HNSW cosine profile; skillset uses `indexProjections` with `generatedKeyAsId` to chunk pages and project them as separate index entries.
- Blob Storage deploy script is PowerShell (not bash) to stay consistent with the Windows dev environment.
- Fabric Data Agent connection requires the Data Agent feature pre-enabled in the Fabric workspace (preview) — cannot be fully provisioned from IaC alone.
- README files in `data-sources/` were pre-scaffolded with placeholder content; replaced with actionable instructions matching the actual files created.

## Cross-Agent Impact (2026-06-05 expansion phase)

- **Formulary schema defined:** Data established `{ formularyId, drugName, genericName, tier, requiresPriorAuth, stepTherapyRequired, quantityLimit, specialtyPharmacy, NDC, ... }`. Mouth used this exact schema for 10 formulary drug records; Chunk created formulary test prompts from the populated data.
- **MCP server: 7 tools finalized** (lookup_member, lookup_claim, lookup_provider, check_benefits, check_formulary, check_eligibility, check_prior_auth). Chunk's system prompt documents these tools in the "Tools Available" section. Mikey's setup guide references all 7 in the MCP server quickstart.
- **AI Search index split decision:** Chunk's KB config uses three separate indexes (`healthbridge-formulary-index`, `healthbridge-provider-index`, `healthcare-payor-docs`). Data created all three schemas and updated the deploy script to populate them.
- **Brand standardization applied:** All 48 files across team now use "HealthBridge Insurance Plan" consistently (verified by Mouth via find-replace).

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

### 2026-06-05 — Complete MCP server + AI Search + Blob Storage

**Task:** Add missing MCP tools, HTTP transport, comprehensive test suite; add AI Search indexes for formulary and provider; update Blob Storage config.

**Deliverables created/updated:**

| Path | Change |
|------|--------|
| `data-sources/mcp-server/server.js` | Added `get_prior_auth_requirements`, `get_clinical_coverage_criteria`, `check_formulary` tools; added HTTP transport via `StreamableHTTPServerTransport`; `--transport=http\|stdio` CLI flag |
| `data-sources/mcp-server/package.json` | Added `start:http`, `dev:http`, `test` scripts |
| `data-sources/mcp-server/test-tools.mjs` | Full replacement: MCP SDK Client over stdio, 33 assertions across all 7 tools, 33/33 passing |
| `data-sources/ai-search/formulary-index-schema.json` | New: `healthbridge-formulary-index` with 12 fields matching knowledge-base-config.json selectFields |
| `data-sources/ai-search/provider-index-schema.json` | New: `healthbridge-provider-index` with 13 fields matching knowledge-base-config.json selectFields |
| `data-sources/ai-search/README.md` | Updated: covers all 3 indexes, push API instructions for formulary/provider |
| `data-sources/blob-storage/deploy.ps1` | Added `providers` and `formulary` to upload folders |
| `data-sources/blob-storage/README.md` | Updated directory layout with all 6 folders and file-level detail |

## Cross-Team Updates (2026-06-05)

**From Mikey (Lead):** Four-source architecture finalized. Demo flow spans 45 min, 4 acts, 5 payor workflows (eligibility, prior auth, formulary, claims, provider network). All sources must be independently demoable. Architecture ADR filed — review for alignment on MCP/AI Search/Fabric/Blob roles.

**From Mouth (Domain Content):** Created 14 sample data files (3 claims, 3 members, 3 providers, 3 policies, 2 benefits). Internally consistent IDs: members MBR-2024-*, providers NPI-*, claims CLM-2026-*, PAs PA-2026-*. HealthBridge Insurance Plan brand. Files ready for distribution to each data source per your scaffolded configs.

**From Chunk (Agent Builder):** Agent definition created (HealthBridge Assistant) with knowledge base config referencing all four sources, system prompt, and 18 sample prompts. Waiting on knowledge base assembly and data population.
