package com.adrian.jobtracker

import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles

// Verifies that the Spring application context can be assembled — the dependency graph
// is sound, no bean wiring is missing, no @ConfigurationProperties fail validation.
// Runs under the "test" profile so JPA uses an in-memory H2 (no Postgres needed) and
// the Azure-backed beans stay on their NoOp/Local implementations.
@SpringBootTest
@ActiveProfiles("test")
class JobtrackerApplicationTests {

	@Test
	fun contextLoads() {
	}

}
