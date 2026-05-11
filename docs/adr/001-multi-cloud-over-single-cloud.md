# ADR-001: Multi-cloud over single-cloud

**Status:** Accepted
**Date:** 2026-05-11

## Context

The application needs four kinds of managed services: a place to run the Spring Boot
backend, a relational database, object storage for uploaded documents, and ancillary
services for caching, observability, and search. The default move is to put all of these
in one cloud — fewest accounts, single bill, simplest auth story.

But two real constraints pushed against the default:

1. **Existing Render deployment.** The backend and PostgreSQL were already running on
   Render with auto-deploy from git, a Dockerfile pipeline, and a free PostgreSQL
   instance. Migrating those to Azure would be a week of yak-shaving for zero new
   capability — Render is already doing the simple things well.

2. **Azure managed services are stronger where Render is weak.** Render has no managed
   blob storage (its filesystem is ephemeral), no managed search, and basic observability.
   Azure has all three at student-tier prices.

## Decision

Keep Render where Render shines (always-on Spring Boot container + Postgres in the same
region, free internal networking, zero-config deploys from git). Add Azure for the
specialized services Render doesn't offer (Blob Storage, Cache for Redis, AI Search,
Application Insights). Vercel hosts the static React frontend behind a global CDN.

Topology:

```
Vercel (Frontend)  →  Render (Spring Boot)  →  Render PostgreSQL
                                            →  Azure Blob Storage
                                            →  Azure Cache for Redis
                                            →  Azure AI Search
                                            →  Application Insights
```

## Consequences

**Positive**

- Each provider does what it's best at; nothing is shoehorned into a service that wasn't
  built for it.
- The Render side stays simple — no Azure App Service or Container Apps to configure.
- Demonstrates real architectural judgement on a CV, not just "I followed the tutorial."

**Negative**

- Two cloud accounts to monitor and budget.
- Cross-cloud latency: Frankfurt (Render) → Sweden Central (Azure Storage) adds
  ~30-50 ms to blob operations. Acceptable for document uploads, would not be for a
  hot read path.
- Auth surface is wider: a connection string for Blob, an admin key for Search, a Redis
  primary key, an Application Insights instrumentation key. Each rotates independently.
- No Azure-native identity for the Render-side workload (cross-cloud Managed Identity is
  not a thing in 2026), so we use connection-string and admin-key auth. Documented in
  the Blob and Search service files.

## Alternatives considered

- **Full Azure migration.** Move the backend to Azure Container Apps, Postgres to Azure
  Database for PostgreSQL. Rejected: ~$60/mo extra after student credit runs out, plus
  a week of migration work for zero new capability.
- **Full Render.** Skip Azure entirely, accept ephemeral file storage, no managed search,
  basic logs. Rejected: it would mean shipping a known production bug (document loss on
  redeploy) and losing the observability that catches outages.
