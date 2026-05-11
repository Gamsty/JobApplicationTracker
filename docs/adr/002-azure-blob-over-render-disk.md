# ADR-002: Azure Blob Storage over Render's filesystem

**Status:** Accepted
**Date:** 2026-05-11

## Context

The application lets users upload documents (resumes, cover letters, certificates) and
attach them to job applications. Uploaded files need to survive redeploys, restarts,
and instance recycling.

The initial implementation wrote files to Render's local filesystem under `./uploads/`.
This worked in development but was a **production bug**: Render's container filesystem
is ephemeral. Every redeploy wipes everything outside the image. Every user-uploaded
file disappeared the moment a new commit landed on main.

## Decision

Store uploaded files in **Azure Blob Storage** (one Storage Account, one private
container named `documents`). The application authenticates using the storage account's
primary access key, passed in via the `AZURE_STORAGE_CONNECTION_STRING` environment
variable on Render.

`FileStorageService` is an interface with two implementations gated by Spring profile:

- `LocalFileStorageService` (`@Profile("!prod")`) — writes to the filesystem. Used for
  local development so devs don't need an Azure account to run the app.
- `AzureBlobStorageService` (`@Profile("prod")`) — writes to Blob. Used on Render.

`DocumentService` depends only on the interface and is unaware of which backend is in
use. Blobs are named `user_{userId}/app_{applicationId}/{uuid}.{ext}` — the same layout
the local impl uses, just as keys in the blob container instead of directories on disk.

## Consequences

**Positive**

- Files survive redeploys. The actual user-visible bug is fixed.
- Storage is decoupled from compute. The backend instance can be replaced without
  touching the data.
- The interface split means local dev needs no Azure credentials.

**Negative**

- Cross-cloud latency on every upload and download. Frankfurt → Sweden Central round trip
  is ~30-50ms; combined with the time it takes to stream a multi-megabyte PDF over the
  wire, individual operations are noticeably slower than a local disk write.
- Connection-string auth instead of service-principal RBAC. RBAC would be the correct
  pattern but Azure for Students blocks app-registration creation in shared Entra tenants
  (e.g. universities), so connection strings are the practical fallback. Documented in
  `AzureBlobStorageService.kt` and the Phase 2 section of the deployment guide.
- Operational cost: a few cents per month at our volume, but real money at any scale.

## Alternatives considered

- **Render Persistent Disk** ($1/mo per GB). Would survive redeploys but is tied to a
  single instance — Render's free tier doesn't support multi-instance services anyway,
  so the limit isn't binding today. The bigger issue: no managed lifecycle (lifecycle
  rules, versioning, soft delete), and storage is a separate billable add-on that
  doesn't auto-resize.
- **PostgreSQL `bytea` columns.** Storing file content directly in the database. Bloats
  backups, kills index efficiency, hard to expire, requires HTTP streaming through the
  app server on every download. Standard advice is "don't store blobs in your OLTP DB."
