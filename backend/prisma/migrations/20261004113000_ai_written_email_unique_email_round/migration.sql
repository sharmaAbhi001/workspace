-- Fix uniqueness so each email can have its own draft rounds.
DROP INDEX IF EXISTS "AIWrittenEmail_userId_round_key";

CREATE UNIQUE INDEX "AIWrittenEmail_emailId_round_key" ON "AIWrittenEmail"("emailId", "round");
