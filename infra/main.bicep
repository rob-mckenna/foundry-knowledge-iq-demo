/*
  main.bicep — HealthBridge Knowledge IQ Demo Infrastructure
  Deploys all supporting Azure resources for the Knowledge IQ demo.

  NOTE: Azure AI Foundry Hub and Project are NOT created here.
  The Microsoft.MachineLearningServices/workspaces resource with kind=Hub/Project
  requires additional dependencies (Key Vault, Application Insights, Storage Account
  with specific RBAC roles) that add significant complexity to a demo deployment.
  Create the Foundry Hub and Project manually via the Azure AI Foundry portal at
  https://ai.azure.com after this template deploys successfully.
*/

targetScope = 'resourceGroup'

// ---------------------------------------------------------------------------
// Parameters
// ---------------------------------------------------------------------------

@description('Azure region for all resources')
param location string = 'eastus'

@description('Name of the Azure AI Services (OpenAI) account')
param aiServicesName string = 'oai-healthbridge-demo'

@description('Name of the Azure AI Search service')
param searchServiceName string = 'srch-healthbridge-demo'

@description('Base name for the Storage Account — a unique suffix is appended to satisfy global uniqueness')
param storageAccountBaseName string = 'sthealthbridgedemo'

@description('Base name for the Container Registry — a unique suffix is appended to satisfy global uniqueness')
param registryBaseName string = 'crhealthbridgedemo'

@description('Resource tags applied to all resources')
param tags object = {
  project: 'knowledge-iq-demo'
  environment: 'demo'
}

// ---------------------------------------------------------------------------
// Unique suffix — derived from resource group ID so it is stable across re-deploys
// ---------------------------------------------------------------------------

var uniqueSuffix = toLower(take(uniqueString(resourceGroup().id), 6))

// Storage accounts and ACR have strict naming rules (lower-alpha-numeric, ≤24 chars)
var storageAccountName = take('${storageAccountBaseName}${uniqueSuffix}', 24)
var registryName       = take('${registryBaseName}${uniqueSuffix}', 50)

// ---------------------------------------------------------------------------
// Modules
// ---------------------------------------------------------------------------

module aiServices 'modules/ai-services.bicep' = {
  name: 'aiServices'
  params: {
    location: location
    accountName: aiServicesName
    tags: tags
  }
}

module search 'modules/search.bicep' = {
  name: 'search'
  params: {
    location: location
    searchServiceName: searchServiceName
    tags: tags
  }
}

module storage 'modules/storage.bicep' = {
  name: 'storage'
  params: {
    location: location
    storageAccountName: storageAccountName
    containerName: 'healthcare-docs'
    tags: tags
  }
}

module registry 'modules/registry.bicep' = {
  name: 'registry'
  params: {
    location: location
    registryName: registryName
    tags: tags
  }
}

// ---------------------------------------------------------------------------
// Outputs — captured for use in subsequent setup steps
// ---------------------------------------------------------------------------

@description('Azure OpenAI endpoint')
output aiServicesEndpoint string = aiServices.outputs.endpoint

@description('Azure AI Search endpoint')
output searchEndpoint string = search.outputs.endpoint

@description('Azure AI Search service name')
output searchServiceName string = search.outputs.name

@description('Storage account name (with unique suffix)')
output storageAccountName string = storage.outputs.name

@description('Blob storage endpoint')
output blobEndpoint string = storage.outputs.blobEndpoint

@description('Healthcare docs blob container name')
output blobContainerName string = storage.outputs.containerName

@description('Container Registry login server')
output acrLoginServer string = registry.outputs.loginServer

@description('Container Registry name')
output acrName string = registry.outputs.name
