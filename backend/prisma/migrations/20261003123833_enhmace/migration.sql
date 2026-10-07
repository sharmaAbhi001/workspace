/*
  Warnings:

  - A unique constraint covering the columns `[userId,round]` on the table `AIWrittenEmail` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,providerId]` on the table `Email` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `emailId` to the `Reminder` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('ACTIVE', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('PENDING', 'CLEAN', 'INFECTED', 'REJECTED');

-- AlterTable
ALTER TABLE "AIWrittenEmail" ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "round" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Email" ADD COLUMN     "needsReply" BOOLEAN,
ALTER COLUMN "toEmail" DROP NOT NULL,
ALTER COLUMN "toName" DROP NOT NULL,
ALTER COLUMN "category" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Integration" ADD COLUMN     "status" "IntegrationStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "createdByAI" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailId" TEXT;

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "emailId" TEXT;

-- AlterTable
ALTER TABLE "Reminder" ADD COLUMN     "createdByAI" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailId" TEXT NOT NULL,
ADD COLUMN     "isDone" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "providerAttachmentId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalFilename" TEXT,
    "mimeType" TEXT NOT NULL,
    "declaredMimeType" TEXT,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "isInline" BOOLEAN NOT NULL DEFAULT false,
    "contentId" TEXT,
    "storageKey" TEXT,
    "scanStatus" "ScanStatus" NOT NULL DEFAULT 'PENDING',
    "scanNote" TEXT,
    "extractedText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attachment_emailId_idx" ON "Attachment"("emailId");

-- CreateIndex
CREATE INDEX "Attachment_userId_sha256_idx" ON "Attachment"("userId", "sha256");

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_emailId_providerAttachmentId_key" ON "Attachment"("emailId", "providerAttachmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AIWrittenEmail_userId_round_key" ON "AIWrittenEmail"("userId", "round");

-- CreateIndex
CREATE INDEX "Email_userId_receivedAt_idx" ON "Email"("userId", "receivedAt");

-- CreateIndex
CREATE INDEX "Email_userId_category_idx" ON "Email"("userId", "category");

-- CreateIndex
CREATE INDEX "Email_userId_isReplied_idx" ON "Email"("userId", "isReplied");

-- CreateIndex
CREATE UNIQUE INDEX "Email_userId_providerId_key" ON "Email"("userId", "providerId");

-- CreateIndex
CREATE INDEX "Meeting_userId_startTime_idx" ON "Meeting"("userId", "startTime");

-- CreateIndex
CREATE INDEX "Note_userId_emailId_idx" ON "Note"("userId", "emailId");

-- CreateIndex
CREATE INDEX "Reminder_userId_date_idx" ON "Reminder"("userId", "date");

-- CreateIndex
CREATE INDEX "Reminder_userId_emailId_idx" ON "Reminder"("userId", "emailId");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;
