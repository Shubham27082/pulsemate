# PulseMate — Healthcare Appointment & Live Queue Platform

Production-style MVP with role-based access, OTP auth, real-time queue, push notifications, admin campaigns, and full clinic workflow.

---

## ✅ What's Built

| Module | Status |
|--------|--------|
| OTP Auth — SMS via 2Factor / MSG91 / Twilio | ✅ Done |
| WhatsApp OTP (alongside SMS) | ✅ Done |
| JWT access + refresh token rotation | ✅ Done |
| HttpOnly cookie session | ✅ Done |
| Role-based route protection | ✅ Done |
| Super Admin panel | ✅ Done |
| Clinic Owner dashboard | ✅ Done |
| Doctor dashboard + queue | ✅ Done |
| Receptionist queue management | ✅ Done |
| Patient booking + live queue | ✅ Done |
| Socket.io live queue updates | ✅ Done |
| Walk-in patient flow | ✅ Done |
| Admin Notification Campaigns | ✅ Done |
| Firebase push notifications (FCM) | ✅ Done |
| In-app notification inbox (mobile) | ✅ Done |
| Prisma schema + migrations | ✅ Done |
| Seed data (8 users, 1 clinic) | ✅ Done |
| Audit logging | ✅ Done |
| Rate limiting + Helmet security | ✅ Done |

---

## 🚀 Quick Start — Pull & Run

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally

---

### Step 1 — Clone & install

```bash
git clone https://github.com/Shubham27082/pulsemate.git
cd pulsemate
git checkout feature/otp-campaigns-whatsapp

cd backend && npm install
cd ../frontend && npm install
cd ../PulseMateApp && npm install
```

---

### Step 2 — Configure environment

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and set at minimum:

```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/pulsemate_db"
```

Everything else has safe defaults for local dev:
- `SMS_PROVIDER=mock` — OTP prints to backend terminal, no SMS account needed
- `EMAIL_PROVIDER=console` — emails print to terminal
- Razorpay, Firebase — leave blank, features gracefully degrade

---

### Step 3 — Setup database

Create the database in PostgreSQL first:
```sql
CREATE DATABASE pulsemate_db;
```

Then run migrations and seed:
```bash
cd backend
npx prisma generate
npx prisma migrate deploy
node prisma/seed.js
```

For future schema changes, create a new migration after editing `schema.prisma`:
```bash
cd backend
npx prisma migrate dev --name your_change_name
```

---

### Step 4 — Start servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

**Terminal 3 — Mobile app (optional):**
```bash
cd PulseMateApp
npx expo start
# Scan QR with Expo Go app on the same WiFi
# Cross-network (phone on different WiFi/data): npx expo start --tunnel
```

Open **http://localhost:3000** in your browser.

---

## 🔑 Test Credentials

All staff passwords: `Password@123`

| Role | Mobile | Email |
|------|--------|-------|
| Super Admin | +919000000001 | admin@pulsemate.com |
| Clinic Owner | +919000000002 | owner@pulsemate.com |
| Doctor 1 (Cardiologist) | +919000000003 | doctor1@pulsemate.com |
| Doctor 2 (General) | +919000000004 | doctor2@pulsemate.com |
| Receptionist | +919000000005 | reception@pulsemate.com |
| Patient 1 | +919000000006 | OTP login |
| Patient 2 | +919000000007 | OTP login |
| Patient 3 | +919000000008 | OTP login |

> **Dev OTP:** Since `OTP_PROVIDER=console`, the OTP prints in the backend terminal AND is returned in the API response. No SMS needed for testing.

> **Clinic email verification:** For local development without a verified domain, keep `EMAIL_PROVIDER=console` and use the terminal output to test the email OTP flow. For production, switch to `Resend` with a verified domain and `RESEND_API_KEY` plus `RESEND_FROM_EMAIL`.
>
> SMTP is still available as an optional fallback, but `Resend` is the cleaner choice once you have a verified sender/domain.

---

## 🗂️ Project Structure

```
PulseMate/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # All 12 models
│   │   ├── seed.js                # Sample data
│   │   └── migrations/init/       # SQL migration
│   └── src/
│       ├── config/                # DB client, logger
│       ├── controllers/           # auth, admin, clinic, doctor, reception, patient
│       ├── middleware/            # authenticate, authorize, error handler
│       ├── routes/                # All API routes
│       ├── services/              # OTP, token, audit
│       ├── socket/                # Socket.io events
│       ├── utils/                 # response helpers, crypto
│       ├── validators/            # Joi schemas
│       └── server.js              # Express + Socket.io entry
│
├── frontend/
│   └── src/
│       ├── api/                   # Axios calls per role
│       ├── components/ui/         # Shared UI components
│       ├── hooks/useSocket.js     # Socket.io hook
│       ├── layouts/               # AuthLayout, DashboardLayout
│       ├── pages/
│       │   ├── auth/              # Login, Register
│       │   ├── patient/           # Dashboard, Search, Book, Queue, Profile
│       │   ├── doctor/            # Dashboard, Appointments, Queue, Profile
│       │   ├── receptionist/      # Dashboard, TodayQueue, WalkIn
│       │   ├── owner/             # Dashboard, Clinic, Staff, Appointments, Queue
│       │   └── admin/             # Dashboard, Clinics, Users
│       ├── store/authStore.js     # Zustand auth state
│       └── App.jsx                # All routes with role protection
│
├── setup-database.bat             # One-click DB setup
├── start-backend.bat              # Start backend
└── start-frontend.bat             # Start frontend
```

