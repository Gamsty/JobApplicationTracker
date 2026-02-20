package com.adrian.jobtracker.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

// Configures CORS so the frontend can call the backend API from a different origin
@Configuration
class WebConfig : WebMvcConfigurer {

    // Allow cross-origin requests to all /api/** endpoints
    override fun addCorsMappings(registry: CorsRegistry) {
        registry.addMapping("/api/**")
            .allowedOrigins(
                "http://localhost:5173",                                    // Local dev frontend (Vite)
                "https://job-application-tracker-ivory.vercel.app"         // Production frontend (Vercel)
            )
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")     // OPTIONS is required for CORS preflight requests
            .allowedHeaders("*")                                            // Allow all headers (e.g. Content-Type, Authorization)
            .allowCredentials(true)                                         // Allow cookies/auth headers to be sent cross-origin
    }
}