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

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
