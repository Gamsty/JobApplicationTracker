package com.adrian.jobtracker.service

import com.adrian.jobtracker.dto.AuthResponse
import com.adrian.jobtracker.dto.LoginRequest
import com.adrian.jobtracker.dto.RegisterRequest
import com.adrian.jobtracker.entity.User
import com.adrian.jobtracker.entity.UserRole
import com.adrian.jobtracker.repository.UserRepository
import com.adrian.jobtracker.security.JwtUtils
import com.adrian.jobtracker.security.UserDetailsImpl
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service

// Handles user registration and login, returning a JWT on success.
@Service
class AuthService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val authenticationManager: AuthenticationManager,
    private val jwtUtils: JwtUtils
) {

    // Registers a new user account, hashes their password, saves them to the database,
    // and immediately returns a JWT so they are logged in right after registering.
    fun register(request: RegisterRequest): AuthResponse {
        // Reject registration if the email is already in use
        if (userRepository.existsByEmail(request.email)) {
            throw EmailAlreadyExistsException("Email ${request.email} is already registered")
        }

        // Build the new user entity with a bcrypt-hashed password
        val user = User(
            email = request.email,
            fullName = request.fullName,
            password = passwordEncoder.encode(request.password),
            role = UserRole.USER
        )

        val savedUser = userRepository.save(user)

        // Issue a JWT for the newly registered user so they don't need to log in separately
        val token = jwtUtils.generateToken(savedUser.email)

        return AuthResponse(
            token = token,
            id = savedUser.id!!,
            email = savedUser.email,
            fullName = savedUser.fullName,
            role = savedUser.role.name
        )
    }

    // Verifies the user's email and password via Spring Security's AuthenticationManager.
    // Throws an exception automatically if credentials are wrong — no manual check needed.
    fun login(request: LoginRequest): AuthResponse {
        // Triggers the full Spring Security authentication flow (loads user, verifies password)
        val authentication = authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken(request.email, request.password)
        )

        // Store authentication in the security context for the duration of this request
        SecurityContextHolder.getContext().authentication = authentication

        val userDetails = authentication.principal as UserDetailsImpl
        val token = jwtUtils.generateToken(userDetails.username) // username is the email

        return AuthResponse(
            token = token,
            id = userDetails.getId(),
            email = userDetails.username,
            fullName = userDetails.getFullName(),
            role = userDetails.authorities.first().authority.removePrefix("ROLE_") // Strip prefix to return e.g. "USER" not "ROLE_USER"
        )
    }

    // Returns the currently authenticated user from the Spring Security context.
    // Useful for endpoints that need to know who is making the request.
    fun getCurrentUser(): UserDetailsImpl {
        val authentication = SecurityContextHolder.getContext().authentication
        return authentication.principal as UserDetailsImpl
    }
}

// Thrown during registration when the provided email is already associated with an account
class EmailAlreadyExistsException(message: String) : RuntimeException(message)