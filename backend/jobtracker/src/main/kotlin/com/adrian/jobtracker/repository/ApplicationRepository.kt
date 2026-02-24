package com.adrian.jobtracker.repository

import com.adrian.jobtracker.entity.Application
import com.adrian.jobtracker.entity.ApplicationStatus
import com.adrian.jobtracker.entity.User
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
    fun findByCompanyNameContainingIgnoreCase(companyName: String): List<Application>
    // SELECT * FROM applications WHERE LOWER(company_name) LIKE LOWER(?)

    // Find applications by position title (case insensitive)
    fun findByPositionTitleContainingIgnoreCase(positionTitle: String): List<Application>
    // SELECT * FROM applications WHERE LOWER(position_title) LIKE LOWER(?)

    // Find applications between two application dates
    fun findByApplicationDateBetween(startDate: LocalDate, endDate: LocalDate): List<Application>
    // SELECT * FROM applications WHERE application_date BETWEEN ? AND ?

    // Count applications by status
    fun countByStatus(status: ApplicationStatus): Long
    // SELECT COUNT(*) FROM applications WHERE status = ?

    // Find all applications for a specific user, ordered by application date descending
    fun findByUserOrderByApplicationDateDesc(user: User): List<Application>
    // SELECT * FROM applications WHERE user_id = ? ORDER BY application_date DESC

    // Find applications for a specific user filtered by status
    fun findByUserAndStatus(user: User, status: ApplicationStatus): List<Application>
    // SELECT * FROM applications WHERE user_id = ? AND status = ?

    // Search applications for a specific user by company name (case insensitive)
    fun findByUserAndCompanyNameContainingIgnoreCase(user: User, companyName: String): List<Application>
    // SELECT * FROM applications WHERE user_id = ? AND LOWER(company_name) LIKE LOWER(?)

    // Find applications for a specific user within a date range
    fun findByUserAndApplicationDateBetween(user: User, startDate: LocalDate, endDate: LocalDate): List<Application>
    // SELECT * FROM applications WHERE user_id = ? AND application_date BETWEEN ? AND ?

    // Count applications for a specific user filtered by status
    fun countByUserAndStatus(user: User, status: ApplicationStatus): Long
    // SELECT COUNT(*) FROM applications WHERE user_id = ? AND status = ?

    // Count all applications belonging to a specific user
    fun countByUser(user: User): Long
    // SELECT COUNT(*) FROM applications WHERE user_id = ?
}