import { CheckCircle2, FileText, Inbox, Sparkles } from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"

const attentionItems = [
  {
    title: "Drafts awaiting approval",
    description: "Review AI replies before anything is sent.",
    icon: Inbox,
    meta: "Coming online with Gmail",
  },
  {
    title: "Reminders & follow-ups",
    description: "Commitments extracted from your inbox will show up here.",
    icon: CheckCircle2,
    meta: "Synced from email",
  },
  {
    title: "Knowledge base",
    description: "Upload pricing, FAQs, and policies to ground drafts.",
    icon: FileText,
    meta: "Documents",
  },
]

export function DashboardPage() {
  const { user } = useAuth()
  const firstName = user?.name?.split(" ")[0] ?? "there"

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section className="space-y-2">
        <p className="text-sm font-medium text-primary">Dashboard</p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          Welcome back, {firstName}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Your attention board for drafts, reminders, and workspace context.
          Connect sources and approve every send — nothing goes out without you.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Pending drafts", value: "—" },
          { label: "Open reminders", value: "—" },
          { label: "Connected sources", value: "0" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border/80 bg-card/40 px-4 py-4"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Needs attention</h2>
        </div>

        <ul className="divide-y divide-border rounded-xl border border-border/80">
          {attentionItems.map((item) => (
            <li
              key={item.title}
              className="flex items-start gap-3 px-4 py-4 sm:items-center"
            >
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <span className="hidden text-xs text-muted-foreground sm:block">
                {item.meta}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
