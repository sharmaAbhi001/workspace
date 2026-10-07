import { OAuth2Client } from "google-auth-library";
import { Request } from "express";


const client = new OAuth2Client();

type VerifyResult = {ok:true} | {ok : false; reason : string};


export async function verifyPubSubRequest(req: Request): Promise<VerifyResult> {
    // Sirf local dev me skip, production me kabhi nahi
    if (
      process.env.SKIP_PUBSUB_AUTH === "true" &&
      process.env.NODE_ENV !== "production"
    ) {
      return { ok: true };
    }
  
    const audience = process.env.PUBSUB_AUDIENCE;
    const expectedEmail = process.env.PUBSUB_SERVICE_ACCOUNT;
    if (!audience || !expectedEmail) {
      return { ok: false, reason: "PUBSUB_AUDIENCE ya PUBSUB_SERVICE_ACCOUNT env missing hai" };
    }
  
    // 1. Header se token nikalo
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return { ok: false, reason: "Authorization header empty " };
    }
    const token = authHeader.slice(7);
  
    try {
      // 2. Signature, expiry, issuer aur audience check (Google ki taraf se sign hua hai ya nahi)
      const ticket = await client.verifyIdToken({ idToken: token, audience });
      const payload = ticket.getPayload();
      if (!payload) return { ok: false, reason: "Token payload empty" };
  
      // 3. Token wahi service account ka hai jo humne set kiya?
      if (payload.email !== expectedEmail) {
        return { ok: false, reason: `Invalid service account: ${payload.email}` };
      }
      if (payload.email_verified !== true) {
        return { ok: false, reason: "Email is not verified " };
      }
  
      return { ok: true };
    } catch (err: any) {
      return { ok: false, reason: `Token invalid: ${err.message}` };
    }
  }