import { prisma } from "../../config/database/client.js";
import {
    draftDecisionReceived,
    gmailEmailProcessingRequested,
    gmailNotificationReceived,
    inngest,
} from "../client.js";
import { integration } from "./type.js";
import {
    MAX_DRAFT_ROUNDS,
    extractEmailDetails,
    markDraftNeedsHumanWrite,
    markDraftTimedOut,
    markEmailProcessingDone,
    runEmailDraftAgent,
    saveDraftRound,
    saveEmailExtractions,
} from "../../aiSuperimo/vercelAI/index.js";
import {
    chunk,
    classifyAndSave,
    fetchAndSaveEmails,
    listNewInboxMessageIds,
    updateForProcess,
} from "./gmail-helpers.js";

export const syncGmailNotification = inngest.createFunction(
    {
        id: "sync-gmail-notification",
        triggers: [gmailNotificationReceived],
    },
    async ({ event, step }) => {
        const { emailAddress, historyId } = event.data;
        const mailbox = emailAddress.toLowerCase();

        const integration: integration = await step.run("find-integration", () =>
            prisma.integration.findUnique({
                where: {
                    provider_providerEmail: {
                        provider: "GMAIL",
                        providerEmail: mailbox,
                    },
                },
                select: {
                    id: true,
                    userId: true,
                    historyId: true,
                    status: true,
                },
            })
        );

        if (!integration || integration.status !== "ACTIVE") {
            return { skipped: "no active integration" };
        }

        // First notification after connect: bookmark Pub/Sub historyId, don't backfill.
        if (!integration.historyId) {
            await step.run("init-history", () =>
                prisma.integration.update({
                    where: { id: integration.id },
                    data: { historyId },
                })
            );
            return { skipped: "history initialised" };
        }

        if (BigInt(historyId) <= BigInt(integration.historyId)) {
            return { skipped: "already processed" };
        }

        const { ids, latestHistoryId } = await step.run("list-history", () =>
            listNewInboxMessageIds(integration.id, integration.historyId!)
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

        await step.run("update-history", () =>
            prisma.integration.update({
                where: { id: integration.id },
                data: { historyId: latestHistoryId },
            })
        );

        return { received: ids.length, saved: emailIds.length };
    }
);

export const processGmailEmails = inngest.createFunction(
    {
        id: "process-gmail-emails",
        concurrency: { key: "event.data.emailId", limit: 1 },
        triggers: [gmailEmailProcessingRequested],
    },
    async ({ event, step }) => {
        const { userId, emailId } = event.data;

        // Claim the email (PENDING → PROCESSING). Skip if already claimed/done.
        const claim = await step.run("claim-email-for-processing", () =>
            updateForProcess(userId, emailId)
        );

        if (claim.action === "SKIPPED") {
            return { skipped: claim.reason };
        }

        const email = claim.email;

        const classification = await step.run("classify-and-save", () =>
            classifyAndSave(userId, emailId)
        );

        let extractionResult = null;
        const extractIntents = classification.extractIntents;
        if (classification.extractionNeeded && extractIntents) {
            const extraction = await step.run("extract-email-details", () =>
                extractEmailDetails({
                    userId,
                    emailId,
                    extractIntents,
                })
            );

            extractionResult = await step.run("save-email-extractions", () =>
                saveEmailExtractions({
                    userId,
                    emailId,
                    extraction,
                })
            );
        }

        let draftLoopResult: {
            outcome:
                | "approved"
                | "rejected"
                | "timed_out"
                | "needs_human_draft"
                | "skipped_no_reply";
            rounds: number;
            lastDraftId: string | null;
        } = {
            outcome: "skipped_no_reply",
            rounds: 0,
            lastDraftId: null,
        };

        if (classification.needsReply) {
            let editInstructions: string | null = null;
            let previousDraft: { subject: string; body: string } | null = null;

            for (let round = 1; round <= MAX_DRAFT_ROUNDS; round++) {
                const drafted = await step.run(`draft-reply-round-${round}`, () =>
                    runEmailDraftAgent({
                        userId,
                        emailId,
                        category: classification.category,
                        round,
                        editInstructions,
                        previousDraft,
                    })
                );

                const savedDraft = await step.run(`save-draft-round-${round}`, () =>
                    saveDraftRound({
                        userId,
                        emailId,
                        round,
                        draft: {
                            subject: drafted.subject,
                            body: drafted.body,
                        },
                        model: drafted.model,
                        instructions: editInstructions,
                    })
                );

                draftLoopResult = {
                    outcome: "needs_human_draft",
                    rounds: round,
                    lastDraftId: savedDraft.id,
                };

                previousDraft = {
                    subject: drafted.subject,
                    body: drafted.body,
                };

                // Resume only when THIS run's userId+emailId match the decision event.
                // Different users / emails wait in separate function runs and never mix.
                const decisionEvent = await step.waitForEvent(
                    `wait-draft-decision-${round}`,
                    {
                        event: draftDecisionReceived,
                        if: "async.data.userId == event.data.userId && async.data.emailId == event.data.emailId",
                        timeout: "24h",
                    }
                );

                if (!decisionEvent) {
                    await step.run(`mark-draft-timeout-${round}`, () =>
                        markDraftTimedOut(savedDraft.id)
                    );
                    await step.run("mark-email-done-timeout", () =>
                        markEmailProcessingDone(emailId)
                    );
                    draftLoopResult = {
                        outcome: "timed_out",
                        rounds: round,
                        lastDraftId: savedDraft.id,
                    };
                    break;
                }

                const { draftId, decision, instructions } = decisionEvent.data;

                if (draftId !== savedDraft.id) {
                    // Stale decision for a different draft — end safely.
                    await step.run("mark-email-done-stale-decision", () =>
                        markEmailProcessingDone(emailId)
                    );
                    draftLoopResult = {
                        outcome: "rejected",
                        rounds: round,
                        lastDraftId: savedDraft.id,
                    };
                    break;
                }

                if (decision === "APPROVED") {
                    await step.run("mark-email-done-approved", () =>
                        markEmailProcessingDone(emailId)
                    );
                    draftLoopResult = {
                        outcome: "approved",
                        rounds: round,
                        lastDraftId: savedDraft.id,
                    };
                    break;
                }

                if (decision === "REJECTED") {
                    // Keep draft for the human; end the Inngest run.
                    await step.run("mark-email-done-rejected", () =>
                        markEmailProcessingDone(emailId)
                    );
                    draftLoopResult = {
                        outcome: "rejected",
                        rounds: round,
                        lastDraftId: savedDraft.id,
                    };
                    break;
                }

                // EDIT_SUGGESTION → next round with human instructions
                editInstructions = instructions?.trim() || null;

                if (round === MAX_DRAFT_ROUNDS) {
                    await step.run("mark-draft-needs-human", () =>
                        markDraftNeedsHumanWrite(savedDraft.id)
                    );
                    await step.run("mark-email-done-max-rounds", () =>
                        markEmailProcessingDone(emailId)
                    );
                    draftLoopResult = {
                        outcome: "needs_human_draft",
                        rounds: round,
                        lastDraftId: savedDraft.id,
                    };
                }
            }
        } else {
            await step.run("mark-email-done-no-reply", () =>
                markEmailProcessingDone(emailId)
            );
        }

        return {
            processed: email.id,
            category: classification.category,
            needsReply: classification.needsReply,
            extractionNeeded: classification.extractionNeeded,
            extractIntents: classification.extractIntents,
            extraction: extractionResult,
            draft: draftLoopResult,
        };
    }
);
