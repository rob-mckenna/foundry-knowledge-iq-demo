# Mikey — History

## Project Context
- **Project:** foundry-knowledge-iq-demo — Demo of Knowledge IQ in Azure AI Foundry for a healthcare payor
- **Stack:** Azure AI Foundry, AI Search, Blob Storage, Fabric Data Agent, MCP
- **User:** Rob McKenna

## Summary

**Completed:** All documentation written (README, setup-guide, demo-flow, architecture). KB connection guide (v1.0→v1.4) fully validated & corrected against live Microsoft Foundry portal (June 2026). Foundry resource model verified: new Foundry = `Microsoft.CognitiveServices/accounts/projects`, NOT `MachineLearningServices/workspaces`. All UI paths, RBAC targets, and connection creation flows corrected. Guide now documents two connection creation paths (Option A code-first, Option B portal-first with reconciliation). Decisions merged: ADR on demo architecture, 7 KB connection guide corrections, resource model fix.

## Key Work Phases

### 2026-06-05 — Architecture & Documentation
- Created README (customer-facing), full directory structure, demo-flow narrative (45 min / 4 acts / Marcus Hartwell story arc), setup-guide, architecture doc with ASCII + Mermaid diagrams
- **Key decisions:** Four-source architecture (MCP, AI Search, Fabric, Blob) for diversity; single sample-data/ source of truth; five payor workflows; new Foundry only
- **Output:** All docs synchronized to HealthBridge Insurance Plan brand; Fabric flagged ⚠️ consistently

### 2026-06-21 — KB Connection Guide Validation (v1.0 → v1.4)

