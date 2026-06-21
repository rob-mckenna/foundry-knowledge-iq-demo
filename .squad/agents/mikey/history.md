# Mikey — History

## Project Context
- **Project:** foundry-knowledge-iq-demo — Demo of Knowledge IQ in Azure AI Foundry for a healthcare payor
- **Stack:** Azure AI Foundry, AI Search, Blob Storage, Fabric Data Agent, MCP
- **User:** Rob McKenna

## Learnings

### 2026-06-05 — Initial project structure established

**Work done:**
- Created `README.md` at project root (customer-facing, concise)
- Scaffolded full directory structure: `data-sources/{mcp-server,ai-search,fabric-data-agent,blob-storage}`, `sample-data/`, `agent/`, `docs/`
- Wrote placeholder READMEs for all directories explaining purpose, structure, and Foundry connection method
- Wrote `docs/demo-flow.md` — full 45-minute narrative with 4 acts, 5 demo prompts, and anticipated Q&A
- Filed architectural decision to `.squad/decisions/inbox/mikey-demo-architecture.md`

**Key decisions made (see ADR):**
- Four data sources selected for maximum architectural diversity: MCP (real-time), AI Search (semantic), Fabric Data Agent (structured analytics), Blob Storage (documents)
- Single `sample-data/` directory as cross-source truth; all member/provider/claim IDs must be consistent
- Five payor workflows anchor the demo prompts: eligibility, prior auth, formulary, claims analytics, provider network
- New Azure AI Foundry only — no classic Foundry / Azure AI Studio references anywhere

**What's next:**
- Team needs to populate `sample-data/` with synthetic data (500 members, 200 providers, 2,000 claims)
- MCP server implementation in `data-sources/mcp-server/`
- AI Search index config and document corpus
- Fabric lakehouse setup and Data Agent configuration
- Agent definition JSON and system prompt

### 2026-06-05 — Comprehensive documentation written

**Work done:**
- Created `docs/setup-guide.md` — complete setup guide covering all prerequisites, MCP server install/test steps, AI Search index creation, Blob Storage deploy script, Fabric placeholder, Foundry connections, Knowledge Base configuration, agent deployment, and verification checklist
- Created `docs/demo-script.md` — presenter-ready script with 3-minute quick-hits version and 10-minute Marcus Hartwell narrative arc; includes talking points for payor audience, screenshot placeholder notes, and common setup issues table
- Created `docs/architecture.md` — full architecture overview with ASCII component map, Mermaid sequence diagram for query-time data flow, per-source role descriptions, MCP integration detail, and key architectural decisions table
- Updated `README.md` — polished project README with Mermaid architecture graph, quick start (3 commands), data sources table, Fabric pending callout, sample prompts table, and complete documentation index

**Doc structure decisions made:**
- `setup-guide.md` is the canonical "how to run it" document; `azure-setup.md` is retained as a lower-level provisioning reference — both coexist
- `demo-script.md` uses a single named fictional member (Marcus Hartwell / MBR-2024-001234) as the narrative thread for the 10-min version — this makes prompts coherent and memorable
- Architecture doc includes both ASCII art (for GitHub rendering) and Mermaid diagrams (for richer tooling)
- README quick start deliberately shows only 3 commands to get MCP running — lowers the barrier for first-time readers
- Fabric Data Agent is flagged with ⚠️ consistently across all four docs using identical language
- Screenshot placeholders are numbered and tabulated in demo-script.md to make it easy for a presenter to capture them in sequence

## Cross-Team Updates (2026-06-05)

**From Mouth (Domain Content):** Created 14 sample data files (claims, members, providers, policies, benefits) with internally consistent IDs (member MBR-*, provider NPI-*, claims CLM-*, prior auths PA-*). HealthBridge Insurance Plan brand, IL HMO focus. Ready for distribution across all four data sources.

**From Data (Data Engineer):** Scaffolded all four data source configs: MCP server (Node.js ESM with lookup/benefits tools), AI Search (index + skillset with HNSW vectors), Blob Storage (PowerShell deploy), Fabric Data Agent (connection config). All sources have actionable setup READMEs.

**From Chunk (Agent Builder):** Created agent definition (HealthBridge Assistant) with knowledge base config linking all four sources, system prompt, and 18 sample prompts (15 functional + 3 guardrail). Agent ready for Foundry instantiation.

