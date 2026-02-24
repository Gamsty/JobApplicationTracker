package com.adrian.jobtracker.service

import com.adrian.jobtracker.dto.ApplicationRequest
import com.adrian.jobtracker.dto.ApplicationResponse
import com.adrian.jobtracker.entity.ApplicationStatus
import com.adrian.jobtracker.entity.Application
import com.adrian.jobtracker.repository.ApplicationRepository
import com.adrian.jobtracker.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
// Service class for managing job applications
class ApplicationService(
    private val repository: ApplicationRepository,
    private val userRepository: UserRepository,
    private val authService: AuthService
) {
    // Resolve the full User entity for the currently authenticated principal.
    // Uses the ID from the JWT-backed UserDetailsImpl so the lookup always hits the primary-key index.
    private fun getCurrentUser() = userRepository.findById(authService.getCurrentUser().getId())
        .orElseThrow {
            UnauthorizedAccessException("Authenticated user no longer exists in the database")
        }

    // Get all applications for current user
    fun getAllApplications(): List<ApplicationResponse> {
        var user = getCurrentUser()
        return repository.findByUserOrderByApplicationDateDesc(user) // Fetch all applications ordered by application date descending
            .map { ApplicationResponse.fromEntity(it) } // Convert each application entity to a response DTO
    }

    // Get applications filtered by status for current user
    fun getApplicationsByStatus(status: ApplicationStatus): List<ApplicationResponse> {
        var user = getCurrentUser()
        return repository.findByUserAndStatus(user, status) // Fetch applications with the specified status
            .map { ApplicationResponse.fromEntity(it) } // Convert each application entity to a response DTO
    }

    // Get single application by ID (verify ownership)
    fun getApplicationById(id: Long): ApplicationResponse {
        var user = getCurrentUser()
        val application = repository.findById(id)
            .orElseThrow { ApplicationNotFoundException("Application with ID $id not found") }

        // Check if application belongs to current user
        if (application.user.id != user.id) {
            throw UnauthorizedAccessException("You don't have access to this applicaiton")
        }

        return ApplicationResponse.fromEntity(application) // Convert the application entity to a response DTO
    }

    // Create a new application for current user
    fun createApplication(request: ApplicationRequest): ApplicationResponse {
        var user = getCurrentUser()

        val application = Application(
            user = user,
            companyName = request.companyName!!,
            positionTitle = request.positionTitle!!,
            applicationDate = request.applicationDate!!,
            status = request.status!!,
            jobUrl = request.jobUrl,
            notes = request.notes
        )

        val saved = repository.save(application) // Save the new application to the database
        return ApplicationResponse.fromEntity(saved)
    }

    // Update an existing application (verify ownership)
    fun updateApplication(id: Long, request: ApplicationRequest): ApplicationResponse {
        var user = getCurrentUser()
        val application = repository.findById(id)
            .orElseThrow { ApplicationNotFoundException("Application with ID $id not found") }

        // Check ownership
        if (application.user.id != user.id) {
            throw UnauthorizedAccessException("You don't have access to this application")
        }

        // Update fields
        application.companyName = request.companyName!!
        application.positionTitle = request.positionTitle!!
        application.applicationDate = request.applicationDate!!
        application.status = request.status!!
        application.jobUrl = request.jobUrl
        application.notes = request.notes
        application.updatedAt = LocalDateTime.now()

        val updated = repository.save(application) // Save the updated application to the database
        return ApplicationResponse.fromEntity(updated)
    }

    // Delete an application by ID (verify ownership)
    fun deleteApplication(id: Long) {
        var user = getCurrentUser()

        val application = repository.findById(id)
            .orElseThrow { ApplicationNotFoundException("Application with id $id not found") }

        // Check ownership
        if (application.user.id != user.id) {
            throw UnauthorizedAccessException("You don't have access to this application")
        }

        repository.deleteById(id)
    }

    // Search applications by company name (partial, case-insensitive) for current user
    // Returns an empty list immediately if the query is blank —
    // ContainingIgnoreCase("") would otherwise match every record in the database
    fun searchApplicationsByCompanyName(companyName: String): List<ApplicationResponse> {
        val user = getCurrentUser()

        return repository.findByUserAndCompanyNameContainingIgnoreCase(user, companyName)
            .map { ApplicationResponse.fromEntity(it) }
    }

    // Get statistics for current user
    fun getStatistics(): Map<String, Any> {
        val user = getCurrentUser()

        // Get total applications and count by status
        val totalApplications = repository.countByUser(user)
        
        // Count applications by each status using a map
        val statusCounts = ApplicationStatus.values().associate { status ->
            status.name to repository.countByUserAndStatus(user, status)
        }
        // Return statistics as a map
        return mapOf(
            "totalApplications" to totalApplications,
            "statusCounts" to statusCounts
        )
    }
}

// Thrown when a requested application ID does not exist in the database (mapped to 404)
class ApplicationNotFoundException(message: String) : RuntimeException(message)

// Thrown when the JWT principal cannot be resolved to a DB user, or when a user
// attempts to access an application that belongs to a different account (mapped to 403)
class UnauthorizedAccessException(message: String) : RuntimeException(message)
