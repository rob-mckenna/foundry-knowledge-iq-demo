# Foundry Connection Status — proj-healthbridge

**Last verified:** 2026-07-09T01:23:27Z  
**Verified by:** Data (Issue #2 + #3)  
**Verification method:** `az rest GET .../connections?api-version=2025-04-01-preview`

## Connection Readiness Matrix

| Connection Name | Category | Auth | Target | Status |
|---|---|---|---|---|
| `healthbridge-mcp-connection` | RemoteTool | None | `https://ca-mcp-healthbridge.lemoncoast-f3f8df5d.eastus.azurecontainerapps.io/mcp` | ✅ Connected |
| `healthbridge-blob-connection` | AzureStorageAccount | AAD (Managed Identity) | `https://sthealthbridgedemo2agib7.blob.core.windows.net/` | ✅ Connected |
| `healthbridge-aisearch-connection` | CognitiveSearch | ApiKey | `https://srch-healthbridge-demo.search.windows.net` | ✅ Connected |
| `healthbridge-fabric-connection` | FabricDataAgent | — | — | ❌ Not created — blocked |

## Fabric Blocker

`healthbridge-fabric-connection` cannot be created until the following external prerequisites are met:
1. A Microsoft Fabric workspace is provisioned and the workspace GUID is available.
2. A Fabric Data Agent named `healthbridge-claims-agent` is configured within that workspace.
3. The Foundry project managed identity is granted access to the Fabric workspace.

**Impact:** The Knowledge Base (`payor-knowledge-base`) operates with the four available sources. The `fabric-data-agent-claims` data source in `agent/knowledge-base-config.json` will remain inert until the Fabric prerequisites are fulfilled. See `data-sources/fabric-data-agent/README.md` for setup instructions.

## Config Alignment

All three active connection names match `agent/knowledge-base-config.json` exactly — no config edits required.

| Config Reference | Live Connection | Match |
|---|---|---|
| `healthbridge-blob-connection` | `healthbridge-blob-connection` | ✅ |
| `healthbridge-aisearch-connection` | `healthbridge-aisearch-connection` | ✅ |
| `healthbridge-mcp-connection` | `healthbridge-mcp-connection` | ✅ |
| `healthbridge-fabric-connection` | *(absent)* | ❌ blocked |

---

## Knowledge Base Status (Issue #3)

**Knowledge Base:** `payor-knowledge-base` on `srch-healthbridge-demo`  
**Created:** 2026-07-09T01:23:27Z  
**API version:** 2026-05-01-preview  
**MCP endpoint (for agent wiring):** `https://srch-healthbridge-demo.search.windows.net/knowledgebases/payor-knowledge-base/mcp?api-version=2026-05-01-preview`

### Knowledge Sources Wired

| Knowledge Source Name | Kind | Backing Data | Docs | Status |
|---|---|---|---|---|
| `healthcare-payor-docs-source` | searchIndex | `healthcare-payor-docs` index | 45 | ✅ Live |
| `healthbridge-formulary-source` | searchIndex | `healthbridge-formulary-index` | 10 | ✅ Live |
| `healthbridge-provider-source` | searchIndex | `healthbridge-provider-index` | 7 | ✅ Live |
| `mcp-prior-auth-source` | mcpServer | `ca-mcp-healthbridge` Container App | live | ✅ Live |
| `healthbridge-blob-connection` | azureBlob | `healthcare-docs` blob container | 0* | ⚠️ Index empty |
| *(future)* Fabric Data Agent | fabricDataAgent | `healthbridge-claims-agent` | — | ❌ Blocked |

> *`healthbridge-blob-connection-index` has 0 documents because the blob knowledge source was configured with an incorrect OpenAI endpoint during creation. The pre-populated `healthcare-payor-docs-source` covers the same 45 plan documents until this is fixed. See **Tech Debt** below.

### KB Configuration

| Property | Value |
|---|---|
| outputMode | `answerSynthesis` |
| retrievalReasoningEffort | `low` |
| Model | `gpt-4o` on `foundry-healthbridge-demo.openai.azure.com` |
| Model endpoint (correct) | `https://healthbridge-demo.openai.azure.com/` *(Foundry AIServices account OpenAI endpoint)* |
| Model auth | Managed identity (system-assigned) |

### RBAC Assigned for KB Answer Synthesis

| Role | Principal | Resource | Status |
|---|---|---|---|
| Cognitive Services User | Search service MI (`srch-healthbridge-demo`) | `foundry-healthbridge-demo` | ✅ Assigned |
| Cognitive Services OpenAI User | Search service MI (`srch-healthbridge-demo`) | `foundry-healthbridge-demo` | ✅ Assigned |

### Smoke Test Result (2026-07-09)

| Test | Source | Status |
|---|---|---|
| Formulary tier query — `answerSynthesis` | `healthbridge-formulary-source` | ✅ PASSED |
| Direct search index query | `healthbridge-formulary-index` | ✅ PASSED |
| Extractive retrieve (GA API) | `healthbridge-formulary-source` | ✅ PASSED |
| MCP server health | `ca-mcp-healthbridge` | ✅ PASSED (`status=ok`) |

> Note: `answerSynthesis` passed after RBAC propagation (~15 min) for `Cognitive Services User` and `Cognitive Services OpenAI User` roles on `foundry-healthbridge-demo`.

The `healthbridge-blob-connection` knowledge source (azureBlob kind) was previously created with an incorrect embedding model endpoint (`https://healthbridge-demo.openai.azure.com` vs the correct `https://foundry-healthbridge-demo.openai.azure.com`). Its auto-generated index (`healthbridge-blob-connection-index`) is empty as a result.

**Fix:** Delete and recreate the `healthbridge-blob-connection` knowledge source with the correct `resourceUri = "https://foundry-healthbridge-demo.openai.azure.com/"` in `ingestionParameters.embeddingModel.azureOpenAIParameters`. Until fixed, `healthcare-payor-docs-source` (the pre-populated `healthcare-payor-docs` index, 45 docs) serves the same content.

## Verification Commands

```powershell
# List Foundry connections
$PROJECT_ID = "/subscriptions/c81fda52-936e-4f14-8af4-951c0dbb92d2/resourceGroups/rg-knowledge-iq-demo/providers/Microsoft.CognitiveServices/accounts/foundry-healthbridge-demo/projects/proj-healthbridge"
az rest --method GET --url "https://management.azure.com${PROJECT_ID}/connections?api-version=2025-04-01-preview"

# List knowledge sources on AI Search
$SEARCH_KEY = az search admin-key show --service-name srch-healthbridge-demo --resource-group rg-knowledge-iq-demo --query primaryKey -o tsv
Invoke-RestMethod -Uri "https://srch-healthbridge-demo.search.windows.net/knowledgesources?api-version=2026-05-01-preview" -Headers @{"api-key"=$SEARCH_KEY} | Select-Object -ExpandProperty value | Select-Object name, kind

# Get KB definition
Invoke-RestMethod -Uri "https://srch-healthbridge-demo.search.windows.net/knowledgebases/payor-knowledge-base?api-version=2026-05-01-preview" -Headers @{"api-key"=$SEARCH_KEY}
```
