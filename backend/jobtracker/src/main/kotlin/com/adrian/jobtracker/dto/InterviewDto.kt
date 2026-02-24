package com.adrian.jobtracker.dto

import com.adrian.jobtracker.entity.Interview
import com.adrian.jobtracker.entity.InterviewFormat
import com.adrian.jobtracker.entity.InterviewStatus
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDateTime

// Incoming request body for creating or updating an interview.
// @field: prefix is required so Jakarta validation annotations target the backing field,
// not the constructor parameter (Kotlin-specific requirement).
data class InterviewRequest(
    @field:NotNull(message = "Application ID is required")
    val applicationId: Long, // ID of the application this interview belongs to

    @field:NotBlank(message = "Interview round is required")
    @field:Size(max = 100, message = "Round name must be less than 100 characters")
    val round: String, // e.g. "Phone Screen", "Technical", "Final Round"

    @field:NotNull(message = "Scheduled date is required")
    val scheduledDate: LocalDateTime, // Date and time of the interview

    @field:NotNull(message = "Status is required")
    val status: InterviewStatus, // Current state: SCHEDULED, COMPLETED, CANCELLED, NO_SHOW

    @field:Size(max = 100, message = "Interviewer name must be less than 100 characters")
    val interviewerName: String? = null, // Optional — name of the person conducting the interview

    @field:Size(max = 100, message = "Interviewer role must be less than 100 characters")
    val interviewRole: String? = null, // Optional — job title of the interviewer

    val format: InterviewFormat? = null, // Optional — IN_PERSON, VIDEO_CALL, PHONE_CALL, ASSESSMENT

    @field:Size(max = 500, message = "Location must be less than 500 characters")
    val location: String? = null, // Optional — office address or video call link

    val notes: String? = null, // Optional — preparation notes before the interview

    val feedback: String? = null, // Optional — reflection or feedback received after the interview

    @field:Min(value = 1, message = "Rating must be between 1 and 5")
    @field:Max(value = 5, message = "Rating must be between 1 and 5")
    val rating: Int? = null // Optional — self-assessed score 1–5 on how the interview went
)

// Outgoing response body returned to the client after creating, updating, or fetching an interview.
// Includes denormalised application fields (company, position) so the frontend
// doesn't need a separate request to display context alongside the interview.
data class InterviewResponse(
    val id: Long,
    val applicationId: Long,
    val applicationCompany: String,   // Denormalised from Application for convenient display
    val applicationPosition: String,  // Denormalised from Application for convenient display
    val round: String,
    val scheduledDate: LocalDateTime,
    val status: InterviewStatus,
    val interviewerName: String?,
    val interviewRole: String?,
    val format: InterviewFormat?,
    val location: String?,
    val notes: String?,
    val feedback: String?,
    val rating: Int?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
) {
    companion object {
        // Maps an Interview entity to the response DTO.
        // Accesses application fields directly — caller must ensure the Application
        // is loaded (not a detached lazy proxy) before calling this.
        fun fromEntity(interview: Interview): InterviewResponse {
            return InterviewResponse(
                id = interview.id!!,
                applicationId = interview.application.id!!,
                applicationCompany = interview.application.companyName,
                applicationPosition = interview.application.positionTitle,
                round = interview.round,
                scheduledDate = interview.scheduledDate,
                status = interview.status,
                interviewerName = interview.interviewerName,
                interviewRole = interview.interviewRole,
                format = interview.format,
                location = interview.location,
                notes = interview.notes,
                feedback = interview.feedback,
                rating = interview.rating,
                createdAt = interview.createdAt,
                updatedAt = interview.updatedAt
            )
        }
    }
}

// Aggregated interview statistics returned by the summary endpoint.
// Used by the Dashboard to display counts and the next upcoming / most recent interviews.
data class InterviewSummary(
    val totalInterviews: Long,
    val scheduled: Long,
    val completed: Long,
    val cancelled: Long,
    val upcomingInterviews: List<InterviewResponse>, // Next interviews sorted soonest-first
    val recentInterviews: List<InterviewResponse>,    // Past interviews sorted most-recent-first
)
