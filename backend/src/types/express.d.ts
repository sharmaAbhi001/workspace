export type Role = "admin" | "user" | "support";

export interface AuthUserContext {
  id: string;
  sid: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserContext;
    }
  }
}

export {};