**v1.1 (Rob's request):** Validated guide against Microsoft Learn (June 2026). Found 4 BLOCKER + 4 MAJOR + 3 MINOR errors in v1.0:
- Navigation corrected: NOT "Settings gear → Connections" → actual is "Operate → Admin → Add connection"
- KB architecture corrected: KB = Azure AI Search object, NOT portal "Knowledge bases" sidebar item
- MCP corrected: NOT a Foundry connection type; configured as knowledge source on AI Search + agent tool
- Embedding/retrieval UI corrected: These settings live on knowledge sources/indexes, NOT KB level
- Fabric corrected: code-only, not portal
- RBAC corrected: Cognitive Services OpenAI User role verified (not "Cognitive Services User")

**v1.2 (Rob's request):** Connection naming limitation discovered — portal auto-names from resource name with no rename option. Decision: ALL connections created via `az rest` for exact custom names matching config.json (consistent with MCP/Fabric being code-only anyway).

**v1.3 (Rob's request):** Documented both paths — Option A (code-first all 4 connections) as primary, Option B (portal + code) with explicit `knowledge-base-config.json` line reconciliation (29, 51, 83).

**v1.4 (Data's empirical discovery):** Resource model entirely corrected. Old guide used `MachineLearningServices/workspaces` + `az ml workspace show`. Actual: `CognitiveServices/accounts/projects` with different API paths. Rewrote Steps A0/A1/B to use correct resource types, corrected RBAC targets (Foundry account identity, not project), documented existing auto-named connections (`sthealthbridgedemo2ag633uyd`, `srch-healthbridge-connection`), added caution notes to azure-setup.md and setup-guide.md.

## Cross-Team Alignment (2026-06-05)
- **Mouth:** Created 14 sample data files (members, claims, providers, policies, benefits) with consistent IDs
- **Data:** Scaffolded all 4 data source configs (MCP, AI Search 3-index, Blob, Fabric)
- **Chunk:** Created agent definition + 30 prompts + system prompt
- **Expansion:** Mouth expanded to 8 members/8 claims/7 providers; Data completed MCP (7 tools, 33 tests) + 3 AI Search schemas; Chunk completed demo narrative + system prompt tools section

## Decisions Filed
1. **ADR: Demo Architecture** (2026-06-05) — Four-source diversity, five payor workflows, new Foundry only
2. **KB Connection Guide Validation** (2026-06-21) — 8 UI facts verified with Microsoft Learn citations
3. **Connection Naming Limitation** (2026-06-21) — Portal auto-names; code-first approach recommended
4. **Document Both Paths** (2026-06-21) — Option A (code) and Option B (portal) with reconciliation
5. **Foundry Resource Model** (2026-06-22) — CognitiveServices/accounts/projects, not MLServices; guide v1.4 corrected all paths/RBAC

### 2026-07-09 — PR Review Round 1 (Turn 3)

Completed comprehensive review of all 5 open PRs (#13–#17):
- **PR #16 approved** — agent deployment, all guardrails verified, celecoxib Tier 2 reference validated against FRM-2026-0011
- **PRs #13, #14, #15, #17 requested changes** — blocking issues identified:
  - PR #13: persona (Marcus Hartwell → Sarah Nguyen), narrative consistency
  - PR #14: KB name (healthbridge → payor in config, 7 occurrences)
  - PR #15: demo duration (45 min → 5 min), member ID (MBR-2024-001234 → MBR-2024-002891)
  - PR #17: EOB math error ($1,500 + 30% × $16,700 ≠ $2,154; recommend removing erroneous %-based narration), celecoxib reference table (Tier 1 → Tier 2, copay $10–$20 → $45/$110)
- **Cross-PR dependencies documented:** PR #14 is prerequisite for #16/#17; recommend merge order
- **Detailed feedback:** Full decision record filed (decisions.md) with verification citations for all celecoxib/EOB claims

## Learnings

### 2026-07-09 — PR Review Round 1

Reviewed all 5 open PRs (#13–#17). Key findings:

- **PR #13 (demo script v1.1):** Not superseded by #17 — has unique presenter assets (quick-reference card) but uses Marcus Hartwell narrative. Must be updated to Sarah Nguyen before merge. PR #13 and #17 both target Issue #10; coordinate merge order.
- **PR #14 (KB wiring):** KB created correctly (payor-knowledge-base, text-embedding-3-small/1536 dims, correct index names, managed identity). Blocking issue: `agent/knowledge-base-config.json` has wrong KB name (`healthbridge-knowledge-base` vs `payor-knowledge-base`). Blob knowledge source has 0 docs (OAI endpoint mismatch during creation) — documented as tech debt, covered by AI Search interim.
- **PR #15 (readiness checklist):** Good structure but demo duration wrong (says 45 min, should be 5 min) and MCP verification uses Marcus Hartwell member ID instead of Sarah Nguyen (MBR-2024-002891).
- **PR #16 (agent deploy):** APPROVED. All guardrail categories verified (jailbreak, medical advice direct+indirect, PHI bulk+cross-member, hallucination). PH-7 celecoxib data verified against actual sample data — Tier 2, $45/$110, no PA, FRM-2026-0011. MCP URL api-version fix confirmed. Minor: tierDescription "Non-Preferred Generic" in data vs "Preferred Brand" in test description (pass criteria still met).
- **PR #17 (finalized demo script):** Two critical facts wrong — (1) EOB math: "30% of $16,700 = $2,154" is wrong (correct is ~12.9%); actual claim data has $2,154 coinsurance which is correct but the percentage explanation is not; (2) Reference table lists celecoxib as Tier 1, ~$10 copay, contradicting Act 4 of same script and actual data (Tier 2, $45).
- **Lesson:** Always verify EOB math against actual sample data files before finalizing demo scripts. Healthcare payor audiences will immediately notice incorrect cost-share calculations.
- **Recommended merge order:** #14 → #16 → #15 → #17 → #13 (fix required on each before merge except #16).

### 2026-07-09 — Orchestration Round 5 (Scribe Coordination)

**Turn 2 — Second Review Pass:**
- ✅ Completed comprehensive review of all 5 open PRs (#13–#17)
- ✅ Approved PR #16 (agent deployment, all guardrails verified)
- ✅ Identified blocking issues in PRs #13, #14, #15, #17 for fix iteration
- ✅ Documented cross-PR dependencies and recommended merge order
- ✅ Orchestration log filed (.squad/orchestration-log/2026-07-09-T131553-mikey.md)
- **Status:** Awaiting team execution of round 3 fixes; ready for turn 5 re-review

