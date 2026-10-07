import { google } from "googleapis";
import {
    createGmailOAuthClient,
    gmailIdTokenClient,
    gmailOAuthConfig,
} from "./config.js";
import {
    generateCodeChallenge,
    generateCodeVerifier,
    generateRandomValue,
    signGmailOAuthState,
} from "./gmail.security.js";



export const generateGmailConnectAuthorizationURL = (userId: string) => {
    const nonce = generateRandomValue();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = signGmailOAuthState(userId, nonce);

    const oauth2Client = createGmailOAuthClient();

    const authorizationURL = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: gmailOAuthConfig.scopes,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256" as any,
    });

    return {
        authorizationURL,
        state,
        nonce,
        codeVerifier,
    };
};

export const exchangeGmailCode = async (
    code: string,
    codeVerifier: string
) => {
    const oauth2Client = createGmailOAuthClient();

    const { tokens } = await oauth2Client.getToken({
        code,
        codeVerifier,
    });

    return tokens;
};

export const verifyGmailIdToken = async (
    idToken: string,
    expectedNonce: string
) => {
    const ticket = await gmailIdTokenClient.verifyIdToken({
        idToken,
        audience: gmailOAuthConfig.clientId,
    });

    const payload = ticket.getPayload();

    if (!payload) {
        throw new Error("Invalid Google ID token");
    }

    if (payload.nonce !== expectedNonce) {
        throw new Error("Invalid Google nonce");
    }

    return payload;
};

const createAuthedGmailClient = (accessToken: string, refreshToken?: string | null) => {
    const oauth2Client = createGmailOAuthClient();
    oauth2Client.setCredentials({
        access_token: accessToken,
        ...(refreshToken ? { refresh_token: refreshToken } : {}),
    });

    return google.gmail({
        version: "v1",
        auth: oauth2Client,
    });
};

export const getGmailProfileEmail = async (accessToken: string): Promise<string> => {
    const gmail = createAuthedGmailClient(accessToken);
    const { data } = await gmail.users.getProfile({ userId: "me" });

    if (!data.emailAddress) {
        throw new Error("Gmail profile email is missing");
    }

    return data.emailAddress.toLowerCase();
};

export const startGmailWatch = async (accessToken: string, refreshToken?: string | null) => {
    const gmail = createAuthedGmailClient(accessToken, refreshToken);

    const { data } = await gmail.users.watch({
        userId: "me",
        requestBody: {
            labelIds: ["INBOX"],
            topicName: gmailOAuthConfig.pubsubTopic,
        },
    });

    return {
        historyId: data.historyId ? String(data.historyId) : null,
        watchExpiresAt: data.expiration
            ? new Date(Number(data.expiration))
            : null,
    };
};

export const stopGmailWatch = async (
    accessToken: string,
    refreshToken?: string | null
): Promise<void> => {
    const gmail = createAuthedGmailClient(accessToken, refreshToken);
    await gmail.users.stop({ userId: "me" });
};
