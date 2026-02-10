package com.adrian.jobtracker.service

import com.adrian.jobtracker.dto.ApplicationRequest
import com.adrian.jobtracker.dto.ApplicationResponse
import com.adrian.jobtracker.entity.ApplicationStatus
import com.adrian.jobtracker.entity.Application
import com.adrian.jobtracker.repository.ApplicationRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
// Service class for managing job applications
class ApplicationService(
    private val repository: ApplicationRepository
) {
    // Get all applications
    fun getAllApplications(): List<ApplicationResponse> {
        return repository.findAllByOrderByApplicationDateDesc() // Fetch all applications ordered by application date descending
            .map { ApplicationResponse.fromEntity(it) } // Convert each application entity to a response DTO
    }

    // Get applications filtered by status
    fun getApplicationsByStatus(status: ApplicationStatus): List<ApplicationResponse> {
        return repository.findByStatus(status) // Fetch applications with the specified status
            .map { ApplicationResponse.fromEntity(it) } // Convert each application entity to a response DTO
    }

    // Get single application by ID
    fun getApplicationById(id: Long): ApplicationResponse {
        val application = repository.findById(id)
            .orElseThrow { ApplicationNotFoundException("Application with ID $id not found") }
        return ApplicationResponse.fromEntity(application) // Convert the application entity to a response DTO
    }

    // Create a new application
    fun createApplication(request: ApplicationRequest): ApplicationResponse {
        val application = Application(
            companyName = request.companyName,
            positionTitle = request.positionTitle,
            applicationDate = request.applicationDate,
            status = request.status,
            jobPostingUrl = request.jobPostingUrl,
            notes = request.notes
        )

        val savedApplication = repository.save(application) // Save the new application to the database
        return ApplicationResponse.fromEntity(savedApplication)
    }

    // Update an existing application
    fun updateApplication(id: Long, request: ApplicationRequest): ApplicationResponse {
        val application = repository.findById(id)
            .orElseThrow { ApplicationNotFoundException("Application with ID $id not found") }

        // Update fields
        application.companyName = request.companyName
        application.positionTitle = request.positionTitle
        application.applicationDate = request.applicationDate
        application.status = request.status
        application.jobPostingUrl = request.jobPostingUrl
        application.notes = request.notes
        application.updatedAt = LocalDateTime.now()

        val updatedApplication = repository.save(application) // Save the updated application to the database
        return ApplicationResponse.fromEntity(updatedApplication)
    }

    // Delete an application by ID
    fun deleteApplication(id: Long) {
        if (!repository.existsById(id)) { // Check if application exists before deleting
            throw ApplicationNotFoundException("Application with ID $id not found")
        }
        repository.deleteById(id)
    }

    // Search applications by company name
    fun searchApplicationsByCompanyName(companyName: String): List<ApplicationResponse> {
        return repository.findByCompanyNameIgnoreCase(companyName)
            .map { ApplicationResponse.fromEntity(it) }
    }

    // Get statictics
    fun getStatistics(): Map<String, Any> {
        // Get total applications and count by status
        val totalApplications = repository.count()
        
        // Count applications by each status using a map
        val statusCounts = ApplicationStatus.values().associate { status ->
            status.name to repository.countByStatus(status)
        }
        // Return statistics as a map
        return mapOf(
            "totalApplications" to totalApplications,
            "statusCounts" to statusCounts
        )
    }
}

// Custom exception for not found entities
class ApplicationNotFoundException(message: String) : RuntimeException(message)