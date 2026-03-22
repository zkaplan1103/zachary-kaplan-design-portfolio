// ─── Dragon Locomotion Engine ────────────────────────────────────────────────
// Pure TypeScript module — no React, no DOM, no canvas.
// Manages a FABRIK-style spine chain that drives all dragon movement.
// Any renderer anywhere on the site imports this for positioning.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SpinePoint {
  x: number
  y: number
  angle: number // direction this point faces (toward head)
}

export interface DragonConfig {
  totalSegments: number // number of spine points (index 0 = head)
  segmentLength: number // px between adjacent points
  headLerp: number // 0–1, how fast head chases target per frame
}

export interface DragonState {
  config: DragonConfig
  spine: SpinePoint[]
  time: number // accumulated seconds
  breathScale: number // 1 ± 0.015, oscillates
  headRoll: number // small additional angle oscillation (radians)
}

export type DragonMode = 'SLITHER' | 'WAIT' | 'TRAVEL' | 'SCROLL_DRIVEN'

// ─── Default config ──────────────────────────────────────────────────────────

export const DEFAULT_CONFIG: DragonConfig = {
  totalSegments: 48,
  segmentLength: 8,
  headLerp: 0.08,
}

// ─── Profile curves (Catmull-Rom) ────────────────────────────────────────────
// Each entry: [t, value]. t ∈ [0,1] where 0=head, 1=tail tip.

export const THICKNESS_PROFILE: [number, number][] = [
  [0.0, 1.0],
  [0.08, 0.85],
  [0.15, 0.95],
  [0.35, 0.8],
  [0.55, 0.6],
  [0.75, 0.35],
  [0.9, 0.12],
  [1.0, 0.02],
]

export const OPACITY_PROFILE: [number, number][] = [
  [0.0, 0.95],
  [0.1, 0.8],
  [0.3, 0.7],
  [0.55, 0.55],
  [0.75, 0.35],
  [0.9, 0.18],
  [1.0, 0.04],
]

// ─── Catmull-Rom cubic interpolation ─────────────────────────────────────────

function sampleCurve(pts: [number, number][], t: number): number {
  // Clamp t
  if (t <= pts[0][0]) return pts[0][1]
  if (t >= pts[pts.length - 1][0]) return pts[pts.length - 1][1]

  // Find segment: pts[i] ≤ t < pts[i+1]
  let i = 0
  for (let j = 0; j < pts.length - 1; j++) {
    if (t >= pts[j][0] && t < pts[j + 1][0]) {
      i = j
      break
    }
  }

  // Four control points (clamp at boundaries)
  const p0 = pts[Math.max(0, i - 1)][1]
  const p1 = pts[i][1]
  const p2 = pts[Math.min(pts.length - 1, i + 1)][1]
  const p3 = pts[Math.min(pts.length - 1, i + 2)][1]

  // Normalize u within segment
  const u = (t - pts[i][0]) / (pts[i + 1][0] - pts[i][0])

  // Catmull-Rom matrix
  const u2 = u * u
  const u3 = u2 * u
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * u +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * u3)
  )
}

// ─── Profile sampling ────────────────────────────────────────────────────────

export function getThicknessAt(t: number): number {
  return Math.max(0, sampleCurve(THICKNESS_PROFILE, t))
}

export function getOpacityAt(t: number): number {
  return Math.max(0, sampleCurve(OPACITY_PROFILE, t))
}

// ─── Spine creation ──────────────────────────────────────────────────────────

export function createDragon(
  config: Partial<DragonConfig> = {},
  startX = 0,
  startY = 0,
): DragonState {
  const cfg: DragonConfig = { ...DEFAULT_CONFIG, ...config }
  const spine: SpinePoint[] = []

  // Initialize all points stacked at start position, facing up (angle = -π/2)
  for (let i = 0; i < cfg.totalSegments; i++) {
    spine.push({
      x: startX,
      y: startY + i * cfg.segmentLength, // trail upward behind head
      angle: -Math.PI / 2, // facing up by default
    })
  }

  return {
    config: cfg,
    spine,
    time: 0,
    breathScale: 1,
    headRoll: 0,
  }
}

// ─── Spine update (FABRIK forward pass) ──────────────────────────────────────

