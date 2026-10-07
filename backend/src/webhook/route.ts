import express from "express";
import { gmailInboundController } from "./gmailInbound.js";
import { asyncHandler } from "../utils/async.haldlers.js";

const router = express.Router();

router.post("/gmail-inbound", asyncHandler(gmailInboundController));

export default router;
