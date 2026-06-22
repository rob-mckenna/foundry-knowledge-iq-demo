# Data — History

## Project Context
- **Project:** foundry-knowledge-iq-demo — Demo of Knowledge IQ in Azure AI Foundry for a healthcare payor
- **Stack:** Azure AI Foundry, AI Search, Blob Storage, Fabric Data Agent, MCP
- **User:** Rob McKenna

## Learnings

- **Foundry project does NOT exist (2026-06-22):** `az ml workspace show --name proj-healthbridge --resource-group rg-knowledge-iq-demo` returns `ResourceNotFound`. The `Microsoft.MachineLearningServices/workspaces/proj-healthbridge` resource has not been created. This is a manual step at ai.azure.com — the Foundry project must be created in the portal before any `az rest` connections can be attempted. The `az ml` extension must be installed non-interactively via `echo "y" | az extension add -n ml` in PowerShell (plain `az extension add -n ml` hangs waiting for interactive prompt in non-interactive shells). The Option A `az rest` PowerShell pattern (body-as-file) was not reached because the precondition check failed cleanly with exit code 3.
- **az ml extension install in PowerShell:** `az extension add -n ml` hangs in non-interactive shells; use `echo "y" | az extension add -n ml` to auto-confirm the install prompt.

- **Bicep IaC (2026-06-05):** Resource group `rg-knowledge-iq-demo` pre-existed in `eastus` (not `eastus2`) — location param set to `eastus` to match. Storage account and ACR use `uniqueString(resourceGroup().id)` suffix (`2agib7`) for global uniqueness; actual names are `sthealthbridgedemo2agib7` and `crhealthbridgedemo2agib7`. Azure AI Foundry Hub/Project excluded from Bicep — requires Key Vault + App Insights dependencies; portal creation preferred for demo simplicity. `Microsoft.CognitiveServices/accounts@2024-10-01` with `kind=OpenAI` is the correct resource type for Azure OpenAI in new Bicep. AI Search `semanticSearch: 'free'` tier is sufficient for demo with Basic SKU.

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

### 2026-06-05 — Bicep IaC + Azure Deployment

**Task:** Create `infra/` Bicep templates and deploy to `ME-MngEnvMCAP251766-romcken-1`.

**Deliverables created:**

| Path | Description |
|------|-------------|
| `infra/main.bicep` | Orchestrator: deploys all 4 resource modules; includes note on Foundry Hub/Project exclusion |
| `infra/main.bicepparam` | Parameter values (`eastus`, resource names, tags) |
| `infra/modules/ai-services.bicep` | Azure OpenAI S0 account + `text-embedding-3-small` deployment (30K TPM) |
| `infra/modules/search.bicep` | AI Search Basic SKU with `semanticSearch: 'free'` |
| `infra/modules/storage.bicep` | StorageV2 Standard_LRS + `healthcare-docs` container |
| `infra/modules/registry.bicep` | ACR Basic SKU, admin enabled |
| `infra/README.md` | Deployed endpoints, module map, deploy + teardown commands |

**Deployment status:** ✅ Succeeded

**Deployed resource names:**
- OpenAI: `oai-healthbridge-demo` → `https://oai-healthbridge-demo.openai.azure.com/`
- AI Search: `srch-healthbridge-demo` → `https://srch-healthbridge-demo.search.windows.net`
- Storage: `sthealthbridgedemo2agib7` → `https://sthealthbridgedemo2agib7.blob.core.windows.net/`
- ACR: `crhealthbridgedemo2agib7` → `crhealthbridgedemo2agib7.azurecr.io`

### 2026-06-20 — Full Azure Deployment Execution

**Task:** Execute all deployment steps end-to-end: Bicep, blob upload, AI Search indexes, MCP container.

**Steps completed:**

