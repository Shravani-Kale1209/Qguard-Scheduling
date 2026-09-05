# QGuard Demo Scheduling System

A secure, full-stack application built for Quantum Solutions to manage demo bookings with prospective clients. The system prevents double-bookings, handles automated email notifications (with ICS calendar invites), and allows clients to seamlessly reschedule or cancel their demos using secure tokens.

## Key Features

- **Double-Booking Protection:** Real-time slot availability checking and strict database-level unique constraints.
- **Dynamic Slot Generation:** Intelligent scheduling that respects business hours and currently booked slots.
- **Secure Token System:** Cryptographically generated secure tokens allow users to manage their bookings without requiring an account or login. Separate tokens are generated for rescheduling and cancellation.
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

## Project Structure

```
Qguard-Scheduling/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.js
│   ├── .env.example
│   ├── docker-compose.yml
│   ├── package.json
│   └── prisma.config.ts
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   └── package.json
├── .gitignore
└── README.md
```

## Prerequisites

Ensure you have the following installed before setting up the project:

- [Node.js](https://nodejs.org/) (v20+)
- [npm](https://www.npmjs.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for the PostgreSQL database)

## Setup Instructions

The application must be run using three separate terminal windows.

### Terminal 1 — PostgreSQL (Docker)

Start the PostgreSQL database using Docker Compose:

```bash
cd backend
docker-compose up -d
```
> Note: The `docker-compose.yml` uses generic local credentials by default.

### Terminal 2 — Backend Setup

Install backend dependencies, set up the database, and start the development server:

```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

The backend API will run at:
[http://localhost:4000](http://localhost:4000)

You can verify the backend is running by checking the health endpoint:
[http://localhost:4000/health](http://localhost:4000/health)

#### Backend Environment Variables

Before you can fully use the application, you must configure the backend environment variables. Copy the example configuration file:

```bash
cd backend
cp .env.example .env
```

Open the new `backend/.env` file and fill in the required variables (such as the database connection string, frontend URL, and SMTP details). Do NOT commit real credentials.

### Terminal 3 — Frontend Setup

Install frontend dependencies and start the Vite development server:

```bash
cd frontend
npm install
npm run dev
```

The frontend application will be accessible at:
[http://localhost:5173](http://localhost:5173)

## Double-Booking Prevention

The application uses two levels of protection to guarantee no overlapping demos:

1. **Backend Availability Checking:** Before creating or rescheduling a booking, the API validates the requested slot against all existing active bookings.
2. **Database-Level Unique Constraints:** PostgreSQL enforces unique constraints on active booking start times. This prevents race conditions in the event of concurrent requests attempting to book the exact same slot.

## Application Flow

1. **Landing Page**
   ↓
2. **Visitor Details:** Users enter their name, email, company, and job title.
   ↓
3. **Timezone & Slot Selection:** Users pick a date and their local timezone. The system queries available slots and presents them dynamically.
   ↓
4. **Booking Review:** Users review their details and confirm the booking.
   ↓
5. **Booking Confirmation:** The booking is saved in the database. Booking management links containing secure tokens are provided through the confirmation flow and confirmation email.
   ↓
6. **Confirmation Email + ICS Calendar Invite:** A detailed email is dispatched via SMTP with calendar integration.
   ↓
7. **Reschedule / Cancel:** Users can use their secure tokens to modify or cancel their demo.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/slots` | Fetch available time slots for a given date and timezone |
| `POST` | `/api/bookings` | Create a new demo booking |
| `GET` | `/api/bookings/:token` | Fetch booking details using a secure token |
| `POST` | `/api/bookings/:rescheduleToken/reschedule` | Reschedule an existing booking |
| `POST` | `/api/bookings/:cancelToken/cancel` | Cancel an existing booking |

## Email and Calendar Integration

- Confirmation emails are sent through standard SMTP.
- Rescheduling and cancellation notification emails are also supported.
- Standard `.ics` calendar invites are automatically generated and attached to the confirmation email.
- **Note:** Actual email delivery requires valid SMTP configuration to be filled in `backend/.env`. Gmail users should use a Google App Password rather than their normal Gmail account password.

## Security Notes

- No user account or authentication is required to book a demo.
- Secure cryptographically generated tokens are used exclusively for booking management (rescheduling/canceling).
- Environment secrets are never committed to the repository (enforced via `.gitignore`).
- Database-level protection helps prevent double booking.
- Strict input validation is performed on API requests using Zod schemas.
