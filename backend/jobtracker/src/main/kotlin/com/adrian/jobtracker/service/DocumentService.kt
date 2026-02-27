package com.adrian.jobtracker.service

import com.adrian.jobtracker.dto.DocumentResponse
import com.adrian.jobtracker.dto.DocumentSummary
import com.adrian.jobtracker.dto.DocumentUploadRequest
import com.adrian.jobtracker.entity.Document
import com.adrian.jobtracker.entity.DocumentType
import com.adrian.jobtracker.repository.ApplicationRepository
import com.adrian.jobtracker.repository.DocumentRepository
import org.springframework.core.io.Resource
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile

// Service handling all document business logic: upload, retrieval, download, update, and deletion.
// @Transactional ensures DB operations are rolled back if an exception occurs mid-method.
@Service
@Transactional
class DocumentService(
    private val documentRepository: DocumentRepository,
    private val applicationRepository: ApplicationRepository,
    private val fileStorageService: FileStorageService,
    private val authService: AuthService
) {

    // Convenience helper — resolves the ID of the currently authenticated user
    private fun getCurrentUserId() = authService.getCurrentUser().getId()

    // Validates the file, verifies the user owns the application, stores the file on disk,
    // and persists a Document entity. Returns the saved document as a response DTO.
    fun uploadDocument(
        file: MultipartFile,
        request: DocumentUploadRequest
    ): DocumentResponse {
        val userId = getCurrentUserId()

        // Reject unsupported MIME types before touching the filesystem
        if (!fileStorageService.isValidFileType(file.contentType)) {
            throw InvalidFileTypeException("File type not allowed: ${file.contentType}")
        }

        // Reject files larger than 10 MB before touching the filesystem
        if (!fileStorageService.isValidFileSize(file.size)) {
            throw FileSizeExceedException("File size exceeds maximum allowed size (10MB)")
        }

        // Load the application and verify the current user owns it
        val application = applicationRepository.findById(request.applicationId)
            .orElseThrow { ApplicationNotFoundException("Application with id ${request.applicationId} not found") }

        if (application.user.id != userId) {
            throw UnauthorizedAccessException("You don't have access to this application")
        }

        // Write the file to disk — returns the generated filename, path, size, and MIME type
        val fileResult = fileStorageService.storeFile(file, userId, request.applicationId)

        // Build the entity from the upload request metadata and the file storage result
        val document = Document(
            application = application,
            documentType = request.documentType,        
            fileName = fileResult.fileName,
            originalFilename = fileResult.originalFilename,
            filePath = fileResult.filePath,             
            fileType = fileResult.fileType,             
            fileSize = fileResult.fileSize,
            description = request.description
        )

        val saved = documentRepository.save(document)
        return DocumentResponse.fromEntity(saved)
    }

    // Returns all documents for the given application, ordered by upload date descending.
    // Verifies ownership before returning results.
    fun getDocumentsByApplication(applicationId: Long): List<DocumentResponse> { 
        val userId = getCurrentUserId()

        val application = applicationRepository.findById(applicationId)
            .orElseThrow { ApplicationNotFoundException("Application with id $applicationId not found") }

        if (application.user.id != userId) {
            throw UnauthorizedAccessException("You don't have access to this application")
        }

        return documentRepository.findByApplicationOrderByUploadedAtDesc(application)
            .map { DocumentResponse.fromEntity(it) }
    }

    // Returns a single document by ID after verifying the current user owns it.
    fun getDocumentById(id: Long): DocumentResponse {
        val userId = getCurrentUserId()

        val document = documentRepository.findById(id)
            .orElseThrow { DocumentNotFoundException("Document with id $id not found") }

        if (document.application.user.id != userId) {
            throw UnauthorizedAccessException("You don't have access to this document")
        }

        return DocumentResponse.fromEntity(document)
    }

    // Loads the physical file as a Spring Resource and returns it alongside the original filename.
    // The controller uses the filename to set the Content-Disposition header for the browser download.
    fun downloadDocument(id: Long): Pair<Resource, String> {
        val userId = getCurrentUserId()

        val document = documentRepository.findById(id)
            .orElseThrow { DocumentNotFoundException("Document with id $id not found") }

        if (document.application.user.id != userId) {
            throw UnauthorizedAccessException("You don't have access to this document")
        }

        val resource = fileStorageService.loadFileAsResource(
            document.fileName,
            userId,
            document.application.id!!
        )

        // Return both the file resource and the original filename for the Content-Disposition header
        return Pair(resource, document.originalFilename)
    }

    // Deletes the physical file from disk first, then removes the DB record.
    // Order matters: if DB deletion fails, the file is already gone but the record remains visible
    // (safer than deleting the record first and leaving an orphaned file).
    fun deleteDocument(id: Long) {
        val userId = getCurrentUserId()

        val document = documentRepository.findById(id)
            .orElseThrow { DocumentNotFoundException("Document with id $id not found") }

        if (document.application.user.id != userId) {
            throw UnauthorizedAccessException("You don't have access to this document")
        }

        // Remove physical file from the filesystem
        fileStorageService.deleteFile(document.filePath)

        // Remove the database record
        documentRepository.deleteById(id)
    }

    // Updates only the document's description — filename and type cannot be changed after upload.
    fun updateDocument(id: Long, description: String?): DocumentResponse {
        val userId = getCurrentUserId()

        val document = documentRepository.findById(id)
            .orElseThrow { DocumentNotFoundException("Document with id $id not found") }

        if (document.application.user.id != userId) {
            throw UnauthorizedAccessException("You don't have access to this document")
        }

        document.description = description
        val updated = documentRepository.save(document)

        return DocumentResponse.fromEntity(updated)
    }

    // Returns all documents across all applications for the current user, newest first.
    fun getAllUserDocuments(): List<DocumentResponse> {
        val userId = getCurrentUserId()
        return documentRepository.findByUserId(userId)
            .map { DocumentResponse.fromEntity(it) }
    }

    // Builds a summary of the user's document library: total count, storage used,
    // per-type breakdown, and the 5 most recently uploaded documents.
    fun getDocumentSummary(): DocumentSummary {
        val userId = getCurrentUserId()

        val allDocuments = documentRepository.findByUserId(userId)
        // getTotalStorageByUser returns null when the user has no documents — default to 0
        val totalStorage = documentRepository.getTotalStorageByUser(userId) ?: 0L

        // Count how many documents exist for each DocumentType enum value
        val byType = DocumentType.values().associateWith { type ->
            allDocuments.count { it.documentType == type }.toLong()
        }

        // The repository already orders by uploadedAt DESC so take(5) gives the most recent
        val recent = allDocuments.take(5).map { DocumentResponse.fromEntity(it) }

        return DocumentSummary(
            totalDocuments = allDocuments.size.toLong(),
            totalStorageUsed = totalStorage,
            totalStorageFormatted = formatFileSize(totalStorage),
            byType = byType,
            recentDocuments = recent
        )
    }

    // Converts a raw byte count to a human-readable string (B / KB / MB / GB).
    private fun formatFileSize(bytes: Long): String {
        val kb = bytes / 1024.0
        val mb = kb / 1024.0
        val gb = mb / 1024.0
        return when {
            gb >= 1 -> "%.2f GB".format(gb)
            mb >= 1 -> "%.2f MB".format(mb)
            kb >= 1 -> "%.2f KB".format(kb)
            else -> "$bytes B"
        }
    }
}

// Thrown when the uploaded file's MIME type is not in the allowed list
class InvalidFileTypeException(message: String) : RuntimeException(message)

// Thrown when the uploaded file exceeds the 10 MB size limit
class FileSizeExceedException(message: String) : RuntimeException(message)

// Thrown when a document ID does not exist in the database
class DocumentNotFoundException(message: String) : RuntimeException(message)
