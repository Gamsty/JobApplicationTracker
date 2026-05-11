# ADR-004: Azure AI Search over Postgres full-text search

**Status:** Accepted
**Date:** 2026-05-11

## Context

Users want to search their saved applications. The original implementation used SQL
`ILIKE` on the `companyName` column only. That misses:

- Searches that should hit position titles ("backend engineer", "data analyst").
- Searches inside the `notes` field, where most of the actually-useful text lives.
- Searches inside interview notes and feedback, which are stored on a related
  `interviews` table.
- Substring matches that aren't anchored to the start of a word ("eng" matching
  "engineer", "engagement").

Real full-text search across denormalised fields was needed.

## Decision

Use **Azure AI Search Free tier** with a single denormalised index, `applications-index`.
One document per application, with interview notes and feedback aggregated into single
text fields so a query matches all of them at once.

Index fields:
- `id` (key), `userId` (filterable, mandatory in every query for multi-tenant isolation)
- `companyName`, `positionTitle`, `notes` (searchable)
- `interviewNotes`, `interviewFeedback` (searchable, denormalised from the interviews
  table on every write)
- `status` (filterable + facetable), `applicationDate` (filterable + sortable)

Indexing happens after each create/update/delete on `Application` or `Interview` —
interview changes re-index the parent application because interview content is
denormalised into the application's search document.

`SearchService` is an interface with `AzureSearchService` (`@Profile("prod")`) and a
`NoOpSearchService` for local dev. A `SearchIndexInitializer` runs at startup and bulk-
indexes every application so the index self-heals if Search goes down and back up.

## Consequences

**Positive**

- A single query covers company, position, notes, and interview content. The UI shows
  highlights from whichever field matched.
- Free tier ($0/mo) is enough for one user's worth of data — 50MB storage, 3 indexes.
- Multi-tenant security is enforced *at the search engine*, not in application code.
  Every query forces `filter: userId eq '<currentUser>'`. There is no path by which a
  request without that filter reaches the index.
- All indexing operations fail open: a Search outage means new applications won't show
  up in search until the service recovers, but the rest of the app keeps working. The
  reindexing initializer self-heals on startup.

**Negative**

- Eventual consistency. After a write, there's a few-second lag before the new content
  is searchable. Acceptable for a job application tracker; would not be for, say, the
  product detail page of an e-commerce site.
- Re-indexing the parent application on every interview change. The interview write
  rate is low (a few per day per user), so this is fine in practice — but if interview
  writes ever became hot, this would need to be batched.
- Free tier cannot be upgraded in place. Moving to Basic for replication and higher
  capacity means deleting and recreating the index. The `SearchIndexInitializer` makes
  this safe to do — the index rebuilds from Postgres on next boot.
- Admin-key auth, same constraint as Blob and Redis. Service-principal auth blocked by
  the Entra tenant.

## Alternatives considered

- **Postgres `tsvector` + GIN index.** Free, no extra service to manage, ships with the
  DB we already have. Rejected because the dashboard already runs N+1 queries on every
  load and we'd be adding more queries — plus tsvector requires manually maintaining
  the search vector on every write (trigger or application-level), which is exactly the
  kind of bug-magnet the cache invalidation problem warns about. Worth revisiting if
  the cost of AI Search ever stops being free.
- **Elasticsearch on Render or self-hosted.** Render doesn't have managed Elastic. Self-
  hosting on a free VM means managing the JVM, the index files, backups, version
  upgrades. Rejected on operational grounds — at this scale a managed service is correct.
