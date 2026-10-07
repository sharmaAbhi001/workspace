import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { cn } from "@/shared/lib/utils"

import { ConnectionPaths } from "./ConnectionPaths"
import {
  getBadgeAnchors,
  layoutConnections,
  type LayoutMode,
} from "./pathUtils"
import { ParticleStream } from "./ParticleStream"
import { SOURCE_NODES } from "./sources"
import { SourceBadge } from "./SourceBadge"
import { SourceDescription } from "./SourceDescription"
import type { ConnectionLayout, Point, SourceId } from "./types"
import { WorkspaceHub } from "./WorkspaceHub"

/** mobile < 768, tablet 768–1023, desktop ≥ 1024 */
function useLayoutMode(): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>(() => {
    if (typeof window === "undefined") return "mobile"
    const w = window.innerWidth
    if (w < 768) return "mobile"
    if (w < 1024) return "tablet"
    return "desktop"
  })

  useEffect(() => {
    const mobileMq = window.matchMedia("(max-width: 767px)")
    const tabletMq = window.matchMedia(
      "(min-width: 768px) and (max-width: 1023px)"
    )
    const onChange = () => {
      if (mobileMq.matches) setMode("mobile")
      else if (tabletMq.matches) setMode("tablet")
      else setMode("desktop")
    }
    onChange()
    mobileMq.addEventListener("change", onChange)
    tabletMq.addEventListener("change", onChange)
    return () => {
      mobileMq.removeEventListener("change", onChange)
      tabletMq.removeEventListener("change", onChange)
    }
  }, [])

  return mode
}

type DataFlowCanvasProps = {
  variant?: "default" | "hero"
  className?: string
}

export function DataFlowCanvas({
  variant = "default",
  className,
}: DataFlowCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const hubRef = useRef<HTMLDivElement>(null)

  const [size, setSize] = useState({ width: 0, height: 0 })
  const [connections, setConnections] = useState<ConnectionLayout[]>([])
  const [activeId, setActiveId] = useState<SourceId | null>(null)
  const [pulseKey, setPulseKey] = useState(0)

  const layoutMode = useLayoutMode()
  const isCompact = layoutMode === "mobile"
  const isHero = variant === "hero"
  const particleCount = isHero ? (isCompact ? 6 : 10) : isCompact ? 8 : 14

  const sourcesById = useMemo(
    () =>
      Object.fromEntries(SOURCE_NODES.map((s) => [s.id, s])) as Record<
        SourceId,
        (typeof SOURCE_NODES)[number]
      >,
    []
  )

  const activeSource = activeId ? sourcesById[activeId] : null

  const anchors = useMemo(
    () => getBadgeAnchors(SOURCE_NODES.length, layoutMode),
    [layoutMode]
  )

  // Hub sits lower; description panel sits in the gap above it
  const hubAnchor = useMemo(
    () => (isCompact ? { x: 0.5, y: 0.9 } : { x: 0.5, y: 0.92 }),
    [isCompact]
  )

  const floatParams = useMemo(
    () =>
      SOURCE_NODES.map((_, i) => ({
        amplitude: 1.5,
        duration: 4 + (i % 4) * 0.4,
        delay: i * 0.4,
      })),
    []
  )

  const measure = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    if (width === 0 || height === 0) return

    setSize({ width, height })

    const badgeCenters = {} as Record<SourceId, Point>
    SOURCE_NODES.forEach((source, index) => {
      const anchor = anchors[index]!
      badgeCenters[source.id] = {
        x: anchor.x * width,
        y: anchor.y * height,
      }
    })

    let hubCenter: Point = {
      x: hubAnchor.x * width,
      y: hubAnchor.y * height,
    }

    if (hubRef.current) {
      const h = hubRef.current.getBoundingClientRect()
      hubCenter = {
        x: h.left - rect.left + h.width / 2,
        y: h.top - rect.top + 6,
      }
    }

    const iconRadius = isCompact ? 22 : 26
    setConnections(layoutConnections(badgeCenters, hubCenter, iconRadius))
  }, [anchors, hubAnchor, isCompact])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    measure()
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(measure)
    })
    ro.observe(container)
    window.addEventListener("resize", measure)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [measure])

  useEffect(() => {
    const id = window.setTimeout(measure, 80)
    return () => window.clearTimeout(id)
  }, [measure, isCompact])

  const onParticleArrive = useCallback(() => {
    setPulseKey((k) => k + 1)
  }, [])

  return (
    <div
      className={cn("relative w-full", className)}
      onMouseLeave={() => setActiveId(null)}
    >
      <div
        ref={containerRef}
        className={cn(
          "relative w-full overflow-visible",
          !isHero &&
            "rounded-2xl border bg-gradient-to-b from-muted/40 via-background to-background p-3 sm:p-5"
        )}
        style={{
          minHeight: isHero
            ? isCompact
              ? 420
              : 460
            : isCompact
              ? 520
              : 560,
        }}
      >
        <ConnectionPaths
          connections={connections}
          sourcesById={sourcesById}
          activeId={activeId}
          width={size.width}
          height={size.height}
        />

        <ParticleStream
          connections={connections}
          activeId={activeId}
          width={size.width}
          height={size.height}
          particleCount={particleCount}
          onParticleArrive={onParticleArrive}
        />

        {SOURCE_NODES.map((source, index) => {
          const anchor = anchors[index]!
          return (
            <SourceBadge
              key={source.id}
              source={source}
              floatAmplitude={floatParams[index]!.amplitude}
              floatDuration={floatParams[index]!.duration}
              floatDelay={floatParams[index]!.delay}
              active={activeId === source.id}
              dimmed={activeId !== null && activeId !== source.id}
              onActivate={() => setActiveId(source.id)}
              onDeactivate={() =>
                setActiveId((current) =>
                  current === source.id ? null : current
                )
              }
              style={{
                left: `${anchor.x * 100}%`,
                top: `${anchor.y * 100}%`,
              }}
            />
          )
        })}

        {/* Description between arc and hub — never overlaps icons */}
        <div className="pointer-events-none absolute inset-x-0 top-[62%] z-30 -translate-y-1/2">
          <SourceDescription source={activeSource ?? null} />
        </div>

        <WorkspaceHub
          hubRef={hubRef}
          pulseKey={pulseKey}
          style={{
            left: `${hubAnchor.x * 100}%`,
            top: `${hubAnchor.y * 100}%`,
          }}
        />
      </div>

      <ul className="sr-only">
        {SOURCE_NODES.map((source) => (
          <li key={source.id}>
            {source.label}: {source.description}
            {source.status === "coming-soon" ? " Coming soon." : ""}
          </li>
        ))}
      </ul>
    </div>
  )
}
