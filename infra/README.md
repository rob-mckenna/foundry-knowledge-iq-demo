# HealthBridge Knowledge IQ Demo — Infrastructure

Bicep infrastructure-as-code for the Knowledge IQ demo. Deploys all Azure supporting resources into resource group `rg-knowledge-iq-demo` (region: `eastus`).

## What's Deployed

| Resource | Name | SKU / Kind |
|---|---|---|
| Resource Group | `rg-knowledge-iq-demo` | — |
| Azure OpenAI (AI Services) | `oai-healthbridge-demo` | S0 / OpenAI |
| Azure AI Search | `srch-healthbridge-demo` | Basic (semantic ranker enabled) |
| Storage Account | `sthealthbridgedemo2agib7` | Standard_LRS / StorageV2 |
| Blob Container | `healthcare-docs` | Private |
| Container Registry | `crhealthbridgedemo2agib7` | Basic |

> **Note:** Azure AI Foundry Hub and Project are **not** created by this Bicep template.
> The `Microsoft.MachineLearningServices/workspaces` resource with `kind=Hub/Project` requires
> additional dependencies (Key Vault, Application Insights) that add complexity to a demo deployment.
> Create the Foundry Hub and Project manually via [https://ai.azure.com](https://ai.azure.com).

## Deployed Endpoints & Values

```
Azure OpenAI endpoint:   https://oai-healthbridge-demo.openai.azure.com/
Embedding deployment:    text-embedding-3-small  (30K TPM)

AI Search endpoint:      https://srch-healthbridge-demo.search.windows.net
AI Search name:          srch-healthbridge-demo

Storage account:         sthealthbridgedemo2agib7
Blob endpoint:           https://sthealthbridgedemo2agib7.blob.core.windows.net/
Blob container:          healthcare-docs

ACR login server:        crhealthbridgedemo2agib7.azurecr.io
ACR name:                crhealthbridgedemo2agib7
```

## Module Structure

```
infra/
  main.bicep              # Orchestrator — calls all modules
  main.bicepparam         # Parameter values
  modules/
    ai-services.bicep     # Azure OpenAI account + text-embedding-3-small deployment
    search.bicep          # Azure AI Search service (Basic, semantic ranker)
    storage.bicep         # Storage account + healthcare-docs blob container
    registry.bicep        # Container Registry (for MCP server container image)
```

## Deploy

```powershell
# From repo root
az account set --subscription c81fda52-936e-4f14-8af4-951c0dbb92d2
az deployment group create `
  --resource-group rg-knowledge-iq-demo `
  --template-file infra/main.bicep `
  --parameters infra/main.bicepparam `
  --query "properties.outputs" `
  --output json
```

## Next Steps After Deploy

1. **Upload sample data to Blob Storage** — run `data-sources/blob-storage/deploy.ps1`
2. **Create AI Search indexes** — follow `data-sources/ai-search/README.md`
3. **Deploy MCP server** — push container image to `crhealthbridgedemo2agib7.azurecr.io`, deploy to Container Apps
4. **Create Foundry Hub + Project** — via [https://ai.azure.com](https://ai.azure.com)
5. **Connect Knowledge Base data sources** — follow `docs/azure-setup.md`

## Tear Down

```powershell
az group delete --name rg-knowledge-iq-demo --yes
```

> ⚠️ This deletes **all** resources including the Foundry Hub/Project if created in this resource group.
