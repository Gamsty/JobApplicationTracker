# Job Application Tracker

A full-stack web application for tracking job applications throughout the hiring process. Built with a Spring Boot REST API backend and PostgreSQL database.

## Tech Stack

### Backend
- **Language:** Kotlin 2.2
- **Framework:** Spring Boot 4.0
- **Database:** PostgreSQL
- **ORM:** Spring Data JPA / Hibernate
- **Validation:** Jakarta Bean Validation
- **Build Tool:** Gradle

### Frontend
- Planned

## Project Structure

```
JobApplicationTracker/
├── backend/
│   └── jobtracker/
│       └── src/main/kotlin/com/adrian/jobtracker/
│           ├── controller/       # REST API endpoints
│           ├── dto/              # Request/Response data transfer objects
│           ├── entity/           # JPA entities and enums
│           ├── exception/        # Global exception handling
│           ├── repository/       # Database query interfaces
│           ├── service/          # Business logic
│           └── JobtrackerApplication.kt
├── frontend/                     # (planned)
└── docs/
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applications` | Get all applications |
| GET | `/api/applications?status=APPLIED` | Filter by status |
| GET | `/api/applications/{id}` | Get application by ID |
| POST | `/api/applications` | Create new application |
| PUT | `/api/applications/{id}` | Update application |
| DELETE | `/api/applications/{id}` | Delete application |
| GET | `/api/applications/search?company=google` | Search by company name (partial, case-insensitive) |
| GET | `/api/applications/statistics` | Get application statistics |

### Application Statuses

`APPLIED` | `INTERVIEWING` | `OFFER_RECEIVED` | `REJECTED` | `WITHDRAWN` | `HIRED`

### Example Request Body (POST/PUT)

```json
{
  "companyName": "Google",
  "positionTitle": "Software Engineer",
  "applicationDate": "2024-02-10",
  "status": "APPLIED",
  "jobUrl": "https://careers.google.com/example",
  "notes": "Applied through referral"
}
```

### Error Responses

The API returns structured error responses:

```json
{
  "timestamp": "2024-02-10T12:00:00",
  "status": 400,
  "error": "Validation Failed",
  "message": "companyName: Company name is required; positionTitle: Position title is required"
}
```

| Status Code | When |
|-------------|------|
| 400 | Validation errors or malformed JSON |
| 404 | Application not found |
| 500 | Unexpected server error |

## Prerequisites

- JDK 17+
- PostgreSQL
- Gradle

## Setup

1. **Create the PostgreSQL database:**
   ```sql
   CREATE DATABASE "jobTracker";
   ```

2. **Configure database credentials** in `backend/jobtracker/src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/jobTracker
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```

3. **Run the application:**
   ```bash
   cd backend/jobtracker
   ./gradlew bootRun
   ```

4. The API will be available at `http://localhost:8080`
