import {
  Bell,
  FileStack,
  LayoutDashboard,
  Mail,
  MessageSquare,
  NotebookPen,
  Paperclip,
  ShieldCheck,
  Tags,
} from "lucide-react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"

const features = [
  {
    icon: Mail,
    title: "Multiple Gmail accounts",
    description: "Connect every inbox you manage in one place.",
  },
  {
    icon: Tags,
    title: "Automatic email classification",
    description: "Incoming mail is sorted so you see what matters first.",
  },
  {
    icon: NotebookPen,
    title: "Notes and reminders",
    description: "Key details are extracted into notes and reminders for you.",
  },
  {
    icon: MessageSquare,
    title: "AI reply drafts",
    description: "Get a ready-to-review reply drafted from the email context.",
  },
  {
    icon: ShieldCheck,
    title: "Human approval before every send",
    description:
      "Nothing is sent until you approve — with unlimited edit rounds.",
  },
  {
    icon: FileStack,
    title: "Your documents as a knowledge base",
    description: "Upload pricing, FAQ, and policies so replies stay accurate.",
  },
  {
    icon: Paperclip,
    title: "Safe attachments",
    description: "Attachments are scanned before you can open them.",
  },
  {
    icon: Bell,
    title: "Chat assistant",
    description:
      "Search emails, notes, and documents — and get help booking meetings.",
  },
  {
    icon: LayoutDashboard,
    title: "Attention dashboard",
    description: "See drafts, reminders, and items that need your decision.",
  },
]

export function FeaturesGrid() {
  return (
    <section id="features" className="scroll-mt-20 border-y bg-muted/30 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Features</h2>
          <p className="mt-3 text-muted-foreground">
            Everything you need to stay on top of email — with you in control.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {features.map((feature) => (
            <Card key={feature.title} className="h-full shadow-sm">
              <CardHeader>
                <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="size-4" aria-hidden />
                </div>
                <CardTitle className="text-sm sm:text-base">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
