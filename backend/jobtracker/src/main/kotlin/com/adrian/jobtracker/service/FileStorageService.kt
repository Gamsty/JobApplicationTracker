package com.adrian.jobtracker.service

import org.springframework.core.io.Resource
import org.springframework.web.multipart.MultipartFile

// Abstraction over physical file storage. Two implementations exist:
//   - LocalFileStorageService  (active when profile != "prod"): stores files on the server filesystem
//   - AzureBlobStorageService  (active when profile == "prod"): stores files in Azure Blob Storage
// DocumentService depends only on this interface and is unaware of which backend is in use.
interface FileStorageService {

    // Validates, names, and persists the uploaded file. Returns metadata used to build a Document entity.
    fun storeFile(file: MultipartFile, userId: Long, applicationId: Long): FileStorageResult

    // Loads a previously stored file as a Spring Resource for streaming back to the client.
    fun loadFileAsResource(fileName: String, userId: Long, applicationId: Long): Resource

    // Deletes a previously stored file. Returns true if the file existed and was removed.
    // The filePath argument is whatever the storeFile result stored in FileStorageResult.filePath —
    // an absolute filesystem path for the local impl, a blob name for the Azure impl.
    fun deleteFile(filePath: String): Boolean

    // Returns true if the given MIME type is in the list of permitted upload formats.
    // Shared validation lives on the interface so both implementations enforce identical rules.
    fun isValidFileType(contentType: String?): Boolean {
        val allowedTypes = listOf(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "image/jpeg",
            "image/png",
            "text/plain"
        )
        return contentType in allowedTypes
    }

    // Returns true if the file is within the 10 MB upload limit.
    fun isValidFileSize(size: Long): Boolean = size <= 10 * 1024 * 1024
}

// Result of a successful store operation. The DocumentService persists these fields on a Document entity.
data class FileStorageResult(
    val fileName: String,
    val originalFilename: String,
    val filePath: String,
    val fileSize: Long,
    val fileType: String
)
