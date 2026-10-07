import crypto from "node:crypto";
import { google, gmail_v1 } from "googleapis";
import { NonRetriableError } from "inngest";
import { prisma } from "../../config/database/client.js";
import {
    buildAttachmentStorageKey,
    putAttachmentObject,
} from "../../config/storage/minio.js";
import { createGmailOAuthClient } from "../../modules/integrations/provider/gmail/config.js";
import {
    decryptOptionalSecret,
    encryptOptionalSecret,
} from "../../utils/secret.js";
import {
    classifyEmail,
    DEFAULT_EXTRACT_TYPES,
    type ExtractIntents,
} from "../../aiSuperimo/jev.classifiction.js";
import type { EmailCategory } from "../../generated/prisma/enums.js";

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25MB

export type ClassifyAndSaveResult = {
    id: string;
    category: EmailCategory | null;
    needsReply: boolean | null;
    extractionNeeded: boolean | null;
    extractIntents: ExtractIntents | null;
};

type IntegrationRef = {
    id: string;
    userId: string;
};

type ParsedAddress = {
    email: string | null;
    name: string | null;
};

export type ParsedAttachmentMeta = {
    providerAttachmentId: string;
    filename: string;
    originalFilename: string | null;
    declaredMimeType: string | null;
    sizeBytes: number;
    isInline: boolean;
    contentId: string | null;
    /** Present when Gmail embedded the bytes in the message part itself. */
    inlineData?: Buffer;
};

export type ParsedGmailMessage = {
    email: {
        userId: string;
        providerId: string;
        subject: string;
        body: string;
        fromEmail: string | null;
        fromName: string | null;
        toEmail: string | null;
        toName: string | null;
        isRead: boolean;
        receivedAt: Date;
        processingStartedAt: null;
    };
    attachments: ParsedAttachmentMeta[];
};

export function chunk<T>(arr: T[], size: number): T[][] {
    if (size <= 0) {
        throw new Error("chunk size must be > 0");
    }

    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        out.push(arr.slice(i, i + size));
    }
    return out;
}

export async function gmailClientFor(integrationId: string) {
    const integ = await prisma.integration.findUniqueOrThrow({
        where: { id: integrationId },
    });

    const auth = createGmailOAuthClient();
    auth.setCredentials({
        access_token: decryptOptionalSecret(integ.accessToken) ?? undefined,
        refresh_token: decryptOptionalSecret(integ.refreshToken) ?? undefined,
        expiry_date: integ.expiresAt?.getTime(),
    });

    auth.on("tokens", async (tokens) => {
        await prisma.integration.update({
            where: { id: integrationId },
            data: {
                ...(tokens.access_token && {
                    accessToken: encryptOptionalSecret(tokens.access_token),
                }),
                ...(tokens.expiry_date && {
                    expiresAt: new Date(tokens.expiry_date),
                }),
                ...(tokens.refresh_token && {
                    refreshToken: encryptOptionalSecret(tokens.refresh_token),
                }),
            },
        });
    });

    return google.gmail({ version: "v1", auth });
}

export async function markDisconnected(integrationId: string) {
    await prisma.integration.update({
        where: { id: integrationId },
        data: { status: "DISCONNECTED" },
    });
}

function isInvalidGrant(e: unknown) {
    const err = e as { response?: { data?: { error?: string } }; message?: string };
    return (
        err?.response?.data?.error === "invalid_grant" ||
        String(err?.message ?? "").includes("invalid_grant")
    );
}

function isHistoryExpired(e: unknown) {
    const err = e as { code?: number | string; response?: { status?: number } };
    return err?.code === 404 || err?.response?.status === 404;
}

export async function listNewInboxMessageIds(
    integrationId: string,
    startHistoryId: string
): Promise<{ ids: string[]; latestHistoryId: string }> {
    const gmail = await gmailClientFor(integrationId);

    const ids = new Set<string>();
    let latestHistoryId = startHistoryId;
    let pageToken: string | undefined;

    try {
        do {
            const res = await gmail.users.history.list({
                userId: "me",
                startHistoryId,
                historyTypes: ["messageAdded"],
                labelId: "INBOX",
                maxResults: 500,
                pageToken,
            });

            for (const h of res.data.history ?? []) {
                for (const added of h.messagesAdded ?? []) {
                    const m = added.message;
                    if (!m?.id) continue;
                    const labels = m.labelIds ?? [];
                    if (!labels.includes("INBOX")) continue;
                    if (labels.includes("SENT") || labels.includes("DRAFT")) continue;
                    ids.add(m.id);
                }
            }

            if (res.data.historyId) latestHistoryId = res.data.historyId;
            pageToken = res.data.nextPageToken ?? undefined;
        } while (pageToken);

        return { ids: [...ids], latestHistoryId };
    } catch (e: unknown) {
        if (isInvalidGrant(e)) {
            await markDisconnected(integrationId);
            throw new NonRetriableError("Gmail access revoked (invalid_grant)");
        }

        if (isHistoryExpired(e)) {
            return recoverFromExpiredHistory(gmail);
        }

        throw e;
    }
}

