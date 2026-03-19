import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'
import { BEZEL } from '@/config/bezel'

// ─── ZK Grid Data ─────────────────────────────────────────────────────────────

const CELL_SIZE = 26
const ZK_ROWS = 18
const ZK_COLS = 30
const ZK_TOTAL_W = (ZK_COLS - 1) * CELL_SIZE  // 754px
const ZK_TOTAL_H = (ZK_ROWS - 1) * CELL_SIZE  // 442px

// Z pixel art: 18 rows × 14 cols
const Z_GRID: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 0  — top bar
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 1
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 2
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 3
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 4
  [0,0,0,0,0,0,0,0,1,1,1,1,0,0], // Row 5
  [0,0,0,0,0,0,0,1,1,1,1,0,0,0], // Row 6
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0], // Row 7
  [0,0,0,0,0,1,1,1,1,0,0,0,0,0], // Row 8
  [0,0,0,0,1,1,1,1,0,0,0,0,0,0], // Row 9
  [0,0,0,1,1,1,1,0,0,0,0,0,0,0], // Row 10
  [0,0,1,1,1,1,0,0,0,0,0,0,0,0], // Row 11
  [0,1,1,1,1,0,0,0,0,0,0,0,0,0], // Row 12
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 13 — bottom bar
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 14
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 15
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 16
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 17
]

// K pixel art: 18 rows × 14 cols
const K_GRID: number[][] = [
  [1,1,1,1,1, 0,0,0,0,0, 1,1,1,1], // Row 0
  [1,1,1,1,1, 0,0,0,0, 1,1,1,1,0], // Row 1
  [1,1,1,1,1, 0,0,0, 1,1,1,1,0,0], // Row 2
  [1,1,1,1,1, 0,0, 1,1,1,1,0,0,0], // Row 3
  [1,1,1,1,1, 0, 1,1,1,1,0,0,0,0], // Row 4
  [1,1,1,1,1, 0, 1,1,1,1,0,0,0,0], // Row 5
  [1,1,1,1,1, 1,1,1,1,0,0,0,0,0],  // Row 6
  [1,1,1,1,1, 1,1,1,1,0,0,0,0,0],  // Row 7
  [1,1,1,1,1, 1,1,1,1,0,0,0,0,0],  // Row 8
  [1,1,1,1,1, 1,1,1,1,0,0,0,0,0],  // Row 9
  [1,1,1,1,1, 1,1,1,1,0,0,0,0,0],  // Row 10
  [1,1,1,1,1, 1,1,1,1,0,0,0,0,0],  // Row 11
  [1,1,1,1,1, 0, 1,1,1,1,0,0,0,0], // Row 12
  [1,1,1,1,1, 0, 1,1,1,1,0,0,0,0], // Row 13
  [1,1,1,1,1, 0,0, 1,1,1,1,0,0,0], // Row 14
  [1,1,1,1,1, 0,0,0, 1,1,1,1,0,0], // Row 15
  [1,1,1,1,1, 0,0,0,0, 1,1,1,1,0], // Row 16
  [1,1,1,1,1, 0,0,0,0,0, 1,1,1,1], // Row 17
]

// Combined: Z | 2-col gap | K → 30 cols total
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

const CHARS = '0123456789!@#$%^&*()_-+=[]{}|;:,./<>?~`\'"\\abcdefghijklmnopqrstuvwxyz'

// One particle per filled ZK cell — no stacking
const PARTICLE_COUNT = ZK_GRID.reduce((sum, row) => sum + row.filter((v) => v === 1).length, 0)

const GRAVITY = 0.3

// FIX 2: bounce tuning for elegant drift + visible squish
const BOUNCE_SPEED  = 1.5
const SQUISH_FACTOR = 0.82
const SQUISH_SPRING = 0.14

// Hover warp — precise local push
const WARP_RADIUS   = 55
const WARP_STRENGTH = 50
const WARP_SPRING   = 0.15

// Lift
const LIFT_STAGGER_MS = 15
const LIFT_SPEED_MIN  = 3
const LIFT_SPEED_MAX  = 7

// Coalesce to bottom-left before snake forms
const COALESCE_SPRING  = 0.05
const COALESCE_DAMPING = 0.82
const COALESCE_SCATTER = 30  // px scatter radius around coalesce point

