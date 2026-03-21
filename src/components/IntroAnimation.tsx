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
const BOUNCE_SPEED  = 0.45  // slower, smoother drift
const SQUISH_FACTOR = 0.65  // dramatic full-letter squish
const SQUISH_SPRING = 0.03  // very slow recovery for visible effect

const WARP_RADIUS   = 55
const WARP_STRENGTH = 50
const WARP_SPRING   = 0.15

// ─── Meteor particles (Path B scroll snake) — precomputed at module load ────

// Head geometry
const METEOR_HEAD_R   = 62   // core circle radius
const METEOR_STAG_R   = 82   // max straggler radius around head

// Trail geometry — trail spans normalized 0(front)→1(back), scaled by headY at render
const TRAIL_MID_START_W  = 28   // middle column half-width at front of trail (px)
const TRAIL_STAG_START   = 95   // straggler max spread at front of trail (px)

interface MeteorPart {
  dx: number
  // isHead=true:  dy is absolute px offset from head center
  // isHead=false: dy is normalized 0→-1 (scaled by trail length at render)
  dy: number
  a: number
  char: string
  isHead: boolean
  jitterPhase: number
  jitterAmpX: number
  jitterAmpY: number
  jitterSpeed: number
}

const METEOR: MeteorPart[] = []

function rnd() { return Math.random() }
function randChar() { return CHARS[Math.floor(rnd() * CHARS.length)] }
function jitterProps(ampScale = 1) {
  return {
    jitterPhase: rnd() * Math.PI * 2,
    jitterAmpX: (0.6 + rnd() * 3.0) * ampScale,
    jitterAmpY: (0.4 + rnd() * 1.8) * ampScale,
    jitterSpeed: 1.2 + rnd() * 3.0,
  }
}

// ── Head core: uniformly packed circle ──────────────────────────────────────
// sqrt distribution gives uniform area density (no center clustering)
const HEAD_CORE_COUNT = 140
for (let i = 0; i < HEAD_CORE_COUNT; i++) {
  const angle = rnd() * Math.PI * 2
  const r = Math.sqrt(rnd()) * METEOR_HEAD_R
  METEOR.push({
    dx: Math.cos(angle) * r,
    dy: Math.sin(angle) * r * 0.65,  // slightly oval
    a: 0.82 + rnd() * 0.18,
    char: randChar(),
    isHead: true,
    ...jitterProps(0.4),  // tight jitter — head stays crisp
  })
}

// ── Head stragglers: debris + flame wisps around the circle ─────────────────
const HEAD_STAG_COUNT = 70
for (let i = 0; i < HEAD_STAG_COUNT; i++) {
  const angle = rnd() * Math.PI * 2
  // r between HEAD_R * 0.85 and STAG_R — clustered near edge with some far wisps
  const r = METEOR_HEAD_R * 0.85 + Math.pow(rnd(), 0.7) * (METEOR_STAG_R - METEOR_HEAD_R * 0.85)
  METEOR.push({
    dx: Math.cos(angle) * r,
    dy: Math.sin(angle) * r * 0.65,
    a: 0.25 + rnd() * 0.40,          // dimmer — wisps/embers
    char: randChar(),
    isHead: true,
    ...jitterProps(1.2),              // more jitter — live, flickery
  })
}

