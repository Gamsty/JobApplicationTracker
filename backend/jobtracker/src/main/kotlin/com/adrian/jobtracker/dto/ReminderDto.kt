package com.adrian.jobtracker.dto

import com.adrian.jobtracker.entity.Reminder
import com.adrian.jobtracker.entity.ReminderType
import jakarta.validation.constraints.Future
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDateTime

// Incoming request body for creating or updating a reminder
data class ReminderRequest(
    // Optional links — a reminder can be tied to an application, interview, both, or neither
    val applicationId: Long? = null,
    val interviewId: Long? = null,

    @field:NotNull(message = "Reminder type is required")
    val reminderType: ReminderType,

    @field:NotBlank(message = "Title is required")
    @field:Size(max = 255, message = "Title must be less than 255 characters")
    val title: String,

    // Optional longer description shown in the email body
    val message: String? = null,

    @field:NotNull(message = "Scheduled time is required")
    @field:Future(message = "Reminder must be scheduled for a future time")
    val scheduledFor: LocalDateTime,

    // Defaults to enabled — user can create a disabled reminder and enable it later
    val enabled: Boolean = true
)

// Outgoing response returned to the frontend after creating, fetching, or updating a reminder
data class ReminderResponse(
    val id: Long,
    val applicationId: Long?,           // null if not linked to an application
    val applicationCompany: String?,    // company name from the linked application, for display
    val interviewId: Long?,             // null if not linked to an interview
    val interviewRound: String?,        // round name from the linked interview, for display
    val reminderType: ReminderType,
    val title: String,
    val message: String?,
    val scheduledFor: LocalDateTime,
    val sent: Boolean,                  // true once the scheduler has processed and sent the email
    val sentAt: LocalDateTime?,         // null until the email is actually sent
    val enabled: Boolean,
    val createdAt: LocalDateTime
) {
    companion object {                  
        // Converts a Reminder entity into a ReminderResponse for the API
        fun fromEntity(reminder: Reminder): ReminderResponse {
            return ReminderResponse(
                id = reminder.id!!,
                applicationId = reminder.application?.id,
                applicationCompany = reminder.application?.companyName,
                interviewId = reminder.interview?.id,
                interviewRound = reminder.interview?.round,
                reminderType = reminder.reminderType,
                title = reminder.title,
                message = reminder.message,
                scheduledFor = reminder.scheduledFor,
                sent = reminder.sent,
                sentAt = reminder.sentAt,
                enabled = reminder.enabled,
                createdAt = reminder.createdAt
            )
        }
    }
}

// Aggregated reminder stats returned on the dashboard or settings page
data class ReminderSummary(
    val totalReminders: Long,       // all reminders ever created
    val pendingReminders: Long,     // unsent, enabled, scheduled in the future
    val sentReminders: Long,        // already processed by the scheduler
    val upcomingReminders: List<ReminderResponse>,   // next N reminders due soon
)
