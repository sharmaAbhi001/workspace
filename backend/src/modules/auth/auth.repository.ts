import { AuthIdentity, AuthIdentityInput, IAuthRepository, LoginAuthProvider, Session, SessionMeta, SessionRecord, SessionUpdate } from "./auth.interface.js";
import { AuthUser } from "./auth.types.js";
import { prisma } from "../../config/database/client.js"


export class AuthRepository implements IAuthRepository {

    async findByEmail(email: string): Promise<AuthUser | null> {
        const user = await prisma.user.findUnique({
            where: {
                email: email.toLowerCase(),
            },
        });

        if (!user) {
            return null;
        }

        return new AuthUser(user);
    }

    async findById(id: string): Promise<AuthUser | null> {
        const user = await prisma.user.findUnique({
            where: {
                id,
            },
        });

        if (!user) {
            return null;
        }

        return new AuthUser(user);
    }

    async createUser(user: AuthUser): Promise<AuthUser> {
        const createdUser = await prisma.user.create({
            data: {
                name: user.name,
                email: user.email.toLowerCase(),
                password: user.password,
                emailVerified: user.emailVerified,
            },
        });

        return new AuthUser(createdUser);
    }

    async createSessionWithLimit(data: Session, maxSessions: number): Promise<string> {
        return prisma.$transaction(async (tx) => {
            const now = new Date();

            const activeSessions = await tx.session.findMany({
                where: {
                    userId: data.userId,
                    revokedAt: null,
                    expiresAt: { gt: now },
                },
                orderBy: [
                    { lastUsedAt: { sort: "asc", nulls: "first" } },
                    { createdAt: "asc" },
                ],
                select: { id: true },
            });

            const overflow = activeSessions.length - (maxSessions - 1);

            if (overflow > 0) {
                const toRevoke = activeSessions.slice(0, overflow).map((session) => session.id);

                await tx.session.updateMany({
                    where: {
                        id: { in: toRevoke },
                    },
                    data: {
                        revokedAt: now,
                    },
                });
            }

            const session = await tx.session.create({
                data: {
                    userId: data.userId,
                    refreshToken: data.refreshToken,
                    expiresAt: data.expiresAt,
                    lastUsedAt: data.lastUsedAt ?? now,
                    userAgent: data.userAgent ?? null,
                    ipAddress: data.ipAddress ?? null,
                },
            });

            return session.id;
        });
    }

    async findSessionById(sessionId: string): Promise<SessionRecord | null> {
        return prisma.session.findUnique({
            where: { id: sessionId },
        });
    }

    async findSessionByRefreshTokenHash(
        refreshTokenHash: string
    ): Promise<SessionRecord | null> {
        return prisma.session.findUnique({
            where: { refreshToken: refreshTokenHash },
        });
    }

    async rotateSessionTokens(
        sessionId: string,
        refreshTokenHash: string,
        expiresAt: Date,
        meta: SessionMeta
    ): Promise<void> {
        const updated = await prisma.session.updateMany({
            where: {
                id: sessionId,
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
            data: {
                refreshToken: refreshTokenHash,
                expiresAt,
                lastUsedAt: new Date(),
                userAgent: meta.userAgent,
                ipAddress: meta.ipAddress,
            },
        });

        if (updated.count === 0) {
            throw new Error("Session is not active");
        }
    }

    async findRevokeSession(sessionId: string): Promise<SessionUpdate> {
        return await prisma.session.update({
            where: {
                id: sessionId,
            },
            data: {
                revokedAt: new Date(),
            },
        });
    }

    async touchLastUsedAt(sessionId: string): Promise<void> {
        await prisma.session.updateMany({
            where: {
                id: sessionId,
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
            data: {
                lastUsedAt: new Date(),
            },
        });
    }

    async findAuthIdentityByProviderAccountId(
        provider: LoginAuthProvider,
        providerAccountId: string
    ): Promise<AuthIdentity | null> {
        return prisma.authIdentity.findUnique({
            where: {
                provider_providerAccountId: {
                    provider,
                    providerAccountId,
                },
            },
        });
    }

    async createAuthIdentity(data: AuthIdentityInput): Promise<AuthIdentity> {
        return prisma.authIdentity.create({
            data: {
                userId: data.userId,
                provider: data.provider,
                providerAccountId: data.providerAccountId,
                email: data.email.toLowerCase(),
            },
        });
    }

    async createUserWithAuthIdentity(
        user: AuthUser,
        identity: Omit<AuthIdentityInput, "userId">
    ): Promise<AuthUser> {
        const createdUser = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name: user.name,
                    email: user.email.toLowerCase(),
                    password: user.password,
                    emailVerified: user.emailVerified,
                },
            });

            await tx.authIdentity.create({
                data: {
                    userId: newUser.id,
                    provider: identity.provider,
                    providerAccountId: identity.providerAccountId,
                    email: identity.email.toLowerCase(),
                },
            });

            return newUser;
        });

        return new AuthUser(createdUser);
    }

    async markEmailVerified(userId: string): Promise<void> {
        await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                emailVerified: true,
            },
        });
    }

}
