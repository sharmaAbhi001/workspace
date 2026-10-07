import { NextFunction, Request, Response } from "express";
import type { Role } from "../../types/express.js";
import { ApiError } from "../../utils/ApiError.js";
import { verifyAccessTokenFromRequest } from "../../utils/jwt.js";

export type { Role };

export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (allowedRoles.length === 0) {
        throw new ApiError("At least one role is required", 500);
      }

      const payload = verifyAccessTokenFromRequest(req);

      // TODO: load real roles from JWT claims or DB and compare to allowedRoles
      const role: Role = "user";

      if (!allowedRoles.includes(role)) {
        throw new ApiError("Forbidden", 403);
      }

      req.user = {
        id: payload.sub,
        sid: payload.sid,
        role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
