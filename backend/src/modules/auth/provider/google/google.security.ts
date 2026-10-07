import crypto from "node:crypto";



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