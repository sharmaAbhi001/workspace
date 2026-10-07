import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

const requireEnv = (name: string): string => {
    const value = process.env[name];

    if (!value) {
        throw new Error(`${name} is not configured`);
    }

    return value;
};

export const gmailOAuthConfig = {
    get clientId() {
        return requireEnv("GOOGLE_CLIENT_ID");
    },
    get clientSecret() {
        return requireEnv("GOOGLE_CLIENT_SECRET");
    },
    get redirectUri() {
        return requireEnv("GOOGLE_INTEGRATION_REDIRECT_URI");
    },
    get pubsubTopic() {
        return requireEnv("PUBSUB_TOPIC");
    },

    // Consent: read email only (for now)
    scopes: [
        "https://www.googleapis.com/auth/gmail.readonly",
    ] as string[],
};

export const createGmailOAuthClient = () => {
    return new google.auth.OAuth2(
        gmailOAuthConfig.clientId,
        gmailOAuthConfig.clientSecret,
        gmailOAuthConfig.redirectUri
    );
};

export const gmailIdTokenClient = new OAuth2Client(
    // Lazily resolved when first used; constructor needs a string at call time for verify helpers.
    process.env.GOOGLE_CLIENT_ID
);
