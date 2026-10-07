import express from "express";
import { asyncHandler } from "../../utils/async.haldlers.js";
import { authorize } from "../../middleware/authorization/auth.middleware.js";
import { IntegrationController } from "./integration.controller.js";
import { IntegrationRepository } from "./integration.repository.js";
import { IntegrationService } from "./integration.service.js";



const router = express.Router();


const repository = new IntegrationRepository();
const service = new IntegrationService(repository);
const controller = new IntegrationController(service);


router.get("/", authorize("user"), asyncHandler(controller.list));
router.get("/gmail/connect", authorize("user"), asyncHandler(controller.connectGmail));
router.get("/gmail/callback", authorize("user"), asyncHandler(controller.gmailCallback));
router.delete("/:id", authorize("user"), asyncHandler(controller.disconnect));


export default router
