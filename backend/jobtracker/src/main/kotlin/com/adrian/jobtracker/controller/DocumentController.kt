package com.adrian.jobtracker.controller

import com.adrian.jobtracker.dto.DocumentResponse
import com.adrian.jobtracker.dto.DocumentSummary
import com.adrian.jobtracker.dto.DocumentUploadRequest
import com.adrian.jobtracker.entity.DocumentType
import com.adrian.jobtracker.service.DocumentService
import org.springframework.core.io.Resource
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

// REST controller for all document operations: upload, download, update, delete, and listing.
// All endpoints are under /api/documents and require authentication (enforced by SecurityConfig).
@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = ["http://localhost:5173", "https://job-tracker.vercel.app"])
class DocumentController(
    private val documentService: DocumentService
) {

    // POST /api/documents
    // Accepts a multipart form with the file bytes plus metadata fields as request params.
    // Returns 201 Created with the saved document details.
    @PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun uploadDocument(
        @RequestParam("file") file: MultipartFile,
        @RequestParam("applicationId") applicationId: Long,
        @RequestParam("documentType") documentType: DocumentType,
        @RequestParam("description", required = false) description: String?
    ): ResponseEntity<DocumentResponse> {
        val request = DocumentUploadRequest(
            applicationId = applicationId,
            documentType = documentType,
            description = description
        )

        val document = documentService.uploadDocument(file, request)
        return ResponseEntity.status(HttpStatus.CREATED).body(document)
    }

    // GET /api/documents/application/{applicationId}
    // Returns all documents attached to the given application, newest first.
    // Service verifies the current user owns the application before returning results.
    @GetMapping("/application/{applicationId}")
    fun getDocumentsByApplication(
        @PathVariable applicationId: Long
    ): ResponseEntity<List<DocumentResponse>> {
        val documents = documentService.getDocumentsByApplication(applicationId)
        return ResponseEntity.ok(documents)
    }

    // GET /api/documents/{id}
    // Returns metadata for a single document by its ID.
    // Service verifies the current user owns the document before returning it.
    @GetMapping("/{id}")
    fun getDocumentById(
        @PathVariable id: Long
    ): ResponseEntity<DocumentResponse> {
        val document = documentService.getDocumentById(id)
        return ResponseEntity.ok(document)
    }

    // GET /api/documents/{id}/download
    // Streams the physical file to the client as a binary download.
    // Content-Disposition header tells the browser to save the file using the original filename.
    @GetMapping("/{id}/download")
    fun downloadDocument(
        @PathVariable id: Long
    ): ResponseEntity<Resource> {
        val (resource, filename) = documentService.downloadDocument(id)

        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$filename\"")
            .body(resource)
    }

    // PUT /api/documents/{id}
    // Updates only the description — the file itself and its type cannot be changed after upload.
    @PutMapping("/{id}")
    fun updateDocument(
        @PathVariable id: Long,
        @RequestParam("description", required = false) description: String?
    ): ResponseEntity<DocumentResponse> {
        val updated = documentService.updateDocument(id, description)
        return ResponseEntity.ok(updated)
    }

    // DELETE /api/documents/{id}
    // Deletes both the physical file on disk and the database record.
    // Returns 204 No Content on success (no body).
    @DeleteMapping("/{id}")
    fun deleteDocument(
        @PathVariable id: Long
    ): ResponseEntity<Void> {
        documentService.deleteDocument(id)
        return ResponseEntity.noContent().build()
    }

    // GET /api/documents/my-documents
    // Returns all documents across all applications for the currently authenticated user.
    @GetMapping("/my-documents")
    fun getAllUserDocuments(): ResponseEntity<List<DocumentResponse>> {
        val documents = documentService.getAllUserDocuments()
        return ResponseEntity.ok(documents)
    }

    // GET /api/documents/summary
    // Returns aggregated statistics: total count, storage used, per-type breakdown, and recent uploads.
    @GetMapping("/summary")
    fun getDocumentSummary(): ResponseEntity<DocumentSummary> {
        val summary = documentService.getDocumentSummary()
        return ResponseEntity.ok(summary)
    }
}
