package com.adrian.jobtracker

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableScheduling
class JobtrackerApplication

fun main(args: Array<String>) {
	runApplication<JobtrackerApplication>(*args)
}
