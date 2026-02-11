package com.adrian.jobtracker.exception

import com.adrian.jobtracker.service.ApplicationNotFoundException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
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
}

// Standard error response body
data class ErrorResponse(
    val timestamp: LocalDateTime,
    val status: Int,
    val error: String,
    val message: String,
)
