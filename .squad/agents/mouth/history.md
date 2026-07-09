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
