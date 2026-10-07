import { AnimatePresence, motion } from "framer-motion"

import { Badge } from "@/shared/components/ui/badge"

import type { SourceNode } from "./types"

type SourceDescriptionProps = {
  source: SourceNode | null
}

export function SourceDescription({ source }: SourceDescriptionProps) {
  return (
    <div className="relative mx-auto flex min-h-[5.5rem] w-full max-w-sm items-center justify-center px-2">
      <AnimatePresence mode="wait">
        {source ? (
          <motion.div
            key={source.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="w-full rounded-xl border bg-card/90 px-4 py-3 text-center shadow-sm backdrop-blur-sm"
          >
            <div className="mb-1.5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm font-semibold">{source.label}</span>
              {source.status === "coming-soon" ? (
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                  Coming soon
                </Badge>
              ) : (
                <Badge className="h-4 px-1.5 text-[10px]">Live</Badge>
              )}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {source.description}
            </p>
          </motion.div>
        ) : (
          <motion.p
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-xs text-muted-foreground sm:text-sm"
          >
            Hover a source to see what it unlocks
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
