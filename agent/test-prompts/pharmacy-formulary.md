# Test Prompts — Pharmacy & Formulary

Use these prompts to validate agent behavior for drug coverage lookups, formulary tier assignments, step therapy requirements, quantity limits, and specialty pharmacy rules. All prompts reference HealthBridge Formulary Guidelines CP-2026-FRM-001 and the HealthBridge AI Search formulary index.

---

## Prompt PH-1 — Generic Diabetes Drug Tier Lookup

**Prompt:**
> "What tier is metformin on my HealthBridge formulary, and how much will it cost me?"

**Expected Data Source(s):**
- `ai-search-formulary` (via `check_formulary` MCP tool searching drugName/genericName="metformin")

**Expected Response Characteristics:**
- Returns metformin as **Tier 1 — Preferred Generic**
- Retail copay: **$5 per 30-day supply** (HMO Silver/PPO Gold); $0 for MAPD Tier 1
- Mail order (90-day): $12 (commercial); $0 for MAPD
- No prior authorization required; no step therapy (it **is** Step 1 for Type 2 diabetes)
- Notes that Tier 1 generics are exempt from the medical deductible on all commercial plans
- Flags the step therapy rule: metformin must be tried before GLP-1 agonists (e.g., Ozempic) will be covered on commercial plans

---

## Prompt PH-2 — Specialty Drug with PA and Step Therapy (Ozempic / Semaglutide)

**Prompt:**
> "Is Ozempic covered on my formulary? I have Type 2 diabetes."

**Expected Data Source(s):**
- `ai-search-formulary` (via `check_formulary` searching drugName="Ozempic" or genericName="semaglutide")
- `blob-storage-plan-documents` (formulary guidelines CP-2026-FRM-001 §3.2)

**Expected Response Characteristics:**
- Returns Ozempic (semaglutide) as **Tier 4 — Specialty Preferred** (commercial); **Tier 5** (if non-preferred for MAPD)
- **Prior authorization required**
- **Step therapy required**: member must document failure of Tier 1 metformin AND at least one Tier 2 agent (e.g., glipizide, sitagliptin) tried for ≥ 90 days
- Additional PA criteria: HbA1c ≥ 7.5 documented within 6 months; prescriber attestation of CV or renal comorbidity (MAPD: aligns with CMS)
- **Quantity limit**: 1 pen/injection device per 28 days; 4 per 90-day mail order
- Must be dispensed through HealthBridge Preferred Specialty Pharmacy (e.g., CenterRx, MedPoint)
- Retail copay (if approved): $75 (Tier 4 commercial); not available via mail order

---

## Prompt PH-3 — Biologic vs. Biosimilar Step Therapy (Humira / Adalimumab)

**Prompt:**
> "My rheumatologist prescribed Humira for my rheumatoid arthritis. Is it covered, or do I need to try something else first?"

**Expected Data Source(s):**
- `ai-search-formulary` (via `check_formulary` for "Humira" and "adalimumab biosimilar")
- `blob-storage-plan-documents` (CP-2026-FRM-001 §3.3)

**Expected Response Characteristics:**
- Returns Humira (adalimumab originator) as **non-preferred** — not covered until step therapy is satisfied
- Step therapy protocol for inflammatory conditions (RA):
  - Step 1 (≥ 3 months): Conventional DMARD — Methotrexate AND/OR Hydroxychloroquine
  - Step 2 (≥ 3 months): **Preferred adalimumab biosimilar** (not originator Humira) — Tier 4
  - Step 3: Non-preferred biologics (originator Humira, ustekinumab, etc.) — Tier 5, requires PA + step failure documentation
- Explains that the **biosimilar pathway** is the most cost-effective covered route: lower copay ($75 Tier 4 vs. $150 Tier 5)
- PA required for both biosimilar (Step 2) and originator (Step 3)
- Step waiver available if member has documented prior failure or intolerance to biosimilar

---

## Prompt PH-4 — Statin Copay and Mail Order Savings

**Prompt:**
> "What tier is atorvastatin, and is there a cheaper option if I use mail order?"

**Expected Data Source(s):**
- `ai-search-formulary` (via `check_formulary` for "atorvastatin")
- `blob-storage-plan-documents` (pharmacy benefit cost-sharing schedule)

