# Squad Decisions

## Active Decisions

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

### Decision: Document Both Connection Creation Paths

**Author:** Mikey (Lead)  
**Date:** 2026-06-21  
**Status:** Accepted  
**Requested by:** Rob McKenna

## Context

Rob wanted both code and portal paths documented in Step B of the KB connection guide. The v1.2 guide was code-only, which is technically correct (only way to get custom names) but didn't serve presenters who prefer portal clicks for the simple connections.

## Decision

Document both paths as Option A (code-first, recommended) and Option B (portal-first, partial). Code-first stays primary because:

1. **Uniform workflow** — all 4 connections use the same method.
2. **No config edits** — `agent/knowledge-base-config.json` works as-is with the custom names.
3. **MCP + Fabric are code-only regardless** — portal-first still requires `az rest` for 2 of 4 connections, so the portal doesn't fully eliminate CLI usage.

Option B is documented as a valid alternative with explicit reconciliation instructions: exact lines (29, 51, 83) in `agent/knowledge-base-config.json` to change, plus a note about documentation-only references in `docs/azure-setup.md`, `docs/setup-guide.md`, and `agent/README.md`.

## Impact

- Guide bumped to v1.3
- `agent/knowledge-base-config.json` NOT modified (both paths documented against its current values)
- No changes to other files

---

### Decision: Foundry Connections Precondition Check — BLOCKED

**Author:** Data (Data Engineer)  
**Date:** 2026-06-22  
**Status:** BLOCKED — Foundry project does not exist  
**Requested by:** Rob McKenna

## Execution Summary

Attempted execution of Option A (code-first) from `docs/knowledge-base-connection-guide.md` to create three Foundry project connections via `az rest` (Azure Blob Storage, Azure AI Search, MCP RemoteTool).

## Precondition Check Result

The first step (A0) failed:

```
az ml workspace show --name proj-healthbridge --resource-group rg-knowledge-iq-demo
ERROR: (ResourceNotFound) The Resource 'Microsoft.MachineLearningServices/workspaces/proj-healthbridge'
under resource group 'rg-knowledge-iq-demo' was not found.
```

**The `proj-healthbridge` Foundry project has NOT been created yet.** Manual creation at `ai.azure.com` is pending.

## Connection Status

| Connection | Name | Status |
|---|---|---|
| Azure Blob Storage | `healthbridge-blob-connection` | ❌ NOT CREATED — project missing |
| Azure AI Search | `healthbridge-aisearch-connection` | ❌ NOT CREATED — project missing |
| MCP RemoteTool | `healthbridge-mcp-connection` | ❌ NOT CREATED — project missing |
| Fabric Data Agent | `healthbridge-fabric-connection` | ⚠️ PENDING — Fabric workspace not provisioned (separate blocker, skip per guide) |

## Coordinator Note: Potential Resource-Model Concern

During execution, a deeper technical issue was flagged: Option A in the guide uses CLI commands based on the **old AI Studio/hub model** (`az ml workspace`, resource type `Microsoft.MachineLearningServices/workspaces` with `kind=Hub/Project`). 

However, new Microsoft Foundry projects may use a **different resource model** (`Microsoft.CognitiveServices/accounts` with child projects), particularly in recent Azure API versions. This could mean:
- The `az ml workspace` commands in the guide may fail or return unexpected paths for new Foundry deployments
- The connection creation REST endpoint paths may differ from what the guide prescribes

**Recommendation:** Once the Foundry project is created, **verify the actual resource type and API paths empirically** (e.g., via `az rest GET /subscriptions/.../resourceGroups/rg-knowledge-iq-demo/resources?$filter=name eq 'proj-healthbridge'` or the Azure portal resource explorer) before assuming the guide's `az rest` paths are correct.

## Required Action

1. Go to **ai.azure.com** (new Microsoft Foundry portal — ensure "New Foundry" toggle is enabled).
2. Create a **new project** named exactly **`proj-healthbridge`** in resource group `rg-knowledge-iq-demo`.
3. Once created, **verify the resource type** in Azure Portal → Resource Explorer.
4. If the resource type is NOT `Microsoft.MachineLearningServices/workspaces`, or if `az rest` commands return unexpected results, escalate to Mikey (guide validation owner) for possible guide v1.4 corrections.
5. Once verified, re-run this task — all three `az rest` connection creates can proceed in under 2 minutes.

## What Remains After Project Creation & Verification

Once `proj-healthbridge` exists and resource model is confirmed:
1. **A0** — `az ml workspace show` to capture `$PROJECT_ID`
2. **A1** — Create `healthbridge-blob-connection` (AzureStorageAccount / AAD)
3. **A2** — Create `healthbridge-aisearch-connection` (CognitiveSearch / AAD)
4. **B-MCP** — Create `healthbridge-mcp-connection` (RemoteTool / None)
5. **Verify** — `az rest GET .../connections?api-version=2025-04-01-preview`