// ── Trail: continuous t=0(front)→1(back), density falls off toward back ─────
// More particles allocated near front via t = (i/N)^1.4 distribution
const TRAIL_TOTAL = 380
for (let i = 0; i < TRAIL_TOTAL; i++) {
  // Non-uniform t: square-root pushes more particles near t=0 (front)
  const t = Math.pow(i / (TRAIL_TOTAL - 1), 1.5)
  const dy = -t  // normalized; multiplied by headY at render

  // Middle column half-width: starts wide, tapers to nearly zero at tail
  const midHalfW = TRAIL_MID_START_W * Math.pow(1 - t, 0.7)

  // Straggler max spread: large near front, shrinks to small at tail
  const stagMax  = TRAIL_STAG_START * Math.pow(1 - t, 0.9)

  // Probability this particle lands in the middle column vs straggler zone
  // Near front: 55% middle. Near tail: ~5% middle (mostly stragglers disappear too)
  const midProb = 0.55 * Math.pow(1 - t, 0.6)
  const isMiddle = rnd() < midProb

  let dx: number
  let a: number

  if (isMiddle) {
    // Middle column particle — uniform across midHalfW
    dx = (rnd() * 2 - 1) * midHalfW
    // Opacity: high at front, fades toward back
    a = (0.55 + rnd() * 0.25) * Math.pow(1 - t, 0.55)
  } else {
    // Straggler — outside middle zone, up to stagMax
    const sign = rnd() > 0.5 ? 1 : -1
    const innerEdge = midHalfW + 4
    const outerEdge = innerEdge + stagMax
    dx = sign * (innerEdge + rnd() * (outerEdge - innerEdge))
    // Opacity: dimmer than middle, fades faster
    a = (0.20 + rnd() * 0.20) * Math.pow(1 - t, 1.0)
  }

  METEOR.push({
    dx, dy, a,
    char: randChar(),
    isHead: false,
    ...jitterProps(isMiddle ? 0.8 : 1.4),  // stragglers wiggle more
  })
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

  const screenRectRef = useRef<ScreenRect>(computeScreenRect())
  const [screenDims, setScreenDims] = useState<ScreenRect>(() => computeScreenRect())

  // Screensaver bounce
  const bouncePosRef = useRef({ x: 0, y: 0 })
  const bounceVelRef = useRef({ vx: BOUNCE_SPEED, vy: BOUNCE_SPEED * 0.75 })
  const squishRef    = useRef({ x: 1, y: 1 })

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
    squishRef.current = { x: 1, y: 1 }
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
        bp.x += bv.vx
        bp.y += bv.vy

        // Half-dims use squish multiplier — entire ZK compresses visibly
        const halfW = (ZK_TOTAL_W / 2) * sq.x + 4
        const halfH = (ZK_TOTAL_H / 2) * sq.y + 4

        if (bp.x - halfW < 0) { bv.vx =  Math.abs(bv.vx); bp.x = halfW;     sq.x = SQUISH_FACTOR }
        if (bp.x + halfW > w) { bv.vx = -Math.abs(bv.vx); bp.x = w - halfW; sq.x = SQUISH_FACTOR }
        if (bp.y - halfH < 0) { bv.vy =  Math.abs(bv.vy); bp.y = halfH;     sq.y = SQUISH_FACTOR }
        if (bp.y + halfH > h) { bv.vy = -Math.abs(bv.vy); bp.y = h - halfH; sq.y = SQUISH_FACTOR }

        // Spring back to normal
        sq.x += (1 - sq.x) * SQUISH_SPRING
        sq.y += (1 - sq.y) * SQUISH_SPRING

        for (const p of particles) {
          p.displX *= (1 - WARP_SPRING)
          p.displY *= (1 - WARP_SPRING)

          // Uniform squish: entire letter scales on the hit axis
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

      // ── Portal canvas: Path B meteor scroll snake ────────────────────────
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
              const snakeOpacity = Math.min(1, scrollProg * 3)
              const headY = viewportH * 0.1 + scrollProg * viewportH * 0.25
              const hx    = screenRectRef.current.sl + screenRectRef.current.sw * 0.2
              const portalColor = isDark ? '#f0efe9' : '#0a0a0a'

              sc.font         = `${FONT_SIZE}px "IBM Plex Mono", monospace`
              sc.textAlign    = 'center'
              sc.textBaseline = 'middle'

              // Time for per-char jitter (seconds)
              const tSec = now / 1000

              // Render tail+mid first (behind), then head on top
              for (const m of METEOR) {
                if (m.isHead) continue
                const a = snakeOpacity * m.a
                if (a < 0.01) continue
                sc.globalAlpha = a
                sc.fillStyle   = portalColor
                const jx = Math.sin(tSec * m.jitterSpeed + m.jitterPhase) * m.jitterAmpX
                const jy = Math.cos(tSec * m.jitterSpeed * 0.8 + m.jitterPhase) * m.jitterAmpY
                sc.fillText(m.char, hx + m.dx + jx, headY + m.dy * headY + jy)
              }
              for (const m of METEOR) {
                if (!m.isHead) continue
                const a = snakeOpacity * m.a
                if (a < 0.01) continue
                sc.globalAlpha = a
                sc.fillStyle   = portalColor
                const jx = Math.sin(tSec * m.jitterSpeed + m.jitterPhase) * m.jitterAmpX * 0.5
                const jy = Math.cos(tSec * m.jitterSpeed * 0.8 + m.jitterPhase) * m.jitterAmpY * 0.5
                sc.fillText(m.char, hx + m.dx + jx, headY + m.dy + jy)
              }

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
