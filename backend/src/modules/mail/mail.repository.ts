import { prisma } from "../../config/database/client.js";
import { IMailRepository } from "./mail.interface.js";
import { DraftDecisionBody } from "./mail.schema.js";
import {
    ActiveGmailIntegration,
    EmailWithDrafts,
    MailDraftSummary,
} from "./mail.types.js";

const draftSelect = {
    id: true,
    emailId: true,
    round: true,
    subject: true,
    body: true,
    decision: true,
    status: true,
    aiModel: true,
    instructions: true,
    createdAt: true,
    updatedAt: true,
} as const;

export class MailRepository implements IMailRepository {
    async findActiveGmailIntegration(
        userId: string,
        integrationId: string
    ): Promise<ActiveGmailIntegration | null> {
        const row = await prisma.integration.findFirst({
            where: {
                id: integrationId,
                userId,
                provider: "GMAIL",
                status: "ACTIVE",
            },
            select: {
                id: true,
                userId: true,
                provider: true,
                status: true,
            },
        });

        if (!row || row.provider !== "GMAIL" || row.status !== "ACTIVE") {
            return null;
        }

        return {
            id: row.id,
            userId: row.userId,
            provider: "GMAIL",
            status: "ACTIVE",
        };
    }

    async findEmailWithDrafts(
        userId: string,
        emailId: string
    ): Promise<EmailWithDrafts | null> {
        const email = await prisma.email.findFirst({
            where: { id: emailId, userId },
            select: {
                id: true,
                subject: true,
                body: true,
                fromEmail: true,
                fromName: true,
                toEmail: true,
                category: true,
                needsReply: true,
                processingStatus: true,
                isReplied: true,
                receivedAt: true,
                aiwrittenEamils: {
                    orderBy: { round: "asc" },
                    select: draftSelect,
                },
            },
        });

        if (!email) return null;

        const drafts = email.aiwrittenEamils;
        const latestPendingDraft =
            [...drafts].reverse().find((d) => d.decision === "PENDING") ?? null;

        return {
            id: email.id,
            subject: email.subject,
            body: email.body,
            fromEmail: email.fromEmail,
            fromName: email.fromName,
            toEmail: email.toEmail,
            category: email.category,
            needsReply: email.needsReply,
            processingStatus: email.processingStatus,
            isReplied: email.isReplied,
            receivedAt: email.receivedAt,
            drafts,
            latestPendingDraft,
        };
    }

    async findPendingDraft(
        userId: string,
        emailId: string,
        draftId: string
    ): Promise<MailDraftSummary | null> {
        return prisma.aIWrittenEmail.findFirst({
            where: {
                id: draftId,
                emailId,
                userId,
                decision: "PENDING",
            },
            select: draftSelect,
        });
    }

    async updateDraftDecision(
        draftId: string,
        decision: DraftDecisionBody["decision"],
        instructions?: string
    ): Promise<MailDraftSummary> {
        return prisma.aIWrittenEmail.update({
            where: { id: draftId },
            data: {
                decision,
                instructions: instructions ?? null,
            },
            select: draftSelect,
        });
    }
}
