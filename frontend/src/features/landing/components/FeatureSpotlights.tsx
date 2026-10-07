import type { ReactNode } from "react"

import { ApprovalFlowMockup } from "./mockups/ApprovalFlowMockup"
import { DashboardMockup } from "./mockups/DashboardMockup"
import { DocumentsMockup } from "./mockups/DocumentsMockup"

const spotlights: {
  title: string
  description: string
  mockup: ReactNode
  reverse?: boolean
}[] = [
  {
    title: "Approve every reply — or edit with AI",
    description:
      "Review the draft, ask for changes like “make it formal, add pricing,” or reject it. Unlimited edit rounds, and nothing sends without your approval.",
    mockup: <ApprovalFlowMockup />,
  },
  {
    title: "Teach replies with your own documents",
    description:
      "Upload pricing sheets, FAQs, and policies. Workspace uses them so drafts reflect how your business actually works.",
    mockup: <DocumentsMockup />,
    reverse: true,
  },
  {
    title: "A dashboard for what needs you",
    description:
      "See drafts waiting for review, reminders for today, and other items that need a decision — without digging through your inbox.",
    mockup: <DashboardMockup />,
  },
]

export function FeatureSpotlights() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 sm:px-6">
        {spotlights.map((item) => (
          <div
            key={item.title}
            className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12"
          >
            <div className={item.reverse ? "lg:order-2" : undefined}>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {item.title}
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                {item.description}
              </p>
            </div>
            <div className={item.reverse ? "lg:order-1" : undefined}>
              {item.mockup}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
