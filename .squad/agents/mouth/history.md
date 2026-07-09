# Mouth — History

## Project Context
- **Project:** foundry-knowledge-iq-demo — Demo of Knowledge IQ in Azure AI Foundry for a healthcare payor
- **Stack:** Azure AI Foundry, AI Search, Blob Storage, Fabric Data Agent, MCP
- **User:** Rob McKenna

## Work Log

### 2026-07-09 — Demo Script Finalization (Issue #10)

Updated `docs/demo-script.md` from v1.0 → v1.1. Changes:

**Scope and framing:**
- Added top-of-file Fabric blocker warning — Fabric is blocked, demo runs on 3 sources
- 3-min version updated: "four sources" → "three sources"; added note for handling Fabric questions
- 10-min version updated: Fabric references changed to "coming soon" with a single natural bridge line

**Timing:**
- Added explicit clock markers (0:00–1:00, 1:00–2:30, etc.) to every act in both versions
- Added total budget callouts ("Total budget: 3 min", "Total budget: 10 min")

**Presenter notes:**
- Added `📝 Presenter note:` callouts at every key decision point in the 10-min version:
  - Act 1: pause and read the room
  - Act 2: read citation name aloud
  - Act 3: identified as the wow moment; technical add-on
  - Act 4: clinical vs. technical angle split
  - Act 6: skip if running late
  - Act 7: Fabric bridge line
- Updated "Before You Start" checklist with go/no-go gate: don't present with a broken environment

**Fallback procedures (new section):**
- Fallback A: "I wasn't able to find information" → index not ready
- Fallback B: no citations → toggle / system prompt issue
- Fallback C: MCP fails → skip Act 3, pivot to Act 4
- Fallback D: AI Search empty → fall back to Blob Storage prompts
- Fallback E: slow/timeout → narrate while waiting; rephrase if >30 sec

**Troubleshooting table:**
- Expanded with Fabric "attempted by mistake" row and sign-in issue row
- Fallback references linked by letter

**Key decisions:**
- Confirmed demo-script.md counts "three" active sources until Fabric is live (not four)
- Fabric question handling standardized: use the "coming soon" bridge line, not silence

### 2026-07-09 — Demo Readiness Checklist (Issue #7)

Created `docs/demo-readiness-checklist.md` — a day-of-demo sign-off sheet covering all core prerequisites for the HealthBridge Knowledge IQ demo.

**Checklist structure (8 sections):**
- Section 1: Azure Infrastructure (7 items) — owner: Data
- Section 2: RBAC & Managed Identity (4 items) — owner: Data
- Section 3: Data Sources & Connections (7 items, Fabric flagged ⚠️) — owner: Data
- Section 4: Sample Data (6 items) — owner: Mouth
- Section 5: Knowledge Base & Agent (9 items) — owner: Chunk
- Section 6: Playground & Presenter Setup (7 items) — owner: Presenter
- Section 7: End-to-End Smoke Tests (5 prompts, S5 optional pending Fabric)
- Section 8: Sign-Off table (Data, Mouth, Chunk, Mikey, Presenter)

**Key decision:** Fabric Data Agent treated as conditional — S5 and Prompts 4/5 marked optional. Demo is GO with S1–S4 passing and three active sources (MCP, Blob, AI Search). Filed decision to inbox: `mouth-7-fabric-conditional-skip.md`.

**Sources used:** `docs/demo-flow.md`, `docs/demo-script.md`, `docs/azure-setup.md`, `docs/connection-status.md`

---

## Learnings

- Healthcare payor domain uses ICD-10-CM diagnosis codes, CPT procedure codes, NPI identifiers for providers, and structured member IDs (e.g., MBR-YYYY-NNNNNN).
- Claims data must link member IDs to both member records and provider NPIs for consistency — critical for demo queries that span multiple Knowledge Base data sources.
- Prior auth numbers (PA-YYYY-NNNNNN) should appear in both claim records and member records for cross-reference realism.
- Illinois is a realistic single-state HMO service area for a mid-size health plan; city names Springfield, Naperville, Peoria add geographic coherence.
- Fictional brand name: **HealthBridge Insurance Plan** — PPO Gold, HMO Silver, PPO Platinum (MAPD) tiers.

