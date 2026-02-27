package com.adrian.jobtracker.dto

import com.adrian.jobtracker.entity.Document
import com.adrian.jobtracker.entity.DocumentType
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDateTime

// Request body sent when uploading a new document.
// The actual file bytes come separately as a MultipartFile — this carries the metadata.
data class DocumentUploadRequest(
    @field:NotNull(message = "Application ID is required")
    val applicationId: Long,

    @field:NotNull(message = "Document type is required")
    val documentType: DocumentType,

    // Optional user note about the document (e.g. "Cover letter for senior role")
    @field:Size(max = 500, message = "Description must be less than 500 characters")
    val description: String? = null
)

// Response body returned to the client after a document is uploaded or fetched.
// Includes a pre-built download URL so the client doesn't have to construct it.
data class DocumentResponse(
    val id: Long,
    val applicationId: Long,
    val applicationCompany: String,
    val documentType: DocumentType,
    val fileName: String,           // UUID-based server-side filename
    val originalFilename: String,   // The name the user originally uploaded
    val fileType: String,           // MIME type (e.g. "application/pdf")
    val fileSize: Long,             // Raw size in bytes
    val fileSizeFormatted: String,  // Human-readable size (e.g. "1.23 MB")
    val description: String?,
    val uploadedAt: LocalDateTime,
    val downloadUrl: String         // Pre-built path for the download endpoint
) {
    companion object {
        // Maps a Document entity to a DocumentResponse.
        fun fromEntity(document: Document): DocumentResponse {
            return DocumentResponse(
                id = document.id!!,
                applicationId = document.application.id!!,
                applicationCompany = document.application.companyName,  
                documentType = document.documentType,                   
                fileName = document.fileName,                           
                originalFilename = document.originalFilename,           
                fileType = document.fileType,                           
                fileSize = document.fileSize,                           
                fileSizeFormatted = formatFileSize(document.fileSize),  
                description = document.description,                     
                uploadedAt = document.uploadedAt,                      
                downloadUrl = "/api/documents/${document.id}/download" 
            )
        }

        // Converts a raw byte count into a human-readable string (B / KB / MB).
        private fun formatFileSize(bytes: Long): String {
            val kb = bytes / 1024.0
            val mb = kb / 1024.0 
            return when {
                mb >= 1 -> "%.2f MB".format(mb)
                kb >= 1 -> "%.2f KB".format(kb)
                else -> "$bytes B"
            }
        }
    }
}

// Summary of all documents for a user, used for storage usage dashboards.
data class DocumentSummary(
    val totalDocuments: Long,
    val totalStorageUsed: Long,        
    val totalStorageFormatted: String,   // Human-readable total (e.g. "45.67 MB")
    val byType: Map<DocumentType, Long>, // Document count grouped by type
    val recentDocuments: List<DocumentResponse>
)
