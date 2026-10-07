import { prisma } from "../../config/database/client.js";
import { decryptOptionalSecret, encryptOptionalSecret } from "../../utils/secret.js";
import {
    IIntegrationRepository,
    Integration,
    IntegrationUpsertInput,
} from "./integration.interface.js";
import { IntegrationListItem, MailProvider } from "./integration.types.js";


export class IntegrationRepository implements IIntegrationRepository {

    async findByProviderAccountId(
        provider: MailProvider,
        providerAccountId: string
    ): Promise<Integration | null> {
        const row = await prisma.integration.findUnique({
            where: {
                provider_providerAccountId: {
                    provider,
                    providerAccountId,
                },
            },
        });

        return this.revealIntegration(row);
    }

    async findById(id: string): Promise<Integration | null> {
        const row = await prisma.integration.findUnique({
            where: { id },
        });

        return this.revealIntegration(row);
    }

    async listByUserId(userId: string): Promise<IntegrationListItem[]> {
        return prisma.integration.findMany({
            where: { userId },
            select: {
                id: true,
                provider: true,
                providerEmail: true,
                status: true,
                watchExpiresAt: true,
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async upsertByProviderAccountId(data: IntegrationUpsertInput): Promise<Integration> {
        const sealed = this.sealIntegration(data);

        const row = await prisma.integration.upsert({
            where: {
                provider_providerAccountId: {
                    provider: sealed.provider,
                    providerAccountId: sealed.providerAccountId,
                },
            },
            create: {
                userId: sealed.userId,
                provider: sealed.provider,
                providerAccountId: sealed.providerAccountId,
                providerEmail: sealed.providerEmail,
                accessToken: sealed.accessToken,
                refreshToken: sealed.refreshToken,
                expiresAt: sealed.expiresAt,
                historyId: sealed.historyId,
                watchExpiresAt: sealed.watchExpiresAt,
                status: sealed.status,
            },
            update: {
                userId: sealed.userId,
                providerEmail: sealed.providerEmail,
                accessToken: sealed.accessToken,
                expiresAt: sealed.expiresAt,
                historyId: sealed.historyId,
                watchExpiresAt: sealed.watchExpiresAt,
                status: sealed.status,
                ...(sealed.refreshToken ? { refreshToken: sealed.refreshToken } : {}),
            },
        });

        return this.revealIntegration(row) as Integration;
    }

    async disconnect(id: string): Promise<Integration> {
        const row = await prisma.integration.update({
            where: { id },
            data: {
                accessToken: null,
                refreshToken: null,
                expiresAt: null,
                historyId: null,
                watchExpiresAt: null,
                status: "DISCONNECTED",
            },
        });

        return this.revealIntegration(row) as Integration;
    }

    private sealIntegration(data: IntegrationUpsertInput): IntegrationUpsertInput {
        return {
            ...data,
            providerEmail: data.providerEmail.toLowerCase(),
            accessToken: encryptOptionalSecret(data.accessToken),
            refreshToken: encryptOptionalSecret(data.refreshToken),
        };
    }

    private revealIntegration<T extends { accessToken: string | null; refreshToken: string | null }>(
        row: T | null
    ): T | null {
        if (!row) {
            return null;
        }

        return {
            ...row,
            accessToken: decryptOptionalSecret(row.accessToken),
            refreshToken: decryptOptionalSecret(row.refreshToken),
        };
    }

}
