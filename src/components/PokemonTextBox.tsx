import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Building dialogue data ─────────────────────────────────────────────────

export interface BuildingDialogue {
  name: string
  text: string
}

export const BUILDING_DIALOGUES: Record<string, BuildingDialogue> = {
  saloon: {
    name: "> THE LUCKY SPUR SALOON",
    text: "Cold drinks, warm company, and a story or two about the man who built this town.",
  },
  sheriff: {
    name: "> SHERIFF'S OFFICE",
    text: "Case files, wanted posters, evidence boards. Every project I have ever worked on lives in here.",
  },
  bank: {
    name: "> KAPLAN & CO. PORTFOLIO VAULT",
    text: "The good stuff. Locked up tight. You look trustworthy enough.",
  },
  telegraph: {
    name: "> TELEGRAPH OFFICE",
    text: "Send a message. I check this more than I should.",
  },
  smithy: {
    name: "> THE FORGE",
    text: "Where the process lives. How I think, how I build, how I work.",
  },
  general: {
    name: "> GENERAL STORE",
    text: "Tools of the trade. Everything a frontier designer needs under one roof.",
  },
}

// ─── Notched corner border ────────────────────────────────────────────────────
//
// Draws the box border as 8 line segments — 2 per corner, leaving a square
// "notch" gap at each corner. The SVG sits at position:absolute; inset:0 with
// overflow:visible so it covers the padding box exactly.
//
// Geometry (for a box of width W × height H, notch size N):
//
//   Top edge:    (N,0)→(W-N,0)          split at TL and TR corners
//   Right edge:  (W,N)→(W,H-N)          split at TR and BR corners
//   Bottom edge: (W-N,H)→(N,H)          split at BR and BL corners
//   Left edge:   (0,H-N)→(0,N)          split at BL and TL corners
//
// Each pair of segments leaves a gap of size N×N at each corner.
// We use a <polyline> trick: one continuous path with a move-without-draw
// between each segment isn't easy in SVG without path 'M'; use 4 <line> pairs.

const NOTCH = 7  // px — size of corner cutout

interface NotchedBorderProps {
  color: string
}