Fabric connection (`healthbridge-fabric-connection`) remains ⚠️ PENDING — no Fabric workspace provisioned yet. KB will function with the other 3 sources.

---

### Decision: New Foundry Resource Model — Empirical Discovery

**Author:** Data  
**Date:** 2026-06-22  
**Status:** Accepted  
**Requested by:** Rob McKenna

## Context

Prior history noted `proj-healthbridge` as not existing because `az ml workspace show` returned ResourceNotFound. Rob McKenna confirmed the project DOES exist — the wrong resource model was being queried. This decision records the verified correct model so Mikey can fix the setup guide.

## Findings (READ-ONLY discovery, no resources created)

### Foundry Account

| Field | Value |
|-------|-------|
| Name | `foundry-healthbridge-demo` |
| Type | `Microsoft.CognitiveServices/accounts` |
| Kind | `AIServices` |
| SKU | S0 |
| Location | eastus |
| Full Resource ID | `/subscriptions/c81fda52-936e-4f14-8af4-951c0dbb92d2/resourceGroups/rg-knowledge-iq-demo/providers/Microsoft.CognitiveServices/accounts/foundry-healthbridge-demo` |

### Project

| Field | Value |
|-------|-------|
| Name | `proj-healthbridge` |
| Type | `Microsoft.CognitiveServices/accounts/projects` |
| Kind | `AIServices` |
| Provisioning State | `Succeeded` |
| Full Resource ID | `/subscriptions/c81fda52-936e-4f14-8af4-951c0dbb92d2/resourceGroups/rg-knowledge-iq-demo/providers/Microsoft.CognitiveServices/accounts/foundry-healthbridge-demo/projects/proj-healthbridge` |

### Connections Endpoint

**Working pattern:**
```
https://management.azure.com/subscriptions/c81fda52-936e-4f14-8af4-951c0dbb92d2/resourceGroups/rg-knowledge-iq-demo/providers/Microsoft.CognitiveServices/accounts/foundry-healthbridge-demo/projects/proj-healthbridge/connections?api-version=2025-04-01-preview
```

**API version results:**

| api-version | Result |
|-------------|--------|
| `2025-04-01-preview` | ✅ 200 OK |
| `2025-06-01` | ✅ 200 OK |
| `2025-10-01-preview` | ✅ 200 OK |
| `2024-10-01-preview` | ❌ NoRegisteredProviderFound |
| `2025-01-01-preview` | ❌ NoRegisteredProviderFound |

All supported api-versions per ARM: `2025-04-01-preview, 2025-06-01, 2025-07-01-preview, 2025-09-01, 2025-10-01-preview, 2025-12-01, 2026-01-15-preview, 2026-03-01, 2026-03-15-preview, 2026-05-01, 2026-05-15-preview`

Account-level connections also work: `<ACCOUNT_ID>/connections?api-version=2025-04-01-preview`

### Existing Connections on proj-healthbridge

| Name | Category | AuthType | Target |
|------|----------|----------|--------|
| `srch-healthbridge-connection` | CognitiveSearch | ApiKey | `https://srch-healthbridge-demo.search.windows.net` |
| `msf-demo-appinsights-8417` | AppInsights | ApiKey | `/subscriptions/.../ms-foundry-demo-rg/.../msf-demo-appinsights` |
| `sthealthbridgedemo2ag633uyd` | AzureStorageAccount | AAD | `https://sthealthbridgedemo2agib7.blob.core.windows.net/` |

### Correct Verify-Project Commands (replaces `az ml workspace show`)

```powershell
# Option 1 — show the project resource directly
az resource show `
  --ids "/subscriptions/c81fda52-936e-4f14-8af4-951c0dbb92d2/resourceGroups/rg-knowledge-iq-demo/providers/Microsoft.CognitiveServices/accounts/foundry-healthbridge-demo/projects/proj-healthbridge" `
  --api-version 2025-04-01-preview

# Option 2 — show the parent Foundry account
az cognitiveservices account show -g rg-knowledge-iq-demo -n foundry-healthbridge-demo

# Option 3 — list connections (proves project is live and accessible)
az rest --method GET `
  --url "https://management.azure.com/subscriptions/c81fda52-936e-4f14-8af4-951c0dbb92d2/resourceGroups/rg-knowledge-iq-demo/providers/Microsoft.CognitiveServices/accounts/foundry-healthbridge-demo/projects/proj-healthbridge/connections?api-version=2025-04-01-preview"
