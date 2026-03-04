package com.adrian.jobtracker.service

import com.adrian.jobtracker.exception.ApplicationNotFoundException
import com.adrian.jobtracker.exception.InterviewNotFoundException
import com.adrian.jobtracker.exception.ReminderNotFoundException
import com.adrian.jobtracker.exception.UnauthorizedAccessException
import com.adrian.jobtracker.dto.ReminderRequest
import com.adrian.jobtracker.dto.ReminderResponse
import com.adrian.jobtracker.dto.ReminderSummary
import com.adrian.jobtracker.entity.Reminder
import com.adrian.jobtracker.repository.ApplicationRepository
import com.adrian.jobtracker.repository.InterviewRepository
import com.adrian.jobtracker.repository.ReminderRepository
import com.adrian.jobtracker.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class ReminderService(                                              
    private val reminderRepository: ReminderRepository,
    private val userRepository: UserRepository,
    private val applicationRepository: ApplicationRepository,       
    private val interviewRepository: InterviewRepository,
    private val authService: AuthService
) {

    // Returns the current authenticated user's ID from the security context
    private fun getCurrentUserId() = authService.getCurrentUser().getId()

    // Fetches the full User entity for the currently authenticated user
    private fun getCurrentUser() = userRepository.findById(getCurrentUserId())
        .orElseThrow { RuntimeException("User not found") }

    // Creates a new reminder, optionally linked to an application and/or interview
    fun createReminder(request: ReminderRequest): ReminderResponse {
        val user = getCurrentUser()

        // Fetch and verify ownership of the linked application (if provided)
        val application = request.applicationId?.let { appId ->
            applicationRepository.findById(appId)
                .orElseThrow { ApplicationNotFoundException("Application with id $appId not found") }
                .also { app ->
                    if (app.user.id != user.id) {
                        throw UnauthorizedAccessException("You don't have access to this application")
                    }
                }
        }

        // Fetch and verify ownership of the linked interview (if provided)
        val interview = request.interviewId?.let { intId ->            
            interviewRepository.findById(intId)
                .orElseThrow { InterviewNotFoundException("Interview with id $intId not found") }
                .also { interview ->
                    if (interview.application.user.id != user.id) {
                        throw UnauthorizedAccessException("You don't have access to this interview")
                    }
                }
        }

        val reminder = Reminder(
            user = user,
            application = application,
            interview = interview,
            reminderType = request.reminderType,
            title = request.title,
            message = request.message,
            scheduledFor = request.scheduledFor,
            enabled = request.enabled
        )

        val saved = reminderRepository.save(reminder)
        return ReminderResponse.fromEntity(saved)
    }

    // Returns all reminders for the current user, sorted by soonest first
    fun getAllReminders(): List<ReminderResponse> {
        val user = getCurrentUser()
        return reminderRepository.findByUserOrderByScheduledForAsc(user)
            .map { ReminderResponse.fromEntity(it) }
    }

    // Returns only unsent, enabled, future reminders for the current user
    fun getPendingReminders(): List<ReminderResponse> {             
        val userId = getCurrentUserId()
        val now = LocalDateTime.now()
        return reminderRepository.findPendingRemindersByUser(userId, now)
            .map { ReminderResponse.fromEntity(it) }
    }

    // Returns a single reminder by ID — throws if not found or not owned by current user
    fun getReminderById(id: Long): ReminderResponse {
        val userId = getCurrentUserId()

        val reminder = reminderRepository.findById(id)
            .orElseThrow { ReminderNotFoundException("Reminder with id $id not found") }

        if (reminder.user.id != userId) {
            throw UnauthorizedAccessException("You don't have access to this reminder")
        }

        return ReminderResponse.fromEntity(reminder)
    }

    // Updates a reminder's fields — only allowed if the reminder has not been sent yet
    fun updateReminder(id: Long, request: ReminderRequest): ReminderResponse {
        val userId = getCurrentUserId()

        val reminder = reminderRepository.findById(id)
            .orElseThrow { ReminderNotFoundException("Reminder with id $id not found") }

        if (reminder.user.id != userId) {
            throw UnauthorizedAccessException("You don't have access to this reminder")
        }

        // Prevent editing reminders that have already been sent
        if (reminder.sent) {
            throw IllegalStateException("Cannot update a reminder that has already been sent") // Bug fix 6: was "IlligalStateException"
        }

        // Fetch and verify ownership of the new application link (if the field changed)
        val application = request.applicationId?.let { appId ->
            applicationRepository.findById(appId)
                .orElseThrow { ApplicationNotFoundException("Application with id $appId not found") }
                .also { app ->
                    if (app.user.id != userId) {
                        throw UnauthorizedAccessException("You don't have access to this application")
                    }
                }
        }

        reminder.reminderType = request.reminderType
        reminder.title = request.title
        reminder.message = request.message
        reminder.scheduledFor = request.scheduledFor
        reminder.enabled = request.enabled
        reminder.application = application   // null clears the link; non-null sets a new one
        reminder.updatedAt = LocalDateTime.now()

        val updated = reminderRepository.save(reminder)
        return ReminderResponse.fromEntity(updated)
    }

    // Deletes a reminder — only allowed if owned by the current user
    fun deleteReminder(id: Long) {
        val userId = getCurrentUserId()

        val reminder = reminderRepository.findById(id)
            .orElseThrow { ReminderNotFoundException("Reminder with id $id not found") }

        if (reminder.user.id != userId) {
            throw UnauthorizedAccessException("You don't have access to this reminder")
        }

        reminderRepository.deleteById(id)
    }

    // Toggles a reminder between enabled and disabled — only allowed if not yet sent
    fun toggleReminder(id: Long): ReminderResponse {
        val userId = getCurrentUserId()

        val reminder = reminderRepository.findById(id)
            .orElseThrow { ReminderNotFoundException("Reminder with id $id not found") }

        if (reminder.user.id != userId) {
            throw UnauthorizedAccessException("You don't have access to this reminder")
        }

        if (reminder.sent) {
            throw IllegalStateException("Cannot toggle a reminder that has already been sent") // Bug fix 8: was "IlligalStateException"
        }

        reminder.enabled = !reminder.enabled
        reminder.updatedAt = LocalDateTime.now()

        val updated = reminderRepository.save(reminder)
        return ReminderResponse.fromEntity(updated)                
    }

    // Returns aggregated reminder stats — used for dashboard badges and summary views
    fun getReminderSummary(): ReminderSummary {
        val user = getCurrentUser()                                
        val now = LocalDateTime.now()

        val allReminders = reminderRepository.findByUserOrderByScheduledForAsc(user)

        // Take the next 5 upcoming pending reminders for the summary list
        val upcomingPending = reminderRepository.findPendingRemindersByUser(user.id!!, now)                         
            .take(5)
            .map { ReminderResponse.fromEntity(it) }

        val total = allReminders.size.toLong()
        val pendingCount = allReminders.count { !it.sent && it.enabled && it.scheduledFor > now }.toLong()
        val sentCount = allReminders.count { it.sent }.toLong()

        return ReminderSummary(
            totalReminders = total,
            pendingReminders = pendingCount,
            sentReminders = sentCount,
            upcomingReminders = upcomingPending
        )
    }
}
