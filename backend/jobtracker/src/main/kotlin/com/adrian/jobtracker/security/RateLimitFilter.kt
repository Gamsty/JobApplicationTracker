package com.adrian.jobtracker.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.time.Duration

// IP-based rate limiter for the public auth endpoints (/api/auth/login, /api/auth/register).
//
// The implementation is the classic Redis INCR-with-TTL pattern: increment a counter keyed by
// IP, set an expiry on the first hit, reject when the counter exceeds the limit. Simpler than
// Bucket4j for the only thing we need (cap brute-force attempts) and easier to reason about.
//
// Limit: 5 attempts per IP per 15-minute window — generous enough that a real user mistyping
// their password a few times isn't blocked, restrictive enough that automated guessing stops
// quickly. The window is rolling per IP (resets 15 min after the first failed attempt).
//
// Why protect at the filter layer rather than inside AuthController:
//   - the filter runs before Spring's auth machinery, so we don't waste BCrypt cycles on
//     attackers (BCrypt is intentionally slow — a perfect DoS target)
//   - one place to enforce the policy regardless of how many auth paths exist
//
// Failure mode: if Redis is unreachable, requests are allowed through (fail-open). The
// tradeoff is "auth endpoints stay up if Redis flakes" vs "rate limit always enforced".
// Fail-open is the right call for a login form on a live site; a noisy alert on Redis
// outage would catch this in practice. (Once we have Application Insights alerts on Redis
// dependency failures, this gap is closed operationally.)
@Component
class RateLimitFilter(
    private val redis: StringRedisTemplate
) : OncePerRequestFilter() {

    companion object {
        private const val LIMIT = 5
        private val WINDOW = Duration.ofMinutes(15)
        private val PROTECTED_PATHS = setOf("/api/auth/login", "/api/auth/register")
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val path = request.requestURI
        if (path !in PROTECTED_PATHS) {
            filterChain.doFilter(request, response)
            return
        }

        val ip = clientIp(request)
        val key = "ratelimit:auth:$ip"

        try {
            val ops = redis.opsForValue()
            val count = ops.increment(key) ?: 1L

            // Set TTL only on the first hit — subsequent INCRs inherit the existing expiry so
            // the window is anchored to when the attacker started, not the latest attempt.
            if (count == 1L) {
                redis.expire(key, WINDOW)
            }

            if (count > LIMIT) {
                response.status = HttpServletResponse.SC_TOO_MANY_REQUESTS  // 429
                response.contentType = "application/json"
                response.writer.write("""{"error":"Too many authentication attempts. Try again in 15 minutes."}""")
                return
            }
        } catch (ex: Exception) {
            // Fail-open: Redis unreachable shouldn't take down the login form.
            // Application Insights will surface this as a dependency failure.
            logger.warn("Rate limiter unavailable, allowing request through: ${ex.message}")
        }

        filterChain.doFilter(request, response)
    }

    // Render and Vercel sit behind proxies, so the real client IP arrives in X-Forwarded-For.
    // Take the first entry — the leftmost address in that header is the originating client.
    private fun clientIp(request: HttpServletRequest): String {
        val forwarded = request.getHeader("X-Forwarded-For")
        if (!forwarded.isNullOrBlank()) {
            return forwarded.substringBefore(',').trim()
        }
        return request.remoteAddr ?: "unknown"
    }
}
