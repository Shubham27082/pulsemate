-- CreateEnum
CREATE TYPE "PasswordResetPurpose" AS ENUM ('FORGOT_PASSWORD', 'SUPER_ADMIN_RESET');

-- AlterTable
ALTER TABLE "password_reset_tokens" ADD COLUMN     "purpose" "PasswordResetPurpose" NOT NULL DEFAULT 'FORGOT_PASSWORD';

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "password_reset_tokens_tokenHash_idx" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expiresAt_idx" ON "password_reset_tokens"("expiresAt");
