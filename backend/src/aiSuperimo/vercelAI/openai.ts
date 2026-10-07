import { createOpenAI } from "@ai-sdk/openai";

export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/** Default model for structured email extraction. */
export const EXTRACTION_MODEL = openai("gpt-4o-mini");

/** Default model for reply drafting agent. */
export const DRAFT_MODEL_ID = "gpt-4o-mini";
export const DRAFT_MODEL = openai(DRAFT_MODEL_ID);
