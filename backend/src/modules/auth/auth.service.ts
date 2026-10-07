import { ApiError } from "../../utils/ApiError.js";
import {
    IAuthRepository,
    IAuthService,
    RegisterUserDTO,
    Session,
    AuthResult,
    SessionUpdate,
    AuthResposeDTO,
    GoogleAuthInput,
    GoogleAuthResult,
    SessionMeta,
} from "./auth.interface.js";
import { AuthUser } from "./auth.types.js";
import { generateAccessToken, verifyAccessToken } from "../../utils/jwt.js";
import {
    compareRefreshToken,
    generateRefreshToken,
    hashRefreshToken,
} from "../../utils/token.js";
import { LoginUser } from "./auth.schema.js";
import { verifyGoogleIdToken } from "./provider/google/google.service.js";

const MAX_CONCURRENT_SESSIONS = 5;

export class AuthService implements IAuthService {

    constructor(private readonly authRepository: IAuthRepository) {

    }


    async registerUser(data: RegisterUserDTO, meta: SessionMeta): Promise<AuthResult> {
        const email = data.email.toLowerCase();
        const existingUser = await this.authRepository.findByEmail(email);

        if (existingUser) {
            throw new ApiError("User Already Exist", 409);
        }

        const user = new AuthUser({
            ...data,
            email,
        });

        await user.hashPassword();

        const registerUser = await this.authRepository.createUser(user);

        return this.issueSession(registerUser, meta);
    }


    async loginUser(data: LoginUser, meta: SessionMeta): Promise<AuthResult> {
        const userexist = await this.authRepository.findByEmail(data.email.toLowerCase());

        if (!userexist) {
            throw new ApiError("Invalid credential", 404);
        }

        const user = new AuthUser({
            ...userexist,
        });

        const isMatch = await user.comparePassword(data.password);

        if (!isMatch) {
            throw new ApiError("Invalid credential", 404);
        }

        return this.issueSession(user, meta);
    }

    async logout(token: string): Promise<SessionUpdate> {
        const payload = verifyAccessToken(token);
        const sessionId: string = payload.sid;

        const session = await this.authRepository.findRevokeSession(sessionId);
        return session;
    }

    async getMe(userId: string): Promise<AuthResposeDTO> {
        const user = await this.authRepository.findById(userId);

        if (!user) {
            throw new ApiError("User not found", 404);
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
        };
    }

    async refreshTokens(
        refreshToken: string,
        meta: SessionMeta
    ): Promise<AuthResult> {
        if (!refreshToken) {
            throw new ApiError("Refresh token required", 401);
        }

        const refreshTokenHash = await hashRefreshToken(refreshToken);
        const session =
            await this.authRepository.findSessionByRefreshTokenHash(
                refreshTokenHash
            );

        if (!session) {
            throw new ApiError("Invalid refresh token", 401);
        }

        if (session.revokedAt || session.expiresAt <= new Date()) {
            throw new ApiError("Session expired", 401);
        }

        // Defense in depth — hash lookup should already match.
        const refreshMatches = await compareRefreshToken(
            refreshToken,
            session.refreshToken
        );

        if (!refreshMatches) {
            await this.authRepository.findRevokeSession(session.id);
            throw new ApiError("Invalid refresh token", 401);
        }

        const user = await this.authRepository.findById(session.userId);

        if (!user) {
            throw new ApiError("User not found", 404);
        }

        const nextRefreshToken = generateRefreshToken();
        const nextRefreshHash = await hashRefreshToken(nextRefreshToken);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        try {
            await this.authRepository.rotateSessionTokens(
                session.id,
                nextRefreshHash,
                expiresAt,
                meta
            );
        } catch {
            throw new ApiError("Could not rotate session", 401);
        }

        const nextAccessToken = generateAccessToken(user.id, session.id);

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
            },
            accessToken: nextAccessToken,
            refreshToken: nextRefreshToken,
        };
    }

    async loginOrRegisterWithGoogle(
        input: GoogleAuthInput,
        nonce: string,
        meta: SessionMeta
    ): Promise<GoogleAuthResult> {
        const googleAccount = await this.verifyGoogleAccount(input, nonce);

        const identity = await this.authRepository.findAuthIdentityByProviderAccountId(
            "GOOGLE",
            googleAccount.sub
        );

        if (identity) {
            const user = await this.authRepository.findById(identity.userId);

            if (!user) {
                throw new ApiError("User not found", 404);
            }

            const session = await this.issueSession(user, meta);
            return { ...session, isNewUser: false };
        }

        if (googleAccount.emailVerified) {
            const existingUser = await this.authRepository.findByEmail(googleAccount.email);

            if (existingUser) {
                await this.authRepository.createAuthIdentity({
                    userId: existingUser.id,
                    provider: "GOOGLE",
                    providerAccountId: googleAccount.sub,
                    email: googleAccount.email,
                });

                if (!existingUser.emailVerified) {
                    await this.authRepository.markEmailVerified(existingUser.id);
                    existingUser.emailVerified = true;
                }

                const session = await this.issueSession(existingUser, meta);
                return { ...session, isNewUser: false };
            }
        } else {
            const existingUser = await this.authRepository.findByEmail(googleAccount.email);

            if (existingUser) {
                throw new ApiError("A verified Google email is required to link this account", 403);
            }
        }

        const user = new AuthUser({
            name: googleAccount.name,
            email: googleAccount.email,
            password: null,
            emailVerified: googleAccount.emailVerified,
        });

        const createdUser = await this.authRepository.createUserWithAuthIdentity(user, {
            provider: "GOOGLE",
            providerAccountId: googleAccount.sub,
            email: googleAccount.email,
        });

        const session = await this.issueSession(createdUser, meta);
        return { ...session, isNewUser: true };
    }

    private async issueSession(user: AuthUser, meta: SessionMeta): Promise<AuthResult> {
        const response: AuthResposeDTO = {
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
        };

        const refreshToken = generateRefreshToken();
        const hashRefresh = await hashRefreshToken(refreshToken);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const sessionData: Session = {
            userId: user.id,
            refreshToken: hashRefresh,
            expiresAt,
            lastUsedAt: new Date(),
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
        };

        const sessionId = await this.authRepository.createSessionWithLimit(
            sessionData,
            MAX_CONCURRENT_SESSIONS
        );
        const accessToken = generateAccessToken(user.id, sessionId);

        return {
            user: response,
            accessToken,
            refreshToken,
        };
    }

    private async verifyGoogleAccount(input: GoogleAuthInput, nonce: string) {
        let payload;

        try {
            payload = await verifyGoogleIdToken(input.idToken, nonce);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Invalid Google token";
            throw new ApiError(message, 401);
        }

        if (!payload.email) {
            throw new ApiError("Google email is required", 403);
        }

        const emailVerified = payload.email_verified === true;

        return {
            sub: payload.sub,
            email: payload.email.toLowerCase(),
            name: payload.name ?? payload.email.split("@")[0],
            emailVerified,
        };
    }

}
