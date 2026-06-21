# Squad Decisions

## Active Decisions

### ADR: Demo Architecture — Knowledge IQ Multi-Source Knowledge Base

**Author:** Mikey (Lead)  
**Date:** 2026-06-05  
**Status:** Accepted  

We use exactly four data sources (MCP Server, Azure AI Search, Fabric Data Agent, Azure Blob Storage) to demonstrate architectural diversity for a healthcare payor audience. All sample data is synthetic and generated from `sample-data/`, distributed to each source at setup. Demo workflows cover: Eligibility & Benefits, Prior Authorization, Formulary & Pharmacy, Claims Analytics, and Provider Network. New Azure AI Foundry only (no classic Foundry or Azure AI Studio). Each source must work independently.

**Rationale:** Four sources cover real-time API (MCP), unstructured search (AI Search), structured analytics (Fabric), and file storage (Blob). Cross-source consistency enables compelling multi-source demos. New Foundry only is a hard constraint.

## 2026-06-05 Expansion Phase Decisions

### Decision: Sample Data Schema Extensions for Expanded Dataset
**Author:** Mouth | **Date:** 2026-06-05

Added claim status extension objects (`denialInfo`, `pendingInfo`, `reviewInfo`), member termination fields (`terminationInfo`), provider out-of-network fields (`outOfNetworkInfo`), and formulary schema standard. Formulary schema supports: formularyId, drugName, genericName, tier, requiresPriorAuth, stepTherapyRequired, quantityLimit, specialtyPharmacy, NDC (with XX suffix masking), and comprehensive clinical data.

**Impact:** Data Engineer should reflect schema extensions in AI Search index mappings. Agent Builder should create prompts for formulary, TERMED member eligibility, and claim denial scenarios.

---

### Decision: MCP Server Data Loading Fix
**Author:** Data | **Date:** 2026-06-05

Replaced monolithic `loadJson` with `loadDirectory(subdir)` to read individual JSON files per entity. Aligned filter logic to camelCase field names (`memberId`, `claimId`, etc.). Redesigned `check_benefits` to resolve `planInfo.planType` + `planInfo.metalTier` and map to markdown benefit summaries. Added `lookup_provider` tool for NPI/name/specialty search. Added explicit `zod` dependency.

**Test Results:** 22 assertions passed. All tools verified against live sample data.

---

### Decision: MCP Server Transport Strategy and AI Search Index Split
**Author:** Data | **Date:** 2026-06-05

Used `StreamableHTTPServerTransport` (stateless, new transport per POST `/mcp` request) instead of legacy SSE. Each request gets a unique session ID via `randomUUID()`. Created three separate AI Search indexes: `healthbridge-formulary-index` (structured formulary), `healthbridge-provider-index` (provider directory), `healthcare-payor-docs` (general documents). Added `/health` endpoint for liveness probes.

**Impact on Deployment:** MCP endpoint is `POST /mcp` at `http://<host>:3000`. Foundry KB connection should use HTTP transport and correct index names. Formulary directory (`sample-data/formulary/`) populates formulary index; provider JSON populates provider index. When formulary data doesn't exist, `check_formulary` falls back to markdown guideline search.

---

### Decision: Azure Setup Guide + Sample Prompt Data Consistency
**Author:** Chunk | **Date:** 2026-06-05

Fixed three critical mismatches:
1. **Blob container name:** Updated KB config from `"plan-documents"` to `"healthcare-docs"` (matching deploy script).
2. **Embedding model:** Updated KB config from `text-embedding-3-large` (3072 dims) to `text-embedding-3-small` (1536 dims) to align with AI Search index schema.
3. **Provider data in prompts:** Updated Prompt 14 to use `Dr. Patricia M. Chen` (actual provider) instead of non-existent `Dr. Sarah Chen`. Updated Guardrail C member ID from `HB-00291847` to `MBR-2024-001234` (actual format).

**Rationale:** Encoding model mismatch would silently break vector similarity search. Sample prompts must reference real data for credibility.

---

