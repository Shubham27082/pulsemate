-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OtpPurpose" ADD VALUE 'PHONE_VERIFY';
ALTER TYPE "OtpPurpose" ADD VALUE 'PASSWORD_RESET';

-- AlterTable
ALTER TABLE "clinics" ADD COLUMN     "licenseDocumentUrl" TEXT;

-- AlterTable
ALTER TABLE "doctor_profiles" ADD COLUMN     "documentUrl" TEXT;

-- AlterTable
ALTER TABLE "otp_verifications" ADD COLUMN     "isUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxAttempts" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "jwtId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedByToken" TEXT,
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_jwtId_key" ON "refresh_tokens"("jwtId");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_revokedAt_expiresAt_idx" ON "refresh_tokens"("userId", "revokedAt", "expiresAt");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
