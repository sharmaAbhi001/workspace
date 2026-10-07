import type { ComponentType, SVGProps } from "react"

export type SourceStatus = "live" | "coming-soon"

export type SourceId =
  | "gmail"
  | "docs"
  | "calendar"
  | "meet"
  | "whatsapp"
  | "instagram"
  | "youtube"
  | "teams"

export type BrandIcon = ComponentType<SVGProps<SVGSVGElement>>

export type SourceNode = {
  id: SourceId
  label: string
  status: SourceStatus
  description: string
  icon: BrandIcon
  /** Tailwind-friendly accent classes for badge surface */
  accentBg: string
  accentText: string
  accentRing: string
  pathColor: string
}

export type Point = {
  x: number
  y: number
}

export type ConnectionLayout = {
  id: SourceId
  start: Point
  end: Point
  pathD: string
}
