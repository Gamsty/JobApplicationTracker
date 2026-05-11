// Azure Blob Storage for the Job Application Tracker.
//
// Layout: one Storage Account (Standard LRS — lowest cost, single-region durability)
// with one private container "documents" where uploaded files live. The application
// authenticates with the account's primary access key (Azure for Students blocks
// service-principal creation in the UiO tenant, so RBAC isn't an option here).
//
// Hardening:
//   - allowBlobPublicAccess: false           — no anonymous reads, ever
//   - publicNetworkAccess: Enabled + Allow   — public endpoint, ACLed by access key
//                                              (Private Link would require Standard tier)
//   - minimumTlsVersion: TLS1_2              — TLS 1.0/1.1 rejected
//   - supportsHttpsTrafficOnly: true         — HTTP requests rejected outright

@description('Region for the storage account. Should match the rest of the stack for low latency.')
param location string

@description('Storage account name. 3-24 chars, globally unique, lowercase + numbers only.')
param storageAccountName string

@description('Name of the private blob container for uploaded documents.')
param containerName string = 'documents'

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
    encryption: {
      services: {
        blob: {
          enabled: true
          keyType: 'Account'
        }
        file: {
          enabled: true
          keyType: 'Account'
        }
      }
      keySource: 'Microsoft.Storage'
    }
  }
}

// Blob service settings live as a child of the storage account.
// We need this resource as the parent of the container below.
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: false
    }
  }
}

resource documentsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: containerName
  properties: {
    publicAccess: 'None'
  }
}

@description('Storage account resource name. Used by the app to build the connection string.')
output storageAccountName string = storageAccount.name

@description('Primary blob endpoint URL.')
output blobEndpoint string = storageAccount.properties.primaryEndpoints.blob

@description('Container name for uploaded documents.')
output containerName string = documentsContainer.name
