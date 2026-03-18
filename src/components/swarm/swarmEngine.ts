// Pure particle math — no React, no DOM.
// All functions mutate particle arrays in place for zero-allocation per frame.

import {
  CELL_SIZE,
  getZKCells,
  ZK_TOTAL_H,
  ZK_TOTAL_W,
} from './zkGrid'
import {
  CHAR_FLIP_MAX,
  CHAR_FLIP_MIN,
  CHARS,
  DAMPING,
  FG_B,
  FG_G,
  FG_R,
  FONT_SIZE,
  PARTICLE_COUNT,
  SCATTER_LIFETIME_MAX,
  SCATTER_LIFETIME_MIN,
  SCATTER_OPACITY_MAX,
  SCATTER_OPACITY_MIN,
  SPRING,
} from './swarmConfig'

// ── Types ─────────────────────────────────────────────────────────────────────

export type SwarmMode = 'ZK' | 'SCATTER'

export interface Particle {
  x: number
  y: number
  tx: number
  ty: number
  vx: number
  vy: number
  char: string
  opacity: number
  targetOpacity: number
  charTimer: number
  scatterTimer: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ── Init ──────────────────────────────────────────────────────────────────────

// Initialise PARTICLE_COUNT particles. Each particle starts at a random canvas
// position and has a ZK cell centre as its target — spring physics pulls it in.
export function initParticlesZK(w: number, h: number): Particle[] {
  const cells = getZKCells()
  const originX = w / 2 - ZK_TOTAL_W / 2
  const originY = h / 2 - ZK_TOTAL_H / 2

  const particles: Particle[] = []
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const cell = cells[i % cells.length]
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      tx: originX + cell.col * CELL_SIZE,
      ty: originY + cell.row * CELL_SIZE,
      vx: 0,
      vy: 0,
      char: randomChar(),
      opacity: 0,
      targetOpacity: 0.85,
      charTimer: randomInt(CHAR_FLIP_MIN, CHAR_FLIP_MAX),
      scatterTimer: 0,
    })
  }
  return particles
}

// Assign random scatter targets — called once when switching from ZK → SCATTER.
export function scatterParticles(particles: Particle[], w: number, h: number): void {
  for (const p of particles) {
    p.tx = randomInt(FONT_SIZE, w - FONT_SIZE)
    p.ty = randomInt(FONT_SIZE, h - FONT_SIZE)
    p.targetOpacity =
      Math.random() * (SCATTER_OPACITY_MAX - SCATTER_OPACITY_MIN) + SCATTER_OPACITY_MIN
    p.scatterTimer = randomInt(SCATTER_LIFETIME_MIN, SCATTER_LIFETIME_MAX)
  }
}

// ── Per-frame update ──────────────────────────────────────────────────────────

export function updateParticles(
  particles: Particle[],
  mode: SwarmMode,
  w: number,
  h: number
): void {
  for (const p of particles) {
    // Character flicker
    p.charTimer--
    if (p.charTimer <= 0) {
      p.char = randomChar()
      p.charTimer = randomInt(CHAR_FLIP_MIN, CHAR_FLIP_MAX)
    }

    // Opacity lerp
    p.opacity += (p.targetOpacity - p.opacity) * 0.05

    // Spring physics
    p.vx += (p.tx - p.x) * SPRING
    p.vy += (p.ty - p.y) * SPRING
    p.vx *= DAMPING
    p.vy *= DAMPING
    p.x += p.vx
    p.y += p.vy

    // Scatter: periodic target reassignment
    if (mode === 'SCATTER') {
      p.scatterTimer--
      if (p.scatterTimer <= 0) {
        p.tx = randomInt(FONT_SIZE, w - FONT_SIZE)
        p.ty = randomInt(FONT_SIZE, h - FONT_SIZE)
        p.targetOpacity =
          Math.random() * (SCATTER_OPACITY_MAX - SCATTER_OPACITY_MIN) + SCATTER_OPACITY_MIN
        p.scatterTimer = randomInt(SCATTER_LIFETIME_MIN, SCATTER_LIFETIME_MAX)
      }
    }
  }
}

// ── Render ────────────────────────────────────────────────────────────────────

export function renderParticles(
  particles: Particle[],
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
): void {
  ctx.clearRect(0, 0, w, h)
  ctx.font = `${FONT_SIZE}px "IBM Plex Mono", "Courier New", monospace`
  ctx.textBaseline = 'middle'

  for (const p of particles) {
    if (p.opacity < 0.01) continue
    ctx.fillStyle = `rgba(${FG_R},${FG_G},${FG_B},${p.opacity})`
    ctx.fillText(p.char, p.x, p.y)
  }
}