export function updateDragon(
  state: DragonState,
  targetX: number,
  targetY: number,
  dt: number,
): void {
  const { config, spine } = state
  const N = spine.length

  // Advance time
  state.time += dt

  // Step 1 — Move head toward target
  spine[0].x += (targetX - spine[0].x) * config.headLerp
  spine[0].y += (targetY - spine[0].y) * config.headLerp

  // Step 2 — FABRIK forward pass: each point maintains segmentLength from predecessor
  for (let i = 1; i < N; i++) {
    const prev = spine[i - 1]
    const curr = spine[i]
    const dx = curr.x - prev.x
    const dy = curr.y - prev.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > 0) {
      const scale = config.segmentLength / dist
      curr.x = prev.x + dx * scale
      curr.y = prev.y + dy * scale
    }
  }

  // Step 3 — Calculate angles (each point faces toward the point ahead of it)
  for (let i = 0; i < N; i++) {
    if (i === 0) {
      // Head faces away from body (toward its direction of travel)
      if (N > 1) {
        spine[0].angle = Math.atan2(
          spine[0].y - spine[1].y,
          spine[0].x - spine[1].x,
        )
      }
    } else {
      // Body points face toward the point ahead (closer to head)
      spine[i].angle = Math.atan2(
        spine[i - 1].y - spine[i].y,
        spine[i - 1].x - spine[i].x,
      )
    }
  }

  // Step 4 — Breathing: subtle scale oscillation
  state.breathScale = 1 + Math.sin(state.time * 0.9) * 0.015

  // Step 5 — Head roll: small tilt oscillation
  state.headRoll = Math.sin(state.time * 1.8) * (8 * Math.PI) / 180 // ±8°
}

// ─── Spine interpolation ─────────────────────────────────────────────────────
// Maps t ∈ [0,1] to a position along the spine.
// Optionally pass bodyStartSeg to offset body particles (t=0 maps to that segment).

export function getSpinePointAt(
  state: DragonState,
  t: number,
  bodyStartSeg = 0,
): { x: number; y: number; angle: number } {
  const { spine } = state
  const N = spine.length

  // Map t to segment index range [bodyStartSeg, N-1]
  const range = N - 1 - bodyStartSeg
  const fracIdx = bodyStartSeg + Math.max(0, Math.min(1, t)) * range
  const i = Math.min(Math.floor(fracIdx), N - 2)
  const frac = fracIdx - i

  const a = spine[i]
  const b = spine[Math.min(i + 1, N - 1)]

  // Lerp position
  const x = a.x + (b.x - a.x) * frac
  const y = a.y + (b.y - a.y) * frac

  // Lerp angle (handle wrap-around)
  let da = b.angle - a.angle
  if (da > Math.PI) da -= 2 * Math.PI
  if (da < -Math.PI) da += 2 * Math.PI
  const angle = a.angle + da * frac

  return { x, y, angle }
}

// ─── Combined query: position + profiles ─────────────────────────────────────

export function getDragonPointAt(
  state: DragonState,
  t: number,
  bodyStartSeg = 0,
): { x: number; y: number; angle: number; thickness: number; opacity: number } {
  const pt = getSpinePointAt(state, t, bodyStartSeg)
  return {
    ...pt,
    thickness: getThicknessAt(t),
    opacity: getOpacityAt(t),
  }
}

// ─── Mode target helpers (pure functions) ────────────────────────────────────

/** SLITHER: Lissajous figure-8 path */
export function slitherTarget(
  time: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): { x: number; y: number } {
  return {
    x: cx + Math.sin(time * 0.4) * rx,
    y: cy + Math.sin(time * 0.8) * ry,
  }
}

/** WAIT: gentle figure-8 bob in place */
export function waitTarget(
  time: number,
  cx: number,
  cy: number,
): { x: number; y: number } {
  return {
    x: cx + Math.sin(time * 0.6) * 15,
    y: cy + Math.cos(time * 0.9) * 10,
  }
}

/** TRAVEL: move toward destination with perpendicular wobble */
export function travelTarget(
  headX: number,
  headY: number,
  destX: number,
  destY: number,
  time: number,
  speed = 2.5,
): { x: number; y: number } {
  const dx = destX - headX
  const dy = destY - headY
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist < 1) return { x: destX, y: destY }

  const nx = dx / dist
  const ny = dy / dist

  // Perpendicular direction
  const perpX = -ny
  const perpY = nx
  const wobble = Math.sin(time * 0.8 * Math.PI * 2) * 20

  // Move toward destination
  const step = Math.min(speed, dist)
  return {
    x: headX + nx * step + perpX * wobble,
    y: headY + ny * step + perpY * wobble,
  }
}

// ─── Constants for body particle spine mapping ───────────────────────────────
// Body particles' spineT=0 maps to this segment index (skips head/neck zone)
export const BODY_SPINE_START = 8
