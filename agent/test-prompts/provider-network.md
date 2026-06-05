# Test Prompts — Provider Network

Use these prompts to validate agent behavior for provider directory lookups, network status verification, accepting-new-patients checks, and specialist search scenarios. All prompts reference HealthBridge AI Search provider index data.

---

## Prompt PN-1 — Provider In-Network Check by Name

**Prompt:**
> "Is Dr. Patricia Chen in network for my HealthBridge plan?"

**Expected Data Source(s):**
- `ai-search-providers` (via `lookup_provider` MCP tool searching providerName="Patricia Chen")

**Expected Response Characteristics:**
- Returns Dr. Patricia M. Chen, MD (NPI: 1234567890)
- Network status: **ACTIVE_IN_NETWORK** — Preferred Tier 1
- Specialty: Internal Medicine, HealthBridge Primary Care Associates
- Location: 1450 Medical Center Drive, Suite 210, Springfield, IL 62704 | Phone: 555-0100
- Accepting new patients: **Yes**
- Hours: Mon–Fri (closes 4 PM Friday); Saturday 9 AM–12 PM
- Languages spoken: English and Mandarin
- Hospital affiliations: Springfield General Hospital (admitting privileges)
- Notes 4.5-star quality rating and HEDIS HIGH compliance

---

## Prompt PN-2 — Orthopedic Group Network Verification

**Prompt:**
> "Is Lakeside Orthopedic Group in my network? I may need knee surgery."

**Expected Data Source(s):**
- `ai-search-providers` (via `lookup_provider` searching organizationName="Lakeside Orthopedic")

**Expected Response Characteristics:**
- Returns Lakeside Orthopedic Group LLC (NPI: 2345678901)
- Network status: **ACTIVE_IN_NETWORK** — Preferred Tier 1
- Specialty: Orthopaedic Surgery; Sports Medicine
- Main clinic: 480 Lakeshore Blvd, Suite 100, Springfield, IL 62704 | Phone: 555-0250
- Surgical center: Lakeside Surgical Center, Suite 300 (same address) | Phone: 555-0260
- Accepting new patients: **Yes** (both locations)
- Practitioners: Dr. Kevin L. Okoye (joint replacement) and Dr. Melissa A. Briggs (sports medicine)
- Notes that **prior authorization is required** for major orthopedic procedures (CPT 27447, 27130, 29827) at this facility
- Quality: 4.8 stars; joint replacement outcome score: EXCELLENT

---

## Prompt PN-3 — Cardiologist Search — Accepting New Patients

**Prompt:**
> "Can you find me a cardiologist in the HealthBridge network who is accepting new patients?"

**Expected Data Source(s):**
- `ai-search-providers` (semantic + vector search for specialty="Cardiovascular Disease" AND acceptingNewPatients=true)

**Expected Response Characteristics:**
- Returns Dr. Robert J. Vasquez, MD, FACC (NPI: 3456789012)
- Specialty: Cardiovascular Disease; Clinical Cardiac Electrophysiology
- Network status: ACTIVE_IN_NETWORK — Preferred Tier 1
- Accepting new patients: **Yes** at Peoria main office (555-0340); **not** at Springfield satellite (Wednesday afternoons only)
- Practice: Heartland Cardiovascular Specialists LLC, 3300 Heart Center Way, Peoria, IL 61602
- Hospital affiliations: Peoria Heart & Vascular Center; Springfield General Hospital
- Languages: English and Spanish
- Quality: 4.9 stars; cardiac readmission rate below benchmark
- Note: Springfield satellite office has limited hours (Wednesday 1–5 PM only) and is not accepting new patients

---

## Prompt PN-4 — Out-of-Network Status Inquiry (HMO Member)

**Prompt:**
> "I want to see a spine specialist I found online. She's not in your directory. Can I still use her?"

**Expected Data Source(s):**
- `ai-search-providers` (search returns no match)
- `blob-storage-plan-documents` (via `check_benefits` for out-of-network HMO policy)

**Expected Response Characteristics:**
- Confirms the provider is **not found** in the HealthBridge network directory
- For **HMO Silver** members: out-of-network services are **not covered** except for true medical emergencies, urgent care while traveling, or services authorized in advance by HealthBridge
- Explains that seeing an out-of-network provider without prior approval means the member will be **fully responsible for the cost**
- Suggests alternatives:
  1. Search the HealthBridge online directory at HealthBridge.example.com/find-a-doctor for in-network spine specialists
  2. Ask the current PCP for an in-network specialist referral
  3. If the member has a compelling clinical reason, they may request a **network adequacy exception** through Member Services
- For PPO members: out-of-network is covered at a reduced rate (higher cost-sharing applies)

---

## Prompt PN-5 — PCP Change Request Information

**Prompt:**
> "I want to switch my primary care doctor. How do I do that, and how often can I change?"

**Expected Data Source(s):**
- `blob-storage-plan-documents` (via `check_benefits` for PCP assignment rules)

**Expected Response Characteristics:**
- Confirms HMO members can change their PCP **once per month**
- Explains how to request a PCP change: member portal at HealthBridge.example.com/find-a-doctor, or by calling Member Services (1-800-555-BLUE)
- New PCP assignment takes effect the first of the following month unless an earlier date is requested for a clinical reason
- Advises the member to choose a PCP who is in the HealthBridge HMO network, accepting new patients, and in their geographic service area
- Offers to look up available PCPs in their area if the member provides a zip code

---

## Prompt PN-6 — Hospital Affiliation and Facility Network Check

**Prompt:**
> "If I'm admitted to Springfield General Hospital, is that covered under my plan?"

**Expected Data Source(s):**
- `ai-search-providers` (facility lookup for "Springfield General Hospital")
- `blob-storage-plan-documents` (inpatient benefit cost-sharing)

**Expected Response Characteristics:**
- Confirms Springfield General Hospital is affiliated with in-network providers (e.g., Dr. Chen and Dr. Vasquez both hold admitting privileges there)
- Notes that facility network status and physician network status are **separate** — the treating physicians must also be in-network
- For HMO Silver: inpatient hospital is covered at **30% coinsurance after deductible** (PA required for non-emergency admissions)
- For emergency admissions: covered regardless of network status; member notifies HealthBridge within 24 hours
- Suggests member verify hospital network status by calling Member Services or checking the facility directory at HealthBridge.example.com

---

*Test prompts version: 1.0 | Effective: 2026-06-05 | Data source: HealthBridge synthetic provider directory*
