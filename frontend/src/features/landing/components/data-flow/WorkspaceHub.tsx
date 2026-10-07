import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import type { CSSProperties, RefObject } from "react"

import { cn } from "@/shared/lib/utils"

type WorkspaceHubProps = {
  pulseKey: number
  className?: string
  style?: CSSProperties
  hubRef: RefObject<HTMLDivElement | null>
}

export function WorkspaceHub({
  pulseKey,
  className,
  style,
  hubRef,
}: WorkspaceHubProps) {
  return (
    <div
      ref={hubRef}
      className={cn("absolute z-10 -translate-x-1/2 -translate-y-1/2", className)}
      style={style}
    >
      <div className="relative">
        {/* Ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-6 rounded-3xl bg-primary/20 blur-2xl dark:bg-primary/30"
        />

        {/* Ripple rings on particle impact */}
        <motion.div
          key={`ripple-a-${pulseKey}`}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-primary/40"
          initial={{ scale: 1, opacity: 0.45 }}
          animate={{ scale: 1.35, opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
        <motion.div
          key={`ripple-b-${pulseKey}`}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/25"
          initial={{ scale: 1, opacity: 0.3 }}
          animate={{ scale: 1.55, opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.05 }}
        />

        <motion.div
          className="relative flex min-w-[168px] items-center gap-3 rounded-2xl border bg-card px-4 py-3.5 shadow-md ring-1 ring-primary/15 sm:min-w-[190px]"
          animate={
            pulseKey > 0 ? { scale: [1, 1.045, 1] } : { scale: 1 }
          }
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight">Your Workspace</p>
            <p className="text-xs text-muted-foreground">Collecting your context</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
