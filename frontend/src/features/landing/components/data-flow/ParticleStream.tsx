import { useAnimationFrame } from "framer-motion"
import { useEffect, useMemo, useRef, useState } from "react"

import type { ConnectionLayout, SourceId } from "./types"

type ParticleStreamProps = {
  connections: ConnectionLayout[]
  activeId: SourceId | null
  width: number
  height: number
  particleCount: number
  onParticleArrive: () => void
}

type ParticleDef = {
  id: string
  connectionId: SourceId
  progress: number
  speed: number
  radius: number
  color: string
}

const PARTICLE_COLORS: Record<SourceId, string> = {
  gmail: "#f87171",
  docs: "#38bdf8",
  calendar: "#fbbf24",
  meet: "#34d399",
  whatsapp: "#4ade80",
  instagram: "#f472b6",
  youtube: "#fb7185",
  teams: "#818cf8",
}

export function ParticleStream({
  connections,
  activeId,
  width,
  height,
  particleCount,
  onParticleArrive,
}: ParticleStreamProps) {
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({})
  const circleRefs = useRef<Record<string, SVGCircleElement | null>>({})
  const particlesRef = useRef<ParticleDef[]>([])
  const [particleDefs, setParticleDefs] = useState<ParticleDef[]>([])
  const activeIdRef = useRef(activeId)
  const arriveThrottle = useRef(0)
  const onArriveRef = useRef(onParticleArrive)

  activeIdRef.current = activeId
  onArriveRef.current = onParticleArrive

  const connectionIds = useMemo(
    () => connections.map((c) => c.id),
    [connections]
  )

  useEffect(() => {
    if (connections.length === 0) {
      particlesRef.current = []
      setParticleDefs([])
      return
    }

    const next: ParticleDef[] = []
    for (let i = 0; i < particleCount; i++) {
      const connectionId = connectionIds[i % connectionIds.length]!
      next.push({
        id: `p-${i}-${connectionId}`,
        connectionId,
        progress: (i / particleCount) * 0.85,
        speed: 0.09 + (i % 5) * 0.018,
        radius: 2.2 + (i % 3) * 0.45,
        color: PARTICLE_COLORS[connectionId],
      })
    }
    particlesRef.current = next
    setParticleDefs(next)
  }, [connectionIds, connections.length, particleCount])

  useAnimationFrame((_, delta) => {
    const dt = Math.min(delta, 40) / 1000
    const active = activeIdRef.current

    for (const p of particlesRef.current) {
      const boosted = active === p.connectionId
      p.progress += p.speed * (boosted ? 2.6 : 1) * dt
      if (p.progress >= 1) {
        p.progress = 0
        const now = performance.now()
        if (now - arriveThrottle.current > 300) {
          arriveThrottle.current = now
          onArriveRef.current()
        }
      }

      const pathEl = pathRefs.current[p.connectionId]
      const circleEl = circleRefs.current[p.id]
      if (!pathEl || !circleEl) continue

      const length = pathEl.getTotalLength()
      if (!length) continue
      const point = pathEl.getPointAtLength(p.progress * length)
      circleEl.setAttribute("cx", String(point.x))
      circleEl.setAttribute("cy", String(point.y))

      const dimmed = active !== null && active !== p.connectionId
      circleEl.setAttribute("r", String(boosted ? p.radius + 1.2 : p.radius))
      circleEl.setAttribute(
        "opacity",
        dimmed ? "0.12" : boosted ? "0.95" : "0.7"
      )
    }
  })

  if (width === 0 || height === 0) return null

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible"
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
    >
      {connections.map((conn) => (
        <path
          key={`measure-${conn.id}`}
          ref={(el) => {
            pathRefs.current[conn.id] = el
          }}
          d={conn.pathD}
          fill="none"
          stroke="transparent"
          strokeWidth={0}
        />
      ))}

      {particleDefs.map((p) => (
        <circle
          key={p.id}
          ref={(el) => {
            circleRefs.current[p.id] = el
          }}
          cx={0}
          cy={0}
          r={p.radius}
          fill={p.color}
          opacity={0.7}
          style={{ filter: `drop-shadow(0 0 3px ${p.color})` }}
        />
      ))}
    </svg>
  )
}
