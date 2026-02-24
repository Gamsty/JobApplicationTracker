package com.adrian.jobtracker.repository

import com.adrian.jobtracker.entity.Application
import com.adrian.jobtracker.entity.Interview
import com.adrian.jobtracker.entity.InterviewStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
interface InterviewRepository : JpaRepository<Interview, Long> {

    // No @Query needed — Spring Data JPA derives the SQL from the method name:
    // SELECT * FROM interviews WHERE application_id = ? ORDER BY scheduled_date ASC
    fun findByApplicationOrderByScheduledDateAsc(application: Application): List<Interview>

    // No @Query needed — Spring Data JPA derives the SQL from the method name:
    // SELECT * FROM interviews WHERE application_id = ? AND status = ?
    fun findByApplicationAndStatus(application: Application, status: InterviewStatus): List<Interview> // Fixed: 'fund' typo + 'stauts' parameter typo

    // @Query required — navigates through a relationship join (interview → application → user)
    // which cannot be expressed as a plain method name.
    // Returns only SCHEDULED interviews in the future, sorted soonest-first.
    @Query("SELECT i FROM Interview i WHERE i.application.user.id = :userId AND i.status = 'SCHEDULED' AND i.scheduledDate > :now ORDER BY i.scheduledDate ASC")
    fun findUpcomingInterviewsByUser(@Param("userId") userId: Long, @Param("now") now: LocalDateTime): List<Interview>

    // @Query required — same cross-relationship join as above.
    // Returns all interviews in the past regardless of status, sorted most-recent-first.
    @Query("SELECT i FROM Interview i WHERE i.application.user.id = :userId AND i.scheduledDate < :now ORDER BY i.scheduledDate DESC")
    fun findPastInterviewsByUser(@Param("userId") userId: Long, @Param("now") now: LocalDateTime): List<Interview>

    // No @Query needed — Spring Data JPA derives the SQL from the method name:
    // SELECT COUNT(*) FROM interviews WHERE application_id = ?
    fun countByApplication(application: Application): Long

    // @Query required — counts across a relationship join (interview → application → user)
    // which cannot be expressed as a plain method name.
    @Query("SELECT COUNT(i) FROM Interview i WHERE i.application.user.id = :userId AND i.status = :status")
    fun countByUserAndStatus(@Param("userId") userId: Long, @Param("status") status: InterviewStatus): Long
}
