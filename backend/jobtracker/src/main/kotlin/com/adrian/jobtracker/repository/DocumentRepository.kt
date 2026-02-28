package com.adrian.jobtracker.repository

import com.adrian.jobtracker.entity.Application
import com.adrian.jobtracker.entity.Document
import com.adrian.jobtracker.entity.DocumentType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

// Spring Data repository for Document entities.
// JpaRepository provides standard CRUD operations (save, findById, delete, etc.) out of the box.
@Repository
interface DocumentRepository : JpaRepository<Document, Long> {

    // Returns all documents for the given application, newest uploads first.
    // Spring Data derives the query from the method name automatically.
    fun findByApplicationOrderByUploadedAtDesc(application: Application): List<Document>

    // Returns documents of a specific type for the given application
    // (e.g. only RESUMEs, or only COVER_LETTERs).
    fun findByApplicationAndDocumentType(application: Application, documentType: DocumentType): List<Document>

    // Returns the total number of documents attached to the given application.
    fun countByApplication(application: Application): Long

    // Returns every document uploaded by the given user across all their applications,
    // ordered by upload date descending.
    // @Param is required so Spring Data can bind the :userId named parameter at runtime.
    @Query("SELECT d FROM Document d WHERE d.application.user.id = :userId ORDER BY d.uploadedAt DESC")
    fun findByUserId(@Param("userId") userId: Long): List<Document>

    // Returns the total bytes used by all documents uploaded by a user.
    // Nullable because SUM returns NULL when the user has no documents.
    // @Param is required so Spring Data can bind the :userId named parameter at runtime.
    @Query("SELECT SUM(d.fileSize) FROM Document d WHERE d.application.user.id = :userId")
    fun getTotalStorageByUser(@Param("userId") userId: Long): Long?
}
