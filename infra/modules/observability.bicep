// Observability stack: Log Analytics Workspace + Application Insights.
//
// Architecture: Application Insights ingests telemetry from the Java agent attached
// in the Render Docker image, then forwards it into Log Analytics for storage and
// querying. Workspace-based Application Insights (the only mode supported on new
// resources since 2024) requires the workspace to exist first, hence two resources.
//
// Cost controls:
//   - Log Analytics: PerGB2018 pricing tier with a 30-day retention default
//   - Daily quota: not set here — the workload generates far less than the free
//     5GB/month included in Pay-As-You-Go, and capping it would block legitimate
//     incident-day telemetry. Add a quota later if costs creep up.

@description('Region for the observability resources. Should match the rest of the stack.')
param location string

@description('Log Analytics Workspace name.')
param workspaceName string

@description('Application Insights component name.')
param appInsightsName string

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: workspaceName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    // Workspace-based mode — telemetry data lives in the Log Analytics Workspace,
    // not in a legacy classic-mode store. This is the only supported mode for new
    // App Insights resources today.
    WorkspaceResourceId: logAnalyticsWorkspace.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

@description('Application Insights connection string. Pass to the Java agent via APPLICATIONINSIGHTS_CONNECTION_STRING.')
output appInsightsConnectionString string = appInsights.properties.ConnectionString

@description('Application Insights resource name. Used for setting up alerts referencing this component.')
output appInsightsName string = appInsights.name

@description('Log Analytics Workspace resource ID.')
output workspaceId string = logAnalyticsWorkspace.id
