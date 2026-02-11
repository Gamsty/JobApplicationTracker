package com.adrian.jobtracker.dto

import com.adrian.jobtracker.entity.Application
import com.adrian.jobtracker.entity.ApplicationStatus
import java.time.LocalDate
import java.time.LocalDateTime

// DTO for sending application data in responses
data class ApplicationResponse(
    val id: Long,
    val companyName: String,
    val positionTitle: String,
    val applicationDate: LocalDate,
    val status: ApplicationStatus,
    val jobUrl: String?,
    val notes: String?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
) {
    // Companion object for helper functions
    companion object {
        // Helper function to convert Entity to DTO
        fun fromEntity(application: Application): ApplicationResponse {
            return ApplicationResponse( // Map fields from Entity to DTO
                id = application.id!!, // Non-null assertion as ID is generated
                companyName = application.companyName,
                positionTitle = application.positionTitle,
                applicationDate = application.applicationDate,
                status = application.status,
                jobUrl = application.jobUrl,
                notes = application.notes,
                createdAt = application.createdAt,
                updatedAt = application.updatedAt
            )
        }
    }
}