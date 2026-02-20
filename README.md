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

2. **Set database credentials** via environment variables or by creating `application-local.properties` (this file is git-ignored):
   ```properties
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```
   Activate it by adding `spring.profiles.active=local` to `application.properties`, or pass the variables directly:
   ```bash
   DATABASE_USERNAME=postgres DATABASE_PASSWORD=secret ./gradlew bootRun
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

> Both backend and frontend must be running together. The frontend uses `VITE_API_URL` (set in `frontend/.env.development`) to reach the backend.

## Deployment

### Backend — Render.com

1. Sign up at [render.com](https://render.com) and create a new **Web Service**
2. Connect your GitHub repository, set the root directory to `backend/jobtracker`
3. Configure the service:
   - **Environment:** Java
   - **Build Command:** `./gradlew clean build -x test`
   - **Start Command:** `java -jar build/libs/jobtracker-0.0.1-SNAPSHOT.jar`
4. Add these environment variables in the Render dashboard:
   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | PostgreSQL connection string from your DB provider |
   | `DATABASE_USERNAME` | Your DB username |
   | `DATABASE_PASSWORD` | Your DB password |
   | `DDL_AUTO` | `update` |
   | `ALLOWED_ORIGINS` | Your Vercel frontend URL (add after frontend is deployed) |
5. Note your Render URL: `https://jobapplicationtracker-sto4.onrender.com`

> **Free tier note:** Render spins down services after 15 minutes of inactivity. The first request after a period of inactivity may take ~30 seconds.

### Frontend — Vercel

1. Sign up at [vercel.com](https://vercel.com) and create a new project
2. Import your GitHub repository and configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add this environment variable in the Vercel dashboard:
   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://jobapplicationtracker-sto4.onrender.com/api/applications` |
4. Deploy — Vercel will give you a URL like `https://job-tracker.vercel.app`
5. Go back to Render and set `ALLOWED_ORIGINS` to your Vercel URL so CORS allows it

### Production Database — Render PostgreSQL (Free Tier)

1. In Render, create a new **PostgreSQL** instance
2. Copy the **Internal Database URL** and use it as the `DATABASE_URL` env var on your Web Service
3. Hibernate will create the schema automatically on first boot (`DDL_AUTO=update`)
