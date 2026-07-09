# Decision: Agent Deployment Guide — `healthbridge-assistant`

**Author:** Chunk (Agent Builder)  
**Date:** 2026-07-09  
**Status:** Proposed  
**Issue:** #4

---

## Context

With `payor-knowledge-base` confirmed live (4 active knowledge sources: MCP, AI Search formulary, AI Search provider, plan docs), the remaining P0 blocker for release is deploying the `healthbridge-assistant` agent and verifying it opens in the Foundry Playground.

The `docs/knowledge-base-connection-guide.md` contains the agent creation steps (Step D) but is a 35KB reference document — not accessible as a standalone deployment action.

---

## Decisions Made

### 1. `docs/agent-deployment-guide.md` created as the canonical operator reference for agent deployment

This is the authoritative "what to do now" document for an operator who wants to deploy the agent assuming the KB and connections are already live. It is intentionally short and action-focused (vs. the KB connection guide which covers everything from RBAC to KB creation).

**Contents:** Live status table → prerequisites → import vs. manual creation → KB MCP tool wiring → playground verification → 4 smoke tests → blocker documentation (Fabric + Blob) → troubleshooting.

### 2. `agent/agent-definition.json` MCP URL corrected to include `?api-version=2026-05-01-preview`

The KB MCP endpoint on Azure AI Search requires the `2026-05-01-preview` API version in the URL. The `connection-status.md` and `knowledge-base-connection-guide.md` both specify the full URL with this suffix. The `agent-definition.json` was missing it — this would have caused the KB tool to fail silently on import.

### 3. Stale contact info in `agent-definition.json` and `system-prompt-portal.txt` fixed

Both files still referenced `1-800-HEALTHBRIDGE` and `my.healthbridge.com`. These are incorrect for the HealthBridge Insurance Plan brand. Correct values: `1-800-555-BLUE` and `HealthBridge.example.com`. (The root `agent/system-prompt.md` was already fixed in a prior session.)

---

## Blockers (for team awareness)

- **Fabric Data Agent** — `healthbridge-fabric-connection` not yet created. Claims prompts (CL-1–CL-6) are non-functional until Fabric workspace + agent GUIDs are available and the connection is provisioned. Documented in the agent deployment guide.
- **Blob knowledge source** — 0 documents indexed (OAI endpoint mismatch during creation). Plan documents are covered by `healthcare-payor-docs` AI Search index. Non-blocking but noted as tech debt.

---

## Impact

Operators can now deploy the `healthbridge-assistant` agent using a single focused guide. The 4 smoke tests in the guide verify end-to-end KB retrieval across all functioning knowledge sources (MCP, formulary, provider, plan docs).
