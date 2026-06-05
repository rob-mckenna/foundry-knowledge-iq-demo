# Test Prompts — Claims & EOB

Use these prompts to validate agent behavior for claim status inquiries, explanation of benefits (EOB) interpretation, denial handling, and appeals guidance. All prompts reference synthetic HealthBridge Insurance Plan claim data.

---

## Prompt CL-1 — Claim Status by Claim ID

**Prompt:**
> "What's the status of claim CLM-2026-0054321?"

**Expected Data Source(s):**
- `fabric-data-agent-claims` (via `lookup_claim` MCP tool)

**Expected Response Characteristics:**
- Returns status: **PAID** (processed May 19, 2026; service date May 12, 2026)
- Identifies member: John A. Hartwell (MBR-2024-001234)
- Rendering provider: Dr. Patricia M. Chen, Internal Medicine
- Services: Office visit (99213, $220 billed, $20 member responsibility) + ECG (93000, $65 billed, $0 member responsibility)
- Total member responsibility: **$20.00** (copay only; deductible previously satisfied)
- Explains adjustment reason CO-45: "Charges exceed contracted fee" — this is a normal contractual adjustment, not a penalty

---

## Prompt CL-2 — EOB Explanation (Plain Language)

**Prompt:**
> "I got an Explanation of Benefits for a visit on May 12th. It shows $285 billed but only $166.50 paid. Why is there such a big difference?"

**Expected Data Source(s):**
- `fabric-data-agent-claims` (via `lookup_claim` matching service date)
- `blob-storage-plan-documents` (for contractual adjustment explanation)

**Expected Response Characteristics:**
- Identifies the claim as CLM-2026-0054321 (May 12 office visit and ECG)
- Explains the three components:
  1. **Contractual adjustment** (CO-45): $98.50 — the difference between billed ($285) and allowed ($186.50) amounts; this is what your provider agreed to write off
  2. **Plan paid**: $166.50 — HealthBridge's payment to the provider
  3. **Member responsibility**: $20.00 — your $20 specialist copay
- Reassures member that CO-45 adjustments are routine contractual write-offs and not the member's responsibility
- Offers to explain any specific line item in more detail

---

## Prompt CL-3 — Claim for a Major Procedure (Knee Replacement)

**Prompt:**
> "I had a knee replacement surgery in April. Can you tell me what was paid and what I owe?"

**Expected Data Source(s):**
- `fabric-data-agent-claims` (via `lookup_claim` for member MBR-2024-002891)

**Expected Response Characteristics:**
- Identifies claim CLM-2026-0061872 (April 28, 2026; processed May 8)
- Member: Sarah L. Nguyen, HMO Silver
- Procedure: Total Right Knee Arthroplasty (CPT 27447) at Lakeside Surgical Center
- Billed: $32,500 | Allowed: $18,200 | Plan paid: $14,546 | **Member responsibility: $3,654**
- Explains breakdown: $1,500 deductible (fully satisfied by this claim) + $2,154 coinsurance (30% of remaining allowed)
- Notes prior authorization PA-2026-087341 was confirmed for this procedure
- Notes member's deductible is now fully met for the year; future services subject to 30% coinsurance only until OOP max

---

## Prompt CL-4 — Claim Status for a Cardiology Visit

**Prompt:**
> "Did my echocardiogram get paid? The claim was from around May 20th."

**Expected Data Source(s):**
- `fabric-data-agent-claims` (via `lookup_claim` matching service date and procedure type)

**Expected Response Characteristics:**
- Identifies claim CLM-2026-0047990 (May 20, 2026; member Marcus D. Thompson, MAPD)
- Returns echocardiogram line (CPT 93306): **billed $1,540, allowed $724, plan paid $724, member responsibility $0**
- Explains that the echocardiogram was paid at 100% because deductible was already satisfied for this Platinum plan member
- Office visit copay ($40) applies separately to the 99214 line
- Confirms claim status: **PAID** (processed May 27, 2026)

---

## Prompt CL-5 — Hypothetical Denial Scenario (Prior Auth Not Obtained)

**Prompt:**
> "My claim was denied because prior authorization wasn't obtained. What does that mean and can I appeal?"

**Expected Data Source(s):**
- `blob-storage-plan-documents` (for denial reason explanation and appeals policy)
- `mcp-prior-auth-policies` (for PA submission guidance)

**Expected Response Characteristics:**
- Explains that "prior authorization not obtained" means the service required advance approval, but HealthBridge received the claim without a corresponding approved PA on file
- Distinguishes between: (a) no PA was submitted, (b) PA was submitted but not approved before service, (c) PA was submitted in error
- Outlines appeal options:
  1. **First-level appeal** — reviewed by same-specialty clinician; decision within 30 days (standard) or 72 hours (urgent)
  2. **Second-level appeal** — peer-to-peer review or Independent Review Organization (IRO)
- Provides appeal submission guidance: HealthBridge.example.com/appeals or 1-800-555-BLUE
- Notes the appeal deadline and recommends gathering clinical documentation

---

## Prompt CL-6 — Year-to-Date Claims Summary

**Prompt:**
> "How much has the plan paid on my behalf so far this year? I'm curious about my total claims."

**Expected Data Source(s):**
- `fabric-data-agent-claims` (aggregate claim query for member)

**Expected Response Characteristics:**
- Returns year-to-date summary for the authenticated/specified member
- For MBR-2024-001234 (Hartwell): shows CLM-2026-0054321 as primary claim; plan paid $166.50 YTD
- For MBR-2024-002891 (Nguyen): shows CLM-2026-0061872; plan paid $14,546 YTD
- Includes accumulator snapshot (deductible met, OOP met) to contextualize the summary
- Does **not** return detailed claims for other members without authentication context
- Notes that the member can view a full claims history in the HealthBridge member portal at HealthBridge.example.com

---

*Test prompts version: 1.0 | Effective: 2026-06-05 | Data source: HealthBridge synthetic claims data*
