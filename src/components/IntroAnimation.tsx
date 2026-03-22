import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'
import { BEZEL } from '@/config/bezel'

// ─── Programmatic grid generation (smooth diagonals via interpolation) ───────

function generateZGrid(rows: number, cols: number): number[][] {
  const grid = Array.from({ length: rows }, () => new Array(cols).fill(0))
  const barH = Math.round(rows * 0.28)
  const diagW = Math.round(cols * 0.33)

  // Top + bottom bars
  for (let r = 0; r < barH; r++)
    for (let c = 0; c < cols; c++) grid[r][c] = 1
  for (let r = rows - barH; r < rows; r++)
    for (let c = 0; c < cols; c++) grid[r][c] = 1

  // Diagonal: smooth center sweep from right to left
  // Overlaps 2 rows into each bar for seamless transition
  const dTop = barH - 2
  const dBot = rows - barH + 2
  for (let r = dTop; r < dBot; r++) {
    const t = (r - dTop) / (dBot - dTop - 1) // 0 → 1
    const center = (1 - t) * (cols - 1) + t * 0 // right → left

    // Width tapers: full at bar edges, diagW in the middle
    const edgeDist = Math.min(r - dTop, dBot - 1 - r)
    const taper = Math.min(1, edgeDist / 3)
    const w = cols * (1 - taper) + diagW * taper

    const left = Math.max(0, Math.round(center - w / 2))
    const right = Math.min(cols - 1, Math.round(center + w / 2))
    for (let c = left; c <= right; c++) grid[r][c] = 1
  }

  return grid
}

function generateKGrid(rows: number, cols: number): number[][] {
  const grid = Array.from({ length: rows }, () => new Array(cols).fill(0))
  const stemW = Math.round(cols * 0.42)
  const armW = Math.round(cols * 0.38)
  const mid = Math.floor(rows / 2)

  // Vertical stem — full height
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < stemW; c++) grid[r][c] = 1

  // Upper arm: tip at top-right → junction at middle
  for (let r = 0; r <= mid; r++) {
    const t = r / mid
    const center = (1 - t) * (cols - 1) + t * stemW
    const half = armW / 2

    // Extra width at tip (r near 0) and junction (r near mid) for rounding
    const tipDist = Math.min(r, mid - r)
    const extraW = Math.max(0, 2 - tipDist) * 2

    const left = Math.max(0, Math.round(center - half - extraW / 2))
    const right = Math.min(cols - 1, Math.round(center + half + extraW / 2))
    for (let c = left; c <= right; c++) grid[r][c] = 1
  }

  // Lower arm: junction at middle → tip at bottom-right
  for (let r = mid; r < rows; r++) {
    const t = (r - mid) / (rows - 1 - mid)
    const center = (1 - t) * stemW + t * (cols - 1)
    const half = armW / 2

    const tipDist = Math.min(r - mid, rows - 1 - r)
    const extraW = Math.max(0, 2 - tipDist) * 2

    const left = Math.max(0, Math.round(center - half - extraW / 2))
    const right = Math.min(cols - 1, Math.round(center + half + extraW / 2))
    for (let c = left; c <= right; c++) grid[r][c] = 1
  }

  return grid
}

// ─── ZK Grid ────────────────────────────────────────────────────────────────

const ZK_ROWS    = 36
const LETTER_COLS = 24
const ZK_COLS    = LETTER_COLS + 2 + LETTER_COLS  // 50

const Z_GRID = generateZGrid(ZK_ROWS, LETTER_COLS)
const K_GRID = generateKGrid(ZK_ROWS, LETTER_COLS)
const ZK_GRID: number[][] = Z_GRID.map((zRow, r) => [...zRow, 0, 0, ...K_GRID[r]])

// ─── Bezel screen rect ────────────────────────────────────────────────────────

interface ScreenRect { sl: number; st: number; sw: number; sh: number }

