@description('Azure region for deployment')
param location string

@description('Name of the Azure AI Services (OpenAI) account')
param accountName string

@description('Resource tags')
param tags object

@description('Name of the text embedding deployment')
param embeddingDeploymentName string = 'text-embedding-3-small'

@description('Capacity in thousands of tokens per minute (TPM) for the embedding deployment')
param embeddingCapacityK int = 30

resource aiServices 'Microsoft.CognitiveServices/accounts@2024-10-01' = {
  name: accountName
  location: location
  tags: tags
  kind: 'OpenAI'
  sku: {
    name: 'S0'
  }
  properties: {
    publicNetworkAccess: 'Enabled'
    customSubDomainName: accountName
  }
}

resource embeddingDeployment 'Microsoft.CognitiveServices/accounts/deployments@2024-10-01' = {
  parent: aiServices
  name: embeddingDeploymentName
  sku: {
    name: 'Standard'
    capacity: embeddingCapacityK
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'text-embedding-3-small'
      version: '1'
    }
  }
}

@description('Azure OpenAI account endpoint')
output endpoint string = aiServices.properties.endpoint

@description('Azure OpenAI account resource ID')
output resourceId string = aiServices.id

@description('Embedding deployment name')
output embeddingDeploymentName string = embeddingDeployment.name
