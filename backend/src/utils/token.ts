import crypto from "node:crypto";

export const generateRefreshToken = (): string => {
    return crypto.randomBytes(64).toString("hex");
};

/** Deterministic hash so sessions can be looked up by refresh token alone. */
export const hashRefreshToken = async (token: string): Promise<string> => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

export const compareRefreshToken = async (
    token: string,
    hash: string
): Promise<boolean> => {
    const incoming = crypto.createHash("sha256").update(token).digest("hex");

    if (incoming.length !== hash.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        Buffer.from(incoming, "utf8"),
        Buffer.from(hash, "utf8")
    );
};
