import { TypeSafeClient } from "@typesafe-ai/sdk";
import { EmailCategory } from "../generated/prisma/enums.js";

export const jevclient = new TypeSafeClient({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api",
});

const CATEGORY_CRITERIA = {
  [EmailCategory.PROMOTIONAL]: null,
  [EmailCategory.TRANSACTIONAL]: null,
  [EmailCategory.NOTIFICATION]: null,
  [EmailCategory.NEWSLETTER]: null,
  [EmailCategory.PERSONAL]: null,
  [EmailCategory.IMPORTANT]: null,
  [EmailCategory.SPAM]: null,
  [EmailCategory.MEETING]: null,
  [EmailCategory.FOLLOW_UP]: null,
} as const;

const MAX_BODY_CHARS = 8_000;
const NOUL_THRESHOLD = 0.5;

/** MVP defaults — later load from user settings. */
export const DEFAULT_EXTRACT_TYPES = ["REMINDER", "MEETING", "NOTE"] as const;

export type ExtractType = (typeof DEFAULT_EXTRACT_TYPES)[number];

export type ExtractIntents = Record<ExtractType, boolean>;

export type UserExtractPreferences = {
  enabledTypes: ExtractType[];
};

export type EmailClassificationInput = {
  subject: string;
  body: string;
  fromEmail?: string | null;
  fromName?: string | null;
  extractPreferences?: UserExtractPreferences;
};

export type EmailClassification = {
  needsReply: boolean;
  needsReplyConfidence: number;
  category: EmailCategory;
  categoryConfidence: number;
  extractionNeeded: boolean;
  extractionNeededConfidence: number;
  extractIntents: ExtractIntents;
};

function noulYes(noul: number): boolean {
  return noul >= NOUL_THRESHOLD;
}

export async function classifyEmail(
  input: EmailClassificationInput
): Promise<EmailClassification> {
  const body =
    input.body.length > MAX_BODY_CHARS
      ? input.body.slice(0, MAX_BODY_CHARS)
      : input.body;

  const from =
    input.fromName && input.fromEmail
      ? `${input.fromName} <${input.fromEmail}>`
      : input.fromEmail ?? input.fromName ?? null;

  const extractPreferences: UserExtractPreferences = {
    enabledTypes:
      input.extractPreferences?.enabledTypes ?? [...DEFAULT_EXTRACT_TYPES],
  };

  const enabled = new Set(extractPreferences.enabledTypes);

  const result = await jevclient.systemOne({
    model: "jev-1.13",
    state: {
      email: { subject: input.subject, from, body },
      userExtractPreferences: extractPreferences,
    },
    questions: {
      replyneeded: {
        type: "noul",
        instructions: "Does this email need a reply from the recipient?",
        criteria: {
          true: "A human response is expected or useful",
          false:
            "No reply is needed (FYI, newsletter, notification, spam, meeting notification, etc.)",
        },
      },
      department: {
        type: "choice",
        instructions: "Which category does this email belong to?",
        criteria: CATEGORY_CRITERIA,
      },
      extractionNeeded: {
        type: "noul",
        instructions:
          "Should we extract structured items from this email for this user, given their enabled extract types?",
        criteria: {
          true: "Email contains items matching the user's enabled extract types",
          false: "Nothing useful to extract for this user",
        },
      },
      extractReminder: {
        type: "noul",
        instructions:
          "Should we create a REMINDER for this user from this email? Only yes if REMINDER is in userExtractPreferences.enabledTypes and the email has a clear deadline/todo.",
        criteria: {
          true: "Clear actionable reminder matching user preferences",
          false: "No reminder should be created",
        },
      },
      extractMeeting: {
        type: "noul",
        instructions:
          "Should we create a MEETING for this user from this email? Only yes if MEETING is in userExtractPreferences.enabledTypes and the email proposes a meeting/call with timing.",
        criteria: {
          true: "Clear meeting/call to schedule matching user preferences",
          false: "No meeting should be created",
        },
      },
      extractNote: {
        type: "noul",
        instructions:
          "Should we create a NOTE for this user from this email? Only yes if NOTE is in userExtractPreferences.enabledTypes and the email has lasting info worth saving.",
        criteria: {
          true: "Useful lasting information matching user preferences",
          false: "No note should be created",
        },
      },
    },
  });

  const extractIntents: ExtractIntents = {
    REMINDER:
      enabled.has("REMINDER") && noulYes(result.answers.extractReminder.noul),
    MEETING:
      enabled.has("MEETING") && noulYes(result.answers.extractMeeting.noul),
    NOTE: enabled.has("NOTE") && noulYes(result.answers.extractNote.noul),
  };

  const anyIntent =
    extractIntents.REMINDER || extractIntents.MEETING || extractIntents.NOTE;

  // Gate overall flag by model answer AND at least one enabled intent.
  const extractionNeeded =
    noulYes(result.answers.extractionNeeded.noul) && anyIntent;

  return {
    needsReply: noulYes(result.answers.replyneeded.noul),
    needsReplyConfidence: result.answers.replyneeded.noul,
    category: result.answers.department.choice,
    categoryConfidence: result.answers.department.confidence,
    extractionNeeded,
    extractionNeededConfidence: result.answers.extractionNeeded.noul,
    extractIntents,
  };
}
