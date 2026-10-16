# 🚌 SmartTravel - Full-Stack Smart Bus Booking & Real-Time Tracking Platform

SmartTravel is an intelligent intercity bus reservation platform featuring real-time GPS tracking on interactive OpenStreetMap, atomic PostgreSQL seat bookings, and a **Triple-Stage Smart Destination Alarm** with geofenced triggers at **2 km**, **500 m**, and **200 m**.

The application is architected for unified single-service deployment on **Render** backed by **Neon Serverless PostgreSQL**.

---

## 🌟 Key Architecture & Highlights

- **Unified Production Runtime**: Express 5 serves both the REST API, Socket.IO WebSockets, and the compiled Vite React single-page frontend from a single public origin.
- **Backend**: Node.js, Express 5, TypeScript, Prisma ORM 7 with `@prisma/adapter-pg`, PostgreSQL, Socket.IO, Zod validation, bcrypt password hashing, and JWT authorization.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS with custom **Lavender Palette** aesthetic (`lavender-50` through `lavender-950`), Leaflet / React-Leaflet interactive maps, and Web Audio API synthesized chimes.
- **GPS Telemetry Simulation**:
  - Simulates active buses moving between real-world geo-coordinates along highway corridors (e.g., Bangalore ➔ Chennai, Mumbai ➔ Pune, Hyderabad ➔ Bangalore).
  - Calculates dynamic speed, heading angle, remaining distance, next stop ETA, and final destination ETA.
  - Clearly tagged with `isSimulated: true` and `dataSource: "GPS_SIMULATOR"`.
- **Smart Destination Alarm System**:
  - Geofence calculation via Haversine distance formula against user's drop-off stop.
  - **Stage 1 (2 km)**: Informational wake-up chime (523Hz ➔ 659Hz) & luggage notice.
  - **Stage 2 (500 m)**: Warning double-beep (784Hz) & door approach notification.
  - **Stage 3 (200 m)**: Urgent arrival siren pulse (880Hz) prompting immediate disembarkation.
- **Atomic Transactions**:
  - PostgreSQL transaction guarantees zero double-booking on simultaneous seat reservations.
  - Instant seat recovery on booking cancellation.
- **Admin Dashboard**:
  - Live revenue analytics, fleet occupancy percentage, route popularity breakdown.
  - Bus fleet controls (toggle simulation, add buses, manage trips).

---

## 🚀 Render + Neon PostgreSQL Deployment Guide

SmartTravel is packaged to deploy on Render as a **Web Service** with zero separate frontend hosting costs, using Neon Serverless PostgreSQL for persistent storage.

### 1. Provision Neon PostgreSQL
1. Create a project at [Neon.tech](https://neon.tech).
2. From the Neon Dashboard, copy:
   - **Pooled connection string** (port `6543`, with PgBouncer) ➔ assign to `DATABASE_URL`.
   - **Direct connection string** (port `5432`, unpooled) ➔ assign to `DIRECT_URL`.

### 2. Configure Render Web Service
1. Connect your Git repository in the [Render Dashboard](https://dashboard.render.com).
2. Choose **Web Service** with runtime **Node**.
3. Configure the service settings:
   - **Name**: `smarttravel` (or your preferred name)
   - **Region**: Same region as your Neon database (e.g., Frankfurt, Oregon)
   - **Branch**: `main`
   - **Build Command**: `npm run render:build`
   - **Start Command**: `npm start`

### 3. Environment Variables

Configure the following environment variables in the Render dashboard:

| Variable | Required | Description | Example / Note |
|---|---|---|---|
| `NODE_ENV` | **Yes** | Set application environment to production | `production` |
| `DATABASE_URL` | **Yes** | Neon pooled PostgreSQL connection string (runtime queries) | `postgresql://user:pass@ep-pooler.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | Recommended | Neon direct PostgreSQL connection string (schema migrations) | `postgresql://user:pass@ep-direct.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | **Yes** | Strong, random secret for JWT authentication tokens | Generate via: `openssl rand -base64 32` |
| `PORT` | Auto | Port assigned by Render | Automatically provided by Render (server binds to `0.0.0.0:${PORT}`) |
| `INITIAL_ADMIN_EMAIL` | Optional | Email for initial administrator account during seeding | `admin@yourdomain.com` |
| `INITIAL_ADMIN_PASSWORD` | Optional | Secure password for initial administrator account | Set your own secret password |
| `ALLOWED_ORIGINS` | Optional | Comma-separated extra origins allowed for CORS | Leave empty for same-origin deployment |

> [!IMPORTANT]
> The backend automatically validates `DATABASE_URL` and `JWT_SECRET` at startup in production. If either variable is missing or set to the weak development default, the server fails safely with an explicit error to prevent compromised deployments.

---

## 🗄️ Database Schema Deployment & Seeding

SmartTravel uses Prisma 7 migrations for reliable schema management.

### Initial Schema Migration

- **For Brand New Databases**:
  Run the deploy migration script (e.g. from Render Shell or a Render pre-deploy command):
  ```bash
  npm run migrate:deploy
  ```
  This applies `backend/prisma/migrations/20261016000000_init/migration.sql` creating all tables, indexes, and relations without prompts.

- **For Existing Databases with Prior Tables (Non-Destructive Baseline)**:
  If tables already exist from previous development, baseline the migration without resetting:
  ```bash
  npx --prefix backend prisma migrate resolve --applied 20261016000000_init
  ```

### Safe Idempotent Database Seeding
To populate initial bus routes, highway corridors, schedules, and the administrator account:
```bash
npm run seed
```
- **Non-Destructive**: Seeding never deletes existing bookings, alarms, or passenger accounts in production.
- **Idempotent**: Can be run repeatedly without duplicating routes, buses, or schedules.
- **Secure**: Uses `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` from your environment; no passwords are printed to logs.

---

## 💻 Local Development Setup

### 1. Prerequisites
- Node.js 20+
- PostgreSQL (local instance or Neon database)

### 2. Environment Configuration
Create `backend/.env` with your local settings (see [`.env.example`](file:///home/plvalliyammai/smarttravel/.env.example)):
```env
PORT=5000
DATABASE_URL="postgresql://smarttravel:smarttravel@localhost:5432/smarttravel_db?schema=public"
JWT_SECRET="smarttravel_super_secret_jwt_key_2026_secure_hash"
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
```

### 3. Install & Build
```bash
# Install dependencies, generate Prisma client, and compile both frontend & backend
npm run build
```

### 4. Database Setup & Seed
```bash
# Apply schema to local PostgreSQL
npm run migrate:deploy

# Seed routes, stops, and development demo accounts
npm run seed
```

### 5. Running the Application
- **Unified Mode** (Single process serving API + frontend at http://localhost:5000):
  ```bash
  npm start
  ```
- **Hot-Reloading Development Mode**:
  - Backend: `npm run dev:backend` (port 5000 with tsx watch)
  - Frontend: `npm run dev:frontend` (port 5173 with Vite hot reload)

### 6. Automated Testing
Run the comprehensive test suite (API tests + Destination Alarm verification):
```bash
npm test
```

---

## 🗺️ Real-World Seeded Corridors

1. **Bangalore to Chennai Express** (345 km, 7 highway stops)
2. **Mumbai to Pune Superfast** (152 km, 6 expressway stops)
3. **Hyderabad to Bangalore Highway Liner** (570 km, 7 stops)
