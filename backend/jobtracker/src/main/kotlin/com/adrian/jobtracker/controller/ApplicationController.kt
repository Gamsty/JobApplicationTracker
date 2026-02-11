package com.adrian.jobtracker.controller

import com.adrian.jobtracker.dto.ApplicationRequest
import com.adrian.jobtracker.dto.ApplicationResponse
import com.adrian.jobtracker.entity.ApplicationStatus
import com.adrian.jobtracker.service.ApplicationService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController // Marks this class as a REST controller, allowing it to handle HTTP requests and return JSON responses
@RequestMapping("/api/applications") // Base path for all application-related endpoints
class ApplicationController( 
    private val applicationService: ApplicationService
) {

    // GET /api/applications - Get all applications, optionally filtered by status
    @GetMapping // Handles GET requests to /api/applications, with an optional 'status' query parameter for filtering applications by their status
    fun getAllApplications(
        @RequestParam(required = false) status: ApplicationStatus?
    ): ResponseEntity<List<ApplicationResponse>> {
        val applications = if (status != null) {
            applicationService.getApplicationsByStatus(status) // If a status is provided, filter applications by that status; otherwise, return all applications
        } else {
            applicationService.getAllApplications()
        }
        return ResponseEntity.ok(applications) // Return the list of applications with a 200 OK status
    }

    // GET /api/applications/{id} - Get a single application by ID
    @GetMapping("/{id}") // Handles GET requests to /api/applications/{id}, where {id} is a path variable representing the ID of the application to retrieve
    fun getApplicationById(@PathVariable id: Long): ResponseEntity<ApplicationResponse> {
        val application = applicationService.getApplicationById(id) // Retrieve the application by ID using the service layer; if not found, an ApplicationNotFoundException will be thrown and handled by the GlobalExceptionHandler
        return ResponseEntity.ok(application)
    }

    // POST /api/applications - Create a new application
    @PostMapping // Handles POST requests to /api/applications, expecting a JSON body that will be mapped to an ApplicationRequest object
    fun createApplication(
        // The @Valid annotation triggers validation of the request body based on constraints defined in the ApplicationRequest class (e.g., @NotBlank, @Size). If validation fails, a MethodArgumentNotValidException will be thrown and handled by the GlobalExceptionHandler.
        @Valid @RequestBody request: ApplicationRequest
    ): ResponseEntity<ApplicationResponse> {
        val created = applicationService.createApplication(request) // Create a new application using the service layer, which will return the created application as an ApplicationResponse object
        return ResponseEntity.status(HttpStatus.CREATED).body(created) // Return the created application with a 201 Created status
    }

    // PUT /api/applications/{id} - Update an existing application
    @PutMapping("/{id}") // Handles PUT requests to /api/applications/{id}, where {id} is a path variable representing the ID of the application to update, and expects a JSON body that will be mapped to an ApplicationRequest object
    fun updateApplication(
        @PathVariable id: Long, // The ID of the application to update, extracted from the URL path
        @Valid @RequestBody request: ApplicationRequest
    ): ResponseEntity<ApplicationResponse> {
        val updated = applicationService.updateApplication(id, request) // Update the application using the service layer, which will return the updated application as an ApplicationResponse object; if the application with the given ID does not exist, an ApplicationNotFoundException will be thrown and handled by the GlobalExceptionHandler
        return ResponseEntity.ok(updated)
    }

    // DELETE /api/applications/{id} - Delete an application
    @DeleteMapping("/{id}") // Handles DELETE requests to /api/applications/{id}, where {id} is a path variable representing the ID of the application to delete
    fun deleteApplication(@PathVariable id: Long): ResponseEntity<Void> {
        applicationService.deleteApplication(id) // Delete the application using the service layer; if the application with the given ID does not exist, an ApplicationNotFoundException will be thrown and handled by the GlobalExceptionHandler
        return ResponseEntity.noContent().build() // Return a 204 No Content status to indicate successful deletion without returning any content in the response body
    } 

    // GET /api/applications/search?company= - Search by company name
    @GetMapping("/search") // Handles GET requests to /api/applications/search with a required 'company' query parameter for searching applications by company name
    fun searchByCompanyName(
        @RequestParam company: String
    ): ResponseEntity<List<ApplicationResponse>> {
        val results = applicationService.searchApplicationsByCompanyName(company) // Search for applications by company name using the service layer, which will return a list of matching applications as ApplicationResponse objects
        return ResponseEntity.ok(results)
    }

    // GET /api/applications/statistics - Get application statistics
    @GetMapping("/statistics") // Handles GET requests to /api/applications/statistics, which will return various statistics about the applications (e.g., total count, count by status) as a JSON object
    fun getStatistics(): ResponseEntity<Map<String, Any>> {
        val stats = applicationService.getStatistics() // Retrieve application statistics using the service layer, which will return a map containing various statistics about the applications (e.g., total count, count by status)
        return ResponseEntity.ok(stats)
    }
}
