package com.adrian.jobtracker.repository

import com.adrian.jobtracker.entity.Application
import com.adrian.jobtracker.entity.ApplicationStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.LocalDate

@Repository
interface ApplicationRepository : JpaRepository<Application, Long> {
    
    // Find all applications with a specific status
    fun findByStatus(status: ApplicationStatus): List<Application>
    // SELECT * FROM applications WHERE status = ?

    // Find all applications, ordered by application date descending
    fun findAllByOrderByApplicationDateDesc(): List<Application>
    // SELECT * FROM applications ORDER BY application_date DESC

    // Find applications by company name (case insensitive)
    fun findByCompanyNameIgnoreCase(companyName: String): List<Application>
    // SELECT * FROM applications WHERE LOWER(company_name) LIKE LOWER(?)

    // Find applications by position title (case insensitive)
    fun findByPositionTitleIgnoreCase(positionTitle: String): List<Application>
    // SELECT * FROM applications WHERE LOWER(position_title) LIKE LOWER(?)

    // Find applications between two application dates
    fun findByApplicationDateBetween(startDate: LocalDate, endDate: LocalDate): List<Application>
    // SELECT * FROM applications WHERE application_date BETWEEN ? AND ?

    // Count applications by status
    fun countByStatus(status: ApplicationStatus): Long
    // SELECT COUNT(*) FROM applications WHERE status = ?
}