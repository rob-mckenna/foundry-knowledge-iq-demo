# Test Prompts — Prior Authorization

Use these prompts to validate agent behavior for prior authorization requirement lookups, clinical criteria queries, PA status checks, and submission guidance. All prompts reference HealthBridge Insurance Plan policy CP-2026-PA-001 and synthetic member data.

---

## Prompt PA-1 — Does a Service Require Prior Auth? (Knee MRI)

**Prompt:**
> "Does a knee MRI require prior authorization under my HealthBridge HMO Silver plan?"

**Expected Data Source(s):**
- `mcp-prior-auth-policies` (via `get_prior_auth_requirements` with serviceCategory="MRI" or procedureCode="73721")
- `blob-storage-plan-documents` (benefit summary confirmation)

**Expected Response Characteristics:**
- Confirms that advanced imaging (MRI) **requires prior authorization** on HMO and MAPD plans
- Notes the commercial PPO Gold plan waives PA for in-network MRI (per CP-2026-PA-001 §2.1)
- Explains that the ordering provider (not the member) submits the PA request
- Standard decision turnaround: **3 business days** (standard) or **72 hours** (urgent/expedited)
- Provides provider submission channel: HealthBridge-provider.example.com → "Auth Request" or fax 555-0199

---

## Prompt PA-2 — Clinical Criteria for Knee Replacement

**Prompt:**
> "What criteria does HealthBridge use to approve a total knee replacement?"

**Expected Data Source(s):**
- `mcp-prior-auth-policies` (via `get_clinical_coverage_criteria` with serviceCode="27447" or `get_prior_auth_requirements`)
- `blob-storage-plan-documents` (CP-2026-PA-001 §4.1)

**Expected Response Characteristics:**
- Returns ALL five clinical criteria from CP-2026-PA-001 §4.1:
  1. Severe knee osteoarthritis confirmed by X-ray (weight-bearing views)
  2. Significant functional impairment (pain ≥ 7/10 VAS or inability to perform 2+ ADLs)
  3. Failure of ≥ 3 months conservative management: NSAIDs, PT (min 6 sessions), and ≥ 1 intra-articular injection
  4. BMI ≤ 40 (or bariatric consultation documentation for BMI > 40)
  5. Medical clearance from PCP or relevant specialist
- Notes exclusions (isolated patellofemoral arthritis, revision TKA within 2 years)
- Confirms procedure requires PA on all plans
- Explains that the surgeon's office typically prepares and submits the PA package

---

## Prompt PA-3 — PA Status Check for an Approved Request

**Prompt:**
> "Can you check the status of prior auth PA-2026-087341?"

**Expected Data Source(s):**
- `fabric-data-agent-claims` (via `lookup_member` or dedicated PA status query)

**Expected Response Characteristics:**
- Returns PA status: **APPROVED**
- Procedure: Total Knee Arthroplasty — Right (CPT 27447)
- Member: Sarah L. Nguyen (MBR-2024-002891)
- Requested: April 10, 2026 | Approved: April 14, 2026 (4 calendar days; within standard 3-business-day window)
- Authorization effective: April 14 – October 14, 2026
- Approving clinician: Dr. A. Mercer, MD — Clinical Review
- Approved units: 1
- Notes this authorization has been utilized (matched to claim CLM-2026-0061872)

---

## Prompt PA-4 — PA Requirements for Physical Therapy

**Prompt:**
> "How many physical therapy visits can I have before I need prior authorization?"

**Expected Data Source(s):**
- `mcp-prior-auth-policies` (via `get_prior_auth_requirements` with serviceCategory="Physical Therapy")
- `blob-storage-plan-documents` (benefit summary for PT visit limits)

**Expected Response Characteristics:**
- Returns that PT does **not** require PA for the first **20 visits per benefit year** (per CP-2026-PA-001 §2.2)
- PA is required for visits **beyond 20** per benefit year
- HMO Silver copay: $40 per PT visit
- PA for extended PT: submitted by ordering provider with treatment plan and documented functional progress
- Applies equally to Occupational Therapy and Speech Therapy (same 20-visit threshold)
- Notes the benefit year resets January 1

---

## Prompt PA-5 — Home Health Services Authorization

**Prompt:**
> "My mother was just discharged from the hospital and needs home health care. Does that require prior authorization?"

**Expected Data Source(s):**
- `mcp-prior-auth-policies` (via `get_prior_auth_requirements` with serviceCategory="Home Health")
- `blob-storage-plan-documents`

**Expected Response Characteristics:**
- Confirms that **home health services require PA on all HealthBridge plans**
- Initial authorization covers up to **60 visits**
- PA is submitted by the home health agency or discharging provider — not the member
- Turnaround: 3 business days standard; 72 hours expedited
- Post-discharge setting: hospitals typically coordinate the PA before discharge; member should ask the case manager
- Provides HealthBridge Provider Services line (555-0190) for urgent same-day authorization requests
- Agent empathetically acknowledges the transition and offers to help with additional benefit questions

---

## Prompt PA-6 — Bariatric Surgery Coverage and Criteria

**Prompt:**
> "I'm considering weight loss surgery. Does my plan cover it and what do I need to qualify?"

**Expected Data Source(s):**
- `mcp-prior-auth-policies` (via `get_clinical_coverage_criteria` with serviceCode="bariatric" or "sleeve gastrectomy")
- `blob-storage-plan-documents` (coverage criteria and exclusions)

**Expected Response Characteristics:**
- Confirms bariatric surgery (e.g., sleeve gastrectomy) is a **covered benefit** subject to PA
- Returns qualifying criteria from CP-2026-PA-001:
  - BMI ≥ 40, **OR** BMI ≥ 35 with documented comorbidities (e.g., T2DM, hypertension, sleep apnea)
  - Behavioral health evaluation required prior to submission
  - Documentation of prior supervised weight loss attempts
- PA submission by the bariatric surgeon's office with H&P, behavioral health evaluation, and weight/BMI documentation
- Standard review: 3 business days
- Agent notes it cannot advise on whether surgery is the right medical choice — directs to the member's care team for that guidance

---

*Test prompts version: 1.0 | Effective: 2026-06-05 | Data source: HealthBridge CP-2026-PA-001 and synthetic member data*
