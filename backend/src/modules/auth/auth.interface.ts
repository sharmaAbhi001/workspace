import { LoginUser } from "./auth.schema.js";
import { AuthUser } from "./auth.types.js";


export interface RegisterUserDTO {
    name: string;
    email: string;
    password: string;
}

export interface AuthResposeDTO {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
}

export interface SessionUpdate {
    userId: string;
    refreshToken: string;
    expiresAt: Date;
    revokedAt: Date | null;
    lastUsedAt: Date | null;
    userAgent: string | null;
    ipAddress: string | null;
}

export interface SessionMeta {
    ipAddress: string | null;
    userAgent: string | null;
}

export interface Session {
    userId: string;
    refreshToken: string;
    expiresAt: Date;
    revokedAt?: Date;
    lastUsedAt?: Date;
    userAgent?: string | null;
    ipAddress?: string | null;
}

export interface SessionRecord {
    id: string;
    userId: string;
    refreshToken: string;
    expiresAt: Date;
    revokedAt: Date | null;
    lastUsedAt: Date | null;
    userAgent: string | null;
    ipAddress: string | null;
}

export interface AuthResult {
    user: AuthResposeDTO;
    accessToken: string;
    refreshToken: string;
}

export type LoginAuthProvider = "GOOGLE";

export interface AuthIdentity {
    id: string;
    userId: string;
    provider: LoginAuthProvider;
    providerAccountId: string;
    email: string;
    createdAt: Date;
}

export interface AuthIdentityInput {
    userId: string;
    provider: LoginAuthProvider;
    providerAccountId: string;
    email: string;
}

export interface GoogleAuthInput {
    idToken: string;
}

export interface GoogleAuthResult extends AuthResult {
    isNewUser: boolean;
}

export interface IAuthRepository {
    findByEmail(email: string): Promise<AuthUser | null>;
    findById(id: string): Promise<AuthUser | null>;

    createUser(user: AuthUser): Promise<AuthUser>;
    createUserWithAuthIdentity(
        user: AuthUser,
        identity: Omit<AuthIdentityInput, "userId">
    ): Promise<AuthUser>;
    markEmailVerified(userId: string): Promise<void>;

    createSessionWithLimit(data: Session, maxSessions: number): Promise<string>;
    findSessionById(sessionId: string): Promise<SessionRecord | null>;
    findSessionByRefreshTokenHash(
        refreshTokenHash: string
    ): Promise<SessionRecord | null>;
    rotateSessionTokens(
        sessionId: string,
        refreshTokenHash: string,
        expiresAt: Date,
        meta: SessionMeta
    ): Promise<void>;
    findRevokeSession(sessionId: string): Promise<SessionUpdate>;
    touchLastUsedAt(sessionId: string): Promise<void>;

    findAuthIdentityByProviderAccountId(
        provider: LoginAuthProvider,
        providerAccountId: string
    ): Promise<AuthIdentity | null>;
    createAuthIdentity(data: AuthIdentityInput): Promise<AuthIdentity>;
}

export interface IAuthService {
    registerUser(data: RegisterUserDTO, meta: SessionMeta): Promise<AuthResult>;
    loginUser(data: LoginUser, meta: SessionMeta): Promise<AuthResult>;
    logout(token: string): Promise<SessionUpdate>;
    getMe(userId: string): Promise<AuthResposeDTO>;
    refreshTokens(
        refreshToken: string,
        meta: SessionMeta
    ): Promise<AuthResult>;
    loginOrRegisterWithGoogle(
        input: GoogleAuthInput,
        nonce: string,
        meta: SessionMeta
    ): Promise<GoogleAuthResult>;
}
