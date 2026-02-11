# CLAUDE.md - Project Reference

## Project Overview
Job Application Tracker — Spring Boot REST API (Kotlin) with PostgreSQL. Monorepo with `backend/` and `frontend/` (not started yet).

## Architecture
Layered: Controller -> Service -> Repository -> Entity. DTOs for request/response separation.

## Key Files
- **Entry point:** `backend/jobtracker/src/main/kotlin/com/adrian/jobtracker/JobtrackerApplication.kt`
- **Controller:** `controller/ApplicationController.kt` — all REST endpoints at `/api/applications`
- **Service:** `service/ApplicationService.kt` — business logic + `ApplicationNotFoundException`
- **Entity:** `entity/Application.kt` — JPA entity, `entity/ApplicationStatus.kt` — enum (6 statuses)
- **DTOs:** `dto/ApplicationRequest.kt` (nullable fields + validation), `dto/ApplicationResponse.kt` (with `fromEntity()`)
- **Repository:** `repository/ApplicationRepository.kt` — JpaRepository with custom queries including partial search
- **Exception handling:** `exception/GlobalExceptionHandler.kt` — handles 400, 404, 500 + `ErrorResponse` data class
- **Config:** `backend/jobtracker/src/main/resources/application.properties`
- **Build:** `backend/jobtracker/build.gradle` — Spring Boot 4.0.2, Kotlin 2.2.21, JDK 17

## Tech Details
- Database: PostgreSQL `jobTracker` on localhost:5432
- `ddl-auto=update` — Hibernate manages schema (be careful: it does NOT update/drop existing constraints)
- Entity status column uses `columnDefinition = "varchar(30)"` to prevent Hibernate CHECK constraint generation
- DTO fields are nullable with defaults so Jackson can construct the object and `@Valid` handles validation
- Service uses `!!` on validated fields (safe because validation runs first)
- Repository uses `ContainingIgnoreCase` for partial company/position search

## Completed Work
- Full CRUD REST API (GET all, GET by ID, POST, PUT, DELETE)
- Search by company name (partial, case-insensitive)
- Statistics endpoint (total count + count by status)
- Status filtering via query parameter
- Request validation with proper 400 error responses
- Global exception handling (400 validation, 400 bad JSON, 404 not found, 500 generic)
- Database indexes on companyName, positionTitle, status, applicationDate

## Known Issues / Decisions
- PostgreSQL sequences don't reset on delete — IDs will have gaps (normal behavior)

## What's Next
- Frontend implementation
- Authentication/authorization
- Pagination for GET all endpoint
- Unit and integration tests
- Production configuration (hide error details, configure CORS)
