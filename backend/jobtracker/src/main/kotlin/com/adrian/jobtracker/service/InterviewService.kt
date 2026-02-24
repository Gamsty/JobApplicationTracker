package com.adrian.jobtracker.service

import com.adrian.jobtracker.dto.InterviewRequest
import com.adrian.jobtracker.dto.InterviewResponse
import com.adrian.jobtracker.dto.InterviewSummary
import com.adrian.jobtracker.entity.Interview
import com.adrian.jobtracker.entity.InterviewStatus
import com.adrian.jobtracker.repository.ApplicationRepository
import com.adrian.jobtracker.repository.InterviewRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class InterviewService(
    private val interviewRepository: InterviewRepository,
    private val applicationRepository: ApplicationRepository,
    private val authService: AuthService
) {

    // Resolves the JWT principal to a database user ID.
    // Delegates to AuthService so this service never touches the SecurityContext directly.
    private fun getCurrentUserId() = authService.getCurrentUser().getId()

    // Get all interviews for a specific application
    fun getInterviewsByApplication(applicationId: Long): List<InterviewResponse> {
        val userId = getCurrentUserId()

        // Verify application exists before checking ownership
        val application = applicationRepository.findById(applicationId)
            .orElseThrow { ApplicationNotFoundException("Application with id $applicationId not found") }

        // Reject the request if the application belongs to a different account
        if (application.user.id != userId) {
            throw UnauthorizedAccessException("You don't have access to this application")
        }

        // Return interviews sorted by date ascending so the earliest round is first
        return interviewRepository.findByApplicationOrderByScheduledDateAsc(application)
            .map { InterviewResponse.fromEntity(it) }
    }

    // Get single interview by ID
    fun getInterviewById(id: Long): InterviewResponse {
        val userId = getCurrentUserId()
        val interview = interviewRepository.findById(id)
            .orElseThrow { InterviewNotFoundException("Interview with id $id not found") }

        // Ownership is verified through the parent application, not directly on the interview —
        // Interview has no user field; the user link is: interview → application → user
        if (interview.application.user.id != userId) {
            throw UnauthorizedAccessException("You don't have access to this interview")
        }

        return InterviewResponse.fromEntity(interview)
    }

    // Create new interview
    fun createInterview(request: InterviewRequest): InterviewResponse {
        val userId = getCurrentUserId()

        // Verify the target application exists and belongs to the current user
        val application = applicationRepository.findById(request.applicationId)
            .orElseThrow { ApplicationNotFoundException("Application with id ${request.applicationId} not found") }

        if (application.user.id != userId) {
            throw UnauthorizedAccessException("You don't have access to this application")
        }

        // Build the entity from the validated request and link it to its parent application
        val interview = Interview(
            application = application,
            round = request.round,
            scheduledDate = request.scheduledDate,
            status = request.status,
            interviewerName = request.interviewerName,
            interviewRole = request.interviewRole,
            format = request.format,
            location = request.location,
            notes = request.notes,
            feedback = request.feedback,
            rating = request.rating
        )

        val saved = interviewRepository.save(interview)
        return InterviewResponse.fromEntity(saved)
    }

    // Update interview
    fun updateInterview(id: Long, request: InterviewRequest): InterviewResponse {
        val userId = getCurrentUserId()

        val interview = interviewRepository.findById(id)
            .orElseThrow { InterviewNotFoundException("Interview with id $id not found") }

        // Ownership is verified through the parent application (Interview has no direct user field)
        if (interview.application.user.id != userId) {
            throw UnauthorizedAccessException("You don't have access to this interview")
        }

        // Overwrite every mutable field; updatedAt is set manually since there is no @PreUpdate hook
        interview.round = request.round
        interview.scheduledDate = request.scheduledDate
        interview.status = request.status
        interview.interviewerName = request.interviewerName
        interview.interviewRole = request.interviewRole
        interview.format = request.format
        interview.location = request.location
        interview.notes = request.notes
        interview.feedback = request.feedback
        interview.rating = request.rating
        interview.updatedAt = LocalDateTime.now()

        val updated = interviewRepository.save(interview)
        return InterviewResponse.fromEntity(updated)
    }

    // Delete interview
    fun deleteInterview(id: Long) {
        val userId = getCurrentUserId()

        val interview = interviewRepository.findById(id)
            .orElseThrow { InterviewNotFoundException("Interview with id $id not found") }

        // Ownership is verified through the parent application (Interview has no direct user field)
        if (interview.application.user.id != userId) {
            throw UnauthorizedAccessException("You don't have access to this interview")
        }

        interviewRepository.deleteById(id)
    }

    // Get upcoming interviews for current user
    fun getUpcomingInterviews(): List<InterviewResponse> {
        val userId = getCurrentUserId()
        val now = LocalDateTime.now()

        // Repository query filters to SCHEDULED status with scheduledDate in the future
        return interviewRepository.findUpcomingInterviewsByUser(userId, now)
            .map { InterviewResponse.fromEntity(it) }
    }

    // Get past interviews for current user
    fun getPastInterviews(): List<InterviewResponse> {
        val userId = getCurrentUserId()
        val now = LocalDateTime.now()

        // Repository query returns all interviews with scheduledDate in the past, any status
        return interviewRepository.findPastInterviewsByUser(userId, now)
            .map { InterviewResponse.fromEntity(it) }
    }

    // Get interview summary/statistics
    fun getInterviewSummary() : InterviewSummary {
        val userId = getCurrentUserId()
        val now = LocalDateTime.now()

        // Count each status bucket independently so the summary shows a breakdown
        val scheduled = interviewRepository.countByUserAndStatus(userId, InterviewStatus.SCHEDULED)
        val completed = interviewRepository.countByUserAndStatus(userId, InterviewStatus.COMPLETED)
        val cancelled = interviewRepository.countByUserAndStatus(userId, InterviewStatus.CANCELLED)
        val noShow    = interviewRepository.countByUserAndStatus(userId, InterviewStatus.NO_SHOW)
        val total = scheduled + completed + cancelled + noShow

        // Cap upcoming and recent lists to 5 each for the dashboard preview
        val upcoming = interviewRepository.findUpcomingInterviewsByUser(userId, now)
            .take(5)
            .map { InterviewResponse.fromEntity(it) }

        val recent = interviewRepository.findPastInterviewsByUser(userId, now)
            .take(5)
            .map { InterviewResponse.fromEntity(it) }

        return InterviewSummary(
            totalInterviews = total,
            scheduled = scheduled,
            completed = completed,
            cancelled = cancelled,
            upcomingInterviews = upcoming,
            recentInterviews = recent
        )
    }
}

// Thrown when a requested interview ID does not exist in the database (mapped to 404)
class InterviewNotFoundException(message: String) : RuntimeException(message)
