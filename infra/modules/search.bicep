// Azure AI Search — used by AzureSearchService for full-text search across
// applications, notes, and interview content.
//
// SKU: Free tier (50MB storage, 3 indexes, 1 replica, 1 partition). The Free SKU
// is enough for a single-user demo; if this graduated to multiple real users we'd
// need Basic for replication and higher capacity. Free tier cannot be upgraded in
// place — the only path to Basic is delete + recreate, which is fine since the
// SearchIndexInitializer rebuilds the index from Postgres on boot.

@description('Region for the search service. Must be one of the regions Azure AI Search supports.')
param location string

@description('Search service name. 2-60 chars, lowercase + hyphens, globally unique.')
param searchName string

resource search 'Microsoft.Search/searchServices@2024-03-01-preview' = {
  name: searchName
  location: location
  sku: {
    name: 'free'
  }
  properties: {
    replicaCount: 1
    partitionCount: 1
    hostingMode: 'default'
    publicNetworkAccess: 'enabled'
    // Free tier does not support encryption-with-customer-key or private endpoints,
    // so we accept the default (Microsoft-managed key, public endpoint with admin-key auth).
  }
}

@description('Public search endpoint URL.')
output searchEndpoint string = 'https://${search.name}.search.windows.net'

@description('Search service resource name. Used by az CLI to fetch the admin key.')
output searchName string = search.name
