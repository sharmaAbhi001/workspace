export interface GmailOAuthSession {
    codeVerifier: string;
    nonce: string;
}

export interface GmailSignedStatePayload {
    userId: string;
    nonce: string;
    exp: number;
}
