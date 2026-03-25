import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBezelContext } from '@/contexts/BezelContext'
import { PokemonTextBox } from '@/components/PokemonTextBox'

// ─── Sky gradients (5-stop warm sunset) ─────────────────────────────────────

const NIGHT_SKY = 'linear-gradient(180deg, #0a0612 0%, #1a0a2e 20%, #2d1a0a 55%, #3d2008 75%, #1a0d04 100%)'
const DAY_SKY = 'linear-gradient(180deg, #1a3a5c 0%, #2d6a8a 15%, #87CEEB 45%, #FDB97D 75%, #F4A460 100%)'

// ─── Ground gradients ───────────────────────────────────────────────────────

const NIGHT_GROUND = 'linear-gradient(180deg, #2d1a04 0%, #0a0804 100%)'
const DAY_GROUND = 'linear-gradient(180deg, #C4A050 0%, #8B6914 100%)'

// ─── Palette tokens ─────────────────────────────────────────────────────────

const DAY = {
  building: '#5a3a10',
  buildingBorderTop: 'rgba(255,150,50,0.1)',
  windowBg: '#ffe082',
  windowGlow: 'none',
  tumbleweed: '#8B6914',
  toggleBg: '#1a1207',
  toggleText: '#F2C94C',
  footerText: 'rgba(26,18,7,0.45)',
  panelBorder: 'rgba(26,18,7,0.3)',
  estText: 'rgba(80,40,10,0.6)',
  roleText: 'rgba(100,60,20,0.55)',
}

const NIGHT = {
  building: '#1a0d04',
  buildingBorderTop: 'rgba(255,150,50,0.1)',
  windowBg: '#ff8c00',
  windowGlow: '0 0 8px rgba(255,140,0,0.53), 0 0 16px rgba(204,102,0,0.27)',
  tumbleweed: '#5a4a2a',
  toggleBg: '#f0efe9',
  toggleText: '#0a0e1a',
  footerText: 'rgba(240,239,233,0.35)',
  panelBorder: 'rgba(240,239,233,0.15)',
  estText: 'rgba(180,100,40,0.6)',
  roleText: 'rgba(200,140,60,0.55)',
}

// ─── Title card grid colors ─────────────────────────────────────────────────

const TITLE_GRID_NIGHT = ['#3d2a08', '#2a0a1a', '#0a1a08', '#0a0a2a']
const TITLE_GRID_DAY = ['#c4821a', '#8b3a1a', '#4a6b1a', '#1a4a6b']

const SCANLINE_TEXTURE =
  'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 4px)'

// ─── Stars ──────────────────────────────────────────────────────────────────

const STARS = Array.from({ length: 18 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 50,
  size: 1 + Math.random() * 1.5,
  delay: Math.random() * 3,
  duration: 2 + Math.random() * 2,
}))

// ─── Buildings ──────────────────────────────────────────────────────────────
// Heights are % of sh (14-22%). Width is % of container.

const BUILDINGS = [
  { id: 'telegraph', w: 13, hPct: 0.15, windows: 2, hasSign: false, hasPeak: false },
  { id: 'sheriff',   w: 16, hPct: 0.19, windows: 3, hasSign: true,  hasPeak: false },
  { id: 'smithy',    w: 14, hPct: 0.16, windows: 2, hasSign: false, hasPeak: false },
  { id: 'saloon',    w: 18, hPct: 0.22, windows: 4, hasSign: true,  hasPeak: true  },
  { id: 'bank',      w: 16, hPct: 0.20, windows: 3, hasSign: true,  hasPeak: false },
  { id: 'general',   w: 13, hPct: 0.14, windows: 2, hasSign: false, hasPeak: false },
]

// ─── Transition ─────────────────────────────────────────────────────────────

const CROSS = 1.5 // 1.5s day/night transition

// ─── Component ──────────────────────────────────────────────────────────────

