# Azure AI Search — Healthcare Payor Indexes

Configures Azure AI Search indexes for the HealthBridge Knowledge Base. Three indexes are defined: a general documents index (policies, clinical guidelines, prior auth) plus dedicated indexes for formulary and provider directory that match the Foundry Knowledge Base config.

## Prerequisites

- Azure AI Search resource (Basic tier or above for semantic search)
- Azure OpenAI resource with `text-embedding-3-small` deployment
- Azure CLI installed and logged in (`az login`)

## Files

| File | Index Name | Purpose |
|------|-----------|---------|
| `index-schema.json` | `healthcare-payor-docs` | General docs: policies, guidelines, prior auth, SBCs |
| `formulary-index-schema.json` | `healthbridge-formulary-index` | Formulary drugs: tiers, PA flags, step therapy, QLL |
| `provider-index-schema.json` | `healthbridge-provider-index` | Provider directory: NPI, specialty, network, locations |
| `skillset.json` | — | Cognitive skillset: split → key phrases → entities → embed |

## Setup

### 1 — Set environment variables

```bash
export AZURE_SEARCH_ENDPOINT="https://<your-search-service>.search.windows.net"
export AZURE_SEARCH_ADMIN_KEY="<your-admin-key>"
export AZURE_OPENAI_ENDPOINT="https://<your-openai>.openai.azure.com/"
export AZURE_OPENAI_KEY="<your-openai-key>"
export COGNITIVE_SERVICES_KEY="<your-cognitive-services-key>"
```

### 2 — Create all three indexes

```bash
# General documents index (policies, guidelines, prior auth)
curl -X PUT "$AZURE_SEARCH_ENDPOINT/indexes/healthcare-payor-docs?api-version=2024-07-01" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_SEARCH_ADMIN_KEY" \
  -d @index-schema.json

# Formulary index
curl -X PUT "$AZURE_SEARCH_ENDPOINT/indexes/healthbridge-formulary-index?api-version=2024-07-01" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_SEARCH_ADMIN_KEY" \
  -d @formulary-index-schema.json

# Provider directory index
curl -X PUT "$AZURE_SEARCH_ENDPOINT/indexes/healthbridge-provider-index?api-version=2024-07-01" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_SEARCH_ADMIN_KEY" \
  -d @provider-index-schema.json
```

### 3 — Create the skillset

Replace `${AZURE_OPENAI_ENDPOINT}`, `${AZURE_OPENAI_KEY}`, and `${COGNITIVE_SERVICES_KEY}` in `skillset.json` with your actual values, then:

```bash
curl -X PUT "$AZURE_SEARCH_ENDPOINT/skillsets/healthcare-payor-skillset?api-version=2024-07-01" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_SEARCH_ADMIN_KEY" \
  -d @skillset.json
```

### 4 — Create an indexer for the documents index (Blob Storage source)

```bash
curl -X POST "$AZURE_SEARCH_ENDPOINT/indexers?api-version=2024-07-01" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_SEARCH_ADMIN_KEY" \
  -d '{
    "name": "healthcare-payor-indexer",
    "dataSourceName": "healthcare-docs-blob",
    "targetIndexName": "healthcare-payor-docs",
    "skillsetName": "healthcare-payor-skillset",
    "schedule": { "interval": "PT12H" }
  }'
```

### 5 — Upload formulary and provider data (push API)

The formulary and provider indexes are populated via the push API from `sample-data/formulary/` and `sample-data/providers/`. See `data-sources/blob-storage/deploy.ps1` — it uploads a batch document to AI Search using the Upload Documents API after the index is created.

```bash
# Example: push formulary documents
curl -X POST "$AZURE_SEARCH_ENDPOINT/indexes/healthbridge-formulary-index/docs/index?api-version=2024-07-01" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_SEARCH_ADMIN_KEY" \
  -d '{ "value": [ ... ] }'
```

### 6 — Connect to Foundry Knowledge Base

1. Open **Azure AI Foundry** → your project → **Knowledge bases**
2. Click **+ Add data source** → **Azure AI Search**
3. For formulary: select `healthbridge-formulary-index`, set the semantic config to `formulary-semantic-config`
4. For providers: select `healthbridge-provider-index`, set the semantic config to `provider-semantic-config`

## Index Fields Quick Reference

### `healthcare-payor-docs` (documents)

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (key) | Unique document chunk ID |
| `title` | String | Document title, full-text searchable |
| `content` | String | Document body, full-text + vector searchable |
| `category` | String | Filterable/facetable category |
| `member_id` | String | Filterable member reference |
| `date` | DateTimeOffset | Document date, sortable |
| `metadata/*` | Complex | Source system, doc type, plan code, ICD codes |
| `content_vector` | Collection(Single) | 1536-dim embeddings (text-embedding-3-small) |

### `healthbridge-formulary-index`

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (key) | Drug identifier |
| `drugName` | String | Brand name, searchable |
| `genericName` | String | Generic name, searchable |
| `tier` | String | Formulary tier (1–4, Specialty) |
| `requiresPriorAuth` | Boolean | Filterable PA flag |
| `stepTherapyRequired` | Boolean | Step therapy flag |
| `quantityLimit` | String | QLL description |
| `specialtyPharmacy` | Boolean | Specialty pharmacy required |
| `formularyNotes` | String | Free-text notes |
| `therapeuticClass` | String | Drug class, facetable |
| `NDC` | String | National Drug Code |
| `contentVector` | Collection(Single) | 1536-dim embeddings |

### `healthbridge-provider-index`

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (key) | Provider identifier |
| `providerName` | String | Full name, searchable |
| `npi` | String | NPI number, filterable |
| `specialty` | String | Primary specialty, facetable |
| `networkStatus` | String | in-network / out-of-network |
| `acceptingNewPatients` | Boolean | Filterable flag |
| `locations` | Complex[] | Address, city, state, zip, phone |
| `phoneNumber` | String | Direct contact |
| `hospitalAffiliations` | String[] | Hospital names |
| `languages` | String[] | Languages spoken |
| `boardCertifications` | String[] | Board cert details |
| `qualityTier` | String | Quality performance tier |
| `contentVector` | Collection(Single) | 1536-dim embeddings |

