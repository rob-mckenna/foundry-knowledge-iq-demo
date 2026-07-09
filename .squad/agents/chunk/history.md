# Chunk — History (Summarized 2026-07-09)

## Project Context
- **Project:** foundry-knowledge-iq-demo — Demo of Knowledge IQ in Azure AI Foundry for a healthcare payor
- **Stack:** Azure AI Foundry, AI Search, Blob Storage, Fabric Data Agent, MCP
- **User:** Rob McKenna

## Current Status (2026-07-09)

**Completed Work:**
- ✅ System prompt + KB config + 30 test prompts (5 workflows × 6 prompts each)
- ✅ Demo narrative (5-act Sarah Nguyen story arc)
- ✅ Agent deployment guide + agent-definition.json (PR #16)
- ✅ Guardrail coverage (17 edge-case prompts with pass/fail criteria)
- ✅ 30 prompts validated; 2 bugs fixed (member name, brand contact); 2 issues filed (#11, #12)

**Blockers:**
- ⏳ Issue #12: Chunk must add test prompt PH-7 to pharmacy-formulary.md (Data resolved the index issue)
- ⏳ Fabric workspace not provisioned → Fabric data agent connection blocked

**Next:** Add PH-7 prompt; verify agent in Foundry Playground.

## Key Technical Decisions

- **Agent name:** `healthbridge-assistant` with 5 capability areas (benefits, claims, prior auth, pharmacy, providers)
- **Test prompt strategy:** 30 structured test cases anchored to real synthetic data (member IDs, claim IDs, provider NPIs); each includes expected data sources and response characteristics
- **Demo narrative:** 5-act story (member post-surgical journey through eligibility → claims → pharmacy → provider lookup) outperforms category-by-category demos
- **Guardrail coverage:** 17 edge-case prompts covering medical advice refusal, jailbreak/injection, PHI privacy, out-of-scope deflection, unanswerable queries, member distress
- **MCP tool routing:** 7 tools documented in system prompt with "when to use" guidance

## Learnings

1. **Healthcare payor demos:** "Explain my EOB" is the highest-value prompt category; always include member-specific context to show the agent isn't returning generic policy text
2. **Test prompt completeness:** Guardrail prompts must have 3 parts: (1) adversarial input, (2) expected behavior, (3) explicit pass/fail criteria — these make prompts usable as regression tests, not just examples
3. **Prompt grounding:** All test prompts must reference actual synthetic data (real member IDs, claim amounts, drug names) so the agent has retrievable ground truth for every scenario
4. **System prompt:** Must include tool routing guidance + guardrail boundaries; implicit guardrails are insufficient for healthcare domain

## Cross-Team Dependencies

- **Data:** 7-tool MCP server live; 3 AI Search indexes live; all endpoints verified
- **Mouth:** 48 sample healthcare payor data files created; all brand standardized to "HealthBridge Insurance Plan"
- **Mikey:** KB connection guide v1.4 validated; Foundry resource model verified; routing automation fixed
- **Alignment:** KB config references all data sources by exact name; agent config aligned with deployed infrastructure

## Files Created/Modified

- `agent/system-prompt.md` — HealthBridge Assistant definition + 7 MCP tools + guardrails + contact info
- `agent/knowledge-base-config.json` — 5 data sources (Blob, AI Search ×2, MCP, Fabric placeholder)
- `agent/agent-definition.json` — importable agent with KB MCP tool wired to payor-knowledge-base
- `agent/test-prompts/*.md` — 30 prompts across 5 workflows + 17 guardrail edge-cases
- `docs/agent-deployment-guide.md` — standalone operator guide for agent deployment
- `agent/README.md` — Foundry setup steps + troubleshooting

