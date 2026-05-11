// Infrastructure-as-code root file for the Job Application Tracker Azure stack.
//
// Composes four modules into the complete production environment:
//   - storage:        Blob Storage for uploaded documents (Phase 2)
//   - observability:  Log Analytics + Application Insights (Phase 3)
//   - redis:          Cache for Redis (Phase 4)
//   - search:         Azure AI Search (Phase 5)
//
// What this does NOT cover:
//   - Render web service / Render Postgres / Vercel frontend  — those live outside Azure
//   - Secrets and access keys                                 — provisioned by the resources
//     but never extracted in Bicep. Fetch them with `az` CLI after deployment and set them
//     as env vars on Render manually (or via the CI/CD workflow once that exists).
//   - Resource group itself                                   — pre-existing,
//                                                               since deployment is scoped to it.
//
// Run with:
//   az deployment group create \
//     --resource-group rg-jobtracker-prod \
//     --template-file infra/main.bicep \
//     --parameters infra/main.bicepparam
//
// Preview without applying:
//   az deployment group what-if --resource-group rg-jobtracker-prod \
//     --template-file infra/main.bicep --parameters infra/main.bicepparam

targetScope = 'resourceGroup'

@description('Region for all resources. Sweden Central matches the existing manual deployment.')
param location string

@description('Globally unique storage account name (3-24 chars, lowercase + digits).')
param storageAccountName string

@description('Redis cache name (globally unique).')
param redisName string

@description('Azure AI Search service name (globally unique).')
param searchName string

@description('Log Analytics workspace name.')
param logAnalyticsWorkspaceName string

@description('Application Insights component name.')
param appInsightsName string

module storage 'modules/storage.bicep' = {
  name: 'storage-deployment'
  params: {
    location: location
    storageAccountName: storageAccountName
  }
}

module observability 'modules/observability.bicep' = {
  name: 'observability-deployment'
  params: {
    location: location
    workspaceName: logAnalyticsWorkspaceName
    appInsightsName: appInsightsName
  }
}

module redis 'modules/redis.bicep' = {
  name: 'redis-deployment'
  params: {
    location: location
    redisName: redisName
  }
}

module search 'modules/search.bicep' = {
  name: 'search-deployment'
  params: {
    location: location
    searchName: searchName
  }
}

// Outputs surface the discoverable values needed to configure the app on Render.
// Secrets (access keys, connection strings with embedded keys) are NOT exposed here —
// fetch them with `az` after deployment so they don't end up in ARM deployment history.

output storageAccountName string = storage.outputs.storageAccountName
output blobContainerName string = storage.outputs.containerName
output blobEndpoint string = storage.outputs.blobEndpoint
output redisHost string = redis.outputs.redisHost
output redisPort int = redis.outputs.redisPort
output searchEndpoint string = search.outputs.searchEndpoint
output appInsightsName string = observability.outputs.appInsightsName