```

## Decision

1. **Retire `az ml workspace show`** from the guide — it is categorically wrong for new Foundry.
2. **Use `Microsoft.CognitiveServices/accounts` (kind=AIServices)** as the canonical resource type for all guide references to the Foundry account.
3. **Use `Microsoft.CognitiveServices/accounts/projects`** for project references.
4. **Use `api-version=2025-04-01-preview`** as the minimum recommended api-version for connections REST calls (stable and supported).
5. **Use `az resource show --ids <PROJ_ID> --api-version 2025-04-01-preview`** as the project verification command.
6. The MCP and Blob Storage connections still need to be created under `proj-healthbridge`. The AI Search and Storage connections already exist.

---

### Decision: Foundry Resource Model — CognitiveServices, Not MLServices

**Author:** Mikey (Lead)  
**Date:** 2026-06-22  
**Status:** Accepted  
**Requested by:** Rob McKenna (Data performed empirical verification)

## Context

The KB connection guide (v1.0–v1.3) used `Microsoft.MachineLearningServices/workspaces` as the project resource type and `az ml workspace show` to get the project ID. Data performed empirical verification against the live Azure resources and discovered the project is actually a `Microsoft.CognitiveServices/accounts/projects` resource under a CognitiveServices account.

## Key Facts (empirically verified)

| Property | Value |
|---|---|
| Foundry account | `foundry-healthbridge-demo` |
| Account type | `Microsoft.CognitiveServices/accounts` (kind: AIServices) |
| Project | `proj-healthbridge` |
| Project type | `Microsoft.CognitiveServices/accounts/projects` |
| Connections API | `https://management.azure.com<PROJECT_ID>/connections?api-version=2025-04-01-preview` |
| Managed identity | System-assigned, on the ACCOUNT (not the project sub-resource) |
| Existing Blob connection | `sthealthbridgedemo2ag633uyd` (AAD auth) |
| Existing Search connection | `srch-healthbridge-connection` (ApiKey auth) |

## Decision

1. **All documentation and CLI commands must use CognitiveServices resource paths** — never MachineLearningServices.
2. **The correct `az` command to inspect the account** is `az cognitiveservices account show`, not `az ml workspace show`.
3. **Managed identity RBAC targets the account** (`foundry-healthbridge-demo`), not the project.
4. **Existing connections are functional** — Rob can either create new custom-named connections (Option A) or use the existing auto-named ones (Option B, requires config edit).

## Impact

- `docs/knowledge-base-connection-guide.md` updated to v1.4
- `docs/azure-setup.md` and `docs/setup-guide.md` flagged with caution notes (full rewrite deferred)
- `agent/knowledge-base-config.json` NOT modified (documented reconciliation only)
- All future guides/scripts must use CognitiveServices paths

## Action for Rob

**Immediate:** Run only the MCP connection creation command from Step B-MCP (the only missing connection). Then decide Option A vs B for blob/search naming reconciliation.

---

### Decision: Foundry connection create payload pattern on Windows

**Author:** Data  
**Date:** 2026-07-07T03:51:25.125-04:00  
**Requested by:** Rob McKenna

## Decision

For Windows-based execution, create Foundry project connections with `az rest` using `--body "@<json-file>"` (UTF-8, no BOM) instead of inline JSON strings in PowerShell.

## Why

Inline JSON bodies repeatedly failed with `Unsupported Media Type` / `unable to deserialize request body` against `Microsoft.CognitiveServices/accounts/projects/connections`. File-based JSON payload succeeded immediately and created `healthbridge-mcp-connection` correctly.

## Impact

- Improves reliability of repeatable connection automation for Data role workflows.
- Should be reflected in team runbooks/scripts where PowerShell is the execution shell.

---

### Decision: Connection name mismatch resolved via custom-name creation

**Author:** Data  
**Date:** 2026-07-07T04:05:39.100-04:00  
**Requested by:** Rob McKenna

## Decision
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

### Decision: Document Both Connection Creation Paths

**Author:** Mikey (Lead)  
**Date:** 2026-06-21  
**Status:** Accepted  
**Requested by:** Rob McKenna

## Context

Rob wanted both code and portal paths documented in Step B of the KB connection guide. The v1.2 guide was code-only, which is technically correct (only way to get custom names) but didn't serve presenters who prefer portal clicks for the simple connections.

## Decision

Document both paths as Option A (code-first, recommended) and Option B (portal-first, partial). Code-first stays primary because:

1. **Uniform workflow** — all 4 connections use the same method.
2. **No config edits** — `agent/knowledge-base-config.json` works as-is with the custom names.
3. **MCP + Fabric are code-only regardless** — portal-first still requires `az rest` for 2 of 4 connections, so the portal doesn't fully eliminate CLI usage.