## Work Log

### 2026-06-05 — Sample Data Expansion (Task by Rob McKenna)

Expanded sample-data/ across all six categories:

**Members (5 new JSON files):**
- `MBR-2024-004512` — Denise R. Kowalski, PPO Silver, individual, active, Rockford IL (Winnebago County)
- `MBR-2024-005789` — Gregory T. Odom, EPO Gold, family (spouse + 2 kids), active, Chicago IL, pending PA for MRI
- `MBR-2024-006301` — Amara J. Osei, HMO Bronze, individual, active, Aurora IL, approved PA for cholecystectomy
- `MBR-2024-007045` — Linda F. Wentworth, PPO Platinum (commercial), family (spouse), active, Evanston IL
- `MBR-2024-008173` — Carlos E. Reyes, HMO Silver, individual, TERMED 2026-03-31, Joliet IL, COBRA eligible

**Claims (5 new JSON files):**
- `CLM-2026-0058234` — Kowalski, lab (CBC/CMP), DENIED (CO-50 — not medically necessary), with denialInfo + appeal deadline
- `CLM-2026-0063901` — Odom, MRI lumbar (72148), PENDING (PA-2026-091204 pending), with pendingInfo block
- `CLM-2026-0071445` — Osei, laparoscopic cholecystectomy (47562), PAID, institutional, PA-2026-078855
- `CLM-2026-0079823` — Nguyen (existing), physical therapy 25 visits (97110/97530), UNDER_REVIEW (visits 21-25 exceed plan threshold), with reviewInfo block
- `CLM-2026-0082156` — Wentworth, adalimumab injection (J0135), DENIED (no PA, step therapy not met), with denialInfo

**Providers (4 new JSON files):**
- `NPI-4567890123` — Dr. Marcus J. Obi, Psychiatry, individual, in-network, Chicago IL
- `NPI-5678901234` — Prairie Radiology & Imaging Associates (org), Diagnostic Radiology, in-network, Springfield + Naperville
- `NPI-6789012345` — Dr. Susan M. Okafor, Family Medicine, OUT_OF_NETWORK (contract terminated 2025-12-31), Rockford IL
- `NPI-7890123456` — Midwest Physical & Occupational Therapy LLC (org), PT/OT, in-network, Aurora + Naperville

**Policies (3 new Markdown files):**
- `mri-prior-auth-policy.md` — CP-2026-PA-002: Advanced imaging PA (MRI, CT, PET); CPT codes, clinical criteria for lumbar MRI and brain MRI, ACR Appropriateness Criteria reference
- `physical-therapy-policy.md` — CP-2026-PA-003: PT/OT/SLP threshold-based PA (>20 visits); functional improvement criteria; ABA all-visits PA; CPT codes
- `specialty-drug-prior-auth-policy.md` — CP-2026-PA-004: Specialty pharmacy PA; step therapy for RA (DMARD → biosimilar → originator), IBD, oncology, GLP-1 weight management; preferred specialty pharmacy requirement

**Benefits (4 new Markdown files):**
- `ppo-silver-benefit-summary.md` — PPO Silver: $1,200 ded, $4,500 OOP, $30 PCP, 30% coinsurance
- `epo-gold-benefit-summary.md` — EPO Gold: $750 ded, $4,000 OOP, $20 PCP, 20% coinsurance, in-network only (EPO explanation included)
- `hmo-bronze-benefit-summary.md` — HMO Bronze: $3,500 ded, $7,500 OOP, $50 PCP, 40% coinsurance, HDHP/HSA note
- `ppo-platinum-benefit-summary.md` — PPO Platinum: $250 ded, $2,000 OOP, $10 PCP, 10% coinsurance, enhanced dental/gym/acupuncture benefits

