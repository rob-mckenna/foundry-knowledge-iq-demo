using 'main.bicep'

param location = 'eastus'

param aiServicesName = 'oai-healthbridge-demo'

param searchServiceName = 'srch-healthbridge-demo'

// Storage account and ACR base names — a 6-char uniqueString suffix is appended at deploy time
param storageAccountBaseName = 'sthealthbridgedemo'

param registryBaseName = 'crhealthbridgedemo'

param tags = {
  project: 'knowledge-iq-demo'
  environment: 'demo'
}
