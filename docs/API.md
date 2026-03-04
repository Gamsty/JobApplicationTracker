# Job Application Tracker — API Documentation

**Base URL (production):** `https://jobapplicationtracker-oj9u.onrender.com`
**Base URL (local):** `http://localhost:8080`

All request and response bodies use `Content-Type: application/json` unless otherwise noted.
All endpoints except `/api/auth/**` require a valid JWT in the `Authorization: Bearer <token>` header.

---

## Table of Contents

- [Authentication](#authentication)
  - [POST /api/auth/register](#post-apiauthregister)
  - [POST /api/auth/login](#post-apiauthlogin)
  - [GET /api/auth/me](#get-apiauthme)
- [Applications](#applications)
  - [GET /api/applications](#get-apiapplications)
  - [GET /api/applications/{id}](#get-apiapplicationsid)
  - [POST /api/applications](#post-apiapplications)
  - [PUT /api/applications/{id}](#put-apiapplicationsid)
  - [DELETE /api/applications/{id}](#delete-apiapplicationsid)
  - [GET /api/applications/search](#get-apiapplicationssearch)
  - [GET /api/applications/statistics](#get-apiapplicationsstatistics)
- [Interviews](#interviews)
  - [GET /api/interviews/application/{applicationId}](#get-apiinterviewsapplicationapplicationid)
  - [GET /api/interviews/{id}](#get-apiinterviewsid)
  - [POST /api/interviews](#post-apiinterviews)
  - [PUT /api/interviews/{id}](#put-apiinterviewsid)
  - [DELETE /api/interviews/{id}](#delete-apiinterviewsid)
  - [GET /api/interviews/upcoming](#get-apiinterviewsupcoming)
  - [GET /api/interviews/past](#get-apiinterviewspast)
  - [GET /api/interviews/summary](#get-apiinterviewssummary)
- [Documents](#documents)
  - [POST /api/documents](#post-apidocuments)
  - [GET /api/documents/application/{applicationId}](#get-apidocumentsapplicationapplicationid)
  - [GET /api/documents/{id}](#get-apidocumentsid)
  - [GET /api/documents/{id}/download](#get-apidocumentsiddownload)
  - [PUT /api/documents/{id}](#put-apidocumentsid)
  - [DELETE /api/documents/{id}](#delete-apidocumentsid)
  - [GET /api/documents/my-documents](#get-apidocumentsmy-documents)
  - [GET /api/documents/summary](#get-apidocumentssummary)
- [Reminders](#reminders)
  - [POST /api/reminders](#post-apireminders)
  - [GET /api/reminders](#get-apireminders)
  - [GET /api/reminders/pending](#get-apireminderspending)
  - [GET /api/reminders/{id}](#get-apiremindersid)
  - [PUT /api/reminders/{id}](#put-apiremindersid)
  - [DELETE /api/reminders/{id}](#delete-apiremindersid)
  - [PATCH /api/reminders/{id}/toggle](#patch-apiremindersidtoggle)
  - [GET /api/reminders/summary](#get-apireminderssummary)
  - [POST /api/reminders/test-email](#post-apireminderstest-email)
- [Enum Values](#enum-values)
- [Error Responses](#error-responses)

---

## Authentication

Authentication endpoints are **public** — no JWT required.

---

### POST /api/auth/register

Creates a new user account and returns a JWT.

**Request Body**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `fullName` | string | Yes | 2–100 characters |
| `email` | string | Yes | Valid email format, must be unique |
| `password` | string | Yes | Min 6 characters |

**Example Request**

```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "Adrian Smith",
  "email": "adrian@example.com",
  "password": "securepass123"
}
```

**Response — 201 Created**

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "type": "Bearer",
  "id": 1,
  "email": "adrian@example.com",
  "fullName": "Adrian Smith",
  "role": "USER"
}
```

**Response — 409 Conflict**

```json
{
  "timestamp": "2026-03-03T12:00:00",
  "status": 409,
  "error": "Conflict",
  "message": "Email already registered"
}
```

---

### POST /api/auth/login

Authenticates a user and returns a JWT.

**Request Body**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Not blank |

**Example Request**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "adrian@example.com",
  "password": "securepass123"
}
```

**Response — 200 OK**

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "type": "Bearer",
  "id": 1,
  "email": "adrian@example.com",
  "fullName": "Adrian Smith",
  "role": "USER"
}
```

**Response — 401 Unauthorized**

```json
{
  "timestamp": "2026-03-03T12:00:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Bad credentials"
}
```

---

### GET /api/auth/me

Returns the name of the currently authenticated user.

**Headers**

```
Authorization: Bearer <token>
```

**Response — 200 OK**

```json
{
  "message": "Logged in as: Adrian Smith"
}
```

---

## Applications

All application endpoints require authentication. Users can only access their own applications.

---

### GET /api/applications

Returns all job applications for the current user, optionally filtered by status. Results are ordered by `applicationDate` descending.

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status (see [enum values](#application-status)) |

**Example Requests**

```http
GET /api/applications
GET /api/applications?status=APPLIED
GET /api/applications?status=INTERVIEWING
```

**Response — 200 OK**

```json
[
  {
    "id": 1,
    "companyName": "Google",
    "positionTitle": "Software Engineer",
    "applicationDate": "2026-02-01",
    "status": "INTERVIEWING",
    "jobUrl": "https://careers.google.com/jobs/123",
    "notes": "Referred by John",
    "createdAt": "2026-02-01T10:30:00",
    "updatedAt": "2026-02-05T14:15:00"
  }
]
```

---

### GET /api/applications/{id}

Returns a single application by ID.

**Response — 200 OK**

```json
{
  "id": 1,
  "companyName": "Google",
  "positionTitle": "Software Engineer",
  "applicationDate": "2026-02-01",
  "status": "INTERVIEWING",
  "jobUrl": "https://careers.google.com/jobs/123",
  "notes": "Referred by John",
  "createdAt": "2026-02-01T10:30:00",
  "updatedAt": "2026-02-05T14:15:00"
}
```

**Response — 404 Not Found**

```json
{
  "timestamp": "2026-03-03T12:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Application with ID 99 not found"
}
```

---

### POST /api/applications

Creates a new job application.

**Request Body**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `companyName` | string | Yes | Max 255 characters |
| `positionTitle` | string | Yes | Max 255 characters |
| `applicationDate` | string (ISO date) | Yes | Format: `YYYY-MM-DD` |
| `status` | string | Yes | Must be a valid [status value](#application-status) |
| `jobUrl` | string | No | Max 500 characters |
| `notes` | string | No | No length limit |

**Example Request**

```http
POST /api/applications
Content-Type: application/json

{
  "companyName": "Google",
  "positionTitle": "Software Engineer",
  "applicationDate": "2026-02-01",
  "status": "APPLIED",
  "jobUrl": "https://careers.google.com/jobs/123",
  "notes": "Referred by John"
}
```

**Response — 201 Created**

Returns the created application with generated `id`, `createdAt`, and `updatedAt`.

---

### PUT /api/applications/{id}

Updates an existing application. All fields are replaced (full update).

**Request Body** — Same fields as POST.

**Response — 200 OK** — Returns the updated application.

**Response — 404 Not Found** — Application does not exist or belongs to another user.

---

### DELETE /api/applications/{id}

Deletes an application and all related interviews, documents, and reminders (cascading delete).

**Response — 204 No Content**

---

### GET /api/applications/search

Searches applications by company name. The match is partial and case-insensitive.

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `company` | string | Yes | Company name to search for (partial match) |

**Example Request**

```http
GET /api/applications/search?company=google
```

**Response — 200 OK** — Array of matching applications.

---

### GET /api/applications/statistics

Returns aggregate statistics about the current user's applications.

**Response — 200 OK**

```json
{
  "totalApplications": 12,
  "statusCounts": {
    "APPLIED": 5,
    "INTERVIEWING": 3,
    "OFFER_RECEIVED": 1,
    "REJECTED": 2,
    "WITHDRAWN": 1,
    "HIRED": 0
  }
}
```

---

## Interviews

All interview endpoints require authentication. Ownership is verified through the parent application.

---

### GET /api/interviews/application/{applicationId}

Returns all interviews for a specific application, sorted by scheduled date ascending.

**Response — 200 OK**

```json
[
  {
    "id": 1,
    "applicationId": 1,
    "applicationCompany": "Google",
    "applicationPosition": "Software Engineer",
    "round": "Phone Screen",
    "scheduledDate": "2026-02-15T14:00:00",
    "status": "COMPLETED",
    "interviewerName": "Jane Doe",
    "interviewerRole": "Engineering Manager",
    "format": "VIDEO_CALL",
    "location": "https://meet.google.com/abc-defg-hij",
    "notes": "Review system design concepts",
    "feedback": "Went well, good communication",
    "rating": 4,
    "createdAt": "2026-02-10T09:00:00",
    "updatedAt": "2026-02-15T15:30:00"
  }
]
```

---

### GET /api/interviews/{id}

Returns a single interview by ID.

---

### POST /api/interviews

Creates a new interview round.

**Request Body**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `applicationId` | long | Yes | Must reference the user's application |
| `round` | string | Yes | Max 100 characters |
| `scheduledDate` | string (ISO datetime) | Yes | Format: `YYYY-MM-DDTHH:mm:ss` |
| `status` | string | Yes | Must be a valid [interview status](#interview-status) |
| `interviewerName` | string | No | Max 100 characters |
| `interviewerRole` | string | No | Max 100 characters |
| `format` | string | No | Must be a valid [interview format](#interview-format) |
| `location` | string | No | Max 500 characters |
| `notes` | string | No | Preparation notes |
| `feedback` | string | No | Post-interview reflection |
| `rating` | integer | No | 1–5 self-assessment |

**Example Request**

```http
POST /api/interviews
Content-Type: application/json

{
  "applicationId": 1,
  "round": "Technical Interview",
  "scheduledDate": "2026-03-10T14:00:00",
  "status": "SCHEDULED",
  "interviewerName": "Jane Doe",
  "format": "VIDEO_CALL",
  "location": "https://meet.google.com/abc-defg-hij",
  "notes": "Review system design and algorithms"
}
```

**Response — 201 Created** — Returns the created interview.

---

### PUT /api/interviews/{id}

Updates an existing interview. All fields are replaced.

**Request Body** — Same fields as POST.

**Response — 200 OK** — Returns the updated interview.

---

### DELETE /api/interviews/{id}

Deletes an interview.

**Response — 204 No Content**

---

### GET /api/interviews/upcoming

Returns interviews with status `SCHEDULED` and a future date, sorted soonest-first.

**Response — 200 OK** — Array of interview objects.

---

### GET /api/interviews/past

Returns interviews with a past date (any status), sorted most-recent-first.

**Response — 200 OK** — Array of interview objects.

---

### GET /api/interviews/summary

Returns aggregated interview statistics and the next upcoming / most recent interviews.

**Response — 200 OK**

```json
{
  "totalInterviews": 8,
  "scheduled": 2,
  "completed": 4,
  "cancelled": 2,
  "upcomingInterviews": [],
  "recentInterviews": []
}
```

| Field | Description |
|-------|-------------|
| `totalInterviews` | Total count across all statuses |
| `scheduled` / `completed` / `cancelled` | Count per status |
| `upcomingInterviews` | Next 5 scheduled interviews (soonest-first) |
| `recentInterviews` | Last 5 past interviews (most-recent-first) |

---

## Documents

All document endpoints require authentication. Ownership is verified through the parent application.

---

### POST /api/documents

Uploads a file and creates a document record. Uses `multipart/form-data` (not JSON).

**Form Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | file | Yes | The file to upload (max 10 MB) |
| `applicationId` | long | Yes | Application to attach the document to |
| `documentType` | string | Yes | Must be a valid [document type](#document-type) |
| `description` | string | No | Max 500 characters |

**Example Request**

```http
POST /api/documents
Content-Type: multipart/form-data

file: (binary)
applicationId: 1
documentType: RESUME
description: Updated resume for Google position
```

**Response — 201 Created**

```json
{
  "id": 1,
  "applicationId": 1,
  "applicationCompany": "Google",
  "documentType": "RESUME",
  "fileName": "a3f2c1d4-5678-9abc-def0-123456789abc.pdf",
  "originalFileName": "Adrian_Resume_2026.pdf",
  "fileType": "application/pdf",
  "fileSize": 245760,
  "fileSizeFormatted": "240.00 KB",
  "description": "Updated resume for Google position",
  "uploadedAt": "2026-03-01T10:30:00",
  "downloadUrl": "/api/documents/1/download"
}
```

---

### GET /api/documents/application/{applicationId}

Returns all documents for a specific application, newest first.

**Response — 200 OK** — Array of document objects.

---

### GET /api/documents/{id}

Returns metadata for a single document.

**Response — 200 OK** — A document object (same shape as the upload response).

---

### GET /api/documents/{id}/download

Downloads the physical file as a binary stream.

**Response — 200 OK**

```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="Adrian_Resume_2026.pdf"

(binary file data)
```

---

### PUT /api/documents/{id}

Updates only the document description (the file itself cannot be replaced).

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | No | New description text |

**Response — 200 OK** — Returns the updated document.

---

### DELETE /api/documents/{id}

Deletes the document record and the physical file on disk.

**Response — 204 No Content**

---

### GET /api/documents/my-documents

Returns all documents across all applications for the current user.

**Response — 200 OK** — Array of document objects.

---

### GET /api/documents/summary

Returns storage usage statistics for the current user.

**Response — 200 OK**

```json
{
  "totalDocuments": 5,
  "totalStorageUsed": 3145728,
  "totalStorageFormatted": "3.00 MB",
  "byType": {
    "RESUME": 2,
    "COVER_LETTER": 2,
    "CERTIFICATE": 1
  },
  "recentDocuments": []
}
```

---

## Reminders

All reminder endpoints require authentication. Users can only access their own reminders.
Reminders are automatically sent via email by a background scheduler that runs every 5 minutes.

---

### POST /api/reminders

Creates a new reminder. Optionally links it to an application and/or interview.

**Request Body**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `reminderType` | string | Yes | Must be a valid [reminder type](#reminder-type) |
| `title` | string | Yes | Max 255 characters |
| `message` | string | No | Shown in the email body |
| `scheduledFor` | string (ISO datetime) | Yes | Must be in the future. Format: `YYYY-MM-DDTHH:mm:ss` |
| `applicationId` | long | No | Link to an application |
| `interviewId` | long | No | Link to an interview |
| `enabled` | boolean | No | Defaults to `true` |

**Example Request**

```http
POST /api/reminders
Content-Type: application/json

{
  "reminderType": "FOLLOW_UP",
  "title": "Follow up with Google",
  "message": "Send a thank you email after the interview",
  "scheduledFor": "2026-03-10T09:00:00",
  "applicationId": 1,
  "enabled": true
}
```

**Response — 201 Created**

```json
{
  "id": 1,
  "applicationId": 1,
  "applicationCompany": "Google",
  "interviewId": null,
  "interviewRound": null,
  "reminderType": "FOLLOW_UP",
  "title": "Follow up with Google",
  "message": "Send a thank you email after the interview",
  "scheduledFor": "2026-03-10T09:00:00",
  "sent": false,
  "sentAt": null,
  "enabled": true,
  "createdAt": "2026-03-03T12:00:00"
}
```

---

### GET /api/reminders

Returns all reminders for the current user (including sent ones), sorted by `scheduledFor` ascending.

**Response — 200 OK** — Array of reminder objects.

---

### GET /api/reminders/pending

Returns only unsent, enabled reminders scheduled for the future.

**Response — 200 OK** — Array of reminder objects.

---

### GET /api/reminders/{id}

Returns a single reminder by ID.

**Response — 200 OK** — A reminder object.

---

### PUT /api/reminders/{id}

Updates an existing reminder. Only allowed if the reminder has not been sent yet.

**Request Body** — Same fields as POST.

**Response — 200 OK** — Returns the updated reminder.

---

### DELETE /api/reminders/{id}

Deletes a reminder.

**Response — 204 No Content**

---

### PATCH /api/reminders/{id}/toggle

Flips the `enabled` flag without changing other fields. A disabled reminder will not be sent by the scheduler.

**Response — 200 OK** — Returns the updated reminder.

---

### GET /api/reminders/summary

Returns aggregated reminder statistics and the next upcoming reminders.

**Response — 200 OK**

```json
{
  "totalReminders": 5,
  "pendingReminders": 3,
  "sentReminders": 2,
  "upcomingReminders": []
}
```

| Field | Description |
|-------|-------------|
| `totalReminders` | All reminders ever created |
| `pendingReminders` | Unsent, enabled, future-scheduled |
| `sentReminders` | Already sent by the scheduler |
| `upcomingReminders` | Next 5 reminders due soon |

---

### POST /api/reminders/test-email

Sends a test email to the current user's address to verify SMTP configuration.

**Response — 200 OK**

```json
{
  "message": "Test email sent successfully"
}
```

**Response — 500 Internal Server Error** — If email sending fails (wrong credentials, etc.)

---

## Enum Values

### Application Status

| Value | Meaning |
|-------|---------|
| `APPLIED` | Application submitted, awaiting response |
| `INTERVIEWING` | In the interview process |
| `OFFER_RECEIVED` | Received a job offer |
| `REJECTED` | Application was rejected |
| `WITHDRAWN` | Withdrew the application |
| `HIRED` | Accepted offer and got the job |

### Interview Status

| Value | Meaning |
|-------|---------|
| `SCHEDULED` | Interview is planned for a future date |
| `COMPLETED` | Interview has taken place |
| `CANCELLED` | Interview was cancelled |
| `NO_SHOW` | Candidate or interviewer didn't show up |

### Interview Format

| Value | Meaning |
|-------|---------|
| `IN_PERSON` | On-site interview |
| `VIDEO_CALL` | Video conference (Zoom, Meet, Teams) |
| `PHONE_CALL` | Phone interview |
| `ASSESSMENT` | Technical assessment or coding challenge |

### Document Type

| Value | Meaning |
|-------|---------|
| `RESUME` | Resume / CV |
| `COVER_LETTER` | Cover letter |
| `PORTFOLIO` | Portfolio or work samples |
| `CERTIFICATE` | Professional certification |
| `TRANSCRIPT` | Academic transcript |
| `REFERENCE` | Reference letter |
| `OTHER` | Any other document |

### Reminder Type

| Value | Meaning |
|-------|---------|
| `FOLLOW_UP` | Follow up after an application or interview |
| `INTERVIEW_UPCOMING` | Reminder before an upcoming interview |
| `APPLICATION_DEADLINE` | Deadline for submitting an application |
| `CUSTOM` | User-defined custom reminder |

---

## Error Responses

All errors follow this structure:

```json
{
  "timestamp": "2026-03-03T12:00:00",
  "status": 400,
  "error": "Validation Failed",
  "message": "Human-readable description of the error"
}
```

| HTTP Status | When |
|-------------|------|
| `400 Bad Request` | Validation errors, malformed JSON, invalid enum value |
| `401 Unauthorized` | Missing or invalid JWT, wrong credentials |
| `403 Forbidden` | Trying to access another user's resource |
| `404 Not Found` | Resource does not exist |
| `409 Conflict` | Email already registered |
| `413 Payload Too Large` | File exceeds size limit |
| `500 Internal Server Error` | Unexpected server-side error, email send failure |
