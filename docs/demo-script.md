# Demo Video Script — 2-3 min walkthrough

Goal: show in 2-3 minutes that this is a real, working, multi-cloud system — not a
hobby toy. Lead with the multi-cloud architecture, then drive the feature path that
exercises each Azure service in turn.

Record at 1080p, screen + voice. Use a single quiet take if possible — multiple cuts
look unprofessional for a short walkthrough.

---

## Beat sheet

**0:00 – 0:15 — Intro + arch shot**

> "This is the Job Application Tracker — a full-stack Spring Boot + React app I built
> as a hands-on multi-cloud project."

Show the Application Insights Application Map screenshot (or the live view) — point
out the three nodes: Render compute, Render Postgres, Azure Blob.

> "Backend's on Render in Frankfurt, Postgres next to it, and on Azure I've got Blob
> Storage for documents, Redis for caching and rate limiting, AI Search for full-text,
> and Application Insights ingesting everything."

**0:15 – 0:35 — Login + dashboard**

Login to live demo. The dashboard renders.

> "Dashboard shows total applications, status breakdown, recent docs. The summary
> endpoint that drives this used to run eight queries on every load — now it's cached
> in Redis for five minutes, invalidated when the user writes."

If you can open dev tools network tab side-by-side, show the response time on the
second dashboard load is faster. Optional polish.

**0:35 – 1:10 — Upload a document (Azure Blob)**

Open an application, click "Upload document", pick a small PDF.

> "Document uploads go to Azure Blob, not Render's filesystem — Render's filesystem
> is ephemeral, so anything stored there disappears on redeploy. That was a real
> production bug I caught when I started this project."

Switch to Azure Portal → Storage account → Containers → documents → show the blob
appearing in `user_X/app_Y/...`.

> "The blob name encodes the user and application, so the layout in storage mirrors
> the directory structure the local dev impl uses on disk. Same Spring profile pattern
> the whole app uses."

**1:10 – 1:50 — Full-text search (AI Search)**

Back in the app. Type something into the search box that matches notes content (not
just company name). Show the highlighted snippet.

> "Search hits Azure AI Search — covers company, position, notes, and interview
> feedback. Highlights show why each result matched, not just that it did. Every query
> is filtered to the current user's documents at the search engine, so multi-tenant
> isolation isn't application code I have to remember to write."

**1:50 – 2:15 — Observability (App Insights)**

Switch to Azure Portal → Application Insights → Live Metrics. Show the live request
flow as you click through the app.

> "Application Insights ingests everything via a Java agent — request latency,
> dependency calls, exceptions, custom traces. Zero application code changes for
> basic instrumentation."

Open Application Map briefly. Show the three downstream nodes again.

**2:15 – 2:40 — IaC + CI/CD wrap-up**

Show the `infra/` folder briefly.

> "The Azure side of all this is in Bicep — five resources, four modules, plus a root
> file that composes them. `az deployment group create` reproduces the entire Azure
> stack."

Show `.github/workflows/`.

> "Four GitHub Actions workflows — backend CI, frontend CI, Bicep validation that
> posts what-if diffs as PR comments, and a deploy workflow with OIDC federated
> credentials so there are no long-lived secrets in the repo."

**2:40 – 2:55 — Close**

> "Code's on GitHub at github.com/Gamsty/JobApplicationTracker, live demo at
> job-application-tracker-ivory.vercel.app, ADRs in the docs folder if you want
> the why behind any of the choices. Thanks for watching."

---

## Recording checklist

- Live demo is **awake** (Render free tier spins down after 15 min inactivity — hit
  it manually a minute before recording to warm it).
- Browser zoom at 110-125% so text is readable at video compression.
- Close unrelated tabs. Hide bookmark bar.
- Test microphone level. Use a quiet room.
- Single take, no edits. If you make a mistake, re-record — cuts look amateur.

## After recording

Upload to YouTube (unlisted is fine), embed in README replacing the placeholder
`docs/screenshots/demo-placeholder.png`, also link it in the LinkedIn post.
