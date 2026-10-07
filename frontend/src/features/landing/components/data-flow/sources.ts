import {
  GmailIcon,
  GoogleCalendarIcon,
  GoogleDocsIcon,
  GoogleMeetIcon,
  InstagramIcon,
  TeamsIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "@/shared/components/icons/BrandIcons"

import type { SourceNode } from "./types"

export const SOURCE_NODES: SourceNode[] = [
  {
    id: "gmail",
    label: "Gmail",
    status: "live",
    description:
      "Extraction, classification, and reply drafts — nothing sends until you approve.",
    icon: GmailIcon,
    accentBg: "bg-white dark:bg-card",
    accentText: "text-red-600 dark:text-red-300",
    accentRing: "ring-red-500/30",
    pathColor: "stroke-red-500/50 dark:stroke-red-400/50",
  },
  {
    id: "docs",
    label: "Docs",
    status: "live",
    description:
      "Summarization and extraction so replies use your pricing, FAQ, and policies.",
    icon: GoogleDocsIcon,
    accentBg: "bg-white dark:bg-card",
    accentText: "text-sky-700 dark:text-sky-300",
    accentRing: "ring-sky-500/30",
    pathColor: "stroke-sky-500/50 dark:stroke-sky-400/50",
  },
  {
    id: "calendar",
    label: "Calendar",
    status: "coming-soon",
    description:
      "Meetings and schedule context so your workspace agent knows what’s next.",
    icon: GoogleCalendarIcon,
    accentBg: "bg-white dark:bg-card",
    accentText: "text-amber-700 dark:text-amber-300",
    accentRing: "ring-amber-500/30",
    pathColor: "stroke-amber-500/50 dark:stroke-amber-400/50",
  },
  {
    id: "meet",
    label: "Meet",
    status: "coming-soon",
    description:
      "Recordings become notes, action items, and future Q&A from the conversation.",
    icon: GoogleMeetIcon,
    accentBg: "bg-white dark:bg-card",
    accentText: "text-emerald-700 dark:text-emerald-300",
    accentRing: "ring-emerald-500/30",
    pathColor: "stroke-emerald-500/50 dark:stroke-emerald-400/50",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    status: "coming-soon",
    description:
      "Message context for solo founders — keep client chats in your workspace.",
    icon: WhatsAppIcon,
    accentBg: "bg-white dark:bg-card",
    accentText: "text-green-700 dark:text-green-300",
    accentRing: "ring-green-500/30",
    pathColor: "stroke-green-500/50 dark:stroke-green-400/50",
  },
  {
    id: "instagram",
    label: "Instagram",
    status: "coming-soon",
    description:
      "DM and message context for creators running social workflows from one place.",
    icon: InstagramIcon,
    accentBg: "bg-white dark:bg-card",
    accentText: "text-pink-700 dark:text-pink-300",
    accentRing: "ring-pink-500/30",
    pathColor: "stroke-pink-500/50 dark:stroke-pink-400/50",
  },
  {
    id: "youtube",
    label: "YouTube",
    status: "coming-soon",
    description:
      "Channel comments become insights, draft replies, and content takeaways.",
    icon: YouTubeIcon,
    accentBg: "bg-white dark:bg-card",
    accentText: "text-rose-700 dark:text-rose-300",
    accentRing: "ring-rose-500/30",
    pathColor: "stroke-rose-500/50 dark:stroke-rose-400/50",
  },
  {
    id: "teams",
    label: "Teams",
    status: "coming-soon",
    description:
      "Team chat context alongside your other channels for one productive workspace.",
    icon: TeamsIcon,
    accentBg: "bg-white dark:bg-card",
    accentText: "text-indigo-700 dark:text-indigo-300",
    accentRing: "ring-indigo-500/30",
    pathColor: "stroke-indigo-500/50 dark:stroke-indigo-400/50",
  },
]
