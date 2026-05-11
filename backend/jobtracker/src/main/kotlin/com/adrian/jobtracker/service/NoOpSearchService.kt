package com.adrian.jobtracker.service

import com.adrian.jobtracker.entity.Application
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service

// Inert implementation used in local dev. Indexing operations do nothing, search returns
// empty results. The existing /api/applications/search endpoint (substring match on company
// name) keeps working locally without Azure AI Search being available.
@Service
@Profile("!prod")
class NoOpSearchService : SearchService {
    override fun indexApplication(application: Application) = Unit
    override fun removeFromIndex(applicationId: Long) = Unit
    override fun search(query: String, userId: Long, limit: Int): List<SearchResult> = emptyList()
}
