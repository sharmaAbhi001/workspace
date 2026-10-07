import { motion } from "framer-motion"
import type { CSSProperties } from "react"

import { cn } from "@/shared/lib/utils"

import type { SourceNode } from "./types"

type SourceBadgeProps = {
  source: SourceNode
  floatAmplitude: number
  floatDuration: number
  floatDelay: number
  active: boolean
  dimmed: boolean
  onActivate: () => void
  onDeactivate: () => void
  style: CSSProperties
}

export function SourceBadge({
  source,
  floatAmplitude,
  floatDuration,
  floatDelay,
  active,
  dimmed,
  onActivate,
  onDeactivate,
  style,
}: SourceBadgeProps) {
  const Icon = source.icon

  return (
    <div
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200",
        active ? "z-30" : "z-20",
        dimmed && "opacity-40"
      )}
      style={style}
    >
      <motion.div
        className="relative size-12 sm:size-[3.25rem]"
        animate={{ y: [-floatAmplitude, floatAmplitude, -floatAmplitude] }}
        transition={{
          duration: floatDuration,
          delay: floatDelay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <button
          type="button"
          className="relative block size-full rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={`${source.label}${source.status === "coming-soon" ? ", coming soon" : ""}`}
          onMouseEnter={onActivate}
          onMouseLeave={onDeactivate}
          onFocus={onActivate}
          onBlur={onDeactivate}
          onClick={() => {
            if (
              window.matchMedia("(hover: hover) and (pointer: fine)").matches
            ) {
              return
            }
            if (active) onDeactivate()
            else onActivate()
          }}
        >
          <motion.span
            className={cn(
              "flex size-full items-center justify-center rounded-full border bg-card shadow-sm ring-1 transition-shadow",
              source.accentRing,
              active && "shadow-md ring-2"
            )}
            animate={{ scale: active ? 1.08 : 1 }}
            transition={{ type: "spring", stiffness: 340, damping: 24 }}
          >
            <Icon className="size-6 sm:size-7" />
          </motion.span>

          {/* Label under icon — solid fill so paths never show through */}
          <span className="pointer-events-none absolute top-[calc(100%+6px)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-background px-1.5 py-0.5 text-center text-[10px] font-medium text-muted-foreground sm:text-[11px]">
            {source.label}
          </span>
        </button>
      </motion.div>
    </div>
  )
}
