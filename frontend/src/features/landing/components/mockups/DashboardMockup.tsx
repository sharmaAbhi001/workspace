import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"

const stats = [
  { label: "Drafts to review", value: "3" },
  { label: "Reminders today", value: "2" },
  { label: "Notes extracted", value: "5" },
]

const attention = [
  "Reply to Rahul Sharma — Pricing for 10 seats",
  "Reminder: send quote to Priya Mehta",
  "Attachment scanned — Contract-v2.pdf",
]

export function DashboardMockup() {
  return (
    <Card
      className="shadow-sm"
      aria-label="Product mockup of attention dashboard"
    >
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-sm">Needs your attention</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border bg-muted/40 p-3 text-center"
            >
              <p className="text-xl font-semibold text-primary">{stat.value}</p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
        <ul className="space-y-2">
          {attention.map((item) => (
            <li
              key={item}
              className="rounded-lg border px-3 py-2 text-sm text-foreground"
            >
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
