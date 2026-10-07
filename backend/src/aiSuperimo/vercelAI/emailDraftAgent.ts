import {
  Output,
  ToolLoopAgent,
  stepCountIs,
  tool,
} from "ai";
import { NonRetriableError } from "inngest";
import { z } from "zod";
import { prisma } from "../../config/database/client.js";
import type { EmailCategory } from "../../generated/prisma/enums.js";
import { DRAFT_MODEL, DRAFT_MODEL_ID } from "./openai.js";

const MAX_BODY_CHARS = 12_000;
export const MAX_DRAFT_ROUNDS = 4;

const draftOutputSchema = z.object({
  subject: z.string().describe("Reply email subject line"),
  body: z
    .string()
    .describe("Reply email body in plain text, ready for the user to send"),
});

export type DraftOutput = z.infer<typeof draftOutputSchema>;

export type DraftEmailAgentInput = {
  userId: string;
  emailId: string;
  category: EmailCategory | null;
  round: number;
  editInstructions?: string | null;
  previousDraft?: DraftOutput | null;
};

export type DraftEmailAgentResult = DraftOutput & {
  model: string;
  toolCalls: unknown;
};

function createDraftTools(userId: string, emailId: string) {
  return {
    lookupPricingDocs: tool({
      description:
        "Look up the user's pricing / product docs before answering pricing questions. Stubbed until a docs store exists.",
      inputSchema: z.object({
        query: z
          .string()
          .describe("What pricing or product info is needed"),
      }),
      execute: async ({ query }) => ({
        stub: true,
        found: false,
        userId,
        query,
        message: "no docs found",
        docs: [] as Array<{ id: string; title: string; excerpt: string }>,
      }),
    }),

    checkCalendar: tool({
      description:
        "Check the user's calendar availability before confirming or proposing a meeting. Stubbed until Google Calendar is connected.",
      inputSchema: z.object({
        startTime: z
          .string()
          .optional()
          .describe("Proposed start time ISO-8601 if known"),
        endTime: z
          .string()
          .optional()
          .describe("Proposed end time ISO-8601 if known"),
        timezone: z.string().optional().describe("IANA timezone if known"),
      }),
      execute: async ({ startTime, endTime, timezone }) => ({
        stub: true,
        userId,
        emailId,
        startTime: startTime ?? null,
        endTime: endTime ?? null,
        timezone: timezone ?? null,
        available: true,
        conflicts: [] as Array<{
          title: string;
          startTime: string;
          endTime: string;
        }>,
        message:
          "calendar check stub: assuming available (real calendar integration pending)",
      }),
    }),
  };
}

function buildInstructions(category: EmailCategory | null): string {
  return [
    "You are an email drafting assistant for a busy professional.",
    "Before writing the reply, gather requirements with tools when relevant:",
    "- Pricing / product questions → call lookupPricingDocs.",
    "- Meeting booking / confirmation → call checkCalendar.",
    "If a tool returns no data, draft a careful reply that does not invent facts",
    "(e.g. say you will confirm pricing/availability shortly).",
    "Write a concise, professional reply in the user's voice.",
    "Do not claim you sent calendar invites or attached docs unless tools confirm them.",
    `Email category: ${category ?? "UNKNOWN"}.`,
    "Return only the final reply subject and body via the structured output schema.",
  ].join("\n");
}

function buildPrompt(input: {
  subject: string;
  body: string;
  fromEmail: string | null;
  fromName: string | null;
  category: EmailCategory | null;
  round: number;
  editInstructions?: string | null;
  previousDraft?: DraftOutput | null;
}): string {
  const from =
    input.fromName && input.fromEmail
      ? `${input.fromName} <${input.fromEmail}>`
      : input.fromEmail ?? input.fromName ?? "(unknown)";

  const parts = [
    `Draft round: ${input.round}/${MAX_DRAFT_ROUNDS}`,
    `Category: ${input.category ?? "UNKNOWN"}`,
    `From: ${from}`,
    `Subject: ${input.subject}`,
    "",
    "Incoming email body:",
    input.body,
  ];

  if (input.previousDraft) {
    parts.push(
      "",
      "Previous AI draft:",
      `Subject: ${input.previousDraft.subject}`,
      input.previousDraft.body
    );
  }

  if (input.editInstructions) {
    parts.push("", "Human edit instructions:", input.editInstructions);
  }

  parts.push(
    "",
    "Use tools first when needed, then produce the reply subject and body."
  );

  return parts.join("\n");
}

/**
 * Tool-using agent: gather requirements (stub docs/calendar), then draft a reply.
 */
export async function runEmailDraftAgent(
  input: DraftEmailAgentInput
): Promise<DraftEmailAgentResult> {
  const email = await prisma.email.findFirst({
    where: { id: input.emailId, userId: input.userId },
    select: {
      id: true,
      subject: true,
      body: true,
      fromEmail: true,
      fromName: true,
      category: true,
    },
  });

  if (!email) {
    throw new NonRetriableError("email not found for draft agent");
  }

  const body =
    email.body.length > MAX_BODY_CHARS
      ? email.body.slice(0, MAX_BODY_CHARS)
      : email.body;

  const category = input.category ?? email.category;
  const tools = createDraftTools(input.userId, input.emailId);

  const agent = new ToolLoopAgent({
    model: DRAFT_MODEL,
    instructions: buildInstructions(category),
    tools,
    stopWhen: stepCountIs(8),
    output: Output.object({
      schema: draftOutputSchema,
      name: "EmailReplyDraft",
      description: "Final reply email subject and body",
    }),
  });

  const result = await agent.generate({
    prompt: buildPrompt({
      subject: email.subject,
      body,
      fromEmail: email.fromEmail,
      fromName: email.fromName,
      category,
      round: input.round,
      editInstructions: input.editInstructions,
      previousDraft: input.previousDraft,
    }),
  });

  if (!result.output) {
    throw new Error("draft agent did not produce structured output");
  }

  return {
    ...result.output,
    model: DRAFT_MODEL_ID,
    toolCalls: result.steps.flatMap((step) => step.toolCalls),
  };
}
