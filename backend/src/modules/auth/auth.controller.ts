import { AuthService } from "./auth.service.js";
import { Request, Response } from "express";
import { AuthResult, GoogleAuthInput, RegisterUserDTO, SessionMeta } from "./auth.interface.js";
import { ApiResponse, ApiResponseLogout } from "../../utils/ApiResponse.js";
import { LoginUser } from "./auth.schema.js";
import { exchangeGoogleCode, generateGoogleAuthorizationURL } from "./provider/google/google.service.js";
import { Credentials } from "google-auth-library";
import { ApiError } from "../../utils/ApiError.js";


export class AuthController {

    private service: AuthService;

    constructor(service: AuthService) {
        this.service = service;
    }


    signup = async (req: Request, res: Response) => {

        const data: RegisterUserDTO = req.body;


        const result = await this.service.registerUser(data, this.getSessionMeta(req));

        this.setAuthCookies(res, result);

        return res.status(201).json(new ApiResponse("user created successfully", 201, result.user, true));
    }



    login = async (req: Request, res: Response) => {

        const data: LoginUser = req.body;

        const result = await this.service.loginUser(data, this.getSessionMeta(req));

        this.setAuthCookies(res, result);

        return res.status(201).json(new ApiResponse("user Login success", 200, result.user, true));

    }

    logout = async (req: Request, res: Response) => {
        const accessToken =
            typeof req.cookies?.accessToken === "string"
                ? req.cookies.accessToken
                : typeof req.cookies?.token === "string"
                    ? req.cookies.token
                    : "";

        await this.service.logout(accessToken);

        this.clearAuthCookies(res);

        return res.status(201).json(new ApiResponseLogout("user Logout successfully", 201, true));
    }

    me = async (req: Request, res: Response) => {
        const userId = req.user?.id;

        if (!userId) {
            throw new ApiError("Unauthorized", 401);
        }

        const user = await this.service.getMe(userId);

        return res
            .status(200)
            .json(new ApiResponse("session restored", 200, user, true));
    }

    refresh = async (req: Request, res: Response) => {
        const refreshToken =
            typeof req.cookies?.refreshToken === "string"
                ? req.cookies.refreshToken
                : "";

        try {
            const result = await this.service.refreshTokens(
                refreshToken,
                this.getSessionMeta(req)
            );

            this.setAuthCookies(res, result);

            return res
                .status(200)
                .json(new ApiResponse("token refreshed", 200, result.user, true));
        } catch (error) {
            // Drop both cookies so the client cannot loop on a bad session.
            this.clearAuthCookies(res);
            throw error;
        }
    }

    googleAuth = async (req: Request, res: Response) => {
        const { authorizationURL, state, nonce, codeVerifier } = generateGoogleAuthorizationURL();

        req.session.googleOAuth = {
            state,
            nonce,
            codeVerifier,
        };

        await new Promise<void>((resolve, reject) => {
            req.session.save((error) => {
                if (error) {
                    reject(new ApiError("Could not start Google login", 500));
                    return;
                }

                resolve();
            });
        });

        // SPA clients (Axios) get the Google URL as JSON so the browser never
        // navigates to the backend host. Direct browser hits still redirect.
        const accept = req.get("accept") ?? "";
        if (accept.includes("application/json")) {
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        "Google auth ready",
                        200,
                        { authorizationURL },
                        true
                    )
                );
        }

        return res.redirect(authorizationURL);
    }


    googlecallback = async (req: Request, res: Response) => {
        const frontendOrigin =
            process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
        const redirectWithError = (message: string) => {
            delete req.session.googleOAuth;
            return res.redirect(
                `${frontendOrigin}/auth?error=${encodeURIComponent(message)}`
            );
        };

        const { code, state } = req.query;
        const oauthState = req.session.googleOAuth;

        if (
            typeof code !== "string" ||
            typeof state !== "string"
        ) {
            return redirectWithError("Invalid Google OAuth callback");
        }

        if (!oauthState) {
            return redirectWithError("OAuth session expired");
        }

        if (state !== oauthState.state) {
            return redirectWithError("Invalid OAuth state");
        }

        try {
            const tokens = await exchangeGoogleCode(
                code,
                oauthState.codeVerifier
            );
            const input = this.toGoogleAuthInput(tokens);

            const result = await this.service.loginOrRegisterWithGoogle(
                input,
                oauthState.nonce,
                this.getSessionMeta(req)
            );
            this.setAuthCookies(res, result);

            // Send the browser back to the frontend — never leave users on the API host.
            return res.redirect(`${frontendOrigin}/app?google=success`);
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : "Google sign-in failed";
            return redirectWithError(message);
        } finally {
            delete req.session.googleOAuth;
        }

    }

    private getSessionMeta(req: Request): SessionMeta {
        const forwarded = req.headers["x-forwarded-for"];
        const forwardedIp = typeof forwarded === "string"
            ? forwarded.split(",")[0]?.trim()
            : Array.isArray(forwarded)
                ? forwarded[0]?.trim()
                : undefined;

        return {
            ipAddress: forwardedIp || req.ip || req.socket.remoteAddress || null,
            userAgent: req.get("user-agent") ?? null,
        };
    }

    private setAuthCookies(res: Response, result: AuthResult) {
        const cookieBase = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax" as const,
        };

        res.cookie("accessToken", result.accessToken, {
            ...cookieBase,
            maxAge: 15 * 60 * 1000,
        });

        res.cookie("refreshToken", result.refreshToken, {
            ...cookieBase,
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        // Drop legacy cookie name if present
        res.clearCookie("token", cookieBase);
    }

    private clearAuthCookies(res: Response) {
        const cookieBase = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax" as const,
        };

        res.clearCookie("accessToken", cookieBase);
        res.clearCookie("refreshToken", cookieBase);
        res.clearCookie("token", cookieBase);
    }

    private toGoogleAuthInput(tokens: Credentials): GoogleAuthInput {
        if (!tokens.id_token) {
            throw new ApiError("Google id token is missing", 400);
        }

        return {
            idToken: tokens.id_token,
        };
    }

}
