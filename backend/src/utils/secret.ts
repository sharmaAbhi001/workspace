import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const VERSION = "v1";

let cachedKey: Buffer | undefined;

function encryptionKey(): Buffer {
    if (cachedKey) {
        return cachedKey;
    }

    const raw = process.env.TOKEN_ENCRYPTION_KEY;

    if (!raw) {
        throw new Error("TOKEN_ENCRYPTION_KEY is missing");
    }

    const key = Buffer.from(raw, "base64");

    if (key.length !== 32) {
        throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes encoded as base64");
    }

    cachedKey = key;
    return key;
}

export function encryptSecret(plainText: string): string {
    const iv = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey(), iv, {
        authTagLength: AUTH_TAG_BYTES,
    });

    const ciphertext = Buffer.concat([
        cipher.update(plainText, "utf8"),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return [
        VERSION,
        iv.toString("base64url"),
        tag.toString("base64url"),
        ciphertext.toString("base64url"),
    ].join(".");
}

export function decryptSecret(stored: string): string {
    if (!stored.startsWith(`${VERSION}.`)) {
        return stored;
    }

    const [, ivPart, tagPart, dataPart] = stored.split(".");

    if (!ivPart || !tagPart || !dataPart) {
        throw new Error("Stored secret is invalid");
    }

    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        encryptionKey(),
        Buffer.from(ivPart, "base64url"),
        { authTagLength: AUTH_TAG_BYTES }
    );

    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

    const plainText = Buffer.concat([
        decipher.update(Buffer.from(dataPart, "base64url")),
        decipher.final(),
    ]);

    return plainText.toString("utf8");
}

export function encryptOptionalSecret(value: string | null): string | null {
    if (!value) {
        return null;
    }

    return encryptSecret(value);
}

export function decryptOptionalSecret(value: string | null): string | null {
    if (!value) {
        return null;
    }

    return decryptSecret(value);
}
