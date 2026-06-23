# Data — History

## Project Context
- **Project:** foundry-knowledge-iq-demo — Demo of Knowledge IQ in Azure AI Foundry for a healthcare payor
- **Stack:** Azure AI Foundry, AI Search, Blob Storage, Fabric Data Agent, MCP
- **User:** Rob McKenna

## Summary

**Completed:** All Azure infrastructure deployed (Bicep IaC + Bicep params), all data sources populated (Blob: 45 healthcare payor docs/policies; AI Search: 3 indexes; MCP server: 7 tools, HTTP transport; Container Apps: MCP endpoint live). **Resource model verified (2026-06-22):** New Foundry projects are `Microsoft.CognitiveServices/accounts/projects`, not `MachineLearningServices/workspaces`. Existing connections on proj-healthbridge: `srch-healthbridge-connection` (Search), `sthealthbridgedemo2ag633uyd` (Blob, AAD). MCP + custom naming connections still need creation. All Bicep templates, schemas, deploy scripts, and troubleshooting resolved and documented in `infra/` and `data-sources/`.

## Key Decisions & Learnings

### Technical Decisions
- **MCP Transport:** `StreamableHTTPServerTransport` for HTTP wrapper (each request = new session via `randomUUID()`); stateful but appropriate for demo scale.
- **AI Search Indexes (3):** Split by data domain — `healthcare-payor-docs` (blob indexer), `healthbridge-formulary-index` (push API), `healthbridge-provider-index` (push API). Embedding model: `text-embedding-3-small` / 1536 dims with HNSW cosine.
- **Bicep Deployment:** Foundry Hub/Project excluded (complex dependencies); deployed 4 modules (OpenAI, AI Search, Storage, ACR) successfully to `eastus`. Storage key auth disabled by org policy; RBAC + managed identity required for all access.
- **New Foundry Resource Model (empirically verified 2026-06-22):**
  - Account: `Microsoft.CognitiveServices/accounts` (kind: AIServices)
  - Project: `Microsoft.CognitiveServices/accounts/projects`
  - Connections API: `https://management.azure.com<PROJ_ID>/connections?api-version=2025-04-01-preview`
  - Correct verification: `az cognitiveservices account show -g rg-knowledge-iq-demo -n foundry-healthbridge-demo` or `az resource show --ids <PROJ_ID> --api-version 2025-04-01-preview`

### Gotchas Resolved
- Storage key auth disabled by org policy → switched to RBAC + managed identity
- AI Search schema API field names corrected (`analyzer` not `analyzerName`, etc.)
- OpenAI key auth disabled → managed identity + `Cognitive Services OpenAI User` role
- Blob indexer RBAC propagation delay (~90 sec) → retried successfully
- Provider data null arrays → explicit null-checking + defaults
- MCP server Dockerfile added for Container Apps deployment

### Cross-Team Alignment (2026-06-05)
- **Formulary schema:** Data defined `{ formularyId, drugName, genericName, tier, requiresPriorAuth, ... }`. Mouth populated 10 records; Chunk created prompts.
- **MCP 7 tools:** All finalized. Chunk's system prompt documents; Mikey's setup guide references.
- **AI Search 3-index split:** Chunk's KB config uses all 3 by name. Data created schemas + deploy script.
- **Brand standardization:** All 48 files now use "HealthBridge Insurance Plan."

## Deployed Resources

| Resource | Name | Endpoint |
|---|---|---|
| OpenAI | `oai-healthbridge-demo` | `https://oai-healthbridge-demo.openai.azure.com/` |
| AI Search | `srch-healthbridge-demo` | `https://srch-healthbridge-demo.search.windows.net` |
| Storage | `sthealthbridgedemo2agib7` | `https://sthealthbridgedemo2agib7.blob.core.windows.net/` (45 docs) |
| MCP Server (CA) | `ca-mcp-healthbridge` | `https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io/mcp` |

**Next:** Create remaining connections (MCP + custom-named Blob/Search via `az rest`, or use existing auto-names + edit KB config).

