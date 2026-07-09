# Foundry Connection Status — proj-healthbridge

**Last verified:** 2026-07-09T01:10:13Z  
**Verified by:** Data (Issue #2)  
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

**Impact:** The Knowledge Base (`healthbridge-knowledge-base`) will function with the three available connections. The `fabric-data-agent-claims` data source in `agent/knowledge-base-config.json` will remain inert until the Fabric prerequisites are fulfilled. See `data-sources/fabric-data-agent/README.md` for setup instructions.

## Config Alignment

All three active connection names match `agent/knowledge-base-config.json` exactly — no config edits required.

| Config Reference | Live Connection | Match |
|---|---|---|
| `healthbridge-blob-connection` | `healthbridge-blob-connection` | ✅ |
| `healthbridge-aisearch-connection` | `healthbridge-aisearch-connection` | ✅ |
| `healthbridge-mcp-connection` | `healthbridge-mcp-connection` | ✅ |
| `healthbridge-fabric-connection` | *(absent)* | ❌ blocked |

## Verification Command

```powershell
$PROJECT_ID = "/subscriptions/c81fda52-936e-4f14-8af4-951c0dbb92d2/resourceGroups/rg-knowledge-iq-demo/providers/Microsoft.CognitiveServices/accounts/foundry-healthbridge-demo/projects/proj-healthbridge"
az rest --method GET `
  --url "https://management.azure.com${PROJECT_ID}/connections?api-version=2025-04-01-preview"
```