Option B is documented as a valid alternative with explicit reconciliation instructions: exact lines (29, 51, 83) in `agent/knowledge-base-config.json` to change, plus a note about documentation-only references in `docs/azure-setup.md`, `docs/setup-guide.md`, and `agent/README.md`.

## Impact

- Guide bumped to v1.3
- `agent/knowledge-base-config.json` NOT modified (both paths documented against its current values)
- No changes to other files

---

### Decision: Foundry Connections Precondition Check — BLOCKED

**Author:** Data (Data Engineer)  
**Date:** 2026-06-22  
**Status:** BLOCKED — Foundry project does not exist  
**Requested by:** Rob McKenna

## Execution Summary

Attempted execution of Option A (code-first) from `docs/knowledge-base-connection-guide.md` to create three Foundry project connections via `az rest` (Azure Blob Storage, Azure AI Search, MCP RemoteTool).

## Precondition Check Result

The first step (A0) failed:

```
az ml workspace show --name proj-healthbridge --resource-group rg-knowledge-iq-demo
ERROR: (ResourceNotFound) The Resource 'Microsoft.MachineLearningServices/workspaces/proj-healthbridge'
under resource group 'rg-knowledge-iq-demo' was not found.
```

**The `proj-healthbridge` Foundry project has NOT been created yet.** Manual creation at `ai.azure.com` is pending.

## Connection Status

| Connection | Name | Status |
|---|---|---|
| Azure Blob Storage | `healthbridge-blob-connection` | ❌ NOT CREATED — project missing |
| Azure AI Search | `healthbridge-aisearch-connection` | ❌ NOT CREATED — project missing |
| MCP RemoteTool | `healthbridge-mcp-connection` | ❌ NOT CREATED — project missing |
| Fabric Data Agent | `healthbridge-fabric-connection` | ⚠️ PENDING — Fabric workspace not provisioned (separate blocker, skip per guide) |

## Coordinator Note: Potential Resource-Model Concern

During execution, a deeper technical issue was flagged: Option A in the guide uses CLI commands based on the **old AI Studio/hub model** (`az ml workspace`, resource type `Microsoft.MachineLearningServices/workspaces` with `kind=Hub/Project`). 

However, new Microsoft Foundry projects may use a **different resource model** (`Microsoft.CognitiveServices/accounts` with child projects), particularly in recent Azure API versions. This could mean:
- The `az ml workspace` commands in the guide may fail or return unexpected paths for new Foundry deployments
- The connection creation REST endpoint paths may differ from what the guide prescribes

**Recommendation:** Once the Foundry project is created, **verify the actual resource type and API paths empirically** (e.g., via `az rest GET /subscriptions/.../resourceGroups/rg-knowledge-iq-demo/resources?$filter=name eq 'proj-healthbridge'` or the Azure portal resource explorer) before assuming the guide's `az rest` paths are correct.

## Required Action

1. Go to **ai.azure.com** (new Microsoft Foundry portal — ensure "New Foundry" toggle is enabled).
2. Create a **new project** named exactly **`proj-healthbridge`** in resource group `rg-knowledge-iq-demo`.
3. Once created, **verify the resource type** in Azure Portal → Resource Explorer.
4. If the resource type is NOT `Microsoft.MachineLearningServices/workspaces`, or if `az rest` commands return unexpected results, escalate to Mikey (guide validation owner) for possible guide v1.4 corrections.
5. Once verified, re-run this task — all three `az rest` connection creates can proceed in under 2 minutes.

## What Remains After Project Creation & Verification

Once `proj-healthbridge` exists and resource model is confirmed:
1. **A0** — `az ml workspace show` to capture `$PROJECT_ID`
2. **A1** — Create `healthbridge-blob-connection` (AzureStorageAccount / AAD)
3. **A2** — Create `healthbridge-aisearch-connection` (CognitiveSearch / AAD)
4. **B-MCP** — Create `healthbridge-mcp-connection` (RemoteTool / None)
5. **Verify** — `az rest GET .../connections?api-version=2025-04-01-preview`

Fabric connection (`healthbridge-fabric-connection`) remains ⚠️ PENDING — no Fabric workspace provisioned yet. KB will function with the other 3 sources.

Use Option A in the live project: create custom-named Foundry connections `healthbridge-blob-connection` and `healthbridge-aisearch-connection` so runtime state matches `agent/knowledge-base-config.json` without config edits.

## Result

- Name mismatch blocker is cleared.
- `agent/knowledge-base-config.json` remains unchanged and now aligns with project connections for Blob, AI Search, and MCP.
- Remaining blocker is only Fabric prerequisites (`healthbridge-fabric-connection` not yet creatable until Fabric workspace/data agent inputs are available).
### Decision: New Foundry Resource Model — Empirical Discovery

