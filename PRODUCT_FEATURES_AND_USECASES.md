# Workspace — Product Features & Use Cases

**Product:** Workspace  
**Positioning:** An AI email (and later multi-channel) assistant for solo entrepreneurs, small business owners, and creators — with **human approval before every send**.

This document summarizes what we are building, what is **live / in progress** vs **coming soon**, primary use cases, and what to add next for real productivity gains.

---

## 1. Product thesis (what we built)

Workspace collects context from the tools a solo operator already uses, then helps them act faster:

1. **Connect sources** (today: Gmail; later: docs, calendar, social, meetings).
2. **AI processes inbound** — classify, extract notes/reminders, draft replies grounded in business docs.
3. **Human stays in control** — edit with AI, approve, or reject. Nothing sends automatically.
4. **Workspace Agent** — one place with full context to search, answer, and prepare follow-ups.

The marketing landing page and hero data-flow visualization tell this story. The backend focus today is the **Gmail inbound → classify → extract → draft → approve** loop.

---

## 2. Feature status

### Live / core (shipping or actively built)

| Area | Capability | Notes |
|------|------------|--------|
| Auth | Sign in / continue with Google | Auth placeholder on frontend; Google OAuth on backend |
| Gmail | Connect one or more Gmail accounts | Integration + inbound processing |
| Gmail | Automatic classification | Categories / intents for routing |
| Gmail | Extraction → notes & reminders | Key details pulled from emails |
| Gmail | AI reply drafts | Multi-round draft loop |
| Gmail | Human approval before send | Approve / edit-with-AI / reject — unlimited edit rounds |
| Docs (knowledge base) | Upload business docs (pricing, FAQ, policies) | Grounds replies in *your* information |
| Security | Encrypted access tokens; disconnect anytime | Attachments scanned before open (product claim) |
| Marketing site | Landing page + interactive source→workspace viz | Static; no API calls on load |

### Coming soon (product vision on the landing page)

| Source / feature | Intended value |
|------------------|----------------|
| Google Calendar | Schedule context; what’s next |
| Google Meet | Recording → notes, action items, Q&A |
| WhatsApp | Client/message context for founders |
| Instagram | DMs / social message context for creators |
| YouTube | Comment insights, draft replies, takeaways |
| Microsoft Teams | Team chat context |
| Outlook | Email provider expansion (FAQ) |
| Pricing | Plans / billing (“Pricing coming soon”) |

### Claimed on marketing; treat as near-term product surface

These appear on the Features / Security sections and should be treated as **product commitments** even if not all UI is finished:

- Chat assistant (search emails, notes, documents; help book meetings)
- Attention dashboard (drafts, reminders, items needing a decision)
- Safe attachments (scanned before open)
- Workspace Agent with full connected context

---

## 3. Primary use cases

### UC-1 — Clear the inbox without losing control
**Who:** Solo founder / SMB owner drowning in mail.  
**Flow:** Connect Gmail → AI classifies and drafts → user reviews → Send / Edit with AI / Reject.  
**Outcome:** Faster replies, zero accidental auto-send.

### UC-2 — Accurate replies from your own business info
**Who:** Anyone quoting prices, policies, or FAQs.  
**Flow:** Upload pricing/FAQ/policy docs → drafts use that knowledge → user approves.  
**Outcome:** Fewer wrong answers; less copy-paste from old threads.

### UC-3 — Never miss extracted follow-ups
**Who:** Operators who forget promises buried in long emails.  
**Flow:** Extraction creates notes/reminders → dashboard surfaces what needs attention.  
**Outcome:** Follow-ups and commitments stay visible.

### UC-4 — Multi-inbox operator
**Who:** Freelancer managing personal + business Gmail.  
**Flow:** Connect multiple Gmail accounts → one review surface.  
**Outcome:** One workflow across inboxes.

### UC-5 — Creator / influencer (coming soon)
**Who:** Creators on Instagram / YouTube.  
**Flow:** Connect social → summarize messages/comments → draft replies → approve.  
**Outcome:** Social inbox becomes manageable without living in each app.