### Decision: Brand Standardization — HealthBridge Insurance Plan
**Author:** Chunk & Mouth | **Date:** 2026-06-05

All sample data, agent system prompt, and test prompts now use unified brand:
- **Brand name:** HealthBridge Insurance Plan
- **Member portal:** HealthBridge.example.com
- **Member Services:** 1-800-555-BLUE (2583)
- **Provider portal:** HealthBridge-provider.example.com

Applied consistently across 48 files. System prompt updated to match sample data brand references.

---

### Decision: Documentation Structure and Demo Narrative
**Author:** Mikey | **Date:** 2026-06-05

Established documentation hierarchy: `azure-setup.md` (raw CLI provisioning detail) + `setup-guide.md` (opinionated operator guide). Demo script anchors to single narrative member (Marcus Hartwell, MBR-2024-001234) for 10-minute coherent story arc; 3-minute version uses standalone prompts. Fabric Data Agent marked with ⚠️ consistently across all docs as pending. README quick start shows only 3 commands (npm install, npm start, test) for low-friction entry. Architecture doc uses both ASCII art (GitHub/terminal friendly) and Mermaid diagrams (rich rendering).

---

### Decision: Azure Infrastructure Deployment — HealthBridge Knowledge IQ Demo

**Author:** Data  
**Date:** 2026-06-05  
**Status:** Accepted

The demo requires Azure backing services for AI Search, Blob Storage, Azure OpenAI embeddings, and a Container Registry for the MCP server image. These were created as Bicep IaC in `infra/` and deployed to subscription `ME-MngEnvMCAP251766-romcken-1`.

Created modular Bicep templates (`infra/main.bicep` + four modules) and deployed to the pre-existing resource group `rg-knowledge-iq-demo` in region `eastus`.

**Foundry Hub/Project excluded from Bicep** — the `Microsoft.MachineLearningServices/workspaces` resource with `kind=Hub/Project` requires Key Vault + Application Insights dependencies that add significant complexity to a demo IaC template. The Hub/Project will be created via the Azure AI Foundry portal.

Deployed resources:

| Resource | Name | Endpoint / Server |
|---|---|---|
| Resource Group | `rg-knowledge-iq-demo` | `eastus` |
| Azure OpenAI | `oai-healthbridge-demo` | `https://oai-healthbridge-demo.openai.azure.com/` |
| Embedding Deployment | `text-embedding-3-small` | 30K TPM, 1536 dims |
| Azure AI Search | `srch-healthbridge-demo` | `https://srch-healthbridge-demo.search.windows.net` |
| Storage Account | `sthealthbridgedemo2agib7` | `https://sthealthbridgedemo2agib7.blob.core.windows.net/` |
| Blob Container | `healthcare-docs` | (private) |
| Container Registry | `crhealthbridgedemo2agib7` | `crhealthbridgedemo2agib7.azurecr.io` |

Storage account and ACR use `uniqueString(resourceGroup().id)` suffix (`2agib7`) to satisfy global uniqueness requirements. All resources tagged: `project=knowledge-iq-demo`, `environment=demo`.

---

### Decision: Remove hub terminology from Azure AI Foundry docs

**Author:** Mouth  
**Date:** 2026-06-08  
**Requested by:** Rob McKenna

Updated setup and infrastructure documentation to use the current Azure AI Foundry flat project model only. Removed references to Foundry Hub, Hub + Project architecture, `--kind hub`, `--hub-id`, and `hub-knowledge-iq`, and rewrote setup steps to create a Foundry project directly with `az ml workspace create --kind project`.

Docs now align with the current Azure AI Foundry experience at `ai.azure.com`, while still warning presenters not to use Azure AI Studio or classic Foundry guidance. Infrastructure notes now consistently state that the Foundry project is created manually outside the Bicep deployment.

Files updated: `docs/azure-setup.md`, `docs/setup-guide.md`, `docs/demo-flow.md`, `infra/main.bicep`, `infra/README.md`

---

### Decision: KB Connection Guide — Managed Identity Auth Approach

**Author:** Chunk (Agent Builder)  
**Date:** 2026-06-21  
**Status:** Accepted

