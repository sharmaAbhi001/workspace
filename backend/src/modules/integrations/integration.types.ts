export type MailProvider = "GMAIL" | "OUTLOOK" | "YAHOO";

export type IntegrationStatus = "ACTIVE" | "DISCONNECTED";

export interface IntegrationListItem {
    id: string;
    provider: MailProvider;
    providerEmail: string;
    status: IntegrationStatus;
    watchExpiresAt: Date | null;
}
