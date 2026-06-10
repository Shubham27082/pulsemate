-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'IN_APP', 'PUSH_AND_IN_APP');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationTargetType" AS ENUM ('ALL_USERS', 'SELECTED_USERS', 'CITY', 'STATE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PAUSED', 'STOPPED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CreateTable: NotificationRead (if not already created by previous migration)
CREATE TABLE IF NOT EXISTS "notification_reads" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "notificationId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_reads_pkey" PRIMARY KEY ("id")
);

-- Add foreign key if not exists
DO $$ BEGIN
  ALTER TABLE "notification_reads"
    ADD CONSTRAINT "notification_reads_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add unique index if not exists
CREATE UNIQUE INDEX IF NOT EXISTS "notification_reads_userId_notificationId_key"
  ON "notification_reads"("userId", "notificationId");

-- CreateTable: NotificationCampaign
CREATE TABLE IF NOT EXISTS "notification_campaigns" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
  "targetType" "NotificationTargetType" NOT NULL DEFAULT 'ALL_USERS',
  "targetCity" TEXT,
  "targetState" TEXT,
  "targetUserIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "scheduledAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "stoppedAt" TIMESTAMP(3),
  "createdByAdminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notification_campaigns_status_idx" ON "notification_campaigns"("status");
CREATE INDEX IF NOT EXISTS "notification_campaigns_channel_idx" ON "notification_campaigns"("channel");

-- CreateTable: UserNotification
CREATE TABLE IF NOT EXISTS "user_notifications" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "campaignId" TEXT,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "user_notifications_userId_idx" ON "user_notifications"("userId");
CREATE INDEX IF NOT EXISTS "user_notifications_campaignId_idx" ON "user_notifications"("campaignId");

DO $$ BEGIN
  ALTER TABLE "user_notifications"
    ADD CONSTRAINT "user_notifications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "user_notifications"
    ADD CONSTRAINT "user_notifications_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "notification_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
