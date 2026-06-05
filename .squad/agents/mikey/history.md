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

## Cross-Team Updates (2026-06-05)

**From Mouth (Domain Content):** Created 14 sample data files (claims, members, providers, policies, benefits) with internally consistent IDs (member MBR-*, provider NPI-*, claims CLM-*, prior auths PA-*). BluePeak Health Plan brand, IL HMO focus. Ready for distribution across all four data sources.

**From Data (Data Engineer):** Scaffolded all four data source configs: MCP server (Node.js ESM with lookup/benefits tools), AI Search (index + skillset with HNSW vectors), Blob Storage (PowerShell deploy), Fabric Data Agent (connection config). All sources have actionable setup READMEs.

**From Chunk (Agent Builder):** Created agent definition (HealthBridge Assistant) with knowledge base config linking all four sources, system prompt, and 18 sample prompts (15 functional + 3 guardrail). Agent ready for Foundry instantiation.
