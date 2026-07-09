# Setup Guide — HealthBridge Knowledge IQ Demo

**Audience:** Engineers and demo presenters setting up the full demo environment.  
**Time to complete:** ~60 minutes (excluding Azure resource provisioning time).  
**Target:** New Azure AI Foundry (ai.azure.com) only — do not follow Azure AI Studio docs.

---

## Prerequisites

### Azure Requirements

| Requirement | Notes |
|---|---|
| Azure subscription | Contributor or Owner role required |
| Azure AI Foundry access | Available at [ai.azure.com](https://ai.azure.com) |
| Azure OpenAI quota | `text-embedding-3-small` — minimum 30K TPM recommended |
| Azure AI Search | Basic tier or above (Standard for semantic ranker in production) |
| Azure Blob Storage | Standard StorageV2 account |
| Microsoft Fabric | Workspace with Data Agent preview enabled *(config provided separately)* |

### Local Tools

| Tool | Version | Install |
|---|---|---|
| Node.js | 18.x or higher | [nodejs.org](https://nodejs.org) |
| Azure CLI (`az`) | 2.57+ | [Install guide](https://learn.microsoft.com/cli/azure/install-azure-cli) |
| PowerShell | 7+ | [Install guide](https://learn.microsoft.com/powershell/scripting/install/installing-powershell) |
| Git | Any recent | [git-scm.com](https://git-scm.com) |
| `curl` | Any | Included on macOS/Linux; use Git Bash or WSL on Windows |

### Authentication

Log in to Azure CLI before running any provisioning commands:

```bash
az login
az account set --subscription "<your-subscription-id>"
```

Verify:

```bash
az account show --query "{Name:name, SubscriptionId:id}" --output table
```

---

## Step 1: Provision Core Azure Resources

All resources live in a single resource group for easy cleanup.

### 1a — Create Resource Group

```bash
az group create \
  --name rg-knowledge-iq-demo \
  --location eastus \
  --tags project=knowledge-iq-demo environment=demo
```

> **Region note:** Use `eastus` or `eastus2`. Azure AI Foundry and Azure OpenAI have the broadest availability in these regions.

### 1b — Register Resource Providers

Run once per subscription if not already registered:

```bash
az provider register --namespace Microsoft.Storage
az provider register --namespace Microsoft.Search
az provider register --namespace Microsoft.CognitiveServices
az provider register --namespace Microsoft.MachineLearningServices
```

### 1c — Create an Azure AI Foundry Project

Azure AI Foundry now uses a flat **project** model. Create the project directly — no hub is required.

> ⚠️ **Resource model update (2026-06-22):** The live `proj-healthbridge` project is a `Microsoft.CognitiveServices/accounts/projects` resource under the Foundry account `foundry-healthbridge-demo` — NOT an `Microsoft.MachineLearningServices/workspaces` resource. The `az ml workspace create --kind project` command below may have been used historically, but the current new-Foundry model uses CognitiveServices. If recreating, use the Foundry portal or Bicep with `Microsoft.CognitiveServices/accounts/projects`. See `docs/knowledge-base-connection-guide.md` Step B for the correct resource ID format.

```bash
az ml workspace create \
  --name proj-healthbridge \
  --resource-group rg-knowledge-iq-demo \
  --location eastus \
  --kind project
```

Open [ai.azure.com](https://ai.azure.com) and verify **proj-healthbridge** appears. The left sidebar should show **Agents**, **Knowledge bases**, and **Deployments** — not the classic Studio layout.

### 1d — Create Azure OpenAI (for embeddings)

```bash
az cognitiveservices account create \
  --name oai-healthbridge-demo \
  --resource-group rg-knowledge-iq-demo \
  --location eastus \
  --kind OpenAI \
  --sku S0

az cognitiveservices account deployment create \
  --name oai-healthbridge-demo \
  --resource-group rg-knowledge-iq-demo \
  --deployment-name text-embedding-3-small \
  --model-name text-embedding-3-small \
  --model-version "1" \
  --model-format OpenAI \
  --sku-capacity 30 \
  --sku-name Standard
```

---

## Step 2: MCP Server

The MCP server exposes live member, claims, and benefits data as callable tools. It must be running and reachable before adding it as a Foundry Knowledge Base data source.

### 2a — Install Dependencies

```bash
cd data-sources/mcp-server
npm install
```

### 2b — Start the Server

```bash
npm start
```

The server communicates over **stdio** (standard MCP transport). You should see no errors; it waits for JSON-RPC messages from a client.

For local development with hot-reload:

```bash
npm run dev
```

### 2c — Verify with the Test Script

In a separate terminal, run the smoke test:

```bash
cd data-sources/mcp-server
node test-tools.mjs
```

Expected output:

```
── lookup_member ──
  ✅ loads 3 members
  ✅ members have memberId (camelCase)
  ✅ members have subscriber.firstName
  ✅ find MBR-2024-001234 by id
  ✅ MBR-2024-001234 is Hartwell
  ✅ find Nguyen by name
  ✅ Nguyen memberId is MBR-2024-002891

── lookup_claim ──
  ✅ loads 3 claims
  ...

── Results: 16 passed, 0 failed ──
```

If any tests fail, verify the `sample-data/members/`, `sample-data/claims/`, and `sample-data/benefits/` directories contain valid JSON files.

### 2d — Expose for Foundry (Production/Demo)

Foundry requires an **HTTP endpoint** for MCP servers. For a live demo, deploy to Azure Container Apps:

```bash
# From data-sources/mcp-server/
az acr build \
  --registry <your-acr-name> \
  --image healthcare-mcp:latest .

az containerapp create \
  --name healthcare-mcp \
  --resource-group rg-knowledge-iq-demo \
  --image <your-acr-name>.azurecr.io/healthcare-mcp:latest \
  --target-port 3000 \
  --ingress external
```

Note the Container Apps URL — you will need it when configuring the Foundry connection in Step 5.

---

## Step 3: Azure AI Search

The AI Search indexes hold the formulary (drug coverage) and provider directory data.

### 3a — Create the Search Service

```bash
az search service create \
  --name srch-healthbridge-demo \
  --resource-group rg-knowledge-iq-demo \
  --location eastus \
  --sku basic \
  --replica-count 1 \
  --partition-count 1
```

> Upgrade to **Standard** tier for semantic ranker in production. Basic tier supports semantic ranker as a preview feature.

### 3b — Retrieve the Admin Key

```bash
az search admin-key show \
  --service-name srch-healthbridge-demo \
  --resource-group rg-knowledge-iq-demo \
  --query primaryKey --output tsv
```

Save this key — you will use it in the next steps.

### 3c — Set Environment Variables

```bash
export AZURE_SEARCH_ENDPOINT="https://srch-healthbridge-demo.search.windows.net"
export AZURE_SEARCH_ADMIN_KEY="<key-from-step-3b>"
export AZURE_OPENAI_ENDPOINT="https://oai-healthbridge-demo.openai.azure.com/"
```

*(On Windows PowerShell, use `$env:AZURE_SEARCH_ENDPOINT = "..."` syntax.)*

### 3d — Create the Indexes

Both indexes use the schema in `data-sources/ai-search/index-schema.json`:

```bash
# Formulary index (drugs, tiers, quantity limits, step therapy)
curl -X PUT "$AZURE_SEARCH_ENDPOINT/indexes/healthbridge-formulary-index?api-version=2024-07-01" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_SEARCH_ADMIN_KEY" \
  -d @data-sources/ai-search/index-schema.json

# Provider directory index (physicians, specialties, network status)
curl -X PUT "$AZURE_SEARCH_ENDPOINT/indexes/healthbridge-provider-index?api-version=2024-07-01" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_SEARCH_ADMIN_KEY" \
  -d @data-sources/ai-search/index-schema.json
```

Both calls should return `HTTP 201 Created`.

### 3e — Create the Skillset

The skillset drives chunking, entity extraction, and embedding generation. Update `data-sources/ai-search/skillset.json` by replacing the `{{AZURE_OPENAI_ENDPOINT}}` and `{{COGNITIVE_SERVICES_KEY}}` placeholders, then:

```bash
export AZURE_OPENAI_KEY="<your-openai-key>"

curl -X PUT "$AZURE_SEARCH_ENDPOINT/skillsets/healthcare-payor-skillset?api-version=2024-07-01" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_SEARCH_ADMIN_KEY" \
  -d @data-sources/ai-search/skillset.json
```

### 3f — Upload Sample Data

The sample data for AI Search lives in `sample-data/policies/` and `sample-data/providers/`. Upload documents using the AI Search REST indexing API or the Azure portal's **Import data** wizard, pointing to your storage account after completing Step 4.

---

## Step 4: Azure Blob Storage

Blob Storage holds the plan documents, benefits summaries, and prior authorization policy PDFs.

### 4a — Create Storage Account and Upload Documents

The PowerShell deployment script handles everything — account creation, container creation, and document upload:

```powershell
cd data-sources/blob-storage

.\deploy.ps1 `
  -ResourceGroup      "rg-knowledge-iq-demo" `
  -StorageAccountName "sthealthbridgedemo" `
  -Location           "eastus" `
  -ContainerName      "healthcare-docs"
```

> Storage account names must be **globally unique**, 3–24 lowercase alphanumeric characters. Add a unique suffix if `sthealthbridgedemo` is taken (e.g., `sthealthbridge<yourinitials>`).

The script will:
1. Create the storage account (if it doesn't already exist)
2. Disable public blob access
3. Create the `healthcare-docs` container
4. Upload all documents from `sample-data/policies/`, `sample-data/benefits/`, `sample-data/members/`, and `sample-data/claims/`

### 4b — Grant Foundry Access to Storage

```bash
# Get the Foundry project's managed identity from the portal:
# ai.azure.com → proj-healthbridge → Settings → Identity → Object ID

FOUNDRY_MI_OID="<object-id-from-portal>"
STORAGE_RESOURCE_ID=$(az storage account show \
  --name sthealthbridgedemo \
  --resource-group rg-knowledge-iq-demo \
  --query id --output tsv)

az role assignment create \
  --role "Storage Blob Data Reader" \
  --assignee-object-id $FOUNDRY_MI_OID \
  --assignee-principal-type ServicePrincipal \
  --scope $STORAGE_RESOURCE_ID
```

---

## Step 5: Fabric Data Agent

> ⚠️ **Placeholder — config to be provided**
>
> The Fabric Data Agent connection requires a Microsoft Fabric workspace with the Data Agent preview enabled. Full configuration details (workspace ID, lakehouse schema, agent endpoint) will be provided by the project team.
>
> For now, reference `data-sources/fabric-data-agent/connection-config.json` for the connection schema once it is populated.  
> Any demo prompts that target the Fabric Data Agent (Claims analytics, deductible accumulators, PA status) can be skipped until this source is connected — all other demo prompts will function normally.

---

## Step 6: Foundry Project Setup — Connections and Knowledge Base

### 6a — Register Data Source Connections

In the Foundry portal: **ai.azure.com → proj-healthbridge → Settings → Connections → + New connection**

Create these four connections with exactly these names (they are referenced by `agent/knowledge-base-config.json`):

| Connection Name | Type | Points To |
|---|---|---|
| `healthbridge-blob-connection` | Azure Blob Storage | `sthealthbridgedemo` / container `healthcare-docs` |
| `healthbridge-aisearch-connection` | Azure AI Search | `srch-healthbridge-demo` |
| `healthbridge-fabric-connection` | Fabric Data Agent | *(pending — see Step 5)* |
| `healthbridge-mcp-connection` | MCP Server | Container Apps URL from Step 2d |

### 6b — Create the Knowledge Base

1. In Foundry, navigate to **Knowledge bases** → **+ New Knowledge Base**
2. **Name:** `payor-knowledge-base`
3. Click **+ Add data source** for each of the following:

| Data Source Label | Type | Connection | Index / Container / Agent |
|---|---|---|---|
| Plan Documents | Azure Blob Storage | `healthbridge-blob-connection` | Container: `healthcare-docs` |
| Formulary & Drug Coverage | Azure AI Search | `healthbridge-aisearch-connection` | Index: `healthbridge-formulary-index` |
| Provider Directory | Azure AI Search | `healthbridge-aisearch-connection` | Index: `healthbridge-provider-index` |
| Claims & Eligibility | Fabric Data Agent | `healthbridge-fabric-connection` | Agent: `healthbridge-claims-agent` |
| Prior Auth Policies | MCP Server | `healthbridge-mcp-connection` | *(MCP endpoint URL)* |

4. Set retrieval settings:
   - **Search mode:** Hybrid (keyword + vector)
   - **Semantic ranking:** Enabled
   - **Top-K:** 5
   - **Minimum reranker score:** 0.5
   - **Query rewrite:** On
5. **Embedding model:** `text-embedding-3-small`
6. Click **Save and index** — initial indexing for Blob and AI Search takes 5–15 minutes

---

## Step 7: Agent Deployment

### 7a — Create the Agent

1. In Foundry, navigate to **Agents** → **+ New Agent**
2. **Name:** `healthbridge-assistant`
3. **Base model:** `gpt-4o` (deploy via **Deployments** if not already available)
4. Paste the contents of `agent/system-prompt.md` into the **System prompt** field
   - Alternatively, use `agent/system-prompt-portal.txt` for the pre-formatted plain-text version
5. Under **Knowledge**, click **+ Add knowledge source** → select `payor-knowledge-base`
6. Configure tool access:
   - ✅ Knowledge Base retrieval
   - ✅ MCP tools (`lookup_member`, `lookup_claim`, `check_benefits`)
   - ✅ Fabric Data Agent queries *(enable once Fabric is connected)*
7. **Temperature:** `0.1` — critical for guardrail reliability
8. Click **Save**

The agent ID will be written to `agent/agent-id.txt` if you used the CLI to create it; otherwise note the ID from the portal.

### 7b — Validate the Agent

Open the **Playground** tab in the agent editor. Run these quick-validation prompts in order:

```
Is Dr. Patricia Chen an in-network provider?
```
→ Should return provider details from `ai-search-providers`.

```
What is the specialist copay on the HealthBridge PPO Gold plan?
```
→ Should cite the `blob-storage-plan-documents` source.

```
Is Ozempic covered on my formulary?
```
→ Should return formulary tier data from `ai-search-formulary`.

For the complete 15-prompt test sequence, see `agent/sample-prompts.md`.

---

## Verification Checklist

Before the demo, confirm each item:

- [ ] MCP server starts with `npm start` and `node test-tools.mjs` passes all assertions
- [ ] AI Search indexes `healthbridge-formulary-index` and `healthbridge-provider-index` show document counts > 0 in the portal
- [ ] Blob container `healthcare-docs` contains documents (check Azure portal → Storage browser)
- [ ] All three Foundry connections show **Connected** status (green) in Settings → Connections
- [ ] Knowledge Base shows **Indexed** status for Blob and AI Search sources
- [ ] Agent playground responds to the three validation prompts above with cited sources
- [ ] Citations panel is visible and shows source names per response

---

## Teardown

To remove all Azure resources after the demo:

```bash
az group delete \
  --name rg-knowledge-iq-demo \
  --yes --no-wait
```

Then manually delete from the Foundry portal:
- Knowledge Base `payor-knowledge-base`
- Agent `healthbridge-assistant`
- All four data source connections

---

## Reference

| Artifact | Path |
|---|---|
| MCP server | `data-sources/mcp-server/` |
| MCP test script | `data-sources/mcp-server/test-tools.mjs` |
| AI Search index schema | `data-sources/ai-search/index-schema.json` |
| AI Search skillset | `data-sources/ai-search/skillset.json` |
| Blob storage deploy script | `data-sources/blob-storage/deploy.ps1` |
| Fabric Data Agent config | `data-sources/fabric-data-agent/connection-config.json` |
| Knowledge Base config | `agent/knowledge-base-config.json` |
| Agent system prompt | `agent/system-prompt.md` |
| Sample test prompts | `agent/sample-prompts.md` |
| Azure provisioning detail | `docs/azure-setup.md` |

---

*Setup Guide version: 1.0 | Created: 2026-06-05 | New Azure AI Foundry (ai.azure.com) only*
