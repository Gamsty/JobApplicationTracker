package com.adrian.jobtracker.dto

import com.adrian.jobtracker.entity.ApplicationStatus
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDate

data class ApplicationRequest (
    @field:NotBlank(message = "Company name is required")
    @field:Size(max = 255, message = "Company name must be less than 255 characters")
    val companyName: String,

    @field:NotBlank(message = "Position title is required")
    @field:Size(max = 255, message = "Position title must be less than 255 characters")
    val positionTitle: String,

    @field:NotNull(message = "Application date is required")
    val applicationDate: LocalDate,

    @field:NotNull(message = "Status is required")
    val status: ApplicationStatus,

    @field:Size(max = 500, message = "Job URL must be less than 500 characters")
    val jobPostingUrl: String? = null,

    val notes: String? = null // No size constraint for notes
)