@description('Azure region for deployment')
param location string

@description('Name for the Container Registry (will have unique suffix appended)')
param registryName string

@description('Resource tags')
param tags object

@description('SKU for the Container Registry')
param sku string = 'Basic'

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: registryName
  location: location
  tags: tags
  sku: {
    name: sku
  }
  properties: {
    adminUserEnabled: true
    publicNetworkAccess: 'Enabled'
  }
}

@description('Container Registry login server')
output loginServer string = containerRegistry.properties.loginServer

@description('Container Registry resource ID')
output resourceId string = containerRegistry.id

@description('Container Registry name')
output name string = containerRegistry.name
