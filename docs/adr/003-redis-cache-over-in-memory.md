# ADR-003: Distributed Redis cache over in-memory cache

**Status:** Accepted
**Date:** 2026-05-11

## Context

The dashboard hits three "summary" endpoints on every page load:
`/api/applications/statistics`, `/api/documents/summary`, `/api/reminders/summary`. Each
runs multiple read queries — `getStatistics` alone runs 1 + 7 (one count plus one count
per `ApplicationStatus`). Three of those, on every dashboard load, is a lot of redundant
DB work for data that rarely changes.

Separately, the auth endpoints (`/api/auth/login`, `/api/auth/register`) had **zero
brute-force protection**. BCrypt is intentionally slow — that's a feature for offline
attacks but a DoS target for online ones. An attacker could keep hitting `/login` with
guesses, burning backend CPU on each attempt.

Both problems want shared state that's faster than the database. The two obvious options
are an in-process cache or an out-of-process one.

## Decision

Use **Azure Cache for Redis (Basic C0)** as a distributed cache backing two Spring
features:

1. **`@Cacheable` on the summary methods**, evicted via `@CacheEvict` on the matching
   create/update/delete methods. Cache keys include the current user's ID so each
   user's cache is isolated.
2. **IP-based rate limiting on the auth endpoints** (`RateLimitFilter`), implemented
   with the classic Redis INCR + EXPIRE pattern: increment a counter keyed by IP, set
   a 15-minute TTL on the first hit, return 429 once the counter passes 5.

Both fail open: a Redis outage degrades caching to "miss every time" (still serves real
data from the DB) and rate limiting to "all requests allowed" (acceptable temporary
gap, monitored by an App Insights alert on Redis dependency failures).

## Consequences

**Positive**

- Dashboard summary endpoints serve from a single Redis hit instead of 1 + N DB queries
  on warm cache. Statistics goes from 8 queries to 0.
- Brute-force protection is enforced at the filter layer, *before* BCrypt runs. An
  attacker can't burn CPU by spamming `/login` — they get a 429 after the 6th attempt
  and the filter rejects further attempts without touching auth code.
- Rate-limit state is shared if the backend ever scales to multiple instances.

**Negative**

- $16/mo for the Basic C0 tier once student credit runs out. Real money. We accept it
  because the security improvement (rate limit) is non-negotiable for a public-facing
  login.
- Cache invalidation, "one of the two hard problems." We use `@CacheEvict` with explicit
  per-user keys plus a 5-minute TTL backstop. Acceptable for summaries that change on
  user-triggered writes; a more strict consistency requirement would need an event-bus
  invalidation pattern.
- Another network hop (Frankfurt → Sweden) on every cache read. Saves much more than
  it costs when the alternative is a DB hit, but worth knowing.

## Alternatives considered

- **In-process cache (Caffeine).** No network hop, no monthly bill. Rejected because
  rate-limit state can't be shared across instances — a determined attacker could
  defeat per-instance counters by spreading attempts across instances (not a problem
  today on Render's free single-instance tier, but the pattern hard-codes a free-tier
  assumption into the security layer). Cache hit rate is also worse because warm-cache
  state is lost on every redeploy.
- **No cache, no rate limiting.** Don't fix what's not "broken yet." Rejected because
  the unprotected `/login` is a real security gap, not a theoretical optimisation —
  fixing it later after an attack is worse than fixing it now.
