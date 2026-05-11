package com.adrian.jobtracker.service

import com.adrian.jobtracker.repository.ApplicationRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component

// Runs once at application startup in prod and bulk-indexes every existing application.
//
// Why this exists: when Azure AI Search is first provisioned (or the index is recreated),
// it's empty even though Postgres already has applications. Without this, the search endpoint
// would return zero results until users edit each application individually to trigger
// per-write indexing.
//
// Safe to run on every startup. The index uses application IDs as keys, so re-uploading the
// same documents is an idempotent upsert — no duplicates appear. The cost is one Search write
// per application per boot, which is negligible at the volumes this app sees and well within
// the Free tier's transaction limits.
@Component
@Profile("prod")
class SearchIndexInitializer(
    private val applicationRepository: ApplicationRepository,
    private val searchService: SearchService
) : CommandLineRunner {

    private val log = LoggerFactory.getLogger(SearchIndexInitializer::class.java)

    override fun run(vararg args: String) {
        try {
            val applications = applicationRepository.findAll()
            log.info("Re-indexing ${applications.size} application(s) into search index on startup")
            applications.forEach { searchService.indexApplication(it) }
        } catch (ex: Exception) {
            // Best-effort: if Search is unreachable at boot, app starts normally and the
            // per-write indexing will catch new applications. Existing ones will be missing
            // from search results until next successful boot or manual reindex.
            log.warn("Initial search reindex failed: ${ex.message}")
        }
    }
}
