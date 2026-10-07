import crypto from "node:crypto";
import { GmailSignedStatePayload } from "./types.js";


export const generateRandomValue = (length = 32): string => {
    return crypto.randomBytes(length).toString("base64url");
};

export const generateCodeVerifier = (): string => {
    return crypto.randomBytes(32).toString("base64url");
};

export const generateCodeChallenge = (
    codeVerifier: string
): string => {
    return crypto
        .createHash("sha256")
        .update(codeVerifier)
        .digest("base64url");
};

const getStateSecret = (): string => {
    const secret = process.env.STATE_SECRET;
    if (!secret) {
        throw new Error("STATE_SECRET is not configured");
    }
    return secret;
};

export const signGmailOAuthState = (userId: string, nonce: string, ttlSeconds = 600): string => {
    const payload: GmailSignedStatePayload = {
        userId,
        nonce,
        exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    };

    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
        .createHmac("sha256", getStateSecret())
        .update(body)
        .digest("base64url");

    return `${body}.${signature}`;
};

export const verifyGmailOAuthState = (state: string): GmailSignedStatePayload => {
    const [body, signature] = state.split(".");

    if (!body || !signature) {
        throw new Error("Invalid OAuth state");
    }

    const expected = crypto
        .createHmac("sha256", getStateSecret())
        .update(body)
        .digest("base64url");

    const expectedBuf = Buffer.from(expected);
    const actualBuf = Buffer.from(signature);

    if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
        throw new Error("Invalid OAuth state signature");
    }

    let payload: GmailSignedStatePayload;

    try {
        payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as GmailSignedStatePayload;
    } catch {
        throw new Error("Invalid OAuth state payload");
    }

    if (!payload.userId || !payload.nonce || typeof payload.exp !== "number") {
        throw new Error("Invalid OAuth state payload");
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error("OAuth state expired");
    }

    return payload;
};
