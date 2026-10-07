import { prisma } from "../../config/database/client.js";
import type {
  EmailExtraction,
  MeetingExtraction,
  NoteExtraction,
  ReminderExtraction,
} from "./schemas.js";

export type SaveExtractionsInput = {
  userId: string;
  emailId: string;
  extraction: EmailExtraction;
};

export type SaveExtractionsResult = {
  notesCreated: number;
  remindersCreated: number;
  meetingsCreated: number;
  meetingsDowngradedToReminder: number;
  meetingsDowngradedToNote: number;
};

function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!hasText(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isCompleteMeeting(meeting: MeetingExtraction): boolean {
  return (
    hasText(meeting.title) &&
    hasText(meeting.attendeeEmail) &&
    hasText(meeting.timezone) &&
    hasText(meeting.meetingLink) &&
    parseDate(meeting.startTime) !== null &&
    parseDate(meeting.endTime) !== null
  );
}

function meetingToReminder(meeting: MeetingExtraction): ReminderExtraction | null {
  const date =
    parseDate(meeting.startTime) ?? parseDate(meeting.endTime);
  if (!date || !hasText(meeting.title)) return null;

  const descriptionParts = [
    meeting.description,
    meeting.attendeeEmail ? `Attendee: ${meeting.attendeeEmail}` : null,
    meeting.meetingLink ? `Link: ${meeting.meetingLink}` : null,
  ].filter(hasText);

  return {
    title: meeting.title,
    description: descriptionParts.length > 0 ? descriptionParts.join("\n") : null,
    date: date.toISOString(),
  };
}

function meetingToNote(meeting: MeetingExtraction): NoteExtraction {
  const contentParts = [
    meeting.description,
    meeting.attendeeName ? `Attendee: ${meeting.attendeeName}` : null,
    meeting.attendeeEmail ? `Email: ${meeting.attendeeEmail}` : null,
    meeting.timezone ? `Timezone: ${meeting.timezone}` : null,
    meeting.meetingLink ? `Link: ${meeting.meetingLink}` : null,
    meeting.startTime ? `Start: ${meeting.startTime}` : null,
    meeting.endTime ? `End: ${meeting.endTime}` : null,
  ].filter(hasText);

  return {
    title: hasText(meeting.title) ? meeting.title : "Meeting details",
    content:
      contentParts.length > 0
        ? contentParts.join("\n")
        : "Meeting mentioned in email (incomplete details).",
  };
}

/**
 * Persists AI extraction results. Incomplete meetings become reminders (if timed)
 * or notes (otherwise).
 */
export async function saveEmailExtractions(
  input: SaveExtractionsInput
): Promise<SaveExtractionsResult> {
  const { userId, emailId, extraction } = input;

  const notes: NoteExtraction[] = [...extraction.notes];
  const reminders: ReminderExtraction[] = [...extraction.reminders];
  const completeMeetings: MeetingExtraction[] = [];

  let meetingsDowngradedToReminder = 0;
  let meetingsDowngradedToNote = 0;

  for (const meeting of extraction.meetings) {
    if (isCompleteMeeting(meeting)) {
      completeMeetings.push(meeting);
      continue;
    }

    const reminder = meetingToReminder(meeting);
    if (reminder) {
      reminders.push(reminder);
      meetingsDowngradedToReminder += 1;
    } else {
      notes.push(meetingToNote(meeting));
      meetingsDowngradedToNote += 1;
    }
  }

  await prisma.$transaction(async (tx) => {
    if (notes.length > 0) {
      await tx.note.createMany({
        data: notes.map((note) => ({
          userId,
          emailId,
          title: note.title,
          content: note.content,
        })),
      });
    }

    if (reminders.length > 0) {
      await tx.reminder.createMany({
        data: reminders.map((reminder) => ({
          userId,
          emailId,
          title: reminder.title,
          description: reminder.description,
          date: parseDate(reminder.date) ?? new Date(),
          createdByAI: true,
        })),
      });
    }

    if (completeMeetings.length > 0) {
      await tx.meeting.createMany({
        data: completeMeetings.map((meeting) => ({
          userId,
          emailId,
          createdByAI: true,
          attendeeEmail: meeting.attendeeEmail!,
          attendeeName: meeting.attendeeName,
          title: meeting.title,
          description: meeting.description,
          timezone: meeting.timezone!,
          meetingLink: meeting.meetingLink!,
          startTime: parseDate(meeting.startTime)!,
          endTime: parseDate(meeting.endTime)!,
          status: "SCHEDULED",
        })),
      });
    }
  });

  return {
    notesCreated: notes.length,
    remindersCreated: reminders.length,
    meetingsCreated: completeMeetings.length,
    meetingsDowngradedToReminder,
    meetingsDowngradedToNote,
  };
}
