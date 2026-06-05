# Mouth — History

## Project Context
- **Project:** foundry-knowledge-iq-demo — Demo of Knowledge IQ in Azure AI Foundry for a healthcare payor
- **Stack:** Azure AI Foundry, AI Search, Blob Storage, Fabric Data Agent, MCP
- **User:** Rob McKenna

## Learnings

- Healthcare payor domain uses ICD-10-CM diagnosis codes, CPT procedure codes, NPI identifiers for providers, and structured member IDs (e.g., MBR-YYYY-NNNNNN).
- Claims data must link member IDs to both member records and provider NPIs for consistency — critical for demo queries that span multiple Knowledge Base data sources.
- Prior auth numbers (PA-YYYY-NNNNNN) should appear in both claim records and member records for cross-reference realism.
- Illinois is a realistic single-state HMO service area for a mid-size health plan; city names Springfield, Naperville, Peoria add geographic coherence.
- Fictional brand name: **BluePeak Health Plan** — PPO Gold, HMO Silver, PPO Platinum (MAPD) tiers.

## Work Log

### 2026-06-05 — Initial Sample Data Creation (Task by Rob McKenna)

Created full `sample-data/` directory tree:

**Claims (3 JSON files):**
- `CLM-2026-0054321` — MBR-2024-001234 (Hartwell), professional claim, office visit + ECG, NPI 1234567890, PAID
- `CLM-2026-0061872` — MBR-2024-002891 (Nguyen), institutional claim, total knee arthroplasty, NPI 2345678901, PAID, PA-2026-087341
- `CLM-2026-0047990` — MBR-2024-003456 (Thompson), professional claim, cardiology visit + echo, NPI 3456789012, PAID

**Members (3 JSON files):**
- `MBR-2024-001234` — John A. Hartwell, PPO Gold, Springfield IL, dependents Claire & Owen
- `MBR-2024-002891` — Sarah L. Nguyen, HMO Silver, Naperville IL, PA-2026-087341 on file
- `MBR-2024-003456` — Marcus D. Thompson, PPO Platinum MAPD, Peoria IL, COB with Medicare Part B

**Providers (3 JSON files):**
- `NPI-1234567890` — Dr. Patricia M. Chen, Internal Medicine, BluePeak Primary Care Associates
- `NPI-2345678901` — Lakeside Orthopedic Group (org), Orthopaedic Surgery + ASC location
- `NPI-3456789012` — Dr. Robert J. Vasquez, Cardiology/EP, Heartland Cardiovascular Specialists

**Policies (3 Markdown documents):**
- `prior-auth-policy.md` — CP-2026-PA-001: PA requirements, submission process, timeframes, TKA criteria, appeals
- `formulary-guidelines.md` — CP-2026-FRM-001: 5-tier formulary, step therapy (HTN, diabetes, biologics), QL, specialty pharmacy
- `coverage-criteria.md` — CP-2026-MED-001: echo, stress test, MSK MRI, PT, behavioral health, preventive services

**Benefits (2 Markdown documents):**
- `ppo-gold-benefit-summary.md` — $500 deductible, $3K OOP, $20 PCP copay, 20% coinsurance
- `hmo-silver-benefit-summary.md` — $1,500 deductible, $5K OOP, $30 PCP copay, 30% coinsurance, referral required

## Cross-Team Updates (2026-06-05)

**From Mikey (Lead):** Established architecture and demo flow (45 min, 4 acts, 5 payor workflows). ADR filed for four-source Knowledge Base with cross-source consistency requirement — your sample data must maintain consistent member/provider/claim IDs across all sources. Architecture is finalized; team is now executing.

**From Data (Data Engineer):** Scaffolded all four data source configs (MCP, AI Search, Blob, Fabric). Sample data distribution targets defined: JSON for MCP/Fabric, markdown/text for AI Search, documents for Blob. Ready to receive your data and distribute to each source.

**From Chunk (Agent Builder):** HealthBridge Assistant agent created with knowledge base linking all four sources, system prompt, and 18 sample prompts. Agent expects data from all sources to be populated and ready for testing. Waiting on knowledge base assembly.