export function WesternTown() {
  const [isNight, setIsNight] = useState(true)
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [mouseNorm, setMouseNorm] = useState(0) // -1 to 1

  const b = useBezelContext()
  const palette = isNight ? NIGHT : DAY
  const sw = b.width
  const sh = b.height

  // ── Grid dimensions (2:1 aspect, capped at 80% screen width for mobile) ─
  const gridNatural = sh * 0.26 * 2.1
  const gridWidth = Math.min(gridNatural, sw * 0.8)
  const gridHeight = gridWidth / 2.1
  const gridCapped = gridNatural > sw * 0.8 // true on narrow/mobile viewports

  // ── Mouse parallax ──────────────────────────────────────────────────────
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const norm = (e.clientX - rect.left) / rect.width - 0.5 // -0.5 to 0.5
    setMouseNorm(norm * 2) // -1 to 1
  }, [])

  const skyX = mouseNorm * -15
  const buildingsX = mouseNorm * -30
  const groundX = mouseNorm * -45

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', cursor: 'default' }}
    >
      {/* ═══════ z:0 — SKY GRADIENT (parallax layer 1) ═══════ */}
      <motion.div
        animate={{ background: isNight ? NIGHT_SKY : DAY_SKY }}
        transition={{ duration: CROSS }}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          transform: `translateX(${skyX}px)`,
          width: '115%',
          left: '-7.5%',
          transition: `transform 0.3s ease-out`,
        }}
      />

      {/* ═══════ z:1 — STARS (night only) ═══════ */}
      <AnimatePresence>
        {isNight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: CROSS }}
            style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}
          >
            {STARS.map((star, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 0.9, 0.2] }}
                transition={{ duration: star.duration, delay: star.delay, repeat: Infinity, ease: 'easeInOut' as const }}
                style={{
                  position: 'absolute',
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: star.size,
                  height: star.size,
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ z:2 — CELESTIAL BODY ═══════ */}
      <motion.div
        animate={{
          background: isNight
            ? 'radial-gradient(circle, #e8e4d4 0%, #c8c0a8 40%, transparent 70%)'
            : 'radial-gradient(circle, #fff8e0 0%, #FFD700 35%, #FFA500 65%, transparent 85%)',
          boxShadow: isNight
            ? '0 0 40px 12px rgba(200,192,168,0.3), 0 0 80px 24px rgba(200,192,168,0.15)'
            : '0 0 50px 15px rgba(255,200,60,0.4), 0 0 100px 40px rgba(255,200,60,0.2)',
        }}
        transition={{ duration: CROSS }}
        style={{
          position: 'absolute',
          top: isNight ? '8%' : '6%',
          right: isNight ? '12%' : '10%',
          width: isNight ? Math.max(28, sw * 0.035) : Math.max(36, sw * 0.045),
          height: isNight ? Math.max(28, sw * 0.035) : Math.max(36, sw * 0.045),
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* ═══════ z:8 — 2×2 TITLE CARD ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' as const }}
        style={{
          position: 'absolute',
          top: sh * 0.06,
          left: 0,
          right: 0,
          zIndex: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          pointerEvents: 'none',
        }}
      >
        {/* The 2×2 grid — wider than tall */}
        <div
          style={{
            width: gridWidth,
            height: gridHeight,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            border: '2px solid rgba(0,0,0,0.5)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {(isNight ? TITLE_GRID_NIGHT : TITLE_GRID_DAY).map((color, i) => (
            <div
              key={i}
              style={{
                backgroundColor: color,
                backgroundImage: SCANLINE_TEXTURE,
                transition: `background-color ${CROSS}s`,
              }}
            />
          ))}

          {/* ZK DESIGNS overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <h1
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: gridCapped ? gridWidth * 0.20 : gridHeight * 0.55,
                color: '#FFFFFF',
                letterSpacing: '0.06em',
                textShadow: '2px 2px 0 rgba(0,0,0,0.9), 5px 5px 0 rgba(0,0,0,0.5)',
                lineHeight: 1,
                margin: 0,
                whiteSpace: 'nowrap',
                userSelect: 'none',
              }}
            >
              ZK DESIGNS
            </h1>
          </div>
        </div>

        {/* EST line */}
        <p
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 9,
            letterSpacing: '0.2em',
            color: palette.estText,
            textAlign: 'center',
            margin: 0,
            textTransform: 'uppercase',
            transition: `color ${CROSS}s`,
            whiteSpace: 'nowrap',
          }}
        >
          est. 2024 &#10022; population: 1
        </p>

        {/* Role line */}
        <p
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 9,
            letterSpacing: '0.18em',
            color: palette.roleText,
            textAlign: 'center',
            margin: 0,
            textTransform: 'uppercase',
            transition: `color ${CROSS}s`,
            whiteSpace: 'nowrap',
          }}
        >
          frontend designer / developer
        </p>
      </motion.div>

      {/* ═══════ z:4 — BUILDINGS (parallax layer 2) ═══════ */}
      <div
        style={{
          position: 'absolute',
          bottom: sh * 0.10,
          left: '-7.5%',
          width: '115%',
          height: sh * 0.25,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: sw * 0.005,
          zIndex: 4,
          transform: `translateX(${buildingsX}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        {BUILDINGS.map((bldg) => {
          const bHeight = sh * bldg.hPct
          const isHovered = hoveredBuilding === bldg.id
          return (
            <motion.div
              key={bldg.id}
              onMouseEnter={() => setHoveredBuilding(bldg.id)}
              onMouseLeave={() => setHoveredBuilding(null)}
              animate={{
                scale: isHovered ? 1.04 : 1,
                filter: isHovered ? 'brightness(1.5)' : 'brightness(1)',
              }}
              transition={{ duration: 0.3 }}
              style={{
                width: `${bldg.w}%`,
                height: bHeight,
                backgroundColor: palette.building,
                borderRadius: '2px 2px 0 0',
                borderTop: `1px solid ${palette.buildingBorderTop}`,
                position: 'relative',
                flexShrink: 0,
                cursor: 'pointer',
                transformOrigin: 'bottom center',
                transition: `background-color ${CROSS}s`,
              }}
            >
              {/* Peaked roof for saloon */}
              {bldg.hasPeak && (
                <div
                  style={{
                    position: 'absolute',
                    top: -10,
                    left: '15%',
                    right: '15%',
                    height: 10,
                    backgroundColor: palette.building,
                    clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',
                    transition: `background-color ${CROSS}s`,
                  }}
                />
              )}

              {/* Hanging sign */}
              {bldg.hasSign && (
                <div
                  style={{
                    position: 'absolute',
                    top: -4,
                    left: '10%',
                    right: '10%',
                    height: 6,
                    backgroundColor: isNight ? '#2a1a0a' : '#5a4020',
                    borderRadius: 1,
                    transition: `background-color ${CROSS}s`,
                  }}
                />
              )}

              {/* Windows */}
              {Array.from({ length: bldg.windows }).map((_, row) => (
                <div key={row} style={{ display: 'flex', justifyContent: 'space-evenly', paddingTop: '12%' }}>
                  {[0, 1].map((col) => (
                    <div
                      key={col}
                      style={{
                        width: '22%',
                        aspectRatio: '1 / 1.3',
                        backgroundColor: palette.windowBg,
                        boxShadow: palette.windowGlow,
                        borderRadius: 1,
                        transition: `background-color ${CROSS}s, box-shadow ${CROSS}s`,
                      }}
                    />
                  ))}
                </div>
              ))}

              {/* Door */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '28%',
                  height: '18%',
                  backgroundColor: isNight ? '#1a1207' : '#2a1a0a',
                  borderRadius: '2px 2px 0 0',
                  transition: `background-color ${CROSS}s`,
                }}
              />
            </motion.div>
          )
        })}
      </div>

      {/* ═══════ z:5 — GROUND (parallax layer 3) ═══════ */}
      <motion.div
        animate={{ background: isNight ? NIGHT_GROUND : DAY_GROUND }}
        transition={{ duration: CROSS }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: '-7.5%',
          width: '115%',
          height: sh * 0.10,
          zIndex: 5,
          transform: `translateX(${groundX}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      />

      {/* ═══════ z:7 — TUMBLEWEEDS ═══════ */}
      <motion.div
        animate={{ x: [sw * -0.08, sw * 1.08], rotate: [0, 720] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' as const, repeatDelay: 6 }}
        style={{
          position: 'absolute',
          bottom: sh * 0.105,
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: `2px solid ${palette.tumbleweed}`,
          opacity: 0.4,
          pointerEvents: 'none',
          zIndex: 7,
        }}
      />
      <motion.div
        animate={{ x: [sw * 1.1, sw * -0.1], rotate: [0, -540] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' as const, repeatDelay: 10, delay: 8 }}
        style={{
          position: 'absolute',
          bottom: sh * 0.10,
          width: 12,
          height: 12,
          borderRadius: '50%',
          border: `1.5px solid ${palette.tumbleweed}`,
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: 7,
        }}
      />

      {/* ═══════ z:9 — UI LAYER (no parallax) ═══════ */}

      {/* Day/Night toggle */}
      <motion.button
        onClick={() => setIsNight((v) => !v)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ backgroundColor: palette.toggleBg, color: palette.toggleText }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 9,
          width: 30,
          height: 30,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
        }}
        aria-label={isNight ? 'Switch to day mode' : 'Switch to night mode'}
      >
        {isNight ? '\u2600' : '\u263E'}
      </motion.button>

      {/* Bottom CTA text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        style={{
          position: 'absolute',
          bottom: sh * 0.015,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: Math.max(7, sw * 0.007),
          color: palette.footerText,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          margin: 0,
          zIndex: 9,
          pointerEvents: 'none',
        }}
      >
        click a building to enter
      </motion.p>

      {/* ═══════ z:10 — POKÉMON TEXT BOX ═══════ */}
      <PokemonTextBox buildingId={hoveredBuilding} sw={sw} sh={sh} />
    </div>
  )
}