Authored `docs/knowledge-base-connection-guide.md` — a complete, click-by-click operator guide for wiring the Microsoft Foundry Knowledge Base `payor-knowledge-base` now that all Azure resources are live.

The guide walks a presenter through five steps:
- **Step A** — Verify and assign four RBAC roles to the Foundry project managed identity (search, storage, OpenAI)
- **Step B** — Create the four Foundry connections (blob, AI Search, MCP, Fabric ⚠️) using exact connection names
- **Step C** — Create `payor-knowledge-base` with all four active data sources, embedding model, and hybrid + semantic retrieval
- **Step D** — Create/attach the `healthbridge-assistant` agent with system prompt and KB
- **Step E** — Three smoke-test prompts confirming end-to-end wiring (MCP Server, AI Search formulary, AI Search provider directory)

**Key Technical Decision:** Azure Policy on this subscription disables key-based auth on Storage and Azure OpenAI. All Foundry connections use managed identity (Entra RBAC). Required roles: Search Index Data Reader + Search Service Contributor on `srch-healthbridge-demo`; Storage Blob Data Reader on `sthealthbridgedemo2agib7`; Cognitive Services OpenAI User on `oai-healthbridge-demo`.

**Embedding Model:** `text-embedding-3-small`, 1536 dimensions. Must not be changed — existing AI Search indexes depend on this dimensionality.

**Impact:** Operators can now wire the full Knowledge Base without referencing multiple prior docs. Guide is self-contained from Foundry project creation to smoke tests passing.

---

### Decision: KB Connection Guide Validation — MCP-as-Knowledge-Source & UI Corrections

**Author:** Mikey (Lead)  
**Date:** 2026-06-21  
**Status:** Accepted  
**Requested by:** Rob McKenna

## Context

Rob reported that `docs/knowledge-base-connection-guide.md` (authored by Chunk) contained instructions that "don't appear to be accurate" — suspected of describing the old/classic Foundry UI rather than the current Microsoft Foundry portal.

## Validation Outcome

**Confirmed: The guide contained multiple BLOCKER and MAJOR inaccuracies.** Independent review against current Microsoft Learn docs (June 2026) revealed the guide was mixing current Foundry IQ architecture with fictional UI patterns that don't exist in the current portal.

## Key Findings

### 1. MCP Server as Knowledge Source — VALID but DIFFERENT from described

**Finding:** MCP Server IS a valid knowledge source type in the 2026-05-01-preview API (remote, not indexed). HOWEVER:
- It is NOT configured via a Foundry "connection" — there is no "MCP Server" connection type in the Foundry portal.
- It IS configured as a knowledge source directly on the Azure AI Search service.
- The agent connects to the KB (which includes MCP sources) via a `RemoteTool` MCP connection pointing at `{search-endpoint}/knowledgebases/{kb-name}/mcp`.

**Impact:** Steps B4, C8 were completely rewritten. MCP source now properly documented as AI Search knowledge source + REST fallback.

### 2. Navigation — WRONG throughout

| Guide v1.0 (wrong) | Actual current UI |
|---|---|
| Settings (gear, bottom-left) → Connections | Operate → Admin → [project] → Add connection |
| "Knowledge bases" in left sidebar | Build → Knowledge tab |
| "Agents" in left sidebar | Build → Agents tab |
| "+ New knowledge base" button | Create knowledge base (under Build → Knowledge) |

### 3. KB Configuration UI — INVENTED

The guide described embedding model selection, dimensions, Hybrid/Semantic/Top-K/Minimum-reranker-score/Query-rewrite settings directly in the KB creation UI. **None of these exist at the KB level.** The KB object only has: name, description, knowledgeSources, retrievalInstructions, answerInstructions, outputMode, models, encryptionKey. Embedding/retrieval config belongs on knowledge sources and search indexes.

### 4. Fabric Connection — Code-only

The guide described creating a Fabric Data Agent connection in the portal. Microsoft Learn explicitly states: "Connection creation is supported only through code."

