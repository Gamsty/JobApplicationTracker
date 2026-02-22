package com.adrian.jobtracker.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

// Request body for POST /api/auth/login
data class LoginRequest(
    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Invalid email format")
    val email: String,

    @field:NotBlank(message = "Password is required")
    val password: String
)

// Request body for POST /api/auth/register
data class RegisterRequest(
    @field:NotBlank(message = "Full name is required")
    @field:Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    val fullName: String,

    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Invalid email format")
    val email: String,

    @field:NotBlank(message = "Password is required")
    @field:Size(min = 6, message = "Password must be at least 6 characters")
    val password: String
)

// Response body returned after successful login or registration —
// contains the JWT token and basic user info for the frontend to store
data class AuthResponse(
    val token: String,
    val type: String = "Bearer", // Token type prefix used in the Authorization header (e.g. "Bearer <token>")
    val id: Long,
    val email: String,
    val fullName: String,
    val role: String
)

// Generic response for operations that only need to return a message (e.g. registration success)
data class MessageResponse(
    val message: String
)