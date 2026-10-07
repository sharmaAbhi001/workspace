import { z } from "zod";

export const noteExtractionSchema = z.object({
  title: z.string().describe("Short note title"),
  content: z.string().describe("Note body with the lasting information"),
});

export const reminderExtractionSchema = z.object({
  title: z.string().describe("Short reminder title"),
  description: z
    .string()
    .nullable()
    .describe("Optional reminder details"),
  date: z
    .string()
    .describe("ISO-8601 datetime when the reminder is due"),
});

/**
 * Meeting candidates may be incomplete. Save step creates a Meeting only when
 * required fields are present; otherwise it falls back to Reminder or Note.
 */
export const meetingExtractionSchema = z.object({
  title: z.string().describe("Meeting title"),
  description: z.string().nullable().describe("Optional meeting agenda/details"),
  attendeeEmail: z
    .string()
    .nullable()
    .describe("Primary attendee email if known"),
  attendeeName: z.string().nullable().describe("Primary attendee name if known"),
  timezone: z
    .string()
    .nullable()
    .describe("IANA timezone, e.g. Asia/Kolkata"),
  meetingLink: z
    .string()
    .nullable()
    .describe("Video call / meeting URL if present"),
  startTime: z
    .string()
    .nullable()
    .describe("ISO-8601 meeting start time if known"),
  endTime: z
    .string()
    .nullable()
    .describe("ISO-8601 meeting end time if known"),
});

export const emailExtractionSchema = z.object({
  notes: z.array(noteExtractionSchema),
  reminders: z.array(reminderExtractionSchema),
  meetings: z.array(meetingExtractionSchema),
});

export type NoteExtraction = z.infer<typeof noteExtractionSchema>;
export type ReminderExtraction = z.infer<typeof reminderExtractionSchema>;
export type MeetingExtraction = z.infer<typeof meetingExtractionSchema>;
export type EmailExtraction = z.infer<typeof emailExtractionSchema>;
