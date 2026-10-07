import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"

export function ApprovalFlowMockup() {
  return (
    <Card
      className="shadow-sm"
      aria-label="Product mockup of draft approval and edit with AI"
    >
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">Review draft</CardTitle>
          <Badge variant="secondary">Round 2</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Your instruction
          </p>
          <p className="text-sm">Make it formal, add pricing for 10 seats.</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Updated draft
          </p>
          <p className="text-sm leading-relaxed">
            Dear Rahul, thank you for your inquiry. For a team of 10 seats, the
            annual plan is $490/month and includes onboarding support. Please
            let me know if you would like a formal quote.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" tabIndex={-1}>
            Approve &amp; send
          </Button>
          <Button type="button" size="sm" variant="outline" tabIndex={-1}>
            Edit with AI
          </Button>
          <Button type="button" size="sm" variant="ghost" tabIndex={-1}>
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
