package com.adrian.jobtracker.config

import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

// Web configuration class to set up CORS for the application
@Configuration
class WebConfig : WebMvcConfigurer { // Implement the WebMvcConfigurer interface to customize web configuration
    override fun addCorsMappings(registry: CorsRegistry) { // Configure CORS for API endpoints
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:5173") // Frontend URL
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Allowed HTTP methods
            .allowedHeaders("*") // Allow all headers
            .allowCredentials(true) // Allow credentials (cookies, authorization headers, etc.)
    }
}