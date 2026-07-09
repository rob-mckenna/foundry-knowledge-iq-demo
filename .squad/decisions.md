# Squad Decisions

## Active Decisions

### Decision: KB Connection Guide — Managed Identity Auth Approach

**Author:** Chunk (Agent Builder)  
**Date:** 2026-06-21  
**Status:** Accepted

Authored `docs/knowledge-base-connection-guide.md` — a complete, click-by-click operator guide for wiring the Microsoft Foundry Knowledge Base `payor-knowledge-base` now that all Azure resources are live.

The guide walks a presenter through five steps:
- **Step A** — Verify and assign four RBAC roles to the Foundry project managed identity (search, storage, OpenAI)
- **Step B** — Create the four Foundry connections (blob, AI Search, MCP, Fabric ⚠️) using exact connection names
- **Step C** — Create `payor-knowledge-base` with all four active data sources, embedding model, and hybrid + semantic retrieval
- **Step D** — Create/attach the `healthbridge-assistant` agent with system prompt and KB
- **Step E** — Three smoke-test prompts confirming end-to-end wiring (MCP Server, AI Search formulary, AI Search provider directory)

**Key Technical Decision:** Azure Policy on this subscription disables key-based auth on Storage and Azure OpenAI. All Foundry connections use managed identity (Entra RBAC). Required roles: Search Index Data Reader + Search Service Contributor on `srch-healthbridge-demo`; Storage Blob Data Reader on `sthealthbridgedemo2agib7`; Cognitive Services OpenAI User on `oai-healthbridge-demo`.

**Embedding Model:** `text-embedding-3-small`, 1536 dimensions. Must not be changed — existing AI Search indexes depend on this dimensionality.

**Impact:** Operators can now wire the full Knowledge Base without referencing multiple prior docs. Guide is self-contained from Foundry project creation to smoke tests passing.

---

### Decision: KB Connection Guide Validation — MCP-as-Knowledge-Source & UI Corrections

**Author:** Mikey (Lead)  
**Date:** 2026-06-21  
**Status:** Accepted  
**Requested by:** Rob McKenna

## Context

Rob reported that `docs/knowledge-base-connection-guide.md` (authored by Chunk) contained instructions that "don't appear to be accurate" — suspected of describing the old/classic Foundry UI rather than the current Microsoft Foundry portal.

## Validation Outcome

**Confirmed: The guide contained multiple BLOCKER and MAJOR inaccuracies.** Independent review against current Microsoft Learn docs (June 2026) revealed the guide was mixing current Foundry IQ architecture with fictional UI patterns that don't exist in the current portal.

## Key Findings

### 1. MCP Server as Knowledge Source — VALID but DIFFERENT from described

- https://learn.microsoft.com/en-us/azure/foundry/how-to/connections-add (2026-06-19)
**Date:** 2026-06-21  
- https://learn.microsoft.com/en-us/azure/foundry/how-to/connections-add (2026-06-19) — portal tab shows no name field
**Date:** 2026-06-21  
**Date:** 2026-06-22  
**Date:** 2026-06-22  
**Date:** 2026-06-22  
**Date:** 2026-07-07T03:51:25.125-04:00  
**Date:** 2026-07-07T04:05:39.100-04:00

---

# PR Review Round 1 — Mikey (Lead)

