package com.adrian.jobtracker.controller

import com.adrian.jobtracker.dto.AuthResponse
import com.adrian.jobtracker.dto.LoginRequest
import com.adrian.jobtracker.dto.MessageResponse
import com.adrian.jobtracker.dto.RegisterRequest
import com.adrian.jobtracker.service.AuthService
import com.adrian.jobtracker.exception.EmailAlreadyExistsException
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

// Handles authentication endpoints — all routes are public (permitted in SecurityConfig).
// CORS is configured globally in WebConfig — no @CrossOrigin needed here.
@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService
) {

    // POST /api/auth/register — creates a new account and returns a JWT on success.
    // @Valid triggers validation of the request body (NotBlank, Email, Size constraints).
    // Returns 201 Created on success, or re-throws EmailAlreadyExistsException (handled by GlobalExceptionHandler).
    @PostMapping("/register")
    fun register(@Valid @RequestBody request: RegisterRequest): ResponseEntity<AuthResponse> {
        try {
            val response = authService.register(request)
            return ResponseEntity.status(HttpStatus.CREATED).body(response)
        } catch (e: EmailAlreadyExistsException) {
            throw e // Let the GlobalExceptionHandler convert this to a 409 Conflict response
        }
    }

    // POST /api/auth/login — verifies credentials and returns a JWT on success.
    // Spring Security throws BadCredentialsException automatically if the password is wrong.
    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): ResponseEntity<AuthResponse> {
        val response = authService.login(request)
        return ResponseEntity.ok(response)
    }

    // GET /api/auth/me — returns the name of the currently authenticated user.
    // Requires a valid JWT in the Authorization header (handled by JwtAuthenticationFilter).
    @GetMapping("/me")
    fun getCurrentUser(): ResponseEntity<MessageResponse> {
        val user = authService.getCurrentUser()
        return ResponseEntity.ok(MessageResponse("Logged in as: ${user.getFullName()}"))
    }
}
