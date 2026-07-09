# Demo Readiness Checklist — HealthBridge Knowledge IQ

**Demo:** Knowledge IQ in Azure AI Foundry — Healthcare Payor  
**Environment:** `proj-healthbridge` on [ai.azure.com](https://ai.azure.com)  
**Member scenario:** Marcus Hartwell · MBR-2024-001234 · PPO Gold

> **⚠️ Known blocker:** Fabric Data Agent connection (`healthbridge-fabric-connection`) is not yet available — requires Fabric workspace GUID + `healthbridge-claims-agent` setup. Demo prompts that rely on claims analytics (Prompt 4 / Prompt 5) must be skipped or noted as "coming soon" until this is resolved. See `docs/connection-status.md`.

---

## 1 · Azure Infrastructure

| # | Item | Owner | Status |
|---|------|-------|--------|
| 1.1 | Resource group `rg-knowledge-iq-demo` exists in `eastus` | Data | ☐ |
| 1.2 | Azure AI Foundry account `foundry-healthbridge-demo` is live | Data | ☐ |
| 1.3 | Project `proj-healthbridge` open and accessible at ai.azure.com | Data | ☐ |
| 1.4 | Azure OpenAI `oai-healthbridge-demo` deployed with `text-embedding-3-small` (≥30K TPM) | Data | ☐ |
| 1.5 | AI Search service `srch-healthbridge-demo` is running (Basic tier or above) | Data | ☐ |
| 1.6 | Storage account `sthealthbridgedemo2agib7` accessible, container `healthcare-docs` exists | Data | ☐ |
| 1.7 | MCP server Container App reachable at health endpoint | Data | ☐ |

---

## 2 · RBAC & Managed Identity

| # | Item | Owner | Status |
|---|------|-------|--------|
| 2.1 | Foundry project managed identity has **Search Index Data Reader** on `srch-healthbridge-demo` | Data | ☐ |
| 2.2 | Foundry project managed identity has **Search Service Contributor** on `srch-healthbridge-demo` | Data | ☐ |
| 2.3 | Foundry project managed identity has **Storage Blob Data Reader** on `sthealthbridgedemo2agib7` | Data | ☐ |
| 2.4 | Foundry project managed identity has **Cognitive Services OpenAI User** on `oai-healthbridge-demo` | Data | ☐ |

---

## 3 · Data Sources & Connections

| # | Item | Owner | Status |
|---|------|-------|--------|
| 3.1 | `healthbridge-blob-connection` registered in Foundry → Connected ✅ | Data | ☐ |
| 3.2 | `healthbridge-aisearch-connection` registered in Foundry → Connected ✅ | Data | ☐ |
| 3.3 | `healthbridge-mcp-connection` registered in Foundry → Connected ✅ | Data | ☐ |
| 3.4 | `healthbridge-fabric-connection` registered in Foundry → Connected (**BLOCKED** ⚠️) | Data | ⚠️ |
| 3.5 | AI Search indexes `healthbridge-formulary-index` and `healthbridge-provider-index` created and populated | Data | ☐ |
| 3.6 | Blob container `healthcare-docs` contains uploaded sample documents from `sample-data/` | Data | ☐ |
| 3.7 | MCP server health endpoint returns HTTP 200 | Data | ☐ |

---

## 4 · Sample Data

| # | Item | Owner | Status |
|---|------|-------|--------|
| 4.1 | Member `MBR-2024-001234` (Marcus Hartwell) record is in sample data and queryable | Mouth | ☐ |
| 4.2 | Provider Dr. Patricia Chen (`NPI-1234567890`) is in AI Search provider index | Mouth | ☐ |
| 4.3 | Formulary entries include Ozempic (GLP-1) and Humira (adalimumab) with tier, PA, step therapy | Mouth | ☐ |
| 4.4 | Prior auth record for lumbar MRI / CPT 22612 exists and is queryable via MCP | Mouth | ☐ |
| 4.5 | PPO Gold benefit summary PDF / markdown is in `healthcare-docs` Blob container | Mouth | ☐ |
| 4.6 | All cross-referenced member IDs, PA numbers, and claim IDs are consistent across data sources | Mouth | ☐ |

---

## 5 · Knowledge Base & Agent

| # | Item | Owner | Status |
|---|------|-------|--------|
| 5.1 | Knowledge Base `payor-knowledge-base` created in Foundry with 3 active data sources (Blob, AI Search ×2, MCP) | Chunk | ☐ |
| 5.2 | KB retrieval set to: Hybrid search, Semantic ranking ON, Top-K = 5, Min reranker score = 0.5, Query rewrite ON | Chunk | ☐ |
| 5.3 | KB initial indexing complete (allow 5–15 min after save) — index status shows green | Chunk | ☐ |
| 5.4 | Agent `healthbridge-assistant` created with GPT-4o base model | Chunk | ☐ |
| 5.5 | Agent system prompt from `agent/system-prompt.md` is loaded | Chunk | ☐ |
| 5.6 | Agent temperature set to `0.1` | Chunk | ☐ |
| 5.7 | `payor-knowledge-base` linked to the agent under **Knowledge** | Chunk | ☐ |
| 5.8 | MCP tools (`get_prior_auth_requirements`, `get_clinical_coverage_criteria`) enabled on agent | Chunk | ☐ |
| 5.9 | Smoke test prompts from `docs/azure-setup.md` (Step 7) all return valid, cited responses | Chunk | ☐ |

---

## 6 · Playground & Presenter Setup

| # | Item | Owner | Status |
|---|------|-------|--------|
| 6.1 | Browser open to ai.azure.com, signed in, on `proj-healthbridge` | Presenter | ☐ |
| 6.2 | `healthbridge-assistant` open in **Playground** tab | Presenter | ☐ |
| 6.3 | **Citations** panel enabled (toggle in upper-right of Playground) | Presenter | ☐ |
| 6.4 | **Trace** view available but closed (open on request during demo) | Presenter | ☐ |
| 6.5 | Demo prompt sequence from `docs/demo-script.md` is at hand (printed or second screen) | Presenter | ☐ |
| 6.6 | Screenshots captured for all 8 marked locations in `docs/demo-script.md` | Presenter | ☐ |
| 6.7 | Fabric-dependent prompts (Prompt 4/5 per demo-flow.md) are flagged/removed from deck if Fabric is not live | Presenter | ☐ |

---

## 7 · End-to-End Smoke Test

Run all of these in the Playground **before** the demo. Mark each ✅ or ❌.

| # | Prompt | Expected | Actual | Pass? |
|---|--------|----------|--------|-------|
| S1 | `Is Dr. Patricia Chen an in-network provider for my plan?` | Name, specialty, tier, location, accepting new patients; citation: AI Search providers | | ☐ |
| S2 | `Is Ozempic covered on my formulary, and is prior authorization required?` | Tier 4 Specialty, PA required, step therapy noted; citation: AI Search formulary | | ☐ |
| S3 | `What is the out-of-pocket maximum for the PPO Gold plan this year?` | Individual + family OOP figures; citation: Blob Storage PDF | | ☐ |
| S4 | `Marcus has been referred for an MRI of his knee. Does he need prior authorization?` | PA required, CPT 73721, ordering provider submits; citations: MCP + Blob | | ☐ |
| S5 | *(Skip if Fabric not live)* `Top five denial reason codes for PPO plan in orthopedics over last 12 months` | Claims analytics result; citation: Fabric Data Agent | | ⚠️ |

---

## 8 · Sign-Off

All owners sign off before demo day. Record date and initials.

| Owner | Role | Items Covered | Signed Off | Date |
|-------|------|---------------|------------|------|
| Data | Data Engineer | Sections 1, 2, 3 | ☐ | |
| Mouth | Domain Content | Section 4 | ☐ | |
| Chunk | Agent Builder | Section 5 | ☐ | |
| Mikey | Lead | All sections — final review | ☐ | |
| Presenter | Demo Presenter | Sections 6, 7 | ☐ | |

> **Demo is GO when:** Sections 1–5 are fully checked, all smoke tests in Section 7 pass (S1–S4 are required; S5 optional), and all four non-Presenter owners have signed off.

---

## Known Gaps (open items at checklist creation)

| Gap | Impact | Owner | Resolution |
|-----|--------|-------|-----------|
| Fabric Data Agent connection blocked — no workspace GUID | Prompts 4 & 5 (claims analytics) are unavailable | Data | Skip or add "coming soon" note in deck |
| Screenshots not yet captured | Demo script has 8 placeholder screenshot slots | Presenter | Capture from running demo env before demo day |

---

*Checklist version: 1.0 · Created: 2026-07-09 · Issue: #7*  
*Sources: `docs/demo-flow.md`, `docs/demo-script.md`, `docs/azure-setup.md`, `docs/connection-status.md`*
