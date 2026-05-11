# LinkedIn post — draft

Three variants below, increasing in length. Pick one, swap in the live demo video link,
post.

The goal of the post is *recruiter signal*, not viral reach. Specific technical terms
(Bicep, OIDC, Spring Boot 4, multi-cloud) matter more than emojis or storytelling
because recruiters search for those keywords.

---

## Variant A — short (best for most cases)

> Just shipped a real multi-cloud project — and broke down every architectural choice
> in ADRs. 🧵
>
> Job Application Tracker: Spring Boot 4 + Kotlin backend on Render, React on Vercel,
> with Azure handling Blob Storage (uploaded docs), Cache for Redis (caching + auth
> rate limiting), AI Search (full-text), and Application Insights (observability).
> Bicep IaC for the Azure side, GitHub Actions with OIDC for deploys.
>
> Fixed a real production bug along the way: Render's filesystem is ephemeral, so
> every uploaded document disappeared on redeploy. Moving file storage to Azure Blob
> behind a Spring profile-gated interface fixed it without touching DocumentService.
>
> Code + ADRs: github.com/Gamsty/JobApplicationTracker
> Live demo: job-application-tracker-ivory.vercel.app
>
> #kotlin #springboot #azure #multicloud

---

## Variant B — medium (if you want to show specific judgement)

> Spent the last few weeks turning a hobby Spring Boot project into something that
> actually runs in production. Here's what I learned about multi-cloud architecture:
>
> Started with a working Render deployment — backend + Postgres, auto-deploy from
> git, free tier. Could've moved everything to Azure for a "pure" stack, but Render
> is genuinely good at the simple things. So I kept Render for compute + database
> and added Azure for the specialized services Render doesn't offer:
>
> – Azure Blob Storage for uploaded documents (fixes a real bug: Render's
>   filesystem is ephemeral and lost user files on every redeploy)
> – Azure Cache for Redis for dashboard caching AND auth rate limiting (BCrypt is
>   intentionally slow — perfect DoS target without rate limit)
> – Azure AI Search for full-text search across notes + interview feedback
> – Application Insights for observability (Java agent, zero code changes)
>
> All of the above provisioned via Bicep modules. GitHub Actions with OIDC federated
> credentials runs `bicep what-if` on PRs and `az deployment group create` on merge.
> Every architectural decision documented as an ADR — multi-cloud vs single, why
> Blob over Render disk, why distributed cache over in-memory, why AI Search over
> Postgres tsvector.
>
> Stack: Kotlin 2.2, Spring Boot 4.0, React 19, PostgreSQL, Azure Blob/Redis/AI
> Search/App Insights, Bicep, Docker, GitHub Actions.
>
> Live demo: job-application-tracker-ivory.vercel.app
> Code + ADRs: github.com/Gamsty/JobApplicationTracker
>
> #kotlin #springboot #azure #multicloud #devops #bicep

---

## Variant C — long (only post this if you have time to engage with comments)

> "Just build a CRUD app" advice is fine until you actually need to ship something
> users will touch. Then you find out that:
>
> – Your free-tier compute platform has an ephemeral filesystem (Render). Uploaded
>   files disappear on every redeploy. This isn't theoretical — it broke for me.
> – Your auth endpoint, with no rate limit, is a DoS target because BCrypt is
>   intentionally slow (good for offline attacks, bad for online ones).
> – Your dashboard hits the database 8 times on every page load.
> – You have no observability beyond "did the deploy fail."
>
> I spent the last few weeks fixing all of this on a Job Application Tracker I
> originally built for fun. The result is a multi-cloud Spring Boot + Kotlin + React
> app where each piece runs on whichever provider does it best:
>
> – Vercel: static frontend, global CDN, free
> – Render: always-on Spring Boot container + PostgreSQL, same region, free
>   internal networking
> – Azure: Blob (file storage), Cache for Redis (caching + rate limiting), AI Search
>   (full-text), Application Insights (telemetry)
>
> The Azure side is defined entirely in Bicep — five resources across four modules,
> with `bicep what-if` proving the code matches what's actually deployed. GitHub
> Actions runs CI on PRs, validates the Bicep, and (with OIDC federated credentials,
> no long-lived secrets) deploys on merge to main.
>
> Most importantly, the *why* behind each choice is documented as ADRs:
>
> – ADR-001: why multi-cloud beat going pure Azure
> – ADR-002: why Azure Blob beat Render's disk (the bug above)
> – ADR-003: why distributed Redis cache beat in-process Caffeine
> – ADR-004: why Azure AI Search beat Postgres tsvector
>
> Each ADR is one screen of plain language with the trade-off explicit and the
> alternatives I rejected listed. That's the writing I wish more open-source
> projects had.
>
> Live demo: job-application-tracker-ivory.vercel.app
> Code, ADRs, and architecture screenshots: github.com/Gamsty/JobApplicationTracker
>
> Happy to dig into any of the choices in the comments.
>
> #kotlin #springboot #azure #multicloud #devops #bicep #softwarearchitecture

---

## Posting tips

- **Best time**: weekday morning (08:00-10:00) or early afternoon (12:00-14:00) Norway
  time. Avoid Friday evening and weekends — engagement drops.
- **First comment** by you with the live demo link gets the algorithm to surface the
  post wider. Some people find putting the link in the body suppresses reach.
- **Reply to every comment** for the first 24 hours. Even short replies signal
  engagement to LinkedIn's ranking model.
- **Don't tag people you don't actually know.** Recruiters who've never spoken to
  you will see the notification as spam.
- **Include the live demo screenshot** as the post image, not the GitHub social
  preview — the demo screenshot signals "this is a real working thing" much faster.
