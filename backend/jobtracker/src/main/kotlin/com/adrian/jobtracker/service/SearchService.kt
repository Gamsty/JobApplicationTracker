package com.adrian.jobtracker.service

import com.adrian.jobtracker.entity.Application

// Abstraction over full-text search across Application + nested Interview content.
// Two implementations:
//   - AzureSearchService (prod): uses Azure AI Search with a per-user filter
//   - NoOpSearchService (non-prod): all operations are inert, search() returns empty
//
// All write operations are best-effort: callers should never see an exception from these.
// If the search backend is unreachable, indexing falls behind and search returns no hits,
// but the rest of the app keeps working. The reindex command can fix gaps after recovery.
interface SearchService {

    // Adds or replaces the search document for this application. Called after create/update
    // in ApplicationService and after interview create/update/delete (since interview content
    // is denormalized into the parent application's search document).
    fun indexApplication(application: Application)

    // Removes the application's document from the index. Called after deleteApplication.
    fun removeFromIndex(applicationId: Long)

    // Full-text search restricted to the given user's data. Returns at most `limit` results
    // ordered by relevance. SECURITY: implementations MUST enforce the user filter at the
    // search-engine level — never rely on the caller to filter results.
    fun search(query: String, userId: Long, limit: Int = 20): List<SearchResult>
}

// One search hit returned to the controller. Highlights map field name to the snippets where
// the query matched, so the frontend can show matching text with the query term emboldened.
data class SearchResult(
    val applicationId: Long,
    val companyName: String,
    val positionTitle: String,
    val status: String,
    val score: Double,
    val highlights: Map<String, List<String>>
)
