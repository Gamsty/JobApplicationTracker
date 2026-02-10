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
        return repository.findAllByOrderByApplicationDateDesc()
            .map { ApplicationResponse.fromEntity(it) }
    }

    // Get applications filtered by status
    fun getApplicationsByStatus(status: ApplicationStatus): List<ApplicationResponse> {
        return repository.findByStatus(status)
            .map { ApplicationResponse.fromEntity(it) }
    }

    // Get single application by ID
    fun getApplicationById(id: Long): ApplicationResponse {
        val application = repository.findById(id)
            .orElseThrow { ApplicationNotFoundException("Application with ID $id not found") }
        return ApplicationResponse.fromEntity(application)
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

        val savedApplication = repository.save(application)
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

        val updatedApplication = repository.save(application)
        return ApplicationResponse.fromEntity(updatedApplication)
    }

    // Delete an application by ID
    fun deleteApplication(id: Long) {
        if (!repository.existsById(id)) {
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
        val totalApplications = repository.count()
        val statusCounts = ApplicationStatus.values().associate { status ->
            status.name to repository.countByStatus(status)
        }

        return mapOf(
            "totalApplications" to totalApplications,
            "statusCounts" to statusCounts
        )
    }
}

// Custom exception for not found entities
class ApplicationNotFoundException(message: String) : RuntimeException(message)