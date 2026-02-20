package com.adrian.jobtracker.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

// Web configuration class to set up CORS for the application
@Configuration
class WebConfig : WebMvcConfigurer {

    // ALLOWED_ORIGINS env var can be a comma-separated list of URLs for production
    // e.g. "https://job-tracker.vercel.app,https://job-tracker-preview.vercel.app"
    // Falls back to localhost for local development
    @Value("\${ALLOWED_ORIGINS:http://localhost:5173}")
    private lateinit var allowedOrigins: String

    override fun addCorsMappings(registry: CorsRegistry) {
        // Split the env var on commas to support multiple origins (local + production)
        val origins = allowedOrigins.split(",").map { it.trim() }.toTypedArray()

        registry.addMapping("/api/**")
            .allowedOrigins(*origins)
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
    }
}