**Expected Response Characteristics:**
- Returns atorvastatin as **Tier 1 — Preferred Generic**
- Retail (30-day): **$5 copay** (commercial); $0 (MAPD)
- Mail order (90-day): **$12 copay** (commercial) — savings vs. three retail fills ($15) are modest but present
- No prior authorization; no quantity limit for standard hypolipidemic doses
- Notes that atorvastatin is available in multiple strengths (10 mg, 20 mg, 40 mg, 80 mg) — all at same Tier 1 rate
- Mentions HealthBridge mail order pharmacy option (HealthBridge-rx.example.com/mail-order) for convenience

---

## Prompt PH-5 — Quantity Limit Check (GLP-1 Pen)

**Prompt:**
> "Are there quantity limits on Ozempic? My doctor wants to prescribe two pens per month."

**Expected Data Source(s):**
- `ai-search-formulary` (via `check_formulary` for "semaglutide" quantity limits)
- `blob-storage-plan-documents` (CP-2026-FRM-001 §4)

**Expected Response Characteristics:**
- Confirms quantity limit: **1 pen/injection device per 28 days** (retail); **4 pens per 90-day mail supply**
- A prescription for 2 pens per month exceeds the quantity limit and will require a **quantity limit exception**
- Explains how to request a QL exception: prescriber submits via HealthBridge-rx.example.com/pa-request with clinical justification (e.g., dose titration documentation)
- Decision turnaround: 72 hours standard; 24 hours urgent
- Notes that Ozempic is also subject to PA; the QL exception can be included in the PA request

---

## Prompt PH-6 — Formulary Exception for a Non-Covered Drug

**Prompt:**
> "My doctor says the drug she wants to prescribe isn't on your formulary. What are my options?"

**Expected Data Source(s):**
- `ai-search-formulary` (to confirm non-formulary status if drug name provided)
- `blob-storage-plan-documents` (CP-2026-FRM-001 §5 — formulary exception process)

**Expected Response Characteristics:**
- Explains the formulary exception process:
  1. Prescriber submits a PA request at HealthBridge-rx.example.com/pa-request
  2. Required documentation: member ID, drug name/dose/NDC, diagnosis, evidence that formulary alternatives are contraindicated or have been tried and failed, clinical rationale
  3. Decision: 72 hours standard, 24 hours urgent
- Exception approved when: all covered alternatives are contraindicated, member has tried and failed all covered alternatives, or a covered alternative would cause adverse effects
- Assures member that their prescriber can attest to clinical necessity on their behalf — member doesn't need to navigate this alone
- If exception is denied, notes appeal rights and redirects to Member Services for support

---

## Prompt PH-7 — NSAID Post-Surgery Coverage (Celecoxib)

**Prompt:**
> "My doctor prescribed celecoxib for pain after surgery. What tier is it on and what will I pay?"

**Expected Data Source(s):**
- `ai-search-formulary` (via `check_formulary` searching drugName="celecoxib" or brandName="Celebrex"; record ID: FRM-2026-0011)

**Expected Response Characteristics:**
- Returns celecoxib (Celebrex) as **Tier 2 — Preferred Brand**
- Retail copay: **$45 per 30-day supply**
- Mail order (90-day supply): **$110** (HealthBridge mail order pharmacy)
- **No prior authorization required**
- **No deductible applies** — Tier 2 benefits are not subject to the medical deductible on commercial plans
- Does NOT return PA requirements (none exist for this drug)
- Cites `healthbridge-formulary-index` (FRM-2026-0011) in response annotations

**Pass / Fail Criteria:**
- ✅ **Pass:** Tier 2 stated; $45 retail and $110 mail order copays both present; no PA mentioned or "no PA required" stated; deductible exemption noted; citation to formulary index visible
- ❌ **Fail:** Returns wrong tier (e.g., Tier 3/4/5); states PA is required; returns $0 or generic-level copay; hallucinates quantity limits or step therapy not present on the record; no citation

---

*Test prompts version: 1.1 | Updated: 2026-07-09 (added PH-7 — celecoxib, closes Issue #12) | Data source: HealthBridge CP-2026-FRM-001 and synthetic formulary index*
