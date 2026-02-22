package com.adrian.jobtracker.security

import com.adrian.jobtracker.entity.User
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails

// Wraps the User entity in Spring Security's UserDetails interface.
// Spring Security uses this class internally to check credentials and authorities during authentication.
class UserDetailsImpl(
    private val user: User
) : UserDetails {

    // Converts the user's role to a Spring Security authority (e.g. UserRole.USER → "ROLE_USER").
    // The "ROLE_" prefix is required by Spring Security for role-based access control.
    override fun getAuthorities(): Collection<GrantedAuthority> {
        return listOf(SimpleGrantedAuthority("ROLE_${user.role.name}"))
    }

    // Returns the bcrypt-hashed password — Spring Security compares this against the login attempt
    override fun getPassword(): String = user.password

    // Email is used as the username identifier throughout the authentication flow
    override fun getUsername(): String = user.email

    // Account expiry is not implemented — always returns true (account never expires)
    override fun isAccountNonExpired(): Boolean = true

    // Account locking is not implemented — always returns true (account never locked)
    override fun isAccountNonLocked(): Boolean = true

    // Credential expiry is not implemented — always returns true (password never expires)
    override fun isCredentialsNonExpired(): Boolean = true

    // All registered users are active — always returns true
    override fun isEnabled(): Boolean = true

    // Convenience accessor used when the authenticated user's ID is needed (e.g. for ownership checks)
    fun getId(): Long = user.id!!

    // Convenience accessor for displaying the user's name in responses
    fun getFullName(): String = user.fullName
}

