# Databse Schema

## Application Table

| Column Name      | Data Type    | Constraints          | Description                    |
|------------------|--------------|----------------------|--------------------------------|
| id               | BIGSERIAL    | PRIMARY KEY          | Auto-incrementing ID           |
| company_name     | VARCHAR(255) | NOT NULL             | Name of the company            |
| position_title   | VARCHAR(255) | NOT NULL             | Job position title             |
| application_date | DATE         | NOT NULL             | When you applied               |
| status           | VARCHAR(50)  | NOT NULL             | APPLIED/INTERVIEWING/OFFER/REJECTED |
| job_url          | VARCHAR(500) | NULLABLE             | Link to job posting            |
| notes            | TEXT         | NULLABLE             | Your personal notes            |
| created_at       | TIMESTAMP    | DEFAULT NOW()        | Record creation time           |
| updated_at       | TIMESTAMP    | DEFAULT NOW()        | Last update time               |

## Indexes
- Index on status
- Index on date

