# Gmail Helpers

Docs for helpers in `gmail-helpers.ts` (used by `gmail-inbound.ts` sync and `gmail-reconcile.ts` backfill).

## How they fit together

```
Pub/Sub historyId                          Reconcile { from, to }
        │                                           │
        ▼                                           ▼
listNewInboxMessageIds              listInboxMessageIdsByDateRange
        │                                           │
        └──────────────┬────────────────────────────┘
                       ▼
            chunk(ids, 10) ──► Inngest steps (save-chunk-0, …)
                       │
                       ▼
            fetchAndSaveEmails
               ├── gmailClientFor
               ├── messages.get (full)
               ├── parseGmailMessage
               │      ├── header / address / body helpers
               │      └── extractAttachments
               └── saveAttachmentsForEmail
                      ├── downloadAttachmentBytes
                      └── MinIO putAttachmentObject
```

---

## Exported helpers

### `chunk(arr, size)`

**What it does**  
Splits an array into smaller arrays of length `size`.

**Why**  
Inngest steps should stay small and retryable. Saving 200 mails in one step is risky (timeout / partial failure). Chunking into 10 lets each `save-chunk-N` step retry independently.

---

### `gmailClientFor(integrationId)`

**What it does**  
Loads the integration from DB, decrypts OAuth tokens, builds a Gmail API client. On token refresh, encrypts and writes new tokens back to DB.

**Why**  
Every Gmail call needs an authenticated client. Tokens are encrypted at rest (`TOKEN_ENCRYPTION_KEY`), so this is the single place that decrypts → uses → re-saves refreshed tokens.

---

### `markDisconnected(integrationId)`

**What it does**  
Sets integration `status` to `DISCONNECTED`.

**Why**  
If the user revoked Gmail access (`invalid_grant`), retries are useless. Mark disconnected so sync skips this mailbox until they reconnect.

---

### `listNewInboxMessageIds(integrationId, startHistoryId)`

**What it does**  
Calls Gmail `users.history.list` from the stored bookmark (`startHistoryId`) and collects **new inbox message ids**.

Filters:
- only `messageAdded`
- must have `INBOX`
- skip `SENT` / `DRAFT`

Paginates until done. Returns `{ ids, latestHistoryId }`.

