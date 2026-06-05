# Azure Provisioning Guide — HealthBridge Knowledge IQ Demo

This guide provisions all Azure resources needed to run the HealthBridge Knowledge Assistant demo end-to-end using the **new Azure AI Foundry** (ai.azure.com). Do not follow Azure AI Studio / classic Foundry documentation — the portal URL, navigation, and API surface are different.

---

## Prerequisites

### Azure Subscription
- Active Azure subscription with **Contributor** or **Owner** role
- Sufficient quota for:
  - Azure OpenAI: `text-embedding-3-small` deployment (at minimum 30K TPM recommended)
  - Azure AI Search: Basic tier or above (Standard tier required for semantic ranking in production)

### Required Resource Providers
Register these if not already enabled on your subscription:

```bash
az provider register --namespace Microsoft.Storage
az provider register --namespace Microsoft.Search
az provider register --namespace Microsoft.CognitiveServices
az provider register --namespace Microsoft.MachineLearningServices
```

### Tools
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) v2.57+
- PowerShell 7+ (for the blob storage deploy script)
- Git (to clone this repo)

### Role Requirements

| Resource | Role Needed |
|---|---|
| Resource Group | Contributor or Owner |
| Azure OpenAI | Cognitive Services OpenAI Contributor |
| Azure AI Search | Search Service Contributor |
| Storage Account | Storage Blob Data Contributor |
| AI Foundry Hub/Project | Azure AI Developer or Owner |

---

## Step 1: Create a Resource Group

All demo resources should live in a single resource group for easy teardown.

```bash
az group create \
  --name rg-knowledge-iq-demo \
  --location eastus \
  --tags project=knowledge-iq-demo environment=demo
```

> **Tip:** Use `eastus` or `eastus2` — Azure AI Foundry and Azure OpenAI have the broadest regional availability there.

---

## Step 2: Create Azure AI Foundry Hub and Project

The new Azure AI Foundry uses a **Hub + Project** model. The hub owns shared connections and compute; the project is your working environment.

### 2a — Create the Hub

```bash
az ml workspace create \
  --name hub-knowledge-iq \
  --resource-group rg-knowledge-iq-demo \
  --location eastus \
  --kind hub
```

### 2b — Create the Project

```bash
az ml workspace create \
  --name proj-healthbridge \
  --resource-group rg-knowledge-iq-demo \
  --location eastus \
  --kind project \
  --hub-id $(az ml workspace show \
      --name hub-knowledge-iq \
      --resource-group rg-knowledge-iq-demo \
      --query id --output tsv)
```

### 2c — Open in the Portal

