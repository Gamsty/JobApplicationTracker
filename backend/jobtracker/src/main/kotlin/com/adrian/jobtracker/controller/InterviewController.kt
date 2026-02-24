package com.adrian.jobtracker.controller

import com.adrian.jobtracker.dto.InterviewRequest
import com.adrian.jobtracker.dto.InterviewResponse
import com.adrian.jobtracker.dto.InterviewSummary
import com.adrian.jobtracker.service.InterviewService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

// Exposes all interview CRUD and query endpoints under /api/interviews.
// @CrossOrigin allows requests from the local dev server and the deployed frontend.
// Ownership checks (does this interview belong to the current user?) are enforced
// in InterviewService — this controller only routes and delegates.
@RestController
@RequestMapping("/api/interviews")
@CrossOrigin(origins = ["http://localhost:5173", "https://job-tracker.vercel.app"])
class InterviewController(
    private val interviewService: InterviewService
) {

    // GET /api/interviews/application/{applicationId}
    // Returns all interviews for one application, sorted by scheduled date ascending.
    // The service verifies that the application belongs to the current user before returning data.
    @GetMapping("/application/{applicationId}")
    fun getInterviewsByApplication(
        @PathVariable applicationId: Long
    ) : ResponseEntity<List<InterviewResponse>> {
        val interviews = interviewService.getInterviewsByApplication(applicationId)
        return ResponseEntity.ok(interviews)
    }

    // GET /api/interviews/{id}
    // Returns a single interview by its own ID.
    // The service verifies ownership through the parent application before returning.
    @GetMapping("/{id}")
    fun getInterviewById(@PathVariable id: Long): ResponseEntity<InterviewResponse> {
        val interview = interviewService.getInterviewById(id)
        return ResponseEntity.ok(interview)
    }

    // POST /api/interviews
    // Creates a new interview round linked to an existing application.
    // @Valid triggers Jakarta Bean Validation on the request body (e.g. @NotBlank, @NotNull).
    // Returns 201 Created with the saved interview in the response body.
    @PostMapping
    fun createInterview(
        @Valid @RequestBody request: InterviewRequest
    ): ResponseEntity<InterviewResponse> {
        val created = interviewService.createInterview(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(created)
    }

    // PUT /api/interviews/{id}
    // Replaces all mutable fields of an existing interview.
    // @Valid triggers Jakarta Bean Validation on the request body before the service is called.
    // Returns 200 OK with the updated interview in the response body.
    @PutMapping("/{id}")
    fun updateInterview(
        @PathVariable id: Long,
        @Valid @RequestBody request: InterviewRequest
    ): ResponseEntity<InterviewResponse> {
        val updated = interviewService.updateInterview(id, request)
        return ResponseEntity.ok(updated)
    }

    // DELETE /api/interviews/{id}
    // Deletes the interview if it belongs to the current user.
    // Returns 204 No Content on success (no body needed after a delete).
    @DeleteMapping("/{id}")
    fun deleteInterview(
        @PathVariable id: Long
    ): ResponseEntity<Void> {
        interviewService.deleteInterview(id)
        return ResponseEntity.noContent().build()
    }

    // GET /api/interviews/upcoming
    // Returns SCHEDULED interviews whose date is in the future, sorted soonest-first.
    // Useful for the dashboard "next interviews" widget.
    @GetMapping("/upcoming")
    fun getUpcomingInterviews(): ResponseEntity<List<InterviewResponse>> {
        val interviews = interviewService.getUpcomingInterviews()
        return ResponseEntity.ok(interviews)
    }

    // GET /api/interviews/past
    // Returns all interviews whose date is in the past (any status), sorted most-recent-first.
    @GetMapping("/past")
    fun getPastInterviews(): ResponseEntity<List<InterviewResponse>> {
        val interviews = interviewService.getPastInterviews()
        return ResponseEntity.ok(interviews)
    }

    // GET /api/interviews/summary
    // Returns aggregated statistics: counts per status plus the next 5 upcoming
    // and the 5 most recent past interviews. Used by the dashboard summary card.
    @GetMapping("/summary")
    fun getInterviewSummary(): ResponseEntity<InterviewSummary> {
        val summary = interviewService.getInterviewSummary()
        return ResponseEntity.ok(summary)
    }
}
