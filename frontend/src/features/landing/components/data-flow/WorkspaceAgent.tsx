import { motion } from "framer-motion"
import { Bot, Brain } from "lucide-react"

import { Badge } from "@/shared/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"

export function WorkspaceAgent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <Card className="relative overflow-hidden shadow-sm ring-1 ring-primary/15">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/10 blur-2xl"
        />
        <CardHeader className="relative pb-2">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Bot className="size-5" aria-hidden />
            </span>
            <Badge variant="secondary" className="gap-1">
              <Brain className="size-3" aria-hidden />
              Full workspace context
            </Badge>
          </div>
          <CardTitle className="text-xl sm:text-2xl">Workspace Agent</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Once your sources connect, the agent sees the full picture — mail,
            docs, meetings, and social context — so it can draft replies, extract
            notes, and help you act faster without losing control.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            <li className="rounded-lg border bg-muted/40 px-3 py-2">
              Answers from your connected data
            </li>
            <li className="rounded-lg border bg-muted/40 px-3 py-2">
              Drafts grounded in your documents
            </li>
            <li className="rounded-lg border bg-muted/40 px-3 py-2">
              Notes and follow-ups you can approve
            </li>
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  )
}
