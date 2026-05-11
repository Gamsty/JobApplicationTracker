package com.adrian.jobtracker.service

import com.adrian.jobtracker.entity.Application
import com.azure.core.credential.AzureKeyCredential
import com.azure.search.documents.SearchClient
import com.azure.search.documents.SearchClientBuilder
import com.azure.search.documents.indexes.SearchIndexClient
import com.azure.search.documents.indexes.SearchIndexClientBuilder
import com.azure.search.documents.indexes.models.SearchField
import com.azure.search.documents.indexes.models.SearchFieldDataType
import com.azure.search.documents.indexes.models.SearchIndex
import com.azure.search.documents.models.SearchOptions
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service

// Azure AI Search implementation of SearchService — active under the "prod" profile.
//
// Index layout: one document per Application, with interview notes and feedback denormalized
// into single text fields. This means search across "all interview feedback for an application"
// works without a join, at the cost of having to re-index the parent application whenever any
// of its interviews change. Acceptable trade-off given write rates are low (a few apps per day
// per user) and read latency matters for the UX.
//
// SECURITY: every search forces filter "userId eq '<currentUser>'" so users can never see
// each other's data via the search endpoint. The userId is also stored on each document so
// the filter actually has something to match.
//
// Auth: admin API key in env var. Like Blob, service-principal auth would be cleaner but
// Azure for Students blocks app-registration creation. Treat the key as a secret.
@Service
@Profile("prod")
class AzureSearchService(
    @Value("\${azure.search.endpoint}") private val endpoint: String,
    @Value("\${azure.search.admin-key}") private val adminKey: String,
    @Value("\${azure.search.index-name}") private val indexName: String
) : SearchService {

    private val log = LoggerFactory.getLogger(AzureSearchService::class.java)

    // Built lazily so a Search outage at startup doesn't block app boot. First indexing op
    // will trigger client creation + index check; if Search is still down, the op logs and
    // returns without throwing (best-effort indexing).
    private val indexClient: SearchIndexClient by lazy {
        SearchIndexClientBuilder()
            .endpoint(endpoint)
            .credential(AzureKeyCredential(adminKey))
            .buildClient()
    }

    private val searchClient: SearchClient by lazy {
        ensureIndexExists()
        SearchClientBuilder()
            .endpoint(endpoint)
            .credential(AzureKeyCredential(adminKey))
            .indexName(indexName)
            .buildClient()
    }

    // Creates the index from a hard-coded schema if it does not exist. Schema lives in code
    // (not in the portal) so it's reproducible — deleting and recreating the index restores
    // the same shape automatically.
    private fun ensureIndexExists() {
        try {
            indexClient.getIndex(indexName)
        } catch (ex: Exception) {
            log.info("Search index '$indexName' not found; creating from schema")
            // Fields are retrievable (returned in search results) by default in the SDK;
            // mark them as hidden only if they shouldn't be returned. None of ours need that.
            val fields = listOf(
                SearchField("id", SearchFieldDataType.STRING).setKey(true).setFilterable(true),
                // userId is filterable but not searchable — it's an identity, not free text.
                // The mandatory per-user filter uses this.
                SearchField("userId", SearchFieldDataType.STRING).setFilterable(true),
                SearchField("companyName", SearchFieldDataType.STRING).setSearchable(true),
                SearchField("positionTitle", SearchFieldDataType.STRING).setSearchable(true),
                SearchField("notes", SearchFieldDataType.STRING).setSearchable(true),
                SearchField("interviewNotes", SearchFieldDataType.STRING).setSearchable(true),
                SearchField("interviewFeedback", SearchFieldDataType.STRING).setSearchable(true),
                SearchField("status", SearchFieldDataType.STRING).setFilterable(true).setFacetable(true),
                SearchField("applicationDate", SearchFieldDataType.DATE_TIME_OFFSET).setFilterable(true).setSortable(true)
            )
            indexClient.createIndex(SearchIndex(indexName, fields))
        }
    }

    override fun indexApplication(application: Application) {
        try {
            val doc = toSearchDocument(application)
            searchClient.uploadDocuments(listOf(doc))
        } catch (ex: Exception) {
            // Best-effort: failed indexing must not break the create/update flow.
            // App Insights surfaces this as a dependency failure separately.
            log.warn("Failed to index application ${application.id}: ${ex.message}")
        }
    }

    override fun removeFromIndex(applicationId: Long) {
        try {
            val doc = mapOf("id" to applicationId.toString())
            searchClient.deleteDocuments(listOf(doc))
        } catch (ex: Exception) {
            log.warn("Failed to remove application $applicationId from index: ${ex.message}")
        }
    }

    override fun search(query: String, userId: Long, limit: Int): List<SearchResult> {
        if (query.isBlank()) return emptyList()
        return try {
            val options = SearchOptions()
                // SECURITY: scope every query to the current user's documents.
                .setFilter("userId eq '${userId}'")
                .setTop(limit)
                .setHighlightFields("companyName", "positionTitle", "notes", "interviewNotes", "interviewFeedback")
                .setIncludeTotalCount(false)

            searchClient.search(query, options, null).map { result ->
                val doc = result.getDocument(Map::class.java)
                SearchResult(
                    applicationId = (doc["id"] as String).toLong(),
                    companyName = doc["companyName"] as? String ?: "",
                    positionTitle = doc["positionTitle"] as? String ?: "",
                    status = doc["status"] as? String ?: "",
                    score = result.score,
                    highlights = result.highlights ?: emptyMap()
                )
            }.toList()
        } catch (ex: Exception) {
            log.warn("Search failed for userId=$userId query='$query': ${ex.message}")
            emptyList()
        }
    }

    // Flatten Application + its nested Interviews into a single denormalized search document.
    // Interview notes and feedback are space-joined so a single full-text query covers them all.
    private fun toSearchDocument(application: Application): Map<String, Any?> {
        val interviewNotes = application.interviews.mapNotNull { it.notes }.joinToString(" ")
        val interviewFeedback = application.interviews.mapNotNull { it.feedback }.joinToString(" ")

        return mapOf(
            "id" to application.id.toString(),
            "userId" to application.user.id.toString(),
            "companyName" to application.companyName,
            "positionTitle" to application.positionTitle,
            "notes" to (application.notes ?: ""),
            "interviewNotes" to interviewNotes,
            "interviewFeedback" to interviewFeedback,
            "status" to application.status.name,
            // Azure Search needs ISO-8601 with offset for DateTimeOffset fields.
            "applicationDate" to application.applicationDate.atStartOfDay().atOffset(java.time.ZoneOffset.UTC).toString()
        )
    }
}
