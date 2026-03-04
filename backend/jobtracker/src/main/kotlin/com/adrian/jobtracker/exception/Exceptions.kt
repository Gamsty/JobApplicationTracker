package com.adrian.jobtracker.exception

// ── Application ─────────────────────────────────────────────────────────────────

// Thrown when a requested application ID does not exist in the database (mapped to 404)
class ApplicationNotFoundException(message: String) : RuntimeException(message)

// ── Auth ─────────────────────────────────────────────────────────────────────────

// Thrown during registration when the provided email is already associated with an account
class EmailAlreadyExistsException(message: String) : RuntimeException(message)

// Thrown when the JWT principal cannot be resolved to a DB user, or when a user
// attempts to access a resource that belongs to a different account (mapped to 403)
class UnauthorizedAccessException(message: String) : RuntimeException(message)

// ── Document ─────────────────────────────────────────────────────────────────────

// Thrown when a document ID does not exist in the database
class DocumentNotFoundException(message: String) : RuntimeException(message)

// Thrown when the uploaded file's MIME type is not in the allowed list
class InvalidFileTypeException(message: String) : RuntimeException(message)

// Thrown when the uploaded file exceeds the 10 MB size limit
class FileSizeExceedException(message: String) : RuntimeException(message)

// ── Email ────────────────────────────────────────────────────────────────────────

// Custom exception for email sending failures — wraps the underlying cause for better error tracing
class EmailSendException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)

// ── File Storage ─────────────────────────────────────────────────────────────────

// Thrown when a file cannot be stored or deleted due to an I/O or validation error
class FileStorageException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)

// Thrown when a requested file does not exist on the filesystem
class FileNotFoundException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)

// ── Interview ────────────────────────────────────────────────────────────────────

// Thrown when a requested interview ID does not exist in the database (mapped to 404)
class InterviewNotFoundException(message: String) : RuntimeException(message)

// ── Reminder ─────────────────────────────────────────────────────────────────────

// Thrown when a requested reminder does not exist in the database
class ReminderNotFoundException(message: String) : RuntimeException(message)