function NotchedBorder({ color }: NotchedBorderProps) {
  // W and H are determined by the SVG's own 100%×100% bounding box.
  // We use a viewBox that matches the box's intrinsic size via preserveAspectRatio="none"
  // and percentage-based coordinates won't work for exact pixel notches.
  // Solution: use a fixed large viewBox (1000×1000) and scale NOTCH accordingly.
  // The SVG is stretched to fit via preserveAspectRatio="none" — this is fine
  // because we only draw straight horizontal/vertical lines, so stretching
  // does not distort the notch shape perceptibly for typical aspect ratios.
  //
  // Alternatively — and more robustly — render as an absolutely-positioned div
  // using clip-path to cut the corners and a border on the clipped element.
  // That approach needs no SVG at all:
  //
  //   clip-path: polygon(
  //     Npx 0%, calc(100% - Npx) 0%,          ← top edge
  //     100% Npx, 100% calc(100% - Npx),       ← right edge
  //     calc(100% - Npx) 100%, Npx 100%,       ← bottom edge
  //     0% calc(100% - Npx), 0% Npx            ← left edge
  //   )
  //
  // This clips the box itself. We then paint border on a child wrapper.
  // But clip-path clips the border too. The cleanest SVG-free approach:
  // render the box with clip-path and add a box-shadow workaround — but
  // box-shadow is also clipped by clip-path.
  //
  // Verdict: use the SVG overlay with a 1000×1000 viewBox + preserveAspectRatio="none".
  // Lines are stroke-only, no fill, so stretching only affects line positions.

  const V = 1000  // viewBox dimension
  const N = NOTCH * (1000 / 80)  // scale notch to viewBox (~87.5 for a ~80px tall box)
  //                                 We use a fixed ratio tuned for typical box height.
  //                                 Since we only draw H/V lines this is perceptually exact.

  const s = String  // shorthand

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible',
        pointerEvents: 'none',
      }}
      viewBox={`0 0 ${V} ${V}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Top edge: left segment + right segment */}
      <line x1={s(N)} y1="0" x2={s(V - N)} y2="0" stroke={color} strokeWidth="2" />
      {/* Right edge: top segment + bottom segment */}
      <line x1={s(V)} y1={s(N)} x2={s(V)} y2={s(V - N)} stroke={color} strokeWidth="2" />
      {/* Bottom edge: right segment + left segment */}
      <line x1={s(V - N)} y1={s(V)} x2={s(N)} y2={s(V)} stroke={color} strokeWidth="2" />
      {/* Left edge: bottom segment + top segment */}
      <line x1="0" y1={s(V - N)} x2="0" y2={s(N)} stroke={color} strokeWidth="2" />
    </svg>
  )
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface PokemonTextBoxProps {
  buildingId: string | null
  sw: number      // bezel screen width in px (from useBezelContext)
  sh: number      // bezel screen height in px (from useBezelContext)
  isNight: boolean
  anchorX: number // final left px — fully computed and clamped in WesternTown
}

// ─── Component ──────────────────────────────────────────────────────────────

const TYPE_SPEED = 35  // ms per character

export function PokemonTextBox({ buildingId, sw, sh, isNight, anchorX }: PokemonTextBoxProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [showCursor,    setShowCursor]    = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cursorRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  const dialogue = buildingId ? BUILDING_DIALOGUES[buildingId] : null

  // Typewriter effect
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (!dialogue) { setDisplayedText(''); return }

    const fullText = dialogue.text
    let i = 0
    setDisplayedText('')

    intervalRef.current = setInterval(() => {
      i++
      setDisplayedText(fullText.slice(0, i))
      if (i >= fullText.length) {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }, TYPE_SPEED)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [dialogue])

  // Blinking cursor
  useEffect(() => {
    cursorRef.current = setInterval(() => setShowCursor((v) => !v), 400)
    return () => { if (cursorRef.current) clearInterval(cursorRef.current) }
  }, [])

  // ── Theme tokens ─────────────────────────────────────────────────────────
  const bg    = isNight ? '#000000' : '#ffffff'
  const lineColor = isNight ? '#ffffff' : '#000000'
  const fg    = isNight ? '#ffffff' : '#000000'
  const subFg = isNight ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)'

  // ── Box dimensions & position ─────────────────────────────────────────────
  const boxWidth = Math.round(sw * 0.28)
  const bottom   = Math.round(sh * 0.13)
  // anchorX is the fully-computed, clamped left position from WesternTown.
  const boxLeft  = anchorX

  return (
    <AnimatePresence>
      {dialogue && (
        <motion.div
          key={buildingId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          style={{
            position:        'absolute',
            bottom,
            left:            boxLeft,
            width:           boxWidth,
            backgroundColor: bg,
            // No CSS border — the SVG overlay draws the notched frame
            padding:         '8px 16px',
            zIndex:          60,
            pointerEvents:   'none',
            overflow:        'visible',
          }}
        >
          {/* Notched corner border — SVG overlay, position:absolute inset:0 */}
          <NotchedBorder color={lineColor} />

          {/* Building name */}
          <p
            style={{
              fontFamily:    '"IBM Plex Mono", monospace',
              fontSize:       10,
              color:          subFg,
              letterSpacing: '0.2em',
              margin:        '0 0 4px 0',
              textTransform: 'uppercase',
            }}
          >
            {dialogue.name}
          </p>

          {/* Dialogue text */}
          <p
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize:    11,
              color:       fg,
              lineHeight:  1.6,
              margin:      0,
              minHeight:   28,
            }}
          >
            {displayedText}
          </p>

          {/* Blinking ▼ indicator */}
          <div
            style={{
              position:   'absolute',
              bottom:      6,
              right:       10,
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize:    10,
              color:       fg,
              opacity:     showCursor ? 1 : 0,
            }}
          >
            ▼
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
