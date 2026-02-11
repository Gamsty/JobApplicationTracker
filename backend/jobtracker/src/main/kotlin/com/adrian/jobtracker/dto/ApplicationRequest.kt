package com.adrian.jobtracker.dto

import com.adrian.jobtracker.entity.ApplicationStatus
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDate

// DTO for receiving application data in requests
data class ApplicationRequest (

    // Validation annotations to ensure data integrity
    @field:NotBlank(message = "Company name is required")
    @field:Size(max = 255, message = "Company name must be less than 255 characters")
    val companyName: String? = null,

    // Position title must be provided and cannot be blank
    @field:NotBlank(message = "Position title is required")
    @field:Size(max = 255, message = "Position title must be less than 255 characters")
    val positionTitle: String? = null,

    // Application date must be provided and cannot be null
    @field:NotNull(message = "Application date is required")
    val applicationDate: LocalDate? = null,

    // Status must be provided and cannot be null
    @field:NotNull(message = "Status is required")
    val status: ApplicationStatus? = null,

    // Job posting URL is optional but must be less than 500 characters if provided
    @field:Size(max = 500, message = "Job URL must be less than 500 characters")
    val jobUrl: String? = null,

    // Notes are optional and have no size constraint
    val notes: String? = null // No size constraint for notes
)