**Date:** 2026-07-09  
**Reviewer:** Mikey (Lead)  
**Requested by:** Rob McKenna  
**Scope:** All 5 open PRs (#13, #14, #15, #16, #17)

---

## Verdict Summary

| PR | Title | Verdict | Blocking Issues |
|---|---|---|---|
| #13 | docs: finalize demo script v1.1 — timings, presenter notes, fallbacks | **REQUEST CHANGES** | Quick-reference card uses Marcus Hartwell narrative; must be updated to Sarah Nguyen |
| #14 | data: create payor-knowledge-base and wire knowledge sources | **REQUEST CHANGES** | knowledge-base-config.json has wrong KB name (healthbridge-knowledge-base vs payor-knowledge-base) |
| #15 | docs: demo readiness checklist and sign-off sheet | **REQUEST CHANGES (minor)** | Wrong demo duration (45 min vs 5 min); wrong member ID in MCP verification command |
| #16 | feat: deploy HealthBridge assistant agent (#4) | **APPROVED** | None — all checks pass |
| #17 | docs: finalize demo script and presenter notes (#10) | **REQUEST CHANGES** | EOB math error in Act 2 (30% of $16,700 ≠ $2,154); celecoxib Tier 1 in reference table (should be Tier 2) |

---

## Detailed Findings

### PR #13 — Request Changes

**Branch:** `squad/10-finalize-the-demo-script-and-presenter-notes`

The PR adds `assets/presenter/quick-reference-card.md`, which is a well-structured presenter artifact, but it is built around the **Marcus Hartwell** (MBR-2024-001234, PPO Gold) narrative. The demo standard has moved to **Sarah Nguyen** (MBR-2024-002891, HMO Silver, knee replacement). Merging as-is creates a critical narrative inconsistency between the quick-reference card and the demo script.

Additionally, the PR title claims it updates `docs/demo-script.md` to v1.1 but that file is not in the diff (the demo script was committed to main via other means). The PR body is misleading.

**PR #13 vs PR #17 overlap assessment:** PR #13 is NOT fully superseded by PR #17. PR #17 does not add the presenter quick-reference card or the assets scaffolding (assets/README.md, assets/screenshots/README.md). These assets are unique to PR #13 and are valuable for the demo. However, their content (Marcus Hartwell narrative) must be updated to Sarah Nguyen before merging. Recommendation: **do not close #13** — fix the narrative alignment and merge.

**Required fixes:**
- Update `assets/presenter/quick-reference-card.md` to Sarah Nguyen 5-Act narrative
- Replace MBR-2024-001234 with MBR-2024-002891 throughout

---

### PR #14 — Request Changes

**Branch:** `squad/3-create-knowledge-base-and-wire-data-sources`

Overall solid execution. The KB was created correctly as `payor-knowledge-base`, smoke tests passed, RBAC is correct, embedding model is `text-embedding-3-small`/1536 dims (consistent with decisions.md), and all three index names are correct. Managed identity auth used for Blob and OpenAI connections (policy compliant).

**Issue 1 (required):** `agent/knowledge-base-config.json` has `"name": "healthbridge-knowledge-base"` but the live KB is `payor-knowledge-base`. This will cause future operators to create a differently-named KB that breaks the agent's MCP endpoint URL.  
Fix: `healthbridge-knowledge-base` → `payor-knowledge-base` in the config.

**Issue 2 (tech debt, document only):** `healthbridge-blob-connection` knowledge source has 0 indexed docs due to OAI endpoint mismatch during creation (used `healthbridge-demo.openai.azure.com` instead of `foundry-healthbridge-demo.openai.azure.com`). Documented in `docs/connection-status.md`. The `healthcare-payor-docs-source` (AI Search, 45 docs) covers the same content as interim fallback. Fix requires delete+recreate of the blob knowledge source with the correct `resourceUri`. Track as a follow-up issue.

**Architecture alignment verification:**
- Managed identity ✅ (decisions.md requirement)
- text-embedding-3-small / 1536 dims ✅ (decisions.md: must not be changed)
- healthcare-payor-docs, healthbridge-formulary-index, healthbridge-provider-index ✅
- payor-knowledge-base (live) ✅ (but config.json still wrong)

---

### PR #15 — Request Changes (Minor)

**Branch:** `squad/7-demo-readiness-checklist`

Well-structured readiness checklist. All 5 Acts covered with test prompts and expected data source citations. Fallback procedures present (4 scenarios). Sign-off matrix present with owner accountability columns. Fabric blocked flagged correctly.

**Issue 1 (required):** Overview states "demo is ~45 minutes" — this is the old Marcus Hartwell full-session duration. The Sarah Nguyen demo is 5 minutes live + 2-3 min Q&A.

**Issue 2 (required):** MCP sample data verification checks `MBR-2024-001234` (Marcus Hartwell). The demo uses Sarah Nguyen (`MBR-2024-002891`). If Sarah's data were missing from the MCP server, this check would not catch it.

---

### PR #16 — APPROVED

**Branch:** `squad/4-deploy-healthbridge-agent`

All deliverables verified:

**agent-definition.json:**
- MCP URL fix (`?api-version=2026-05-01-preview` added) ✅
- Contact info: 1-800-555-BLUE, HealthBridge.example.com ✅

**Guardrail coverage (all required categories):**
- Jailbreak: G-6 ✅
- Medical advice (direct): G-1 ✅ / (indirect): G-2 ✅
- PHI bulk disclosure: G-3 ✅ / cross-member: G-9 ✅
- Hallucination trap: G-7 ✅
- All 12 prompts have Pass/Fail criteria ✅

**Celecoxib PH-7 — verified against sample data (FRM-2026-0011):**
- Tier 2: ✅ (sample data: tier=2)
- $45 retail / $110 mail order: ✅ (sample data exact match)
- No PA required: ✅ (requiresPriorAuth=false)
- No deductible: ✅ (deductibleApplies=false)
- Citation FRM-2026-0011: ✅

**Minor annotation (non-blocking):** PH-7 expected response labels it "Tier 2 — Preferred Brand" but sample data says `tierDescription: "Non-Preferred Generic"`. Pass criteria only checks "Tier 2 stated" so tests pass, but the descriptor is slightly misleading. Consider correcting in a follow-up.

---

### PR #17 — Request Changes

**Branch:** `squad/10-demo-script`

Strong 5-Act structure, excellent Sarah Nguyen narrative, realistic timing (~5.9 min). Two critical factual errors must be fixed before merge.

**Issue 1 — EOB Math Error (CRITICAL):**

In Act 2 presenter script: *"So: $1,500 deductible, then 30% of the remaining $16,700 — that's $2,154."*

Verified against CLM-2026-0061872:
- memberDeductible: $1,500 ✅
- memberCoinsurance: $2,154 ✅ (the number is right)
- but 30% × $16,700 = $5,010, NOT $2,154 ❌

The presented math is wrong. The actual coinsurance rate is ~12.9% of the post-deductible amount. A healthcare benefits manager will catch this. Fix: remove the erroneous percentage explanation. Just state the dollar amounts the agent returned without narrating incorrect math.

**Issue 2 — Celecoxib Reference Table (CRITICAL):**

The "Data Reference" table at the bottom of demo-script.md lists:
- Celecoxib Tier: "Tier 1 (Preferred Generic)" ❌
- Celecoxib Copay: "$10–$20 (~$10 for Tier 1)" ❌

Actual sample data (FRM-2026-0011):
- tier: 2, tierDescription: "Non-Preferred Generic"
- retailCopay30Day: $45, mailOrderCopay90Day: $110

This contradicts Act 4 of the same script (which correctly states Tier 2, $45) and PR #16's PH-7 test prompt. Fix: update reference table to Tier 2, $45 retail / $110 mail order.

**Issue 3 — Fabric fallback (minor):**
Acts 1 and 2 cite Fabric Data Agent as primary source (blocked ⚠️). Add inline fallback callouts at the top of Acts 1 and 2.

---

## Cross-PR Notes

1. **PRs #16 and #17 share agent files** (agent-definition.json, system-prompt-portal.txt, guardrails, pharmacy-formulary, agent-deployment-guide, demo-readiness-checklist). If both merge, there's potential for conflict. Recommend merging #16 first, then rebasing #17.

2. **PRs #13 and #17 both address Issue #10** (demo script). After #13 is updated to Sarah Nguyen, coordinate merge order to avoid demo-script.md conflicts.

3. **PR #14 is a prerequisite for PR #16/17** (the KB must exist for agent wiring). PR #14 has one required fix (config name) — should be resolved first.

---

## Recommended Merge Order

1. PR #14 (after config name fix) — KB must be solid before agent work
2. PR #16 (approved, no blockers) — agent deployment
3. PR #15 (after minor fixes) — readiness checklist
4. PR #17 (after math + reference table fixes) — demo script
5. PR #13 (after narrative update to Sarah Nguyen) — presenter assets

