import { ApiError } from "../../utils/ApiError.js";
import {
    draftDecisionReceived,
    gmailReconcileRequested,
    inngest,
} from "../../inngest/client.js";
import { IMailRepository, IMailService } from "./mail.interface.js";
import { DraftDecisionBody, GmailReconcileBody } from "./mail.schema.js";
import {
    DraftDecisionAccepted,
    EmailWithDrafts,
    GmailReconcileAccepted,
} from "./mail.types.js";

export class MailService implements IMailService {
    constructor(private readonly mailRepository: IMailRepository) {}

    async requestGmailReconcile(
        userId: string,
        input: GmailReconcileBody
    ): Promise<GmailReconcileAccepted> {
        const integration = await this.mailRepository.findActiveGmailIntegration(
            userId,
            input.integrationId
        );

        if (!integration) {
            throw new ApiError("Active Gmail integration not found", 404);
        }

        await inngest.send(
            gmailReconcileRequested.create({
                userId,
                integrationId: integration.id,
                from: input.from,
                to: input.to,
            })
        );

        return { accepted: true };
    }

    async getEmailWithDrafts(
        userId: string,
        emailId: string
    ): Promise<EmailWithDrafts> {
        const email = await this.mailRepository.findEmailWithDrafts(
            userId,
            emailId
        );

        if (!email) {
            throw new ApiError("Email not found", 404);
        }

        return email;
    }

    async submitDraftDecision(
        userId: string,
        emailId: string,
        draftId: string,
        input: DraftDecisionBody
    ): Promise<DraftDecisionAccepted> {
        const draft = await this.mailRepository.findPendingDraft(
            userId,
            emailId,
            draftId
        );

        if (!draft) {
            throw new ApiError("Pending draft not found", 404);
        }

        await this.mailRepository.updateDraftDecision(
            draft.id,
            input.decision,
            input.instructions
        );

        await inngest.send(
            draftDecisionReceived.create({
                userId,
                emailId,
                draftId: draft.id,
                decision: input.decision,
                ...(input.instructions
                    ? { instructions: input.instructions }
                    : {}),
            })
        );

        return {
            accepted: true,
            draftId: draft.id,
            decision: input.decision,
        };
    }
}
