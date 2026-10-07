import express from "express";
import { AuthRepository } from "./auth.repository.js";
import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";
import { asyncHandler } from "../../utils/async.haldlers.js";
import { validation } from "../../validators/index.js";
import { loginUser, registerUser } from "./auth.schema.js";
import { authorize } from "../../middleware/authorization/auth.middleware.js";



const router = express.Router();


const repository = new AuthRepository();
const service = new AuthService(repository);
const controller = new AuthController(service)



router.post("/signup", validation(registerUser), asyncHandler(controller.signup))
router.post("/login", validation(loginUser), asyncHandler(controller.login));
router.post("/logout", asyncHandler(controller.logout));
router.post("/refresh", asyncHandler(controller.refresh));
router.get("/me", authorize("user"), asyncHandler(controller.me));
router.get("/google/auth", asyncHandler(controller.googleAuth))
router.get("/google/callback", asyncHandler(controller.googlecallback))


export default router
