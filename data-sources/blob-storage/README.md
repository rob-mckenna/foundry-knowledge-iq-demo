# Azure Blob Storage — Healthcare Payor Documents

Uploads synthetic healthcare payor documents to Azure Blob Storage for use as an Azure AI Foundry Knowledge Base data source.

## Prerequisites

- Azure CLI installed and logged in (`az login`)
- PowerShell 7+ (cross-platform)
- Contributor access on the target Azure subscription

## Directory Layout Uploaded

```
healthcare-docs/           ← blob container
  policies/                ← coverage and utilization management policies
  benefits/                ← member benefit summaries and SBCs
  members/                 ← member eligibility documents
  claims/                  ← claim adjudication reference docs
```

## Deploy

```powershell
.\deploy.ps1 `
  -ResourceGroup   "rg-knowledge-iq-demo" `
  -StorageAccountName "stknowledgeiq<unique>" `
  -Location        "eastus" `
  -ContainerName   "healthcare-docs"
```

> **Note:** Storage account names must be globally unique, 3–24 lowercase alphanumeric characters.

The script will:
1. Create the resource group (if it doesn't exist)
2. Create a StorageV2 account with public blob access disabled
3. Create the `healthcare-docs` container
4. Upload all documents from `sample-data/policies/`, `benefits/`, `members/`, and `claims/`

## Connect to Foundry Knowledge Base

1. Open **Azure AI Foundry** → your project → **Knowledge bases**
2. Click **+ Add data source** → **Azure Blob Storage**
3. Select the storage account and container `healthcare-docs`
4. Choose **Auto-detect document type** or set to **Markdown / Plain text**
5. Set the index schedule (recommended: daily)
6. Foundry will automatically crack and chunk the documents

## Required Permissions for Foundry

Grant the Foundry managed identity the **Storage Blob Data Reader** role:

```bash
az role assignment create \
  --role "Storage Blob Data Reader" \
  --assignee "<foundry-managed-identity-object-id>" \
  --scope "/subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/<account>"
```
