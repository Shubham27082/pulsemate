-- Migration: Follow-up queue, Prescriptions, Payments, FCM tokens

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE "PaymentMethod" AS ENUM ('RAZORPAY', 'CASH', 'UPI');

-- ─── QueueItem: add follow-up fields ─────────────────────────────────────────

ALTER TABLE "queue_items"
  ADD COLUMN "isFollowUp"  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "followUpOf"  TEXT;

-- ─── Prescriptions ───────────────────────────────────────────────────────────

CREATE TABLE "prescriptions" (
  "id"               TEXT NOT NULL,
  "appointmentId"    TEXT NOT NULL,
  "doctorId"         TEXT NOT NULL,
  "patientId"        TEXT NOT NULL,
  "diagnosis"        TEXT,
  "medicines"        JSONB NOT NULL DEFAULT '[]',
  "instructions"     TEXT,
  "followUpDate"     TIMESTAMP(3),
  "requiresFollowUp" BOOLEAN NOT NULL DEFAULT false,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "prescriptions_appointmentId_key" ON "prescriptions"("appointmentId");

ALTER TABLE "prescriptions"
  ADD CONSTRAINT "prescriptions_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "prescriptions_doctorId_fkey"
    FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "prescriptions_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── Payments ────────────────────────────────────────────────────────────────

CREATE TABLE "payments" (
  "id"                  TEXT NOT NULL,
  "appointmentId"       TEXT NOT NULL,
  "patientId"           TEXT NOT NULL,
  "amount"              DOUBLE PRECISION NOT NULL,
  "status"              "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "method"              "PaymentMethod" NOT NULL DEFAULT 'RAZORPAY',
  "razorpayOrderId"     TEXT,
  "razorpayPaymentId"   TEXT,
  "razorpaySignature"   TEXT,
  "paidAt"              TIMESTAMP(3),
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payments_appointmentId_key" ON "payments"("appointmentId");

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "payments_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── FCM Tokens ──────────────────────────────────────────────────────────────

CREATE TABLE "fcm_tokens" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "token"     TEXT NOT NULL,
  "platform"  TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fcm_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fcm_tokens_token_key" ON "fcm_tokens"("token");

ALTER TABLE "fcm_tokens"
  ADD CONSTRAINT "fcm_tokens_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
