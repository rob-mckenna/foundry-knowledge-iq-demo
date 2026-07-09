# Chunk — History (Summarized 2026-07-09)

## Project Context
- **Project:** foundry-knowledge-iq-demo — Demo of Knowledge IQ in Azure AI Foundry for a healthcare payor
- **Stack:** Azure AI Foundry, AI Search, Blob Storage, Fabric Data Agent, MCP
- **User:** Rob McKenna

## Current Status (2026-07-09)

**Completed Work:**
- ✅ System prompt + KB config + 30 test prompts (5 workflows × 6 prompts each)
- ✅ Demo narrative (5-act Sarah Nguyen story arc)
- ✅ Agent deployment guide + agent-definition.json (PR #16)
- ✅ Guardrail coverage (17 edge-case prompts with pass/fail criteria)
- ✅ 30 prompts validated; 2 bugs fixed (member name, brand contact); 2 issues filed (#11, #12)

**Blockers:**
- ⏳ Issue #12: Chunk must add test prompt PH-7 to pharmacy-formulary.md (Data resolved the index issue)
- ⏳ Fabric workspace not provisioned → Fabric data agent connection blocked

**Next:** Add PH-7 prompt; verify agent in Foundry Playground.

## Key Technical Decisions

- **Agent name:** `healthbridge-assistant` with 5 capability areas (benefits, claims, prior auth, pharmacy, providers)
- **Test prompt strategy:** 30 structured test cases anchored to real synthetic data (member IDs, claim IDs, provider NPIs); each includes expected data sources and response characteristics
- **Demo narrative:** 5-act story (member post-surgical journey through eligibility → claims → pharmacy → provider lookup) outperforms category-by-category demos
- **Guardrail coverage:** 17 edge-case prompts covering medical advice refusal, jailbreak/injection, PHI privacy, out-of-scope deflection, unanswerable queries, member distress
- **MCP tool routing:** 7 tools documented in system prompt with "when to use" guidance
## 2026-07-09 — Issue #4: Agent Deployment Fixes

**Task:** Deploy the HealthBridge assistant agent (Issue #4) — create from project assets, attach KB, verify Playground.

**Findings before deploying:**
- `agent/agent-definition.json` was missing entirely (referenced in `docs/demo-flow.md` but never created)
- `knowledge-base-config.json` KB name was `healthbridge-knowledge-base` — inconsistent with `payor-knowledge-base` used everywhere else; this would cause the agent's KB MCP endpoint URL to 404
- MCP `serverUrl` was still `http://localhost:3000` — leftover dev placeholder, never updated to live Container App URL
- README navigation paths and embedding model reference were still the old/inaccurate values from v1.0 (pre-validation)

**Changes made:**
1. Created `agent/agent-definition.json` — importable agent definition with agent ID, model, instructions, and KB MCP tool wired to `payor-knowledge-base`
2. Fixed `knowledge-base-config.json`: KB name → `payor-knowledge-base`; MCP server URL → live Container App; removed stale dev-mode note
3. Updated `agent/README.md`: corrected Foundry nav paths, embedding model, KB name, added import-first workflow, replaced invented retrieval step with practical Playground smoke-test

**Remaining gap:** Fabric Data Agent `<FABRIC_WORKSPACE_ID>` placeholder — outside Chunk's scope; KB works with the three non-Fabric sources.

**Decision filed:** `.squad/decisions/inbox/chunk-agent-deployment-fixes.md`

---

## Learnings

1. **Healthcare payor demos:** "Explain my EOB" is the highest-value prompt category; always include member-specific context to show the agent isn't returning generic policy text
2. **Test prompt completeness:** Guardrail prompts must have 3 parts: (1) adversarial input, (2) expected behavior, (3) explicit pass/fail criteria — these make prompts usable as regression tests, not just examples
3. **Prompt grounding:** All test prompts must reference actual synthetic data (real member IDs, claim amounts, drug names) so the agent has retrievable ground truth for every scenario
4. **System prompt:** Must include tool routing guidance + guardrail boundaries; implicit guardrails are insufficient for healthcare domain

## Cross-Team Dependencies

- **Data:** 7-tool MCP server live; 3 AI Search indexes live; all endpoints verified
- **Mouth:** 48 sample healthcare payor data files created; all brand standardized to "HealthBridge Insurance Plan"
- **Mikey:** KB connection guide v1.4 validated; Foundry resource model verified; routing automation fixed
- **Alignment:** KB config references all data sources by exact name; agent config aligned with deployed infrastructure

## Files Created/Modified

- `agent/system-prompt.md` — HealthBridge Assistant definition + 7 MCP tools + guardrails + contact info
- `agent/knowledge-base-config.json` — 5 data sources (Blob, AI Search ×2, MCP, Fabric placeholder)
- `agent/agent-definition.json` — importable agent with KB MCP tool wired to payor-knowledge-base
- `agent/test-prompts/*.md` — 30 prompts across 5 workflows + 17 guardrail edge-cases
- `docs/agent-deployment-guide.md` — standalone operator guide for agent deployment
- `agent/README.md` — Foundry setup steps + troubleshooting

## Round 2 Updates (2026-07-09)

**Completed:**
- ✅ Added celecoxib test prompt PH-7 to agent/test-prompts/pharmacy-formulary.md (Issue #9)
- ✅ Added pass/fail criteria to all 12 guardrail prompts v1.1 (Issue #12)
- ✅ Changes staged in PR #16

**Status:** Ready for agent validation in Foundry Playground

## Cross-Team Updates (2026-06-05)

**From Mikey (Lead):** Demo architecture finalized: four-source Knowledge Base (MCP, AI Search, Fabric, Blob) supporting five payor workflows (eligibility, prior auth, formulary, claims, provider network). Each source must be independently demoable. Your agent fits perfectly; system prompt aligns well with demo goals.

**From Mouth (Domain Content):** Created 14 sample healthcare payor data files (claims, members, providers, policies, benefits) with consistent IDs (MBR-*, NPI-*, CLM-*, PA-*) across all sources. Brand: HealthBridge Insurance Plan. IL HMO focus. Ready for knowledge base population.

**Expansion Phase (2026-06-05):**
- **Data (MCP Server):** Built 7-tool MCP server with HTTP transport, passed 33 tests. System prompt "Available Tools" section documents all 7 tools. KB config references exact tool names — alignment verified.
- **Mouth (Sample Data Expansion):** Expanded to 8 members, 8 claims, 7 providers, 10 formulary drugs, 6 benefit summaries. All test prompts (30 total) now reference real synthetic data with ground truth. Member ID format (MBR-2024-XXXXXX) corrected in prompts.
- **Data (AI Search):** Three-index split finalized. Chunk's KB config uses all three by name; both sides aligned. Embedding model: text-embedding-3-small / 1536 dimensions (corrected from 3072).
- **Mouth (Brand):** All 48 files standardized to "HealthBridge Insurance Plan." System prompt updated to match brand + contact details (1-800-555-BLUE, HealthBridge.example.com).

**From Data (Data Engineer):** Scaffolded all four data source configs. Your agent's knowledge base config references all sources. Data distribution plan: JSON for MCP/Fabric, documents/markdown for Blob/AI Search. Ready for knowledge base assembly and prompt testing.

## Azure Deployment Complete (2026-06-21)

**Data Engineer deployed all Azure resources and populated data sources.**

Live endpoints for Foundry Knowledge Base wiring:

| Resource | Endpoint / Details |
|---|---|
| **MCP Server** | `https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io` (POST `/mcp`, health check at `/health`) |
| **AI Search — Docs** | `srch-healthbridge-demo.search.windows.net` / `healthcare-payor-docs` (45 documents) |
| **AI Search — Formulary** | `srch-healthbridge-demo.search.windows.net` / `healthbridge-formulary-index` (10 records) |
| **AI Search — Providers** | `srch-healthbridge-demo.search.windows.net` / `healthbridge-provider-index` (7 records) |
| **Blob Storage** | `sthealthbridgedemo2agib7.blob.core.windows.net` / `healthcare-docs` (45 sample files, private) |
| **Azure OpenAI** | `oai-healthbridge-demo.openai.azure.com` (embedding model: `text-embedding-3-small`, 1536 dims) |

All 45 healthcare payor documents uploaded and indexed; MCP server live with full tool suite (7 tools, 33 passing tests). Agent's KB config embedding model already aligned to 1536 dims. Ready for Foundry project creation and data source connection.

### 2026-06-21 — Knowledge Base Connection Guide authored

- Authored `docs/knowledge-base-connection-guide.md` — a click-by-click operator guide for wiring `payor-knowledge-base` in Microsoft Foundry after the completed Azure deployment.
- **Key wiring facts preserved in the guide:**
  - All connections use **managed identity (Entra RBAC)** — key auth is disabled by Azure Policy on Storage and OpenAI.
  - Four required RBAC roles: Search Index Data Reader + Search Service Contributor on `srch-healthbridge-demo`; Storage Blob Data Reader on `sthealthbridgedemo2agib7`; Cognitive Services OpenAI User on `oai-healthbridge-demo`.
  - Connection names (exact, must match `agent/knowledge-base-config.json`): `healthbridge-blob-connection`, `healthbridge-aisearch-connection`, `healthbridge-mcp-connection`, `healthbridge-fabric-connection` (⚠️ pending).
  - Knowledge Base name: `payor-knowledge-base` (consistent with `docs/demo-flow.md`).
  - Embedding model: `text-embedding-3-small`, **1536 dimensions** — critical, must not be changed to 3072.
  - Retrieval: hybrid search, semantic ranking On, Top-K=5, minimum reranker score=0.5.
  - Three AI Search indexes attached separately: `healthcare-payor-docs`, `healthbridge-formulary-index`, `healthbridge-provider-index`.
  - MCP endpoint: `https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io` (POST `/mcp`).
  - Three smoke-test prompts map to MCP Server, AI Search formulary, and AI Search provider directory to confirm end-to-end wiring.
- Decision filed at `.squad/decisions/inbox/chunk-kb-connection-guide.md`.
- Skill written at `.squad/skills/foundry-kb-connection/SKILL.md`.

## 2026-06-21 — Foundry IQ UI Corrections (from Mikey review)

**CRITICAL: Knowledge Base Connection Guide v1.1 has significant corrections to v1.0 (authored by Chunk).**

Rob flagged suspected classic Foundry UI inaccuracies. Mikey validated against current Microsoft Learn and confirmed **4 BLOCKER + 4 MAJOR + 3 MINOR discrepancies** between v1.0 and current portal:

### Corrections to Future KB Work

1. **Navigation is NOT Settings gear** → Correct path: **Operate → Admin → [project] → Add connection**
2. **KB creation is NOT left-sidebar** → Correct path: **Build → Knowledge tab**
3. **MCP is NOT a portal "connection" type** — MCP Server does not exist as a Foundry connection type. Instead:
   - MCP is configured as a **knowledge source** directly on Azure AI Search (preview API)
   - Agent connects via a `RemoteTool` MCP connection pointing at `{search-endpoint}/knowledgebases/{kb-name}/mcp`
4. **Embedding/retrieval settings are NOT KB-level** → These live on **knowledge sources and search indexes**, not the KB object itself. The KB object only has: name, description, knowledgeSources, retrievalInstructions, answerInstructions, outputMode, models, encryptionKey.
5. **Fabric connection is code-only** — Portal UI does not support Fabric Data Agent connection creation.
6. **Connection label is "Azure Storage"** (not "Azure Blob Storage")
7. **Terminology: "knowledge sources"** (not "data sources")

**Reference:** `docs/knowledge-base-connection-guide.md` v1.1 now includes Microsoft Learn citations and corrected patterns for all future KB work.

**Decision Merged:** KB Connection Guide Validation decision (2026-06-21) now in `.squad/decisions.md`.

### 2026-06-21 — Connection Naming Discovery (cross-team note from Mikey)

**Key finding:** Foundry portal auto-names connections from Azure resource names (e.g., `sthealthbridgedemo2agib7`) with no custom-name field. Custom names require code (ARM PUT via `az rest`, api-version `2025-04-01-preview`). Relevant to any KB/connection config work: all four connections in the demo are now created via `az rest` to guarantee names match `knowledge-base-config.json`. Guide v1.2 reflects this approach. No changes needed to your KB config JSON — naming is now guaranteed consistent across deployments.

### 2026-06-21 — Portal-First Option B Documentation (cross-team note from Mikey)

KB connection guide now documents both code-first (primary, Option A) and portal-first (Option B) connection creation paths. Portal-first only works for Storage + AI Search; requires manual editing of `knowledge-base-config.json` lines 29/51/83 to match auto-generated connection names. MCP + Fabric remain code-only in both options. No changes to your KB config JSON; guide documents both paths against its existing values. Guide bumped to v1.3.

## 2026-07-09 — Issue #5: Agent Validation Against Core Demo Workflows

**Performed a full static validation of all 5 workflow test prompt sets (30 prompts) and the 3 inline guardrail prompts.**

### Validation Method
Static review: verified each prompt is grounded in actual synthetic data, expected tools and data sources are correct, data source routing is internally consistent, and guardrail coverage is complete. (Live agent execution not possible — no Foundry playground connection in this environment.)

### Workflow Coverage

| Workflow | File | Prompts | Status |
|---|---|---|---|
| Eligibility & Benefits | eligibility-benefits.md | EB-1 to EB-6 | ✅ Sound |
| Claims & EOB | claims-eob.md | CL-1 to CL-6 | ✅ Sound |
| Prior Authorization | prior-auth.md | PA-1 to PA-6 | ✅ Sound |
| Pharmacy & Formulary | pharmacy-formulary.md | PH-1 to PH-6 | ✅ Sound |
| Provider Network | provider-network.md | PN-1 to PN-6 | ✅ Sound |
| Guardrails | sample-prompts.md (A–C) + new guardrails-edge-cases.md (G-1 to G-12) | 15 total | ✅ Created |

### Bugs Found and Fixed

1. **Member name discrepancy (HIGH)** — `docs/demo-script.md` used "Marcus Hartwell" for MBR-2024-001234 but synthetic data says "John A. Hartwell." Fixed: renamed throughout demo-script.md to "John Hartwell" / "John A. Hartwell." Issue would have caused a live demo mismatch (presenter says "Marcus," agent returns "John").

2. **System prompt contact details wrong (HIGH)** — `agent/system-prompt.md` used `my.healthbridge.com` and `1-800-HEALTHBRIDGE`. All other content uses `HealthBridge.example.com` and `1-800-555-BLUE`. Fixed in system-prompt.md.

### Bugs Filed as Follow-up Issues

3. **`agent-definition.json` missing (BLOCKER)** — Filed as issue #11. `docs/demo-flow.md` Act 3a and `agent/README.md` both tell presenters to import this file. It doesn't exist. Demo is un-importable without it.

4. **Celecoxib not confirmed in formulary index (HIGH)** — Filed as issue #12. `agent/sample-prompts.md` Act 4 (Sarah Nguyen 5-min demo) prompts for celecoxib. Not in the 10-drug test set. If missing from the index, Act 4 fails silently.

### Guardrails File Created

Created `agent/test-prompts/guardrails-edge-cases.md` — 12 edge case prompts covering:
- Direct and indirect medical advice requests (G-1, G-2)
- PHI bulk disclosure (G-3, G-9)
- Out-of-scope requests: premium, legal (G-4, G-5)
- Prompt injection / jailbreak (G-6)
- Knowledge gap / no-results (G-7)
- Member distress / escalation (G-8)
- Missing authentication context (G-10)
- Utilization override coercion (G-11)
- Factual contradiction handling (G-12)

### Items Confirmed Correct (no action needed)

- KB config MCP URL: already correct (`https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io`)
- README embedding model: already correct (`text-embedding-3-small`, 1536 dims)
- All 30 workflow prompts: data source tags and member IDs consistent with synthetic data
- PA-3 PA status lookup: `lookup_claim` tool covers "prior auth status on a paid claim" — sufficient for PA-2026-087341 retrieval via CLM-2026-0061872

---

## 2026-06-23 — Foundry Resource Model Verified (Cross-Agent Note)

## 2026-06-23 — Foundry Resource Model Verified (Cross-Agent Note)

**FROM: Data + Mikey** — New Foundry project is `Microsoft.CognitiveServices/accounts/projects` under `foundry-healthbridge-demo` account (NOT `MachineLearningServices/workspaces`). Blob + AI Search connections already exist with auto-names (`sthealthbridgedemo2ag633uyd`, `srch-healthbridge-connection`). If Option B chosen, edit `knowledge-base-config.json` lines 29/51/83 to match these auto-names. Guide updated to v1.4 with correct CognitiveServices paths.

**Task:** With `payor-knowledge-base` confirmed live (4 active knowledge sources), produce a standalone operator guide for deploying the `healthbridge-assistant` agent and verify the Playground opens.

**Findings:**

1. `agent-definition.json` MCP URL was missing `?api-version=2026-05-01-preview` — the KB endpoint requires this query param. Fixed.
2. `agent-definition.json` instructions still had `1-800-HEALTHBRIDGE` and `my.healthbridge.com` — stale contact info fixed in an earlier session for `system-prompt.md` but not propagated to the JSON. Fixed.
3. `agent/system-prompt-portal.txt` had the same stale contact info. Fixed.
4. No `docs/agent-deployment-guide.md` existed — the KB connection guide (docs/knowledge-base-connection-guide.md) contains Step D for agent creation, but it's buried in a 35KB guide. Operators need a standalone, focused entry point.

**Changes made:**
1. Updated `agent/agent-definition.json`: MCP URL now includes `?api-version=2026-05-01-preview`; instructions updated to `1-800-555-BLUE` and `HealthBridge.example.com`
2. Updated `agent/system-prompt-portal.txt`: same contact info fix
3. Created `docs/agent-deployment-guide.md` — standalone operator guide covering: live status table, import vs. manual creation (Option A/B), KB MCP tool wiring, playground verification, 4 smoke tests, Fabric/Blob blockers, troubleshooting

**Fabric blocker (unchanged):** Fabric connection cannot be created until a Fabric workspace and `healthbridge-claims-agent` are provisioned. Claims workflow prompts (CL-1–CL-6) remain blocked.

**Decision filed:** `.squad/decisions/inbox/chunk-agent-deploy.md`

## 2026-07-09 — Issues #12 and #9: Test Prompt Completions

**Issue #12 — PH-7 (celecoxib):**
- Added prompt PH-7 to `agent/test-prompts/pharmacy-formulary.md`
- Data confirmed celecoxib exists as FRM-2026-0011, Tier 2, $45 retail/30-day, $110 mail order/90-day, no PA, no deductible
- Smoke Test 2 in `docs/agent-deployment-guide.md` uses this prompt — now has concrete ground truth to test against

**Issue #9 — Guardrail pass/fail criteria:**
- `agent/test-prompts/guardrails-edge-cases.md` already had 12 substantive prompts (G-1–G-12) from the Issue #5 session
- Missing: explicit pass/fail criteria required by Issue #9 spec
- Added Pass/Fail Criteria block to all 12 prompts — each block clearly states what constitutes a pass (correct guardrail enforcement) and what constitutes a fail (harmful or off-guardrail behavior)
- File version bumped to 1.1

**Learning — test prompt completeness pattern:**
A guardrail test prompt isn't complete until it has three parts: (1) the adversarial input, (2) expected behavior description, and (3) explicit pass/fail criteria. The pass/fail criteria are what make prompts usable as automated or manual regression tests rather than just illustrative examples. Keep this pattern for any future test prompt files.


## 2026-07-09 — Issues #12 and #9: Test Prompt Completions

**Issue #12 — PH-7 (celecoxib):**
- Added prompt PH-7 to `agent/test-prompts/pharmacy-formulary.md`
- Data confirmed celecoxib exists as FRM-2026-0011, Tier 2, $45 retail/30-day, $110 mail order/90-day, no PA, no deductible
- Smoke Test 2 in `docs/agent-deployment-guide.md` uses this prompt — now has concrete ground truth to test against

**Issue #9 — Guardrail pass/fail criteria:**
- `agent/test-prompts/guardrails-edge-cases.md` already had 12 substantive prompts (G-1–G-12) from the Issue #5 session
- Missing: explicit pass/fail criteria required by Issue #9 spec
- Added Pass/Fail Criteria block to all 12 prompts — each block clearly states what constitutes a pass (correct guardrail enforcement) and what constitutes a fail (harmful or off-guardrail behavior)
- File version bumped to 1.1

**Learning — test prompt completeness pattern:**
A guardrail test prompt isn't complete until it has three parts: (1) the adversarial input, (2) expected behavior description, and (3) explicit pass/fail criteria. The pass/fail criteria are what make prompts usable as automated or manual regression tests rather than just illustrative examples. Keep this pattern for any future test prompt files.