Navigate to [ai.azure.com](https://ai.azure.com), sign in, and open **proj-healthbridge**. Verify you see the new Foundry UI (left sidebar shows **Agents**, **Knowledge bases**, **Deployments** — not the classic Studio layout).

---

## Step 3: Create Azure AI Search

The Knowledge Base uses AI Search for the formulary and provider directory indexes.

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

> Upgrade to **Standard** tier if you need semantic ranker in production. Basic tier supports semantic ranker as a preview feature.

### 3b — Get the Admin Key

```bash
az search admin-key show \
  --service-name srch-healthbridge-demo \
  --resource-group rg-knowledge-iq-demo \
  --query primaryKey --output tsv
```

### 3c — Create Azure OpenAI (for embeddings)

```bash
az cognitiveservices account create \
  --name oai-healthbridge-demo \
  --resource-group rg-knowledge-iq-demo \
  --location eastus \
  --kind OpenAI \
  --sku S0

# Deploy the embedding model
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

### 3d — Create the Search Indexes

Set environment variables, then apply the index schema from `data-sources/ai-search/`:

```bash
export AZURE_SEARCH_ENDPOINT="https://srch-healthbridge-demo.search.windows.net"
export AZURE_SEARCH_ADMIN_KEY="<key-from-step-3b>"
export AZURE_OPENAI_ENDPOINT="https://oai-healthbridge-demo.openai.azure.com/"

# Formulary index (drug coverage, tiers, quantity limits)
curl -X PUT "$AZURE_SEARCH_ENDPOINT/indexes/healthbridge-formulary-index?api-version=2024-07-01" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_SEARCH_ADMIN_KEY" \
  -d @data-sources/ai-search/index-schema.json

# Provider directory index (physician network, locations, specialties)
curl -X PUT "$AZURE_SEARCH_ENDPOINT/indexes/healthbridge-provider-index?api-version=2024-07-01" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_SEARCH_ADMIN_KEY" \
  -d @data-sources/ai-search/index-schema.json
```

> Both indexes share the same schema structure from `index-schema.json`. The content indexed into each will differ: formulary documents into `healthbridge-formulary-index`, provider records into `healthbridge-provider-index`.

### 3e — Create the Skillset

Replace environment variable placeholders in `data-sources/ai-search/skillset.json`, then:

```bash
export AZURE_OPENAI_KEY="<your-openai-key>"
export COGNITIVE_SERVICES_KEY="<your-cognitive-services-key>"

curl -X PUT "$AZURE_SEARCH_ENDPOINT/skillsets/healthcare-payor-skillset?api-version=2024-07-01" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_SEARCH_ADMIN_KEY" \
  -d @data-sources/ai-search/skillset.json
```

---

## Step 4: Create Storage Account and Upload Sample Data

Use the PowerShell deployment script in `data-sources/blob-storage/`:

```powershell
cd data-sources/blob-storage

.\deploy.ps1 `
  -ResourceGroup     "rg-knowledge-iq-demo" `
  -StorageAccountName "sthealthbridgedemo" `
  -Location          "eastus" `
  -ContainerName     "healthcare-docs"
```

> Storage account names must be globally unique, 3–24 lowercase alphanumeric characters. Substitute a unique suffix (e.g., your initials + a random number).

The script will:
1. Create the resource group if it doesn't already exist
2. Create a `StorageV2` account with public blob access disabled
3. Create the `healthcare-docs` container
4. Upload all sample documents from `sample-data/policies/`, `benefits/`, `members/`, and `claims/`

### Grant Foundry Access to Storage

```bash
# Get the Foundry project's managed identity object ID from the portal:
# AI Foundry → proj-healthbridge → Settings → Identity

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

## Step 5: Register Connections in Foundry and Create the Knowledge Base

### 5a — Register Data Source Connections

In the Foundry portal ([ai.azure.com](https://ai.azure.com) → **proj-healthbridge** → **Settings** → **Connections**), create four connections with exactly these names (they are referenced by `agent/knowledge-base-config.json`):

| Connection Name | Type | Points To |
|---|---|---|
| `healthbridge-blob-connection` | Azure Blob Storage | `sthealthbridgedemo` / `healthcare-docs` |
| `healthbridge-aisearch-connection` | Azure AI Search | `srch-healthbridge-demo` |
| `healthbridge-fabric-connection` | Fabric Data Agent | Your Fabric workspace (see `data-sources/fabric-data-agent/connection-config.json`) |
| `healthbridge-mcp-connection` | MCP Server | MCP endpoint (see `data-sources/mcp-server/README.md`) |

### 5b — Create the Knowledge Base

1. In Foundry, navigate to **Knowledge bases** → **+ New Knowledge Base**
2. Name: `healthbridge-knowledge-base`
3. Add each data source using **+ Add data source**:

   | Data Source | Type | Connection | Index / Container / Agent |
   |---|---|---|---|
   | Plan Documents | Azure Blob Storage | `healthbridge-blob-connection` | Container: `healthcare-docs` |
   | Formulary & Drug Coverage | Azure AI Search | `healthbridge-aisearch-connection` | Index: `healthbridge-formulary-index` |
   | Provider Directory | Azure AI Search | `healthbridge-aisearch-connection` | Index: `healthbridge-provider-index` |
   | Claims & Eligibility | Fabric Data Agent | `healthbridge-fabric-connection` | Agent: `healthbridge-claims-agent` |
   | Prior Auth Policies | MCP Server | `healthbridge-mcp-connection` | URL: see `data-sources/mcp-server/README.md` |

4. Set retrieval: **Hybrid** search, **Semantic ranking** enabled, Top-K = **5**, Minimum reranker score = **0.5**, Query rewrite = **On**
5. Under **Indexing**, select embedding model `text-embedding-3-small`
6. Click **Save and index** — initial indexing for Blob and AI Search takes 5–15 minutes

The full Knowledge Base definition is in `agent/knowledge-base-config.json` for reference.

---

## Step 6: Create the Agent

1. In Foundry, navigate to **Agents** → **+ New Agent**
2. Set **Name**: `healthbridge-assistant`
3. Set **Base model**: `gpt-4o` (deploy one if not already available — see your Foundry **Deployments** page)
4. Paste the contents of `agent/system-prompt.md` into the **System prompt** field
5. Under **Knowledge**, click **+ Add knowledge source** → select `healthbridge-knowledge-base`
6. Configure tool access:
   - ✅ Knowledge Base retrieval
   - ✅ MCP tools (`get_prior_auth_requirements`, `get_clinical_coverage_criteria`)
   - ✅ Fabric Data Agent queries
7. Set **Temperature** to `0.1` (important for guardrail reliability)
8. Click **Save**

---

## Step 7: Test with Sample Prompts

Open the **Playground** tab in the agent editor and run the prompts from `agent/sample-prompts.md`.

### Recommended Demo Sequence

| Order | Prompt # | Category | Primary Data Source |
|---|---|---|---|
| 1 | Prompt 3 | Benefits — OOP max | Blob Storage |
| 2 | Prompt 2 | Benefits — PT coverage | Blob Storage + MCP |
| 3 | Prompt 11 | Formulary — Ozempic | AI Search formulary |
| 4 | Prompt 12 | Formulary — atorvastatin | AI Search formulary |
| 5 | Prompt 8 | Prior auth — MRI knee | MCP Server |
| 6 | Prompt 5 | Claims — recent claim | Fabric Data Agent |
| 7 | Prompt 14 | Provider network — Dr. Patricia Chen | AI Search providers |
| 8 | Guardrail A | Medical advice redirect | (no data source) |

### Tips for Demo Delivery

- Enable **Citations** in the Playground to show which data source each fact came from — this is the key Knowledge IQ talking point
- Use **Trace** view to expose the retrieval steps, reranking scores, and MCP tool calls
- If the Fabric Data Agent is not yet wired up, skip Prompts 5, 6, 7, and 10 and note they require the Fabric integration

---

## Resource Teardown

To remove all resources when done:

```bash
az group delete \
  --name rg-knowledge-iq-demo \
  --yes --no-wait
```

This deletes the resource group and all resources within it. Knowledge Base indexes, connections, and the agent definition inside Foundry must be deleted manually from the portal.

---

## Reference

| Artifact | Location |
|---|---|
| Knowledge Base config | `agent/knowledge-base-config.json` |
| Agent system prompt | `agent/system-prompt.md` |
| Sample test prompts | `agent/sample-prompts.md` |
| Blob storage deploy script | `data-sources/blob-storage/deploy.ps1` |
| AI Search index schema | `data-sources/ai-search/index-schema.json` |
| AI Search skillset | `data-sources/ai-search/skillset.json` |
| Fabric Data Agent config | `data-sources/fabric-data-agent/connection-config.json` |
| MCP Server | `data-sources/mcp-server/` |
| Demo narrative flow | `docs/demo-flow.md` |

---

*Guide version: 1.0 | Created: 2026-06-05 | New Azure AI Foundry (ai.azure.com) only*
