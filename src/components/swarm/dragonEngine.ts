// ─── Dragon Grid Engine ──────────────────────────────────────────────────────
// Pure TypeScript — no React, no DOM, no canvas.
// The dragon is a GENERATOR: redrawn every frame from pure math.
// Spine + ribcage + head anatomy = ~10 constants produce the entire creature.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Grid Constants ──────────────────────────────────────────────────────────

export const CELL_W = 7 // px per grid column (IBM Plex Mono 7px)
export const CELL_H = 12 // px per grid row
export const BODY_LENGTH = 420 // px total body length (head to tail tip)
export const SPINE_SAMPLES = 120 // sample density along body
export const MAX_RIBS = 20 // max ribcage radius in grid cells at head

// ─── Spine ───────────────────────────────────────────────────────────────────
// Composite sine wave — two frequencies create the deep S-curve.
// Body extends UPWARD (-Y) from head. dyFromHead = t * bodyLength.

function spineOffsetX(dyFromHead: number, phase: number): number {
  return (
    Math.sin(dyFromHead * 0.05 + phase) * 80 +
    Math.sin(dyFromHead * 0.02) * 40
  )
}

/** Spine world position at parameter t ∈ [0,1]. 0=head, 1=tail. */
export function spinePos(
  t: number,
  headX: number,
  headY: number,
  bodyLen: number,
  phase: number,
): { x: number; y: number } {
  const dy = t * bodyLen
  return {
    x: headX + spineOffsetX(dy, phase),
    y: headY - dy, // body goes UP from head
  }
}

/** Normalized tangent vector at parameter t. */
export function spineTangent(
  t: number,
  bodyLen: number,
  phase: number,
): { tx: number; ty: number } {
  const eps = 0.0005
  const t1 = Math.max(0, t - eps)
  const t2 = Math.min(1, t + eps)
  const d1 = t1 * bodyLen
  const d2 = t2 * bodyLen
  const x1 = spineOffsetX(d1, phase)
  const x2 = spineOffsetX(d2, phase)
  const dx = x2 - x1
  const dy = -(d2 - d1) // body goes up = negative Y
  const len = Math.sqrt(dx * dx + dy * dy)
  return len > 0 ? { tx: dx / len, ty: dy / len } : { tx: 0, ty: -1 }
}

// ─── Ribcage ─────────────────────────────────────────────────────────────────
// Exponential decay: fat at head, thin at tail. Returns radius in grid cells.

export function ribRadius(t: number): number {
  return MAX_RIBS * Math.pow(0.982, t * SPINE_SAMPLES)
}

// ─── Character Selection ─────────────────────────────────────────────────────
// d = normalized distance from spine center (0=core, 1=edge).
// seed provides per-cell variation (use a cheap hash of position).

const DENSE_CORE = ['@', 'W', 'M', '#']
const INNER_SHADE = ['X', 'H', 'x', 'V']
const MID_SHADE = ['v', 'i', ':', ';']
const OUTER_SHADE = ['.', ',', '`', "'"]
const FRINGE_CHARS = ['.', ' ', ' ']

export function charForDist(d: number, seed: number): string {
  const chars =
    d < 0.12 ? DENSE_CORE :
    d < 0.30 ? INNER_SHADE :
    d < 0.52 ? MID_SHADE :
    d < 0.74 ? OUTER_SHADE :
    FRINGE_CHARS
  return chars[Math.abs(Math.floor(seed * 97)) % chars.length]
}

// ─── Body Opacity ────────────────────────────────────────────────────────────
// Combined body-position taper × radial falloff.

function opacityForT(t: number): number {
  // Piecewise linear interpolation through control points
  if (t <= 0) return 0.92
  if (t < 0.25) return 0.92 + (t / 0.25) * (0.78 - 0.92)
  if (t < 0.55) return 0.78 + ((t - 0.25) / 0.30) * (0.58 - 0.78)
  if (t < 0.78) return 0.58 + ((t - 0.55) / 0.23) * (0.35 - 0.58)
  if (t < 0.92) return 0.35 + ((t - 0.78) / 0.14) * (0.15 - 0.35)
  if (t < 1.0) return 0.15 + ((t - 0.92) / 0.08) * (0.04 - 0.15)
  return 0.04
}

export function bodyOpacity(t: number, d: number): number {
  return Math.pow(Math.max(0, 1 - d), 1.3) * opacityForT(t)
}

// ─── Light Chance ────────────────────────────────────────────────────────────

export function lightChance(t: number, isPupil: boolean): number {
  if (isPupil) return 0.09
  if (t < 0.05) return 0.020 // head core
  if (t < 0.12) return 0.012 // neck
  if (t < 0.40) return 0.007 // body
  if (t < 0.70) return 0.004 // mid-body
  return 0.002 // tail
}

// ─── Head Anatomy ────────────────────────────────────────────────────────────
// All coordinates in head-local GRID cells (col, row).
// (0,0) = skull center. Positive col = "forward" (snout direction).
// Positive row = "below" centerline. Head faces RIGHT at angle 0.