**Author:** Data  
**Date:** 2026-06-22  
**Status:** Accepted  
**Requested by:** Rob McKenna

## Context

Rob reported that `docs/knowledge-base-connection-guide.md` (authored by Chunk) contained instructions that "don't appear to be accurate" — suspected of describing the old/classic Foundry UI rather than the current Microsoft Foundry portal.

## Validation Outcome

**Confirmed: The guide contained multiple BLOCKER and MAJOR inaccuracies.** Independent review against current Microsoft Learn docs (June 2026) revealed the guide was mixing current Foundry IQ architecture with fictional UI patterns that don't exist in the current portal.

## Key Findings

### 1. MCP Server as Knowledge Source — VALID but DIFFERENT from described

- https://learn.microsoft.com/en-us/azure/foundry/how-to/connections-add (2026-06-19)
**Date:** 2026-06-21  
- https://learn.microsoft.com/en-us/azure/foundry/how-to/connections-add (2026-06-19) — portal tab shows no name field
**Date:** 2026-06-21  
**Date:** 2026-06-22  
**Date:** 2026-06-22  
**Date:** 2026-06-22  
**Date:** 2026-07-07T03:51:25.125-04:00  
**Date:** 2026-07-07T04:05:39.100-04:00

---

# PR Review Round 1 — Mikey (Lead)

