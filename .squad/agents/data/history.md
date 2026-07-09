# Data — History

## Project Context
- **Project:** foundry-knowledge-iq-demo — Demo of Knowledge IQ in Azure AI Foundry for a healthcare payor
- **Stack:** Azure AI Foundry, AI Search, Blob Storage, Fabric Data Agent, MCP
- **User:** Rob McKenna

## Summary

**Completed:** All Azure infrastructure deployed (Bicep IaC + Bicep params), all data sources populated (Blob: 45 healthcare payor docs/policies; AI Search: 3 indexes; MCP server: 7 tools, HTTP transport; Container Apps: MCP endpoint live). **Resource model verified (2026-06-22):** New Foundry projects are `Microsoft.CognitiveServices/accounts/projects`, not `MachineLearningServices/workspaces`. Existing connections on proj-healthbridge: `srch-healthbridge-connection` (Search), `sthealthbridgedemo2ag633uyd` (Blob, AAD). MCP + custom naming connections still need creation. All Bicep templates, schemas, deploy scripts, and troubleshooting resolved and documented in `infra/` and `data-sources/`. **Knowledge Base created (2026-07-09):** `payor-knowledge-base` on `srch-healthbridge-demo` with 5 knowledge sources wired. MCP endpoint for agent: `https://srch-healthbridge-demo.search.windows.net/knowledgebases/payor-knowledge-base/mcp?api-version=2026-05-01-preview`. Fabric source blocked (external prereq).

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

**Next:** Fabric prerequisites remain to create `healthbridge-fabric-connection`; all other KB connection name alignment is complete.

## Learnings

- **2026-07-07T03:51:25.125-04:00:** Verified live Foundry project path remains `Microsoft.CognitiveServices/accounts/foundry-healthbridge-demo/projects/proj-healthbridge`; connections endpoint `.../connections?api-version=2025-04-01-preview` is healthy.
- **2026-07-07T03:51:25.125-04:00:** Created `healthbridge-mcp-connection` (category `RemoteTool`, auth `None`, target `https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io/mcp`) after confirming MCP `/health` returned 200.
- **2026-07-07T03:51:25.125-04:00:** On Windows PowerShell, `az rest --method PUT` for Foundry connections is reliable when request body is passed as `@<json-file>` (UTF-8 no BOM); inline JSON body attempts returned parse/media-type errors.
- **2026-07-07T03:51:25.125-04:00:** KB wiring still has two blockers: `healthbridge-fabric-connection` is absent (Fabric workspace/agent prerequisite), and config-name mismatch remains unless team chooses Option A (create `healthbridge-blob-connection` + `healthbridge-aisearch-connection`) or Option B (map config to existing `sthealthbridgedemo2ag633uyd` + `srch-healthbridge-connection`).
- **Key file paths:** `docs/knowledge-base-connection-guide.md`, `agent/knowledge-base-config.json`, `.squad/decisions.md`.
- **2026-07-07T04:05:39.100-04:00:** Resolved runtime/config name mismatch by creating `healthbridge-blob-connection` and `healthbridge-aisearch-connection` on `proj-healthbridge`; `agent/knowledge-base-config.json` required no edits because refs already matched target names.
- **2026-07-07T04:05:39.100-04:00:** Final source readiness matrix now shows MCP ✅, AI Search ✅, Blob ✅, Fabric ❌ (missing `healthbridge-fabric-connection` due to external Fabric workspace/agent prerequisite).
- **2026-07-07T07:05:22Z (Scribe consolidation):** Data agent work archived in decisions.md consolidation. Decision entry "Foundry connection create payload pattern on Windows" merged from inbox → active decisions. Decisions archive created with 8 historical entries (2026-06-05 and 2026-06-08 phases). Team runbooks should adopt file-based JSON payload approach for Windows Foundry connection creation.
- **2026-07-07T08:14:41Z (Scribe pass 2):** Decision "Connection name mismatch resolved via custom-name creation" merged from inbox → active decisions. Data completed execution of Option A: created `healthbridge-blob-connection` and `healthbridge-aisearch-connection` on proj-healthbridge. KB source alignment now complete (MCP ✅, AI Search ✅, Blob ✅, Fabric ❌ pending external prerequisites).
- **2026-07-09T01:10:13Z (Issue #2 verification):** Live connection state re-verified via `az rest GET .../connections?api-version=2025-04-01-preview`. All three custom-named connections confirmed present and correctly configured: `healthbridge-mcp-connection` (RemoteTool, None auth, MCP endpoint), `healthbridge-blob-connection` (AzureStorageAccount, AAD, storage blob endpoint), `healthbridge-aisearch-connection` (CognitiveSearch, ApiKey, AI Search endpoint). `healthbridge-fabric-connection` absent — blocked by Fabric workspace/data agent prerequisite (no change). Connection names match `agent/knowledge-base-config.json` exactly. Issue #2 acceptance criteria MCP ✅ AI Search ✅ Blob ✅ Fabric ❌(blocked external).
- **2026-07-09T01:23:27Z (Issue #3 KB creation):** Created `payor-knowledge-base` on `srch-healthbridge-demo` via AI Search REST API (2026-05-01-preview). Knowledge sources wired: `healthcare-payor-docs-source` (searchIndex, 45 docs), `healthbridge-formulary-source` (searchIndex, 10 docs), `healthbridge-provider-source` (searchIndex, 7 docs), `mcp-prior-auth-source` (mcpServer, 2 tools), `healthbridge-blob-connection` (azureBlob, 0 docs — blob pipeline has OAI endpoint mismatch; see tech debt note). KB model: `gpt-4o` on `foundry-healthbridge-demo.openai.azure.com`. outputMode: `answerSynthesis`. effort: `low`. KB MCP endpoint: `https://srch-healthbridge-demo.search.windows.net/knowledgebases/payor-knowledge-base/mcp?api-version=2026-05-01-preview`. RBAC: assigned `Cognitive Services User` + `Cognitive Services OpenAI User` to Search service MI on Foundry account for KB answer synthesis. Fabric source not included (external prereq missing). Blob pipeline tech debt: `healthbridge-blob-connection-index` has 0 docs — indexer uses wrong OAI endpoint (`healthbridge-demo.openai.azure.com` vs `foundry-healthbridge-demo.openai.azure.com`); `healthcare-payor-docs-source` covers the same 45 documents from the pre-built index.
