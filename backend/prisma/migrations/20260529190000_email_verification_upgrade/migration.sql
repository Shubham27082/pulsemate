ALTER TABLE "clinics"
ADD COLUMN "ownerMobileVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "ownerEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "mobileOtpVerifiedAt" TIMESTAMP(3),
ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

CREATE TABLE "email_verifications" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "purpose" TEXT NOT NULL DEFAULT 'CLINIC_OWNER_REGISTER',
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "isUsed" BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_verifications_tokenHash_key" ON "email_verifications"("tokenHash");
CREATE INDEX "email_verifications_email_purpose_createdAt_idx" ON "email_verifications"("email", "purpose", "createdAt");
CREATE INDEX "email_verifications_tokenHash_idx" ON "email_verifications"("tokenHash");