// Eye socket void — rhombus tilted 25°
function isEyeSocketGrid(col: number, row: number): boolean {
  const cos25 = 0.9063 // cos(25°)
  const sin25 = 0.4226 // sin(25°)

  // Left socket center: (-5, -3)
  {
    const dc = col + 5
    const dr = row + 3
    const rc = dc * cos25 + dr * sin25
    const rr = -dc * sin25 + dr * cos25
    if (Math.abs(rc) / 2.2 + Math.abs(rr) / 1.6 <= 1) return true
  }
  // Right socket center: (+5, -3)
  {
    const dc = col - 5
    const dr = row + 3
    // Mirror tilt: -25°
    const rc = dc * cos25 - dr * sin25
    const rr = dc * sin25 + dr * cos25
    if (Math.abs(rc) / 2.2 + Math.abs(rr) / 1.6 <= 1) return true
  }
  return false
}

// Eye pupil — center of each socket void
function isEyePupilGrid(col: number, row: number): boolean {
  // Left pupil near (-5, -3)
  if (Math.abs(col + 5) <= 0.8 && Math.abs(row + 3) <= 0.8) return true
  // Right pupil near (+5, -3)
  if (Math.abs(col - 5) <= 0.8 && Math.abs(row + 3) <= 0.8) return true
  return false
}

// Horn arc test — returns char and opacity, or null
function hornCell(
  col: number,
  row: number,
): { char: string; opacity: number } | null {
  const hornChars = ['/', '^', '~', '\\']

  // Left horn: arc from (-3, -9) curving to (-10, -18)
  {
    const t = (-row - 9) / 9 // 0 at base, 1 at tip
    if (t >= 0 && t <= 1) {
      const expectedCol = -3 - t * 7
      if (Math.abs(col - expectedCol) <= 1.2 - t * 0.5) {
        return {
          char: hornChars[Math.floor(t * 4) % 4],
          opacity: 0.7 - t * 0.35,
        }
      }
    }
  }
  // Right horn: arc from (+3, -9) curving to (+10, -18)
  {
    const t = (-row - 9) / 9
    if (t >= 0 && t <= 1) {
      const expectedCol = 3 + t * 7
      if (Math.abs(col - expectedCol) <= 1.2 - t * 0.5) {
        return {
          char: hornChars[Math.floor(t * 4) % 4],
          opacity: 0.7 - t * 0.35,
        }
      }
    }
  }
  return null
}

export interface HeadCellResult {
  char: string
  opacity: number
  isPupil: boolean
}

/** Returns what to draw at (col, row) in head-local grid coords, or null. */
export function headCell(
  col: number,
  row: number,
  seed: number,
): HeadCellResult | null {
  // Eye socket voids — draw nothing
  if (isEyeSocketGrid(col, row) && !isEyePupilGrid(col, row)) return null

  // Eye pupils — always bright
  if (isEyePupilGrid(col, row)) {
    return { char: '*', opacity: 1.0, isPupil: true }
  }

  // Mouth gap: row 0 to +2, col > 3 — empty or dim
  if (row >= 0 && row <= 2 && col > 3 && col < 16) {
    return seed > 0.88 ? { char: '.', opacity: 0.12, isPupil: false } : null
  }

  // Upper jaw: col 4 to 18, row -4 to -1
  if (col >= 4 && col <= 18 && row >= -4 && row <= -1) {
    const progress = (col - 4) / 14
    // Taper: jaw narrows toward tip
    const maxRow = -1 - Math.floor(progress * 3)
    if (row < maxRow) return null
    // Droop: slight downward curve at tip
    const droopRow = row + Math.floor(progress * 0.5)
    if (droopRow < -4) return null
    const char = progress > 0.8 ? '/' : charForDist(0.15, seed)
    return { char, opacity: 0.85 - progress * 0.3, isPupil: false }
  }

  // Lower jaw: col 4 to 15, row 3 to 6
  if (col >= 4 && col <= 15 && row >= 3 && row <= 6) {
    const progress = (col - 4) / 11
    // Taper toward tip
    const maxRow = 3 + Math.floor((1 - progress) * 3)
    if (row > maxRow) return null
    const char = progress > 0.8 ? '\\' : charForDist(0.2, seed)
    return { char, opacity: 0.80 - progress * 0.3, isPupil: false }
  }

  // Horns
  const horn = hornCell(col, row)
  if (horn) return { ...horn, isPupil: false }

  // Skull — ellipse: (col/13)² + (row/9)² ≤ 1
  const skullD = (col / 13) ** 2 + (row / 9) ** 2
  if (skullD <= 1) {
    const d = Math.sqrt(skullD)
    return {
      char: charForDist(d * 0.7, seed),
      opacity: Math.pow(1 - d * 0.8, 1.2) * 0.9,
      isPupil: false,
    }
  }

  // Neck bridge: col -10 to -4, row -3 to +3 (tapers behind skull)
  if (col >= -13 && col <= -10 && row >= -4 && row <= 4) {
    const neckProgress = (-col - 10) / 3
    const neckHalfH = 4 - neckProgress * 1
    if (Math.abs(row) <= neckHalfH) {
      return {
        char: charForDist(0.3, seed),
        opacity: 0.65 - neckProgress * 0.15,
        isPupil: false,
      }
    }
  }

  return null
}

// ─── Cheap hash for per-cell seed ────────────────────────────────────────────

export function cellSeed(a: number, b: number, frame: number): number {
  // Simple hash: produces 0–1 with good variation
  const h = Math.sin(a * 127.1 + b * 311.7 + frame * 0.017) * 43758.5453
  return h - Math.floor(h)
}
