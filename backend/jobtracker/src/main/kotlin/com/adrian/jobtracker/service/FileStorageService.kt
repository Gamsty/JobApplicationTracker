package com.adrian.jobtracker.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.Resource
import org.springframework.core.io.UrlResource
import org.springframework.stereotype.Service
import org.springframework.util.StringUtils
import org.springframework.web.multipart.MultipartFile
import java.io.IOException
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.util.*

// Service responsible for storing, retrieving, and deleting files on the server's filesystem.
// Files are organised into a two-level directory structure: uploads/user_{id}/app_{id}/{uuid}.ext
// The root upload directory is configured via the file.upload-dir property in application.yml.
@Service
class FileStorageService(
    @Value("\${file.upload-dir}")
    private val uploadDir: String
) {

    private val fileStorageLocation: Path

    // Resolve the upload directory to an absolute path and create it on startup.
    // Throws FileStorageException if the directory cannot be created (e.g. permission denied).
    init {
        fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize()
        try {
            Files.createDirectories(fileStorageLocation)
        } catch (ex: Exception) {
            throw FileStorageException("Could not create the directory where the uploaded files will be stored.", ex)
        }
    }

    // Validates, renames, and saves the uploaded file under uploads/user_{userId}/app_{applicationId}/.
    // Returns a FileStorageResult with the generated filename, original name, full path, size, and MIME type.
    fun storeFile(file: MultipartFile, userId: Long, applicationId: Long): FileStorageResult {
        // Reject empty files immediately — no need to touch the filesystem
        if (file.isEmpty) {
            throw FileStorageException("Failed to store the empty file.")
        }

        // Clean the original filename to remove path traversal characters (e.g. "../")
        val originalFilename = StringUtils.cleanPath(file.originalFilename ?: "unknown")

        // Reject filenames containing ".." to prevent directory traversal attacks
        if (originalFilename.contains("..")) {
            throw FileStorageException("Filename contains invalid path sequence: $originalFilename")
        }

        // Generate a UUID + timestamp filename so concurrent uploads never collide
        val extension = getFileExtension(originalFilename)
        val uniqueFilename = "${UUID.randomUUID()}_${System.currentTimeMillis()}.$extension"

        // Create a per-user subdirectory if it doesn't exist
        val userDirectory = fileStorageLocation.resolve("user_$userId")
        Files.createDirectories(userDirectory)

        // Create a per-application subdirectory inside the user directory if it doesn't exist
        val appDirectory = userDirectory.resolve("app_$applicationId")
        Files.createDirectories(appDirectory)

        try {
            val targetLocation = appDirectory.resolve(uniqueFilename)
            // REPLACE_EXISTING is safe here because uniqueFilename includes a UUID — collisions are astronomically unlikely
            Files.copy(file.inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING)

            return FileStorageResult(
                fileName = uniqueFilename,                              
                originalFilename = originalFilename,
                filePath = targetLocation.toString(),
                fileSize = file.size,
                fileType = file.contentType ?: "application/octet-stream"
            )
        } catch (ex: Exception) {
            throw FileStorageException("Could not store file $originalFilename. Please try again!", ex)
        }
    }

    // Resolves the file path from the uploads directory and returns it as a Spring Resource.
    // Throws FileNotFoundException if the file does not exist at the expected location.
    fun loadFileAsResource(fileName: String, userId: Long, applicationId: Long): Resource {
        try {
            val userDirectory = fileStorageLocation.resolve("user_$userId")
            val appDirectory = userDirectory.resolve("app_$applicationId")
            // normalize() removes any redundant path segments (e.g. "app_1/../app_1/file.pdf")
            val filePath = appDirectory.resolve(fileName).normalize()
            val resource = UrlResource(filePath.toUri())

            if (resource.exists()) {
                return resource
            } else {
                throw FileNotFoundException("File not found: $fileName")
            }
        } catch (ex: Exception) {
            throw FileNotFoundException("File not found: $fileName", ex)
        }
    }

    // Deletes the file at the given absolute path.
    // Returns true if the file was deleted, false if it did not exist.
    // Throws FileStorageException if deletion fails due to an I/O error.
    fun deleteFile(filePath: String): Boolean {
        try {
            val path = Paths.get(filePath)
            return Files.deleteIfExists(path)
        } catch (ex: IOException) {
            throw FileStorageException("Could not delete file: $filePath", ex)
        }
    }

    // Extracts the file extension from a filename (e.g. "resume.pdf" → "pdf").
    // Returns "bin" as a safe fallback for files with no extension.
    private fun getFileExtension(fileName: String): String {
        val lastDotIndex = fileName.lastIndexOf('.')
        return if (lastDotIndex > 0) {
            fileName.substring(lastDotIndex + 1)
        } else {
            "bin"
        }
    }

    // Returns true if the given MIME type is in the list of permitted upload formats.
    // Covers PDF, Word, Excel, common image formats, and plain text.
    fun isValidFileType(contentType: String?): Boolean { // Fixed: was 'fin' (typo, compile error)
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
    fun isValidFileSize(size: Long): Boolean {
        val maxSizeInBytes = 10 * 1024 * 1024 // 10 MB
        return size <= maxSizeInBytes
    }
}

// Holds the result of a successful file store operation,
// passed back to the DocumentService to persist as a Document entity.
data class FileStorageResult(
    val fileName: String,
    val originalFilename: String,
    val filePath: String,
    val fileSize: Long,
    val fileType: String
)

// Thrown when a file cannot be stored or deleted due to an I/O or validation error.
class FileStorageException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)

// Thrown when a requested file does not exist on the filesystem.
class FileNotFoundException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)
