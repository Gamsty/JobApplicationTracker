package com.adrian.jobtracker.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "users") // Maps to the "users" table in the database
class User(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null, // Auto-generated primary key

    @Column(nullable = false, unique = true, length = 100)
    val email: String, // Used as the login identifier — must be unique across all users

    @Column(nullable = false, length = 100)
    val fullName: String,

    @Column(nullable = false)
    val password: String, // Stored as a bcrypt hash, never plain text

    @Enumerated(EnumType.STRING) // Stores enum name as a string (e.g. "USER") rather than ordinal index
    @Column(nullable = false)
    val role: UserRole = UserRole.USER, // Defaults to USER; ADMIN role reserved for elevated access

    @Column(nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(), // Set once on creation, never updated

    @Column(nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now(),

    // One user owns many applications — deleting a user cascades and removes all their applications
    @OneToMany(mappedBy = "user", cascade = [CascadeType.ALL], orphanRemoval = true)
    val applications: MutableList<Application> = mutableListOf()
)

// Roles that determine what a user is allowed to do
enum class UserRole {
    USER,  // Standard access — can only manage their own applications
    ADMIN  // Elevated access — reserved for future admin features
}