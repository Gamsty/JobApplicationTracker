package com.adrian.jobtracker.entity

import java.time.LocalDate
import java.time.LocalDateTime
import jakarta.persistence.*

@Entity
@Table(name = "applications", 
indexes = [
    Index(name = "idx_company_name", columnList = "companyName"),
    Index(name = "idx_position_title", columnList = "positionTitle"),
    Index(name = "idx_status", columnList = "status"),
    Index(name = "idx_application_date", columnList = "applicationDate")
]
)
data class Application(

    @Id // Primary key annotation
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null, // Application ID. Nullable because auto generated

    @Column(nullable = false)
    var companyName: String, // Company name

    @Column(nullable = false)
    var positionTitle: String, // Job position title

    @Column(nullable = false)
    var applicationDate: LocalDate, // Date of application

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    var status: ApplicationStatus, // Application status

    @Column(columnDefinition = "TEXT", length = 1000)
    var notes: String? = null, // Additional notes

    @Column(length = 500)
    var jobPostingUrl: String? = null, // URL of the job posting

    @Column(nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(), // Timestamp of creation

    @Column(nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(), // Timestamp of last update
) {
    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now() // Update the timestamp on every update
    }
}