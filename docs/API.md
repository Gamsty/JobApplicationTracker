# Job Application Tracker — API Documentation

**Base URL (production):** `https://jobapplicationtracker-oj9u.onrender.com`
**Base URL (local):** `http://localhost:8080`

All endpoints are prefixed with `/api/applications`.
All request and response bodies use `Content-Type: application/json`.

---

## Table of Contents

- [Application Status Values](#application-status-values)
- [Endpoints](#endpoints)
  - [GET /api/applications](#get-apiapplications)
  - [GET /api/applications/{id}](#get-apiapplicationsid)
  - [POST /api/applications](#post-apiapplications)
  - [PUT /api/applications/{id}](#put-apiapplicationsid)
  - [DELETE /api/applications/{id}](#delete-apiapplicationsid)
  - [GET /api/applications/search](#get-apiapplicationssearch)
  - [GET /api/applications/statistics](#get-apiapplicationsstatistics)
- [Error Responses](#error-responses)

---

## Application Status Values

| Value | Meaning |
|-------|---------|
| `APPLIED` | Application submitted, awaiting response |
| `INTERVIEWING` | In the interview process |
| `OFFER_RECEIVED` | Received a job offer |
| `REJECTED` | Application was rejected |
| `WITHDRAWN` | Withdrew the application |
| `HIRED` | Accepted offer and got the job |

---

## Endpoints

---

### GET /api/applications

Returns all job applications, optionally filtered by status. Results are ordered by `applicationDate` descending (most recent first).

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status value (see table above) |

**Example Requests**

```http
GET /api/applications
GET /api/applications?status=APPLIED
GET /api/applications?status=INTERVIEWING
```

**Response — 200 OK**

Returns an array of application objects.

```json
[
  {
    "id": 1,
    "companyName": "Google",
    "positionTitle": "Software Engineer",
    "applicationDate": "2024-02-01",
    "status": "INTERVIEWING",
    "jobUrl": "https://careers.google.com/jobs/123",
    "notes": "Referred by John",
    "createdAt": "2024-02-01T10:30:00",
    "updatedAt": "2024-02-05T14:15:00"
  },
  {
    "id": 2,
    "companyName": "Spotify",
    "positionTitle": "Backend Developer",
    "applicationDate": "2024-02-03",
    "status": "APPLIED",
    "jobUrl": null,
    "notes": null,
    "createdAt": "2024-02-03T09:00:00",
    "updatedAt": "2024-02-03T09:00:00"
  }
]
```

**Response — 200 OK (empty)**

```json
[]
```

---

### GET /api/applications/{id}

Returns a single application by its ID.

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | long | The application ID |

**Example Request**

```http
GET /api/applications/1
```

**Response — 200 OK**

```json
{
  "id": 1,
  "companyName": "Google",
  "positionTitle": "Software Engineer",
  "applicationDate": "2024-02-01",
  "status": "INTERVIEWING",
  "jobUrl": "https://careers.google.com/jobs/123",
  "notes": "Referred by John",
  "createdAt": "2024-02-01T10:30:00",
  "updatedAt": "2024-02-05T14:15:00"
}
```

**Response — 404 Not Found**

```json
{
  "timestamp": "2024-02-10T12:00:00",
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
| `status` | string | Yes | Must be a valid status value |
| `jobUrl` | string | No | Max 500 characters |
| `notes` | string | No | No length limit |

**Example Request**

```http
POST /api/applications
Content-Type: application/json

{
  "companyName": "Google",
  "positionTitle": "Software Engineer",
  "applicationDate": "2024-02-01",
  "status": "APPLIED",
  "jobUrl": "https://careers.google.com/jobs/123",
  "notes": "Referred by John"
}
```

**Minimal request (required fields only)**

```json
{
  "companyName": "Spotify",
  "positionTitle": "Backend Developer",
  "applicationDate": "2024-02-03",
  "status": "APPLIED"
}
```

**Response — 201 Created**

```json
{
  "id": 3,
  "companyName": "Google",
  "positionTitle": "Software Engineer",
  "applicationDate": "2024-02-01",
  "status": "APPLIED",
  "jobUrl": "https://careers.google.com/jobs/123",
  "notes": "Referred by John",
  "createdAt": "2024-02-01T10:30:00",
  "updatedAt": "2024-02-01T10:30:00"
}
```

**Response — 400 Bad Request (validation error)**

```json
{
  "timestamp": "2024-02-10T12:00:00",
  "status": 400,
  "error": "Validation Failed",
  "message": "companyName: Company name is required; positionTitle: Position title is required"
}
```

---

### PUT /api/applications/{id}

Updates an existing application. All fields are replaced with the provided values.

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | long | The application ID to update |

**Request Body**

Same fields as POST. All fields must be provided (full replacement).

**Example Request**

```http
PUT /api/applications/1
Content-Type: application/json

{
  "companyName": "Google",
  "positionTitle": "Senior Software Engineer",
  "applicationDate": "2024-02-01",
  "status": "INTERVIEWING",
  "jobUrl": "https://careers.google.com/jobs/123",
  "notes": "Phone screen passed, technical interview scheduled"
}
```

**Response — 200 OK**

```json
{
  "id": 1,
  "companyName": "Google",
  "positionTitle": "Senior Software Engineer",
  "applicationDate": "2024-02-01",
  "status": "INTERVIEWING",
  "jobUrl": "https://careers.google.com/jobs/123",
  "notes": "Phone screen passed, technical interview scheduled",
  "createdAt": "2024-02-01T10:30:00",
  "updatedAt": "2024-02-10T16:45:00"
}
```

**Response — 404 Not Found**

```json
{
  "timestamp": "2024-02-10T12:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Application with ID 99 not found"
}
```

---

### DELETE /api/applications/{id}

Deletes an application by its ID.

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | long | The application ID to delete |

**Example Request**

```http
DELETE /api/applications/1
```

**Response — 204 No Content**

Empty body. Indicates the application was successfully deleted.

**Response — 404 Not Found**

```json
{
  "timestamp": "2024-02-10T12:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Application with ID 99 not found"
}
```

---

### GET /api/applications/search

Searches applications by company name. The match is partial and case-insensitive (e.g. `"goo"` matches `"Google"`).

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `company` | string | Yes | Company name to search for (partial match) |

**Example Requests**

```http
GET /api/applications/search?company=google
GET /api/applications/search?company=soft
```

**Response — 200 OK**

Returns an array of matching applications (same format as GET /api/applications).

```json
[
  {
    "id": 1,
    "companyName": "Google",
    "positionTitle": "Software Engineer",
    "applicationDate": "2024-02-01",
    "status": "INTERVIEWING",
    "jobUrl": "https://careers.google.com/jobs/123",
    "notes": "Referred by John",
    "createdAt": "2024-02-01T10:30:00",
    "updatedAt": "2024-02-05T14:15:00"
  }
]
```

**Response — 200 OK (no matches or blank query)**

```json
[]
```

---

### GET /api/applications/statistics

Returns aggregate statistics about all applications.

**Example Request**

```http
GET /api/applications/statistics
```

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

**Field descriptions**

| Field | Description |
|-------|-------------|
| `totalApplications` | Total number of applications across all statuses |
| `statusCounts` | Map of each status to its application count. All 6 statuses are always present, even if count is 0. |

---

## Error Responses

All errors follow this structure:

```json
{
  "timestamp": "2024-02-10T12:00:00",
  "status": 400,
  "error": "Validation Failed",
  "message": "Human-readable description of the error"
}
```

| HTTP Status | When |
|-------------|------|
| `400 Bad Request` | Validation errors (missing required fields, field too long) or malformed / invalid JSON |
| `404 Not Found` | The requested application ID does not exist |
| `500 Internal Server Error` | Unexpected server-side error |
