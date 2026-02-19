# Job Application Tracker

A full-stack web application for tracking job applications throughout the hiring process. Built with a Spring Boot REST API backend, PostgreSQL database, and a React frontend.

## Tech Stack

### Backend
- **Language:** Kotlin 2.2
- **Framework:** Spring Boot 4.0
- **Database:** PostgreSQL
- **ORM:** Spring Data JPA / Hibernate
- **Validation:** Jakarta Bean Validation
- **Build Tool:** Gradle

### Frontend
- **Framework:** React 19 (Vite)
- **Routing:** React Router DOM 7
- **HTTP Client:** Axios
- **Charts:** Recharts
- **Styling:** Plain CSS with CSS variables (light/dark theme)

## Features

### Applications Page
- View all job applications in a sortable table
- Add new applications via a modal form
- Edit existing applications (pre-filled modal)
- Delete applications with a confirmation dialog
- Filter applications by status (All, Applied, Interviewing, etc.)
- Search applications by company name or position title (client-side, instant)
- Stats summary bar showing total count and counts per status

### Dashboard Page
- Pie chart showing application distribution by status
- Bar chart showing applications over time
- Key metrics: total applications, active pipeline, success rate, interviews
- Recent applications list

### General
- Dark mode toggle (persisted to `localStorage`)
- Toast notifications for create / update / delete actions
- Offline detection banner when network is lost
- Error boundary fallback UI for unexpected crashes
- Fully responsive layout

## Project Structure

```
JobApplicationTracker/
├── backend/
│   └── jobtracker/
│       └── src/main/kotlin/com/adrian/jobtracker/
│           ├── config/
│           │   └── WebConfig.kt             # CORS configuration
│           ├── controller/
│           │   └── ApplicationController.kt  # REST endpoints at /api/applications
│           ├── dto/
│           │   ├── ApplicationRequest.kt     # Validated input DTO
│           │   └── ApplicationResponse.kt    # Output DTO with fromEntity()
│           ├── entity/
│           │   ├── Application.kt            # JPA entity
│           │   └── ApplicationStatus.kt      # Enum (6 statuses)
│           ├── exception/
│           │   └── GlobalExceptionHandler.kt # 400/404/500 handling + ErrorResponse
│           ├── repository/
│           │   └── ApplicationRepository.kt  # JpaRepository + search queries
│           ├── service/
│           │   └── ApplicationService.kt     # Business logic + ApplicationNotFoundException
│           └── JobtrackerApplication.kt      # Entry point
└── frontend/
    └── src/
        ├── components/
        │   ├── ApplicationForm.jsx     # Modal form for create/edit
        │   ├── ApplicationList.jsx     # Table with sort, filter, search
        │   ├── ErrorBoundary.jsx       # Catches React rendering errors
        │   ├── NetworkStatus.jsx       # Offline detection banner
        │   ├── StatsSummary.jsx        # Status count summary bar
        │   └── ToastNotification.jsx   # Auto-dismissing toast alerts
        ├── pages/
        │   └── Dashboard.jsx           # Analytics page with charts
        ├── services/
        │   └── frontApplicationService.js  # Axios API calls
        ├── utils/
        │   └── constants.js            # Status labels and colors
        ├── App.jsx                     # Root component, routing, global state
        └── main.jsx                    # React entry point
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
- Node.js 18+ and npm (for the frontend)

## Setup

### Backend

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

3. **Run the backend:**
   ```bash
   cd backend/jobtracker
   ./gradlew bootRun
   ```

   The API will be available at `http://localhost:8080`.

### Frontend

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`.

> The frontend proxies API requests to `http://localhost:8080` via the Vite dev server config, so both must be running.
