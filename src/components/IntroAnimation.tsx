import { useEffect, useRef, useState } from 'react'
// import { createPortal } from 'react-dom' // SNAKE SYSTEM — COMMENTED OUT
import { motion } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'
import { BEZEL } from '@/config/bezel'
// import { CELL_W, CELL_H, BODY_LENGTH, cellSeed } from '@/components/swarm/dragonEngine' // SNAKE SYSTEM — COMMENTED OUT

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

/* SNAKE SYSTEM — angleDiff utility (used only by snake head angle logic)
function angleDiff(target: number, current: number): number {
  let d = target - current
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return d
}
*/

// ═══════════════════════════════════════
// SNAKE SYSTEM — COMMENTED OUT
// Preserved for future use
// See LIVING MEMORY for full architecture
// ═══════════════════════════════════════
/*
const SNAKE_SAMPLES    = 100
const SNAKE_MAX_W      = 8
const SPINE_PTS        = 750
const SEG_LEN          = BODY_LENGTH / 299
const BODY_START_T     = 0.05
const MAX_SCROLL_DISTANCE = 4000

const IDLE_VELOCITY_THRESHOLD = 0.0005
const IDLE_FRAMES_BEFORE_COIL = 20
const VELOCITY_WINDOW         = 10
const START_COIL_R            = 80
const MIN_COIL_R              = 42
const COIL_SHRINK_RATE        = 0.1
const COIL_ANG_SPEED          = 0.03

function computePathD(): string {
  const vw = window.innerWidth / 100
  const vh = window.innerHeight / 100
  const sl = BEZEL.screen.left * vw
  const st = BEZEL.screen.top * vh
  const sw = BEZEL.screen.width * vw
  const sh = BEZEL.screen.height * vh
  const yPos   = 0.92
  const startX = sl + sw + 20
  const startY = st + sh * yPos
  const cp1x   = sl + sw * 0.65
  const cp1y   = st + sh * (yPos - 0.04)
  const cp2x   = sl + sw * 0.35
  const cp2y   = st + sh * (yPos + 0.03)
  const endX   = sl - 20
  const endY   = st + sh * yPos
  return `M ${startX} ${startY} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${endX} ${endY}`
}

function snakeVisibility(progress: number): number {
  if (progress <= 0 || progress >= 1) return 0
  if (progress < 0.05) return progress / 0.05
  if (progress > 0.95) return (1 - progress) / 0.05
  return 1
}
*/

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
  // const swarmCanvasRef = useRef<HTMLCanvasElement>(null) // SNAKE SYSTEM
  const particlesRef   = useRef<Particle[]>([])
  const phaseRef       = useRef<Phase>('screensaver')
  const mouseRef       = useRef({ x: -9999, y: -9999 })
  const rafRef         = useRef<number>(0)
  const themeRef       = useRef(theme)

  const screenRectRef  = useRef<ScreenRect>(computeScreenRect())
  const [screenDims, setScreenDims] = useState<ScreenRect>(() => computeScreenRect())

  /* SNAKE SYSTEM — COMMENTED OUT
  const snakeSpineRef        = useRef<{x: number; y: number}[]>([])
  const headAngleRef         = useRef(Math.PI)
  const lightMapRef          = useRef(new Map<string, number>())
  const frameCountRef        = useRef(0)
  const svgPathRef           = useRef<SVGPathElement | null>(null)
  const svgTotalLengthRef    = useRef(0)
  const prevPathProgressRef  = useRef(0)
  const snakePhaseRef        = useRef(0)
  const snakeModeRef         = useRef<'path' | 'coil'>('path')
  const velocityHistoryRef   = useRef<number[]>([])
  const idleFrameCountRef    = useRef(0)
  const coilCenterRef        = useRef({ x: 0, y: 0 })
  const coilAngleRef         = useRef(0)
  const coilRadiusRef        = useRef(START_COIL_R)
  const scrollAccumRef       = useRef(0)
  const snakeGoneRef         = useRef(false)
  const tongueFlickRef       = useRef(false)
  const flickStartRef        = useRef(0)
  const lastFlickTimeRef     = useRef(0)
  const nextFlickIntervalRef = useRef(3000 + Math.random() * 2000)
  */

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

  // ── Scroll lock — prevent any scrolling during intro ──────────────────────
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    // Block wheel + touch scroll events entirely
    const prevent = (e: Event) => e.preventDefault()
    window.addEventListener('wheel', prevent, { passive: false })
    window.addEventListener('touchmove', prevent, { passive: false })
    return () => {
      html.style.overflow = ''
      body.style.overflow = ''
      window.removeEventListener('wheel', prevent)
      window.removeEventListener('touchmove', prevent)
    }
  }, [])

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

      /* SNAKE SYSTEM — COMMENTED OUT
      if (swarmCanvasRef.current) {
        swarmCanvasRef.current.width  = window.innerWidth
        swarmCanvasRef.current.height = window.innerHeight
      }
      */

      if (phaseRef.current === 'screensaver') {
        bouncePosRef.current = { x: rect.sw / 2, y: rect.sh / 2 }
      }

      /* SNAKE SYSTEM — COMMENTED OUT
      if (svgPathRef.current) {
        svgPathRef.current.setAttribute('d', computePathD())
        svgTotalLengthRef.current = svgPathRef.current.getTotalLength()
        snakeSpineRef.current.length = 0
        snakeModeRef.current = 'path'
        idleFrameCountRef.current = 0
        velocityHistoryRef.current.length = 0
        const parentSvg = svgPathRef.current.ownerSVGElement
        if (parentSvg) {
          parentSvg.setAttribute('width', String(window.innerWidth))
          parentSvg.setAttribute('height', String(window.innerHeight))
        }
      }
      */
    }

    resize()
    window.addEventListener('resize', resize)
    initParticles(canvas.width, canvas.height)
    phaseRef.current = 'screensaver'

    /* SNAKE SYSTEM — COMMENTED OUT
    const svgNS = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(svgNS, 'svg')
    svg.setAttribute('width', String(window.innerWidth))
    svg.setAttribute('height', String(window.innerHeight))
    Object.assign(svg.style, {
      position: 'fixed', inset: '0',
      width: '100vw', height: '100vh',
      pointerEvents: 'none', visibility: 'hidden',
    })
    const pathEl = document.createElementNS(svgNS, 'path')
    pathEl.setAttribute('d', computePathD())
    svg.appendChild(pathEl)
    document.body.appendChild(svg)
    svgPathRef.current = pathEl
    svgTotalLengthRef.current = pathEl.getTotalLength()
    */

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

      /* SNAKE SYSTEM — COMMENTED OUT (portal canvas snake rendering)
      const sc = swarmCanvasRef.current?.getContext('2d')
      if (sc && swarmCanvasRef.current) {
        const vw = swarmCanvasRef.current.width
        const vh = swarmCanvasRef.current.height
        sc.clearRect(0, 0, vw, vh)

        if (phase === 'screensaver') {
          const svgPath = svgPathRef.current
          const pathLen = svgTotalLengthRef.current

          if (svgPath && pathLen > 0 && !snakeGoneRef.current) {
            const bRect        = screenRectRef.current
            const rawProgress  = scrollAccumRef.current / MAX_SCROLL_DISTANCE
            const pathProgress = Math.max(0, Math.min(1, rawProgress))
            const opacity      = snakeVisibility(pathProgress)

            // Reset spine + coil when snake is fully hidden
            if (opacity <= 0.01) {
              if (snakeSpineRef.current.length > 0) snakeSpineRef.current.length = 0
              snakeModeRef.current = 'path'
              idleFrameCountRef.current = 0
              velocityHistoryRef.current.length = 0
              // Snake has fully traversed — mark as permanently gone
              if (pathProgress > 0.95) snakeGoneRef.current = true
            } else {
              // ── Head position from SVG path ──────────────────────────
              const dist   = pathProgress * pathLen
              const headPt = svgPath.getPointAtLength(dist)

              // ── Path tangent + scroll direction ──────────────────────
              const p1 = svgPath.getPointAtLength(Math.max(0, dist - 2))
              const p2 = svgPath.getPointAtLength(Math.min(pathLen, dist + 2))
              const tangentAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
              const prevProgress = prevPathProgressRef.current
              const pathDelta    = Math.abs(pathProgress - prevProgress)
              const scrollDir    = pathProgress >= prevProgress ? 1 : -1
              prevPathProgressRef.current = pathProgress

              // ── Slither: phase advance from path travel distance ─────
              snakePhaseRef.current += pathDelta * pathLen * 0.04
              const slitherPhase = snakePhaseRef.current
              const tgLen = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
              const perpX = tgLen > 0 ? -(p2.y - p1.y) / tgLen : 0
              const perpY = tgLen > 0 ?  (p2.x - p1.x) / tgLen : 1
              const slitherAmp = 35
              let hx    = headPt.x + perpX * Math.sin(slitherPhase) * slitherAmp
              let headY = headPt.y + perpY * Math.sin(slitherPhase) * slitherAmp

              // ── Idle detection + coil state machine ─────────────────
              const velHistory = velocityHistoryRef.current
              velHistory.push(pathDelta)
              if (velHistory.length > VELOCITY_WINDOW) velHistory.shift()
              const avgVel = velHistory.reduce((a, b) => a + b, 0) / velHistory.length

              if (snakeModeRef.current === 'path') {
                if (avgVel < IDLE_VELOCITY_THRESHOLD && opacity > 0.5) {
                  idleFrameCountRef.current++
                  if (idleFrameCountRef.current >= IDLE_FRAMES_BEFORE_COIL) {
                    snakeModeRef.current = 'coil'
                    coilCenterRef.current = { x: hx, y: headY }
                    coilAngleRef.current = headAngleRef.current
                    coilRadiusRef.current = START_COIL_R
                  }
                } else {
                  idleFrameCountRef.current = 0
                }
              } else {
                if (avgVel > 0.001) {
                  snakeModeRef.current = 'path'
                  idleFrameCountRef.current = 0
                }
              }

              // ── Final head position (path mode vs coil mode) ────────
              if (snakeModeRef.current === 'coil') {
                coilAngleRef.current += COIL_ANG_SPEED
                coilRadiusRef.current = Math.max(MIN_COIL_R, coilRadiusRef.current - COIL_SHRINK_RATE)
                hx    = coilCenterRef.current.x + Math.cos(coilAngleRef.current) * coilRadiusRef.current
                headY = coilCenterRef.current.y + Math.sin(coilAngleRef.current) * coilRadiusRef.current
                const coilTarget = coilAngleRef.current + Math.PI / 2
                headAngleRef.current += angleDiff(coilTarget, headAngleRef.current) * 0.2
              } else {
                const targetAngle = scrollDir > 0 ? tangentAngle : tangentAngle + Math.PI
                headAngleRef.current += angleDiff(targetAngle, headAngleRef.current) * 0.2
              }
              const headAngle = headAngleRef.current

              // ── Colors / timing ─────────────────────────────────────
              const portalColor = isDark ? '#f0efe9' : '#0a0a0a'
              const eyeColor    = isDark ? 'rgba(255,248,230,1)' : 'rgba(80,60,0,1)'
              const glowColor   = isDark ? 'rgba(255,185,80,0.65)' : 'rgba(255,120,40,0.55)'
              const tSec        = now / 1000
              const frame       = frameCountRef.current++
              const lights      = lightMapRef.current

              // ── Initialize spine chain along path ───────────────────
              const spine = snakeSpineRef.current
              if (spine.length === 0) {
                for (let i = 0; i < SPINE_PTS; i++) {
                  const trailDist = Math.max(0, dist - i * SEG_LEN)
                  const pt = svgPath.getPointAtLength(trailDist)
                  spine.push({ x: pt.x, y: pt.y })
                }
              }

              // Set head to current position
              spine[0].x = hx
              spine[0].y = headY

              // ── Update spine chain (follow-the-leader) ──────────────
              for (let i = 1; i < spine.length; i++) {
                const sdx = spine[i].x - spine[i - 1].x
                const sdy = spine[i].y - spine[i - 1].y
                const sdist = Math.sqrt(sdx * sdx + sdy * sdy)
                if (sdist > SEG_LEN) {
                  const r = SEG_LEN / sdist
                  spine[i].x = spine[i - 1].x + sdx * r
                  spine[i].y = spine[i - 1].y + sdy * r
                }
              }

              // ── Clip to bezel screen bounds ─────────────────────────
              sc.save()
              sc.beginPath()
              sc.rect(bRect.sl, bRect.st, bRect.sw, bRect.sh)
              sc.clip()

              sc.font         = `${FONT_SIZE}px "IBM Plex Mono", monospace`
              sc.textAlign    = 'center'
              sc.textBaseline = 'middle'

              function bodyOp(t: number): number {
                if (t <= 0.00) return 0.78
                if (t <  0.20) return 0.78 + (t / 0.20) * (0.65 - 0.78)
                if (t <  0.45) return 0.65 + ((t - 0.20) / 0.25) * (0.42 - 0.65)
                if (t <  0.65) return 0.42 + ((t - 0.45) / 0.20) * (0.22 - 0.42)
                if (t <  0.82) return 0.22 + ((t - 0.65) / 0.17) * (0.08 - 0.22)
                if (t <  0.95) return 0.08 + ((t - 0.82) / 0.13) * (0.02 - 0.08)
                if (t <  1.00) return 0.02 + ((t - 0.95) / 0.05) * (0.005 - 0.02)
                return 0.005
              }

              const CC = ['@','W','M','#'], IC = ['X','H','x','V']
              const MC = ['v','i',':',';'], OC = ['.',',','`',"'"]
              const FC = ['.',' '],         SC_CHARS = ['S',')','(']

              function charForBody(d: number, seed: number, si: number, ci: number): string {
                if (d < 0.30 && (si * 7 + Math.abs(ci) * 13) % 6 === 0) {
                  const flip = 200 + ((si * 17 + Math.abs(ci) * 31) % 201)
                  return SC_CHARS[Math.abs(Math.floor((frame + si * 37 + ci * 59) / flip)) % 3]
                }
                const arr = d < 0.15 ? CC : d < 0.35 ? IC : d < 0.55 ? MC : d < 0.75 ? OC : FC
                return arr[Math.abs(Math.floor(seed * 97)) % arr.length]
              }

              function snakeLightChance(t: number, isEye: boolean): number {
                if (isEye)    return 0.09
                if (t < 0.10) return 0.025
                if (t < 0.35) return 0.012
                if (t < 0.65) return 0.005
                return 0.001
              }

              // ── Render body (tail first → head-end last) ────────────
              for (let si = SNAKE_SAMPLES - 1; si >= 0; si--) {
                const rawT = si / (SNAKE_SAMPLES - 1)
                if (rawT < BODY_START_T) continue
                const t = (rawT - BODY_START_T) / (1 - BODY_START_T)

                const spIdx = rawT * (spine.length - 1)
                const i0 = Math.floor(spIdx)
                const i1 = Math.min(spine.length - 1, i0 + 1)
                const frac = spIdx - i0
                const spX = spine[i0].x + (spine[i1].x - spine[i0].x) * frac
                const spY = spine[i0].y + (spine[i1].y - spine[i0].y) * frac

                const ti0 = Math.max(0, i0 - 2)
                const ti1 = Math.min(spine.length - 1, i0 + 2)
                const tdx = spine[ti1].x - spine[ti0].x
                const tdy = spine[ti1].y - spine[ti0].y
                const tlen = Math.sqrt(tdx * tdx + tdy * tdy)
                const nx = tlen > 0 ?  tdy / tlen : 1
                const ny = tlen > 0 ? -tdx / tlen : 0

                const halfW = SNAKE_MAX_W * Math.pow(0.988, t * SNAKE_SAMPLES) * Math.min(1, t * 10)
                const cellR = Math.ceil(halfW)

                for (let ci = -cellR; ci <= cellR; ci++) {
                  const d = Math.abs(ci) / Math.max(1, halfW)
                  if (d > 1.0) continue
                  const px = spX + nx * ci * CELL_W
                  const py = spY + ny * ci * CELL_H
                  if (px < -20 || px > vw + 20 || py < -20 || py > vh + 20) continue
                  const seed  = cellSeed(si, ci, frame)
                  const char  = charForBody(d, seed, si, ci)
                  const alpha = opacity * bodyOp(t) * Math.pow(Math.max(0, 1 - d), 1.3)
                  if (alpha < 0.01) continue
                  const key = `b${si},${ci}`
                  let lit = lights.get(key) ?? 0
                  if (lit > 0) { lit--; lights.set(key, lit) }
                  else if (Math.random() < snakeLightChance(t, false)) {
                    lit = 12 + Math.floor(Math.random() * 20); lights.set(key, lit)
                  }
                  sc.shadowBlur  = lit > 0 ? 8 : 0
                  sc.shadowColor = glowColor
                  sc.globalAlpha = lit > 0 ? Math.min(1, alpha * 2.2) : alpha
                  sc.fillStyle   = portalColor
                  sc.fillText(char, px, py)
                }
              }

              // ── Render head — scaled pentagon (×0.35) ───────────────
              sc.save()
              sc.translate(hx, headY)
              sc.rotate(headAngle)

              const PENTA: [number, number][] = [
                [-4.2,-3.5],[-1.4,-4.55],[2.8,-2.1],[4.55,0],[2.8,2.1],[-1.4,4.55],[-4.2,3.5]
              ]
              function inPentagon(col: number, row: number): boolean {
                let inside = false
                for (let i = 0, j = PENTA.length - 1; i < PENTA.length; j = i++) {
                  const [xi,yi] = PENTA[i], [xj,yj] = PENTA[j]
                  if ((yi > row) !== (yj > row) &&
                      col < (xj - xi) * (row - yi) / (yj - yi) + xi) {
                    inside = !inside
                  }
                }
                return inside
              }

              function eyeZone(col: number, row: number, sign: number): 'eye' | 'void' | null {
                const ecx = -0.7, ecy = sign * 2.1
                if ((col-ecx)**2/(0.7**2) + (row-ecy)**2/(0.35**2) <= 1) return 'eye'
                if ((col-ecx)**2/(1.05**2) + (row-ecy)**2/(0.525**2) <= 1) return 'void'
                return null
              }

              // ── Tongue flick ────────────────────────────────────────
              if (!tongueFlickRef.current &&
                  now - lastFlickTimeRef.current > nextFlickIntervalRef.current) {
                tongueFlickRef.current = true
                flickStartRef.current  = now
                nextFlickIntervalRef.current = 3000 + Math.random() * 2000
              }
              let flickAmt = 0
              if (tongueFlickRef.current) {
                flickAmt = Math.sin((now - flickStartRef.current) / 400 * Math.PI)
                if (now - flickStartRef.current >= 400) {
                  tongueFlickRef.current = false
                  lastFlickTimeRef.current = now
                  flickAmt = 0
                }
              }

              const BASE_TONGUE: [number, number, string][] = [
                [5,-1,'-'],[6,-1,'~'],
                [5, 1,'-'],[6, 1,'~'],
              ]
              const FLICK_TONGUE: [number, number, string][] = [
                [7,-1,'='],[7, 1,'='],
              ]
              const TONGUE: [number, number, string][] =
                flickAmt > 0.3 ? [...BASE_TONGUE, ...FLICK_TONGUE] : BASE_TONGUE

              function inNeckBridge(col: number, row: number): boolean {
                if (col < -7 || col > -5) return false
                return Math.abs(row) <= 3.15 * ((col + 7) / 2)
              }

              // ── Render tongue ───────────────────────────────────────
              for (const te of TONGUE) {
                const [tc, tr, tch] = te
                const tongueA = opacity * (0.6 + 0.2 * Math.sin(tSec * 3 + tr)) *
                  (flickAmt > 0 ? (0.7 + flickAmt * 0.3) : 1)
                const tk = `tg${tc},${tr}`
                let tlit = lights.get(tk) ?? 0
                if (tlit > 0) { tlit--; lights.set(tk, tlit) }
                else if (Math.random() < 0.015) { tlit = 6 + Math.floor(Math.random()*10); lights.set(tk, tlit) }
                sc.shadowBlur  = tlit > 0 ? 5 : 0
                sc.shadowColor = glowColor
                sc.globalAlpha = Math.min(1, tongueA)
                sc.fillStyle   = portalColor
                sc.fillText(tch, tc * CELL_W, tr * CELL_H)
              }

              // ── Dense head scan (0.5-cell steps) ────────────────────
              for (let row = -5; row <= 5; row += 0.5) {
                for (let col = -8; col <= 7; col += 0.5) {
                  const lz = eyeZone(col, row, -1)
                  const rz = eyeZone(col, row, +1)
                  if (lz === 'void' || rz === 'void') continue

                  if (lz === 'eye' || rz === 'eye') {
                    const ek = `ey${col*2|0},${row*2|0}`
                    let lit = lights.get(ek) ?? 0
                    if (lit > 0) { lit--; lights.set(ek, lit) }
                    else if (Math.random() < 0.07) { lit = 8 + Math.floor(Math.random()*12); lights.set(ek, lit) }
                    const seed = cellSeed((col*2|0) + 300, (row*2|0) + 300, frame)
                    sc.shadowBlur  = 8
                    sc.shadowColor = glowColor
                    sc.globalAlpha = opacity
                    sc.fillStyle   = eyeColor
                    sc.fillText(['O','o','@'][Math.abs(Math.floor(seed*97))%3], col*CELL_W, row*CELL_H)
                    continue
                  }

                  if (!inPentagon(col, row) && !inNeckBridge(col, row)) continue

                  const distR = Math.sqrt(col**2 + row**2) / 6
                  const d     = Math.min(1, distR)
                  const seed  = cellSeed((col*2|0) + 50, (row*2|0) + 50, frame)
                  const arr   = d < 0.3 ? CC : d < 0.6 ? IC : d < 0.85 ? MC : OC
                  const char  = arr[Math.abs(Math.floor(seed * 97)) % arr.length]
                  const alpha = opacity * 0.95
                  if (alpha < 0.01) continue

                  const hk = `hd${col*2|0},${row*2|0}`
                  let lit = lights.get(hk) ?? 0
                  if (lit > 0) { lit--; lights.set(hk, lit) }
                  else if (Math.random() < (d < 0.3 ? 0.030 : 0.012)) {
                    lit = 8 + Math.floor(Math.random() * 14); lights.set(hk, lit)
                  }
                  sc.shadowBlur  = lit > 0 ? 8 : 0
                  sc.shadowColor = glowColor
                  sc.globalAlpha = lit > 0 ? Math.min(1, alpha * 1.3) : alpha
                  sc.fillStyle   = portalColor
                  sc.fillText(char, col * CELL_W, row * CELL_H)
                }
              }

              sc.restore() // head transform
              sc.restore() // bezel clip
              sc.shadowBlur   = 0
              sc.globalAlpha  = 1
              sc.textAlign    = 'left'
              sc.textBaseline = 'alphabetic'
            }
          }
        }
      }
      SNAKE SYSTEM — END COMMENTED OUT */

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      /* SNAKE SYSTEM — COMMENTED OUT
      if (svgPathRef.current?.ownerSVGElement) {
        document.body.removeChild(svgPathRef.current.ownerSVGElement)
      }
      */
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
      {/* SNAKE SYSTEM — COMMENTED OUT (portal canvas)
      {createPortal(
        <canvas
          ref={swarmCanvasRef}
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 50, pointerEvents: 'none' }}
        />,
        document.body
      )}
      */}

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
