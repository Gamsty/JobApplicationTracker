package com.adrian.jobtracker.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "reminders")
data class Reminder(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    // The user this reminder belongs to
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User,

    // Optional — linked to a specific job application
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id")
    var application: Application? = null,       

    // Optional — linked to a specific interview
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id")
    var interview: Interview? = null,           

    // Determines how the reminder is categorized and triggered
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    var reminderType: ReminderType,

    // Short title shown in the notification
    @Column(nullable = false, length = 255)
    var title: String,

    // Optional longer message body
    @Column(columnDefinition = "TEXT")          
    var message: String? = null,

    // When the reminder should fire
    @Column(nullable = false)
    var scheduledFor: LocalDateTime,

    // Whether the reminder has been sent — false until the scheduler processes it
    @Column(nullable = false)
    var sent: Boolean = false,                 

    // Timestamp of when the reminder was actually sent
    @Column
    var sentAt: LocalDateTime? = null,

    // Allows disabling a reminder without deleting it
    @Column(nullable = false)
    var enabled: Boolean = true,

    @Column(nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    // Automatically keeps updatedAt in sync on every DB update
    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

// All supported reminder categories
enum class ReminderType {
    FOLLOW_UP,              // Remind user to follow up on an application
    INTERVIEW_UPCOMING,     // Alert before an upcoming interview
    APPLICATION_DEADLINE,   // Deadline approaching for an application
    CUSTOM                  // User-defined reminder
}
