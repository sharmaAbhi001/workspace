import { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
    draftDecisionBody,
    draftDecisionParams,
    emailIdParams,
    gmailReconcileBody,
} from "./mail.schema.js";
import { MailService } from "./mail.service.js";

export class MailController {
    constructor(private readonly service: MailService) {}

    reconcileGmail = async (req: Request, res: Response) => {
        const userId = req.user!.id;
        const parsed = gmailReconcileBody.safeParse(req.body);

        if (!parsed.success) {
            throw new ApiError("Invalid reconcile request", 400);
        }

        const result = await this.service.requestGmailReconcile(userId, parsed.data);

        return res
            .status(202)
            .json(new ApiResponse("gmail reconcile accepted", 202, result, true));
    };

    getEmail = async (req: Request, res: Response) => {
        const userId = req.user!.id;
        const params = emailIdParams.safeParse(req.params);

        if (!params.success) {
            throw new ApiError("Invalid email id", 400);
        }

        const result = await this.service.getEmailWithDrafts(
            userId,
            params.data.emailId
        );

        return res
            .status(200)
            .json(new ApiResponse("email fetched", 200, result, true));
    };

    submitDraftDecision = async (req: Request, res: Response) => {
        const userId = req.user!.id;
        const params = draftDecisionParams.safeParse(req.params);
        const body = draftDecisionBody.safeParse(req.body);

        if (!params.success) {
            throw new ApiError("Invalid email/draft id", 400);
        }

        if (!body.success) {
            throw new ApiError("Invalid draft decision", 400);
        }

        const result = await this.service.submitDraftDecision(
            userId,
            params.data.emailId,
            params.data.draftId,
            body.data
        );

        return res
            .status(202)
            .json(new ApiResponse("draft decision accepted", 202, result, true));
    };
}
