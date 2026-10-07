import { prisma } from "../../config/database/client.js";
import type { Decision } from "../../generated/prisma/enums.js";
import type { DraftOutput } from "./emailDraftAgent.js";

export type SaveDraftInput = {
  userId: string;
  emailId: string;
  round: number;
  draft: DraftOutput;
  model: string;
  instructions?: string | null;
};

export type SavedDraft = {
  id: string;
  emailId: string;
  round: number;
  subject: string;
  body: string;
  decision: Decision;
  status: string;
};

export async function saveDraftRound(
  input: SaveDraftInput
): Promise<SavedDraft> {
  const row = await prisma.aIWrittenEmail.create({
    data: {
      userId: input.userId,
      emailId: input.emailId,
      round: input.round,
      subject: input.draft.subject,
      body: input.draft.body,
      aiModel: input.model,
      decision: "PENDING",
      status: "PENDING",
      instructions: input.instructions ?? null,
    },
    select: {
      id: true,
      emailId: true,
      round: true,
      subject: true,
      body: true,
      decision: true,
      status: true,
    },
  });

  await prisma.email.update({
    where: { id: input.emailId },
    data: { processingStatus: "AWAITING_REVIEW" },
  });

  return row;
}

export async function markEmailProcessingDone(emailId: string): Promise<void> {
  await prisma.email.update({
    where: { id: emailId },
    data: { processingStatus: "DONE" },
  });
}

export async function markDraftTimedOut(draftId: string): Promise<void> {
  await prisma.aIWrittenEmail.update({
    where: { id: draftId },
    data: {
      decision: "SKIPPED",
      status: "FAILED",
      instructions: "Timed out waiting for human decision (24h)",
    },
  });
}

export async function markDraftNeedsHumanWrite(
  draftId: string
): Promise<void> {
  await prisma.aIWrittenEmail.update({
    where: { id: draftId },
    data: {
      decision: "SKIPPED",
      status: "FAILED",
      instructions:
        "Max AI draft rounds reached. Please write the reply yourself.",
    },
  });
}
