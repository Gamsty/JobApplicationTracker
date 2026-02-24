package com.adrian.jobtracker.security

import com.adrian.jobtracker.repository.UserRepository
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service

// Implements Spring Security's UserDetailsService so the framework knows how to load a user
// during authentication. Spring calls loadUserByUsername() automatically when validating credentials.
@Service
class UserDetailsServiceImpl(
    private val userRepository: UserRepository
) : UserDetailsService {

    // Called by Spring Security during login and JWT filter validation.
    // Looks up the user by email (used as the username) and wraps them in UserDetailsImpl.
    // Throws UsernameNotFoundException if no account exists — Spring Security handles this as a 401.
    override fun loadUserByUsername(email: String): UserDetails {
        val user = userRepository.findByEmail(email)
            .orElseThrow {
                UsernameNotFoundException("User not found with email: $email")
            }
        return UserDetailsImpl(user)
    }
}