### 5. Connection types — Wrong labels

- "Azure Blob Storage" → correct portal label is "Azure Storage"
- "MCP Server" → does not exist as a connection type
- "Fabric Data Agent" → listed as "Microsoft Fabric" (code-only)

## Correction Applied

Guide rewritten as v1.1 with:
- Correct navigation paths (with verify-in-portal warnings where UI is still rolling out)
- Proper Foundry IQ architecture explanation (KB = AI Search object)
- Knowledge sources instead of "data sources" (correct terminology)
- Programmatic fallbacks where portal UI may not yet expose preview features
- MCP correctly documented as both a KB knowledge source (preview) AND an agent tool
- Microsoft Learn reference table for ongoing maintenance

## Citations

- https://learn.microsoft.com/en-us/azure/foundry/how-to/connections-add (2026-06-19)
- https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-foundry-iq (2026-06-05)
- https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-how-to-create-knowledge-base (2026-06-02)
- https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-overview (2026-06-02)
- https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-mcp-server (2026-06-02)
- https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/foundry-iq-connect (2026-06-02)

---

### Decision: Connection Naming — Code-First Creation Required

**Author:** Mikey (Lead)  
**Date:** 2026-06-21  
**Status:** Accepted  
**Requested by:** Rob McKenna

## Problem

Rob discovered that the Microsoft Foundry portal does not provide any way to set a custom connection name. When creating a connection via the portal UI, the name is auto-generated from the Azure resource name (e.g., `sthealthbridgedemo2agib7`) and cannot be renamed after creation.

Our `agent/knowledge-base-config.json` references specific connection names (`healthbridge-blob-connection`, `healthbridge-aisearch-connection`, `healthbridge-mcp-connection`, `healthbridge-fabric-connection`). A portal-created connection will NOT match these names.

## Options Evaluated

### Option A: Create connections via code with exact custom names
- **Pros:** Connection names match config exactly. No downstream edits. Consistent with MCP/Fabric which are code-only anyway. Reproducible via script.
- **Cons:** Requires CLI familiarity. Slightly less "demo-friendly" for a portal-only audience.

### Option B: Accept portal auto-names, update knowledge-base-config.json
- **Pros:** Portal-friendly for presenters who prefer clicking.
- **Cons:** Auto-generated names are ugly (`sthealthbridgedemo2agib7`). Requires editing config JSON. Creates inconsistency between docs, config, and other guide references. Names vary per deployment — breaks reproducibility.

## Decision: Option A — Code-first creation

**Rationale:**
1. MCP and Fabric connections are already code-only (no portal path exists), so the code approach was unavoidable for 2 of 4 connections.
2. Standardizing all 4 connections via code gives a single consistent workflow.
3. The `az rest` commands are copy-paste-able and complete in ~30 seconds total.
4. Connection names remain stable across re-deployments and match all config/docs references.
5. `agent/knowledge-base-config.json` remains unchanged (no Chunk rework needed).

## Portal Naming Behavior (documented for team reference)

| What you do | Resulting connection name |
|---|---|
| Portal → Add connection → select `sthealthbridgedemo2agib7` | `sthealthbridgedemo2agib7` |
| Portal → Add connection → select `srch-healthbridge-demo` | `srch-healthbridge-demo` |
| `az rest --method PUT .../connections/healthbridge-blob-connection` | `healthbridge-blob-connection` ✅ |
| Bicep `resource ... { name: 'healthbridge-blob-connection' }` | `healthbridge-blob-connection` ✅ |

## Impact

- Guide updated to v1.2 — Step B now uses `az rest` for all connections
- `agent/knowledge-base-config.json` — **no changes needed** (names match as designed)
- Other docs referencing connection names — no changes needed

## Citations

- https://learn.microsoft.com/en-us/azure/foundry/how-to/connections-add (2026-06-19) — portal tab shows no name field
- https://github.com/microsoft-foundry/foundry-samples/blob/main/infrastructure/infrastructure-setup-bicep/01-connections/connection-storage-account.bicep — Bicep `name` property is the connection name

---

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
