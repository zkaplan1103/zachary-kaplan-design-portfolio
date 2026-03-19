import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'
import { BEZEL } from '@/config/bezel'

// ─── Grid scaling (nearest-neighbor) ─────────────────────────────────────────

function scaleGrid(src: number[][], targetRows: number, targetCols: number): number[][] {
  const srcRows = src.length
  const srcCols = src[0].length
  return Array.from({ length: targetRows }, (_, r) =>
    Array.from({ length: targetCols }, (_, c) => {
      const sr = Math.min(srcRows - 1, Math.round((r * (srcRows - 1)) / (targetRows - 1)))
      const sc = Math.min(srcCols - 1, Math.round((c * (srcCols - 1)) / (targetCols - 1)))
      return src[sr][sc]
    })
  )
}

// ─── ZK Grid Data (source: 18 rows × 14 cols pixel art) ──────────────────────

const Z_GRID_SRC: number[][] = [
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

const K_GRID_SRC: number[][] = [
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

// Scale to 52 rows: Z→42 cols, K→43 cols, gap=2 → 87 cols total
const ZK_ROWS       = 52
const Z_COLS_SCALED = 42
const K_COLS_SCALED = 43
const ZK_COLS       = Z_COLS_SCALED + 2 + K_COLS_SCALED  // 87

const Z_GRID_SCALED = scaleGrid(Z_GRID_SRC, ZK_ROWS, Z_COLS_SCALED)
const K_GRID_SCALED = scaleGrid(K_GRID_SRC, ZK_ROWS, K_COLS_SCALED)
const ZK_GRID: number[][] = Z_GRID_SCALED.map((zRow, r) => [...zRow, 0, 0, ...K_GRID_SCALED[r]])

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
const CELL_SIZE  = 9
const ZK_TOTAL_W = (ZK_COLS - 1) * CELL_SIZE   // 86 × 9 = 774
const ZK_TOTAL_H = (ZK_ROWS - 1) * CELL_SIZE   // 51 × 9 = 459

const CHARS = '0123456789!@#$%^&*()_-+=[]{}|;:,./<>?~`\'"\\abcdefghijklmnopqrstuvwxyz'

const PARTICLE_COUNT = ZK_GRID.reduce((sum, row) => sum + row.filter((v) => v === 1).length, 0)

const GRAVITY     = 0.3
const BOUNCE_SPEED = 0.9

const WARP_RADIUS   = 55
const WARP_STRENGTH = 50
const WARP_SPRING   = 0.15

const LIFT_STAGGER_MS = 15
const LIFT_SPEED_MIN  = 3
const LIFT_SPEED_MAX  = 7
const LIFT_BATCH      = 100  // particles per stagger batch

const COALESCE_SPRING  = 0.05
const COALESCE_DAMPING = 0.82
const COALESCE_SCATTER = 30

const SNAKE_CELL          = 22
const SNAKE_MOVE_INTERVAL = 7
const SNAKE_LERP          = 0.2
const HEAD_BASE_R         = 28
const HEAD_BREATH_AMP     = 6
const PATH_HISTORY_LEN    = 150
const SWARM_DISPLAY_MS    = 1500

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase   = 'screensaver' | 'exploding' | 'typing' | 'lifting' | 'coalescing' | 'swarm'
type HitWall = 'left' | 'right' | 'top' | 'bottom' | null

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

interface CometParticle {
  baseAngle: number   // head: orbital base angle
  baseR: number       // head: orbit radius (scaled by HEAD_BASE_R)
  opacity: number
  char: string
  histIdx: number     // tail: index into pathHistoryRef
  jitterX: number     // tail: static x offset from path position
  jitterY: number     // tail: static y offset from path position
  isHead: boolean
}

// ─── Comet factory (pure — no React deps) ────────────────────────────────────

function createCometParticles(): CometParticle[] {
  const ps: CometParticle[] = []
  // 60 head particles — tight breathing orbit
  for (let i = 0; i < 60; i++) {
    const baseAngle = (i / 60) * Math.PI * 2 + Math.random() * 0.4
    const baseR     = HEAD_BASE_R * (0.3 + Math.random() * 0.7)
    ps.push({
      baseAngle, baseR,
      opacity: 0.85 + Math.random() * 0.15,
      char: CHARS[Math.floor(Math.random() * CHARS.length)],
      histIdx: 0, jitterX: 0, jitterY: 0,
      isHead: true,
    })
  }
  // 220 tail particles — sample path history at varying depths
  for (let i = 0; i < 220; i++) {
    const t      = i / 220
    const spread = 4 + t * 22
    ps.push({
      baseAngle: 0, baseR: 0,
      opacity: 0.7 * Math.pow(1 - t, 1.4),
      char: CHARS[Math.floor(Math.random() * CHARS.length)],
      histIdx: Math.floor(t * (PATH_HISTORY_LEN - 1)),
      jitterX: (Math.random() - 0.5) * spread,
      jitterY: (Math.random() - 0.5) * spread,
      isHead: false,
    })
  }
  return ps
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
  const userClickedRef = useRef<boolean>(false)

  const screenRectRef = useRef<ScreenRect>(computeScreenRect())
  const [screenDims, setScreenDims] = useState<ScreenRect>(() => computeScreenRect())

  // Screensaver bounce — canvas-local coords (0,0 = bezel screen top-left)
  const bouncePosRef    = useRef({ x: 0, y: 0 })
  const bounceVelRef    = useRef({ vx: BOUNCE_SPEED, vy: BOUNCE_SPEED * 0.75 })
  const hitWallRef      = useRef<HitWall>(null)
  const deformAmountRef = useRef(0)

  // Snake comet
  const snakeHeadPxRef     = useRef({ x: 0, y: 0 })
  const snakeTargetRef     = useRef({ x: 0, y: 0 })
  const snakeDirRef        = useRef({ dx: 1, dy: 0 })
  const snakeMoveTimerRef  = useRef(0)
  const pathHistoryRef     = useRef<{ x: number; y: number }[]>([])
  const snakeActiveRef     = useRef(false)
  const snakeBridgeModeRef = useRef(false)
  const cometPsRef         = useRef<CometParticle[]>([])
  const breathPhaseRef     = useRef(0)

  const [showTyping,   setShowTyping]   = useState(false)
  const [typedText,    setTypedText]    = useState('')
  const [showBlink,    setShowBlink]    = useState(true)
  const [introExiting, setIntroExiting] = useState(false)

  useEffect(() => { themeRef.current = theme }, [theme])

  // ── Particle init ──────────────────────────────────────────────────────────
  // All coords canvas-local: (0,0) = bezel screen top-left, (sw,sh) = bottom-right

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
    hitWallRef.current      = null
    deformAmountRef.current = 0
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

    toLift.forEach((p, i) => {
      const delay = Math.floor(i / LIFT_BATCH) * LIFT_STAGGER_MS
      setTimeout(() => {
        p.settled = false
        p.vy = -(LIFT_SPEED_MIN + Math.random() * (LIFT_SPEED_MAX - LIFT_SPEED_MIN))
        p.vx = (Math.random() - 0.5) * 2
        p.targetOpacity = 1.0
        setTimeout(() => { p.targetOpacity = 0.7 }, 80)
      }, delay)
    })

    const liftDuration = Math.ceil(toLift.length / LIFT_BATCH) * LIFT_STAGGER_MS + 800
    setTimeout(startCoalesce, liftDuration)
  }

  // ── Coalesce ───────────────────────────────────────────────────────────────

  function startCoalesce() {
    phaseRef.current = 'coalescing'
    setTimeout(startSwarm, 600)
  }

  // ── Swarm ──────────────────────────────────────────────────────────────────

  function startSwarm() {
    const canvas = canvasRef.current
    if (!canvas) return
    phaseRef.current = 'swarm'

    const sw = canvas.width
    const sh = canvas.height
    const { sl, st } = screenRectRef.current

    const startX = sw * 0.15
    const startY = sh * 0.85

    snakeHeadPxRef.current     = { x: startX, y: startY }
    snakeTargetRef.current     = { x: startX, y: startY }
    snakeDirRef.current        = { dx: 1, dy: 0 }
    snakeMoveTimerRef.current  = 0
    snakeActiveRef.current     = true
    snakeBridgeModeRef.current = false
    breathPhaseRef.current     = 0

    pathHistoryRef.current = Array.from({ length: PATH_HISTORY_LEN }, () => ({
      x: startX + sl,
      y: startY + st,
    }))

    cometPsRef.current = createCometParticles()

    // PATH A: bridge toward top + slideUp after display time
    setTimeout(() => {
      snakeBridgeModeRef.current = true
      setIntroExiting(true)
    }, SWARM_DISPLAY_MS)
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

      // Fix 1: transparent canvas — section CSS bg provides background color
      ctx.clearRect(0, 0, w, h)
      ctx.font = `${FONT_SIZE}px "IBM Plex Mono", monospace`

      if (phase === 'screensaver') {
        const bp = bouncePosRef.current
        const bv = bounceVelRef.current
        bp.x += bv.vx
        bp.y += bv.vy

        // Fix 3: fixed half-dims — no squish, just inset buffer
        const halfW = ZK_TOTAL_W / 2 + 4
        const halfH = ZK_TOTAL_H / 2 + 4

        if (bp.x - halfW < 0) { bv.vx =  Math.abs(bv.vx); bp.x = halfW;     hitWallRef.current = 'left';   deformAmountRef.current = 0.35 }
        if (bp.x + halfW > w) { bv.vx = -Math.abs(bv.vx); bp.x = w - halfW; hitWallRef.current = 'right';  deformAmountRef.current = 0.35 }
        if (bp.y - halfH < 0) { bv.vy =  Math.abs(bv.vy); bp.y = halfH;     hitWallRef.current = 'top';    deformAmountRef.current = 0.35 }
        if (bp.y + halfH > h) { bv.vy = -Math.abs(bv.vy); bp.y = h - halfH; hitWallRef.current = 'bottom'; deformAmountRef.current = 0.35 }

        const da = deformAmountRef.current
        deformAmountRef.current *= 0.88
        const hw = hitWallRef.current

        for (const p of particles) {
          p.displX *= (1 - WARP_SPRING)
          p.displY *= (1 - WARP_SPRING)

          // Fix 3: spatial deformation — side nearest the hit wall compresses inward
          const normX = p.zkOffX / (ZK_TOTAL_W / 2)
          const normY = p.zkOffY / (ZK_TOTAL_H / 2)
          let deformOffX = p.zkOffX
          let deformOffY = p.zkOffY
          if (hw === 'left')   deformOffX = p.zkOffX * (1 - da * Math.max(0, -normX))
          if (hw === 'right')  deformOffX = p.zkOffX * (1 - da * Math.max(0,  normX))
          if (hw === 'top')    deformOffY = p.zkOffY * (1 - da * Math.max(0, -normY))
          if (hw === 'bottom') deformOffY = p.zkOffY * (1 - da * Math.max(0,  normY))

          const baseX = bp.x + deformOffX
          const baseY = bp.y + deformOffY

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

      } else if (phase === 'lifting') {
        for (const p of particles) {
          if (!p.settled) {
            p.vx *= 0.98; p.vy *= 0.98
            p.x  += p.vx; p.y  += p.vy
          } else {
            p.opacity *= 0.97
          }
          p.opacity += (p.targetOpacity - p.opacity) * 0.1
        }

      } else if (phase === 'coalescing') {
        for (const p of particles) {
          if (p.opacity < 0.01) continue
          const tx = w * 0.15 + Math.cos(p.flickerOffset) * COALESCE_SCATTER
          const ty = h * 0.85 + Math.sin(p.flickerOffset) * COALESCE_SCATTER
          p.vx += (tx - p.x) * COALESCE_SPRING
          p.vy += (ty - p.y) * COALESCE_SPRING
          p.vx *= COALESCE_DAMPING
          p.vy *= COALESCE_DAMPING
          p.x  += p.vx
          p.y  += p.vy
          p.opacity += (0.6 - p.opacity) * 0.05
        }

      } else if (phase === 'swarm') {
        for (const p of particles) {
          p.opacity *= 0.96
          p.x += p.vx * 0.92
          p.y += p.vy * 0.92
        }

        if (snakeBridgeModeRef.current) {
          // Fix 5: bridge — steer head toward top of canvas (hero area after slideUp)
          snakeTargetRef.current = { x: snakeTargetRef.current.x, y: h * 0.1 }
        } else {
          snakeMoveTimerRef.current++
          if (snakeMoveTimerRef.current >= SNAKE_MOVE_INTERVAL) {
            snakeMoveTimerRef.current = 0
            const dir = snakeDirRef.current

            if (Math.random() < 0.25) {
              const dirs = [
                { dx:  1, dy:  0 }, { dx: -1, dy:  0 },
                { dx:  0, dy:  1 }, { dx:  0, dy: -1 },
              ].filter((d) => !(d.dx === -dir.dx && d.dy === -dir.dy))
              snakeDirRef.current = dirs[Math.floor(Math.random() * dirs.length)]
            }

            const buf  = HEAD_BASE_R + 4
            const newX = Math.max(buf, Math.min(w - buf, snakeTargetRef.current.x + snakeDirRef.current.dx * SNAKE_CELL))
            const newY = Math.max(buf, Math.min(h - buf, snakeTargetRef.current.y + snakeDirRef.current.dy * SNAKE_CELL))
            snakeTargetRef.current = { x: newX, y: newY }
          }
        }

        const head = snakeHeadPxRef.current
        head.x += (snakeTargetRef.current.x - head.x) * SNAKE_LERP
        head.y += (snakeTargetRef.current.y - head.y) * SNAKE_LERP

        const { sl, st } = screenRectRef.current
        const hist = pathHistoryRef.current
        hist.unshift({ x: head.x + sl, y: head.y + st })
        if (hist.length > PATH_HISTORY_LEN) hist.pop()

        breathPhaseRef.current += 0.028
      }

      // ── Draw ZK particles on main canvas (fillText only) ─────────────────
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

      // ── Portal canvas: character comet (Path A) + scroll comet (Path B) ──
      const sc = swarmCanvasRef.current?.getContext('2d')
      if (sc && swarmCanvasRef.current) {
        const vw = swarmCanvasRef.current.width
        const vh = swarmCanvasRef.current.height
        sc.clearRect(0, 0, vw, vh)
        sc.font          = `${FONT_SIZE}px "IBM Plex Mono", monospace`
        sc.textAlign     = 'center'
        sc.textBaseline  = 'middle'

        const portalColor = isDark ? '#f0efe9' : '#0a0a0a'

        if (phase === 'swarm' && snakeActiveRef.current) {
          // Fix 4: pure character comet — NO arc() calls
          const hist = pathHistoryRef.current
          if (hist.length > 0) {
            const hd = hist[0]
            const bp = breathPhaseRef.current

            for (const cp of cometPsRef.current) {
              if (cp.opacity < 0.01) continue

              if (Math.random() < 0.006) {
                cp.char = CHARS[Math.floor(Math.random() * CHARS.length)]
              }

              if (cp.isHead) {
                const breath = HEAD_BASE_R + HEAD_BREATH_AMP * Math.sin(bp + cp.baseAngle * 0.5)
                const angle  = cp.baseAngle + bp * 0.15
                const px = hd.x + Math.cos(angle) * (cp.baseR / HEAD_BASE_R) * breath
                const py = hd.y + Math.sin(angle) * (cp.baseR / HEAD_BASE_R) * breath
                sc.globalAlpha = cp.opacity
                sc.fillStyle   = portalColor
                sc.fillText(cp.char, px, py)
              } else {
                if (cp.histIdx >= hist.length) continue
                const pos = hist[cp.histIdx]
                sc.globalAlpha = cp.opacity
                sc.fillStyle   = portalColor
                sc.fillText(cp.char, pos.x + cp.jitterX, pos.y + cp.jitterY)
              }
            }
          }

        } else if (phase === 'screensaver') {
          // Fix 4 / Path B: scroll-driven comet — fillText only, no arc()
          const { sl, st, sw: sw2, sh: sh2 } = screenRectRef.current
          const sectionEl = canvasRef.current?.parentElement
          if (sectionEl) {
            const sRect      = sectionEl.getBoundingClientRect()
            const scrollProg = Math.max(0, Math.min(1, (st - sRect.top) / sh2))
            if (scrollProg > 0.03) {
              const hx    = sl + sw2 * 0.2
              const headY = scrollProg * sh2 * 0.3
              const STEPS = 80
              for (let i = 0; i <= STEPS; i++) {
                const t = i / STEPS
                const a = 0.85 * t * Math.min(1, scrollProg * 2)
                if (a < 0.01) continue
                sc.globalAlpha = a
                sc.fillStyle   = portalColor
                sc.fillText(
                  CHARS[Math.floor(Math.random() * CHARS.length)],
                  hx + (Math.random() - 0.5) * 4,
                  t * headY
                )
              }
            }
          }
        }

        sc.globalAlpha   = 1
        sc.textAlign     = 'left'
        sc.textBaseline  = 'alphabetic'
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
      userClickedRef.current = true

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

  // ── Typing sequence ────────────────────────────────────────────────────────

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

  // ── Blinking cursor ────────────────────────────────────────────────────────

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
      {/* Portal canvas: full viewport, document.body — survives intro slideUp */}
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