**Expansion Phase (2026-06-05):**
- **Full buildout completed:** Mouth expanded to 8 members + 8 claims + 7 providers + 6 benefit summaries + 10 formulary drugs. Data completed MCP server (7 tools, HTTP, 33 passing tests) + 3 AI Search index schemas. Chunk completed 30 test prompts + demo narrative + system prompt tools section. All deliverables verified against live data.
- **Brand standardization:** All 48 files in repo now use "HealthBridge Insurance Plan" unified brand (portal, phone, legal name). Cross-repo consistency achieved.
- **Orchestration checkpoints logged:** Expansion manifest, full-buildout session log, and decision inbox merged (7 decisions). All squad documentation updated with cross-team impact notes.
- **Ready for demo deployment:** Four data sources independently demoable. Knowledge Base ready for agent instantiation in Foundry UI.

### 2026-06-21 — KB Connection Guide Validation & Correction (v1.0 → v1.1)

**Requested by:** Rob McKenna (guide contained inaccurate UI instructions)

**Work done:**
- Performed independent review of `docs/knowledge-base-connection-guide.md` (authored by Chunk)
- Validated all UI claims against current Microsoft Learn documentation (June 2026)
- Rewrote guide as v1.1 with corrected navigation, architecture notes, and programmatic fallbacks

**Key UI facts verified (with citations):**

1. **Connections navigation (CORRECTED):** Current path is Operate → Admin → [project] → Add connection. NOT "Settings (gear icon) → Connections". Ref: https://learn.microsoft.com/en-us/azure/foundry/how-to/connections-add (updated 2026-06-19)

2. **Knowledge Base = Azure AI Search object (CORRECTED):** KBs are Foundry IQ objects backed by Azure AI Search agentic retrieval. Portal path: Build → Knowledge tab. NOT "Knowledge bases" in the left sidebar. Ref: https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-foundry-iq (updated 2026-06-05)

3. **MCP Server IS a valid KB knowledge source (CONFIRMED, preview):** MCP Server is a "remote" knowledge source kind in the 2026-05-01-preview API. However, it's configured on the AI Search service, not as a Foundry "connection type". Ref: https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-mcp-server (updated 2026-06-03)

4. **MCP is NOT a Foundry connection type (CORRECTED):** The connection types table at learn.microsoft.com lists Azure AI Search, Azure Storage, Azure OpenAI, etc. — MCP Server is absent. MCP connections for agents use `RemoteTool` category programmatically. Ref: https://learn.microsoft.com/en-us/azure/foundry/how-to/connections-add#connection-types

5. **Fabric connections are code-only (CORRECTED):** Microsoft Fabric is listed as a connection type but with note "Connection creation is supported only through code." Ref: same as #4.

6. **KB does NOT expose embedding/retrieval UI settings (CORRECTED):** The KB object has name, description, knowledgeSources, retrievalInstructions, answerInstructions, outputMode, models. Settings like embedding model, dimensions, Top-K, Hybrid mode, semantic ranking are on knowledge sources/indexes, not the KB. Ref: https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-how-to-create-knowledge-base

7. **Agent ↔ KB connection uses MCP tool (CONFIRMED):** Agent connects to KB via MCPTool with server_url pointing to `{search-endpoint}/knowledgebases/{kb-name}/mcp`. The portal may surface this as a "Knowledge" section. Ref: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/foundry-iq-connect

8. **RBAC roles verified:** "Cognitive Services OpenAI User" is correct (not "Cognitive Services User"). "Search Index Data Reader" for read access, "Search Service Contributor" for creating KB/knowledge source objects. Ref: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/foundry-iq-connect#authentication-and-permissions

**What was corrected:**
- Step A: Clarified managed identity discovery path (Azure portal preferred, Foundry portal path uncertain)
- Step B: Rewrote connection navigation from "Settings → Connections" to "Operate → Admin → Add connection"
- Step B: Changed "Azure Blob Storage" type to "Azure Storage" (correct portal label)
- Step B: Replaced fictional "MCP Server" connection type with programmatic RemoteTool creation
- Step B: Marked Fabric as code-only
- Step C: Rewrote entire section from "left sidebar Knowledge bases" to "Build → Knowledge tab"
- Step C: Replaced invented embedding/retrieval settings UI with knowledge source-centric workflow
- Step C: Added proper MCP knowledge source creation (portal + REST fallback)
- Step D: Changed navigation from "Agents in left sidebar" to "Build → Agents tab"
- Step D: Changed "System prompt" to "Instructions" (current label)
- Step D: Replaced "Knowledge section" attach flow with MCP tool configuration
- Added Microsoft Learn reference table at bottom
- Bumped version to 1.1
