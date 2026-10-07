-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'AWAITING_REVIEW', 'DONE', 'FAILED');

-- AlterTable
ALTER TABLE "Email" ADD COLUMN     "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Integration" ADD COLUMN     "lastManualSyncAt" TIMESTAMP(3),
ADD COLUMN     "lastSyncResult" JSONB,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Email_processingStatus_createdAt_idx" ON "Email"("processingStatus", "createdAt");
