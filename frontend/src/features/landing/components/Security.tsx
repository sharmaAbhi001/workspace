import { Check } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"

const points = [
  "The AI never sends an email without your approval",
  "You can disconnect Gmail anytime",
  "Access tokens are encrypted",
  "Attachments are scanned before you can open them",
]

export function Security() {
  return (
    <section id="security" className="scroll-mt-20 border-y bg-muted/30 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Card className="shadow-sm">
          <CardHeader className="max-w-2xl">
            <CardTitle className="text-2xl sm:text-3xl">
              Security and privacy
            </CardTitle>
            <p className="text-muted-foreground">
              Built so you stay in control of your mail and your data.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="grid gap-3 sm:grid-cols-2">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <a
              href="#"
              className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Privacy Policy
            </a>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
