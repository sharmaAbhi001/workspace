import { prisma } from "../../config/database/client.js";
import {
    gmailEmailProcessingRequested,
    gmailReconcileRequested,
    inngest,
} from "../client.js";
import {
    chunk,
    fetchAndSaveEmails,
    listInboxMessageIdsByDateRange,
} from "./gmail-helpers.js";

export const reconcileGmailInbox = inngest.createFunction(
    {
        id: "reconcile-gmail-inbox",
        triggers: [gmailReconcileRequested],
    },
    async ({ event, step }) => {
        const { userId, integrationId, from, to } = event.data;

        const row = await step.run("find-integration", () =>
            prisma.integration.findUnique({
                where: { id: integrationId },
                select: {
                    id: true,
                    userId: true,
                    status: true,
                    provider: true,
                },
            })
        );

        if (
            !row ||
            row.userId !== userId ||
            row.status !== "ACTIVE" ||
            row.provider !== "GMAIL"
        ) {
            return { skipped: "no active gmail integration" };
        }

        const integration = { id: row.id, userId: row.userId };

        const ids = await step.run("list-inbox", () =>
            listInboxMessageIdsByDateRange(integration.id, from, to)
        );

        const emailIds: string[] = [];
        const chunks = chunk(ids, 10);
        for (let i = 0; i < chunks.length; i++) {
            const saved = await step.run(`save-chunk-${i}`, () =>
                fetchAndSaveEmails(integration, chunks[i]!)
            );
            emailIds.push(...saved);
        }

        if (emailIds.length > 0) {
            await step.sendEvent(
                "request-email-processing",
                emailIds.map((emailId) => ({
                    id: `process-${emailId}`,
                    name: gmailEmailProcessingRequested.name,
                    data: { userId: integration.userId, emailId },
                }))
            );
        }

        return { listed: ids.length, saved: emailIds.length };
    }
);
