import { motion } from "framer-motion"

import { cn } from "@/shared/lib/utils"

import type { ConnectionLayout, SourceId, SourceNode } from "./types"

type ConnectionPathsProps = {
  connections: ConnectionLayout[]
  sourcesById: Record<SourceId, SourceNode>
  activeId: SourceId | null
  width: number
  height: number
}

export function ConnectionPaths({
  connections,
  sourcesById,
  activeId,
  width,
  height,
}: ConnectionPathsProps) {
  if (width === 0 || height === 0) return null

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
    >
      {connections.map((conn) => {
        const source = sourcesById[conn.id]
        const isActive = activeId === conn.id
        const dimmed = activeId !== null && !isActive

        return (
          <g key={conn.id}>
            <motion.path
              d={conn.pathD}
              fill="none"
              className={cn(source.pathColor)}
              strokeWidth={isActive ? 2 : 1.25}
              strokeLinecap="round"
              initial={false}
              animate={{
                opacity: dimmed ? 0.12 : isActive ? 0.85 : 0.35,
              }}
              transition={{ duration: 0.2 }}
            />
            <motion.path
              d={conn.pathD}
              fill="none"
              className={cn(source.pathColor)}
              strokeWidth={isActive ? 1.75 : 1}
              strokeLinecap="round"
              strokeDasharray="5 9"
              initial={false}
              animate={{
                opacity: dimmed ? 0.08 : isActive ? 0.7 : 0.28,
                strokeDashoffset: [0, -56],
              }}
              transition={{
                opacity: { duration: 0.2 },
                strokeDashoffset: {
                  duration: isActive ? 1 : 2.4,
                  ease: "linear",
                  repeat: Infinity,
                },
              }}
            />
          </g>
        )
      })}
    </svg>
  )
}
