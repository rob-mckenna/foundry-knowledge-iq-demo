# Test Prompts — Eligibility & Benefits

Use these prompts to validate agent behavior for member eligibility lookup, benefit coverage queries, and cost-sharing questions. All prompts reference synthetic HealthBridge Insurance Plan data.

---

## Prompt EB-1 — Basic Eligibility Check

**Prompt:**
> "I'm John Hartwell, member ID MBR-2024-001234. Am I still covered?"

**Expected Data Source(s):**
- `fabric-data-agent-claims` (via `lookup_member` MCP tool for real-time eligibility)

**Expected Response Characteristics:**
- Confirms membership status is **ACTIVE** as of the query date
- Returns plan name: **HealthBridge PPO Gold** (PPO-GOLD-2026)
- States effective date: January 1, 2026; no termination date on file
- Notes PCP assignment: Dr. Patricia M. Chen, HealthBridge Primary Care Associates
- Offers to check specific benefits or accumulators if the member needs more detail
- Does **not** disclose SSN, tax ID, or other sensitive fields

---

## Prompt EB-2 — Deductible Accumulator Lookup

**Prompt:**
> "How much of my deductible have I used so far this year? My member ID is MBR-2024-001234."

**Expected Data Source(s):**
- `fabric-data-agent-claims` (via `lookup_member` for accumulator data)

**Expected Response Characteristics:**
- Returns individual deductible: **$500 limit, $500 met, $0 remaining** — fully satisfied
- Returns family deductible: **$1,000 limit, $500 met, $500 remaining**
- Notes benefit year: 2026; data as of June 5, 2026
- Clarifies that the deductible does not apply to preventive care, PCP visits, or Tier 1 generics (PPO Gold plan)
- Suggests checking out-of-pocket maximum if the member wants the full picture

---

## Prompt EB-3 — Out-of-Pocket Maximum Status

**Prompt:**
> "What's my out-of-pocket maximum, and how close am I to hitting it? I'm on the HealthBridge PPO Gold plan."

**Expected Data Source(s):**
- `blob-storage-plan-documents` (via `check_benefits` for plan OOP max)
- `fabric-data-agent-claims` (via `lookup_member` for accumulator data if member ID provided)

**Expected Response Characteristics:**
- For HMO Silver (MBR-2024-002891): Individual OOP max is **$5,000**; $3,654 met, **$1,346 remaining**
- For PPO Gold (MBR-2024-001234): Individual OOP max is **$3,000**; $520 met, **$2,480 remaining**
- Clarifies what counts toward the OOP max (copays, deductibles, coinsurance; excludes premiums and non-covered services)
- Correctly distinguishes individual vs. family OOP tracking

---

## Prompt EB-4 — Coverage for a Specific Service (MRI)

**Prompt:**
> "Is an MRI of my knee covered under my plan? What will it cost me?"

**Expected Data Source(s):**
- `blob-storage-plan-documents` (via `check_benefits` for advanced imaging cost-sharing)
- `mcp-prior-auth-policies` (via `get_prior_auth_requirements` for MRI PA requirement)

**Expected Response Characteristics:**
- Confirms MRI is a covered benefit under "Advanced Imaging" for HMO Silver (30% coinsurance after deductible)
- Flags that advanced imaging **requires prior authorization** on HMO and MAPD plans
- Notes that the commercial PPO plan waives PA for in-network MRI (per CP-2026-PA-001 §2.1)
- Provides cost estimate based on plan tier and remaining deductible
- Instructs member that ordering provider submits the PA on their behalf

---

## Prompt EB-5 — Specialist Referral and Copay (HMO-Specific)

**Prompt:**
> "I need to see an orthopedic surgeon. Do I need a referral first, and what's my copay?"

**Expected Data Source(s):**
- `blob-storage-plan-documents` (via `check_benefits` for specialist visit cost-sharing and HMO referral rules)

**Expected Response Characteristics:**
- For HMO Silver members: **Yes, a PCP referral is required** before seeing a specialist
- Returns specialist copay: **$60 per visit** (HMO Silver)
- Mentions OB/GYN exception but confirms orthopedic surgery is not a direct-access specialty
- Explains how to request a referral through the HealthBridge Member Portal
- Notes that orthopedic procedures (e.g., surgery) are subject to separate facility/surgery cost-sharing

---

## Prompt EB-6 — Dependent Eligibility Question

**Prompt:**
> "Is my spouse Claire Hartwell covered under my plan? She was in the hospital last month."

**Expected Data Source(s):**
- `fabric-data-agent-claims` (via `lookup_member` for dependent roster)

**Expected Response Characteristics:**
- Identifies Claire E. Hartwell (MBR-2024-001235) as an active dependent, relationship: SPOUSE
- Confirms she is enrolled on PPO-GOLD-2026
- Does **not** disclose her claims data in bulk — redirects to Member Services or secure portal for her specific claim details
- Explains that family deductible and OOP max apply to the household
- Provides Member Services contact: 1-800-555-BLUE

---

*Test prompts version: 1.0 | Effective: 2026-06-05 | Data source: HealthBridge synthetic member data*
