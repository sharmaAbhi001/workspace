import { z } from "zod";

export const gmailReconcileBody = z
    .object({
        integrationId: z.string().uuid(),
        from: z.string().date(),
        to: z.string().date(),
    })
    .refine((data) => data.from <= data.to, {
        message: "`from` must be on or before `to`",
        path: ["from"],
    });

export type GmailReconcileBody = z.infer<typeof gmailReconcileBody>;

export const draftDecisionBody = z
    .object({
        decision: z.enum(["APPROVED", "REJECTED", "EDIT_SUGGESTION"]),
        instructions: z.string().trim().min(1).optional(),
    })
    .superRefine((data, ctx) => {
        if (data.decision === "EDIT_SUGGESTION" && !data.instructions) {
            ctx.addIssue({
                code: "custom",
                message: "`instructions` are required for EDIT_SUGGESTION",
                path: ["instructions"],
            });
        }
    });

export type DraftDecisionBody = z.infer<typeof draftDecisionBody>;

export const emailIdParams = z.object({
    emailId: z.string().uuid(),
});

export const draftDecisionParams = z.object({
    emailId: z.string().uuid(),
    draftId: z.string().uuid(),
});
