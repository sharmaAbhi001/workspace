import { FileText, Upload } from "lucide-react"

import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"

const docs = [
  { name: "Pricing sheet.pdf", status: "Ready" },
  { name: "FAQ-2026.docx", status: "Ready" },
  { name: "Refund policy.pdf", status: "Scanning" },
]

export function DocumentsMockup() {
  return (
    <Card
      className="shadow-sm"
      aria-label="Product mockup of business documents upload"
    >
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">Knowledge base</CardTitle>
          <Button type="button" size="sm" variant="outline" tabIndex={-1}>
            <Upload />
            Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Upload pricing, FAQ, and policies so replies use your information.
        </p>
        <ul className="space-y-2">
          {docs.map((doc) => (
            <li
              key={doc.name}
              className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="size-4 shrink-0 text-primary" aria-hidden />
                <span className="truncate text-sm">{doc.name}</span>
              </div>
              <Badge
                variant={doc.status === "Ready" ? "secondary" : "outline"}
              >
                {doc.status}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
