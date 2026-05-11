// Parameter file for the prod environment. Matches the names used by the existing manual
// deployment so `what-if` reports "no changes" — proves the Bicep is faithful to reality.
//
// To target a different environment (dev, staging), copy this file as `main.dev.bicepparam`,
// give every resource a different name (Storage Account + Search are globally unique),
// and run the deployment against a separate resource group.

using './main.bicep'

param location = 'swedencentral'

// Storage Account names are 3-24 chars, lowercase + digits only, globally unique.
param storageAccountName = 'stjobtrackeradrian'

// Redis cache name. Globally unique within Azure.
param redisName = 'redis-jobtracker-prod'

// Azure AI Search service name. Globally unique. 2-60 chars, lowercase + hyphens.
param searchName = 'srch-jobtracker-prod'

// Log Analytics + Application Insights. Resource-group-scoped, so names just need
// to be unique within the resource group.
param logAnalyticsWorkspaceName = 'law-jobtracker-prod'
param appInsightsName = 'appi-jobtracker-prod'
