package com.adrian.jobtracker.config

import com.adrian.jobtracker.security.JwtAuthenticationFilter
import com.adrian.jobtracker.security.UserDetailsServiceImpl
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.dao.DaoAuthenticationProvider
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter

// Configures Spring Security for the application:
// - Stateless JWT-based authentication (no server-side sessions)
// - Public routes for auth endpoints, all others require a valid JWT
// - BCrypt password hashing
@Configuration
@EnableWebSecurity          // Enables Spring Security's web support
@EnableMethodSecurity       // Allows @PreAuthorize annotations on individual controller methods
class SecurityConfig(
    private val userDetailsService: UserDetailsServiceImpl,  // Loads users from the database by email
    private val jwtAuthenticationFilter: JwtAuthenticationFilter, // Validates the JWT on every request
) {

    // Registers BCrypt as the password hashing algorithm.
    // Used when saving new passwords and when verifying login attempts.
    @Bean
    fun passwordEncoder(): PasswordEncoder {
        return BCryptPasswordEncoder()
    }

    // Wires together the UserDetailsService and PasswordEncoder so Spring Security knows
    // how to load a user and verify their password during login.
    @Bean
    fun authenticationProvider(): DaoAuthenticationProvider {
        val authProvider = DaoAuthenticationProvider(userDetailsService)
        authProvider.setPasswordEncoder(passwordEncoder())
        return authProvider
    }

    // Exposes the AuthenticationManager as a bean so it can be injected into the auth controller
    // to manually trigger authentication during the login flow.
    @Bean
    fun authenticationManager(authConfig: AuthenticationConfiguration): AuthenticationManager {
        return authConfig.authenticationManager
    }

    // Defines the security rules for all HTTP requests:
    // - CSRF disabled (not needed for stateless JWT APIs)
    // - CORS enabled (configured separately via CorsConfig)
    // - No sessions — each request must carry its own JWT
    // - /api/auth/** is public (login and register)
    // - All other endpoints require authentication
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .cors { }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests { auth ->
                auth
                    .requestMatchers("/api/auth/login", "/api/auth/register").permitAll() // Only login and register are public
                    .anyRequest().authenticated()                                         // Everything else requires a valid JWT
            }
            .authenticationProvider(authenticationProvider())
            // Run the JWT filter before Spring's default username/password filter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)

        return http.build()
    }
}
