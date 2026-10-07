import { generateCodeChallenge, generateCodeVerifier, generateRandomValue } from "./google.security.js";
import { createGoogleOAuthClient, googleClient, googleOAuthConfig } from "./config.js";



export const generateGoogleAuthorizationURL = () => {

    const state = generateRandomValue();
    const nonce = generateRandomValue();

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const oauth2Client = createGoogleOAuthClient();

    const authorizationURL = oauth2Client.generateAuthUrl({
        scope: googleOAuthConfig.scopes,
        state,
        nonce,
        prompt: "select_account consent",
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

export const exchangeGoogleCode = async (
    code: string,
    codeVerifier: string
) => {
    const oauth2Client = createGoogleOAuthClient();

    const { tokens } = await oauth2Client.getToken({
        code,
        codeVerifier,
    });

    return tokens;
};

export const verifyGoogleIdToken = async (
    idToken: string,
    expectedNonce: string
) => {
    const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: googleOAuthConfig.clientId,
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
