@description('Azure region for deployment')
param location string

@description('Name of the Azure AI Search service')
param searchServiceName string

@description('Resource tags')
param tags object

@description('SKU for the AI Search service (Basic supports semantic ranker preview)')
param sku string = 'basic'

resource searchService 'Microsoft.Search/searchServices@2024-06-01-preview' = {
  name: searchServiceName
  location: location
  tags: tags
  sku: {
    name: sku
  }
  properties: {
    replicaCount: 1
    partitionCount: 1
    publicNetworkAccess: 'enabled'
    semanticSearch: 'free'
  }
}

@description('AI Search service endpoint')
output endpoint string = 'https://${searchService.name}.search.windows.net'

@description('AI Search service resource ID')
output resourceId string = searchService.id

@description('AI Search service name')
output name string = searchService.name
