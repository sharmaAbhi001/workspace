export interface GoogleOAuthState {
    state: string;
    nonce: string;
    codeVerifier: string;
}
