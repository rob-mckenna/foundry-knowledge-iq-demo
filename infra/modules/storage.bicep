@description('Azure region for deployment')
param location string

@description('Base name for the storage account (will have unique suffix appended)')
param storageAccountName string

@description('Name of the blob container for healthcare documents')
param containerName string = 'healthcare-docs'

@description('Resource tags')
param tags object

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  tags: tags
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storageAccount
  name: 'default'
}

resource healthcareDocsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: containerName
  properties: {
    publicAccess: 'None'
  }
}

@description('Storage account resource ID')
output resourceId string = storageAccount.id

@description('Storage account name')
output name string = storageAccount.name

@description('Blob service endpoint')
output blobEndpoint string = storageAccount.properties.primaryEndpoints.blob

@description('Healthcare docs container name')
output containerName string = healthcareDocsContainer.name
