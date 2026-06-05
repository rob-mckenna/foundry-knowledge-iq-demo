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

## Cross-Team Updates (2026-06-05)

**From Mikey (Lead):** Demo architecture finalized: four-source Knowledge Base (MCP, AI Search, Fabric, Blob) supporting five payor workflows (eligibility, prior auth, formulary, claims, provider network). Each source must be independently demoable. Your agent fits perfectly; system prompt aligns well with demo goals.

**From Mouth (Domain Content):** Created 14 sample healthcare payor data files (claims, members, providers, policies, benefits) with consistent IDs (MBR-*, NPI-*, CLM-*, PA-*) across all sources. Brand: BluePeak Health Plan. IL HMO focus. Ready for knowledge base population.

**From Data (Data Engineer):** Scaffolded all four data source configs. Your agent's knowledge base config references all sources. Data distribution plan: JSON for MCP/Fabric, documents/markdown for Blob/AI Search. Ready for knowledge base assembly and prompt testing.
