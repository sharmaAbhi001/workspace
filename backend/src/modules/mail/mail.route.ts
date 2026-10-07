import express from "express";
import { asyncHandler } from "../../utils/async.haldlers.js";
import { authorize } from "../../middleware/authorization/auth.middleware.js";
import { MailController } from "./mail.controller.js";
import { MailRepository } from "./mail.repository.js";
import { MailService } from "./mail.service.js";

const router = express.Router();

const repository = new MailRepository();
const service = new MailService(repository);
const controller = new MailController(service);

router.post(
    "/gmail/reconcile",
    authorize("user"),
    asyncHandler(controller.reconcileGmail)
);

/** Open an email in the UI → load email + AI draft rounds. */
router.get(
    "/emails/:emailId",
    authorize("user"),
    asyncHandler(controller.getEmail)
);

/** Approve / reject / suggest-edit on a pending AI draft. */
router.post(
    "/emails/:emailId/drafts/:draftId/decision",
    authorize("user"),
    asyncHandler(controller.submitDraftDecision)
);

export default router;
