import { IntegrationListItem, IntegrationStatus, MailProvider } from "./integration.types.js";


export interface Integration {
    id: string;
    userId: string;
    provider: MailProvider;
    providerAccountId: string;
    providerEmail: string;
    status: IntegrationStatus;
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: Date | null;
    historyId: string | null;
    watchExpiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface IntegrationUpsertInput {
    userId: string;
    provider: MailProvider;
    providerAccountId: string;
    providerEmail: string;
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: Date | null;
    historyId: string | null;
    watchExpiresAt: Date | null;
    status: IntegrationStatus;
}

export interface GmailConnectTokenInput {
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date | null;
}

export interface IIntegrationRepository {
    findByProviderAccountId(
        provider: MailProvider,
        providerAccountId: string
    ): Promise<Integration | null>;
    findById(id: string): Promise<Integration | null>;
    listByUserId(userId: string): Promise<IntegrationListItem[]>;
    upsertByProviderAccountId(data: IntegrationUpsertInput): Promise<Integration>;
    disconnect(id: string): Promise<Integration>;
}

export interface IIntegrationService {
    startGmailConnect(userId: string): Promise<{
        authorizationURL: string;
        nonce: string;
        codeVerifier: string;
    }>;
    completeGmailConnect(
        sessionUserId: string,
        state: string,
        code: string,
        codeVerifier: string,
        sessionNonce: string
    ): Promise<void>;
    listIntegrations(userId: string): Promise<IntegrationListItem[]>;
    disconnectIntegration(userId: string, integrationId: string): Promise<void>;
}