### UC-6 — Meeting-to-action (coming soon)
**Who:** Founders in back-to-back calls.  
**Flow:** Meet recording → notes + action items → calendar-aware follow-ups.  
**Outcome:** Meetings turn into tracked work, not forgotten context.

### UC-7 — Ask the workspace (agent)
**Who:** Anyone who can’t find “what did Rahul ask about pricing?”  
**Flow:** Chat over emails, notes, and docs → grounded answer or draft.  
**Outcome:** Search + act in one place.

---

## 4. End-to-end loop (Gmail — current spine)

```text
Gmail notification
  → fetch / process email
  → classify
  → extract notes/reminders (if needed)
  → draft reply (if needs reply)
  → wait for human decision (approve / edit / reject)
  → optional more draft rounds
  → send only after approval
```

**Non-negotiable rule:** AI never sends without user approval.

---

## 5. What to add next for productivity (recommendations)

Prioritize work that shortens time-to-done and reduces context switching.

### P0 — Make the Gmail loop “daily driver”
1. **Polished review UI** — inbox list, draft panel, Edit with AI, approve/reject (match landing mockups).
2. **Attention dashboard** — counts + queues: drafts to review, reminders today, failed/blocked items.
3. **Reliable send path** — approved draft → Gmail send + status sync.
4. **Docs RAG quality** — upload, chunk, retrieve into drafts; show “used sources” on a draft.
5. **Notifications** — email/push when a draft needs review (so the wait loop doesn’t stall).

### P1 — Agent that actually saves time
6. **Chat over mail + notes + docs** — citations back to the email/doc.
7. **Meeting booking assist** — propose slots once Calendar is connected (can stub UI now).
8. **Templates / tone profiles** — “formal”, “short”, “founder voice” as one-click edit instructions.
9. **Bulk triage** — archive/snooze/label suggestions with one-click confirm.

### P2 — Expand sources (after Gmail is sticky)
10. **Calendar** — conflict awareness + “reply with availability”.
11. **Meet notes** — action items into reminders; Q&A over the transcript.
12. **WhatsApp / Instagram / YouTube** — same approve-before-send pattern as email.
13. **Outlook** — broaden TAM for SMB.

### P3 — Trust, retention, monetization
14. **Audit trail** — who approved what, when; draft history.
15. **Team seats later** — shared knowledge base; still per-user send approval.
16. **Pricing & plans** — freemium with draft caps; pro for multi-account + agent.
17. **Analytics (private)** — time saved, drafts approved, edit rounds — *internal only*, not vanity marketing stats.

---

## 6. Suggested MVP definition of done

A user can:

1. Sign in with Google and connect Gmail.  
2. Receive a new email that is classified and (if needed) drafted.  
3. Open a dashboard item, edit with AI, approve, and see it send.  
4. Upload a pricing PDF and see the draft reflect that pricing.  
5. Disconnect Gmail and stop sync.  

Until those five work reliably, new channels should stay “coming soon.”

---

## 7. Audience & messaging guardrails

**Audience:** Solo entrepreneurs, SMB owners, freelancers, creators.  
**Promise:** Clear your inbox (and later channels) **without losing control**.  
**Do not claim:** Auto-send, invented user counts, logos, awards, or integrations that are not listed above.

---

## 8. Related code (for implementers)

| Area | Location |
|------|----------|
| Landing / marketing | `frontend/src/components/landing/` |
| Source vision (live vs coming soon) | `frontend/src/components/landing/data-flow/sources.ts` |
| Gmail inbound pipeline | `backend/src/inngest/Functions/gmail-inbound.ts` |
| Draft / extract AI | `backend/src/aiSuperimo/` |
| Gmail integration | `backend/src/modules/integrations/provider/gmail/` |
| Mail API | `backend/src/modules/mail/` |

---

*Last updated: product snapshot from current landing + backend Gmail spine. Update this file when a connector flips from coming soon → live.*
