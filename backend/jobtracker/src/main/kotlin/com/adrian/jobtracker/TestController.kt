package com.adrian.jobtracker.controller

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class TestController {
    
    @GetMapping("/")
    fun home(): Map<String, String> {
        return mapOf(
            "status" to "UP",
            "message" to "Job Application Tracker API is running!",
            "timestamp" to java.time.LocalDateTime.now().toString()
        )
    }
    
    @GetMapping("/health")
    fun health(): Map<String, String> {
        return mapOf(
            "status" to "UP",
            "database" to "Connected"
        )
    }
}
