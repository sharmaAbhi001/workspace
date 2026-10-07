export { extractEmailDetails } from "./extract-email.js";
export type { ExtractEmailInput } from "./extract-email.js";
export { saveEmailExtractions } from "./save-extractions.js";
export type {
  SaveExtractionsInput,
  SaveExtractionsResult,
} from "./save-extractions.js";
export type { EmailExtraction } from "./schemas.js";
export {
  MAX_DRAFT_ROUNDS,
  runEmailDraftAgent,
} from "./emailDraftAgent.js";
export type {
  DraftEmailAgentInput,
  DraftEmailAgentResult,
  DraftOutput,
} from "./emailDraftAgent.js";
export {
  markDraftNeedsHumanWrite,
  markDraftTimedOut,
  markEmailProcessingDone,
  saveDraftRound,
} from "./save-draft.js";
export type { SaveDraftInput, SavedDraft } from "./save-draft.js";
