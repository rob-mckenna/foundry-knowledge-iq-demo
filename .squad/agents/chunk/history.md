# Chunk — History

## Project Context
- **Project:** foundry-knowledge-iq-demo — Demo of Knowledge IQ in Azure AI Foundry for a healthcare payor
- **Stack:** Azure AI Foundry, AI Search, Blob Storage, Fabric Data Agent, MCP
- **User:** Rob McKenna

## Learnings

### 2026-06-05 — Agent directory created

- Created `agent/system-prompt.md`: defines the agent as "HealthBridge Assistant" with five capability areas (benefits, claims, prior auth, pharmacy, providers), professional/empathetic tone, and explicit guardrails (no medical advice, no PHI disclosure, escalate to Member Services)
- Created `agent/knowledge-base-config.json`: five data sources — Blob Storage (plan docs), two AI Search indexes (formulary, providers), Fabric Data Agent (claims/eligibility), MCP server (prior auth policies); hybrid search with semantic ranking, Top-K=5, text-embedding-3-large
- Created `agent/sample-prompts.md`: 15 prompts across 5 categories + 3 guardrail validation prompts; each includes expected behavior and data source tags to make agent testing reproducible
- Updated `agent/README.md`: step-by-step Foundry setup (KB creation, agent creation, retrieval config), suggested 9-prompt demo flow ordered for narrative arc, troubleshooting table
- Key decisions: agent named `healthbridge-assistant`; fictional brand "HealthBridge Insurance" used throughout synthetic content; `<FABRIC_WORKSPACE_ID>` left as placeholder per scope (data infra not in Chunk's boundary)
- No decisions.md items surfaced; all architectural choices are consistent with existing project conventions

### 2026-06-05 — Test prompts, demo script, system prompt tools, KB config

**Test prompt strategy (30 prompts across 5 workflow files):**
- Each file follows the pattern: prompt text → expected data sources → expected response characteristics. This makes prompts reproducible as structured test cases, not just example questions.
- Prompts are anchored to actual synthetic data (real member IDs, claim IDs, provider NPIs, drug names from CP-2026-FRM-001) so the agent has retrievable ground truth for every scenario.
- Coverage breakdown: 6 prompts each for eligibility/benefits, claims/EOB, prior-auth, pharmacy/formulary, and provider-network.
- Each prompt explicitly lists MCP tool calls expected (e.g., `lookup_member`, `check_formulary`) alongside KB data source tags — makes it easy to verify tool routing in Foundry tracing.

**Prompt patterns that work well for healthcare payor demos:**
- "Verification first" prompts (eligibility, PA status) ground the demo in live data — they show real-time retrieval, not static docs.
- "Explain my EOB" prompts are the highest-value category for payor audiences — this is the #1 call driver in healthcare.
- Story arc prompts (Act 1→5 in sample-prompts.md) outperform category-by-category demos for executive audiences; narrative creates emotional connection.
- Always include a member-specific context in claims/eligibility prompts; the agent must demonstrate it's not just returning generic policy text.

**Demo script (sample-prompts.md v2.0):**
- Rewrote around Sarah Nguyen's post-knee-replacement journey — spans all 4 data sources in 5 acts, ~5 minutes.
- Each act includes a "Talking point" for the presenter — what to emphasize for a payor audience.
- Added Quick Reference table mapping each act to data source + MCP tool.

**System prompt update:**
- Added "## Available Tools" section with a table of all 7 MCP tools, descriptions, and "when to use" guidance.
- Added a tool-chaining guidance note for multi-step queries (e.g., `lookup_member` → `check_formulary` → `get_clinical_coverage_criteria`).

**Brand discrepancy noted:**
- System prompt (written in session 1) uses "HealthBridge Insurance" brand. All sample data from Mouth uses "HealthBridge Insurance Plan." Test prompts use HealthBridge (matching actual data). System prompt brand realignment is a separate task — filed in decisions inbox.

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
