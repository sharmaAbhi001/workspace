import { generateObject } from "ai";
import { NonRetriableError } from "inngest";
import { prisma } from "../../config/database/client.js";
import type { ExtractIntents } from "../jev.classifiction.js";
import { EXTRACTION_MODEL } from "./openai.js";
import {
  emailExtractionSchema,
  type EmailExtraction,
} from "./schemas.js";

const MAX_BODY_CHARS = 12_000;

export type ExtractEmailInput = {
  userId: string;
  emailId: string;
  extractIntents: ExtractIntents;
};

function enabledIntents(intents: ExtractIntents): string[] {
  return (Object.entries(intents) as [keyof ExtractIntents, boolean][])
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);
}

function buildSystemPrompt(intents: ExtractIntents): string {
  const enabled = enabledIntents(intents);

  return [
    "You extract structured items from an email for a personal productivity app.",
    "Only extract items for the enabled intents listed below.",
    "Do not invent facts. Prefer fewer high-quality items over speculative ones.",
    "Use ISO-8601 datetimes when times are present. Infer timezone only when clearly stated or implied.",
    "",
    `Enabled intents: ${enabled.join(", ") || "NONE"}`,
    "",
    "Intent rules:",
    "- NOTE: lasting information worth saving (facts, decisions, reference info).",
    "- REMINDER: actionable deadline / todo with a due date/time.",
    "- MEETING: a call/meeting. Include attendeeEmail, timezone, meetingLink, startTime, endTime when available.",
    "  If a meeting is missing any of those required fields, still return it in meetings;",
    "  the app will convert incomplete meetings into a REMINDER (if a time exists) or NOTE.",
    "",
    "Return empty arrays for intents that are disabled or have nothing useful to extract.",
  ].join("\n");
}

function buildUserPrompt(input: {
  subject: string;
  body: string;
  fromEmail: string | null;
  fromName: string | null;
  extractIntents: ExtractIntents;
}): string {
  const from =
    input.fromName && input.fromEmail
      ? `${input.fromName} <${input.fromEmail}>`
      : input.fromEmail ?? input.fromName ?? "(unknown)";

  return [
    `Extract intents: ${JSON.stringify(input.extractIntents)}`,
    `From: ${from}`,
    `Subject: ${input.subject}`,
    "",
    "Body:",
    input.body,
  ].join("\n");
}

/**
 * Loads the email and asks OpenAI (Vercel AI SDK) to extract notes / meetings / reminders
 * based on classification extractIntents.
 */
export async function extractEmailDetails(
  input: ExtractEmailInput
): Promise<EmailExtraction> {
  const enabled = enabledIntents(input.extractIntents);
  if (enabled.length === 0) {
    return { notes: [], reminders: [], meetings: [] };
  }

  const email = await prisma.email.findFirst({
    where: { id: input.emailId, userId: input.userId },
    select: {
      id: true,
      subject: true,
      body: true,
      fromEmail: true,
      fromName: true,
    },
  });

  if (!email) {
    throw new NonRetriableError("email not found for extraction");
  }

  const body =
    email.body.length > MAX_BODY_CHARS
      ? email.body.slice(0, MAX_BODY_CHARS)
      : email.body;

  const { object } = await generateObject({
    model: EXTRACTION_MODEL,
    schema: emailExtractionSchema,
    schemaName: "EmailExtraction",
    schemaDescription:
      "Structured notes, reminders, and meetings extracted from an email",
    system: buildSystemPrompt(input.extractIntents),
    prompt: buildUserPrompt({
      subject: email.subject,
      body,
      fromEmail: email.fromEmail,
      fromName: email.fromName,
      extractIntents: input.extractIntents,
    }),
  });

  // Drop disabled intents even if the model returned them.
  return {
    notes: input.extractIntents.NOTE ? object.notes : [],
    reminders: input.extractIntents.REMINDER ? object.reminders : [],
    meetings: input.extractIntents.MEETING ? object.meetings : [],
  };
}
