import jwt, { type JwtPayload } from "jsonwebtoken";
import { Request } from "express";
import { ApiError } from "./ApiError.js";


export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  sid: string;
}

export const generateAccessToken = (userId: string, sessionId: string) => {
  return jwt.sign(
    { sub: userId, sid: sessionId },
    process.env.JWT_SECRET!,
    {
      expiresIn: "15m",
    }
  );
};

const assertAccessTokenPayload = (payload: string | JwtPayload): AccessTokenPayload => {
  if (typeof payload === "string") {
    throw new ApiError("Invalid access token", 401);
  }

  if (!payload.sub || typeof (payload as AccessTokenPayload).sid !== "string") {
    throw new ApiError("Invalid access token", 401);
  }

  return payload as AccessTokenPayload;
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    return assertAccessTokenPayload(payload);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "TokenExpiredError") {
      throw new ApiError("Access token expired", 401);
    }

    if (error instanceof Error && error.name === "JsonWebTokenError") {
      throw new ApiError("Invalid access token", 401);
    }

    throw new ApiError("Unauthorized", 401);
  }
};

/** Decode access token even when expired — used for refresh rotation. */
export const decodeAccessTokenIgnoreExpiration = (
  token: string
): AccessTokenPayload => {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!, {
      ignoreExpiration: true,
    });
    return assertAccessTokenPayload(payload);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError("Invalid access token", 401);
  }
};

const readBearerToken = (req: Request): string | null => {
  const header = req.get("authorization");

  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");

  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return token;
};

const readCookieAccessToken = (req: Request): string | null => {
  const accessToken = req.cookies?.accessToken;

  if (typeof accessToken === "string" && accessToken) {
    return accessToken;
  }

  // Legacy cookie name during migration
  const legacyToken = req.cookies?.token;
  if (typeof legacyToken === "string" && legacyToken) {
    return legacyToken;
  }

  return null;
};

/**
 * Resolve the access token from cookie and/or Authorization header.
 * - neither present -> 401
 * - one present -> use it
 * - both present and identical -> use it
 * - both present and different -> 400
 */
export const extractAccessToken = (req: Request): string => {
  const cookieToken = readCookieAccessToken(req);
  const headerToken = readBearerToken(req);

  if (!cookieToken && !headerToken) {
    throw new ApiError("Access token required", 401);
  }

  if (cookieToken && headerToken && cookieToken !== headerToken) {
    throw new ApiError("Conflicting access tokens", 400);
  }

  return cookieToken ?? headerToken!;
};

export const verifyAccessTokenFromRequest = (req: Request): AccessTokenPayload => {
  const token = extractAccessToken(req);
  return verifyAccessToken(token);
};