| Step | Status | Notes |
|------|--------|-------|
| Resource group `rg-knowledge-iq-demo` | ✅ Exists | eastus, pre-existing |
| Bicep deployment | ✅ Succeeded (idempotent) | All 4 modules confirmed |
| Blob upload (45 files) | ✅ Done | 6 policies, 6 benefits, 8 members, 8 claims, 7 providers, 10 formulary |
| AI Search index `healthcare-payor-docs` | ✅ Created | 45 docs via blob indexer |
| AI Search index `healthbridge-formulary-index` | ✅ Created + populated | 10 formulary drug records |
| AI Search index `healthbridge-provider-index` | ✅ Created + populated | 7 provider records |
| MCP server Docker image | ✅ Built + pushed | `crhealthbridgedemo2agib7.azurecr.io/mcp-server:latest` |
| Container Apps environment | ✅ Created | `cae-healthbridge-demo` in eastus |
| Container App (MCP server) | ✅ Deployed + healthy | `https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io` |

**New endpoints:**
- MCP server HTTP: `https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io/mcp`
- MCP health check: `https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io/health` → `{"status":"ok","server":"healthcare-payor-mcp","version":"1.0.0"}`

**Gotchas encountered and resolved:**

1. **Storage account key auth disabled by Azure Policy** — `allowSharedKeyAccess: false` is enforced org-wide. `deploy.ps1` (which uses connection string) fails. Fixed by: assigning `Storage Blob Data Contributor` RBAC to the current user and using `--auth-mode login` for all blob operations. Updated `infra/modules/storage.bicep` to explicitly set `allowSharedKeyAccess: false` and `publicNetworkAccess: 'Enabled'` to reflect actual state.

2. **Storage `publicNetworkAccess: Disabled`** — The existing storage account had public access disabled (likely from a prior deployment attempt). Fixed by `az storage account update --public-network-access Enabled`. Bicep updated to preserve this setting.

3. **AI Search index schema API field names wrong** — The index schemas used `analyzerName` (should be `analyzer`) and `contentFields`/`keywordsFields` (should be `prioritizedContentFields`/`prioritizedKeywordsFields`) per API 2024-07-01. Fixed in all three schema files and during runtime via string replace.

4. **Schema top-level `description` field rejected** — Azure Search API doesn't support `description` at index root level. Stripped via `PSObject.Properties.Remove('description')` before PUT.

5. **OpenAI key auth disabled** (`disableLocalAuth: true` on `oai-healthbridge-demo`) — Cannot use API keys for OpenAI. AI Search managed identity must be used for vectorizer. Set up: enabled System-Assigned MI on `srch-healthbridge-demo`, assigned `Cognitive Services OpenAI User` role on OpenAI and `Storage Blob Data Reader` on storage to the search MI (`2cdd94df-c82e-4ac0-930f-1629387d9f1b`). Index vectorizer configs reference OpenAI endpoint without `apiKey` (relies on MI).

6. **Blob indexer RBAC propagation delay** — First two indexer creation attempts failed with "credentials invalid" because RBAC hadn't propagated yet (~90 seconds needed). Third attempt succeeded.

7. **Provider data null arrays** — NPIs 2345678901, 5678901234, 7890123456 are org/group providers with null `boardCertifications` and `languages`. Fixed by explicit null-checking and defaulting to `@("English")` / `@()`.

8. **No Dockerfile for MCP server** — Created `data-sources/mcp-server/Dockerfile`. Build context is repo root; copies `data-sources/mcp-server/` and `sample-data/` so `../../sample-data` path in server.js resolves correctly at `/app/sample-data`.

**Resources created/modified this session:**
- `log-healthbridge-demo` (Log Analytics workspace, eastus)
- `cae-healthbridge-demo` (Container Apps environment, Consumption tier)
- `ca-mcp-healthbridge` (Container App, 0.5 CPU / 1 GiB, min 1 replica, external ingress)
- AI Search indexes: `healthcare-payor-docs`, `healthbridge-formulary-index`, `healthbridge-provider-index`
- AI Search data source: `healthcare-docs-blob` (ResourceId MI auth)
- AI Search indexer: `healthcare-payor-indexer` (runs every 12h)
- RBAC: search MI has `Storage Blob Data Reader` + `Cognitive Services OpenAI User`
- RBAC: current user has `Storage Blob Data Contributor` on storage

**What remains (manual / out of scope):**
- Foundry project creation via ai.azure.com (manual — per team decision)
- Connect Knowledge Base data sources in Foundry UI (follow `docs/azure-setup.md`)
- Fabric Data Agent setup (requires Fabric workspace with Data Agent feature enabled — noted ⚠️)