function computeScreenRect(): ScreenRect {
  return {
    sl: (BEZEL.screen.left   / 100) * window.innerWidth,
    st: (BEZEL.screen.top    / 100) * window.innerHeight,
    sw: (BEZEL.screen.width  / 100) * window.innerWidth,
    sh: (BEZEL.screen.height / 100) * window.innerHeight,
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT_SIZE  = 7
const CELL_SIZE  = 10
const ZK_TOTAL_W = (ZK_COLS - 1) * CELL_SIZE   // 49 × 10 = 490
const ZK_TOTAL_H = (ZK_ROWS - 1) * CELL_SIZE   // 35 × 10 = 350

const CHARS = '0123456789!@#$%^&*()_-+=[]{}|;:,./<>?~`\'"\\abcdefghijklmnopqrstuvwxyz'

const PARTICLE_COUNT = ZK_GRID.reduce((sum, row) => sum + row.filter((v) => v === 1).length, 0)

const GRAVITY       = 0.3
const BOUNCE_SPEED = 0.45

// Wall smoosh — state machine: float → press into wall → release off wall → float
const PRESS_FRAMES   = 50    // ~0.83s to reach max squash (ZK presses flat against wall)
const RELEASE_FRAMES = 35    // ~0.58s to peel off (slow start, accelerates away)
const SQUASH_DEPTH   = 0.85  // flattest scale on hit axis at max compression
const COUPLE         = 0.55  // perpendicular axis stretches when squashed
const JELLO_K        = 0.035 // post-release wobble spring (very gentle)
const JELLO_D        = 0.93  // wobble damping (slow settle, many oscillations)
const JELLO_KICK     = 0.04  // velocity kick on release to start wobble

const WARP_RADIUS   = 55
const WARP_STRENGTH = 50
const WARP_SPRING   = 0.15

// ─── Dragon — Path B scroll creature ─────────────────────────────────────────
// Head faces DOWN (direction of travel). Body trails UPWARD behind.
// +dy = down on screen. Body uses spine-relative coords, rendered at runtime.

// Eye socket void test — diamond shape in head-local coords
function isInEyeSocket(dx: number, dy: number): boolean {
  const sA = 11, sB = 7, tilt = 0.25
  // Left socket center (-18, -28)
  const ltx = dx + 18, lty = dy + 28
  const lrx = ltx * Math.cos(tilt) + lty * Math.sin(tilt)
  const lry = -ltx * Math.sin(tilt) + lty * Math.cos(tilt)
  if (Math.abs(lrx) / sA + Math.abs(lry) / sB <= 1) return true
  // Right socket center (+18, -28), mirrored tilt
  const rtx = dx - 18, rty = dy + 28
  const rrx = rtx * Math.cos(tilt) - rty * Math.sin(tilt)
  const rry = rtx * Math.sin(tilt) + rty * Math.cos(tilt)
  if (Math.abs(rrx) / sA + Math.abs(rry) / sB <= 1) return true
  return false
}

interface DragonPart {
  isHead: boolean
  // Head: absolute px offsets from head center
  dx: number
  dy: number
  // Body: spine-relative (rendered at runtime from sine-wave spine)
  spineT: number       // 0 = near head, 1 = far tail
  perpOffset: number   // px left/right from spine
  // Shared
  a: number
  char: string
  jitterPhase: number
  jitterAmpX: number
  jitterAmpY: number
  jitterSpeed: number
  lightTimer: number   // frames remaining "lit" (mutable per frame)
  lightChance: number  // probability per frame of igniting
}

// Slithering body constants
const WAVE_AMP          = 42   // px amplitude of sine slither
const WAVE_FREQ         = 2.8  // S-curves across full body
const WAVE_PHASE_SPEED  = 7    // how fast wave shifts with scroll (slither speed)
const NECK_OFFSET       = 75   // px behind head where body originates

const DRAGON: DragonPart[] = []

function rnd() { return Math.random() }
function randChar() { return CHARS[Math.floor(rnd() * CHARS.length)] }
function jp(ampScale = 1) {
  return {
    jitterPhase: rnd() * Math.PI * 2,
    jitterAmpX:  (0.5 + rnd() * 2.5) * ampScale,
    jitterAmpY:  (0.3 + rnd() * 1.5) * ampScale,
    jitterSpeed: 1.0 + rnd() * 3.0,
  }
}
function hp(dx: number, dy: number, a: number, lc: number, jAmp = 1): DragonPart {
  return { isHead: true, dx, dy, spineT: 0, perpOffset: 0, a, char: randChar(), ...jp(jAmp), lightTimer: 0, lightChance: lc }
}
function bp(spineT: number, perpOffset: number, a: number, lc: number, jAmp = 1): DragonPart {
  return { isHead: false, dx: 0, dy: 0, spineT, perpOffset, a, char: randChar(), ...jp(jAmp), lightTimer: 0, lightChance: lc }
}

// ── DRAGON HEAD — faces DOWN, ~280 particles ─────────────────────────────────

// Skull: large oval mass — eye socket voids excluded via rejection sampling
for (let i = 0; i < 130; i++) {
  let dx = 0, dy = 0, attempts = 0
  do {
    const angle = rnd() * Math.PI * 2
    const r = Math.sqrt(rnd())
    dx = Math.cos(angle) * r * 44
    dy = -18 + Math.sin(angle) * r * 32
    attempts++
  } while (isInEyeSocket(dx, dy) && attempts < 50)
  DRAGON.push(hp(dx, dy, 0.80 + rnd() * 0.20, 0.004, 0.4))
}

// Snout / upper jaw: tapers from skull downward, slight rightward lean
for (let i = 0; i < 55; i++) {
  const t = rnd()  // 0=skull base, 1=snout tip
  const halfW = 22 * (1 - t * 0.82)
  const dx = (rnd() * 2 - 1) * halfW + t * 8  // slight right lean
  const dy = 8 + t * 62
  DRAGON.push(hp(dx, dy, 0.72 + rnd() * 0.25, 0.003, 0.5))
}

// Lower jaw: separated from snout by mouth gap (~10px)
for (let i = 0; i < 38; i++) {
  const t = rnd()
  const halfW = 18 * (1 - t * 0.65)
  const dx = (rnd() * 2 - 1) * halfW + 12 + t * 6  // offset right — jaw hangs open
  const dy = 58 + t * 32   // below the gap
  DRAGON.push(hp(dx, dy, 0.65 + rnd() * 0.30, 0.004, 0.6))
}

// Snout tip wisps / fire breath (below lower jaw)
for (let i = 0; i < 20; i++) {
  const t = rnd()
  const dx = (rnd() * 2 - 1) * 10 * (1 - t) + 14
  const dy = 90 + t * 30
  DRAGON.push(hp(dx, dy, (0.15 + rnd() * 0.30) * (1 - t * 0.7), 0.012, 1.5))
}

// Left horn: curves up-left from skull
for (let i = 0; i < 14; i++) {
  const t = i / 14
  DRAGON.push(hp(-18 - t * 12 + (rnd() - 0.5) * 5, -38 - t * 28 + (rnd() - 0.5) * 4, 0.55 + rnd() * 0.35, 0.005, 0.8))
}
// Right horn: curves up-right, slightly shorter
for (let i = 0; i < 10; i++) {
  const t = i / 10
  DRAGON.push(hp(18 + t * 10 + (rnd() - 0.5) * 4, -42 - t * 20 + (rnd() - 0.5) * 4, 0.50 + rnd() * 0.35, 0.005, 0.8))
}

// Left eye pupil — bright cluster inside left socket void, flashes often
for (let i = 0; i < 5; i++) {
  DRAGON.push(hp(-18 + (rnd() - 0.5) * 8, -28 + (rnd() - 0.5) * 5, 0.95, 0.04, 0.15))
}
// Right eye pupil — same, mirrored
for (let i = 0; i < 5; i++) {
  DRAGON.push(hp(18 + (rnd() - 0.5) * 8, -28 + (rnd() - 0.5) * 5, 0.95, 0.04, 0.15))
}

// Skull fringe / scale wisps around perimeter
for (let i = 0; i < 30; i++) {
  const angle = rnd() * Math.PI * 2
  const r = 44 + rnd() * 20
  DRAGON.push(hp(Math.cos(angle) * r, -18 + Math.sin(angle) * r * 0.75, 0.15 + rnd() * 0.30, 0.006, 1.4))
}

// Neck (connects skull to body, slightly above center)
for (let i = 0; i < 22; i++) {
  const t = rnd()
  const dx = (rnd() * 2 - 1) * (12 - t * 4)
  const dy = -(50 + t * 35)
  DRAGON.push(hp(dx, dy, 0.60 + rnd() * 0.30, 0.003, 0.5))
}

// ── DRAGON BODY — 550 particles, three-zone thickness profile ────────────────
// spineT: 0=neck origin, 1=tail tip. Position computed at render time.
// Zone 1 (t<0.4): thick dense core. Zone 2 (0.4–0.75): tapering. Zone 3 (≥0.75): wispy tail.

const BODY_TOTAL = 550
for (let i = 0; i < BODY_TOTAL; i++) {
  const t = Math.pow(i / (BODY_TOTAL - 1), 1.4)
  let perpOffset: number, a: number, lc: number, jAmp: number

  if (t < 0.4) {
    // Zone 1 — thick/dense: 26px half-width, high opacity
    const bodyHalfW = 26 * (1 - t * 0.15)
    if (rnd() < 0.72) {
      perpOffset = (rnd() * 2 - 1) * bodyHalfW
      a = 0.50 + rnd() * 0.25
      lc = 0.005; jAmp = 0.7
    } else {
      const sign = rnd() > 0.5 ? 1 : -1
      perpOffset = sign * (bodyHalfW + 3 + rnd() * 55 * Math.pow(1 - t, 0.85))
      a = 0.25 + rnd() * 0.20
      lc = 0.003; jAmp = 1.3
    }
  } else if (t < 0.75) {
    // Zone 2 — tapering: 20px → 10px half-width
    const zoneFrac = (t - 0.4) / 0.35
    const bodyHalfW = 20 - zoneFrac * 10
    if (rnd() < 0.45) {
      perpOffset = (rnd() * 2 - 1) * bodyHalfW
      a = (0.35 + rnd() * 0.20) * Math.pow(1 - t, 0.4)
      lc = 0.003; jAmp = 0.8
    } else {
      const sign = rnd() > 0.5 ? 1 : -1
      perpOffset = sign * (bodyHalfW + 2 + rnd() * 40 * Math.pow(1 - t, 0.9))
      a = (0.15 + rnd() * 0.18) * Math.pow(1 - t, 0.6)
      lc = 0.002; jAmp = 1.5
    }
  } else {
    // Zone 3 — wispy tail: 2–8px, very sparse
    const bodyHalfW = 8 * Math.pow(1 - t, 0.5)
    if (rnd() < 0.30) {
      perpOffset = (rnd() * 2 - 1) * bodyHalfW
      a = (0.12 + rnd() * 0.15) * Math.pow(1 - t, 0.3)
      lc = 0.001; jAmp = 1.0
    } else {
      const sign = rnd() > 0.5 ? 1 : -1
      perpOffset = sign * (bodyHalfW + rnd() * 20 * Math.pow(1 - t, 1.2))
      a = (0.05 + rnd() * 0.12) * Math.pow(1 - t, 0.5)
      lc = 0.001; jAmp = 1.8
    }
  }

  DRAGON.push(bp(t, perpOffset, a, lc, jAmp))
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'screensaver' | 'exploding' | 'typing'

interface Particle {
  x: number; y: number; vx: number; vy: number
  char: string; opacity: number; targetOpacity: number
  flickerSpeed: number; flickerOffset: number
  isZK: boolean; activationTime: number; settled: boolean; evicted: boolean
  cellIdx: number; revertStartTime: number
  homeX: number; homeY: number
  zkOffX: number; zkOffY: number
  targetX: number; targetY: number
  displX: number; displY: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export function IntroAnimation() {
  const setIntroComplete = useUIStore((s) => s.setIntroComplete)
  const setIntroVisible  = useUIStore((s) => s.setIntroVisible)
  const theme            = useUIStore((s) => s.theme)

  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const swarmCanvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef   = useRef<Particle[]>([])
  const phaseRef       = useRef<Phase>('screensaver')
  const mouseRef       = useRef({ x: -9999, y: -9999 })
  const rafRef         = useRef<number>(0)
  const themeRef       = useRef(theme)

  const screenRectRef  = useRef<ScreenRect>(computeScreenRect())
  const [screenDims, setScreenDims] = useState<ScreenRect>(() => computeScreenRect())

  // Dragon head rotation (spring-interpolated toward spine tangent angle)
  const headAngleRef = useRef(0)

  // Screensaver bounce
  const bouncePosRef = useRef({ x: 0, y: 0 })
  const bounceVelRef = useRef({ vx: BOUNCE_SPEED, vy: BOUNCE_SPEED * 0.75 })
  const squishRef    = useRef({ x: 1, y: 1, vx: 0, vy: 0 })
  const wallStateRef = useRef({
    state: 'floating' as 'floating' | 'pressing' | 'releasing',
    wall: 'left' as 'left' | 'right' | 'top' | 'bottom',
    frame: 0,
    entrySpeed: 0,
    crossVel: 0,
    cooldownWall: null as string | null,
    cooldownFrames: 0,
  })

  const [showTyping,   setShowTyping]   = useState(false)
  const [typedText,    setTypedText]    = useState('')
  const [showBlink,    setShowBlink]    = useState(true)
  const [introExiting, setIntroExiting] = useState(false)

  useEffect(() => { themeRef.current = theme }, [theme])

  // ── Particle init ──────────────────────────────────────────────────────────

  function initParticles(sw: number, sh: number) {
    const cx = sw / 2
    const cy = sh / 2

    const cells: { col: number; row: number }[] = []
    for (let r = 0; r < ZK_ROWS; r++)
      for (let c = 0; c < ZK_COLS; c++)
        if (ZK_GRID[r][c] === 1) cells.push({ col: c, row: r })

    const originX = cx - ZK_TOTAL_W / 2
    const originY = cy - ZK_TOTAL_H / 2
    const ps: Particle[] = []

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const cell = cells[i]
      const x = originX + cell.col * CELL_SIZE
      const y = originY + cell.row * CELL_SIZE
      ps.push({
        x, y, vx: 0, vy: 0,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
        opacity: 1, targetOpacity: 1,
        flickerSpeed:  0.001 + Math.random() * 0.003,
        flickerOffset: Math.random() * Math.PI * 2,
        isZK: true, activationTime: 0,
        settled: false, evicted: false,
        cellIdx: i, revertStartTime: 0,
        homeX: x, homeY: y,
        zkOffX: cell.col * CELL_SIZE - ZK_TOTAL_W / 2,
        zkOffY: cell.row * CELL_SIZE - ZK_TOTAL_H / 2,
        targetX: x, targetY: y,
        displX: 0, displY: 0,
      })
    }
    particlesRef.current = ps

    bouncePosRef.current = { x: cx, y: cy }
    bounceVelRef.current = {
      vx: BOUNCE_SPEED * (Math.random() < 0.5 ? 1 : -1),
      vy: BOUNCE_SPEED * 0.75 * (Math.random() < 0.5 ? 1 : -1),
    }
    squishRef.current = { x: 1, y: 1, vx: 0, vy: 0 }
    wallStateRef.current = { state: 'floating', wall: 'left', frame: 0, entrySpeed: 0, crossVel: 0, cooldownWall: null, cooldownFrames: 0 }
  }

  // ── RAF loop ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function resize() {
      if (!canvas) return
      const rect = computeScreenRect()
      screenRectRef.current = rect
      setScreenDims(rect)

      canvas.width  = Math.round(rect.sw)
      canvas.height = Math.round(rect.sh)

      if (swarmCanvasRef.current) {
        swarmCanvasRef.current.width  = window.innerWidth
        swarmCanvasRef.current.height = window.innerHeight
      }

      if (phaseRef.current === 'screensaver') {
        bouncePosRef.current = { x: rect.sw / 2, y: rect.sh / 2 }
      }
    }

    resize()
    window.addEventListener('resize', resize)
    initParticles(canvas.width, canvas.height)
    phaseRef.current = 'screensaver'

    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false

    function loop() {
      if (!canvas) return
      const w         = canvas.width
      const h         = canvas.height
      const phase     = phaseRef.current
      const mouse     = mouseRef.current
      const particles = particlesRef.current
      const now       = Date.now()
      const isDark    = themeRef.current === 'dark'
      const pcColor   = isDark ? '#f0efe9' : '#0a0a0a'

      ctx.clearRect(0, 0, w, h)
      ctx.font = `${FONT_SIZE}px "IBM Plex Mono", monospace`

      if (phase === 'screensaver') {
        const bp = bouncePosRef.current
        const bv = bounceVelRef.current
        const sq = squishRef.current
        const ws = wallStateRef.current

        const nomHalfW = ZK_TOTAL_W / 2 + 4
        const nomHalfH = ZK_TOTAL_H / 2 + 4
        const isHoriz = ws.wall === 'left' || ws.wall === 'right'

        // ── STATE: FLOATING — normal drift + jello wobble + collision check ─
        if (ws.state === 'floating') {
          bp.x += bv.vx
          bp.y += bv.vy

          // Jello wobble (residual from previous bounce)
          sq.vx += (1 - sq.x) * JELLO_K
          sq.vx *= JELLO_D
          sq.x  += sq.vx
          sq.vy += (1 - sq.y) * JELLO_K
          sq.vy *= JELLO_D
          sq.y  += sq.vy

          // Cooldown: prevent immediate re-trigger on same wall from jello wobble
          if (ws.cooldownFrames > 0) ws.cooldownFrames--
          else ws.cooldownWall = null

          // Check wall collisions (edge of ZK reaches canvas boundary)
          const hitL = bp.x - nomHalfW * sq.x <= 0 && ws.cooldownWall !== 'left'
          const hitR = bp.x + nomHalfW * sq.x >= w && ws.cooldownWall !== 'right'
          const hitT = bp.y - nomHalfH * sq.y <= 0 && ws.cooldownWall !== 'top'
          const hitB = bp.y + nomHalfH * sq.y >= h && ws.cooldownWall !== 'bottom'

          if (hitL || hitR || hitT || hitB) {
            ws.state = 'pressing'
            ws.frame = 0
            ws.wall = hitL ? 'left' : hitR ? 'right' : hitT ? 'top' : 'bottom'
            const hitH = hitL || hitR
            ws.entrySpeed = Math.abs(hitH ? bv.vx : bv.vy)
            ws.crossVel = hitH ? bv.vy : bv.vx
            bv.vx = 0; bv.vy = 0
            // Snap shape to 1.0 on entry so the press easing starts clean
            sq.x = 1; sq.y = 1; sq.vx = 0; sq.vy = 0
          }

        // ── STATE: PRESSING — edge pinned to wall, squash deepens over time ─
        } else if (ws.state === 'pressing') {
          ws.frame++
          const t = Math.min(1, ws.frame / PRESS_FRAMES)
          // easeOutCubic: fast initial impact, decelerates to a stop at max squash
          const ease = 1 - (1 - t) * (1 - t) * (1 - t)
          const squash  = 1 - ease * (1 - SQUASH_DEPTH)
          const stretch = 1 + (1 - squash) * COUPLE

          if (isHoriz) {
            sq.x = squash; sq.y = stretch
            // Pin near edge to wall — center follows squash
            bp.x = ws.wall === 'left' ? nomHalfW * squash : w - nomHalfW * squash
          } else {
            sq.y = squash; sq.x = stretch
            bp.y = ws.wall === 'top' ? nomHalfH * squash : h - nomHalfH * squash
          }

          // Cross-axis continues sliding along wall
          if (isHoriz) bp.y += ws.crossVel
          else bp.x += ws.crossVel

          if (t >= 1) { ws.state = 'releasing'; ws.frame = 0 }

        // ── STATE: RELEASING — peel off wall, shape recovers, then jello kick ─
        } else if (ws.state === 'releasing') {
          ws.frame++
          const t = Math.min(1, ws.frame / RELEASE_FRAMES)
          // easeInCubic: slow peel, then accelerates off the wall
          const ease = t * t * t
          const squash  = SQUASH_DEPTH + ease * (1 - SQUASH_DEPTH)
          const stretch = 1 + (1 - squash) * COUPLE

          if (isHoriz) {
            sq.x = squash; sq.y = stretch
            bp.x = ws.wall === 'left' ? nomHalfW * squash : w - nomHalfW * squash
          } else {
            sq.y = squash; sq.x = stretch
            bp.y = ws.wall === 'top' ? nomHalfH * squash : h - nomHalfH * squash
          }

          if (isHoriz) bp.y += ws.crossVel
          else bp.x += ws.crossVel

          if (t >= 1) {
            // Reverse velocity — push off the wall
            const speed = Math.max(BOUNCE_SPEED * 0.8, ws.entrySpeed * 0.85)
            if (ws.wall === 'left')   { bv.vx =  speed; bv.vy = ws.crossVel }
            if (ws.wall === 'right')  { bv.vx = -speed; bv.vy = ws.crossVel }
            if (ws.wall === 'top')    { bv.vy =  speed; bv.vx = ws.crossVel }
            if (ws.wall === 'bottom') { bv.vy = -speed; bv.vx = ws.crossVel }

            // Jello kick — shape is at 1.0 but give it velocity to create wobble
            sq.x = 1; sq.y = 1
            if (isHoriz) { sq.vx = JELLO_KICK; sq.vy = -JELLO_KICK * 0.5 }
            else         { sq.vy = JELLO_KICK; sq.vx = -JELLO_KICK * 0.5 }

            // Cooldown so jello wobble doesn't re-trigger same wall
            ws.cooldownWall = ws.wall
            ws.cooldownFrames = 60
            ws.state = 'floating'
          }
        }

        for (const p of particles) {
          p.displX *= (1 - WARP_SPRING)
          p.displY *= (1 - WARP_SPRING)

          const baseX = bp.x + p.zkOffX * sq.x
          const baseY = bp.y + p.zkOffY * sq.y

          const cdx   = baseX - mouse.x
          const cdy   = baseY - mouse.y
          const cdist = Math.hypot(cdx, cdy)
          if (cdist > 0 && cdist < WARP_RADIUS) {
            const force = (1 - cdist / WARP_RADIUS) ** 2 * WARP_STRENGTH
            p.displX += (cdx / cdist) * force
            p.displY += (cdy / cdist) * force
          }
          const dmag = Math.hypot(p.displX, p.displY)
          if (dmag > WARP_STRENGTH) {
            p.displX = (p.displX / dmag) * WARP_STRENGTH
            p.displY = (p.displY / dmag) * WARP_STRENGTH
          }

          p.x = baseX + p.displX
          p.y = baseY + p.displY
          p.opacity = 0.85 + 0.15 * Math.sin(now * p.flickerSpeed + p.flickerOffset)
        }

      } else if (phase === 'exploding' || phase === 'typing') {
        const floorY = h
        for (const p of particles) {
          if (!p.settled) {
            p.vy += GRAVITY
            if (p.y >= floorY && p.vy > 0) {
              p.vy *= -0.40
              p.y  = floorY
              p.vx *= 0.78
              if (Math.abs(p.vy) < 0.9) { p.vy = 0; p.settled = true }
            }
            p.x += p.vx
            p.y += p.vy
            p.vx *= 0.996
          }
          p.opacity += ((p.settled ? 0.08 : 0.55) - p.opacity) * 0.05
        }
      }

      // ── Draw ZK particles ────────────────────────────────────────────────
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      for (const p of particles) {
        if (p.opacity < 0.01) continue
        ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity))
        ctx.fillStyle   = pcColor
        ctx.fillText(p.char, p.x, p.y)
      }
      ctx.globalAlpha  = 1
      ctx.textAlign    = 'left'
      ctx.textBaseline = 'alphabetic'

      // ── Portal canvas: Path B dragon scroll creature ─────────────────────
      const sc = swarmCanvasRef.current?.getContext('2d')
      if (sc && swarmCanvasRef.current) {
        const vw = swarmCanvasRef.current.width
        const vh = swarmCanvasRef.current.height
        sc.clearRect(0, 0, vw, vh)

        if (phase === 'screensaver') {
          const sectionEl = canvasRef.current?.parentElement
          if (sectionEl) {
            const introBottom  = sectionEl.getBoundingClientRect().bottom
            const viewportH    = window.innerHeight
            const triggerPoint = viewportH * 0.5

            if (introBottom < triggerPoint) {
              const scrollProg   = 1 - introBottom / triggerPoint
              const opacity      = Math.min(1, scrollProg * 3)
              const headY = viewportH * 0.1 + scrollProg * viewportH * 0.25
              const baseHx = screenRectRef.current.sl + screenRectRef.current.sw * 0.2
              const portalColor = isDark ? '#f0efe9' : '#0a0a0a'
              const glowColor   = isDark ? 'rgba(255,185,80,0.65)' : 'rgba(255,120,40,0.55)'
              const tSec = now / 1000

              // Slither phase: shifts with scroll + slow time drift for living feel
              const scrollPhase = scrollProg * WAVE_PHASE_SPEED + tSec * 0.35
              // Phase at spine origin — subtract so body always starts at head position
              const phaseAtHead = Math.sin(scrollPhase) * WAVE_AMP
              // Gentle head sway (head also moves slightly left-right)
              const hx = baseHx + Math.sin(scrollPhase * 0.4) * 12

              // Trail length: how far above head the body extends
              const trailLen = headY * 0.9

              // Head rotation — spring toward spine tangent angle at t=0
              // d/dt[sin(t*2π*FREQ+phase)] at t=0 = cos(phase)*2π*FREQ*AMP
              const targetAngle = Math.atan2(
                Math.cos(scrollPhase) * Math.PI * 2 * WAVE_FREQ * WAVE_AMP,
                trailLen,
              )
              headAngleRef.current += (targetAngle - headAngleRef.current) * 0.12
              const headAngle = headAngleRef.current
              const cos_a = Math.cos(headAngle)
              const sin_a = Math.sin(headAngle)

              // Body originates ~75px behind head along neck direction
              const bodyOriginX = hx - sin_a * NECK_OFFSET
              const bodyOriginY = headY - cos_a * NECK_OFFSET

              sc.font         = `${FONT_SIZE}px "IBM Plex Mono", monospace`
              sc.textAlign    = 'center'
              sc.textBaseline = 'middle'

              // Update light timers for all particles this frame
              for (const m of DRAGON) {
                if (m.lightTimer > 0) {
                  m.lightTimer--
                } else if (rnd() < m.lightChance) {
                  m.lightTimer = 8 + Math.floor(rnd() * 14)
                }
              }

              // ── Render body first (behind head) ───────────────────────────
              sc.shadowBlur = 0
              for (const m of DRAGON) {
                if (m.isHead) continue

                const spineX = bodyOriginX + Math.sin(m.spineT * Math.PI * 2 * WAVE_FREQ + scrollPhase) * WAVE_AMP - phaseAtHead
                const spineY = bodyOriginY - m.spineT * trailLen

                const jx = Math.sin(tSec * m.jitterSpeed + m.jitterPhase) * m.jitterAmpX
                const jy = Math.cos(tSec * m.jitterSpeed * 0.8 + m.jitterPhase) * m.jitterAmpY
                const px = spineX + m.perpOffset + jx
                const py = spineY + jy

                const alpha = opacity * m.a
                if (alpha < 0.01) continue

                if (m.lightTimer > 0) {
                  sc.shadowBlur  = 7
                  sc.shadowColor = glowColor
                  sc.globalAlpha = Math.min(1, alpha * 1.6)
                } else {
                  sc.shadowBlur  = 0
                  sc.globalAlpha = alpha
                }
                sc.fillStyle = portalColor
                sc.fillText(m.char, px, py)
              }

              // ── Render head on top — rotated to align with body direction ─
              for (const m of DRAGON) {
                if (!m.isHead) continue

                // Rotate head-local offsets by headAngle so skull tracks the spine
                const rdx = m.dx * cos_a - m.dy * sin_a
                const rdy = m.dx * sin_a + m.dy * cos_a
                const jx = Math.sin(tSec * m.jitterSpeed + m.jitterPhase) * m.jitterAmpX * 0.5
                const jy = Math.cos(tSec * m.jitterSpeed * 0.8 + m.jitterPhase) * m.jitterAmpY * 0.5
                const px = hx + rdx + jx
                const py = headY + rdy + jy

                const alpha = opacity * m.a
                if (alpha < 0.01) continue

                if (m.lightTimer > 0) {
                  sc.shadowBlur  = 8
                  sc.shadowColor = glowColor
                  sc.globalAlpha = Math.min(1, alpha * 1.7)
                } else {
                  sc.shadowBlur  = 0
                  sc.globalAlpha = alpha
                }
                sc.fillStyle = portalColor
                sc.fillText(m.char, px, py)
              }

              sc.shadowBlur   = 0
              sc.globalAlpha  = 1
              sc.textAlign    = 'left'
              sc.textBaseline = 'alphabetic'
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Event handlers ─────────────────────────────────────────────────────────

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: (e.clientX - rect.left) * (canvas.width  / rect.width),
        y: (e.clientY - rect.top)  * (canvas.height / rect.height),
      }
    }

    function onClick() {
      if (phaseRef.current !== 'screensaver') return

      for (const p of particlesRef.current) { p.displX = 0; p.displY = 0 }

      const bcx = bouncePosRef.current.x
      const bcy = bouncePosRef.current.y
      for (const p of particlesRef.current) {
        const angle = Math.atan2(p.y - bcy, p.x - bcx)
        const speed = 9 + Math.random() * 13
        p.vx = Math.cos(angle) * speed + (Math.random() - 0.5) * 5
        p.vy = Math.sin(angle) * speed - (1.5 + Math.random() * 7)
        p.settled = false
        p.isZK    = false
      }
      phaseRef.current = 'exploding'
      setTimeout(() => {
        phaseRef.current = 'typing'
        setShowTyping(true)
      }, 1000)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('click', onClick)
    }
  }, [])

  // ── Typing → slideUp → introComplete ───────────────────────────────────────

  useEffect(() => {
    if (!showTyping) return
    const fullText = 'zachary kaplan'
    let i = 0
    const tid = setInterval(() => {
      i++
      setTypedText(fullText.slice(0, i))
      if (i >= fullText.length) {
        clearInterval(tid)
        setTimeout(() => { setIntroExiting(true) }, 800)
      }
    }, 78)
    return () => clearInterval(tid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTyping])

  useEffect(() => {
    if (!showTyping) return
    const bid = setInterval(() => setShowBlink((v) => !v), 530)
    return () => clearInterval(bid)
  }, [showTyping])

  // ─── Render ────────────────────────────────────────────────────────────────

  const particleColor = theme === 'dark' ? '#ffffff' : '#000000'
  const bgClass       = theme === 'dark' ? 'bg-black' : 'bg-white'
  const { sw, sh }    = screenDims

  return (
    <>
      {createPortal(
        <canvas
          ref={swarmCanvasRef}
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 50, pointerEvents: 'none' }}
        />,
        document.body
      )}

      <motion.section
        className={`relative overflow-hidden select-none ${bgClass}`}
        style={{
          width:  sw > 0 ? `${Math.round(sw)}px` : '100%',
          height: sh > 0 ? `${Math.round(sh)}px` : '100vh',
          cursor: 'crosshair',
        }}
        initial={{ y: 0 }}
        animate={{ y: introExiting ? -Math.round(sh) : 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 1, 1] as const }}
        onAnimationComplete={() => {
          if (introExiting) {
            setIntroComplete(true)
            setIntroVisible(false)
          }
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0" />

        {showTyping && (
          <div
            className="absolute inset-x-0 flex justify-center pointer-events-none"
            style={{ top: '38%' }}
          >
            <div
              style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '15px',
                color: particleColor,
                letterSpacing: '0.06em',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span>{typedText}</span>
              <span
                style={{
                  display: 'inline-block',
                  width: '9px',
                  height: '17px',
                  backgroundColor: particleColor,
                  opacity: showBlink ? 1 : 0,
                  marginLeft: '2px',
                  verticalAlign: 'middle',
                  flexShrink: 0,
                }}
              />
            </div>
          </div>
        )}
      </motion.section>
    </>
  )
}
