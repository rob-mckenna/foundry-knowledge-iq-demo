# Agent Setup — HealthBridge Knowledge Assistant

This directory contains all the artifacts needed to build and test the HealthBridge Knowledge Assistant in Azure AI Foundry.

| File | Purpose |
|---|---|
| `system-prompt.md` | The agent's system prompt — defines role, capabilities, tone, and guardrails |
| `knowledge-base-config.json` | Knowledge Base configuration — data source connections and retrieval settings |
| `sample-prompts.md` | 15 test prompts organized by category, with expected behavior notes |

---

## Prerequisites

- An Azure AI Foundry project with **Owner** or **Contributor** role
- The following connections already registered in Foundry (see `data-sources/` for setup):
  - `healthbridge-blob-connection` — Azure Blob Storage
  - `healthbridge-aisearch-connection` — Azure AI Search
  - `healthbridge-fabric-connection` — Microsoft Fabric Data Agent
  - `healthbridge-mcp-connection` — MCP Server
- A `text-embedding-3-large` model deployment for vector indexing

---

## Step 1: Create the Knowledge Base

### Via Foundry Portal (Recommended for Demo)

1. Open your Foundry project at [ai.azure.com](https://ai.azure.com)
2. Navigate to **Knowledge Bases** in the left sidebar
3. Click **+ New Knowledge Base**
4. Name it `healthbridge-knowledge-base`
5. Add each data source from `knowledge-base-config.json` using the **Add data source** workflow:
   - Blob Storage → select `healthbridge-blob-connection`, container `plan-documents`
   - AI Search (formulary) → select `healthbridge-aisearch-connection`, index `healthbridge-formulary-index`
   - AI Search (providers) → select `healthbridge-aisearch-connection`, index `healthbridge-provider-index`
   - Fabric Data Agent → select `healthbridge-fabric-connection`, agent `healthbridge-claims-agent`
   - MCP Server → select `healthbridge-mcp-connection`, URL `http://localhost:3000`
6. Set retrieval to **Hybrid** with **Semantic Ranking** enabled, Top-K = 5
7. Click **Save and index**

### Via Azure CLI / ARM (Automated)

> Use `knowledge-base-config.json` as the input document when Foundry CLI support for Knowledge Bases is GA. Check the [Foundry changelog](https://learn.microsoft.com/azure/ai-foundry/whats-new) for the latest CLI commands.

---

## Step 2: Create the Prompt Agent

1. In your Foundry project, navigate to **Agents**
2. Click **+ New Agent**
3. Set the agent name: `healthbridge-assistant`
4. Choose your base model (e.g., `gpt-4o`)
5. Paste the contents of `system-prompt.md` into the **System prompt** field
6. Under **Knowledge**, click **+ Add knowledge source** and select `healthbridge-knowledge-base`
7. Configure tool access:
   - ✅ Knowledge Base retrieval
   - ✅ MCP tools (prior auth policy lookup)
   - ✅ Fabric Data Agent queries
8. Click **Save**

---

## Step 3: Configure Retrieval Settings

In the agent's Knowledge settings, verify:

| Setting | Value |
|---|---|
| Search type | Hybrid (keyword + vector) |
| Semantic ranking | Enabled |
| Top-K results | 5 |
| Minimum reranker score | 0.5 |
| Query rewrite | Enabled |

Adjust Top-K to 3 for faster demo responses or 8 for more thorough retrieval during testing.

---

## Step 4: Run Sample Prompts

Use the prompts in `sample-prompts.md` to validate the agent in the Foundry **Playground**.

### Suggested Demo Flow

Run prompts in this order for a narrative demo arc:

1. **Prompt 3** — OOP maximum (simple, clean benefits answer; good opener)
2. **Prompt 2** — Physical therapy coverage (shows multi-source retrieval: SBC + prior auth)
3. **Prompt 11** — Ozempic formulary (high-interest drug; shows AI Search formulary index)
4. **Prompt 12** — Atorvastatin tier (contrast generic vs. specialty)
5. **Prompt 8** — Prior auth for MRI (shows MCP server tool call live)
6. **Prompt 5** — Recent claim status (shows Fabric Data Agent query)
7. **Prompt 6** — Claim denial reason (shows EOB + appeals policy cross-reference)
8. **Prompt 14** — Provider network check (shows provider directory search)
9. **Guardrail A** — Medical advice redirect (demonstrates responsible AI guardrails)

### Tips

- Enable **Citations** in the Playground to show which data source answered each question — this is a key demo talking point for Knowledge IQ
- Use **Trace** view to show retrieval steps, reranking scores, and tool calls
- If the Fabric Data Agent is not yet connected, skip Claims prompts (5, 6, 7, 10) and note they require the Fabric integration

---

## Step 5: Validate Guardrails

Run the three guardrail prompts at the bottom of `sample-prompts.md`:
- **Guardrail A** — Medical advice redirect
- **Guardrail B** — Out-of-scope request
- **Guardrail C** — PHI bulk access attempt

All three should result in polite deflection without revealing plan data inappropriately.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Agent returns "I don't have information about that" for formulary questions | AI Search formulary index not populated | Run the indexer in `data-sources/ai-search/` |
| MCP tool calls return errors | MCP server not running | Start the server per `data-sources/mcp-server/README.md` |
| Fabric claims queries return no results | Fabric connection not configured | Set `FABRIC_WORKSPACE_ID` and verify connection in Foundry |
| Retrieval returns irrelevant chunks | Semantic ranker threshold too low | Raise `minimumRerankerScore` to 0.7 |
| Agent ignores system prompt guardrails | Model temperature too high | Set temperature to 0.1 in agent settings |

---

## Related Directories

- `data-sources/` — Setup instructions and sample data for each data source
- `sample-data/` — Synthetic healthcare payor data files
- `docs/azure-setup.md` — **Start here** for full Azure provisioning walkthrough (resource group → Foundry → Search → Storage → Knowledge Base → Agent)
- `docs/demo-flow.md` — Narrative demo script for customer presentations

---

*README version: 1.0 | Last updated: 2026-06-05*
