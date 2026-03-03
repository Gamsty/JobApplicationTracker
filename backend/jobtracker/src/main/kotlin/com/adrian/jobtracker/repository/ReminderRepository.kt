package com.adrian.jobtracker.repository

import com.adrian.jobtracker.entity.Reminder
import com.adrian.jobtracker.entity.ReminderType
import com.adrian.jobtracker.entity.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
interface ReminderRepository : JpaRepository<Reminder, Long> {

    // Returns all reminders for a user, sorted by soonest first
    fun findByUserOrderByScheduledForAsc(user: User): List<Reminder>

    // Used by the scheduler to find ALL reminders that are due across all users —
    // returns unsent, enabled reminders whose scheduled time has arrived
    @Query("SELECT r FROM Reminder r WHERE r.sent = false AND r.enabled = true AND r.scheduledFor <= :now ORDER BY r.scheduledFor ASC")
    fun findRemindersToSend(now: LocalDateTime): List<Reminder> 

    // Returns all reminders of a specific type for a user (e.g. all FOLLOW_UP reminders)
    fun findByUserAndReminderType(user: User, reminderType: ReminderType): List<Reminder>

    // Returns all reminders linked to a specific job application
    @Query("SELECT r FROM Reminder r WHERE r.application.id = :applicationId ORDER BY r.scheduledFor ASC")
    fun findByApplicationId(applicationId: Long): List<Reminder>

    // Returns all reminders linked to a specific interview
    @Query("SELECT r FROM Reminder r WHERE r.interview.id = :interviewId ORDER BY r.scheduledFor ASC")
    fun findByInterviewId(interviewId: Long): List<Reminder>

    // Returns how many unsent, enabled, future reminders a user has — used for dashboard badge counts
    @Query("SELECT COUNT(r) FROM Reminder r WHERE r.user.id = :userId AND r.sent = false AND r.enabled = true AND r.scheduledFor > :now")
    fun countPendingRemindersByUser(userId: Long, now: LocalDateTime): Long
}
