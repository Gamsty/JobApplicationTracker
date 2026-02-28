package com.adrian.jobtracker.entity

import jakarta.persistence.*
import java.time.LocalDateTime

// JPA entity representing a file uploaded and attached to a job application.
// Each document belongs to exactly one Application (many-to-one).
@Entity
@Table(name = "documents")
data class Document(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    // Owning side of the many-to-one relationship with Application.
    // LAZY loading means the Application is not fetched from the DB unless explicitly accessed.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    var application: Application,

    // Stored as the enum name string (e.g. "RESUME") rather than an ordinal integer,
    // so the DB value remains readable if enum order changes.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    var documentType: DocumentType,

    // The name used to store the file on disk (may be UUID-based to avoid collisions)
    @Column(nullable = false, length = 255)
    var fileName: String,

    // The original file name as provided by the user at upload time
    @Column(nullable = false, length = 255)
    var originalFileName: String,

    // Absolute or relative path to the stored file on the server's filesystem
    @Column(nullable = false, length = 500)
    var filePath: String,

    // MIME type of the file (e.g. "application/pdf") — stored so the download endpoint
    // can set the correct Content-Type header without re-detecting it from the filename
    @Column(nullable = false, length = 100)
    var fileType: String,

    // File size in bytes — no length constraint needed for numeric columns
    @Column(nullable = false)
    var fileSize: Long,

    // Optional user-provided note about what this document contains
    @Column(length = 255)
    var description: String? = null,

    // Set once on creation and never changed (updatable = false enforces this at JPA level)
    @Column(nullable = false, updatable = false)
    var uploadedAt: LocalDateTime = LocalDateTime.now(),

    // Updated automatically by the @PreUpdate lifecycle hook below
    @Column(nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
) {
    // JPA lifecycle callback — runs before every UPDATE statement for this entity
    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

// Classifies the type of document attached to an application
enum class DocumentType {
    RESUME,
    COVER_LETTER,
    PORTFOLIO,
    CERTIFICATE,
    TRANSCRIPT,
    REFERENCE,
    OTHER
}
