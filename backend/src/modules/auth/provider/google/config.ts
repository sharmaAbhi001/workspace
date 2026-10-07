import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";


export const googleOAuthConfig = {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,

    scopes: [
        "openid",
        "email",
        "profile",
    ],
};

export const createGoogleOAuthClient = () => {
    return new google.auth.OAuth2(
        googleOAuthConfig.clientId,
        googleOAuthConfig.clientSecret,
        googleOAuthConfig.redirectUri
    );
};

export const googleClient = new OAuth2Client(
    googleOAuthConfig.clientId
);
