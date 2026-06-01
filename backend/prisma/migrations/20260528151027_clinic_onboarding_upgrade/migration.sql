-- DropIndex (IF EXISTS to handle cases where index was never created)
DROP INDEX IF EXISTS "clinics_clinicRegistrationNumber_idx";

-- DropIndex
DROP INDEX IF EXISTS "clinics_submittedAt_idx";

-- DropIndex
DROP INDEX IF EXISTS "clinics_verifiedById_idx";
