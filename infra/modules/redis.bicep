// Azure Cache for Redis — used by Spring Cache for the dashboard summary endpoints
// and by RateLimitFilter for the auth brute-force protection (INCR/EXPIRE keys).
//
// SKU: Basic C0 (250MB, single node, no replication, ~$16/mo after student credit).
// That's enough for both use cases — caches are small and rate-limit keys are tiny.
// Production-grade would want Standard SKU for replication, but the data here is
// either ephemeral (cache) or recoverable (rate-limit counters reset on TTL anyway).
//
// Hardening:
//   - enableNonSslPort: false      — only port 6380 (TLS) accepts connections
//   - minimumTlsVersion: '1.2'     — TLS 1.0/1.1 rejected
//   - publicNetworkAccess: Enabled — public endpoint, ACLed by primary access key.
//                                    (Private Link requires Premium SKU.)

@description('Region for the Redis cache. Should match the rest of the stack for low latency.')
param location string

@description('Redis cache name. Must be globally unique. Lowercase, hyphens allowed.')
param redisName string

resource redis 'Microsoft.Cache/Redis@2023-08-01' = {
  name: redisName
  location: location
  properties: {
    sku: {
      name: 'Basic'
      family: 'C'
      capacity: 0  // C0 — 250MB tier
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
    redisConfiguration: {
      // Defaults are fine for this workload. Setting an explicit empty object here would
      // override the service-default eviction policy, so we leave it omitted.
    }
  }
}

@description('Fully qualified Redis hostname for client connection.')
output redisHost string = redis.properties.hostName

@description('Redis SSL port (always 6380 on Basic/Standard SKUs).')
output redisPort int = redis.properties.sslPort
