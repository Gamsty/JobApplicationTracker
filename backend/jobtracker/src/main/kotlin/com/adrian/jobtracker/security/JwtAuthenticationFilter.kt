package com.adrian.jobtracker.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

// Intercepts every HTTP request once and checks for a valid JWT in the Authorization header.
// If a valid token is found, the user is authenticated and added to the Spring Security context
// so that downstream controllers can access the current user via SecurityContextHolder.
@Component
class JwtAuthenticationFilter(
    private val jwtUtils: JwtUtils,
    private val userDetailsService: UserDetailsServiceImpl
) : OncePerRequestFilter() {

    // Runs on every request before it reaches the controller.
    // Extracts the JWT, validates it, and sets the authentication in the security context.
    // If no token is present or the token is invalid, the request continues unauthenticated
    // and Spring Security will reject it if the endpoint requires authentication.
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        try {
            val jwt = parseJwt(request) // Extract token from the Authorization header

            if (jwt != null) {
                val email = jwtUtils.getEmailFromToken(jwt)                   // Read the email from the token
                val userDetails = userDetailsService.loadUserByUsername(email) // Load the user from the database

                if (jwtUtils.validateToken(jwt, userDetails)) {
                    // Build an authenticated token with the user's authorities (roles)
                    val authentication = UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,             // Credentials are null after authentication (password not needed again)
                        userDetails.authorities
                    )
                    // Attach request metadata (IP address, session ID) to the authentication object
                    authentication.details = WebAuthenticationDetailsSource().buildDetails(request)

                    // Store authentication in the security context so controllers can access the current user
                    SecurityContextHolder.getContext().authentication = authentication
                }
            }
        } catch (e: Exception) {
            // Log the error but don't block the filter chain — unauthenticated requests are handled by Spring Security
            logger.error("Cannot set user authentication: ${e.message}")
        }

        // Always pass the request to the next filter in the chain
        filterChain.doFilter(request, response)
    }

    // Extracts the raw JWT string from the Authorization header.
    // Expected format: "Bearer <token>" — returns null if the header is missing or malformed.
    private fun parseJwt(request: HttpServletRequest): String? {
        val headerAuth = request.getHeader("Authorization")

        if (headerAuth != null && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7) // Strip the "Bearer " prefix to get the token
        }

        return null
    }
}