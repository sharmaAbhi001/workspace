import {
    ActiveGmailIntegration,
    DraftDecisionAccepted,
    EmailWithDrafts,
    GmailReconcileAccepted,
    MailDraftSummary,
} from "./mail.types.js";
import { DraftDecisionBody, GmailReconcileBody } from "./mail.schema.js";

export interface IMailRepository {
    findActiveGmailIntegration(
        userId: string,
        integrationId: string
    ): Promise<ActiveGmailIntegration | null>;

    findEmailWithDrafts(
        userId: string,
        emailId: string
    ): Promise<EmailWithDrafts | null>;

    findPendingDraft(
        userId: string,
        emailId: string,
        draftId: string
    ): Promise<MailDraftSummary | null>;

    updateDraftDecision(
        draftId: string,
        decision: DraftDecisionBody["decision"],
        instructions?: string
    ): Promise<MailDraftSummary>;
}

export interface IMailService {
    requestGmailReconcile(
        userId: string,
        input: GmailReconcileBody
    ): Promise<GmailReconcileAccepted>;

    getEmailWithDrafts(
        userId: string,
        emailId: string
    ): Promise<EmailWithDrafts>;

    submitDraftDecision(
        userId: string,
        emailId: string,
        draftId: string,
        input: DraftDecisionBody
    ): Promise<DraftDecisionAccepted>;
}
