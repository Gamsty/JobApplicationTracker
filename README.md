# Job Application Tracker

A full-stack web application to manage and track job applications throughout the hiring process. Features user authentication, interview tracking, document uploads, email reminders, and an interactive analytics dashboard.

**Live Demo:** [job-application-tracker-ivory.vercel.app](https://job-application-tracker-ivory.vercel.app)

---

## Architecture

The system is deployed across three providers — a deliberate multi-cloud split that uses each provider for what it does best:

```
   Vercel (Frontend)  ───HTTPS──►  Render (Spring Boot API)
                                          │
                                          ├─►  Render PostgreSQL  (users, applications, metadata)
                                          │
                                          └─►  Azure Blob Storage (uploaded documents)
```

| Concern | Provider | Why |
|---|---|---|
| Frontend (React/Vite) | Vercel | Free CDN-backed static hosting, zero-config deploys from git |
| Backend (Spring Boot) | Render | Always-on managed container, good for a stateful JWT API |
| Relational data | Render PostgreSQL | Same region as backend → low latency, free internal networking |
| File uploads | Azure Blob Storage | Render's filesystem is **ephemeral** — files disappear on every redeploy. Blob storage is durable and decouples file lifecycle from compute. |

### Live production topology

![Multi-cloud topology in Application Insights](docs/screenshots/multi-cloud-history.png)

Application Insights from production showing the multi-cloud split actually running — the Spring Boot backend handling traffic, with downstream calls to Azure Blob Storage and Render PostgreSQL, plus end-to-end latency and error rate per dependency. Real telemetry, not a static diagram.

### Implementation note

The `prod` profile activates the Azure-backed `AzureBlobStorageService`; any other profile (local dev) uses `LocalFileStorageService` against the filesystem. Both implement the same `FileStorageService` interface so the rest of the app is unaware of which backend is active.

---

## Screenshots

### Login
![Login](docs/screenshots/login.png)

### Register
![Register](docs/screenshots/register.png)

### Applications Details
![Application Details](docs/screenshots/application-details.png)

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Reminders
![Reminders](docs/screenshots/reminders.png)

### Settings
![Settings](docs/screenshots/settings.png)

---

## Features

### Authentication
- Register and login with email and password
- JWT-based stateless authentication
- BCrypt password hashing
- Automatic session restore from `localStorage`

### Applications Page
- Create, read, update and delete job applications
- Search by company name or position (partial, case-insensitive)
- Filter by status (All, Applied, Interviewing, Offer Received, etc.)
- Sort by any column (ascending / descending)
- Stats summary bar showing total count and count per status

### Interview Tracking
- Add multiple interview rounds per application
- Track round name, date/time, format (In Person, Video, Phone, Assessment)
- Record interviewer name/role, location, prep notes, feedback, and self-rating (1-5)
- Interview statuses: Scheduled, Completed, Cancelled, No Show
- Upcoming and past interview views

### Document Management
- Upload resumes, cover letters, portfolios, certificates, transcripts, references
- Files stored in Azure Blob Storage in production; local filesystem in dev (UUID-based naming on both)
- Download documents with the original filename
- Track file type, size, and upload date
- Document summary with total storage usage and per-type breakdown

### Email Reminders
- Create reminders linked to applications and/or interviews
- Reminder types: Follow Up, Interview Upcoming, Application Deadline, Custom
- Schedule for any future date/time
- Enable/disable reminders without deleting them
- Automated email delivery via background scheduler (every 5 minutes)
- Test email button to verify SMTP configuration
- Gmail SMTP support via App Passwords

### Dashboard Page
- Pie chart showing application distribution by status
- Bar chart showing applications submitted over time
- Key metrics: total applications, response rate, offers received
- Upcoming interviews, recent documents, and pending reminders widgets
- Document storage summary

### Settings Page
- Email notification toggle
- Test email configuration
- Email settings info panel

### General
- Dark mode toggle (persisted to `localStorage`)
- Toast notifications for create / update / delete actions
- Offline detection banner when network is lost
- Error boundary fallback UI for unexpected crashes
- Fully responsive layout for mobile and desktop

---

## Tech Stack

### Backend
| | |
|---|---|
| **Language** | Kotlin 2.2 |
| **Framework** | Spring Boot 4.0 |
| **Database** | PostgreSQL |
| **ORM** | Spring Data JPA / Hibernate |
| **Security** | Spring Security + JWT (jjwt 0.12) |
| **Email** | Spring Boot Mail (Gmail SMTP) |
| **Scheduling** | Spring `@Scheduled` cron tasks |
| **Validation** | Jakarta Bean Validation |
| **File Storage** | Azure Blob Storage (prod) / Local filesystem (dev) |
| **Build Tool** | Gradle |

### Frontend
| | |
|---|---|
| **Framework** | React 19 (Vite 7) |
| **Routing** | React Router DOM 7 |
| **HTTP Client** | Axios |
| **Charts** | Recharts 3 |
| **Styling** | Plain CSS with CSS variables (light/dark theme) |

---

## Project Structure

```
JobApplicationTracker/
├── backend/jobtracker/
│   ├── Dockerfile
│   └── src/main/kotlin/com/adrian/jobtracker/
│       ├── config/
│       │   ├── SecurityConfig.kt          # JWT filter chain, CORS, BCrypt
│       │   └── WebConfig.kt               # CORS allowed origins
│       ├── controller/
│       │   ├── ApplicationController.kt   # /api/applications CRUD + search + stats
│       │   ├── AuthController.kt          # /api/auth login, register, me
│       │   ├── DocumentController.kt      # /api/documents upload, download, CRUD
│       │   ├── InterviewController.kt     # /api/interviews CRUD + upcoming/past
│       │   └── ReminderController.kt      # /api/reminders CRUD + toggle + test email
│       ├── dto/
│       │   ├── ApplicationRequest.kt      # Validated input DTO
│       │   ├── ApplicationResponse.kt     # Output DTO with fromEntity()
│       │   ├── AuthRequest.kt             # Login/Register/Auth response DTOs
│       │   ├── DocumentDto.kt             # Upload request, response, summary DTOs
│       │   ├── InterviewDto.kt            # Request, response, summary DTOs
│       │   └── ReminderDto.kt             # Request, response, summary DTOs
│       ├── entity/
│       │   ├── Application.kt             # JPA entity with status enum
│       │   ├── ApplicationStatus.kt       # APPLIED, INTERVIEWING, OFFER_RECEIVED...
│       │   ├── Document.kt                # File metadata + relations
│       │   ├── Interview.kt               # Round, format, status, feedback
│       │   ├── Reminder.kt                # Scheduled notification entity
│       │   └── User.kt                    # Auth entity with email notifications flag
│       ├── exception/
│       │   └── GlobalExceptionHandler.kt  # 400/401/403/404/409/413/500 handling
│       ├── repository/
│       │   ├── ApplicationRepository.kt
│       │   ├── DocumentRepository.kt
│       │   ├── InterviewRepository.kt
│       │   ├── ReminderRepository.kt
│       │   └── UserRepository.kt
│       ├── security/
│       │   ├── JwtAuthenticationFilter.kt # Validates JWT on every request
│       │   ├── JwtUtils.kt               # Generate, validate, parse JWT tokens
│       │   ├── UserDetailsImpl.kt         # Spring Security UserDetails wrapper
│       │   └── UserDetailsServiceImpl.kt  # Loads user by email for auth
│       └── service/
│           ├── ApplicationService.kt      # Application CRUD + statistics
│           ├── AuthService.kt             # Register, login, get current user
│           ├── DocumentService.kt         # Upload, download, delete, summary
│           ├── EmailService.kt            # HTML email builder + sender
│           ├── FileStorageService.kt      # Interface + FileStorageResult data class
│           ├── LocalFileStorageService.kt # Filesystem impl (profile != "prod")
│           ├── AzureBlobStorageService.kt # Azure Blob impl (profile == "prod")
│           ├── InterviewService.kt        # Interview CRUD + upcoming/past
│           ├── ReminderSchedulerService.kt # @Scheduled cron task for email delivery
│           └── ReminderService.kt         # Reminder CRUD + toggle + summary
│
├── frontend/src/
│   ├── components/
│   │   ├── ApplicationDetails.jsx         # Detail modal with interviews + documents
│   │   ├── ApplicationForm.jsx            # Modal form for create/edit application
│   │   ├── ApplicationList.jsx            # Table with sort, filter, search
│   │   ├── DocumentList.jsx               # File list with upload, download, delete
│   │   ├── DocumentUploadForm.jsx         # File upload form with type selection
│   │   ├── ErrorBoundary.jsx              # Catches React rendering errors
│   │   ├── InterviewForm.jsx              # Modal form for create/edit interview
│   │   ├── Interviewlist.jsx              # Interview timeline with status badges
│   │   ├── NetworkStatus.jsx              # Offline detection banner
│   │   ├── ProtectedRoute.jsx             # Redirects to login if unauthenticated
│   │   ├── ReminderForm.jsx               # Modal form for create/edit reminder
│   │   ├── ReminderList.jsx               # Reminder list with toggle, filter, badges
│   │   ├── StatsSummary.jsx               # Status count summary bar
│   │   └── ToastNotification.jsx          # Auto-dismissing toast alerts
│   ├── context/
│   │   └── AuthContext.jsx                # JWT auth state + login/register/logout
│   ├── pages/
│   │   ├── Dashboard.jsx                  # Analytics with charts and widgets
│   │   ├── Login.jsx                      # Login form
│   │   ├── Register.jsx                   # Registration form
│   │   ├── Reminders.jsx                  # Reminder management page
│   │   └── Settings.jsx                   # Email notification preferences
│   ├── services/
│   │   ├── documentService.js             # Document API calls
│   │   ├── frontApplicationService.js     # Application API calls + axios interceptors
│   │   ├── interviewService.js            # Interview API calls
│   │   └── reminderService.js             # Reminder API calls
│   ├── utils/
│   │   └── constants.js                   # Status labels, colors, icons
│   ├── App.jsx                            # Root component, routing, global state
│   └── main.jsx                           # React entry point
│
├── infra/                                # Azure infrastructure-as-code (Bicep)
│   ├── main.bicep                        # Composes the four modules
│   ├── main.bicepparam                   # Prod parameter values
│   └── modules/
│       ├── storage.bicep                 # Blob Storage account + container
│       ├── redis.bicep                   # Azure Cache for Redis (Basic C0)
│       ├── search.bicep                  # Azure AI Search (Free tier)
│       └── observability.bicep           # Log Analytics + Application Insights
│
└── docs/
    ├── API.md                             # Full API documentation
    └── screenshots/                       # App screenshots
```

---

## Infrastructure as Code (Azure)

The Azure side of the stack is fully described in `infra/` as a set of Bicep modules.
A single deployment command recreates Storage, Redis, AI Search, Log Analytics, and
Application Insights from scratch — useful for disaster recovery, for setting up a
parallel staging environment, or simply for proving the deployment is reproducible.

### Preview what would change

`what-if` runs a server-side diff without applying anything. Useful before any deploy
or as a sanity check that the live resources match the code.

```powershell
az deployment group what-if `
  --resource-group rg-jobtracker-prod `
  --template-file infra/main.bicep `
  --parameters infra/main.bicepparam
```

Against the current production RG this reports only documented Microsoft what-if
false positives (auto-managed Redis memory reserves and a couple of property
defaults) — i.e. the code matches reality.

### Apply

```powershell
az deployment group create `
  --resource-group rg-jobtracker-prod `
  --template-file infra/main.bicep `
  --parameters infra/main.bicepparam
```

### What the Bicep does NOT cover

Outside the Azure resource group, so deliberately excluded:
- Render web service + Render PostgreSQL — separate provider
- Vercel frontend — separate provider
- Secrets and access keys — generated by the resources but never extracted by Bicep,
  so they never enter ARM deployment history. Fetch them with `az` after deployment
  and set them as env vars on Render.

---

## Prerequisites

- JDK 17+
- PostgreSQL
- Node.js 18+ and npm
- Gradle

---

## Local Setup

### Backend

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Gamsty/JobApplicationTracker.git
   cd JobApplicationTracker/backend/jobtracker
   ```

2. **Create the PostgreSQL database:**
   ```sql
   CREATE DATABASE "jobTracker";
   ```

3. **Create `src/main/resources/application-local.yml`** with your credentials:
   ```yaml
   spring:
     datasource:
       username: your_postgres_username
       password: your_postgres_password
     mail:
       username: your_gmail@gmail.com
       password: your_gmail_app_password

   jwt:
     secret: your_256_bit_secret_key
   ```

   > For Gmail SMTP: enable 2FA on your Google account, then generate an App Password at Google Account > Security > App Passwords.

4. **Run the backend:**
   ```bash
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

> Both services must be running together. The frontend connects to the backend via `VITE_API_URL` (set in `frontend/.env.development`).

---

## API Documentation

See [docs/API.md](docs/API.md) for the full endpoint reference with request/response examples.

**Quick reference:**

### Authentication (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account, returns JWT |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user info |

### Applications (Requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applications` | Get all (optional `?status=`) |
| GET | `/api/applications/{id}` | Get by ID |
| POST | `/api/applications` | Create application |
| PUT | `/api/applications/{id}` | Update application |
| DELETE | `/api/applications/{id}` | Delete application |
| GET | `/api/applications/search?company=` | Search by company |
| GET | `/api/applications/statistics` | Get statistics |

### Interviews (Requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/interviews/application/{appId}` | Get by application |
| GET | `/api/interviews/{id}` | Get by ID |
| POST | `/api/interviews` | Create interview |
| PUT | `/api/interviews/{id}` | Update interview |
| DELETE | `/api/interviews/{id}` | Delete interview |
| GET | `/api/interviews/upcoming` | Get upcoming interviews |
| GET | `/api/interviews/past` | Get past interviews |
| GET | `/api/interviews/summary` | Get interview stats |

### Documents (Requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents` | Upload (multipart/form-data) |
| GET | `/api/documents/application/{appId}` | Get by application |
| GET | `/api/documents/{id}` | Get metadata |
| GET | `/api/documents/{id}/download` | Download file |
| PUT | `/api/documents/{id}` | Update description |
| DELETE | `/api/documents/{id}` | Delete document |
| GET | `/api/documents/my-documents` | Get all user documents |
| GET | `/api/documents/summary` | Get storage summary |

### Reminders (Requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reminders` | Create reminder |
| GET | `/api/reminders` | Get all reminders |
| GET | `/api/reminders/pending` | Get pending reminders |
| GET | `/api/reminders/{id}` | Get by ID |
| PUT | `/api/reminders/{id}` | Update reminder |
| DELETE | `/api/reminders/{id}` | Delete reminder |
| PATCH | `/api/reminders/{id}/toggle` | Toggle enabled |
| GET | `/api/reminders/summary` | Get reminder stats |
| POST | `/api/reminders/test-email` | Send test email |

---

## Deployment

The production stack spans three providers. Provision them in this order so each step has what the next needs.

### 1. Document Storage — Azure Blob Storage

Documents live in an Azure Storage Account separate from the rest of the stack. Without this, files uploaded on Render would vanish on every redeploy.

1. Sign up for [Azure for Students](https://azure.microsoft.com/free/students/) (no credit card required)
2. Provision the storage account, container, and harden TLS:
   ```powershell
   az login

   az group create --name rg-jobtracker-prod --location swedencentral

   $STORAGE = "stjobtrackeradrian"   # must be globally unique, 3-24 lowercase chars
   az storage account create `
     --name $STORAGE `
     --resource-group rg-jobtracker-prod `
     --location swedencentral `
     --sku Standard_LRS `
     --kind StorageV2 `
     --allow-blob-public-access false `
     --min-tls-version TLS1_2

   az storage container create `
     --account-name $STORAGE `
     --name documents `
     --auth-mode key `
     --public-access off
   ```
3. Pipe the connection string straight to the clipboard — never print it to the terminal:
   ```powershell
   az storage account show-connection-string `
     --name $STORAGE `
     --resource-group rg-jobtracker-prod `
     --query connectionString -o tsv | Set-Clipboard
   ```
4. Paste it into Render as `AZURE_STORAGE_CONNECTION_STRING` (next section)

> **Auth note:** Service-principal auth with RBAC would be cleaner than connection-string auth, but Azure for Students blocks app-registration creation in shared Entra tenants (e.g. universities). Connection strings are the practical fallback. Treat the connection string as a high-value secret and rotate the account key (`az storage account keys renew`) if it is ever exposed.

### 2. Production Database — Render PostgreSQL

1. Render Dashboard → **+ New** → **PostgreSQL**, region **Frankfurt** (or whichever region matches your web service)
2. Once status is **Available**, open the database and copy the **Hostname**, **Database**, **Username**, **Password** fields from the Connections panel
3. These become the `DATABASE_*` env vars in the next step — note that JDBC requires a `jdbc:postgresql://host:5432/dbname` URL with credentials separated, not Render's `postgresql://user:pass@host/db` form
4. Hibernate creates the schema automatically on first boot (`DDL_AUTO=update`)

### 3. Backend — Render.com (Docker)

1. Render Dashboard → **+ New** → **Web Service**
2. Connect your GitHub repository, set the root directory to `backend/jobtracker`
3. Select **Docker** as the environment (the `Dockerfile` handles the build)
4. Add these environment variables:

   | Variable | Value | Notes |
   |----------|-------|-------|
   | `SPRING_PROFILES_ACTIVE` | `prod` | Activates `AzureBlobStorageService` |
   | `DATABASE_URL` | `jdbc:postgresql://<Hostname>:5432/<Database>` | Use Render's Internal hostname, not External |
   | `DATABASE_USERNAME` | Username from step 2 | |
   | `DATABASE_PASSWORD` | Password from step 2 | |
   | `DDL_AUTO` | `update` | |
   | `JWT_SECRET` | A secure 256-bit secret key | |
   | `MAIL_USERNAME` | Your Gmail address | |
   | `MAIL_PASSWORD` | Your Gmail App Password | |
   | `FRONTEND_URL` | Your Vercel frontend URL | |
   | `AZURE_STORAGE_CONNECTION_STRING` | Connection string from step 1.3 | Paste from clipboard, do not print first |
   | `AZURE_STORAGE_CONTAINER` | `documents` | |

5. Note your service URL (e.g. `https://your-service.onrender.com`)

### 4. Frontend — Vercel

1. Sign up at [vercel.com](https://vercel.com) and create a new project
2. Import your GitHub repository and configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add this environment variable in the Vercel dashboard:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://your-service.onrender.com` |

4. Deploy — Vercel will give you a URL like `https://your-app.vercel.app`
5. Add that Vercel URL to the `allowedOrigins` list in `backend/.../config/WebConfig.kt` and redeploy the backend

---

## License

This project is open source and available under the [MIT License](LICENSE).

## Author

**Adrian**
- GitHub: [@Gamsty](https://github.com/Gamsty)
