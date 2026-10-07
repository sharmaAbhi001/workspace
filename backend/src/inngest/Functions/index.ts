import { processGmailEmails, syncGmailNotification } from "./gmail-inbound.js";
import { reconcileGmailInbox } from "./gmail-reconcile.js";

export const functions = [
    syncGmailNotification,
    processGmailEmails,
    reconcileGmailInbox,
];
