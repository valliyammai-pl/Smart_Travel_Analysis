# 🚌 SmartTravel - Full-Stack Smart Bus Booking & Real-Time Tracking Platform

SmartTravel is an intelligent intercity bus reservation platform featuring real-time GPS tracking on interactive OpenStreetMap, atomic PostgreSQL seat bookings, and a **Triple-Stage Smart Destination Alarm** with geofenced triggers at **2 km**, **500 m**, and **200 m**.

---

## 🌟 Key Architecture & Highlights

- **Backend**: Node.js, Express 5, TypeScript, Prisma ORM 7, PostgreSQL, Socket.IO, Zod validation, bcrypt password hashing, and JWT authorization.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS with custom **Lavender Palette** aesthetic (`lavender-50` through `lavender-950`), Leaflet / React-Leaflet interactive map, and Web Audio API synthesized chimes.
- **GPS Telemetry Simulation**:
  - Simulates active buses moving between real-world geo-coordinates along highway corridors (e.g. Bangalore ➔ Chennai, Mumbai ➔ Pune, Hyderabad ➔ Bangalore).
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

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **System Admin** | `admin@smarttravel.com` | `Admin@1234` |
| **Demo Passenger 1** | `user@smarttravel.com` | `User@1234` |
| **Demo Passenger 2** | `sarah@smarttravel.com` | `User@1234` |

---

## 🚀 Quick Start Guide

### 1. Database & Environment Configuration
Backend `.env` file at [`backend/.env`](file:///home/plvalliyammai/smarttravel/backend/.env):
```env
PORT=5000
DATABASE_URL="postgresql://smarttravel:smarttravel@localhost:5432/smarttravel_db?schema=public"
JWT_SECRET="smarttravel_super_secret_jwt_key_2026_secure_hash"
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
```

### 2. Seed Database
```bash
npm run seed
```

### 3. Run Test Suite
```bash
npm test
```

### 4. Build Full Stack
```bash
npm run build
```

### 5. Start Servers
- **Unified Full-Stack Server** (Serves API + Frontend on port 5000):
  ```bash
  npm start
  ```
- **Development Mode**:
  - Backend: `npm run dev:backend` (port 5000)
  - Frontend: `npm run dev:frontend` (port 5173 with Vite hot reloading)

---

## 🗺️ Real-World Seeded Corridors

1. **Bangalore to Chennai Express** (345 km, 7 major highway stops)
2. **Mumbai to Pune Superfast** (152 km, 6 expressway stops)
3. **Hyderabad to Bangalore Highway Liner** (570 km, 7 stops)
