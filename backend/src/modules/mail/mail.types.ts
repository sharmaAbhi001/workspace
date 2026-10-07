import type { Decision, ProcessingStatus, Status } from "../../generated/prisma/enums.js";

export type ActiveGmailIntegration = {
    id: string;
    userId: string;
    provider: "GMAIL";
    status: "ACTIVE";
};

export type GmailReconcileAccepted = {
    accepted: true;
};

export type MailDraftSummary = {
    id: string;
    emailId: string;
    round: number;
    subject: string;
    body: string;
    decision: Decision;
    status: Status;
    aiModel: string;
    instructions: string | null;
    createdAt: Date;
    updatedAt: Date;
};

export type EmailWithDrafts = {
    id: string;
    subject: string;
    body: string;
    fromEmail: string | null;
    fromName: string | null;
    toEmail: string | null;
    category: string | null;
    needsReply: boolean | null;
    processingStatus: ProcessingStatus;
    isReplied: boolean;
    receivedAt: Date;
    drafts: MailDraftSummary[];
    latestPendingDraft: MailDraftSummary | null;
};

export type DraftDecisionAccepted = {
    accepted: true;
    draftId: string;
    decision: "APPROVED" | "REJECTED" | "EDIT_SUGGESTION";
};
