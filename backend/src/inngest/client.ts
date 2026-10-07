import { eventType, Inngest } from "inngest";
import {  z } from "zod";
export const inngest = new Inngest({
    id: "gmail-email-workflows",
});

export const gmailNotificationReceived = eventType("gmail/notification.received", {
    schema: z.object({
      emailAddress:z.string().email(),
      historyId:z.string()
    }),
});

export const gmailEmailProcessingRequested = eventType("gmail/emails.process.requested", {
    schema: z.object({
        userId: z.string(),
        emailId: z.string(),
    }),
});

export const gmailReconcileRequested = eventType("gmail/reconcile.requested", {
    schema: z.object({
        userId: z.string(),
        integrationId: z.string(),
        from: z.string().date(),
        to: z.string().date(),
    }),
});

export const draftDecisionReceived = eventType("draft/decision.received", {
    schema: z.object({
        userId: z.string().uuid(),
        emailId: z.string().uuid(),
        draftId: z.string().uuid(),
        decision: z.enum(["APPROVED", "REJECTED", "EDIT_SUGGESTION"]),
        instructions: z.string().optional(),
    }),
});
