import "express-session";
import { GoogleOAuthState } from "../modules/auth/provider/google/types.js";
import { GmailOAuthSession } from "../modules/integrations/provider/gmail/types.js";

declare module "express-session" {
  interface SessionData {
    googleOAuth?: GoogleOAuthState;
    gmailOAuth?: GmailOAuthSession;
  }
}
