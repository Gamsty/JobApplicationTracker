package com.adrian.jobtracker.service

import com.adrian.jobtracker.exception.FileNotFoundException
import com.adrian.jobtracker.exception.FileStorageException
import com.azure.core.exception.HttpResponseException
import com.azure.storage.blob.BlobContainerClient
import com.azure.storage.blob.BlobServiceClientBuilder
import com.azure.storage.blob.models.BlobHttpHeaders
import com.azure.storage.blob.models.BlobStorageException
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.core.io.ByteArrayResource
import org.springframework.core.io.Resource
import org.springframework.stereotype.Service
import org.springframework.util.StringUtils
import org.springframework.web.multipart.MultipartFile
import java.io.ByteArrayOutputStream
import java.util.UUID

// Azure Blob Storage implementation of FileStorageService — used in production.
//
// Blobs are named user_{userId}/app_{applicationId}/{uuid}.ext so the layout in the container
// mirrors the directory structure the local impl uses on disk.
//
// Auth: storage-account connection string (StorageSharedKey under the hood). Service-principal
// auth would be preferred (RBAC, no shared secret to rotate), but Azure for Students blocks
// app-registration creation in shared tenants like UiO's, so connection-string auth is the
// practical path here. Treat AZURE_STORAGE_CONNECTION_STRING as a high-value secret.
@Service
@Profile("prod")
class AzureBlobStorageService(
    @Value("\${azure.storage.connection-string}")
    private val connectionString: String,
    @Value("\${azure.storage.container-name}")
    private val containerName: String
) : FileStorageService {

    private val containerClient: BlobContainerClient by lazy { buildContainerClient() }

    private fun buildContainerClient(): BlobContainerClient {
        val serviceClient = BlobServiceClientBuilder()
            .connectionString(connectionString)
            .buildClient()
        return serviceClient.getBlobContainerClient(containerName)
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
        val blobName = "user_$userId/app_$applicationId/$uniqueFilename"
        val contentType = file.contentType ?: "application/octet-stream"

        try {
            val blobClient = containerClient.getBlobClient(blobName)

            // Setting Content-Type on upload means downloads stream with the correct MIME type
            // without having to override headers on every download request.
            val headers = BlobHttpHeaders().setContentType(contentType)

            file.inputStream.use { input ->
                blobClient.upload(input, file.size, /* overwrite = */ true)
            }
            blobClient.setHttpHeaders(headers)

            return FileStorageResult(
                fileName = uniqueFilename,
                originalFilename = originalFilename,
                // filePath stores the full blob name so deleteFile can locate it directly.
                filePath = blobName,
                fileSize = file.size,
                fileType = contentType
            )
        } catch (ex: Exception) {
            throw FileStorageException("Could not store file $originalFilename to Azure Blob Storage.", ex)
        }
    }

    override fun loadFileAsResource(fileName: String, userId: Long, applicationId: Long): Resource {
        val blobName = "user_$userId/app_$applicationId/$fileName"
        try {
            val blobClient = containerClient.getBlobClient(blobName)
            if (!blobClient.exists()) {
                throw FileNotFoundException("File not found: $fileName")
            }
            val buffer = ByteArrayOutputStream()
            blobClient.downloadStream(buffer)
            return ByteArrayResource(buffer.toByteArray())
        } catch (ex: FileNotFoundException) {
            throw ex
        } catch (ex: BlobStorageException) {
            throw FileNotFoundException("File not found: $fileName", ex)
        } catch (ex: HttpResponseException) {
            throw FileNotFoundException("File not found: $fileName", ex)
        }
    }

    override fun deleteFile(filePath: String): Boolean {
        // filePath here is the blob name produced by storeFile (e.g. "user_1/app_2/uuid.ext")
        return try {
            containerClient.getBlobClient(filePath).deleteIfExists()
        } catch (ex: BlobStorageException) {
            throw FileStorageException("Could not delete blob: $filePath", ex)
        }
    }

    private fun getFileExtension(fileName: String): String {
        val lastDotIndex = fileName.lastIndexOf('.')
        return if (lastDotIndex > 0) fileName.substring(lastDotIndex + 1) else "bin"
    }
}
