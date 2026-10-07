import { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { IntegrationService } from "./integration.service.js";


export class IntegrationController {

    private service: IntegrationService;

    constructor(service: IntegrationService) {
        this.service = service;
    }

    connectGmail = async (req: Request, res: Response) => {
        const userId = req.user!.id;
        const { authorizationURL, nonce, codeVerifier } = await this.service.startGmailConnect(userId);

        req.session.gmailOAuth = {
            nonce,
            codeVerifier,
        };

        await new Promise<void>((resolve, reject) => {
            req.session.save((error) => {
                if (error) {
                    reject(new ApiError("Could not start Gmail connect", 500));
                    return;
                }

                resolve();
            });
        });

        const accept = req.get("accept") ?? "";
        if (accept.includes("application/json")) {
            return res.status(200).json(
                new ApiResponse(
                    "Gmail connect ready",
                    200,
                    { authorizationURL },
                    true
                )
            );
        }

        return res.redirect(authorizationURL);
    };

    gmailCallback = async (req: Request, res: Response) => {
        const frontendOrigin =
            process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
        const redirectWithError = (message: string) => {
            delete req.session.gmailOAuth;
            return res.redirect(
                `${frontendOrigin}/app/settings?gmail=error&message=${encodeURIComponent(message)}`
            );
        };

        const userId = req.user!.id;
        const { code, state } = req.query;
        const oauthSession = req.session.gmailOAuth;

        if (typeof code !== "string" || typeof state !== "string") {
            return redirectWithError("Invalid Gmail OAuth callback");
        }

        if (!oauthSession) {
            return redirectWithError("OAuth session expired");
        }

        try {
            await this.service.completeGmailConnect(
                userId,
                state,
                code,
                oauthSession.codeVerifier,
                oauthSession.nonce
            );

            return res.redirect(`${frontendOrigin}/app/settings?gmail=connected`);
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : "Could not connect Gmail";
            return redirectWithError(message);
        } finally {
            delete req.session.gmailOAuth;
        }
    };

    list = async (req: Request, res: Response) => {
        const userId = req.user!.id;
        const integrations = await this.service.listIntegrations(userId);

        return res.status(200).json(
            new ApiResponse("integrations fetched", 200, integrations, true)
        );
    };

    disconnect = async (req: Request, res: Response) => {
        const userId = req.user!.id;
        const integrationId = req.params.id;

        if (typeof integrationId !== "string" || !integrationId) {
            throw new ApiError("Integration id is required", 400);
        }

        await this.service.disconnectIntegration(userId, integrationId);

        return res.status(200).json(
            new ApiResponse("integration disconnected", 200, { id: integrationId }, true)
        );
    };

}
