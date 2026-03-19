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

// ─── Constants ────────────────────────────────────────────────────────────────

const CHARS = '0123456789!@#$%^&*()_-+=[]{}|;:,./<>?~`\'"\\abcdefghijklmnopqrstuvwxyz'

// FIX 1: one particle per filled cell — must be computed after ZK_GRID
const PARTICLE_COUNT = ZK_GRID.reduce((sum, row) => sum + row.filter((v) => v === 1).length, 0)

const GRAVITY = 0.3

// Screensaver bounce
const BOUNCE_SPEED = 1.2
const SQUISH_FACTOR = 0.85
const SQUISH_SPRING = 0.12

// Hover warp — FIX 2: reduced radius for precise, local push
const WARP_RADIUS = 55
const WARP_STRENGTH = 50
const WARP_SPRING = 0.15

// Lift sequence
const LIFT_STAGGER_MS = 15
const LIFT_SPEED_MIN = 3
const LIFT_SPEED_MAX = 7

// Snake swarm — FIX 5: head circle + taper trail
const SNAKE_CELL = 22
const SNAKE_MOVE_INTERVAL = 7
const SNAKE_LENGTH_PX = 400                           // ~1/3 bezel width at typical viewport
const MAX_SNAKE_LENGTH = Math.ceil(SNAKE_LENGTH_PX / SNAKE_CELL)  // ~19 cells
const HEAD_RADIUS = 55                                // px — head cluster radius
const SNAKE_HEAD_N = 25                               // particles in tight head cluster
const SNAKE_TRAIL_N = 95                              // particles along tapered trail
const SNAKE_SPRING = 0.08
const SNAKE_DAMPING = 0.82
const SWARM_DISPLAY_MS = 2000

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'screensaver' | 'exploding' | 'typing' | 'lifting' | 'swarm'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  char: string
  opacity: number
  targetOpacity: number
  flickerSpeed: number
  flickerOffset: number
  isZK: boolean
  activationTime: number
  settled: boolean
  evicted: boolean
  cellIdx: number
  revertStartTime: number
  homeX: number
  homeY: number
  zkOffX: number
  zkOffY: number
  targetX: number
  targetY: number
  displX: number
  displY: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export function IntroAnimation() {
  const setIntroComplete = useUIStore((s) => s.setIntroComplete)
  const setIntroVisible = useUIStore((s) => s.setIntroVisible)
  const theme = useUIStore((s) => s.theme)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const swarmCanvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const phaseRef = useRef<Phase>('screensaver')
  const mouseRef = useRef({ x: -500, y: -500 })
  const rafRef = useRef<number>(0)
  const themeRef = useRef(theme)
  const userClickedRef = useRef<boolean>(false)  // PATH A flag

  // Screensaver bounce
  const bouncePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const bounceVelRef = useRef<{ vx: number; vy: number }>({ vx: 1.2, vy: 0.9 })
  const squishRef = useRef<{ x: number; y: number }>({ x: 1, y: 1 })

  // Snake swarm
  const snakeRef = useRef<{ x: number; y: number; age: number }[]>([])
  const snakeDirRef = useRef<{ dc: number; dr: number }>({ dc: 1, dr: 0 })
  const snakeMoveTimerRef = useRef<number>(0)
  const snakeParticlesRef = useRef<Particle[]>([])

  const [showTyping, setShowTyping] = useState(false)
  const [typedText, setTypedText] = useState('')
  const [showBlink, setShowBlink] = useState(true)
  const [introExiting, setIntroExiting] = useState(false)  // PATH A slideUp trigger

  useEffect(() => {
    themeRef.current = theme
  }, [theme])

  // ── Particle init ──────────────────────────────────────────────────────────

  function initParticles(w: number, h: number) {
    // FIX 3: center ZK within bezel, not full canvas
    const bezelL = BEZEL.screen.left / 100 * w
    const bezelR = (BEZEL.screen.left + BEZEL.screen.width) / 100 * w
    const bezelT = BEZEL.screen.top / 100 * h
    const bezelB = (BEZEL.screen.top + BEZEL.screen.height) / 100 * h
    const bezelCX = (bezelL + bezelR) / 2
    const bezelCY = (bezelT + bezelB) / 2

    // FIX 1: build exact cell list and map one particle to each cell
    const cells: { col: number; row: number }[] = []
    for (let r = 0; r < ZK_ROWS; r++)
      for (let c = 0; c < ZK_COLS; c++)
        if (ZK_GRID[r][c] === 1) cells.push({ col: c, row: r })

    const originX = bezelCX - ZK_TOTAL_W / 2
    const originY = bezelCY - ZK_TOTAL_H / 2
    const ps: Particle[] = []

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const cell = cells[i]  // one-to-one: no round-robin, no stacking
      const x = originX + cell.col * CELL_SIZE
      const y = originY + cell.row * CELL_SIZE
      ps.push({
        x,
        y,
        vx: 0,
        vy: 0,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
        opacity: 1,
        targetOpacity: 1,
        flickerSpeed: 0.001 + Math.random() * 0.003,
        flickerOffset: Math.random() * Math.PI * 2,
        isZK: true,
        activationTime: 0,
        settled: false,
        evicted: false,
        cellIdx: i,
        revertStartTime: 0,
        homeX: x,
        homeY: y,
        zkOffX: cell.col * CELL_SIZE - ZK_TOTAL_W / 2,
        zkOffY: cell.row * CELL_SIZE - ZK_TOTAL_H / 2,
        targetX: x,
        targetY: y,
        displX: 0,
        displY: 0,
      })
    }
    particlesRef.current = ps

    // FIX 3: bounce starts at bezel center
    bouncePosRef.current = { x: bezelCX, y: bezelCY }
    bounceVelRef.current = {
      vx: BOUNCE_SPEED * (Math.random() < 0.5 ? 1 : -1),
      vy: BOUNCE_SPEED * 0.75 * (Math.random() < 0.5 ? 1 : -1),
    }
    squishRef.current = { x: 1, y: 1 }
  }

  // ── Lift sequence ──────────────────────────────────────────────────────────

  function startLift() {
    const canvas = canvasRef.current
    if (!canvas) return
    phaseRef.current = 'lifting'

    const cx = canvas.width / 2
    const cy = canvas.height / 2

    const toLift = particlesRef.current
      .filter((p) => p.settled)
      .sort((a, b) => Math.hypot(b.x - cx, b.y - cy) - Math.hypot(a.x - cx, a.y - cy))
      .slice(0, PARTICLE_COUNT)  // all settled particles

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
    setTimeout(startSwarm, liftDuration)
  }

  // ── Swarm coalescence ──────────────────────────────────────────────────────

  function startSwarm() {
    const canvas = canvasRef.current
    if (!canvas) return
    phaseRef.current = 'swarm'

    const w = canvas.width
    const h = canvas.height

    // FIX 3 + FIX 5: snake starts at bottom-left of BEZEL screen area
    const bezelL = BEZEL.screen.left / 100 * w
    const bezelR = (BEZEL.screen.left + BEZEL.screen.width) / 100 * w
    const bezelT = BEZEL.screen.top / 100 * h
    const bezelB = (BEZEL.screen.top + BEZEL.screen.height) / 100 * h

    const startX = bezelL + (bezelR - bezelL) * 0.15
    const startY = bezelB - (bezelB - bezelT) * 0.1

    // Pre-populate full trail going LEFT so it fills in immediately
    const snake: { x: number; y: number; age: number }[] = []
    snake.push({ x: startX, y: startY, age: 0 })
    for (let i = 1; i <= MAX_SNAKE_LENGTH; i++) {
      snake.push({
        x: Math.max(bezelL + SNAKE_CELL, startX - i * SNAKE_CELL),
        y: startY,
        age: i * 5,
      })
    }
    snakeRef.current = snake
    snakeDirRef.current = { dc: 1, dr: 0 }  // moving right initially
    snakeMoveTimerRef.current = 0

    snakeParticlesRef.current = particlesRef.current
      .filter((p) => p.targetOpacity >= 0.7)
      .slice(0, SNAKE_HEAD_N + SNAKE_TRAIL_N)

    // PATH A: after display time → slideUp exit (no glitch, no TV-off)
    setTimeout(() => {
      setIntroExiting(true)
    }, SWARM_DISPLAY_MS)
  }

  // ── RAF loop ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      // Also resize portal canvas
      if (swarmCanvasRef.current) {
        swarmCanvasRef.current.width = window.innerWidth
        swarmCanvasRef.current.height = window.innerHeight
      }
    }
    resize()
    window.addEventListener('resize', resize)
    initParticles(canvas.width, canvas.height)
    phaseRef.current = 'screensaver'

    // Size portal canvas (always mounted)
    if (swarmCanvasRef.current) {
      swarmCanvasRef.current.width = window.innerWidth
      swarmCanvasRef.current.height = window.innerHeight
      const sc = swarmCanvasRef.current.getContext('2d')
      if (sc) sc.imageSmoothingEnabled = false
    }

    const ctx = canvas.getContext('2d')!

    function loop() {
      if (!canvas) return
      const w = canvas.width
      const h = canvas.height
      const phase = phaseRef.current
      const mouse = mouseRef.current
      const particles = particlesRef.current
      const floorY = h
      const now = Date.now()

      const isDark = themeRef.current === 'dark'
      const bgColor = isDark ? '#000000' : '#ffffff'
      const pcColor = isDark ? '#ffffff' : '#000000'

      // FIX 3: bezel bounds computed each frame (cheap, responds to resize)
      const bezelL = BEZEL.screen.left / 100 * w
      const bezelR = (BEZEL.screen.left + BEZEL.screen.width) / 100 * w
      const bezelT = BEZEL.screen.top / 100 * h
      const bezelB = (BEZEL.screen.top + BEZEL.screen.height) / 100 * h

      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, w, h)
      ctx.font = '14px "Courier New", monospace'

      if (phase === 'screensaver') {
        // ── FIX 3: bounce within BEZEL bounds ──
        const bp = bouncePosRef.current
        const bv = bounceVelRef.current
        const sq = squishRef.current
        bp.x += bv.vx
        bp.y += bv.vy

        const halfW = ZK_TOTAL_W / 2
        const halfH = ZK_TOTAL_H / 2
        if (bp.x - halfW < bezelL) { bv.vx =  Math.abs(bv.vx); bp.x = bezelL + halfW; sq.x = SQUISH_FACTOR }
        if (bp.x + halfW > bezelR) { bv.vx = -Math.abs(bv.vx); bp.x = bezelR - halfW; sq.x = SQUISH_FACTOR }
        if (bp.y - halfH < bezelT) { bv.vy =  Math.abs(bv.vy); bp.y = bezelT + halfH; sq.y = SQUISH_FACTOR }
        if (bp.y + halfH > bezelB) { bv.vy = -Math.abs(bv.vy); bp.y = bezelB - halfH; sq.y = SQUISH_FACTOR }

        sq.x += (1 - sq.x) * SQUISH_SPRING
        sq.y += (1 - sq.y) * SQUISH_SPRING

        for (const p of particles) {
          // Warp decay
          p.displX *= (1 - WARP_SPRING)
          p.displY *= (1 - WARP_SPRING)

          const baseX = bp.x + p.zkOffX * sq.x
          const baseY = bp.y + p.zkOffY * sq.y

          // FIX 2: WARP_RADIUS = 55 — cursor push, outward only
          const cdx = baseX - mouse.x
          const cdy = baseY - mouse.y
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
        for (const p of particles) {
          if (!p.settled) {
            p.vy += GRAVITY
            if (p.y >= floorY && p.vy > 0) {
              p.vy *= -0.40
              p.y = floorY
              p.vx *= 0.78
              if (Math.abs(p.vy) < 0.9) {
                p.vy = 0
                p.settled = true
              }
            }
            p.x += p.vx
            p.y += p.vy
            p.vx *= 0.996
          }
          const targetOp = p.settled ? 0.08 : 0.55
          p.opacity += (targetOp - p.opacity) * 0.05
        }
      } else if (phase === 'lifting') {
        for (const p of particles) {
          if (!p.settled) {
            p.vx *= 0.98
            p.vy *= 0.98
            p.x += p.vx
            p.y += p.vy
          } else {
            p.opacity *= 0.97
          }
          p.opacity += (p.targetOpacity - p.opacity) * 0.1
        }
      } else if (phase === 'swarm') {
        // Background particles fade out
        for (const p of particles) {
          p.opacity *= 0.97
          p.x += p.vx * 0.95
          p.y += p.vy * 0.95
        }

        // FIX 3 + FIX 5: snake moves within BEZEL bounds
        snakeMoveTimerRef.current++
        if (snakeMoveTimerRef.current >= SNAKE_MOVE_INTERVAL) {
          snakeMoveTimerRef.current = 0
          const dir = snakeDirRef.current
          const snake = snakeRef.current

          if (Math.random() < 0.25) {
            const dirs = [
              { dc: 1, dr: 0 }, { dc: -1, dr: 0 },
              { dc: 0, dr: 1 }, { dc: 0, dr: -1 },
            ].filter((d) => !(d.dc === -dir.dc && d.dr === -dir.dr))
            snakeDirRef.current = dirs[Math.floor(Math.random() * dirs.length)]
          }

          const head = snake[0]
          snake.unshift({
            x: Math.max(bezelL + SNAKE_CELL, Math.min(bezelR - SNAKE_CELL, head.x + snakeDirRef.current.dc * SNAKE_CELL)),
            y: Math.max(bezelT + SNAKE_CELL, Math.min(bezelB - SNAKE_CELL, head.y + snakeDirRef.current.dr * SNAKE_CELL)),
            age: 0,
          })
          if (snake.length > MAX_SNAKE_LENGTH + 1) snake.pop()
        }

        for (const cell of snakeRef.current) cell.age++

        // FIX 5: new snake particle assignment — head circle + tapered trail
        const snake = snakeRef.current
        const snakePs = snakeParticlesRef.current

        snakePs.forEach((p, i) => {
          if (i < SNAKE_HEAD_N) {
            // HEAD: tight circular cluster at snake[0]
            const headCell = snake[0]
            const angle = p.flickerOffset * 7.3
            const radius = (i / SNAKE_HEAD_N) * HEAD_RADIUS
            p.targetX = headCell.x + Math.cos(angle) * radius
            p.targetY = headCell.y + Math.sin(angle) * radius
            p.targetOpacity = 0.9 + 0.1 * Math.sin(now * p.flickerSpeed + p.flickerOffset)
          } else {
            // TRAIL: tapered from head width down to a point
            const trailIdx = i - SNAKE_HEAD_N
            const t = trailIdx / SNAKE_TRAIL_N  // 0=near head, 1=tail tip
            const cellIdx = Math.min(1 + Math.floor(t * (snake.length - 1)), snake.length - 1)
            const cell = snake[cellIdx]

            // Radius tapers from HEAD_RADIUS to ~5% at tail end
            const radius = HEAD_RADIUS * (1 - t * 0.95)
            // Slow organic oscillation — consistent per particle (no per-frame random)
            const slowNoise = Math.sin(now * 0.0003 + i * 0.8) * 0.4
            const jitterAngle = p.flickerOffset * 5 + t * 2.5 + slowNoise
            const jitterR = radius * (0.25 + 0.75 * Math.abs(Math.sin(p.flickerOffset * 3 + trailIdx * 0.19)))
            p.targetX = cell.x + Math.cos(jitterAngle) * jitterR
            p.targetY = cell.y + Math.sin(jitterAngle) * jitterR
            p.targetOpacity = 0.7 - 0.6 * t  // 0.7 near head → 0.1 at tail
          }

          p.vx += (p.targetX - p.x) * SNAKE_SPRING
          p.vy += (p.targetY - p.y) * SNAKE_SPRING
          p.vx *= SNAKE_DAMPING
          p.vy *= SNAKE_DAMPING
          p.x += p.vx
          p.y += p.vy
          p.opacity += (p.targetOpacity - p.opacity) * 0.08
        })
      }

      // ── Draw main canvas ──
      for (const p of particles) {
        if (p.opacity < 0.01) continue
        ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity))
        ctx.fillStyle = pcColor
        ctx.fillText(p.char, p.x, p.y)
      }
      ctx.globalAlpha = 1

      // ── Portal swarm canvas ──
      // PATH A (swarm phase): renders spring-physics snake
      // PATH B (screensaver + scroll): renders scroll-driven trail
      if (swarmCanvasRef.current) {
        const sc = swarmCanvasRef.current.getContext('2d')
        if (sc) {
          sc.clearRect(0, 0, w, h)

          if (phase === 'swarm' && snakeParticlesRef.current.length > 0) {
            // PATH A snake — spring-physics particles on portal canvas
            sc.font = '14px "Courier New", monospace'
            for (const p of snakeParticlesRef.current) {
              if (p.opacity < 0.01) continue
              sc.globalAlpha = Math.max(0, Math.min(1, p.opacity))
              sc.fillStyle = pcColor
              sc.fillText(p.char, p.x, p.y)
            }
            sc.globalAlpha = 1
          } else if (phase === 'screensaver') {
            // PATH B: scroll-driven trail from ZK center downward
            const sectionTop = canvasRef.current?.getBoundingClientRect().top ?? 0
            const scrollProg = Math.max(0, Math.min(1, -sectionTop / h))

            if (scrollProg > 0.03) {
              const zkX = bouncePosRef.current.x
              const zkY = bouncePosRef.current.y
              const bezelHeightPx = bezelB - bezelT
              const headY = zkY + scrollProg * bezelHeightPx * 1.3
              const TRAIL_N = 60

              sc.font = '14px "Courier New", monospace'
              for (let i = 0; i < TRAIL_N && i < particles.length; i++) {
                const p = particles[i]
                const t = i / TRAIL_N
                // Slight horizontal wiggle using each particle's unique offset
                const px = zkX + Math.sin(t * Math.PI * 3 + p.flickerOffset) * 8 * (1 - t * 0.6)
                const py = zkY + t * (headY - zkY)
                const alpha = Math.min(1, scrollProg * 3) * (0.1 + (1 - t) * 0.55)
                if (alpha < 0.01) continue
                sc.globalAlpha = alpha
                sc.fillStyle = pcColor
                sc.fillText(p.char, px, py)
              }
              sc.globalAlpha = 1
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

  // ── Event handlers ──────────────────────────────────────────────────────────

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      }
    }

    function onClick() {
      if (phaseRef.current !== 'screensaver') return

      // PATH A flag
      userClickedRef.current = true

      // Snap warp displacements
      for (const p of particlesRef.current) { p.displX = 0; p.displY = 0 }

      // Explosion from bounce center
      const bcx = bouncePosRef.current.x
      const bcy = bouncePosRef.current.y
      for (const p of particlesRef.current) {
        const angle = Math.atan2(p.y - bcy, p.x - bcx)
        const speed = 9 + Math.random() * 13
        p.vx = Math.cos(angle) * speed + (Math.random() - 0.5) * 5
        p.vy = Math.sin(angle) * speed - (1.5 + Math.random() * 7)
        p.settled = false
        p.isZK = false
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

  // ── Typing sequence ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!showTyping) return
    const fullText = 'zachary kaplan'
    let i = 0
    const typeInterval = setInterval(() => {
      i++
      setTypedText(fullText.slice(0, i))
      if (i >= fullText.length) {
        clearInterval(typeInterval)
        setTimeout(() => { startLift() }, 800)
      }
    }, 78)
    return () => clearInterval(typeInterval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTyping])

  // ── Blinking cursor ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!showTyping) return
    const blinkInterval = setInterval(() => setShowBlink((prev) => !prev), 530)
    return () => clearInterval(blinkInterval)
  }, [showTyping])

  // ─── Derived colors ────────────────────────────────────────────────────────

  const particleColor = theme === 'dark' ? '#ffffff' : '#000000'

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Portal canvas — always mounted, used for PATH A snake and PATH B scroll trail.
          Lives in document.body so it's unaffected by any transform on this section. */}
      {createPortal(
        <canvas
          ref={swarmCanvasRef}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 50,
            pointerEvents: 'none',
          }}
        />,
        document.body
      )}

      {/* FIX 4: simple slideUp exit for PATH A — no TV-off, no glitch, no powerOffVariants.
          PATH B: user just scrolls past this section naturally; no animation fires. */}
      <motion.section
        className={`relative w-full h-screen overflow-hidden select-none ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}
        style={{ cursor: 'crosshair' }}
        initial={{ opacity: 1, y: 0 }}
        animate={introExiting ? { opacity: 0, y: -30 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
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
