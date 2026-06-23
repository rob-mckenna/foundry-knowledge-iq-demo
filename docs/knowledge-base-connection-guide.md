# Knowledge Base Connection Guide — HealthBridge payor-knowledge-base

**Audience:** Demo presenter / operator wiring up the Foundry IQ Knowledge Base after Azure deployment.  
**Starting point:** Signed in at [ai.azure.com](https://ai.azure.com) with the **New Foundry** toggle enabled, project **proj-healthbridge** open.  
**Time to complete:** ~30 minutes (plus RBAC propagation; see Troubleshooting).  
**Target:** Microsoft Foundry (ai.azure.com) — New Foundry only. Do not follow Azure AI Studio or classic Foundry docs.

> **All Azure resources are live.** This guide uses the exact endpoint values from the completed deployment. Do not re-provision anything — only configure connections, create knowledge sources/knowledge base on Azure AI Search, and wire the agent in the Foundry portal.

> **Architecture note — Foundry IQ:** In Microsoft Foundry, knowledge bases are powered by **Foundry IQ** and backed by **Azure AI Search** agentic retrieval. A knowledge base is an Azure AI Search object that references one or more *knowledge sources*. The Foundry portal provides a guided UI under **Build → Knowledge**, but knowledge sources can also be created programmatically via the Search REST API (2026-05-01-preview). See [What is Foundry IQ?](https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-foundry-iq) for the canonical reference.

---

## Step A — Verify / Assign Managed Identity RBAC Roles

> ⚠️ **Critical:** Azure Policy has disabled key-based authentication on both the Storage account and Azure OpenAI resource. Connections that use Entra RBAC require the roles below. The existing AI Search connection uses an API key (which still works), but AAD/RBAC is recommended if you recreate it.

The Foundry **account** (`foundry-healthbridge-demo`) has a system-assigned managed identity that the project inherits. It needs the following RBAC roles:

| Role | Resource | Why Required |
|------|----------|--------------|
| **Search Index Data Reader** | `srch-healthbridge-demo` | Read search results from all three indexes at retrieval time |
| **Search Service Contributor** | `srch-healthbridge-demo` | Create/manage knowledge sources and knowledge base objects on the search service |
| **Storage Blob Data Reader** | `sthealthbridgedemo2agib7` | Read documents from `healthcare-docs` container for indexing |
| **Cognitive Services OpenAI User** | `oai-healthbridge-demo` | Call the `text-embedding-3-small` embedding deployment for vectorization |

> **Note:** The existing AI Search connection (`srch-healthbridge-connection`) uses API key auth, which bypasses the need for Search RBAC roles for that connection path. The Search roles above are still needed if you create an AAD-authenticated connection or if the project's managed identity needs to call the Search REST API directly (e.g., to create knowledge bases/sources programmatically).
>
> **Ref:** [Foundry IQ authentication & permissions](https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/foundry-iq-connect#authentication-and-permissions), [Azure AI Search RBAC](https://learn.microsoft.com/en-us/azure/search/search-security-rbac)

### A1 — Find the Managed Identity Object ID

The managed identity lives on the Foundry **account** resource (`Microsoft.CognitiveServices/accounts`), not the project sub-resource.

1. Open the **Azure portal** → Resource Group `rg-knowledge-iq-demo` → **foundry-healthbridge-demo** (type: Cognitive Services / AI Services).
2. In the left blade, click **Identity** → **System assigned** tab.
3. Confirm Status is **On**. Copy the **Object (principal) ID**.

**CLI alternative:**

```bash
MI_OID=$(az cognitiveservices account show \
  --name foundry-healthbridge-demo \
  --resource-group rg-knowledge-iq-demo \
  --query identity.principalId --output tsv)
echo "Managed Identity Object ID: $MI_OID"
```

### A2 — Assign RBAC via Azure Portal (click-path)

For each role in the table above:

1. Navigate to the target resource (e.g., `srch-healthbridge-demo`) in the **Azure portal**.
2. Click **Access control (IAM)** in the left blade.
3. Click **+ Add → Add role assignment**.
4. Select the role name from the table.
5. Click **Next**.
6. Under **Assign access to**, select **Managed identity**.
7. Click **+ Select members**, search for **foundry-healthbridge-demo**, select it, click **Select**.
8. Click **Review + assign** twice to confirm.

Repeat for all four role assignments, noting that `srch-healthbridge-demo` requires two separate role assignments (rows 1 and 2).

### A3 — Assign RBAC via Azure CLI (fallback)

If portal role assignment is unavailable, use the following `az` commands:

```bash
# Get the Foundry account managed identity
MI_OID=$(az cognitiveservices account show \
  --name foundry-healthbridge-demo \
  --resource-group rg-knowledge-iq-demo \
  --query identity.principalId --output tsv)

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

## Step B — Create Connections

These connections bridge the Foundry project and the live Azure resources.

> **⚠️ IMPORTANT — Connections may already exist!** Data's empirical discovery against the live project found that **Blob Storage** and **AI Search** connections already exist on `proj-healthbridge` (auto-created during project provisioning):
>
> | Existing connection name | Category | AuthType | Target |
> |---|---|---|---|
> | `sthealthbridgedemo2ag633uyd` | AzureStorageAccount | AAD | `https://sthealthbridgedemo2agib7.blob.core.windows.net/` |
> | `srch-healthbridge-connection` | CognitiveSearch | ApiKey | `https://srch-healthbridge-demo.search.windows.net` |
>
> These names do **NOT** match the `connectionNameRef` values in `agent/knowledge-base-config.json` (`healthbridge-blob-connection`, `healthbridge-aisearch-connection`). **Only the MCP connection is missing and must be created regardless.**
>
> **You have two choices:**
> - **Option A (code-first):** Create NEW connections with our exact custom names via `az rest`. The existing auto-named connections remain but are unused. `knowledge-base-config.json` stays unchanged.
> - **Option B (use existing):** Keep the auto-named connections that already work and update `knowledge-base-config.json` to reference them. Fewer commands; still need `az rest` for MCP.

> **Connection naming limitation:** The portal does not allow setting or renaming connection names. Custom names require creation via code (REST/Bicep/SDK).
>
> **Ref:** [Add a new connection to your project](https://learn.microsoft.com/en-us/azure/foundry/how-to/connections-add), [Connection Bicep templates](https://github.com/microsoft-foundry/foundry-samples/tree/main/infrastructure/infrastructure-setup-bicep/01-connections)

> **Quick decision helper:**
>
> | | Option A — Code-first ✅ | Option B — Use existing connections |
> |---|---|---|
> | **Method** | `az rest` for all connections (Blob, Search, MCP) | Keep existing Blob + Search; `az rest` for MCP only |
> | **Connection names** | Clean custom names matching config | Auto-generated names: `sthealthbridgedemo2ag633uyd`, `srch-healthbridge-connection` |
> | **Config edits needed** | None — `knowledge-base-config.json` works as-is | Must edit 3 `connectionNameRef` values in `knowledge-base-config.json` |
> | **Search auth** | AAD (recommended) | ApiKey (current — works but less secure) |
> | **Best for** | Reproducible setup, uniform auth model | Fewest commands; get running fastest |

> **Regardless of which option you choose:** MCP (`healthbridge-mcp-connection`) and Fabric (`healthbridge-fabric-connection`) **cannot** be created in the portal — they are always code-only. Both options require the Step B-MCP section below.

---

### Option A — Code-First (Recommended)

Create all connections via `az rest` with exact custom names matching `agent/knowledge-base-config.json`. No config edits needed. The existing auto-named connections remain on the project but are unused.

#### A0 — Get the Project Resource ID

The Foundry project is a `Microsoft.CognitiveServices/accounts/projects` resource (NOT an ML workspace).

```bash
# The project resource ID is constructed from the account:
ACCOUNT_ID="/subscriptions/c81fda52-936e-4f14-8af4-951c0dbb92d2/resourceGroups/rg-knowledge-iq-demo/providers/Microsoft.CognitiveServices/accounts/foundry-healthbridge-demo"
PROJECT_ID="${ACCOUNT_ID}/projects/proj-healthbridge"
echo $PROJECT_ID

# Verify it resolves:
az resource show --ids "$PROJECT_ID" --api-version 2025-04-01-preview \
  --query "{name:name, type:type, state:properties.provisioningState}" -o table
```

> This should show: name=`proj-healthbridge`, type=`Microsoft.CognitiveServices/accounts/projects`, state=`Succeeded`.

#### A1 — Azure Storage (Blob) — `healthbridge-blob-connection`

```bash
# Get the storage account resource ID
STORAGE_RID=$(az storage account show \
  --name sthealthbridgedemo2agib7 \
  --resource-group rg-knowledge-iq-demo \
  --query id --output tsv)

# Create connection with exact custom name
az rest --method PUT \
  --url "https://management.azure.com${PROJECT_ID}/connections/healthbridge-blob-connection?api-version=2025-04-01-preview" \
  --body "{
    \"name\": \"healthbridge-blob-connection\",
    \"properties\": {
      \"category\": \"AzureStorageAccount\",
      \"target\": \"https://sthealthbridgedemo2agib7.blob.core.windows.net/\",
      \"authType\": \"AAD\",
      \"isSharedToAll\": true,
      \"metadata\": {
        \"ApiType\": \"Azure\",
        \"ResourceId\": \"${STORAGE_RID}\",
        \"location\": \"eastus\"
      }
    }
  }"
```

> **Authentication is `AAD` (Microsoft Entra ID / managed identity)** — no account key. This is enforced by Azure Policy on this subscription.

#### A2 — Azure AI Search — `healthbridge-aisearch-connection`

```bash
# Get the search service resource ID
SEARCH_RID=$(az search service show \
  --name srch-healthbridge-demo \
  --resource-group rg-knowledge-iq-demo \
  --query id --output tsv)

az rest --method PUT \
  --url "https://management.azure.com${PROJECT_ID}/connections/healthbridge-aisearch-connection?api-version=2025-04-01-preview" \
  --body "{
    \"name\": \"healthbridge-aisearch-connection\",
    \"properties\": {
      \"category\": \"CognitiveSearch\",
      \"target\": \"https://srch-healthbridge-demo.search.windows.net\",
      \"authType\": \"AAD\",
      \"isSharedToAll\": true,
      \"metadata\": {
        \"ApiType\": \"Azure\",
        \"ResourceId\": \"${SEARCH_RID}\",
        \"location\": \"eastus\"
      }
    }
  }"
```

> **Auth note:** The existing auto-created connection (`srch-healthbridge-connection`) uses `ApiKey` auth. The command above uses `AAD` (Entra RBAC) which is preferred when the RBAC roles from Step A are assigned. If you encounter issues with AAD, you can substitute `\"authType\": \"ApiKey\"` and add `\"credentials\": { \"key\": \"<search-admin-key>\" }` to properties.
>
> This single connection covers all three search indexes (`healthcare-payor-docs`, `healthbridge-formulary-index`, `healthbridge-provider-index`) — the specific index is selected when configuring knowledge sources in Step C.

**After running A1 and A2, skip to Step B-MCP below.**

---

### Option B — Use Existing Connections (Fewest Commands)

The Blob Storage and AI Search connections **already exist** on the project. Keep them and update `agent/knowledge-base-config.json` to match their actual names. Only the MCP connection needs to be created.

#### B1 — Verify Existing Connections

1. In the Microsoft Foundry portal: **Operate** → **Admin** → select **proj-healthbridge**.
2. Confirm these connections are listed and show **Connected**:
   - `sthealthbridgedemo2ag633uyd` (Azure Storage, AAD auth)
   - `srch-healthbridge-connection` (AI Search, ApiKey auth)

> ⚠️ If you do not see "Operate → Admin", try the legacy path: Settings (gear icon, bottom-left) → Connected resources.

#### B2 — Reconcile Connection Names in Config

Update `agent/knowledge-base-config.json` to reference the existing connection names:

| File | Line | Change from | Change to |
|------|------|-------------|-----------|
| `agent/knowledge-base-config.json` | 29 | `"healthbridge-blob-connection"` | `"sthealthbridgedemo2ag633uyd"` |
| `agent/knowledge-base-config.json` | 51 | `"healthbridge-aisearch-connection"` | `"srch-healthbridge-connection"` |
| `agent/knowledge-base-config.json` | 83 | `"healthbridge-aisearch-connection"` | `"srch-healthbridge-connection"` |

> **Verify the exact names** in the portal before editing — they should match the table above per Data's empirical discovery, but always confirm.

The following files also reference these connection names and should be updated for **documentation consistency** (non-functional — these are prose references, not config the system reads):
- `docs/azure-setup.md`
- `docs/setup-guide.md`
- `agent/README.md`

**After completing B2, continue to Step B-MCP below.**

---

### Step B-MCP — Connection: MCP Server (Code-Only) — `healthbridge-mcp-connection`

> **Required for both Option A and Option B.** "MCP Server" is not a portal connection type. MCP servers are surfaced as:
> 1. A **knowledge source** on Azure AI Search (configured in Step C6).
> 2. An **agent tool** via a `RemoteTool` project connection — created here for Step D4.

```bash
# If you haven't already set PROJECT_ID (Option B users):
ACCOUNT_ID="/subscriptions/c81fda52-936e-4f14-8af4-951c0dbb92d2/resourceGroups/rg-knowledge-iq-demo/providers/Microsoft.CognitiveServices/accounts/foundry-healthbridge-demo"
PROJECT_ID="${ACCOUNT_ID}/projects/proj-healthbridge"

az rest --method PUT \
  --url "https://management.azure.com${PROJECT_ID}/connections/healthbridge-mcp-connection?api-version=2025-04-01-preview" \
  --body '{
    "name": "healthbridge-mcp-connection",
    "properties": {
      "authType": "None",
      "category": "RemoteTool",
      "target": "https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io/mcp",
      "isSharedToAll": true,
      "metadata": { "ApiType": "MCP" }
    }
  }'
```

> Verify the MCP server is live first: `curl https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io/health` should return `200 OK`.

### Step B-Fabric — Connection: Fabric Data Agent ⚠️ (Code-Only) — `healthbridge-fabric-connection`

> ⚠️ **PENDING — skip for now.** The Fabric Data Agent requires a Microsoft Fabric workspace with Data Agent preview enabled. This workspace has not yet been provisioned. The Knowledge Base will operate fully with the remaining sources.

> **Note:** Microsoft Fabric connections require creation through code — they cannot be created in the Foundry portal UI. See [Foundry connection types](https://learn.microsoft.com/en-us/azure/foundry/how-to/connections-add#connection-types).

When the Fabric workspace is ready, create via `az rest` with:

- **Connection name:** `healthbridge-fabric-connection`
- **Category:** `MicrosoftFabric`
- **Workspace ID:** *(replace `<FABRIC_WORKSPACE_ID>` in `agent/knowledge-base-config.json`)*
- **Data Agent name:** `healthbridge-claims-agent`

### Step B-Verify — Confirm All Connections

After creating connections (via whichever option), verify them in the portal:

1. In the Microsoft Foundry portal, click **Operate** → **Admin** → select **proj-healthbridge**.
2. Confirm each connection appears with status **Connected** (green checkmark):

   | Option A names (new, custom) | Option B names (existing + MCP) |
   |---|---|
   | `healthbridge-blob-connection` | `sthealthbridgedemo2ag633uyd` *(pre-existing)* |
   | `healthbridge-aisearch-connection` | `srch-healthbridge-connection` *(pre-existing)* |
   | `healthbridge-mcp-connection` | `healthbridge-mcp-connection` *(same — code-only)* |

If any connection shows **Failed**:
- Re-check RBAC propagation (Step A); wait up to 10 minutes.
- Confirm the managed identity has the required roles on the target resource.
- See the Troubleshooting table at the end of this guide.

---

## Step C — Create the Knowledge Base: payor-knowledge-base

> **Architecture:** The knowledge base and its knowledge sources are **Azure AI Search objects** created on `srch-healthbridge-demo`. The Microsoft Foundry portal wraps this under **Build → Knowledge** (Foundry IQ). You can use the portal UI OR the Search REST API. This guide describes the portal path with programmatic fallback.
>
> **Ref:** [Create a Knowledge Base](https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-how-to-create-knowledge-base), [Knowledge Source overview](https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-overview)

### C1 — Navigate to Knowledge Base Creation

1. In **proj-healthbridge** in the Microsoft Foundry portal, select **Build** from the top navigation menu.
2. Click the **Knowledge** tab.
3. Connect to (or confirm connection to) the search service `srch-healthbridge-demo`.
4. Click **Create knowledge base** (or **+ New**).
5. **Name:** `payor-knowledge-base`
6. **Description:** `Multi-source Knowledge Base for the HealthBridge Insurance demo — benefits, claims, prior auth, formulary, and provider network.`

> ⚠️ Verify in your portal — the exact button label may be "Create knowledge base" or "+ New knowledge base" depending on the portal version. The Knowledge tab under Build is the correct location per [Foundry IQ workflow](https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-foundry-iq#workflow).

### C2 — Add Knowledge Source: Blob Storage (Plan Documents)

Add a **blob** knowledge source. This auto-generates an indexer pipeline on `srch-healthbridge-demo` that ingests documents from the blob container:

1. Click **+ Add knowledge source** (or equivalent).
2. **Kind:** Azure Blob
3. **Connection / Storage account:** `sthealthbridgedemo2agib7` (uses the `healthbridge-blob-connection`)
4. **Container:** `healthcare-docs`
5. **Path prefix:** *(leave blank — index all documents)*
6. **Display name:** `Plan Documents (Blob Storage)`
7. Click **Add** / **Save**.

> The auto-generated pipeline handles chunking, vectorization (using the search service's configured embedding model), and indexing. File types supported: PDF, DOCX, TXT.
>
> **Embedding model:** The search service should be configured to use `text-embedding-3-small` (1536 dimensions) from `oai-healthbridge-demo`. This is set at the knowledge source / skillset level during pipeline generation. Confirm dimensions = **1536** — mismatch will silently break vector search against pre-built indexes.

### C3 — Add Knowledge Source: AI Search — Formulary (existing index)

Add a **search index** knowledge source wrapping the pre-built formulary index:

1. Click **+ Add knowledge source**.
2. **Kind:** Search Index
3. **Index name:** `healthbridge-formulary-index`
4. **Display name:** `Formulary & Drug Coverage (AI Search)`
5. **Description:** `Structured formulary: tier assignments, quantity limits, step therapy, PA flags.`
6. Click **Add**.

### C4 — Add Knowledge Source: AI Search — Provider Directory (existing index)

1. Click **+ Add knowledge source**.
2. **Kind:** Search Index
3. **Index name:** `healthbridge-provider-index`
4. **Display name:** `Provider Directory (AI Search)`
5. **Description:** `Provider directory: names, specialties, NPI, locations, network status.`
6. Click **Add**.

### C5 — Add Knowledge Source: AI Search — General Documents (existing index)

1. Click **+ Add knowledge source**.
2. **Kind:** Search Index
3. **Index name:** `healthcare-payor-docs`
4. **Display name:** `Healthcare Payor Documents (AI Search)`
5. Click **Add**.

### C6 — Add Knowledge Source: MCP Server (Prior Auth Policies) — Preview

> **Note:** MCP Server is a **remote knowledge source** (preview, 2026-05-01-preview API). At query time, the agentic retrieval engine calls the MCP server's tools directly — no pre-indexing occurs. This source requires the 2026-05-01-preview API on `srch-healthbridge-demo`.
>
> **Ref:** [Create an MCP Server Knowledge Source](https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-mcp-server)

If the portal UI supports adding MCP Server knowledge sources (check for "MCP Server" in the knowledge source kind picker), use:

1. **Kind:** MCP Server
2. **Server URL:** `https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io/mcp`
3. **Tools:** `get_prior_auth_requirements`, `get_clinical_coverage_criteria`
4. **Authentication:** None (public endpoint)
5. **Display name:** `Prior Authorization Policies (MCP Server)`
6. Click **Add**.

**Programmatic fallback** (if the portal does not yet surface MCP Server knowledge sources):

```bash
# Create MCP Server knowledge source via REST API
curl -X PUT "https://srch-healthbridge-demo.search.windows.net/knowledgesources/mcp-prior-auth-policies?api-version=2026-05-01-preview" \
  -H "Content-Type: application/json" \
  -H "api-key: <SEARCH_ADMIN_KEY>" \
  -d '{
    "name": "mcp-prior-auth-policies",
    "kind": "mcpServer",
    "description": "Prior authorization criteria and clinical guidelines via MCP server.",
    "mcpServerParameters": {
      "serverURL": "https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io/mcp",
      "authentication": null,
      "tools": [
        { "name": "get_prior_auth_requirements", "outputParsing": { "kind": "auto" } },
        { "name": "get_clinical_coverage_criteria", "outputParsing": { "kind": "auto" } }
      ]
    }
  }'
```

> ⚠️ The MCP Server knowledge source is **preview-only** (2026-05-01-preview). If your search service does not support this API version, the MCP tools can still be accessed directly by the agent as tool calls (see Step D4) rather than through the KB retrieval pipeline.

### C7 — Add Knowledge Source: Fabric Data Agent ⚠️

> ⚠️ **Skip until Fabric workspace is provisioned.** Fabric Data Agent is also a remote knowledge source (preview). When ready, add via REST API with kind `fabricDataAgent` referencing `healthbridge-claims-agent`. See [Fabric Data Agent knowledge source](https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-fabric-data-agent).

### C8 — Configure Knowledge Base Properties

After all knowledge sources are added, configure the KB-level settings:

- **Retrieval instructions** (optional): `"Use the formulary knowledge source for drug/medication queries, the provider directory for provider lookup queries, and the MCP server for prior authorization questions."`
- **Output mode:** `answerSynthesis` (for LLM-synthesized answers with citations) or `extractedData` (for raw results passed to the agent)
- **Retrieval reasoning effort:** `low` (recommended for demo — balances speed and accuracy)

> ⚠️ Unlike classic "Add your data", the current Foundry IQ knowledge base does **not** expose embedding model, dimensions, Top-K, Hybrid/Semantic mode, or minimum reranker score directly in the KB creation UI. These settings are:
> - **Embedding model / dimensions:** Configured on each knowledge source's indexer pipeline or the underlying search index.
> - **Search mode (hybrid, vector, keyword):** Determined at query time by the agentic retrieval engine based on the knowledge source type and query.
> - **Semantic ranking:** Enabled on the search index's semantic configuration.
> - **Top-K:** Controlled via the `retrieve` API call or defaults to system behavior.
>
> For this demo, the pre-built indexes already have correct semantic configurations and vector fields (1536 dimensions, `text-embedding-3-small`).

### C9 — Save the Knowledge Base

1. Review the knowledge source list — you should see 4–5 sources (Blob, 3× Search Index, MCP Server; plus Fabric when ready).
2. Click **Save** (or **Create**).
3. Indexing for the Blob knowledge source runs in the background:
   - **Blob Storage** — 5–15 minutes (45 documents)
   - **Search Index sources** — Immediate (indexes are pre-built and populated)
   - **MCP Server** — Remote; queried on demand (no pre-indexing)
4. Monitor indexing status in **Build → Knowledge → payor-knowledge-base**. Wait for Blob source to show **Indexed** before proceeding.

---

## Step D — Create the Agent: healthbridge-assistant

> **Ref:** [Connect Agents to Foundry IQ Knowledge Bases](https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/foundry-iq-connect)

### D1 — Create a New Agent

1. In **proj-healthbridge**, select **Build** from the top navigation.
2. Click the **Agents** tab.
3. Click **+ New agent** (or **Create agent**).
4. **Name:** `healthbridge-assistant`
5. **Model:** `gpt-4o` *(deploy via model deployments if not already available; use latest version)*
6. **Temperature:** `0.1` *(critical for guardrail reliability — do not increase)*

### D2 — Set the System Prompt (Instructions)

1. In the agent editor, locate the **Instructions** field.
2. Open `agent/system-prompt.md` in this repository.
3. Copy the full contents and paste into the Instructions field.
4. Click **Save**.

### D3 — Connect the Knowledge Base (MCP Tool)

The knowledge base is connected to the agent as an **MCP tool** that exposes the `knowledge_base_retrieve` function:

1. In the agent editor, look for the **Tools** section (or **+ Add tool**).
2. Select **MCP** tool type.
3. **Server label:** `knowledge-base`
4. **Server URL:** `https://srch-healthbridge-demo.search.windows.net/knowledgebases/payor-knowledge-base/mcp?api-version=2026-05-01-preview`
5. **Connection:** Select `healthbridge-aisearch-connection` (or the project connection created in Step B4)
6. **Allowed tools:** `knowledge_base_retrieve`
7. **Require approval:** Never
8. Click **Add** / **Save**.

> ⚠️ Verify in your portal — the portal may present this as "Add knowledge source" or a dedicated **Knowledge** section in the agent editor that auto-configures the MCP tool. Either approach connects the same KB. Per [Foundry IQ workflow](https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-foundry-iq#workflow): "On the Agents tab, create or select an existing agent → Connect to your knowledge base."

### D4 — Enable Direct MCP Tool Access (Optional)

For demo scenarios where the agent should also call MCP tools directly (bypassing KB retrieval for faster, targeted tool calls):

In the **Tools** section, add a second MCP tool:

- **Server label:** `healthbridge-mcp`
- **Server URL:** `https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io/mcp`
- **Connection:** `healthbridge-mcp-connection` (created in Step B4)
- **Allowed tools:** `lookup_member`, `lookup_claim`, `check_benefits`, `lookup_provider`, `get_prior_auth_requirements`, `get_clinical_coverage_criteria`, `check_formulary`
- **Require approval:** Never

> ⚠️ **Fabric Data Agent queries** — enable once `healthbridge-fabric-connection` is active.

### D5 — Save and Open Playground

1. Click **Save** to persist the agent configuration.
2. Use the **Playground** to test (available in the Agents tab or by clicking "Test" in the agent editor).
3. The Playground chat interface should open with a fresh conversation thread.

---

## Step E — Smoke Test: End-to-End Wiring Verification

Run these three prompts in the Playground **in order**. Each targets a different data source; check the **Citations / Annotations** in the response to confirm the correct source responded.

---

### Smoke Test 1 — MCP Server (Prior Auth Policies)

**Prompt:**
> *"My surgeon wants me to start physical therapy three times a week. Do I need prior authorization for that?"*

**Expected data source:** `Prior Authorization Policies (MCP Server)`  
**Expected behavior:** The agent calls `get_prior_auth_requirements` with `serviceCategory="Physical Therapy"`. Returns that no PA is required for the first 20 visits per year; PA is required beyond 20 visits. Proactively notes that post-surgical rehabilitation commonly exceeds this threshold.

**Confirm:** Response annotations show **MCP Server** source or the tool call trace shows `get_prior_auth_requirements`. ✅

---

### Smoke Test 2 — AI Search: Formulary Index

**Prompt:**
> *"My doctor prescribed celecoxib for pain after my surgery. What tier is it on and what will I pay?"*

**Expected data source:** `Formulary & Drug Coverage (AI Search)` — index `healthbridge-formulary-index`  
**Expected behavior:** Agent queries the formulary index, returns celecoxib's tier placement, copay amount, and any quantity limits. Cites formulary source.

**Confirm:** Response annotations show the **formulary** index or **AI Search** source. ✅

---

### Smoke Test 3 — AI Search: Provider Directory

**Prompt:**
> *"Can you help me find a physical therapist near Naperville who is in-network and accepting new patients?"*

**Expected data source:** `Provider Directory (AI Search)` — index `healthbridge-provider-index`  
**Expected behavior:** Agent returns matching in-network physical therapists with name, location, phone number, and accepting-new-patients status. Notes HMO members need a referral from their PCP before the first PT visit.

**Confirm:** Response annotations show the **provider** index or **AI Search** source. ✅

---

### Smoke Test 4 — Blob Storage (Plan Documents)

**Prompt:**
> *"What is the specialist copay on the HealthBridge HMO Silver plan?"*

**Expected data source:** `Plan Documents (Blob Storage)` — container `healthcare-docs`  
**Expected behavior:** Agent retrieves benefit details from the plan summary document and states the specialist copay. Cites the Summary of Benefits and Coverage (SBC) or equivalent plan document.

**Confirm:** Response annotations show **Blob Storage** source or a document filename. ✅

---

> **All smoke tests passing confirms:** RBAC roles are propagated, connections are authenticated correctly, knowledge sources are reachable, and the KB retrieval pipeline is working end-to-end.

---

## Troubleshooting

| Symptom | Likely Cause | Resolution |
|---------|-------------|------------|
| Connection shows **Failed** / `403 Forbidden` | RBAC not yet propagated; or wrong auth type (key vs. managed identity) | Wait 5–10 minutes after role assignment. Confirm connection authentication is set to **Microsoft Entra ID**, not key. Re-run `az role assignment create` commands if needed. |
| Blob Storage connection fails with `AuthorizationPermissionMismatch` | `Storage Blob Data Reader` role missing or not yet active on `sthealthbridgedemo2agib7` | Verify the role assignment in Azure portal → Storage → Access control (IAM). Wait up to 10 minutes. |
| AI Search returns 0 results | Wrong index name; or index not yet populated | Confirm exact index names: `healthcare-payor-docs`, `healthbridge-formulary-index`, `healthbridge-provider-index`. Check Azure portal → AI Search → Indexes → document count > 0. |
| AI Search returns poor/irrelevant results | Semantic configuration missing; or embedding dimension mismatch | Confirm index semantic configurations are enabled. Confirm embedding model = `text-embedding-3-small`, dimensions = **1536** (not 3072). |
| MCP Server returns `401 Unauthorized` | Container Apps endpoint requires auth that wasn't configured | The live endpoint is public (no auth). If a `401` appears, verify the Server URL exactly matches `https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io` (no trailing slash on base, `/mcp` for MCP endpoint). |
| MCP Server times out (`504 Gateway Timeout`) | Container App cold start (first request after idle period) | Re-send the prompt once; the Container App warms in ~10 seconds. If timeouts persist, check Container Apps logs in the Azure portal. |
| Knowledge source stuck in **Indexing** | Large blob batch (45 docs) or transient service issue | Wait 15 minutes; refresh. Check Azure portal → AI Search → Indexers for error details. Re-trigger indexing from the search service or Foundry UI. |
| Agent ignores Knowledge Base / answers from general knowledge | MCP tool not attached to agent, or KB not fully indexed | In the agent editor, confirm the MCP tool pointing to `payor-knowledge-base` is listed. Verify blob knowledge source status is **Indexed** (not Pending or Failed). |
| Embedding dimension mismatch error | Index configured with wrong dimensions (e.g., 3072 instead of 1536) | Check the index schema vector field dimensions. Must be `1536` for `text-embedding-3-small`. Rebuild index if mismatched. |
| MCP knowledge source not available | Search service does not support 2026-05-01-preview | MCP Server knowledge sources require the preview API. Ensure `srch-healthbridge-demo` is in a [supported region](https://learn.microsoft.com/en-us/azure/search/search-region-support). Fallback: use MCP as a direct agent tool (Step D4). |

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

### Key Microsoft Learn References

| Topic | URL |
|-------|-----|
| What is Foundry IQ? | https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-foundry-iq |
| Add connections to a Foundry project | https://learn.microsoft.com/en-us/azure/foundry/how-to/connections-add |
| Create a Knowledge Base (AI Search) | https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-how-to-create-knowledge-base |
| Knowledge Source overview | https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-overview |
| MCP Server knowledge source | https://learn.microsoft.com/en-us/azure/search/agentic-knowledge-source-how-to-mcp-server |
| Connect agents to Foundry IQ KB | https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/foundry-iq-connect |
| MCP tools for agents | https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/model-context-protocol |
| Foundry RBAC roles | https://learn.microsoft.com/en-us/azure/foundry/concepts/rbac-foundry |

---

*Guide version: 1.4 | Created: 2026-06-21 | Updated: 2026-06-22 | Microsoft Foundry (ai.azure.com) — New Foundry only*
