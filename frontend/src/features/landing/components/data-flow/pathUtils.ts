import type { ConnectionLayout, Point, SourceId } from "./types"

export type LayoutMode = "mobile" | "tablet" | "desktop"

/** Move a point from `from` toward `to` by `distance` pixels. */
export function moveToward(from: Point, to: Point, distance: number): Point {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const t = Math.min(distance / len, 0.45)
  return { x: from.x + dx * t, y: from.y + dy * t }
}

export function buildCurvePath(start: Point, end: Point): string {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const controlX = start.x + dx * 0.5
  const controlY = start.y + dy * 0.45
  return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`
}

export function layoutConnections(
  badgeCenters: Record<SourceId, Point>,
  hubCenter: Point,
  /** Pull path start down from icon center so lines meet the circle, not the label */
  iconRadius = 24
): ConnectionLayout[] {
  return (Object.entries(badgeCenters) as [SourceId, Point][]).map(
    ([id, center]) => {
      const start = moveToward(center, hubCenter, iconRadius)
      return {
        id,
        start,
        end: hubCenter,
        pathD: buildCurvePath(start, hubCenter),
      }
    }
  )
}

/**
 * Clean upper semi-circle with equal angular spacing.
 * Mobile = 2 rows; tablet/desktop = arc with different spread.
 */
export function getBadgeAnchors(
  count: number,
  mode: LayoutMode
): Array<{ x: number; y: number }> {
  if (mode === "mobile") {
    const row1 = Math.ceil(count / 2)
    const row2 = count - row1
    const anchors: Array<{ x: number; y: number }> = []
    for (let i = 0; i < row1; i++) {
      anchors.push({
        x: 0.12 + (i / Math.max(row1 - 1, 1)) * 0.76,
        y: 0.16,
      })
    }
    for (let i = 0; i < row2; i++) {
      anchors.push({
        x: 0.2 + (i / Math.max(row2 - 1, 1)) * 0.6,
        y: 0.42,
      })
    }
    return anchors
  }

  // Arc knobs (0–1 of canvas). Tablet is slightly tighter than desktop.
  const startAngle = Math.PI * (mode === "tablet" ? 1.05 : 1.0)
  const endAngle = Math.PI * (mode === "tablet" ? 1.95 : 2.0)
  const rx = mode === "tablet" ? 0.44 : 0.52
  const ry = mode === "tablet" ? 0.34 : 0.37
  const cx = 0.5
  const cy = 0.5

  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const angle = startAngle + (endAngle - startAngle) * t
    return {
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry,
    }
  })
}