// FIX 4: snake comet — circle arc geometry, per-frame path history
const SNAKE_CELL         = 22   // grid cell size in px
const SNAKE_MOVE_INTERVAL = 7   // frames between grid-cell advances
const SNAKE_LERP         = 0.2  // smooth lerp toward grid target
const HEAD_R             = 20   // px — head circle radius
const PATH_HISTORY_LEN   = 60  // frames of head-position history (the comet tail)
const SWARM_DISPLAY_MS   = 1500 // ms snake runs before slideUp

// ─── Types ────────────────────────────────────────────────────────────────────

// FIX 5: 'coalescing' phase added between lifting and swarm
type Phase = 'screensaver' | 'exploding' | 'typing' | 'lifting' | 'coalescing' | 'swarm'

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
  const userClickedRef = useRef<boolean>(false)  // PATH A flag

  // FIX 1: bezel screen rect — canvas is sized to this, not full viewport
  const screenRectRef = useRef<ScreenRect>(computeScreenRect())
  const [screenDims, setScreenDims] = useState<ScreenRect>(() => computeScreenRect())

  // Screensaver bounce — canvas-local coords (0,0 = bezel screen top-left)
  const bouncePosRef = useRef({ x: 0, y: 0 })
  const bounceVelRef = useRef({ vx: BOUNCE_SPEED, vy: BOUNCE_SPEED * 0.75 })
  const squishRef    = useRef({ x: 1, y: 1 })

  // FIX 4: snake comet — smooth head + per-frame path history (viewport coords)
  const snakeHeadPxRef    = useRef({ x: 0, y: 0 })   // smooth canvas-local head position
  const snakeTargetRef    = useRef({ x: 0, y: 0 })   // current grid-cell target (canvas-local)
  const snakeDirRef       = useRef({ dx: 1, dy: 0 })  // current grid direction
  const snakeMoveTimerRef = useRef(0)
  const pathHistoryRef    = useRef<{ x: number; y: number }[]>([])  // viewport coords
  const snakeHeadCharsRef = useRef<string[]>([])       // 8 chars flickering inside head
  const snakeActiveRef    = useRef(false)

  const [showTyping,  setShowTyping]  = useState(false)
  const [typedText,   setTypedText]   = useState('')
  const [showBlink,   setShowBlink]   = useState(true)
  const [introExiting, setIntroExiting] = useState(false)  // PATH A slideUp

  useEffect(() => { themeRef.current = theme }, [theme])

  // ── Particle init ─────────────────────────────────────────────────────────
  // sw/sh are canvas dimensions = bezel screen px size
  // (0,0) in particle space = bezel screen top-left

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

    // Bounce starts at canvas center (= bezel screen center, canvas-local)
    bouncePosRef.current = { x: cx, y: cy }
    bounceVelRef.current = {
      vx: BOUNCE_SPEED * (Math.random() < 0.5 ? 1 : -1),
      vy: BOUNCE_SPEED * 0.75 * (Math.random() < 0.5 ? 1 : -1),
    }
    squishRef.current = { x: 1, y: 1 }
  }

  // ── Lift sequence ─────────────────────────────────────────────────────────

  function startLift() {
    const canvas = canvasRef.current
    if (!canvas) return
    phaseRef.current = 'lifting'

    const cx = canvas.width / 2
    const cy = canvas.height / 2

    const toLift = particlesRef.current
      .filter((p) => p.settled)
      .sort((a, b) => Math.hypot(b.x - cx, b.y - cy) - Math.hypot(a.x - cx, a.y - cy))

    toLift.forEach((p, i) => {
      const delay = Math.floor(i / 10) * LIFT_STAGGER_MS
      setTimeout(() => {
        p.settled = false
        p.vy = -(LIFT_SPEED_MIN + Math.random() * (LIFT_SPEED_MAX - LIFT_SPEED_MIN))
        p.vx = (Math.random() - 0.5) * 2
        p.targetOpacity = 1.0
        setTimeout(() => { p.targetOpacity = 0.7 }, 80)
      }, delay)
    })

    const liftDuration = Math.ceil(toLift.length / 10) * LIFT_STAGGER_MS + 800
    setTimeout(startCoalesce, liftDuration)
  }

  // ── Coalesce: particles spring to bottom-left before snake forms ──────────

  function startCoalesce() {
    phaseRef.current = 'coalescing'
    setTimeout(startSwarm, 600)
  }

  // ── Swarm: snake activates ────────────────────────────────────────────────

  function startSwarm() {
    const canvas = canvasRef.current
    if (!canvas) return
    phaseRef.current = 'swarm'

    const sw = canvas.width
    const sh = canvas.height
    const { sl, st } = screenRectRef.current

    // Snake head starts at canvas-local bottom-left (15%, 85%)
    const startX = sw * 0.15
    const startY = sh * 0.85

    snakeHeadPxRef.current    = { x: startX, y: startY }
    snakeTargetRef.current    = { x: startX, y: startY }
    snakeDirRef.current       = { dx: 1, dy: 0 }
    snakeMoveTimerRef.current = 0
    snakeActiveRef.current    = true

    // Seed full path history at start position (viewport coords for portal canvas)
    pathHistoryRef.current = Array.from({ length: PATH_HISTORY_LEN }, () => ({
      x: startX + sl,
      y: startY + st,
    }))

    // 8 chars that flicker inside the head circle
    snakeHeadCharsRef.current = Array.from({ length: 8 }, () =>
      CHARS[Math.floor(Math.random() * CHARS.length)]
    )

    // PATH A: slideUp after display time
    setTimeout(() => { setIntroExiting(true) }, SWARM_DISPLAY_MS)
  }

  // ── RAF loop ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // FIX 1: canvas sized to exact bezel screen area — NOT full viewport
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

      // Re-center bounce when window resizes
      if (phaseRef.current === 'screensaver') {
        bouncePosRef.current = { x: rect.sw / 2, y: rect.sh / 2 }
      }
    }

    resize()
    window.addEventListener('resize', resize)
    initParticles(canvas.width, canvas.height)
    phaseRef.current = 'screensaver'

    const ctx = canvas.getContext('2d')!

    function loop() {
      if (!canvas) return
      // FIX 1: w/h are now bezel screen px dimensions (not viewport)
      const w     = canvas.width
      const h     = canvas.height
      const phase = phaseRef.current
      const mouse = mouseRef.current
      const particles = particlesRef.current
      const now   = Date.now()

      const isDark  = themeRef.current === 'dark'
      const bgColor = isDark ? '#000000' : '#ffffff'
      const pcColor = isDark ? '#ffffff' : '#000000'

      // Fills only the bezel screen area (canvas IS the bezel screen)
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, w, h)
      ctx.font = '14px "Courier New", monospace'

      if (phase === 'screensaver') {
        const bp = bouncePosRef.current
        const bv = bounceVelRef.current
        const sq = squishRef.current
        bp.x += bv.vx
        bp.y += bv.vy

        // FIX 2: half-dims use squish multiplier → ZK never clips wall
        const halfW = (ZK_TOTAL_W / 2) * sq.x + 4  // +4 inset buffer
        const halfH = (ZK_TOTAL_H / 2) * sq.y + 4

        // FIX 1+2: walls are canvas edges — no bezelL/R/T/B needed
        if (bp.x - halfW < 0) { bv.vx =  Math.abs(bv.vx); bp.x = halfW;     sq.x = SQUISH_FACTOR }
        if (bp.x + halfW > w) { bv.vx = -Math.abs(bv.vx); bp.x = w - halfW; sq.x = SQUISH_FACTOR }
        if (bp.y - halfH < 0) { bv.vy =  Math.abs(bv.vy); bp.y = halfH;     sq.y = SQUISH_FACTOR }
        if (bp.y + halfH > h) { bv.vy = -Math.abs(bv.vy); bp.y = h - halfH; sq.y = SQUISH_FACTOR }

        sq.x += (1 - sq.x) * SQUISH_SPRING
        sq.y += (1 - sq.y) * SQUISH_SPRING

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
        const floorY = h  // floor = bottom of bezel screen (canvas-local)
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

      } else if (phase === 'lifting') {
        for (const p of particles) {
          if (!p.settled) {
            p.vx *= 0.98; p.vy *= 0.98
            p.x += p.vx;  p.y += p.vy
          } else {
            p.opacity *= 0.97
          }
          p.opacity += (p.targetOpacity - p.opacity) * 0.1
        }

      } else if (phase === 'coalescing') {
        // FIX 5: spring all particles toward bottom-left cluster point
        for (const p of particles) {
          if (p.opacity < 0.01) continue
          const tx = w * 0.15 + Math.cos(p.flickerOffset) * COALESCE_SCATTER
          const ty = h * 0.85 + Math.sin(p.flickerOffset) * COALESCE_SCATTER
          p.vx += (tx - p.x) * COALESCE_SPRING
          p.vy += (ty - p.y) * COALESCE_SPRING
          p.vx *= COALESCE_DAMPING
          p.vy *= COALESCE_DAMPING
          p.x += p.vx
          p.y += p.vy
          p.opacity += (0.6 - p.opacity) * 0.05
        }

      } else if (phase === 'swarm') {
        // Background particles coast and fade
        for (const p of particles) {
          p.opacity *= 0.96
          p.x += p.vx * 0.92
          p.y += p.vy * 0.92
        }

        // FIX 4: snake grid movement — advance head target every SNAKE_MOVE_INTERVAL frames
        snakeMoveTimerRef.current++
        if (snakeMoveTimerRef.current >= SNAKE_MOVE_INTERVAL) {
          snakeMoveTimerRef.current = 0
          const dir = snakeDirRef.current

          // 25% chance to turn — no 180° reversals
          if (Math.random() < 0.25) {
            const dirs = [
              { dx:  1, dy:  0 }, { dx: -1, dy:  0 },
              { dx:  0, dy:  1 }, { dx:  0, dy: -1 },
            ].filter((d) => !(d.dx === -dir.dx && d.dy === -dir.dy))
            snakeDirRef.current = dirs[Math.floor(Math.random() * dirs.length)]
          }

          const buf  = HEAD_R + 4
          const newX = Math.max(buf, Math.min(w - buf, snakeTargetRef.current.x + snakeDirRef.current.dx * SNAKE_CELL))
          const newY = Math.max(buf, Math.min(h - buf, snakeTargetRef.current.y + snakeDirRef.current.dy * SNAKE_CELL))
          snakeTargetRef.current = { x: newX, y: newY }
        }

        // Smooth lerp head toward current grid target (canvas-local)
        const head = snakeHeadPxRef.current
        head.x += (snakeTargetRef.current.x - head.x) * SNAKE_LERP
        head.y += (snakeTargetRef.current.y - head.y) * SNAKE_LERP

        // Record head in path history — viewport coords (portal canvas is full viewport)
        const { sl, st } = screenRectRef.current
        const hist = pathHistoryRef.current
        hist.unshift({ x: head.x + sl, y: head.y + st })
        if (hist.length > PATH_HISTORY_LEN) hist.pop()

        // Occasionally flicker one head char
        if (Math.random() < 0.12) {
          const idx = Math.floor(Math.random() * snakeHeadCharsRef.current.length)
          snakeHeadCharsRef.current[idx] = CHARS[Math.floor(Math.random() * CHARS.length)]
        }
      }

      // ── Draw ZK particles on main canvas ──────────────────────────────────
      ctx.font = '14px "Courier New", monospace'
      for (const p of particles) {
        if (p.opacity < 0.01) continue
        ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity))
        ctx.fillStyle   = pcColor
        ctx.fillText(p.char, p.x, p.y)
      }
      ctx.globalAlpha = 1

      // ── Portal canvas: comet snake (Path A) + scroll trail (Path B) ───────
      const sc = swarmCanvasRef.current?.getContext('2d')
      if (sc && swarmCanvasRef.current) {
        const vw = swarmCanvasRef.current.width
        const vh = swarmCanvasRef.current.height
        sc.clearRect(0, 0, vw, vh)

        const dotRgb  = isDark ? '240,239,233' : '10,10,10'
        const headFill = isDark ? 'rgba(240,239,233,0.95)' : 'rgba(10,10,10,0.95)'
        const charFill = isDark ? 'rgba(10,10,10,0.7)' : 'rgba(240,239,233,0.7)'

        if (phase === 'swarm' && snakeActiveRef.current) {
          // FIX 4: comet — draw trail tail→head so head renders on top
          const hist = pathHistoryRef.current
          for (let i = hist.length - 1; i >= 1; i--) {
            const t = 1 - i / hist.length  // 0 at tail tip, ~1 near head
            const r = Math.max(1, HEAD_R * t)
            const a = 0.9 * t
            sc.beginPath()
            sc.arc(hist[i].x, hist[i].y, r, 0, Math.PI * 2)
            sc.fillStyle = `rgba(${dotRgb},${a.toFixed(2)})`
            sc.fill()
          }

          if (hist.length > 0) {
            const hd = hist[0]

            // Head circle — bright solid ball
            sc.beginPath()
            sc.arc(hd.x, hd.y, HEAD_R, 0, Math.PI * 2)
            sc.fillStyle = headFill
            sc.fill()

            // 8 flickering chars inside head circle
            sc.font = '11px "IBM Plex Mono", monospace'
            sc.textBaseline = 'middle'
            sc.textAlign    = 'center'
            const chars = snakeHeadCharsRef.current
            for (let i = 0; i < chars.length; i++) {
              const angle = (i / chars.length) * Math.PI * 2
              sc.fillStyle = charFill
              sc.fillText(chars[i], hd.x + Math.cos(angle) * 8, hd.y + Math.sin(angle) * 8)
            }
            sc.textBaseline = 'alphabetic'
            sc.textAlign    = 'left'
          }

        } else if (phase === 'screensaver') {
          // FIX 6: PATH B — scroll-driven comet trailing from viewport top downward
          const { sl, st, sw: sw2, sh: sh2 } = screenRectRef.current
          const sectionEl = canvasRef.current?.parentElement
          if (sectionEl) {
            const sRect    = sectionEl.getBoundingClientRect()
            // scrollProg: 0 = intro at rest, 1 = fully scrolled past
            const scrollProg = Math.max(0, Math.min(1, (st - sRect.top) / sh2))

            if (scrollProg > 0.03) {
              const hx    = sl + sw2 * 0.2
              const headY = scrollProg * sh2 * 0.3  // head moves from y=0 to 30% of sh

              const STEPS = 80
              for (let i = 0; i <= STEPS; i++) {
                const t  = i / STEPS   // 0=tail(top of viewport), 1=head
                const py = t * headY
                const r  = Math.max(1, HEAD_R * t)
                const a  = 0.85 * t * Math.min(1, scrollProg * 2)
                sc.beginPath()
                sc.arc(hx, py, r, 0, Math.PI * 2)
                sc.fillStyle = `rgba(${dotRgb},${a.toFixed(2)})`
                sc.fill()
              }
            }
          }
        }

        sc.globalAlpha = 1
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

  // ── Event handlers ────────────────────────────────────────────────────────

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      // Canvas is bezel-screen-sized — convert viewport coords to canvas-local
      mouseRef.current = {
        x: (e.clientX - rect.left) * (canvas.width  / rect.width),
        y: (e.clientY - rect.top)  * (canvas.height / rect.height),
      }
    }

    function onClick() {
      if (phaseRef.current !== 'screensaver') return
      userClickedRef.current = true  // PATH A

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

  // ── Typing sequence ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!showTyping) return
    const fullText = 'zachary kaplan'
    let i = 0
    const tid = setInterval(() => {
      i++
      setTypedText(fullText.slice(0, i))
      if (i >= fullText.length) {
        clearInterval(tid)
        setTimeout(() => { startLift() }, 800)
      }
    }, 78)
    return () => clearInterval(tid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTyping])

  // ── Blinking cursor ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!showTyping) return
    const bid = setInterval(() => setShowBlink((v) => !v), 530)
    return () => clearInterval(bid)
  }, [showTyping])

  // ─── Render ───────────────────────────────────────────────────────────────

  const particleColor = theme === 'dark' ? '#ffffff' : '#000000'
  const bgClass       = theme === 'dark' ? 'bg-black' : 'bg-white'
  const { sw, sh }    = screenDims

  return (
    <>
      {/* Portal canvas: full viewport, in document.body — survives slideUp of intro section */}
      {createPortal(
        <canvas
          ref={swarmCanvasRef}
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 50, pointerEvents: 'none' }}
        />,
        document.body
      )}

      {/* FIX 1: section is exactly bezel screen size (sw × sh) — not 100vh.
          FIX 5: slideUp by full section height → complete off-screen exit. */}
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