---

## 🔌 API Reference

### Auth
```
POST /api/auth/send-otp          { mobile, purpose }
POST /api/auth/verify-otp        { mobile, otp, purpose, name? }
POST /api/auth/login-password    { mobile, password }
POST /api/auth/refresh           (uses HttpOnly cookie)
POST /api/auth/logout
GET  /api/auth/me
```

### Patient
```
GET  /api/patient/doctors                    Search doctors
GET  /api/patient/doctors/:id                Doctor profile
POST /api/patient/appointments               Book appointment
GET  /api/patient/appointments               My appointments
GET  /api/patient/queue/:appointmentId       Live queue status
PATCH /api/patient/appointments/:id/cancel   Cancel
GET  /api/patient/profile
PATCH /api/patient/profile
```

### Reception
```
GET   /api/reception/queue/:doctorId?clinicId=   Today's queue
POST  /api/reception/walk-in                     Add walk-in
PATCH /api/reception/queue/:queueItemId/check-in Check in patient
PATCH /api/reception/queue/:queueId/call-next    Call next
PATCH /api/reception/queue-item/:id/skip         Skip
PATCH /api/reception/queue-item/:id/complete     Complete
PATCH /api/reception/queue/:queueId/pause        Pause
PATCH /api/reception/queue/:queueId/resume       Resume
```

### Doctor
```
GET   /api/doctor/today                      Today's appointments
GET   /api/doctor/appointments               All appointments
PATCH /api/doctor/appointments/:id/start     Start consultation
PATCH /api/doctor/appointments/:id/complete  Complete + notes
PATCH /api/doctor/availability               Toggle online/offline
GET   /api/doctor/profile
PATCH /api/doctor/profile
```

### Clinic Owner
```
POST  /api/clinics                           Create clinic
GET   /api/clinics/my                        My clinics
GET   /api/clinics/:id
PATCH /api/clinics/:id                       Update clinic
POST  /api/clinics/:id/staff                 Add doctor/receptionist
GET   /api/clinics/:id/staff
PATCH /api/clinics/:id/staff/:staffId/status Toggle staff
GET   /api/clinics/:id/appointments          All clinic appointments
```

### Admin
```
GET   /api/admin/dashboard
GET   /api/admin/clinics
PATCH /api/admin/clinics/:id/approve         Approve/reject
GET   /api/admin/users
POST  /api/admin/users                       Create staff
PATCH /api/admin/users/:id/status            Enable/disable
```

---

## ⚡ Socket.io Events

Room format: `queue:{clinicId}:{doctorId}:{YYYY-MM-DD}`

| Event | Direction | Trigger |
|-------|-----------|---------|
| `patient:joinQueueRoom` | Client→Server | Patient opens live queue |
| `staff:joinQueueRoom` | Client→Server | Receptionist/Doctor opens queue |
| `queue:updated` | Server→Client | Any queue change |
| `queue:called` | Server→Client | Patient called by receptionist |
| `queue:positionUpdated` | Server→Client | Positions recalculated |
| `queue:paused` | Server→Client | Queue paused |
| `queue:resumed` | Server→Client | Queue resumed |
| `queue:completed` | Server→Client | Patient consultation done |

---

## 🔐 Security Features

- Passwords hashed with bcrypt (12 rounds)
- OTPs hashed with bcrypt, never stored plain
- JWT access tokens (15 min expiry)
- Refresh token rotation with reuse detection
- HttpOnly secure cookies for refresh tokens
- Helmet.js security headers
- CORS restricted to frontend URL
- Rate limiting on OTP (5/15min) and login endpoints
- Role-based authorization middleware
- Audit logs for all important actions
- Input validation with Joi on all endpoints

---

## 📱 OTP Providers

Set `SMS_PROVIDER` in `backend/.env`:

| Value | Description |
|-------|-------------|
| `mock` | Dev mode — prints OTP to terminal, no account needed (default) |
| `2factor` | 2Factor.in — simple India SMS, sign up at https://2factor.in |
| `msg91` | MSG91 — India production, sign up at https://msg91.com |
| `twilio` | Twilio — international SMS, sign up at https://twilio.com |

### WhatsApp OTP (optional)

Set `WHATSAPP_PROVIDER` to send OTP on **both SMS and WhatsApp** simultaneously:

| Value | Description |
|-------|-------------|
| _(blank)_ | WhatsApp disabled (default) |
| `2factor` | 2Factor WhatsApp — uses same `SMS_API_KEY`, enable in 2factor.in dashboard |
| `twilio` | Twilio WhatsApp — requires `TWILIO_WHATSAPP_FROM` number |

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary | `#2563EB` |
| Secondary | `#22C55E` |
| Background | `#F9FAFB` |
| Card | `#FFFFFF` |
| Text | `#111827` |
| Muted | `#6B7280` |
| Error | `#EF4444` |
