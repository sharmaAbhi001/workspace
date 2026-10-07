import { GmailIcon } from "@/shared/components/icons/BrandIcons"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Separator } from "@/shared/components/ui/separator"

export function InboxDraftMockup() {
  return (
    <Card
      className="shadow-sm"
      aria-label="Product mockup of inbox and AI reply draft"
    >
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GmailIcon className="size-5" />
            <CardTitle className="text-sm">Inbox</CardTitle>
          </div>
          <Badge variant="secondary">Needs review</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 pt-1 md:grid-cols-2">
        <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
          <div className="flex items-center gap-1.5">
            <GmailIcon className="size-3.5" />
            <p className="text-xs font-medium text-muted-foreground">From</p>
          </div>
          <p className="text-sm font-semibold">Rahul Sharma</p>
          <p className="text-sm text-foreground">Pricing for 10 seats</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Hi — could you share pricing for 10 seats and whether onboarding is
            included this quarter?
          </p>
        </div>

        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              AI draft reply
            </p>
            <Badge>Awaiting approval</Badge>
          </div>
          <p className="text-sm leading-relaxed text-foreground">
            Hi Rahul, thanks for reaching out. For 10 seats, our team plan is
            $49/user/month and includes onboarding. Happy to send a quote or
            book a quick call.
          </p>
          <Separator />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" tabIndex={-1}>
              Send
            </Button>
            <Button type="button" size="sm" variant="outline" tabIndex={-1}>
              Edit with AI
            </Button>
            <Button type="button" size="sm" variant="ghost" tabIndex={-1}>
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
