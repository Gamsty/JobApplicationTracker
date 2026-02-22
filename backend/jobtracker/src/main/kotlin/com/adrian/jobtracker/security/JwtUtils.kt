package com.adrian.jobtracker.security

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.stereotype.Component
import java.util.*
import javax.crypto.SecretKey

// Utility component for creating, parsing, and validating JWT tokens.
// Values are injected from application.yml (jwt.secret and jwt.expiration).
@Component
class JwtUtils(
    @Value("\${jwt.secret}")
    private val jwtSecret: String, // Secret key string used to sign tokens — must be kept private

    @Value("\${jwt.expiration}")
    private val jwtExpiration: Long, // Token lifetime in milliseconds (e.g. 86400000 = 24 hours)
) {
    // Derive a secure HMAC-SHA key from the secret string once, reused for all sign/verify operations
    private val key: SecretKey by lazy {
        Keys.hmacShaKeyFor(jwtSecret.toByteArray())
    }

    // Creates a signed JWT with the user's email as the subject.
    // Called after successful login to return a token to the client.
    fun generateToken(email: String): String {
        return Jwts.builder()
            .subject(email)                                               // Identifies the user
            .issuedAt(Date())                                             // Token creation time
            .expiration(Date(System.currentTimeMillis() + jwtExpiration)) // Expiry time
            .signWith(key)                                                // Sign with HMAC-SHA256 (algorithm inferred from key)
            .compact()
    }

    // Extracts the email (subject) embedded in the token.
    // Used by the JWT filter to identify which user is making the request.
    fun getEmailFromToken(token: String): String {
        return getClaims(token).subject
    }

    // Returns true if the token's email matches the loaded user and the token has not expired.
    // Called by the JWT filter on every protected request.
    fun validateToken(token: String, userDetails: UserDetails): Boolean {
        val email = getEmailFromToken(token)
        return (email == userDetails.username && !isTokenExpired(token))
    }

    // Returns true if the token's expiration timestamp is before the current time
    private fun isTokenExpired(token: String): Boolean {
        val expiration = getClaims(token).expiration
        return expiration.before(Date())
    }

    // Parses and verifies the token signature, returning all embedded claims.
    // Throws an exception if the token is malformed, expired, or has an invalid signature.
    private fun getClaims(token: String): Claims {
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .payload
    }
}