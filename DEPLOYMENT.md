# PulseMate — Deployment Guide

## Stack
| Part | Platform | URL after deploy |
|------|----------|-----------------|
| Backend (Node + Socket.io) | Railway | `https://pulsemate-backend.up.railway.app` |
| Database (PostgreSQL) | Railway (bundled) | internal connection |
| Frontend (React + Vite) | Vercel | `https://pulsemate.vercel.app` |
| Mobile App (Expo) | Expo EAS (APK) | Download link / Play Store |

---

## Step 1 — Deploy Backend on Railway

1. Go to [railway.app](https://railway.app) → **New Project**
2. Click **Deploy from GitHub repo** → select `Shubham27082/pulsemate`
3. Set **Root Directory** to `backend`
4. Railway auto-detects Node.js

### Add PostgreSQL
- In your Railway project → **New Service** → **Database** → **PostgreSQL**
- Railway auto-injects `DATABASE_URL` into your backend service

### Set Backend Environment Variables
In Railway → your backend service → **Variables** tab, add:

```
DATABASE_URL          = postgresql://postgres:XHAHBeVRHDFaSGNNozGOXWADzjYBzgwr@postgres.railway.internal:5432/railway
JWT_ACCESS_SECRET     = pulsemate-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET    = pulsemate-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRY     = 15m
JWT_REFRESH_EXPIRY    = 7d
COOKIE_SECRET         = pulsemate-cookie-secret-key
NODE_ENV              = production
PORT                  = 5000
FRONTEND_URL          = https://your-app.vercel.app
OTP_PROVIDER          = console
EMAIL_PROVIDER        = console
OTP_EXPIRY_MINUTES    = 5
OTP_MAX_ATTEMPTS      = 5
OTP_RESEND_COOLDOWN_SECONDS = 60
EMAIL_VERIFICATION_EXPIRY_MINUTES = 10
EMAIL_VERIFICATION_MAX_ATTEMPTS = 5
EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS = 60
```

5. Railway builds and deploys automatically.
6. Note your backend URL: `https://pulsemate-backend.up.railway.app`

### Seed the Database (first time only)
In Railway → your backend service → **Settings** → **Deploy** → **Run Command**, run:
```
node prisma/seed.js
```

---

## Step 2 — Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import `Shubham27082/pulsemate` from GitHub
3. Set **Root Directory** to `frontend`
4. Framework preset: **Vite**
5. Add Environment Variable:
```
VITE_API_URL = https://pulsemate-backend.up.railway.app/api
```
6. Deploy
7. Copy your Vercel URL → go back to Railway → update `FRONTEND_URL`

---

## Step 3 — Build Mobile APK (Expo EAS)

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Update `PulseMateApp/src/api/axios.js` — change `BASE_URL` to your Railway URL:
```js
export const BASE_URL = 'https://pulsemate-backend.up.railway.app/api';
```

4. Build APK:
```bash
cd PulseMateApp
eas build --platform android --profile preview
```

This gives a downloadable `.apk` to install on any Android device.

---

## Health Check
After deploy, visit:
```
https://your-backend.up.railway.app/health
```
Should return:
```json
{ "status": "ok", "service": "PulseMate API" }
```

---

## Staff Login Credentials (after seed)
| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@pulsemate.com | Password@123 |
| Clinic Owner | owner@pulsemate.com | Password@123 |
| Doctor (Pooja) | pooja@pulsemate.com | Password@123 |
| Receptionist | reception@pulsemate.com | Password@123 |
