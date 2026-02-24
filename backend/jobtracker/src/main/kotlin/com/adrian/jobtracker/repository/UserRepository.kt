package com.adrian.jobtracker.repository

import com.adrian.jobtracker.entity.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface UserRepository : JpaRepository<User, Long> {

    // Look up a user by email — used during login and JWT validation to load the user
    fun findByEmail(email: String): Optional<User>

    // Check if an email is already registered — used during registration to prevent duplicates
    fun existsByEmail(email: String): Boolean
}

