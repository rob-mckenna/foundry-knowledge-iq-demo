# Azure AI Search — Healthcare Payor Index

Configures an AI Search index for healthcare payor documents (policies, clinical guidelines, prior auth criteria, formulary) with vector search and semantic ranking.

## Prerequisites

- Azure AI Search resource (Basic tier or above for semantic search)
- Azure OpenAI resource with `text-embedding-3-small` deployment
- Azure CLI installed and logged in (`az login`)

## Files

| File | Purpose |
|------|---------|
| `index-schema.json` | Index definition with fields, vector profile, and semantic config |
| `skillset.json` | Cognitive skillset for document cracking, enrichment, and embedding |

## Setup

### 1 — Set environment variables

```bash
export AZURE_SEARCH_ENDPOINT="https://<your-search-service>.search.windows.net"
export AZURE_SEARCH_ADMIN_KEY="<your-admin-key>"
export AZURE_OPENAI_ENDPOINT="https://<your-openai>.openai.azure.com/"
export AZURE_OPENAI_KEY="<your-openai-key>"
export COGNITIVE_SERVICES_KEY="<your-cognitive-services-key>"
```

### 2 — Create the index

```bash
curl -X PUT "$AZURE_SEARCH_ENDPOINT/indexes/healthcare-payor-docs?api-version=2024-07-01" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_SEARCH_ADMIN_KEY" \
  -d @index-schema.json
```

### 3 — Create the skillset

Replace `${AZURE_OPENAI_ENDPOINT}`, `${AZURE_OPENAI_KEY}`, and `${COGNITIVE_SERVICES_KEY}` in `skillset.json` with your actual values, then:

```bash
curl -X PUT "$AZURE_SEARCH_ENDPOINT/skillsets/healthcare-payor-skillset?api-version=2024-07-01" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_SEARCH_ADMIN_KEY" \
  -d @skillset.json
```

### 4 — Create an indexer pointing to your Blob Storage

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

### 5 — Connect to Foundry Knowledge Base

1. Open **Azure AI Foundry** → your project → **Knowledge bases**
2. Click **+ Add data source** → **Azure AI Search**
3. Select your search service and choose the `healthcare-payor-docs` index
4. Set the **content field** to `content` and **title field** to `title`
5. Enable **Semantic ranking** and select the `healthcare-semantic` configuration

## Index Fields Quick Reference

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