**Date:** 2026-07-09  
**Reviewer:** Mikey (Lead)  
**Requested by:** Rob McKenna  
**Scope:** All 5 open PRs (#13, #14, #15, #16, #17)

---

## Verdict Summary

| PR | Title | Verdict | Blocking Issues |
|---|---|---|---|
| #13 | docs: finalize demo script v1.1 — timings, presenter notes, fallbacks | **REQUEST CHANGES** | Quick-reference card uses Marcus Hartwell narrative; must be updated to Sarah Nguyen |
| #14 | data: create payor-knowledge-base and wire knowledge sources | **REQUEST CHANGES** | knowledge-base-config.json has wrong KB name (healthbridge-knowledge-base vs payor-knowledge-base) |
| #15 | docs: demo readiness checklist and sign-off sheet | **REQUEST CHANGES (minor)** | Wrong demo duration (45 min vs 5 min); wrong member ID in MCP verification command |
| #16 | feat: deploy HealthBridge assistant agent (#4) | **APPROVED** | None — all checks pass |
| #17 | docs: finalize demo script and presenter notes (#10) | **REQUEST CHANGES** | EOB math error in Act 2 (30% of $16,700 ≠ $2,154); celecoxib Tier 1 in reference table (should be Tier 2) |

---

## Detailed Findings

### PR #13 — Request Changes

**Branch:** `squad/10-finalize-the-demo-script-and-presenter-notes`

The PR adds `assets/presenter/quick-reference-card.md`, which is a well-structured presenter artifact, but it is built around the **Marcus Hartwell** (MBR-2024-001234, PPO Gold) narrative. The demo standard has moved to **Sarah Nguyen** (MBR-2024-002891, HMO Silver, knee replacement). Merging as-is creates a critical narrative inconsistency between the quick-reference card and the demo script.

Additionally, the PR title claims it updates `docs/demo-script.md` to v1.1 but that file is not in the diff (the demo script was committed to main via other means). The PR body is misleading.

**PR #13 vs PR #17 overlap assessment:** PR #13 is NOT fully superseded by PR #17. PR #17 does not add the presenter quick-reference card or the assets scaffolding (assets/README.md, assets/screenshots/README.md). These assets are unique to PR #13 and are valuable for the demo. However, their content (Marcus Hartwell narrative) must be updated to Sarah Nguyen before merging. Recommendation: **do not close #13** — fix the narrative alignment and merge.

**Required fixes:**
- Update `assets/presenter/quick-reference-card.md` to Sarah Nguyen 5-Act narrative
- Replace MBR-2024-001234 with MBR-2024-002891 throughout
Prior history noted `proj-healthbridge` as not existing because `az ml workspace show` returned ResourceNotFound. Rob McKenna confirmed the project DOES exist — the wrong resource model was being queried. This decision records the verified correct model so Mikey can fix the setup guide.

## Findings (READ-ONLY discovery, no resources created)

### Foundry Account

| Field | Value |
|-------|-------|
| Name | `foundry-healthbridge-demo` |
| Type | `Microsoft.CognitiveServices/accounts` |
| Kind | `AIServices` |
| SKU | S0 |
| Location | eastus |
| Full Resource ID | `/subscriptions/c81fda52-936e-4f14-8af4-951c0dbb92d2/resourceGroups/rg-knowledge-iq-demo/providers/Microsoft.CognitiveServices/accounts/foundry-healthbridge-demo` |

### Project

| Field | Value |
|-------|-------|
| Name | `proj-healthbridge` |
| Type | `Microsoft.CognitiveServices/accounts/projects` |
| Kind | `AIServices` |
| Provisioning State | `Succeeded` |
| Full Resource ID | `/subscriptions/c81fda52-936e-4f14-8af4-951c0dbb92d2/resourceGroups/rg-knowledge-iq-demo/providers/Microsoft.CognitiveServices/accounts/foundry-healthbridge-demo/projects/proj-healthbridge` |

### Connections Endpoint

**Working pattern:**
```
https://management.azure.com/subscriptions/c81fda52-936e-4f14-8af4-951c0dbb92d2/resourceGroups/rg-knowledge-iq-demo/providers/Microsoft.CognitiveServices/accounts/foundry-healthbridge-demo/projects/proj-healthbridge/connections?api-version=2025-04-01-preview
```

**API version results:**

| api-version | Result |
|-------------|--------|
| `2025-04-01-preview` | ✅ 200 OK |
| `2025-06-01` | ✅ 200 OK |
| `2025-10-01-preview` | ✅ 200 OK |
| `2024-10-01-preview` | ❌ NoRegisteredProviderFound |
| `2025-01-01-preview` | ❌ NoRegisteredProviderFound |

All supported api-versions per ARM: `2025-04-01-preview, 2025-06-01, 2025-07-01-preview, 2025-09-01, 2025-10-01-preview, 2025-12-01, 2026-01-15-preview, 2026-03-01, 2026-03-15-preview, 2026-05-01, 2026-05-15-preview`

Account-level connections also work: `<ACCOUNT_ID>/connections?api-version=2025-04-01-preview`

### Existing Connections on proj-healthbridge

| Name | Category | AuthType | Target |
|------|----------|----------|--------|
| `srch-healthbridge-connection` | CognitiveSearch | ApiKey | `https://srch-healthbridge-demo.search.windows.net` |
| `msf-demo-appinsights-8417` | AppInsights | ApiKey | `/subscriptions/.../ms-foundry-demo-rg/.../msf-demo-appinsights` |
| `sthealthbridgedemo2ag633uyd` | AzureStorageAccount | AAD | `https://sthealthbridgedemo2agib7.blob.core.windows.net/` |

### Correct Verify-Project Commands (replaces `az ml workspace show`)

```powershell
# Option 1 — show the project resource directly
az resource show `
  --ids "/subscriptions/c81fda52-936e-4f14-8af4-951c0dbb92d2/resourceGroups/rg-knowledge-iq-demo/providers/Microsoft.CognitiveServices/accounts/foundry-healthbridge-demo/projects/proj-healthbridge" `
  --api-version 2025-04-01-preview

# Option 2 — show the parent Foundry account
az cognitiveservices account show -g rg-knowledge-iq-demo -n foundry-healthbridge-demo

# Option 3 — list connections (proves project is live and accessible)
az rest --method GET `
  --url "https://management.azure.com/subscriptions/c81fda52-936e-4f14-8af4-951c0dbb92d2/resourceGroups/rg-knowledge-iq-demo/providers/Microsoft.CognitiveServices/accounts/foundry-healthbridge-demo/projects/proj-healthbridge/connections?api-version=2025-04-01-preview"
```

## Decision

1. **Retire `az ml workspace show`** from the guide — it is categorically wrong for new Foundry.
2. **Use `Microsoft.CognitiveServices/accounts` (kind=AIServices)** as the canonical resource type for all guide references to the Foundry account.
3. **Use `Microsoft.CognitiveServices/accounts/projects`** for project references.
4. **Use `api-version=2025-04-01-preview`** as the minimum recommended api-version for connections REST calls (stable and supported).
5. **Use `az resource show --ids <PROJ_ID> --api-version 2025-04-01-preview`** as the project verification command.
6. The MCP and Blob Storage connections still need to be created under `proj-healthbridge`. The AI Search and Storage connections already exist.

---

### Decision: Foundry Resource Model — CognitiveServices, Not MLServices

**Author:** Mikey (Lead)  
**Date:** 2026-06-22  
**Status:** Accepted  
**Requested by:** Rob McKenna (Data performed empirical verification)

## Context

The KB connection guide (v1.0–v1.3) used `Microsoft.MachineLearningServices/workspaces` as the project resource type and `az ml workspace show` to get the project ID. Data performed empirical verification against the live Azure resources and discovered the project is actually a `Microsoft.CognitiveServices/accounts/projects` resource under a CognitiveServices account.

## Key Facts (empirically verified)

| Property | Value |
|---|---|
| Foundry account | `foundry-healthbridge-demo` |
| Account type | `Microsoft.CognitiveServices/accounts` (kind: AIServices) |
| Project | `proj-healthbridge` |
| Project type | `Microsoft.CognitiveServices/accounts/projects` |
| Connections API | `https://management.azure.com<PROJECT_ID>/connections?api-version=2025-04-01-preview` |
| Managed identity | System-assigned, on the ACCOUNT (not the project sub-resource) |
| Existing Blob connection | `sthealthbridgedemo2ag633uyd` (AAD auth) |
| Existing Search connection | `srch-healthbridge-connection` (ApiKey auth) |

## Decision

1. **All documentation and CLI commands must use CognitiveServices resource paths** — never MachineLearningServices.
2. **The correct `az` command to inspect the account** is `az cognitiveservices account show`, not `az ml workspace show`.
3. **Managed identity RBAC targets the account** (`foundry-healthbridge-demo`), not the project.
4. **Existing connections are functional** — Rob can either create new custom-named connections (Option A) or use the existing auto-named ones (Option B, requires config edit).

## Impact

- `docs/knowledge-base-connection-guide.md` updated to v1.4
- `docs/azure-setup.md` and `docs/setup-guide.md` flagged with caution notes (full rewrite deferred)
- `agent/knowledge-base-config.json` NOT modified (documented reconciliation only)
- All future guides/scripts must use CognitiveServices paths

## Action for Rob

**Immediate:** Run only the MCP connection creation command from Step B-MCP (the only missing connection). Then decide Option A vs B for blob/search naming reconciliation.

---

### Decision: Foundry connection create payload pattern on Windows

**Author:** Data  
**Date:** 2026-07-07T03:51:25.125-04:00  
**Requested by:** Rob McKenna

## Decision

For Windows-based execution, create Foundry project connections with `az rest` using `--body "@<json-file>"` (UTF-8, no BOM) instead of inline JSON strings in PowerShell.

## Why

Inline JSON bodies repeatedly failed with `Unsupported Media Type` / `unable to deserialize request body` against `Microsoft.CognitiveServices/accounts/projects/connections`. File-based JSON payload succeeded immediately and created `healthbridge-mcp-connection` correctly.

## Impact

- Improves reliability of repeatable connection automation for Data role workflows.
- Should be reflected in team runbooks/scripts where PowerShell is the execution shell.

---

### Decision: Connection name mismatch resolved via custom-name creation

**Author:** Data  
**Date:** 2026-07-07T04:05:39.100-04:00  
**Requested by:** Rob McKenna

## Decision

Use Option A in the live project: create custom-named Foundry connections `healthbridge-blob-connection` and `healthbridge-aisearch-connection` so runtime state matches `agent/knowledge-base-config.json` without config edits.

### PR #14 — Request Changes

**Branch:** `squad/3-create-knowledge-base-and-wire-data-sources`

Overall solid execution. The KB was created correctly as `payor-knowledge-base`, smoke tests passed, RBAC is correct, embedding model is `text-embedding-3-small`/1536 dims (consistent with decisions.md), and all three index names are correct. Managed identity auth used for Blob and OpenAI connections (policy compliant).

**Issue 1 (required):** `agent/knowledge-base-config.json` has `"name": "healthbridge-knowledge-base"` but the live KB is `payor-knowledge-base`. This will cause future operators to create a differently-named KB that breaks the agent's MCP endpoint URL.  
Fix: `healthbridge-knowledge-base` → `payor-knowledge-base` in the config.

**Issue 2 (tech debt, document only):** `healthbridge-blob-connection` knowledge source has 0 indexed docs due to OAI endpoint mismatch during creation (used `healthbridge-demo.openai.azure.com` instead of `foundry-healthbridge-demo.openai.azure.com`). Documented in `docs/connection-status.md`. The `healthcare-payor-docs-source` (AI Search, 45 docs) covers the same content as interim fallback. Fix requires delete+recreate of the blob knowledge source with the correct `resourceUri`. Track as a follow-up issue.

**Architecture alignment verification:**
- Managed identity ✅ (decisions.md requirement)
- text-embedding-3-small / 1536 dims ✅ (decisions.md: must not be changed)
- healthcare-payor-docs, healthbridge-formulary-index, healthbridge-provider-index ✅
- payor-knowledge-base (live) ✅ (but config.json still wrong)

---

### PR #15 — Request Changes (Minor)

**Branch:** `squad/7-demo-readiness-checklist`

Well-structured readiness checklist. All 5 Acts covered with test prompts and expected data source citations. Fallback procedures present (4 scenarios). Sign-off matrix present with owner accountability columns. Fabric blocked flagged correctly.

**Issue 1 (required):** Overview states "demo is ~45 minutes" — this is the old Marcus Hartwell full-session duration. The Sarah Nguyen demo is 5 minutes live + 2-3 min Q&A.

**Issue 2 (required):** MCP sample data verification checks `MBR-2024-001234` (Marcus Hartwell). The demo uses Sarah Nguyen (`MBR-2024-002891`). If Sarah's data were missing from the MCP server, this check would not catch it.
## Result

- Name mismatch blocker is cleared.
- `agent/knowledge-base-config.json` remains unchanged and now aligns with project connections for Blob, AI Search, and MCP.
- Remaining blocker is only Fabric prerequisites (`healthbridge-fabric-connection` not yet creatable until Fabric workspace/data agent inputs are available).

---

### PR #16 — APPROVED

**Branch:** `squad/4-deploy-healthbridge-agent`

All deliverables verified:

**agent-definition.json:**
- MCP URL fix (`?api-version=2026-05-01-preview` added) ✅
- Contact info: 1-800-555-BLUE, HealthBridge.example.com ✅

**Guardrail coverage (all required categories):**
- Jailbreak: G-6 ✅
- Medical advice (direct): G-1 ✅ / (indirect): G-2 ✅
- PHI bulk disclosure: G-3 ✅ / cross-member: G-9 ✅
- Hallucination trap: G-7 ✅
- All 12 prompts have Pass/Fail criteria ✅

**Celecoxib PH-7 — verified against sample data (FRM-2026-0011):**
- Tier 2: ✅ (sample data: tier=2)
- $45 retail / $110 mail order: ✅ (sample data exact match)
- No PA required: ✅ (requiresPriorAuth=false)
- No deductible: ✅ (deductibleApplies=false)
- Citation FRM-2026-0011: ✅

**Minor annotation (non-blocking):** PH-7 expected response labels it "Tier 2 — Preferred Brand" but sample data says `tierDescription: "Non-Preferred Generic"`. Pass criteria only checks "Tier 2 stated" so tests pass, but the descriptor is slightly misleading. Consider correcting in a follow-up.

---

### PR #17 — Request Changes

**Branch:** `squad/10-demo-script`

Strong 5-Act structure, excellent Sarah Nguyen narrative, realistic timing (~5.9 min). Two critical factual errors must be fixed before merge.

**Issue 1 — EOB Math Error (CRITICAL):**

In Act 2 presenter script: *"So: $1,500 deductible, then 30% of the remaining $16,700 — that's $2,154."*

Verified against CLM-2026-0061872:
- memberDeductible: $1,500 ✅
- memberCoinsurance: $2,154 ✅ (the number is right)
- but 30% × $16,700 = $5,010, NOT $2,154 ❌

The presented math is wrong. The actual coinsurance rate is ~12.9% of the post-deductible amount. A healthcare benefits manager will catch this. Fix: remove the erroneous percentage explanation. Just state the dollar amounts the agent returned without narrating incorrect math.

**Issue 2 — Celecoxib Reference Table (CRITICAL):**

The "Data Reference" table at the bottom of demo-script.md lists:
- Celecoxib Tier: "Tier 1 (Preferred Generic)" ❌
- Celecoxib Copay: "$10–$20 (~$10 for Tier 1)" ❌

Actual sample data (FRM-2026-0011):
- tier: 2, tierDescription: "Non-Preferred Generic"
- retailCopay30Day: $45, mailOrderCopay90Day: $110

This contradicts Act 4 of the same script (which correctly states Tier 2, $45) and PR #16's PH-7 test prompt. Fix: update reference table to Tier 2, $45 retail / $110 mail order.

**Issue 3 — Fabric fallback (minor):**
Acts 1 and 2 cite Fabric Data Agent as primary source (blocked ⚠️). Add inline fallback callouts at the top of Acts 1 and 2.

---

## Cross-PR Notes

1. **PRs #16 and #17 share agent files** (agent-definition.json, system-prompt-portal.txt, guardrails, pharmacy-formulary, agent-deployment-guide, demo-readiness-checklist). If both merge, there's potential for conflict. Recommend merging #16 first, then rebasing #17.

2. **PRs #13 and #17 both address Issue #10** (demo script). After #13 is updated to Sarah Nguyen, coordinate merge order to avoid demo-script.md conflicts.

3. **PR #14 is a prerequisite for PR #16/17** (the KB must exist for agent wiring). PR #14 has one required fix (config name) — should be resolved first.

---

## Recommended Merge Order

1. PR #14 (after config name fix) — KB must be solid before agent work
2. PR #16 (approved, no blockers) — agent deployment
3. PR #15 (after minor fixes) — readiness checklist
4. PR #17 (after math + reference table fixes) — demo script
5. PR #13 (after narrative update to Sarah Nguyen) — presenter assets