async function recoverFromExpiredHistory(gmail: gmail_v1.Gmail) {
    const ids = new Set<string>();
    let pageToken: string | undefined;

    do {
        const res = await gmail.users.messages.list({
            userId: "me",
            labelIds: ["INBOX"],
            q: "newer_than:1d -in:sent -in:drafts",
            maxResults: 100,
            pageToken,
        });
        res.data.messages?.forEach((m) => m.id && ids.add(m.id));
        pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken && ids.size < 300);

    const profile = await gmail.users.getProfile({ userId: "me" });

    return {
        ids: [...ids],
        latestHistoryId: String(profile.data.historyId),
    };
}

/** Convert ISO calendar date `YYYY-MM-DD` → Gmail search date `YYYY/M/D`. */
function toGmailSearchDate(isoDate: string): string {
    const [y, m, d] = isoDate.split("-").map(Number);
    return `${y}/${m}/${d}`;
}

/** Add calendar days to an ISO `YYYY-MM-DD` date (UTC, no DST shift). */
function addIsoCalendarDays(isoDate: string, days: number): string {
    const [y, m, d] = isoDate.split("-").map(Number);
    const dt = new Date(Date.UTC(y!, m! - 1, d! + days));
    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
}

/**
 * List INBOX message ids in an inclusive calendar-date range via Gmail search.
 * `before` is exclusive in Gmail, so we use the day after `to`.
 */
export async function listInboxMessageIdsByDateRange(
    integrationId: string,
    from: string,
    to: string
): Promise<string[]> {
    const gmail = await gmailClientFor(integrationId);
    const after = toGmailSearchDate(from);
    const before = toGmailSearchDate(addIsoCalendarDays(to, 1));
    const q = `after:${after} before:${before} -in:sent -in:drafts`;

    const ids = new Set<string>();
    let pageToken: string | undefined;

    try {
        do {
            const res = await gmail.users.messages.list({
                userId: "me",
                labelIds: ["INBOX"],
                q,
                maxResults: 100,
                pageToken,
            });
            res.data.messages?.forEach((m) => m.id && ids.add(m.id));
            pageToken = res.data.nextPageToken ?? undefined;
        } while (pageToken);

        return [...ids];
    } catch (e: unknown) {
        if (isInvalidGrant(e)) {
            await markDisconnected(integrationId);
            throw new NonRetriableError("Gmail access revoked (invalid_grant)");
        }
        throw e;
    }
}

function headerValue(
    headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
    name: string
): string | null {
    const found = headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase());
    return found?.value?.trim() || null;
}

function parseAddress(raw: string | null): ParsedAddress {
    if (!raw) return { email: null, name: null };

    const match = raw.match(/^(?:"?([^"]*)"?\s)?<?([^>]+@[^>]+)>?$/);
    if (match) {
        const name = match[1]?.trim() || null;
        const email = match[2]?.trim().toLowerCase() || null;
        return { email, name };
    }

    if (raw.includes("@")) {
        return { email: raw.trim().toLowerCase(), name: null };
    }

    return { email: null, name: raw.trim() || null };
}

