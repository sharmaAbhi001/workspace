-- AlterTable
ALTER TABLE "Email" ADD COLUMN "extractionNeeded" BOOLEAN,
ADD COLUMN "extractIntents" JSONB;
