-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE');

-- CreateTable
CREATE TABLE "AuthIdentity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add providerEmail nullable first for backfill
ALTER TABLE "Integration" ADD COLUMN "providerEmail" TEXT;

-- Backfill providerEmail from User.email (lowercase)
UPDATE "Integration" AS i
SET "providerEmail" = LOWER(u."email")
FROM "User" AS u
WHERE i."userId" = u."id";

-- Failsafe for any orphan rows (should not exist with FK)
UPDATE "Integration"
SET "providerEmail" = LOWER("providerAccountId")
WHERE "providerEmail" IS NULL;

ALTER TABLE "Integration" ALTER COLUMN "providerEmail" SET NOT NULL;

-- Drop old one-integration-per-user unique
DROP INDEX "Integration_userId_provider_key";

-- CreateIndex
CREATE UNIQUE INDEX "AuthIdentity_provider_providerAccountId_key" ON "AuthIdentity"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "AuthIdentity_userId_idx" ON "AuthIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_provider_providerEmail_key" ON "Integration"("provider", "providerEmail");

-- CreateIndex
CREATE INDEX "Integration_userId_provider_idx" ON "Integration"("userId", "provider");

-- AddForeignKey
ALTER TABLE "AuthIdentity" ADD CONSTRAINT "AuthIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data migration: AuthIdentity from existing GMAIL integrations so users can still log in
INSERT INTO "AuthIdentity" ("id", "userId", "provider", "providerAccountId", "email", "createdAt")
SELECT gen_random_uuid()::text,
       i."userId",
       'GOOGLE'::"AuthProvider",
       i."providerAccountId",
       LOWER(u."email"),
       CURRENT_TIMESTAMP
FROM "Integration" AS i
INNER JOIN "User" AS u ON u."id" = i."userId"
WHERE i."provider" = 'GMAIL'
ON CONFLICT ("provider", "providerAccountId") DO NOTHING;
