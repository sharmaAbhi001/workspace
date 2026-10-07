import { Link2, ListChecks, Send, Sparkles } from "lucide-react"

import { WorkspaceDataFlow } from "./WorkspaceDataFlow"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"

const steps = [
  {
    icon: Link2,
    title: "Connect Gmail",
    description: "Link one or more Gmail accounts in a few clicks.",
  },
  {
    icon: Sparkles,
    title: "AI sorts and summarizes",
    description:
      "New emails are classified and key details become notes and reminders.",
  },
  {
    icon: ListChecks,
    title: "Review the draft",
    description: "Edit the reply, ask the AI for changes, or reject it.",
  },
  {
    icon: Send,
    title: "Send with one click",
    description: "Nothing goes out until you approve.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
          <p className="mt-3 text-muted-foreground">
            From inbox to approved reply in four simple steps.
          </p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title}>
              <Card className="h-full shadow-sm">
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="size-5" aria-hidden />
                  </div>
                  <CardTitle>
                    <span className="mr-2 text-muted-foreground">
                      {index + 1}.
                    </span>
                    {step.title}
                  </CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ol>

        <WorkspaceDataFlow />
      </div>
    </section>
  )
}
