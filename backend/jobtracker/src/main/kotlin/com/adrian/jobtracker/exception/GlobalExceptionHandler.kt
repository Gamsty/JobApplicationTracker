package com.adrian.jobtracker.exception

import com.adrian.jobtracker.service.ApplicationNotFoundException
import com.adrian.jobtracker.service.DocumentNotFoundException
import com.adrian.jobtracker.service.EmailAlreadyExistsException
import com.adrian.jobtracker.service.FileSizeExceedException
import com.adrian.jobtracker.service.FileStorageException
import com.adrian.jobtracker.service.InterviewNotFoundException
import com.adrian.jobtracker.service.InvalidFileTypeException
import com.adrian.jobtracker.service.UnauthorizedAccessException
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import java.time.LocalDateTime

@RestControllerAdvice // Marks this class as a global exception handler that will intercept exceptions thrown by any controller and return appropriate HTTP responses based on the type of exception
class GlobalExceptionHandler {

    // Handle application not found (404)
    @ExceptionHandler(ApplicationNotFoundException::class)
    fun handleApplicationNotFound(ex: ApplicationNotFoundException): ResponseEntity<ErrorResponse> {

        // Create a standard error response body with details about the not found error
        val error = ErrorResponse(
            timestamp = LocalDateTime.now(),
            status = HttpStatus.NOT_FOUND.value(),
            error = "Not Found",
            message = ex.message ?: "Application not found"
        )
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error)
    }

    // Handle malformed JSON or unrecognized field values (e.g. invalid enum) (400)
    // Jackson throws HttpMessageNotReadableException when the request body cannot be parsed —
    // this includes completely invalid JSON syntax and values that don't match the expected type
    // (e.g. "status": "INVALID_STATUS" where status must be a valid ApplicationStatus enum value)
    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleHttpMessageNotReadable(ex: HttpMessageNotReadableException): ResponseEntity<ErrorResponse> {
        val error = ErrorResponse(
            timestamp = LocalDateTime.now(),
            status = HttpStatus.BAD_REQUEST.value(),
            error = "Bad Request",
            message = "Invalid request body: ${ex.mostSpecificCause.message ?: "Could not parse request"}"
        )
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error)
    }

    // Handle validation errors (400)
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationErrors(ex: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> {
        val errors = ex.bindingResult.fieldErrors
            .map { "${it.field}: ${it.defaultMessage}" } // Collect field errors into a map

        // Create a standard error response body with field errors details
        val error = ErrorResponse(
            timestamp = LocalDateTime.now(),
            status = HttpStatus.BAD_REQUEST.value(),
            error = "Validation Failed",
            message = errors.joinToString("; ") // Join all field error messages into a single string,
        )
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error)
    }

    // Handle any other uncaught exceptions (500)
    @ExceptionHandler(Exception::class)
    fun handleGenericException(ex: Exception): ResponseEntity<ErrorResponse> {
        val error = ErrorResponse(
            timestamp = LocalDateTime.now(),
            status = HttpStatus.INTERNAL_SERVER_ERROR.value(),
            error = "Internal Server Error",
            message = ex.message ?: "An unexpected error occurred"
        )
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error)
    }

    // Handle duplicate email during registration (409 Conflict).
    // Thrown by AuthService when the submitted email is already associated with an account.
    // Returns the exception's message so the frontend can display exactly which email is taken.
    @ExceptionHandler(EmailAlreadyExistsException::class)
    fun handleEmailExists(ex: EmailAlreadyExistsException): ResponseEntity<ErrorResponse> {
        val error = ErrorResponse(
            timestamp = LocalDateTime.now(),
            status = HttpStatus.CONFLICT.value(),
            error = "Email already exists",
            message = ex.message ?: "Email is already registered"
        )
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error)
    }

    // Handle invalid login credentials (401 Unauthorized).
    // Spring Security throws BadCredentialsException automatically when the email doesn't exist
    // or the password doesn't match — no manual credential check needed in the service layer.
    // The message is intentionally vague ("Invalid email or password") to avoid leaking which
    // field was wrong (a common security best practice).
    @ExceptionHandler(BadCredentialsException::class)
    fun handleBadCredentials(ex: Exception): ResponseEntity<ErrorResponse> {
        val error = ErrorResponse(
            timestamp = LocalDateTime.now(),
            status = HttpStatus.UNAUTHORIZED.value(),
            error = "Unauthorized",
            message = "Invalid email or password"
        )
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error)
    }

    // Handle ownership violations and unauthenticated access (403 Forbidden).
    // Thrown when a user tries to read/edit/delete an application or interview that
    // belongs to a different account, or when no valid principal is in the security context.
    @ExceptionHandler(UnauthorizedAccessException::class)
    fun handleUnauthorizedAccessException(ex: UnauthorizedAccessException): ResponseEntity<ErrorResponse> {
        val error = ErrorResponse(
            timestamp = LocalDateTime.now(),
            status = HttpStatus.FORBIDDEN.value(),
            error = "Forbidden",
            message = ex.message ?: "Access denied"
        )

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error)
    }

    // Handle missing interview records (404 Not Found).
    // Thrown by InterviewService when the requested interview ID does not exist in the database.
    @ExceptionHandler(InterviewNotFoundException::class)
    fun handleInterviewNotFound(ex: InterviewNotFoundException): ResponseEntity<ErrorResponse> {
        val error = ErrorResponse(
            timestamp = LocalDateTime.now(),
            status = HttpStatus.NOT_FOUND.value(),
            error = "Not Found",
            message = ex.message ?: "Interview not found"
        )

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error)
    }

    // Handle unsupported MIME types on upload (400 Bad Request).
    // Thrown by DocumentService when the uploaded file's content type is not in the allowed list.
    @ExceptionHandler(InvalidFileTypeException::class)
    fun handleInvalidFileType(ex: InvalidFileTypeException): ResponseEntity<ErrorResponse> {
        val error = ErrorResponse(
            timestamp = LocalDateTime.now(),
            status = HttpStatus.BAD_REQUEST.value(),
            error = "Invalid File Type",
            message = ex.message ?: "File type is not allowed"
        )

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error)
    }

    // Handle files exceeding the 10 MB upload limit (400 Bad Request).
    // Thrown by DocumentService before the file is written to disk.
    @ExceptionHandler(FileSizeExceedException::class) // Fixed: was FileSizeExceededException — must match the class name in DocumentService
    fun handleFileSizeExceeded(ex: FileSizeExceedException): ResponseEntity<ErrorResponse> {
        val error = ErrorResponse(
            timestamp = LocalDateTime.now(),
            status = HttpStatus.BAD_REQUEST.value(),
            error = "File Too Large",
            message = ex.message ?: "File size exceeds maximum allowed"
        )

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error)
    }

    // Handle missing document records (404 Not Found).
    // Thrown by DocumentService when the requested document ID does not exist in the database.
    @ExceptionHandler(DocumentNotFoundException::class)
    fun handleDocumentNotFound(ex: DocumentNotFoundException): ResponseEntity<ErrorResponse> {
        val error = ErrorResponse(
            timestamp = LocalDateTime.now(),
            status = HttpStatus.NOT_FOUND.value(),
            error = "Not Found",
            message = ex.message ?: "Document not found"
        )

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error)
    }

    // Handle filesystem I/O failures during file storage or deletion (500 Internal Server Error).
    // Thrown by FileStorageService when the file cannot be written, read, or deleted.
    @ExceptionHandler(FileStorageException::class)
    fun handleFileStorage(ex: FileStorageException): ResponseEntity<ErrorResponse> {
        val error = ErrorResponse(
            timestamp = LocalDateTime.now(),
            status = HttpStatus.INTERNAL_SERVER_ERROR.value(),
            error = "File Storage Error",
            message = ex.message ?: "Error storing file" // Fixed: was "stroing"
        )

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error)
    }
}

// Standard error response body
data class ErrorResponse(
    val timestamp: LocalDateTime,
    val status: Int,
    val error: String,
    val message: String,
)
