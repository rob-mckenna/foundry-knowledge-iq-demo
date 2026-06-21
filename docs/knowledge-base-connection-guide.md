# Knowledge Base Connection Guide — HealthBridge payor-knowledge-base

**Audience:** Demo presenter / operator wiring up the Foundry Knowledge Base after Azure deployment.  
**Starting point:** Signed in at [ai.azure.com](https://ai.azure.com), project **proj-healthbridge** open.  
**Time to complete:** ~30 minutes (plus RBAC propagation; see Troubleshooting).  
**Target:** Microsoft Foundry (ai.azure.com) only — do not follow Azure AI Studio or classic Foundry docs.

> **All Azure resources are live.** This guide uses the exact endpoint values from the completed deployment. Do not re-provision anything — only configure connections and create the Knowledge Base in the Foundry portal.

---

## Step A — Verify / Assign Managed Identity RBAC Roles

> ⚠️ **Critical:** Azure Policy has disabled key-based authentication on both the Storage account and Azure OpenAI resource. All Foundry connections **must** use managed identity (Entra / RBAC). No account keys or API keys will work.

The Foundry project (`proj-healthbridge`) has a system-assigned managed identity. It needs the following RBAC roles before any connection can successfully authenticate:

| Role | Resource | Why Required |
|------|----------|--------------|
| **Search Index Data Reader** | `srch-healthbridge-demo` | Read search results from all three indexes |
| **Search Service Contributor** | `srch-healthbridge-demo` | Manage index metadata (required by Foundry KB indexing) |
| **Storage Blob Data Reader** | `sthealthbridgedemo2agib7` | Read documents from `healthcare-docs` container |
| **Cognitive Services OpenAI User** | `oai-healthbridge-demo` | Call the `text-embedding-3-small` embedding deployment |

### A1 — Find the Managed Identity Object ID (portal)

1. In the Foundry portal, with **proj-healthbridge** open, click **Settings** (gear icon, bottom-left sidebar).
2. Select the **Identity** tab (sometimes labelled **Managed identity** under Project Settings).
3. Copy the **Object (principal) ID** — you will need it for the `az` commands below.

> Alternatively: **Azure portal → Resource Group `rg-knowledge-iq-demo` → proj-healthbridge → Identity → System assigned → Object ID**.

### A2 — Assign RBAC via Azure Portal (click-path)

For each role in the table above:

1. Navigate to the target resource (e.g., `srch-healthbridge-demo`) in the Azure portal.
2. Click **Access control (IAM)** in the left blade.
3. Click **+ Add → Add role assignment**.
4. Select the role name from the table.
5. Click **Next**.
6. Under **Assign access to**, select **Managed identity**.
7. Click **+ Select members**, search for **proj-healthbridge**, select it, click **Select**.
8. Click **Review + assign** twice to confirm.

Repeat for all four role assignments, noting that `srch-healthbridge-demo` requires two separate role assignments (Steps A2 rows 1 and 2).

### A3 — Assign RBAC via Azure CLI (fallback)

If portal role assignment is unavailable, use the following `az` commands. Replace `<OBJECT_ID>` with the managed identity Object ID from Step A1.

```bash
# Get resource IDs
SEARCH_ID=$(az search service show \
  --name srch-healthbridge-demo \
  --resource-group rg-knowledge-iq-demo \
  --query id --output tsv)

STORAGE_ID=$(az storage account show \
  --name sthealthbridgedemo2agib7 \
  --resource-group rg-knowledge-iq-demo \
  --query id --output tsv)

OPENAI_ID=$(az cognitiveservices account show \
  --name oai-healthbridge-demo \
  --resource-group rg-knowledge-iq-demo \
  --query id --output tsv)

MI_OID="<OBJECT_ID>"

# Search Index Data Reader
az role assignment create \
  --role "Search Index Data Reader" \
  --assignee-object-id $MI_OID \
  --assignee-principal-type ServicePrincipal \
  --scope $SEARCH_ID

# Search Service Contributor
az role assignment create \
  --role "Search Service Contributor" \
  --assignee-object-id $MI_OID \
  --assignee-principal-type ServicePrincipal \
  --scope $SEARCH_ID

# Storage Blob Data Reader
az role assignment create \
  --role "Storage Blob Data Reader" \
  --assignee-object-id $MI_OID \
  --assignee-principal-type ServicePrincipal \
  --scope $STORAGE_ID

# Cognitive Services OpenAI User
az role assignment create \
  --role "Cognitive Services OpenAI User" \
  --assignee-object-id $MI_OID \
  --assignee-principal-type ServicePrincipal \
  --scope $OPENAI_ID
```

> **Propagation delay:** RBAC changes can take 2–10 minutes to propagate. If connections fail with `403 Forbidden` immediately after assignment, wait and retry before troubleshooting further.

---

## Step B — Create Connections in Settings → Connections

These four connections are the bridge between the Foundry Knowledge Base and the live Azure resources. The connection names below are **exact** — they are referenced by `agent/knowledge-base-config.json` and must not be changed.

### B1 — Navigate to Connections

1. In **proj-healthbridge**, click **Settings** (bottom-left).
2. Click the **Connections** tab.
3. Click **+ New connection**.

### B2 — Connection: Azure Blob Storage

1. **Connection type:** Azure Blob Storage
2. **Connection name:** `healthbridge-blob-connection`
3. **Authentication:** Managed identity *(do NOT select "Account key" — key auth is disabled)*
4. **Subscription:** *(select your subscription)*
5. **Storage account:** `sthealthbridgedemo2agib7`
6. Click **Add connection**.

### B3 — Connection: Azure AI Search

1. **Connection type:** Azure AI Search
2. **Connection name:** `healthbridge-aisearch-connection`
3. **Authentication:** Managed identity *(API key is disabled)*
4. **Subscription:** *(select your subscription)*
5. **Search service:** `srch-healthbridge-demo`  
   Endpoint: `https://srch-healthbridge-demo.search.windows.net`
6. Click **Add connection**.

> This single connection covers all three search indexes (`healthcare-payor-docs`, `healthbridge-formulary-index`, `healthbridge-provider-index`) — you select the specific index when adding each data source to the Knowledge Base in Step C.

### B4 — Connection: MCP Server

1. **Connection type:** MCP Server *(or "Custom / HTTP endpoint" depending on your Foundry UI version)*
2. **Connection name:** `healthbridge-mcp-connection`
3. **Server URL:** `https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io`
4. **Transport:** HTTP (Streamable HTTP / POST)
5. **MCP endpoint path:** `/mcp`
6. **Authentication:** None *(the Container Apps endpoint is publicly accessible for demo purposes)*
7. Click **Add connection**.

> You can verify the server is live before adding the connection: `GET https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io/health` should return `200 OK`.

### B5 — Connection: Fabric Data Agent ⚠️

> ⚠️ **PENDING — skip for now.** The Fabric Data Agent requires a Microsoft Fabric workspace with Data Agent preview enabled. This workspace has not yet been provisioned. The Knowledge Base will operate fully with the remaining three connections; only prompts that call `lookup_member` or `lookup_claim` against live Fabric data will be unavailable until this is configured.

When the Fabric workspace is ready:

1. **Connection type:** Fabric Data Agent
2. **Connection name:** `healthbridge-fabric-connection`
3. **Workspace ID:** *(provided when Fabric workspace is provisioned — replace `<FABRIC_WORKSPACE_ID>` in `agent/knowledge-base-config.json`)*
4. **Data Agent name:** `healthbridge-claims-agent`
5. Click **Add connection**.

### B6 — Verify Connection Status

After adding each connection, confirm the status column shows **Connected** (green checkmark). If any connection shows **Failed**:
- Re-check RBAC propagation (Step A); wait up to 10 minutes.
- Confirm authentication is set to **Managed identity**, not key-based.
- See the Troubleshooting table at the end of this guide.

---

## Step C — Create the Knowledge Base: payor-knowledge-base

### C1 — Create a New Knowledge Base

1. In **proj-healthbridge**, click **Knowledge bases** in the left sidebar.
2. Click **+ New knowledge base**.
3. **Name:** `payor-knowledge-base`
4. **Description:** `Multi-source Knowledge Base for the HealthBridge Insurance demo — benefits, claims, prior auth, formulary, and provider network.`
5. Click **Next** (do not save yet — data sources are added in the next steps).

### C2 — Configure the Embedding Model

In the **Embedding** section:

1. **Embedding model connection:** Select `oai-healthbridge-demo` (or the Azure OpenAI connection pointing at `https://oai-healthbridge-demo.openai.azure.com/`).
2. **Deployment:** `text-embedding-3-small`
3. **Dimensions:** `1536`

> ⚠️ If the portal auto-detects dimensions, confirm it shows **1536**. Mismatched dimensions will silently break vector similarity search against the existing AI Search indexes.

### C3 — Configure Retrieval Settings

In the **Retrieval** section:

1. **Search mode:** Hybrid *(keyword + vector)*
2. **Semantic ranking:** Enabled (On)
3. **Top-K:** `5`
4. **Minimum reranker score:** `0.5`
5. **Query rewrite:** On

### C4 — Add Data Source: Blob Storage (Plan Documents)

Click **+ Add data source**:

1. **Type:** Azure Blob Storage
2. **Connection:** `healthbridge-blob-connection`
3. **Container:** `healthcare-docs`
4. **Path prefix:** *(leave blank — index all documents)*
5. **Display name:** `Plan Documents (Blob Storage)`
6. **Parsing mode:** Layout *(preserves document structure; enables OCR for images)*
7. **File types:** pdf, docx, txt
8. Click **Add**.

### C5 — Add Data Source: AI Search — Formulary

Click **+ Add data source**:

1. **Type:** Azure AI Search
2. **Connection:** `healthbridge-aisearch-connection`
3. **Index name:** `healthbridge-formulary-index`
4. **Display name:** `Formulary & Drug Coverage (AI Search)`
5. **Semantic configuration:** `formulary-semantic-config` *(if prompted; leave default otherwise)*
6. Click **Add**.

### C6 — Add Data Source: AI Search — Provider Directory

Click **+ Add data source**:

1. **Type:** Azure AI Search
2. **Connection:** `healthbridge-aisearch-connection`
3. **Index name:** `healthbridge-provider-index`
4. **Display name:** `Provider Directory (AI Search)`
5. **Semantic configuration:** `provider-semantic-config` *(if prompted; leave default otherwise)*
6. Click **Add**.

### C7 — Add Data Source: AI Search — General Documents

Click **+ Add data source**:

1. **Type:** Azure AI Search
2. **Connection:** `healthbridge-aisearch-connection`
3. **Index name:** `healthcare-payor-docs`
4. **Display name:** `Healthcare Payor Documents (AI Search)`
5. Click **Add**.

### C8 — Add Data Source: MCP Server (Prior Auth Policies)

Click **+ Add data source**:

1. **Type:** MCP Server
2. **Connection:** `healthbridge-mcp-connection`
3. **Server URL:** `https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io`
4. **Endpoint path:** `/mcp`
5. **Display name:** `Prior Authorization Policies (MCP Server)`
6. Click **Add**.

### C9 — Add Data Source: Fabric Data Agent ⚠️

> ⚠️ **Skip until Fabric workspace is provisioned.** When ready, click **+ Add data source**, select **Fabric Data Agent**, choose `healthbridge-fabric-connection`, enter agent name `healthbridge-claims-agent`, and click **Add**.

### C10 — Save and Start Indexing

1. Review the data source list — you should see 4 active sources (5 once Fabric is added).
2. Click **Save and index**.
3. Initial indexing runs in the background:
   - **Blob Storage** — 5–15 minutes (45 documents)
   - **AI Search indexes** — Near-instant (indexes are pre-built and already populated)
   - **MCP Server** — Connected on demand (no pre-indexing)
4. Monitor status under **Knowledge bases → payor-knowledge-base → Data sources**. Wait for Blob Storage to show **Indexed** before proceeding.

---

## Step D — Create the Agent: healthbridge-assistant

### D1 — Create a New Agent

1. In **proj-healthbridge**, click **Agents** in the left sidebar.
2. Click **+ New agent**.
3. **Name:** `healthbridge-assistant`
4. **Base model:** `gpt-4o` *(deploy via **Deployments → + New deployment** if not already available; use `gpt-4o` version `2024-11-20` or latest)*
5. **Temperature:** `0.1` *(critical for guardrail reliability — do not increase)*

### D2 — Set the System Prompt

1. In the agent editor, locate the **System prompt** (or **Instructions**) field.
2. Open `agent/system-prompt.md` in this repository.
3. Copy the full contents and paste into the System prompt field.
4. Click **Save**.

### D3 — Attach the Knowledge Base

1. In the agent editor, click the **Knowledge** section (or **+ Add knowledge source**).
2. Select **Knowledge base**.
3. Choose `payor-knowledge-base` from the list.
4. Click **Add** / **Save**.

### D4 — Enable Tool Access

In the **Tools** or **Actions** section of the agent editor:

- ✅ **Knowledge Base retrieval** — already enabled by Step D3
- ✅ **MCP tools** — the MCP connection provides `lookup_member`, `lookup_claim`, `check_benefits`, `lookup_provider`, `get_prior_auth_requirements`, `get_clinical_coverage_criteria`, `check_formulary`
- ⚠️ **Fabric Data Agent queries** — enable once `healthbridge-fabric-connection` is active

### D5 — Save and Open Playground

1. Click **Save** to persist the agent configuration.
2. Click **Open in Playground** (or navigate to **Agents → healthbridge-assistant → Playground**).
3. The Playground chat interface should open with a fresh conversation thread.

---

## Step E — Smoke Test: End-to-End Wiring Verification

Run these three prompts in the Playground **in order**. Each targets a different data source; check the **Citations** panel (or **Source** trace) to confirm the correct source responded.

---

### Smoke Test 1 — MCP Server (Prior Auth Policies)

**Prompt:**
> *"My surgeon wants me to start physical therapy three times a week. Do I need prior authorization for that?"*

**Expected data source:** `Prior Authorization Policies (MCP Server)`  
**Expected behavior:** The agent calls `get_prior_auth_requirements` with `serviceCategory="Physical Therapy"`. Returns that no PA is required for the first 20 visits per year; PA is required beyond 20 visits. Proactively notes that post-surgical rehabilitation commonly exceeds this threshold.

**Confirm:** Citations panel shows **MCP Server** or the tool call trace shows `get_prior_auth_requirements`. ✅

---

### Smoke Test 2 — AI Search: Formulary Index

**Prompt:**
> *"My doctor prescribed celecoxib for pain after my surgery. What tier is it on and what will I pay?"*

**Expected data source:** `Formulary & Drug Coverage (AI Search)` — index `healthbridge-formulary-index`  
**Expected behavior:** Agent queries the formulary index, returns celecoxib's tier placement, copay amount, and any quantity limits. Cites formulary source.

**Confirm:** Citations panel shows the **formulary** index or **AI Search** source. ✅

---

### Smoke Test 3 — AI Search: Provider Directory

**Prompt:**
> *"Can you help me find a physical therapist near Naperville who is in-network and accepting new patients?"*

**Expected data source:** `Provider Directory (AI Search)` — index `healthbridge-provider-index`  
**Expected behavior:** Agent returns matching in-network physical therapists with name, location, phone number, and accepting-new-patients status. Notes HMO members need a referral from their PCP before the first PT visit.

**Confirm:** Citations panel shows the **provider** index or **AI Search** source. ✅

---

### Smoke Test — Blob Storage (Optional)

**Prompt:**
> *"What is the specialist copay on the HealthBridge HMO Silver plan?"*

**Expected data source:** `Plan Documents (Blob Storage)` — container `healthcare-docs`  
**Expected behavior:** Agent retrieves benefit details from the plan summary document and states the specialist copay. Cites the Summary of Benefits and Coverage (SBC) or equivalent plan document.

**Confirm:** Citations panel shows **Blob Storage** or a document filename. ✅

---

> **All three smoke tests passing confirms:** RBAC roles are propagated, all three active connections are authenticated correctly, and KB retrieval routing is working end-to-end.

---

## Troubleshooting

| Symptom | Likely Cause | Resolution |
|---------|-------------|------------|
| Connection shows **Failed** / `403 Forbidden` | RBAC not yet propagated; or wrong auth type (key vs. managed identity) | Wait 5–10 minutes after role assignment. Confirm connection authentication is set to **Managed identity**, not key. Re-run `az role assignment create` commands if needed. |
| Blob Storage connection fails with `AuthorizationPermissionMismatch` | `Storage Blob Data Reader` role missing or not yet active on `sthealthbridgedemo2agib7` | Verify the role assignment in Azure portal → Storage → Access control (IAM). Wait up to 10 minutes. |
| AI Search returns 0 results | Wrong index name; or index not yet populated | Confirm exact index names: `healthcare-payor-docs`, `healthbridge-formulary-index`, `healthbridge-provider-index`. Check Azure portal → AI Search → Indexes → document count > 0. |
| AI Search returns poor/irrelevant results | Semantic ranker not enabled; or embedding dimension mismatch | Verify retrieval settings: Hybrid mode, Semantic ranking On. Confirm embedding model = `text-embedding-3-small`, dimensions = **1536** (not 3072). |
| MCP Server returns `401 Unauthorized` | Container Apps endpoint requires auth that wasn't configured | The live endpoint is public (no auth). If a `401` appears, verify the Server URL exactly matches `https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io` (no trailing slash). |
| MCP Server times out (`504 Gateway Timeout`) | Container App cold start (first request after idle period) | Re-send the prompt once; the Container App warms in ~10 seconds. If timeouts persist, check Container Apps logs in the Azure portal. |
| Knowledge Base stuck in **Indexing** | Large blob batch (45 docs) or transient service issue | Wait 15 minutes; refresh. If still stuck, check Foundry diagnostics under KB → Data sources → status. Re-trigger indexing by clicking **Re-index**. |
| Agent ignores Knowledge Base / answers from general knowledge | Knowledge source not attached to agent, or KB not fully indexed | In the agent editor, confirm `payor-knowledge-base` is listed under **Knowledge**. Verify KB status is **Indexed** (not Pending or Failed). |
| Embedding dimension mismatch error | KB configured with wrong dimensions (e.g., 3072 instead of 1536) | Edit the KB embedding settings: model = `text-embedding-3-small`, dimensions = `1536`. Re-index after saving. |

---

## Reference

| Artifact | Path |
|----------|------|
| Knowledge Base config | `agent/knowledge-base-config.json` |
| Agent system prompt | `agent/system-prompt.md` |
| Sample prompts / demo script | `agent/sample-prompts.md` |
| Full setup guide (all steps) | `docs/setup-guide.md` |
| Azure resource provisioning | `docs/azure-setup.md` |
| Demo narrative | `docs/demo-flow.md` |
| MCP server source | `data-sources/mcp-server/` |
| Fabric Data Agent config | `data-sources/fabric-data-agent/connection-config.json` |

---

*Guide version: 1.0 | Created: 2026-06-21 | Microsoft Foundry (ai.azure.com) only*