**Formulary — new directory + 10 drug JSON files:**
- `metformin-hcl-500mg.json` — Tier 1, diabetes, no PA, preferred generic
- `atorvastatin-40mg.json` — Tier 1, statin, no PA, preferred generic
- `lisinopril-10mg.json` — Tier 1, ACE inhibitor, no PA, preferred generic
- `empagliflozin-jardiance-10mg.json` — Tier 3, SGLT-2 inhibitor, step therapy (except ASCVD/HFrEF/CKD), brand
- `apixaban-eliquis-5mg.json` — Tier 3, DOAC anticoagulant, no step therapy, quantity limit (60 tabs/30d)
- `adalimumab-humira-40mg.json` — Tier 5 specialty non-preferred, TNF inhibitor biologic, PA + 2-step therapy (DMARD→biosimilar→Humira)
- `adalimumab-biosimilar-hadlima-40mg.json` — Tier 4 specialty preferred, biosimilar, PA + 1-step (DMARD), preferred over Humira
- `pembrolizumab-keytruda-100mg.json` — Tier 4 specialty, PD-1 oncology, PA (no step therapy), buy-and-bill J-code pathway noted
- `oxycodone-hcl-ir-10mg.json` — Tier 2, Schedule II opioid, quantity limit (120/30d), step therapy, no mail-order, PDMP note
- `buprenorphine-naloxone-suboxone-8mg.json` — Tier 2, Schedule III MAT/OUD, PA required (DEA waiver), quantity limit (60 films/30d)

**Schema extensions added for new data types:**
- `denialInfo` object added to DENIED claims (denialCode, denialReason, appealDeadline, appealInstructions)
- `pendingInfo` object added to PENDING claims (pendingReasonCode, pendingReason, expectedResolutionDate)
- `reviewInfo` object added to UNDER_REVIEW claims (reviewReasonCode, reviewReason, reviewType, expectedResolutionDate)
- `terminationInfo` object added to TERMED members (terminationDate, reason, cobraEligible, cobraNoticeDate, cobraElectionDeadline)
- `outOfNetworkInfo` object added to OUT_OF_NETWORK providers (reason, terminationDate, patientTransitionNoticeDate)
- Formulary schema includes: formularyId, tier/tierDescription, therapeuticClass, requiresPriorAuth, stepTherapyRequired/stepTherapyDetails, quantityLimit/quantityLimitReason, specialtyPharmacy, clinicalAlerts, formularyStatus

**Patterns used:**
- All member IDs cross-referenced with claim memberId fields for consistency
- PA numbers appear in both member priorAuthorizations[] and claim priorAuthorizationNumber
- Out-of-network provider included (NPI-6789012345) to enable demo scenarios around network status checking
- TERMED member (MBR-2024-008173) includes COBRA notice data for eligibility demo scenarios
- Formulary uses NDC codes in XX-masked format for synthetic safety; J-codes documented in notes for buy-and-bill scenarios
- Biosimilar vs. originator distinction (Hadlima Tier 4 vs. Humira Tier 5) enables step therapy demo story

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
- `NPI-1234567890` — Dr. Patricia M. Chen, Internal Medicine, HealthBridge Primary Care Associates
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

**Expansion Phase (2026-06-05):**
- **Data defined formulary schema:** Updated with fields: formularyId, tier, requiresPriorAuth, stepTherapyRequired, quantityLimit, NDC (XX-masked), therapeuticClass, clinicalAlerts, etc. You used this exact schema for the 10 formulary drug records — alignment perfect.
- **Data built MCP server (7 tools):** lookup_member, lookup_claim, lookup_provider, check_benefits, check_formulary, check_eligibility, check_prior_auth. All tools tested live against your expanded sample data. Server HTTP transport ready for Foundry deployment.
- **Brand standardization:** All 48 files in repo standardized to "HealthBridge Insurance Plan" (brand: HealthBridge, portal: HealthBridge.example.com, phone: 1-800-555-BLUE). This includes your sample data files — consistent across all team work.
- **Schema extensions documented:** Data's decision captures the exact claim status extensions you implemented (denialInfo, pendingInfo, reviewInfo), member termination + COBRA fields, and provider network status. These are now canonical for the project.
