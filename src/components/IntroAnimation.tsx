import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'
import { BEZEL } from '@/config/bezel'

// ─── Constants ────────────────────────────────────────────────────────────────

const CHARS = '0123456789!@#$%^&*()_-+=[]{}|;:,./<>?~`\'"\\abcdefghijklmnopqrstuvwxyz'
const PARTICLE_COUNT = 3000
const GRAVITY = 0.3
const CELL_SIZE = 26
const ZK_ROWS = 18
const ZK_COLS = 30
const ZK_TOTAL_W = (ZK_COLS - 1) * CELL_SIZE  // 754px
const ZK_TOTAL_H = (ZK_ROWS - 1) * CELL_SIZE  // 442px

// Screensaver bounce
const BOUNCE_SPEED = 1.2
const SQUISH_FACTOR = 0.85
const SQUISH_SPRING = 0.12

// Hover warp
const WARP_RADIUS = 120
const WARP_STRENGTH = 50
const WARP_SPRING = 0.15

// Lift sequence
const LIFT_STAGGER_MS = 15
const LIFT_SPEED_MIN = 3
const LIFT_SPEED_MAX = 7
const LIFT_PARTICLE_COUNT = 400

// Snake swarm
const SNAKE_CELL = 22
const SNAKE_MOVE_INTERVAL = 7
const MAX_SNAKE_LENGTH = 50
const SNAKE_TOTAL_PARTICLES = 250
const SNAKE_SPRING = 0.10
const SNAKE_DAMPING = 0.80
const SWARM_DISPLAY_MS = 2000

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

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'screensaver' | 'exploding' | 'typing' | 'lifting' | 'swarm' | 'outro'

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
  displX: number   // hover warp displacement
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
  const glitchRef = useRef<{ active: boolean; offsetX: number }>({ active: false, offsetX: 0 })
  const themeRef = useRef(theme)

  // Screensaver bounce state
  const bouncePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const bounceVelRef = useRef<{ vx: number; vy: number }>({ vx: 1.2, vy: 0.9 })
  const squishRef = useRef<{ x: number; y: number }>({ x: 1, y: 1 })

  // Snake swarm state
  const snakeRef = useRef<{ x: number; y: number; age: number }[]>([])
  const snakeDirRef = useRef<{ dc: number; dr: number }>({ dc: 0, dr: 1 })
  const snakeMoveTimerRef = useRef<number>(0)
  const snakeParticlesRef = useRef<Particle[]>([])

  const [showTyping, setShowTyping] = useState(false)
  const [typedText, setTypedText] = useState('')
  const [showBlink, setShowBlink] = useState(true)
  const [exitPhase, setExitPhase] = useState(false)
  const [swarmActive, setSwarmActive] = useState(false)

  useEffect(() => {
    themeRef.current = theme
  }, [theme])

  // ── Particle init ──────────────────────────────────────────────────────────

  function initParticles(w: number, h: number) {
    // Build ZK cell list
    const cells: { col: number; row: number }[] = []
    for (let r = 0; r < ZK_ROWS; r++)
      for (let c = 0; c < ZK_COLS; c++)
        if (ZK_GRID[r][c] === 1) cells.push({ col: c, row: r })

    const originX = w / 2 - ZK_TOTAL_W / 2
    const originY = h / 2 - ZK_TOTAL_H / 2
    const ps: Particle[] = []

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const cell = cells[i % cells.length]
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
        cellIdx: i % cells.length,
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

    // Init bounce state
    bouncePosRef.current = { x: w / 2, y: h / 2 }
    bounceVelRef.current = {
      vx: BOUNCE_SPEED * (Math.random() < 0.5 ? 1 : -1),
      vy: BOUNCE_SPEED * 0.75 * (Math.random() < 0.5 ? 1 : -1),
    }
    squishRef.current = { x: 1, y: 1 }
  }

  // ── Glitch sequence ────────────────────────────────────────────────────────

  function runGlitch(onComplete: () => void) {
    const flashes = [
      { dur: 60, gap: 45, ox: 4 + Math.floor(Math.random() * 5) },
      { dur: 75, gap: 50, ox: 5 + Math.floor(Math.random() * 4) },
      { dur: 50, gap: 35, ox: 4 + Math.floor(Math.random() * 5) },
      { dur: 65, gap: 0,  ox: 6 + Math.floor(Math.random() * 3) },
    ]
    let t = 0
    for (const f of flashes) {
      const startT = t
      const { ox } = f
      setTimeout(() => { glitchRef.current = { active: true, offsetX: ox } }, startT)
      t += f.dur
      const endT = t
      setTimeout(() => { glitchRef.current = { active: false, offsetX: 0 } }, endT)
      t += f.gap
    }
    setTimeout(onComplete, t)
  }

  // ── Lift sequence ──────────────────────────────────────────────────────────

  function startLift() {
    const canvas = canvasRef.current
    if (!canvas) return
    phaseRef.current = 'lifting'

    const cx = canvas.width / 2
    const cy = canvas.height / 2

    // Take settled particles, outermost from canvas center first
    const toLift = particlesRef.current
      .filter((p) => p.settled)
      .sort((a, b) => Math.hypot(b.x - cx, b.y - cy) - Math.hypot(a.x - cx, a.y - cy))
      .slice(0, LIFT_PARTICLE_COUNT)

    toLift.forEach((p, i) => {
      const delay = Math.floor(i / 10) * LIFT_STAGGER_MS
      setTimeout(() => {
        p.settled = false
        p.vy = -(LIFT_SPEED_MIN + Math.random() * (LIFT_SPEED_MAX - LIFT_SPEED_MIN))
        p.vx = (Math.random() - 0.5) * 2
        p.targetOpacity = 1.0
        setTimeout(() => {
          p.targetOpacity = 0.7
        }, 80)
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
    setSwarmActive(true)

    snakeRef.current = [{ x: canvas.width / 2, y: canvas.height / 2, age: 0 }]
    snakeDirRef.current = { dc: 0, dr: 1 }
    snakeMoveTimerRef.current = 0

    snakeParticlesRef.current = particlesRef.current
      .filter((p) => p.targetOpacity >= 0.7)
      .slice(0, SNAKE_TOTAL_PARTICLES)

    setTimeout(() => {
      runGlitch(() => setExitPhase(true))
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
    }
    resize()
    window.addEventListener('resize', resize)
    initParticles(canvas.width, canvas.height)
    phaseRef.current = 'screensaver'

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
      const particleColor = isDark ? '#ffffff' : '#000000'

      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, w, h)
      ctx.font = '14px "Courier New", monospace'

      const isGlitching = glitchRef.current.active
      const glitchOffX = glitchRef.current.offsetX

      if (phase === 'screensaver') {
        // ── Bounce center update ──
        const bp = bouncePosRef.current
        const bv = bounceVelRef.current
        const sq = squishRef.current
        bp.x += bv.vx
        bp.y += bv.vy

        const halfW = ZK_TOTAL_W / 2
        const halfH = ZK_TOTAL_H / 2
        if (bp.x - halfW < 0)  { bv.vx =  Math.abs(bv.vx); bp.x = halfW;     sq.x = SQUISH_FACTOR }
        if (bp.x + halfW > w)  { bv.vx = -Math.abs(bv.vx); bp.x = w - halfW; sq.x = SQUISH_FACTOR }
        if (bp.y - halfH < 0)  { bv.vy =  Math.abs(bv.vy); bp.y = halfH;     sq.y = SQUISH_FACTOR }
        if (bp.y + halfH > h)  { bv.vy = -Math.abs(bv.vy); bp.y = h - halfH; sq.y = SQUISH_FACTOR }

        // Spring squish back to 1
        sq.x += (1 - sq.x) * SQUISH_SPRING
        sq.y += (1 - sq.y) * SQUISH_SPRING

        for (const p of particles) {
          // Warp decay
          p.displX *= (1 - WARP_SPRING)
          p.displY *= (1 - WARP_SPRING)

          // Base position with squish applied to offsets
          const baseX = bp.x + p.zkOffX * sq.x
          const baseY = bp.y + p.zkOffY * sq.y

          // Cursor warp — outward push only
          const cdx = baseX - mouse.x
          const cdy = baseY - mouse.y
          const cdist = Math.hypot(cdx, cdy)
          if (cdist > 0 && cdist < WARP_RADIUS) {
            const force = (1 - cdist / WARP_RADIUS) ** 2 * WARP_STRENGTH
            p.displX += (cdx / cdist) * force
            p.displY += (cdy / cdist) * force
          }
          // Clamp displacement magnitude
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
        // Non-snake particles fade out
        for (const p of particles) {
          p.opacity *= 0.97
          p.x += p.vx * 0.95
          p.y += p.vy * 0.95
        }

        // Advance snake head
        snakeMoveTimerRef.current++
        if (snakeMoveTimerRef.current >= SNAKE_MOVE_INTERVAL) {
          snakeMoveTimerRef.current = 0
          const dir = snakeDirRef.current
          const snake = snakeRef.current

          // Maybe turn (25% chance, cannot reverse 180°)
          if (Math.random() < 0.25) {
            const dirs = [
              { dc: 1, dr: 0 }, { dc: -1, dr: 0 },
              { dc: 0, dr: 1 }, { dc: 0, dr: -1 },
            ].filter((d) => !(d.dc === -dir.dc && d.dr === -dir.dr))
            snakeDirRef.current = dirs[Math.floor(Math.random() * dirs.length)]
          }

          const head = snake[0]
          snake.unshift({
            x: Math.max(SNAKE_CELL, Math.min(w - SNAKE_CELL, head.x + snakeDirRef.current.dc * SNAKE_CELL)),
            y: Math.max(SNAKE_CELL, Math.min(h - SNAKE_CELL, head.y + snakeDirRef.current.dr * SNAKE_CELL)),
            age: 0,
          })
          if (snake.length > MAX_SNAKE_LENGTH) snake.pop()
        }

        // Age all cells
        for (const cell of snakeRef.current) cell.age++

        // Assign snake particles to cells + spring physics
        const snake = snakeRef.current
        const snakePs = snakeParticlesRef.current
        const ppc = Math.max(1, Math.ceil(snakePs.length / Math.max(1, snake.length)))

        snakePs.forEach((p, i) => {
          const cell = snake[Math.min(Math.floor(i / ppc), snake.length - 1)]
          p.targetX = cell.x + (Math.random() - 0.5) * 5
          p.targetY = cell.y + (Math.random() - 0.5) * 5

          const t = i / snakePs.length
          p.targetOpacity =
            t < 0.08
              ? 0.8 + Math.random() * 0.2             // HEAD — bright
              : t < 0.5
                ? 0.3 + (1 - t * 2) * 0.4             // BODY — medium
                : Math.max(0.05, 0.25 - cell.age * 0.008) // TAIL — dim

          p.vx += (p.targetX - p.x) * SNAKE_SPRING
          p.vy += (p.targetY - p.y) * SNAKE_SPRING
          p.vx *= SNAKE_DAMPING
          p.vy *= SNAKE_DAMPING
          p.x += p.vx
          p.y += p.vy
          p.opacity += (p.targetOpacity - p.opacity) * 0.08
        })
      } else if (phase === 'outro') {
        for (const p of particles) {
          if (!p.settled) {
            p.vy += GRAVITY * 0.4
            if (p.y >= floorY && p.vy > 0) {
              p.vy = 0
              p.vx *= 0.6
              p.settled = true
              p.y = floorY
            }
            p.x += p.vx
            p.y += p.vy
          }
          p.opacity *= 0.96
        }
      }

      // ── Draw main canvas ──
      for (const p of particles) {
        if (p.opacity < 0.01) continue
        ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity))
        if (isGlitching) {
          ctx.fillStyle = 'rgba(255,0,0,0.85)'
          ctx.fillText(p.char, p.x - glitchOffX, p.y)
          ctx.fillStyle = 'rgba(0,255,255,0.85)'
          ctx.fillText(p.char, p.x + glitchOffX, p.y)
        }
        ctx.fillStyle = particleColor
        ctx.fillText(p.char, p.x, p.y)
      }
      ctx.globalAlpha = 1

      // ── Draw portal swarm canvas (snake survives TV-off) ──
      if (swarmCanvasRef.current) {
        const sc = swarmCanvasRef.current.getContext('2d')
        if (sc) {
          sc.clearRect(0, 0, w, h)
          sc.font = '14px "Courier New", monospace'
          for (const p of snakeParticlesRef.current) {
            if (p.opacity < 0.01) continue
            sc.globalAlpha = Math.max(0, Math.min(1, p.opacity))
            sc.fillStyle = particleColor
            sc.fillText(p.char, p.x, p.y)
          }
          sc.globalAlpha = 1
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

  // ── Portal canvas sizing ────────────────────────────────────────────────────

  useEffect(() => {
    if (!swarmActive || !swarmCanvasRef.current) return
    swarmCanvasRef.current.width = window.innerWidth
    swarmCanvasRef.current.height = window.innerHeight
    const ctx = swarmCanvasRef.current.getContext('2d')
    if (ctx) ctx.imageSmoothingEnabled = false
  }, [swarmActive])

  // ── Event handlers ──────────────────────────────────────────────────────────

  useEffect(() => {
    function toCanvasCoords(clientX: number, clientY: number) {
      const canvas = canvasRef.current
      if (!canvas) return { x: clientX, y: clientY }
      const rect = canvas.getBoundingClientRect()
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height),
      }
    }

    function onMouseMove(e: MouseEvent) {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      }
    }

    function onClick(e: MouseEvent) {
      if (phaseRef.current !== 'screensaver') return

      // Snap warp displacements to zero before explosion
      for (const p of particlesRef.current) {
        p.displX = 0
        p.displY = 0
      }

      // Explosion from bounce center (ZK center) — not cursor position
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

      // Satisfy linting — toCanvasCoords used only to read coords if needed
      void toCanvasCoords(e.clientX, e.clientY)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('click', onClick)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setTimeout(() => {
          startLift()
        }, 800)
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

  // ─── CRT power-off variants ────────────────────────────────────────────────

  const powerOffVariants = {
    normal: {
      scaleY: 1,
      scaleX: 1,
      opacity: 1,
      filter: 'brightness(1) hue-rotate(0deg)',
    },
    off: {
      scaleY: [1,     0.015, 0.015, 0.015, 0   ],
      scaleX: [1,     1,     1,     0.04,  0   ],
      opacity: [1,    1,     1,     1,     0   ],
      filter: [
        'brightness(1) hue-rotate(0deg)',
        'brightness(3) hue-rotate(20deg)',
        'brightness(2) hue-rotate(15deg)',
        'brightness(5) hue-rotate(0deg)',
        'brightness(0) hue-rotate(0deg)',
      ],
      transition: {
        duration: 0.55,
        times: [0, 0.36, 0.55, 0.82, 1.0],
        ease: 'linear' as const,
      },
    },
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Portal swarm canvas — outside motion.section, survives TV-off collapse */}
      {swarmActive &&
        createPortal(
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

      <motion.section
        className={`relative w-full h-screen overflow-hidden select-none ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}
        style={{ cursor: 'crosshair', transformOrigin: `50% ${BEZEL.transformOriginY}%` }}
        variants={powerOffVariants}
        animate={exitPhase ? 'off' : 'normal'}
        onAnimationComplete={() => {
          if (exitPhase) {
            setIntroComplete(true)
            setIntroVisible(false)
          }
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0" />

        {/* Terminal typeout */}
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