function decodeBodyData(data?: string | null): Buffer | null {
    if (!data) return null;
    return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function collectParts(
    part: gmail_v1.Schema$MessagePart | undefined,
    acc: gmail_v1.Schema$MessagePart[] = []
): gmail_v1.Schema$MessagePart[] {
    if (!part) return acc;
    acc.push(part);
    for (const child of part.parts ?? []) {
        collectParts(child, acc);
    }
    return acc;
}

function sanitizeFilename(name: string | null | undefined): string {
    const base = (name ?? "attachment").replace(/[/\\?%*:|"<>]/g, "_").trim();
    return (base || "attachment").slice(0, 180);
}

function extractBodies(parts: gmail_v1.Schema$MessagePart[]): {
    text: string | null;
    html: string | null;
} {
    let text: string | null = null;
    let html: string | null = null;

    for (const part of parts) {
        const mime = (part.mimeType ?? "").toLowerCase();
        const buf = decodeBodyData(part.body?.data);
        if (!buf) continue;
        const content = buf.toString("utf8");

        if (mime === "text/plain" && !text) text = content;
        if (mime === "text/html" && !html) html = content;
    }

    return { text, html };
}

function extractAttachments(parts: gmail_v1.Schema$MessagePart[]): ParsedAttachmentMeta[] {
    const out: ParsedAttachmentMeta[] = [];

    for (const part of parts) {
        const filename = part.filename?.trim();
        const attachmentId = part.body?.attachmentId;
        const inlineBytes = !attachmentId ? decodeBodyData(part.body?.data) : null;
        const size = part.body?.size ?? inlineBytes?.length ?? 0;

        // Real attachments: named file, or Content-Disposition attachment / inline image with id
        const disposition = headerValue(part.headers, "Content-Disposition")?.toLowerCase() ?? "";
        const contentId = headerValue(part.headers, "Content-ID");
        const isInline =
            disposition.includes("inline") ||
            Boolean(contentId) ||
            (part.mimeType ?? "").startsWith("image/");

        const looksLikeAttachment =
            Boolean(filename) ||
            Boolean(attachmentId) ||
            disposition.includes("attachment") ||
            (isInline && Boolean(attachmentId || inlineBytes));

        if (!looksLikeAttachment) continue;
        if (!attachmentId && !inlineBytes) continue;
        // Skip plain body parts mistaken as attachments
        if (
            !filename &&
            !attachmentId &&
            (part.mimeType === "text/plain" || part.mimeType === "text/html")
        ) {
            continue;
        }

        const safeName = sanitizeFilename(
            filename || (contentId ? contentId.replace(/[<>]/g, "") : "inline")
        );

        out.push({
            providerAttachmentId: attachmentId ?? `inline-${crypto.createHash("sha1").update(inlineBytes!).digest("hex").slice(0, 16)}`,
            filename: safeName,
            originalFilename: filename || null,
            declaredMimeType: part.mimeType ?? null,
            sizeBytes: size,
            isInline: Boolean(isInline && !disposition.includes("attachment")),
            contentId: contentId ? contentId.replace(/[<>]/g, "") : null,
            ...(inlineBytes ? { inlineData: inlineBytes } : {}),
        });
    }

    return out;
}

export function parseGmailMessage(
    data: gmail_v1.Schema$Message,
    userId: string
): ParsedGmailMessage {
    if (!data.id) {
        throw new Error("Gmail message is missing id");
    }

    const headers = data.payload?.headers;
    const subject = headerValue(headers, "Subject") ?? "(no subject)";
    const from = parseAddress(headerValue(headers, "From"));
    const to = parseAddress(headerValue(headers, "To"));

    const dateHeader = headerValue(headers, "Date");
    const internalMs = data.internalDate ? Number(data.internalDate) : NaN;
    const receivedAt = Number.isFinite(internalMs)
        ? new Date(internalMs)
        : dateHeader
          ? new Date(dateHeader)
          : new Date();

    const parts = collectParts(data.payload);
    const { text, html } = extractBodies(parts);
    const body = text ?? html ?? data.snippet ?? "";

    const labels = data.labelIds ?? [];
    const isRead = !labels.includes("UNREAD");

    return {
        email: {
            userId,
            providerId: data.id,
            subject,
            body,
            fromEmail: from.email,
            fromName: from.name,
            toEmail: to.email,
            toName: to.name,
            isRead,
            receivedAt,
            processingStartedAt: null,
        },
        attachments: extractAttachments(parts),
    };
}

async function downloadAttachmentBytes(
    gmail: gmail_v1.Gmail,
    messageId: string,
    meta: ParsedAttachmentMeta
): Promise<Buffer> {
    if (meta.inlineData) {
        return meta.inlineData;
    }

    const { data } = await gmail.users.messages.attachments.get({
        userId: "me",
        messageId,
        id: meta.providerAttachmentId,
    });

    const buf = decodeBodyData(data.data);
    if (!buf) {
        throw new Error(`Empty attachment payload: ${meta.providerAttachmentId}`);
    }
    return buf;
}

async function saveAttachmentsForEmail(params: {
    gmail: gmail_v1.Gmail;
    messageId: string;
    userId: string;
    emailId: string;
    attachments: ParsedAttachmentMeta[];
}) {
    for (const meta of params.attachments) {
        try {
            if (meta.sizeBytes > MAX_ATTACHMENT_BYTES) {
                await prisma.attachment.create({
                    data: {
                        userId: params.userId,
                        emailId: params.emailId,
                        providerAttachmentId: meta.providerAttachmentId,
                        filename: meta.filename,
                        originalFilename: meta.originalFilename,
                        mimeType: meta.declaredMimeType ?? "application/octet-stream",
                        declaredMimeType: meta.declaredMimeType,
                        sizeBytes: meta.sizeBytes,
                        sha256: "rejected-too-large",
                        isInline: meta.isInline,
                        contentId: meta.contentId,
                        storageKey: null,
                        scanStatus: "REJECTED",
                        scanNote: `File exceeds ${MAX_ATTACHMENT_BYTES} bytes`,
                    },
                });
                continue;
            }

            const bytes = await downloadAttachmentBytes(
                params.gmail,
                params.messageId,
                meta
            );
            const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
            const mimeType = meta.declaredMimeType ?? "application/octet-stream";
            const storageKey = buildAttachmentStorageKey({
                userId: params.userId,
                emailId: params.emailId,
                providerAttachmentId: meta.providerAttachmentId,
                filename: meta.filename,
            });

            await putAttachmentObject({
                key: storageKey,
                body: bytes,
                contentType: mimeType,
            });

            await prisma.attachment.create({
                data: {
                    userId: params.userId,
                    emailId: params.emailId,
                    providerAttachmentId: meta.providerAttachmentId,
                    filename: meta.filename,
                    originalFilename: meta.originalFilename,
                    mimeType,
                    declaredMimeType: meta.declaredMimeType,
                    sizeBytes: bytes.length,
                    sha256,
                    isInline: meta.isInline,
                    contentId: meta.contentId,
                    storageKey,
                    scanStatus: "PENDING",
                },
            });
        } catch (e: unknown) {
            const err = e as { code?: string };
            if (err.code === "P2002") continue;
            throw e;
        }
    }
}

export async function fetchAndSaveEmails(
    integration: IntegrationRef,
    messageIds: string[]
): Promise<string[]> {
    const gmail = await gmailClientFor(integration.id);

    const existing = await prisma.email.findMany({
        where: {
            userId: integration.userId,
            providerId: { in: messageIds },
        },
        select: { providerId: true },
    });
    const seen = new Set(existing.map((e) => e.providerId));

    const created: string[] = [];
    for (const id of messageIds.filter((m) => !seen.has(m))) {
        const { data } = await gmail.users.messages.get({
            userId: "me",
            id,
            format: "full",
        });

        try {
            const parsed = parseGmailMessage(data, integration.userId);
            const row = await prisma.email.create({ data: parsed.email });

            if (parsed.attachments.length > 0) {
                await saveAttachmentsForEmail({
                    gmail,
                    messageId: id,
                    userId: integration.userId,
                    emailId: row.id,
                    attachments: parsed.attachments,
                });
            }

            created.push(row.id);
        } catch (e: unknown) {
            const err = e as { code?: string };
            if (err.code !== "P2002") throw e;
        }
    }

    return created;
}



export type UpdateForProcessResult = | { action: "SKIPPED"; reason: string } | {
          action: "PROCESS";
          email: NonNullable<Awaited<ReturnType<typeof prisma.email.findUnique>>>;
      };

/**
 * Atomically claim a PENDING email for processing.
 * Returns SKIPPED when another run already claimed it (or it is missing),
 * otherwise PROCESS with the updated email row.
 */
export async function updateForProcess(
    userId: string,
    emailId: string
): Promise<UpdateForProcessResult> {
    const updated = await prisma.email.updateMany({
        where: {
            id: emailId,
            userId,
            processingStatus: "PENDING",
            processingStartedAt: null,
        },
        data: {
            processingStatus: "PROCESSING",
            processingStartedAt: new Date(),
        },
    });

    if (updated.count === 0) {
        const existing = await prisma.email.findFirst({
            where: { id: emailId, userId },
            select: { processingStatus: true },
        });

        if (!existing) {
            return { action: "SKIPPED", reason: "email not found" };
        }

        return {
            action: "SKIPPED",
            reason: `already ${existing.processingStatus.toLowerCase()}`,
        };
    }

    const email = await prisma.email.findUniqueOrThrow({
        where: { id: emailId },
    });

    return { action: "PROCESS", email };
}

/**
 * Classify an email with jev and persist category / reply / extract gates.
 * MVP: extract preferences default to REMINDER + MEETING + NOTE.
 */
export async function classifyAndSave(
    userId: string,
    emailId: string
): Promise<ClassifyAndSaveResult> {
    const email = await prisma.email.findFirst({
        where: { id: emailId, userId },
        select: {
            id: true,
            subject: true,
            body: true,
            fromEmail: true,
            fromName: true,
        },
    });

    if (!email) {
        throw new NonRetriableError("email not found for classification");
    }

    // TODO: load from user settings when that model exists.
    const extractPreferences = {
        enabledTypes: [...DEFAULT_EXTRACT_TYPES],
    };

    const classification = await classifyEmail({
        ...email,
        extractPreferences,
    });

    const updated = await prisma.email.update({
        where: { id: email.id },
        data: {
            category: classification.category,
            needsReply: classification.needsReply,
            extractionNeeded: classification.extractionNeeded,
            extractIntents: classification.extractIntents,
        },
        select: {
            id: true,
            category: true,
            needsReply: true,
            extractionNeeded: true,
            extractIntents: true,
        },
    });

    return {
        id: updated.id,
        category: updated.category,
        needsReply: updated.needsReply,
        extractionNeeded: updated.extractionNeeded,
        extractIntents: (updated.extractIntents as ExtractIntents | null) ?? null,
    };
}