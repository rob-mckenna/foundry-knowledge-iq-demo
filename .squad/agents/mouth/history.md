# Mouth — History (Summarized 2026-07-09)

## Project Context
- **Project:** foundry-knowledge-iq-demo — Demo of Knowledge IQ in Azure AI Foundry for a healthcare payor
- **Stack:** Azure AI Foundry, AI Search, Blob Storage, Fabric Data Agent, MCP
- **User:** Rob McKenna

## Current Status

**Completed Work:**
- ✅ Created 48 healthcare payor sample data files (8 members, 8 claims, 7 providers, 10 drugs, 6 policies)
- ✅ Demo readiness checklist with 19-item sign-off matrix (PR #15)
- ✅ Presenter materials (quick-reference card, screenshot capture guide)
- ✅ Demo script finalized for 3 active sources (Fabric documented as "coming soon")
- ✅ All brand standardized to "HealthBridge Insurance Plan"
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

### 2026-07-09 — Demo Readiness Checklist Creation (Task #7 by Rob McKenna)

Created `docs/demo-readiness-checklist.md` — a comprehensive operational guide for verifying all demo dependencies before a live presentation to healthcare payor decision-makers.

**Key realization:** A demo readiness checklist is not just a binary pass/fail list — it's a **risk mitigation document**. The checklist identifies high-risk items (MCP timeout, AI Search empty), provides quick troubleshooting commands, and defines **fallback procedures** for each failure scenario. This is critical for field sales, where a demo failure costs pipeline credibility.

**Checklist structure:**
1. **Pre-demo infrastructure checks** (6 sections) — Azure OpenAI, AI Search, Blob, MCP, resource group verification with CLI commands
2. **Foundry configuration checks** (3 sections) — connections, knowledge base, agent status with portal navigation steps
3. **Data completeness checks** (3 sections) — MCP sample data, AI Search index document counts, Blob storage documents with exact verification queries
4. **Demo flow validation** (5 sections) — one test prompt per Act with expected response keywords, pass/fail/timeout tracking
5. **Fallback & contingency procedures** (4 scenarios) — MCP timeout, AI Search empty, agent unavailable, data mismatch with step-by-step recovery or fallback demo videos
6. **Sign-off table** — matrix of 19 items (infrastructure, configuration, data, demo flow, backups) with owner, status, verification date, notes columns
7. **Pre-demo day-of checklist** (30 min, 15 min, during demo)
8. **Contact & escalation** — email list for each role
9. **Data reference appendix** — exact member ID, claim ID, drug, provider used in demo

**Domain accuracy embedded:**
- All member, claim, and provider IDs match the live sample data (MBR-2024-002891, CLM-2026-0061872, Dr. Patricia Chen, celecoxib)
- Prior auth scenario (PT > 20 visits) grounded in actual policy from sample data
- EOB math verified ($1,500 ded + 30% coinsurance = $3,654) against HMO Silver benefit tier
- Fallback procedures acknowledge payor-specific risks: "Data must be current as of demo date" and "Fabric Data Agent connection may not be ready"

**Audience:** Field sales / presenter doing live demo to healthcare payor CIO + medical director + head of member services.

**High-risk items flagged:** MCP Server timeout (mitigation: prerecorded Acts 1-2-3), AI Search empty (mitigation: skip to architecture explanation), Agent downtime (mitigation: full video fallback), Data mismatch (mitigation: use alternate member/claim).

---

- Healthcare payor domain uses ICD-10-CM diagnosis codes, CPT procedure codes, NPI identifiers for providers, and structured member IDs (e.g., MBR-YYYY-NNNNNN).
- Claims data must link member IDs to both member records and provider NPIs for consistency — critical for demo queries that span multiple Knowledge Base data sources.
- Prior auth numbers (PA-YYYY-NNNNNN) should appear in both claim records and member records for cross-reference realism.
- Illinois is a realistic single-state HMO service area for a mid-size health plan; city names Springfield, Naperville, Peoria add geographic coherence.
- Fictional brand name: **HealthBridge Insurance Plan** — PPO Gold, HMO Silver, PPO Platinum (MAPD) tiers.

## Current Status (as of 2026-07-09)

**Round 3 Fixes Completed (Turn 3):**
- ✅ PR #13: Updated quick-reference-card.md persona to Sarah Nguyen (MBR-2024-002891), committed + commented
- ✅ PR #15: Fixed demo duration (45 min → 5 min), updated member ID in MCP verification command, committed + commented
- ✅ PR #17: Fixed EOB math in Act 2 (removed erroneous 30% narration, kept correct copay), updated celecoxib reference table (Tier 2, $45/$110), committed + commented

All 3 PRs now in review queue awaiting Mikey's re-review post-fix.



## Key Learnings

- Healthcare payor demos must link member IDs consistently across claims/eligibility/provider records
- Prior auth numbers (PA-YYYY-NNNNNN) should appear in both claim and member records
- Illinois as service area with HMO tiers (Silver/Gold/Platinum) is realistic
- "Explain my EOB" is the highest-value prompt category for payor audiences
- Demo readiness checklist must include fallback procedures for each failure scenario (not just pass/fail)
- **Demo script = narrative journey, not just prompts** — "Sarah Nguyen Story" (post-op member) is emotionally relatable and showcases all data sources
- Presenter script tone must be consultative + payor-literate (use "member", "coordinator", "EOB", not "knowledge chunk")
- 5-minute live demo + 2–3 minute close + Q&A is the right cadence for healthcare payor CIO audience
- Each demo Act should reference a real call driver (15 min manual work → 3 min instant answer)
- Fallback procedures for demo script are as critical as readiness checklist (MCP timeout, AI Search empty, agent unavailable)

## Cross-Team Dependencies

- **Data:** 45 plan documents + 3 AI Search indexes live
- **Chunk:** System prompt + 30 test prompts + agent definition ready
- **Mikey:** KB connection guide validated; team coordination
- **Alignment:** All files use HealthBridge Insurance Plan brand; member IDs consistent across sources

## Files Created

- docs/demo-readiness-checklist.md — operational guide with 19-item checklist, fallback procedures
- ssets/screenshots/README.md — capture instructions for 8 demo screenshots
- ssets/presenter/quick-reference-card.md — single-page presenter cheat sheet
- sample-data/ — 48 healthcare payor files (consistent IDs, IL HMO focus)
- docs/demo-script.md — 5-act narrative with talking points


## Round 2 Updates (2026-07-09)

**Completed:**
- ✅ Created docs/demo-script.md with "The Sarah Nguyen Story" (Issue #10)
- ✅ Implemented 5-Act timed demo structure with talking points
- ✅ Added fallback procedures and speaker guidance
- ✅ Changes staged in PR #17

**Status:** Demo script ready for presenter review and live Foundry validation

## Round 4 Updates (2026-07-09)

**Turn 4 — Content Fixes for PRs #13 and #17:**

### PR #13 Narrative Update
- ✅ Updated `assets/presenter/quick-reference-card.md` persona from Marcus Hartwell to Sarah Nguyen
- ✅ Purged all Marcus Hartwell references (MBR-2024-001234, PPO Gold plan)
- ✅ Aligned quick-reference to Sarah Nguyen narrative (MBR-2024-002891, HMO Silver, knee replacement)
- ✅ Committed; PR #13 now ready for Mikey re-review

### PR #17 Critical Fixes
- ✅ Fixed Act 2 EOB math error: removed erroneous "30% of $16,700 = $2,154" narration
  - Fact: actual coinsurance is $2,154 (correct dollar amount), but percentage explanation (~12.9%) was wrong
  - Fix: kept correct dollar amounts ($1,500 deductible + $2,154 coinsurance) per CLM-2026-0061872 sample data
- ✅ Updated celecoxib reference table:
  - Changed Tier 1 → Tier 2
  - Changed copay "$10–$20 (~$10 for Tier 1)" → "$45 retail / $110 mail order" (Tier 2)
  - Aligned to FRM-2026-0011 sample data + PR #16 PH-7 test prompt
- ✅ Committed; PR #17 now ready for Mikey re-review

**All Demo Content Aligned:**
- ✅ Both PRs now use consistent Sarah Nguyen narrative
- ✅ Sample data alignment verified (member IDs, EOB amounts, formulary tiers)
- ✅ Healthcare payor factual accuracy confirmed (cost-share math, prior auth logic, formulary structure)
- ✅ Orchestration log filed (.squad/orchestration-log/2026-07-09-T131553-mouth.md)
- **Status:** PRs #13 and #17 ready for Mikey's turn 5 re-review; all content internally consistent
