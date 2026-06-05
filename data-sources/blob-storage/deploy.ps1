#!/usr/bin/env pwsh
# deploy.ps1 — Creates Azure Blob Storage account and uploads healthcare payor sample docs
# Usage: .\deploy.ps1 -ResourceGroup <rg> -Location <loc> -StorageAccountName <name>

param(
    [Parameter(Mandatory)][string]$ResourceGroup,
    [Parameter(Mandatory)][string]$StorageAccountName,
    [string]$Location = "eastus",
    [string]$ContainerName = "healthcare-docs",
    [string]$SampleDataPath = "..\..\sample-data"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "==> Creating resource group '$ResourceGroup' in '$Location'..." -ForegroundColor Cyan
az group create --name $ResourceGroup --location $Location --output none

Write-Host "==> Creating storage account '$StorageAccountName'..." -ForegroundColor Cyan
az storage account create `
    --name $StorageAccountName `
    --resource-group $ResourceGroup `
    --location $Location `
    --sku Standard_LRS `
    --kind StorageV2 `
    --enable-hierarchical-namespace false `
    --allow-blob-public-access false `
    --output none

Write-Host "==> Retrieving connection string..." -ForegroundColor Cyan
$connectionString = az storage account show-connection-string `
    --name $StorageAccountName `
    --resource-group $ResourceGroup `
    --query connectionString `
    --output tsv

Write-Host "==> Creating blob container '$ContainerName'..." -ForegroundColor Cyan
az storage container create `
    --name $ContainerName `
    --connection-string $connectionString `
    --output none

# Upload all sample document subdirectories as virtual folders
$folders = @("policies", "benefits", "members", "claims", "providers", "formulary")
foreach ($folder in $folders) {
    $folderPath = Join-Path $SampleDataPath $folder
    if (Test-Path $folderPath) {
        Write-Host "==> Uploading $folder documents..." -ForegroundColor Cyan
        az storage blob upload-batch `
            --source $folderPath `
            --destination "$ContainerName/$folder" `
            --connection-string $connectionString `
            --overwrite `
            --output none
        Write-Host "    Uploaded: $folderPath -> $ContainerName/$folder" -ForegroundColor Green
    } else {
        Write-Warning "    Skipped: $folderPath not found"
    }
}

Write-Host ""
Write-Host "==> Done! Storage account details:" -ForegroundColor Green
Write-Host "    Account : $StorageAccountName"
Write-Host "    Container: $ContainerName"
Write-Host "    Resource Group: $ResourceGroup"
Write-Host ""
Write-Host "Next step: Add this storage account as a Foundry Knowledge Base data source." -ForegroundColor Yellow
Write-Host "See README.md for connection instructions."