**Error handling**
| Case | Behavior |
|------|----------|
| `invalid_grant` | `markDisconnected` + `NonRetriableError` (Inngest won't retry) |
| History 404 (too old) | `recoverFromExpiredHistory` |
| Other errors | rethrow → Inngest retries |

**Why**  
Pub/Sub only sends `{ emailAddress, historyId }` — not the mail itself. History API is how we discover which messages arrived since last sync, without re-downloading the whole inbox.

---

### `listInboxMessageIdsByDateRange(integrationId, from, to)`

**What it does**  
Calls Gmail `users.messages.list` for **INBOX** messages in an inclusive calendar-date range (`from` / `to` as `YYYY-MM-DD`).

Query shape:
- `after:YYYY/M/D before:YYYY/M/D -in:sent -in:drafts`
- Gmail `before` is exclusive → `before` uses the calendar day after `to`
- Paginates all pages (`maxResults: 100`, no hard cap)

Returns message id strings only (does **not** touch `integration.historyId`).

**Error handling**
| Case | Behavior |
|------|----------|
| `invalid_grant` | `markDisconnected` + `NonRetriableError` |
| Other errors | rethrow → Inngest retries |

**Why**  
Manual reconcile / backfill needs date-range listing; History API only works from a bookmark. Used by `reconcile-gmail-inbox`.

---

### `parseGmailMessage(data, userId)`

**What it does**  
Maps a Gmail `users.messages.get` (`format: "full"`) payload into:
- Email row fields (`subject`, `body`, from/to, `receivedAt`, `isRead`, …)
- Attachment metadata list (ids, names, mime, size, inline flag)

**Why**  
Gmail’s MIME tree is nested and messy. This isolates parsing so `fetchAndSaveEmails` only does DB/storage work.

---

### `fetchAndSaveEmails(integration, messageIds)`

**What it does**
1. Skips message ids already in DB for that user (`providerId`)
2. Fetches each remaining message as `full`
3. Parses → creates `Email`
4. Saves attachments (MinIO + `Attachment` rows)
5. Ignores Prisma `P2002` (unique race — another worker already saved it)
6. Returns **new DB email ids** only

**Why**  
History can re-notify the same ids. We only want brand-new rows, and only those ids are emitted as `gmail/emails.process.requested` events.

---

## Internal helpers (not exported)

### `isInvalidGrant(e)` / `isHistoryExpired(e)`

**What** Detect OAuth revoke vs history bookmark expiry (404).  
**Why** Different failures need different recovery; keep that logic out of the main loop.

---

### `recoverFromExpiredHistory(gmail)`

**What** When history is too old, Gmail returns 404. This falls back to listing last ~1 day of inbox (`newer_than:1d`, exclude sent/drafts), caps at ~300 ids, and reads current mailbox `historyId` from profile.

**Why** Without recovery, sync would stay broken after a long gap (vacation, downtime). Partial recent backfill + fresh bookmark unblocks the pipeline.

---

### `headerValue(headers, name)`

**What** Case-insensitive lookup of a MIME header (`Subject`, `From`, `To`, `Date`, …).  
**Why** Gmail header casing is inconsistent.

---

### `parseAddress(raw)`

**What** Parses `"Name" <user@x.com>` (or bare email) into `{ email, name }`.  
**Why** `Email` stores from/to as separate email + name columns.

---

### `decodeBodyData(data)`

**What** Decodes Gmail’s URL-safe base64 body/attachment bytes into a `Buffer`.  
**Why** Gmail uses `-`/`_` instead of `+`/`/`; normal `base64` decode fails without this.

---

### `collectParts(part)`

**What** Flattens nested `payload.parts` into one list.  
**Why** Multipart mails nest text, HTML, and attachments; flatten once so body/attachment extractors stay simple.

---

### `sanitizeFilename(name)`

**What** Strips unsafe path characters and truncates length.  
**Why** Filenames become MinIO object key segments — must be safe.

---

### `extractBodies(parts)`

**What** Finds first `text/plain`, else `text/html`.  
**Why** Prefer plain text for AI/search; HTML is fallback; snippet is last resort (in `parseGmailMessage`).

---

### `extractAttachments(parts)`

**What** Detects attachment / inline parts (filename, `attachmentId`, Content-Disposition, Content-ID). Skips plain body parts. Keeps inline bytes when Gmail embeds them in the part.

**Why** Metadata pass before download/upload — cheap scan of the MIME tree.

---

### `downloadAttachmentBytes(gmail, messageId, meta)`

**What** Returns bytes from `meta.inlineData` if present, otherwise `users.messages.attachments.get`.  
**Why** Small parts are inline; large ones need a second API call.

---

### `saveAttachmentsForEmail(...)`

**What** For each attachment:
- `> 25MB` → DB row with `scanStatus: REJECTED`, no MinIO upload
- else download → SHA-256 → upload MinIO → create `Attachment` with `storageKey`
- ignore `P2002` duplicates

**Why** Persist files for later scan/extraction without bloating Postgres. Reject oversized files early.

---

## Related MinIO helpers (`src/config/storage/minio.ts`)

| Function | Role |
|----------|------|
| `getStorageClient` | Lazy S3 client pointed at MinIO (`forcePathStyle`) |
| `ensureBucket` | Create bucket on first use if missing |
| `putAttachmentObject` | Upload file bytes to MinIO |
| `buildAttachmentStorageKey` | Key: `attachments/{userId}/{emailId}/{providerAttachmentId}/{filename}` |

---

## Constants

| Name | Value | Why |
|------|-------|-----|
| `MAX_ATTACHMENT_BYTES` | 25MB | Avoid huge downloads/storage; mark `REJECTED` instead |
