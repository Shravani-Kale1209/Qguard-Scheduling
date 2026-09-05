# QGuard Demo Scheduling System

A secure, full-stack application built for Quantum Solutions to manage demo bookings with prospective clients. The system prevents double-bookings, handles automated email notifications (with ICS calendar invites), and allows clients to seamlessly reschedule or cancel their demos using secure tokens.

## Key Features

- **Double-Booking Protection:** Real-time slot availability checking and strict database-level unique constraints.
- **Dynamic Slot Generation:** Intelligent scheduling that respects business hours and currently booked slots.
- **Secure Token System:** Time-bound, cryptographically generated tokens allow users to manage their bookings without requiring a login.
- **Automated Notifications:** Sends immediate confirmation emails with standard ICS calendar attachments for calendar integration.
- **Modern UI:** Clean, responsive, dark-mode focused React frontend.

## System Architecture

The project is structured as a monorepo containing two main parts:

- **Frontend:** React 19 application built with Vite, styled with custom CSS and Lucide React icons.
- **Backend:** Node.js Express 5 REST API using Prisma ORM with PostgreSQL.
- **Database:** PostgreSQL 16 (containerized via Docker).

## Tech Stack

- **Frontend:** React, React Router, Vite, CSS
- **Backend:** Node.js, Express.js, Prisma, PostgreSQL
- **Tools:** Docker, Nodemailer, Zod (validation)

## Prerequisites

Ensure you have the following installed before setting up the project:

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for the PostgreSQL database)

## Setup Instructions

### 1. Database Setup (Docker)

Start the PostgreSQL database using Docker Compose:

```bash
cd backend
docker-compose up -d
```
> Note: The `docker-compose.yml` uses generic local credentials (`qguard_password`) by default. For production, pass the `POSTGRES_PASSWORD` environment variable.

### 2. Backend Setup

Install backend dependencies and run migrations:

```bash
cd backend
npm install
```

Copy the example environment variables file and configure it:
```bash
cp .env.example .env
```

**Required Environment Variables (`backend/.env`):**
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (e.g. `postgresql://qguard:qguard_password@localhost:5432/qguard_db?schema=public`) |
| `PORT` | API Port (default `4000`) |
| `FRONTEND_URL` | The URL of the frontend (e.g. `http://localhost:5173`) |
| `EMAIL_HOST` | SMTP server host (e.g. `smtp.gmail.com`) |
| `EMAIL_PORT` | SMTP port (e.g. `587`) |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASSWORD` | SMTP password (App Password) |
| `EMAIL_FROM` | Sender display name & address |

*Note: Real email credentials must be supplied through `.env` and are NOT committed to the repository.*

Run the Prisma migrations and generate the client:

```bash
npx prisma migrate deploy
npx prisma generate
```

Start the backend server:

```bash
npm run dev
```

### 3. Frontend Setup

In a new terminal window, install frontend dependencies:

```bash
cd frontend
npm install
```

Start the Vite development server:

```bash
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/slots` | Fetch available time slots for a given date and timezone |
| `POST` | `/api/bookings` | Create a new demo booking |
| `GET` | `/api/bookings/:token` | Fetch booking details using a secure token |
| `POST` | `/api/bookings/:rescheduleToken/reschedule` | Reschedule an existing booking |
| `POST` | `/api/bookings/:cancelToken/cancel` | Cancel an existing booking |

## Booking Flow

1. **Visitor Form:** Users enter their name, email, company, and job title.
2. **Slot Selection:** Users pick a date and their local timezone. The system queries available slots and presents them dynamically.
3. **Review:** Users review their details and confirm the booking.
4. **Confirmation:** The booking is saved, secure reschedule/cancel tokens are generated, and a confirmation email (with an `.ics` attachment) is sent via SMTP.

## Security Notes

- The system intentionally does not require user accounts or authentication.
- Instead, each booking is issued two unique 64-character hex tokens (`rescheduleToken` and `cancelToken`).
- These tokens are delivered exclusively to the provided email address.
- The `generated/prisma` client and `.env` files are explicitly excluded from source control.
