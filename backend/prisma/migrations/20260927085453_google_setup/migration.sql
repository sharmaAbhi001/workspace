/*
  Warnings:

  - A unique constraint covering the columns `[provider,providerAccountId]` on the table `Integration` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `providerAccountId` to the `Integration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Integration" ADD COLUMN     "historyId" TEXT,
ADD COLUMN     "providerAccountId" TEXT NOT NULL,
ADD COLUMN     "watchExpiresAt" TIMESTAMP(3),
ALTER COLUMN "accessToken" DROP NOT NULL,
ALTER COLUMN "refreshToken" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Integration_provider_providerAccountId_key" ON "Integration"("provider", "providerAccountId");
