package com.adrian.jobtracker.service

import com.adrian.jobtracker.exception.FileStorageException
import com.adrian.jobtracker.exception.FileNotFoundException
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
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

// Filesystem-backed implementation of FileStorageService used for local development.
// Files are organised as uploads/user_{id}/app_{id}/{uuid}.ext under the configured root directory.
//
// The @Profile("!prod") guard means this bean is registered for every profile except "prod" —
// so local dev (the default "local" profile) gets filesystem storage, and prod gets Azure Blob.
@Service
@Profile("!prod")
class LocalFileStorageService(
    @Value("\${file.upload-dir}")
    private val uploadDir: String
) : FileStorageService {

    private val fileStorageLocation: Path

    // Resolve the upload directory to an absolute path and create it on startup.
    init {
        fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize()
        try {
            Files.createDirectories(fileStorageLocation)
        } catch (ex: Exception) {
            throw FileStorageException("Could not create the directory where the uploaded files will be stored.", ex)
        }
    }

    override fun storeFile(file: MultipartFile, userId: Long, applicationId: Long): FileStorageResult {
        if (file.isEmpty) {
            throw FileStorageException("Failed to store the empty file.")
        }

        val originalFilename = StringUtils.cleanPath(file.originalFilename ?: "unknown")

        if (originalFilename.contains("..")) {
            throw FileStorageException("Filename contains invalid path sequence: $originalFilename")
        }

        val extension = getFileExtension(originalFilename)
        val uniqueFilename = "${UUID.randomUUID()}_${System.currentTimeMillis()}.$extension"

        val userDirectory = fileStorageLocation.resolve("user_$userId")
        Files.createDirectories(userDirectory)

        val appDirectory = userDirectory.resolve("app_$applicationId")
        Files.createDirectories(appDirectory)

        try {
            val targetLocation = appDirectory.resolve(uniqueFilename)
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

    override fun loadFileAsResource(fileName: String, userId: Long, applicationId: Long): Resource {
        try {
            val userDirectory = fileStorageLocation.resolve("user_$userId")
            val appDirectory = userDirectory.resolve("app_$applicationId")
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

    override fun deleteFile(filePath: String): Boolean {
        try {
            val path = Paths.get(filePath)
            return Files.deleteIfExists(path)
        } catch (ex: IOException) {
            throw FileStorageException("Could not delete file: $filePath", ex)
        }
    }

    private fun getFileExtension(fileName: String): String {
        val lastDotIndex = fileName.lastIndexOf('.')
        return if (lastDotIndex > 0) {
            fileName.substring(lastDotIndex + 1)
        } else {
            "bin"
        }
    }
}
