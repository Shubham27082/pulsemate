-- Extend patient_profiles with onboarding fields

ALTER TABLE "patient_profiles"
  ADD COLUMN IF NOT EXISTS "dob"               TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "city"              TEXT,
  ADD COLUMN IF NOT EXISTS "allergies"         TEXT,
  ADD COLUMN IF NOT EXISTS "existingDiseases"  TEXT,
  ADD COLUMN IF NOT EXISTS "insuranceProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "profileCompleted"  BOOLEAN NOT NULL DEFAULT false;
