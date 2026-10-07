import { ApiError } from "../../utils/ApiError.js";
import {
    GmailConnectTokenInput,
    IIntegrationRepository,
    IIntegrationService,
} from "./integration.interface.js";
import { IntegrationListItem } from "./integration.types.js";
import {
    exchangeGmailCode,
    generateGmailConnectAuthorizationURL,
    getGmailProfileEmail,
    startGmailWatch,
    stopGmailWatch,
} from "./provider/gmail/gmail.service.js";
import { verifyGmailOAuthState } from "./provider/gmail/gmail.security.js";


export class IntegrationService implements IIntegrationService {

    constructor(private readonly integrationRepository: IIntegrationRepository) {

    }

    async startGmailConnect(userId: string): Promise<{
        authorizationURL: string;
        nonce: string;
        codeVerifier: string;
    }> {
        const { authorizationURL, nonce, codeVerifier } = generateGmailConnectAuthorizationURL(userId);

        return {
            authorizationURL,
            nonce,
            codeVerifier,
        };
    }

    async completeGmailConnect(
        sessionUserId: string,
        state: string,
        code: string,
        codeVerifier: string,
        sessionNonce: string
    ): Promise<void> {
        let statePayload;

        try {
            statePayload = verifyGmailOAuthState(state);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Invalid OAuth state";
            throw new ApiError(message, 400);
        }

        if (statePayload.userId !== sessionUserId) {
            throw new ApiError("OAuth state does not match the logged-in user", 403);
        }

        if (statePayload.nonce !== sessionNonce) {
            throw new ApiError("Invalid OAuth nonce", 400);
        }

        const tokens = await exchangeGmailCode(code, codeVerifier);

        if (!tokens.access_token) {
            throw new ApiError("Google access token is missing", 400);
        }

        const input: GmailConnectTokenInput = {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token ?? null,
            expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        };

        // Read-email scope only — no OpenID id_token. Mailbox email is the stable account key.
        const providerEmail = await getGmailProfileEmail(input.accessToken);

        const existing = await this.integrationRepository.findByProviderAccountId(
            "GMAIL",
            providerEmail
        );

        if (existing && existing.userId !== sessionUserId) {
            throw new ApiError("This Gmail is already connected to another account", 409);
        }

        const watch = await startGmailWatch(input.accessToken, input.refreshToken);

        await this.integrationRepository.upsertByProviderAccountId({
            userId: sessionUserId,
            provider: "GMAIL",
            providerAccountId: providerEmail,
            providerEmail,
            accessToken: input.accessToken,
            refreshToken: input.refreshToken ?? existing?.refreshToken ?? null,
            expiresAt: input.expiresAt,
            historyId: watch.historyId,
            watchExpiresAt: watch.watchExpiresAt,
            status: "ACTIVE",
        });
    }

    async listIntegrations(userId: string): Promise<IntegrationListItem[]> {
        return this.integrationRepository.listByUserId(userId);
    }

    async disconnectIntegration(userId: string, integrationId: string): Promise<void> {
        const integration = await this.integrationRepository.findById(integrationId);

        if (!integration || integration.userId !== userId) {
            throw new ApiError("Integration not found", 404);
        }

        if (integration.provider === "GMAIL" && integration.accessToken) {
            try {
                await stopGmailWatch(integration.accessToken, integration.refreshToken);
            } catch {
                // Best-effort stop; still disconnect locally.
            }
        }

        await this.integrationRepository.disconnect(integrationId);
    }

}
