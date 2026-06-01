ALTER TYPE "ApprovalStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';

ALTER TABLE "clinics"
ADD COLUMN "verifiedById" TEXT,
ADD COLUMN "landmark" TEXT,
ADD COLUMN "googleMapsLocation" TEXT,
ADD COLUMN "submittedAt" TIMESTAMP(3),
ADD COLUMN "verifiedAt" TIMESTAMP(3),
ADD COLUMN "clinicType" TEXT,
ADD COLUMN "doctorCount" INTEGER,
ADD COLUMN "clinicLogoUrl" TEXT,
ADD COLUMN "clinicCoverImageUrl" TEXT,
ADD COLUMN "emergencyContactNumber" TEXT,
ADD COLUMN "alternateEmail" TEXT,
ADD COLUMN "consultationModes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "weeklySchedule" JSONB,
ADD COLUMN "avgConsultationMinutes" INTEGER,
ADD COLUMN "appointmentSlotMinutes" INTEGER,
ADD COLUMN "dailyPatientCapacity" INTEGER,
ADD COLUMN "facilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "languagesSpoken" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "paymentMethods" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "insuranceSupported" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "clinicRegistrationNumber" TEXT,
ADD COLUMN "panNumber" TEXT,
ADD COLUMN "medicalEstablishmentCertificateUrl" TEXT,
ADD COLUMN "gstCertificateUrl" TEXT,
ADD COLUMN "panCardUrl" TEXT,
ADD COLUMN "additionalDocuments" JSONB;

ALTER TABLE "clinics"
ADD CONSTRAINT "clinics_verifiedById_fkey"
FOREIGN KEY ("verifiedById") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "clinics_verifiedById_idx" ON "clinics"("verifiedById");
CREATE INDEX "clinics_submittedAt_idx" ON "clinics"("submittedAt");
CREATE INDEX "clinics_clinicRegistrationNumber_idx" ON "clinics"("clinicRegistrationNumber");
