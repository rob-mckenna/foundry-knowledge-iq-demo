# Agent Deployment Guide — HealthBridge Assistant

**Version:** 1.0  
**Status:** Current — all Azure resources and KB are live  
**Audience:** Demo operator deploying the `healthbridge-assistant` agent in the Microsoft Foundry portal  
**Time to complete:** ~15 minutes

---

## Current Live Status

Before starting, confirm the following are already in place (verified 2026-07-09):

| Item | Status | Details |
|------|--------|---------|
| Foundry project | ✅ Live | `proj-healthbridge` |
| Knowledge Base | ✅ Live | `payor-knowledge-base` on `srch-healthbridge-demo` — 4 active knowledge sources |
| `healthbridge-mcp-connection` | ✅ Live | RemoteTool → MCP Container App |
| `healthbridge-blob-connection` | ✅ Live | Azure Storage → `sthealthbridgedemo2agib7` |
| `healthbridge-aisearch-connection` | ✅ Live | Azure AI Search → `srch-healthbridge-demo` |
| `healthbridge-fabric-connection` | ❌ Blocked | Fabric workspace/agent not yet provisioned — see [Blocker](#blockers) |
| Agent (`healthbridge-assistant`) | ⬜ To deploy | This guide covers this step |

> Full KB/connection status detail: `docs/connection-status.md`

---

## Prerequisites

- Browser access to [ai.azure.com](https://ai.azure.com) with **New Foundry** portal enabled
- **Owner** or **Contributor** role on `proj-healthbridge`
- This repository cloned locally (needed for `agent/agent-definition.json` and `agent/system-prompt.md`)

---

## Step 1 — Navigate to the Agents Editor

1. Open [ai.azure.com](https://ai.azure.com) and sign in.
2. Select project **proj-healthbridge**.
3. In the top navigation, click **Build**.
4. Click the **Agents** tab.

---

## Step 2 — Create the Agent

### Option A — Import `agent-definition.json` (fastest)

Use this path if the portal's Import feature is available.

1. In **Build → Agents**, click **Import**.
2. Browse to `agent/agent-definition.json` in this repository.
3. The import pre-populates: name, model, temperature, instructions, and the KB MCP tool.
4. Verify the fields in the table below, then click **Save**.

| Field | Expected value |
|-------|----------------|
| Agent name | `healthbridge-assistant` |
| Model | `gpt-4o` |
| Temperature | `0.1` |
| Tools → MCP server label | `payor-knowledge-base` |
| Tools → MCP server URL | `https://srch-healthbridge-demo.search.windows.net/knowledgebases/payor-knowledge-base/mcp?api-version=2026-05-01-preview` |

> If Import is not available in your portal version, use Option B below.

---

### Option B — Create Manually

#### B1 — Create a new agent

1. In **Build → Agents**, click **+ New agent** (or **Create agent**).
2. Set:
   - **Name:** `healthbridge-assistant`
   - **Model:** `gpt-4o` *(use the latest available version; deploy via Model Deployments if not already available)*
   - **Temperature:** `0.1` — critical for guardrail reliability; do not increase

#### B2 — Paste the system prompt

1. In the agent editor, click into the **Instructions** field.
2. Open `agent/system-prompt.md` from this repository.
3. Copy the full contents and paste into the Instructions field.
4. Click **Save** (or **Apply**).

> The condensed version in `agent/system-prompt-portal.txt` is also valid for a minimal demo. The full `system-prompt.md` is preferred as it includes the Available Tools table and tone guidance.

#### B3 — Connect the Knowledge Base (primary retrieval tool)

The Knowledge Base is accessed by the agent as an **MCP tool** that exposes the `knowledge_base_retrieve` function over the AI Search IQ endpoint.

1. In the agent editor, locate the **Tools** section and click **+ Add tool**.
2. Select tool type **MCP**.
3. Enter:
   - **Server label:** `payor-knowledge-base`
   - **Server URL:** `https://srch-healthbridge-demo.search.windows.net/knowledgebases/payor-knowledge-base/mcp?api-version=2026-05-01-preview`
   - **Connection:** select `healthbridge-aisearch-connection`
   - **Allowed tools:** `knowledge_base_retrieve`
   - **Require approval:** Never
4. Click **Add** / **Save**.

> **Portal variation:** The portal may show this as "Add knowledge source" or a dedicated **Knowledge** panel in the agent editor that auto-configures the MCP tool. Either path connects the same KB endpoint.

#### B4 — Enable direct MCP tool access (optional but recommended for demo)

This second MCP tool gives the agent direct access to the healthcare domain tools (member lookup, claims, formulary, etc.) without going through KB retrieval — faster for targeted queries during a live demo.

1. In the Tools section, click **+ Add tool** → **MCP**.
2. Enter:
   - **Server label:** `healthbridge-mcp`
   - **Server URL:** `https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io/mcp`
   - **Connection:** `healthbridge-mcp-connection`
   - **Allowed tools:** `lookup_member`, `lookup_claim`, `check_benefits`, `lookup_provider`, `get_prior_auth_requirements`, `get_clinical_coverage_criteria`, `check_formulary`
   - **Require approval:** Never
3. Click **Add** / **Save**.

#### B5 — Save the agent

Click **Save** (top-right of agent editor) to persist all settings.

---

## Step 3 — Verify the Agent Opens in Playground

1. From **Build → Agents**, click `healthbridge-assistant` to open the agent editor.
2. Click **Playground** (or the **Test** button in the agent editor toolbar).
3. Confirm the Playground chat interface opens with a fresh conversation thread — no error banners.
4. Enable **Citations** toggle (upper-right toolbar) — this is essential for demo credibility.

---

## Step 4 — Run Smoke Tests

Run these three prompts in sequence. After each, check the **Citations / Annotations** panel to confirm the correct knowledge source responded.

### Smoke Test 1 — MCP Server (Prior Auth Policies)

```
My surgeon wants me to start physical therapy three times a week. Do I need prior authorization for that?
```

**Expected:** Agent calls `get_prior_auth_requirements`. Returns PA threshold for PT (typically first 20 visits/year). Annotation shows MCP Server source.

---

### Smoke Test 2 — AI Search Formulary Index

```
My doctor prescribed celecoxib for pain after my surgery. What tier is it on and what will I pay?
```

**Expected:** Agent queries `healthbridge-formulary-index`. Returns tier, copay, quantity limits. Annotation shows formulary AI Search source.

---

### Smoke Test 3 — AI Search Provider Directory

```
Can you help me find a physical therapist near Naperville who is in-network and accepting new patients?
```

**Expected:** Agent queries `healthbridge-provider-index`. Returns matching providers with name, location, accepting-new-patients status. Annotation shows provider AI Search source.

---

### Smoke Test 4 — Plan Documents (AI Search / Blob)

```
What is the specialist copay on the HealthBridge HMO Silver plan?
```

**Expected:** Agent retrieves from `healthcare-payor-docs` index (45 plan documents). Returns specialist copay with a citation to the SBC or plan document.

> **Note:** The Blob Storage knowledge source (`healthbridge-blob-connection`) currently has 0 indexed documents due to an OpenAI endpoint mismatch during setup. The plan documents are covered by the `healthcare-payor-docs` AI Search index (45 docs, live). See `docs/connection-status.md` for the remediation steps.

---

### ✅ All four smoke tests passing confirms:

- KB retrieval pipeline is end-to-end functional
- MCP tools are routable from the agent
- Citations panel is populating (key demo talking point)

---

## Blockers

### ⚠️ Fabric Data Agent — NOT CONNECTED

The `healthbridge-fabric-connection` has not been created. This blocks claims workflow prompts (real-time member claims, EOB, prior auth status via Fabric lakehouse).

**Impact on demo:**
- Claims & EOB workflow prompts (CL-1 to CL-6) will fall back to MCP tool calls or return "no results"
- Smoke tests 1–4 above are unaffected
- All other workflows (benefits, formulary, provider, prior auth) work as expected

**Resolution path (Data team):**
1. Create a Fabric workspace in the Fabric portal, assigned to capacity `azfabricdemo01` (F2, westus3, in `az-fabric-demo-rg`)
2. Create a Data Agent named `healthbridge-claims-agent` in that workspace
3. Note the Workspace GUID and Agent GUID
4. Run the `az rest PUT` command in `docs/knowledge-base-connection-guide.md` Step B4 to create `healthbridge-fabric-connection`
5. Update the `<FABRIC_WORKSPACE_ID>` placeholder in `agent/knowledge-base-config.json`
6. Add the Fabric knowledge source to `payor-knowledge-base` via the REST API (Step C9 of connection guide)

**Workaround for demos without Fabric:** Skip claims prompts (CL-1 to CL-6) and add a verbal note that the Fabric integration is pending workspace provisioning. All other workflows demonstrate live retrieval.

---

### ⚠️ Blob Storage source — 0 documents indexed (tech debt, non-blocking)

The `healthbridge-blob-connection` knowledge source was created with a wrong OpenAI endpoint (`healthbridge-demo.openai.azure.com` instead of `foundry-healthbridge-demo.openai.azure.com`) — result is 0 indexed documents.

**Impact:** Minimal — the 45 plan documents are covered by the `healthcare-payor-docs` AI Search index (pre-built).

**Resolution:** Delete and recreate the `healthbridge-blob-connection` knowledge source on `payor-knowledge-base` with `resourceUri = "https://foundry-healthbridge-demo.openai.azure.com/"`.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Playground doesn't open / error banner | Agent saved without a valid model deployment | Verify `gpt-4o` is deployed in `proj-healthbridge` under Model Deployments |
| Agent answers from general knowledge only | KB MCP tool not attached, or wrong URL | In agent editor, confirm MCP tool URL ends with `/knowledgebases/payor-knowledge-base/mcp?api-version=2026-05-01-preview` |
| Citations panel is empty | Citations toggle off, or KB tool calls returning no results | Enable Citations toggle; run smoke test 2 (formulary) to confirm retrieval |
| MCP Server tool calls timeout | Container App cold start | Re-send prompt once; app warms in ~10 seconds |
| Formulary responses say "not found" | Celecoxib / drug not in 10-drug test set | See Issue #12 — confirm drug exists in `healthbridge-formulary-index` |
| Guardrails not firing | Temperature too high | Confirm temperature = 0.1 in agent settings |
| Claims prompts return no data | Fabric not connected | Expected — see Fabric blocker above |

---

## Reference

| Artifact | Path |
|----------|------|
| Agent definition (importable) | `agent/agent-definition.json` |
| Full system prompt | `agent/system-prompt.md` |
| Condensed portal system prompt | `agent/system-prompt-portal.txt` |
| KB configuration | `agent/knowledge-base-config.json` |
| Sample prompts & demo script | `agent/sample-prompts.md` |
| 5-minute Sarah Nguyen demo | `agent/sample-prompts.md` — Act 1–5 |
| KB & connection wiring guide | `docs/knowledge-base-connection-guide.md` |
| Live connection/KB status | `docs/connection-status.md` |
| Test prompt suite (30 prompts) | `agent/test-prompts/` |
| Guardrail edge cases | `agent/test-prompts/guardrails-edge-cases.md` |

### Key Microsoft Learn References

| Topic | URL |
|-------|-----|
| What is Foundry IQ? | https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-foundry-iq |
| Connect agents to Foundry IQ KB | https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/foundry-iq-connect |
| MCP tools for agents | https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/model-context-protocol |
| Create a Knowledge Base (AI Search) | https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-how-to-create-knowledge-base |

---

*Guide version: 1.0 | Created: 2026-07-09 | Author: Chunk (Agent Builder)*
