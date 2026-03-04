package com.adrian.jobtracker.controller

import com.adrian.jobtracker.dto.ReminderRequest
import com.adrian.jobtracker.dto.ReminderResponse
import com.adrian.jobtracker.dto.ReminderSummary
import com.adrian.jobtracker.service.EmailService
import com.adrian.jobtracker.service.ReminderService
import com.adrian.jobtracker.service.AuthService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

// Handles all reminder-related API endpoints under /api/reminders.
// CORS is configured globally in WebConfig — no @CrossOrigin needed here.
@RestController
@RequestMapping("/api/reminders")
class ReminderController(
    private val reminderService: ReminderService,
    private val emailService: EmailService,
    private val authService: AuthService
) {

    // POST /api/reminders — creates a new reminder for the authenticated user
    @PostMapping
    fun createReminder(
        @Valid @RequestBody request: ReminderRequest 
    ): ResponseEntity<ReminderResponse> {
        val reminder = reminderService.createReminder(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(reminder)
    }

    // GET /api/reminders — returns all reminders for the current user (including sent ones), sorted by soonest first
    @GetMapping
    fun getAllReminders(): ResponseEntity<List<ReminderResponse>> {
        val reminders = reminderService.getAllReminders()
        return ResponseEntity.ok(reminders)
    }

    // GET /api/reminders/pending — returns unsent, enabled, future reminders for the current user
    @GetMapping("/pending")
    fun getPendingReminders(): ResponseEntity<List<ReminderResponse>> {
        val reminders = reminderService.getPendingReminders()
        return ResponseEntity.ok(reminders)
    }

    // GET /api/reminders/{id} — returns a single reminder by ID (must be owned by current user)
    @GetMapping("/{id}")
    fun getReminderById(@PathVariable id: Long): ResponseEntity<ReminderResponse> {
        val reminder = reminderService.getReminderById(id)
        return ResponseEntity.ok(reminder)
    }

    // PUT /api/reminders/{id} — replaces all fields of an existing reminder (must not be sent yet)
    @PutMapping("/{id}")
    fun updateReminder(
        @PathVariable id: Long,
        @Valid @RequestBody request: ReminderRequest
    ): ResponseEntity<ReminderResponse> {
        val updated = reminderService.updateReminder(id, request)
        return ResponseEntity.ok(updated)
    }

    // DELETE /api/reminders/{id} — removes a reminder (must be owned by current user)
    @DeleteMapping("/{id}")
    fun deleteReminder(@PathVariable id: Long): ResponseEntity<Void> {
        reminderService.deleteReminder(id)
        return ResponseEntity.noContent().build()
    }

    // PATCH /api/reminders/{id}/toggle — flips the enabled flag without changing other fields
    @PatchMapping("/{id}/toggle")
    fun toggleReminder(@PathVariable id: Long): ResponseEntity<ReminderResponse> {
        val updated = reminderService.toggleReminder(id)
        return ResponseEntity.ok(updated)
    }

    // GET /api/reminders/summary — returns total, pending, sent counts and next 5 upcoming reminders
    @GetMapping("/summary")
    fun getReminderSummary(): ResponseEntity<ReminderSummary> {
        val summary = reminderService.getReminderSummary()
        return ResponseEntity.ok(summary)
    }

    // POST /api/reminders/test-email — sends a test email to the current user to verify email setup
    @PostMapping("/test-email")
    fun sendTestEmail(): ResponseEntity<Map<String, String>> {
        val user = authService.getCurrentUser()
        emailService.sendTestEmail(user.username, user.getFullName())
        return ResponseEntity.ok(mapOf("message" to "Test email sent successfully"))
    }
}
