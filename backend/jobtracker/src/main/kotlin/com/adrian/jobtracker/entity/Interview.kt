package com.adrian.jobtracker.entity

import jakarta.persistence.*
import java.time.LocalDateTime

// Represents a single interview round tied to a job application.
// One application can have many interviews (e.g. phone screen → technical → final).
@Entity
@Table(name = "interviews")
data class Interview(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null, // Auto-generated primary key

    // Many interviews belong to one application — stores application_id as a foreign key.
    // LAZY loading means the Application is not fetched unless explicitly accessed.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    var application: Application, 

    @Column(nullable = false, length = 100)
    var round: String, // Interview round label e.g. "Phone Screen", "Technical", "Final Round"

    @Column(nullable = false)
    var scheduledDate: LocalDateTime, // Date and time the interview is scheduled for

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    var status: InterviewStatus,

    @Column(length = 100)
    var interviewerName: String? = null, // Name of the person conducting the interview

    @Column(length = 100)
    var interviewRole: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    var format: InterviewFormat? = null, // How the interview is conducted (in-person, video, phone)

    @Column(length = 500)
    var location: String? = null, // Physical address or video call link

    @Column(columnDefinition = "TEXT")
    var notes: String? = null,

    @Column(columnDefinition = "TEXT")
    var feedback: String? = null,

    @Column
    var rating: Int? = null, // Self-assessed rating 1–5 on how the interview went

    @Column(nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(), // Set once on creation, never changed

    @Column(nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
) {
    // Automatically updates the timestamp whenever Hibernate saves a changed entity
    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

// Tracks where the interview process currently stands
enum class InterviewStatus {
    SCHEDULED,   // Interview is booked but hasn't happened yet
    COMPLETED,   // Interview took place
    CANCELLED,   // Interview was called off
    NO_SHOW      // Candidate or interviewer didn't attend
}

// How the interview was / will be conducted
enum class InterviewFormat {
    IN_PERSON,   // On-site at the company office
    VIDEO_CALL,  // Remote via Zoom, Teams, Meet, etc.
    PHONE_CALL,  // Audio-only call
    ASSESSMENT   // Take-home or online assessment
}
