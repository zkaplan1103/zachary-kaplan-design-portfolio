import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BEZEL } from '@/config/bezel'

// ─── Day/Night color palettes ───────────────────────────────────────────────

const DAY = {
  skyTop: '#87CEEB',
  skyBot: '#F2C94C',
  ground: '#C4A04A',
  groundEdge: '#8B7332',
  text: '#1a1207',
  textShadow: 'rgba(0,0,0,0.25)',
  panelBorder: 'rgba(26,18,7,0.3)',
  toggleBg: '#1a1207',
  toggleText: '#F2C94C',
  tumbleweed: '#8B6914',
  subtitle: 'rgba(26,18,7,0.6)',
  enterBg: '#1a1207',
  enterText: '#F2C94C',
  building: '#3a2a14',
  buildingLight: '#5a4020',
  footerText: 'rgba(26,18,7,0.45)',
  celestialGlow: 'rgba(255,200,60,0.35)',
  windowLit: 'rgba(0,0,0,0.12)',
  windowDark: 'rgba(0,0,0,0.06)',
}

const NIGHT = {
  skyTop: '#0a0e1a',
  skyBot: '#1a1e3a',
  ground: '#1a1610',
  groundEdge: '#0d0b08',
  text: '#f0efe9',
  textShadow: 'rgba(0,0,0,0.6)',
  panelBorder: 'rgba(240,239,233,0.15)',
  toggleBg: '#f0efe9',
  toggleText: '#0a0e1a',
  tumbleweed: '#5a4a2a',
  subtitle: 'rgba(240,239,233,0.5)',
  enterBg: '#f0efe9',
  enterText: '#0a0e1a',
  building: '#0d0b08',
  buildingLight: '#1a1610',
  footerText: 'rgba(240,239,233,0.35)',
  celestialGlow: 'rgba(180,200,255,0.25)',
  windowLit: 'rgba(255,180,60,0.6)',
  windowDark: 'rgba(255,180,60,0.15)',
}

// ─── Panel data ─────────────────────────────────────────────────────────────

const PANELS = [
  { color: '#F2C94C', label: 'DESIGN' },
  { color: '#EB5757', label: 'DEVELOP' },
  { color: '#27AE60', label: 'DEPLOY' },
  { color: '#2D9CDB', label: 'DELIVER' },
]

// ─── Stars ──────────────────────────────────────────────────────────────────

const STARS = Array.from({ length: 14 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 40,
  size: 1 + Math.random() * 1.5,
  delay: Math.random() * 3,
  duration: 2 + Math.random() * 2,
}))

// ─── Building silhouettes ───────────────────────────────────────────────────
// Each building: w (% of container), h (% of building zone), type for shape

const BUILDINGS = [
  { w: 8,  h: 55, type: 'telegraph',  hasSign: false, windows: 2 },
  { w: 11, h: 70, type: 'sheriff',    hasSign: true,  windows: 3 },
  { w: 9,  h: 60, type: 'smithy',     hasSign: false, windows: 2 },
  { w: 14, h: 90, type: 'saloon',     hasSign: true,  windows: 4 },
  { w: 12, h: 75, type: 'bank',       hasSign: true,  windows: 3 },
  { w: 8,  h: 50, type: 'general',    hasSign: false, windows: 2 },
]

// ─── Bezel rect helper ──────────────────────────────────────────────────────

function getBezelRect() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  return {
    sl: (BEZEL.screen.left / 100) * vw,
    st: (BEZEL.screen.top / 100) * vh,
    sw: (BEZEL.screen.width / 100) * vw,
    sh: (BEZEL.screen.height / 100) * vh,
  }
}

// ─── Transition config ──────────────────────────────────────────────────────

const CROSSFADE_DURATION = 0.8

// ─── Component ──────────────────────────────────────────────────────────────

export function WesternTown() {
  const [isNight, setIsNight] = useState(true)
  const [bezel, setBezel] = useState(getBezelRect)
  const [parallaxX, setParallaxX] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const palette = isNight ? NIGHT : DAY

  // Resize handler
  useEffect(() => {
    function onResize() { setBezel(getBezelRect()) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Mouse parallax
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const centerX = rect.left + rect.width / 2
    const normalizedX = (e.clientX - centerX) / (rect.width / 2)
    setParallaxX(normalizedX * -12)
  }, [])

  const { sl, st, sw, sh } = bezel

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      style={{
        position: 'fixed',
        left: sl,
        top: st,
        width: sw,
        height: sh,
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* ── Sky gradient ─────────────────────────────────────────── */}
      <motion.div
        animate={{ background: `linear-gradient(to bottom, ${palette.skyTop}, ${palette.skyBot})` }}
        transition={{ duration: CROSSFADE_DURATION }}
        style={{ position: 'absolute', inset: 0 }}
      />

      {/* ── Stars (night only) ───────────────────────────────────── */}
      <AnimatePresence>
        {isNight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: CROSSFADE_DURATION }}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
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

      {/* ── Celestial body (moon at night / sun during day) ───────── */}
      <motion.div
        animate={{
          opacity: 1,
          background: isNight
            ? 'radial-gradient(circle, #e8e4d4 0%, #c8c0a8 40%, transparent 70%)'
            : 'radial-gradient(circle, #fff8e0 0%, #FFD700 35%, #FFA500 65%, transparent 85%)',
          boxShadow: isNight
            ? '0 0 40px 12px rgba(200,192,168,0.3), 0 0 80px 24px rgba(200,192,168,0.15)'
            : '0 0 50px 15px rgba(255,200,60,0.4), 0 0 100px 40px rgba(255,200,60,0.2)',
        }}
        transition={{ duration: CROSSFADE_DURATION }}
        style={{
          position: 'absolute',
          top: isNight ? '8%' : '6%',
          right: isNight ? '15%' : '12%',
          width: isNight ? Math.max(28, sw * 0.035) : Math.max(36, sw * 0.045),
          height: isNight ? Math.max(28, sw * 0.035) : Math.max(36, sw * 0.045),
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* ════════════════════════════════════════════════════════════
          TOP ZONE — TITLE CARD (sky region)
          ════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10,
          paddingTop: '4%',
        }}
      >
        {/* 2x2 Panel Grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' as const }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: Math.max(3, sh * 0.008),
            width: sw * 0.38,
            maxWidth: 320,
            position: 'relative',
          }}
        >
          {PANELS.map((panel) => (
            <motion.div
              key={panel.label}
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{
                aspectRatio: '1',
                backgroundColor: panel.color,
                borderRadius: 4,
                border: `1px solid ${palette.panelBorder}`,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                padding: '6%',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: `clamp(8px, ${sw * 0.011}px, 15px)`,
                  color: '#000000',
                  opacity: 0.65,
                  letterSpacing: '0.08em',
                }}
              >
                {panel.label}
              </span>
            </motion.div>
          ))}

          {/* ZK DESIGNS overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <h1
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: `clamp(26px, ${sw * 0.038}px, 50px)`,
                color: palette.text,
                textShadow: `1px 1px 6px ${palette.textShadow}`,
                letterSpacing: '0.1em',
                lineHeight: 1,
                margin: 0,
              }}
            >
              ZK DESIGNS
            </h1>
          </motion.div>
        </motion.div>

        {/* Subtitle below grid */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: `clamp(7px, ${sw * 0.009}px, 11px)`,
            color: palette.subtitle,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginTop: sh * 0.012,
          }}
        >
          frontend designer / developer
        </motion.p>
      </div>

      {/* ════════════════════════════════════════════════════════════
          MIDDLE ZONE — BUILDING SILHOUETTES (parallax)
          ════════════════════════════════════════════════════════════ */}
      <motion.div
        animate={{ x: parallaxX }}
        transition={{ type: 'spring', stiffness: 120, damping: 25 }}
        style={{
          position: 'absolute',
          bottom: '12%',
          left: '-2%',
          right: '-2%',
          height: '38%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: sw * 0.004,
          pointerEvents: 'none',
        }}
      >
        {BUILDINGS.map((b, i) => (
          <motion.div
            key={i}
            animate={{ backgroundColor: palette.building }}
            transition={{ duration: CROSSFADE_DURATION }}
            style={{
              width: `${b.w}%`,
              height: `${b.h}%`,
              borderRadius: '2px 2px 0 0',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            {/* Peaked roof for saloon */}
            {b.type === 'saloon' && (
              <div
                style={{
                  position: 'absolute',
                  top: -8,
                  left: '20%',
                  right: '20%',
                  height: 8,
                  backgroundColor: isNight ? '#0d0b08' : '#3a2a14',
                  clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',
                  transition: `background-color ${CROSSFADE_DURATION}s`,
                }}
              />
            )}

            {/* Window grid */}
            {Array.from({ length: b.windows }).map((_, row) => (
              <div key={row} style={{ display: 'flex', justifyContent: 'space-evenly', paddingTop: '14%' }}>
                {[0, 1].map((col) => (
                  <div
                    key={col}
                    style={{
                      width: '26%',
                      aspectRatio: '1 / 1.3',
                      backgroundColor: isNight
                        ? ((i + row + col) % 3 !== 0 ? palette.windowLit : palette.windowDark)
                        : palette.windowLit,
                      borderRadius: 1,
                      transition: `background-color ${CROSSFADE_DURATION}s`,
                    }}
                  />
                ))}
              </div>
            ))}

            {/* Hanging sign */}
            {b.hasSign && (
              <div
                style={{
                  position: 'absolute',
                  top: -3,
                  left: '12%',
                  right: '12%',
                  height: 5,
                  backgroundColor: isNight ? '#2a1a0a' : '#5a4020',
                  borderRadius: 1,
                  transition: `background-color ${CROSSFADE_DURATION}s`,
                }}
              />
            )}

            {/* Door at bottom center */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '30%',
                height: '18%',
                backgroundColor: isNight ? '#1a1207' : '#2a1a0a',
                borderRadius: '2px 2px 0 0',
                transition: `background-color ${CROSSFADE_DURATION}s`,
              }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* ════════════════════════════════════════════════════════════
          BOTTOM ZONE — GROUND + UI
          ════════════════════════════════════════════════════════════ */}

      {/* Ground gradient */}
      <motion.div
        animate={{
          background: `linear-gradient(to bottom, ${palette.ground}, ${palette.groundEdge})`,
        }}
        transition={{ duration: CROSSFADE_DURATION }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '12%',
        }}
      />

      {/* Tumbleweed 1 */}
      <motion.div
        animate={{
          x: [sw * -0.08, sw * 1.08],
          rotate: [0, 720],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'linear' as const,
          repeatDelay: 6,
        }}
        style={{
          position: 'absolute',
          bottom: '11.5%',
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: `2px solid ${palette.tumbleweed}`,
          opacity: 0.4,
          pointerEvents: 'none',
        }}
      />

      {/* Tumbleweed 2 (smaller, offset timing) */}
      <motion.div
        animate={{
          x: [sw * 1.1, sw * -0.1],
          rotate: [0, -540],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'linear' as const,
          repeatDelay: 10,
          delay: 8,
        }}
        style={{
          position: 'absolute',
          bottom: '11%',
          width: 12,
          height: 12,
          borderRadius: '50%',
          border: `1.5px solid ${palette.tumbleweed}`,
          opacity: 0.3,
          pointerEvents: 'none',
        }}
      />

      {/* Ground content: tagline + enter button */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '12%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          gap: sh * 0.01,
        }}
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: `clamp(6px, ${sw * 0.007}px, 9px)`,
            color: palette.footerText,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          est. 2024 &#10022; population: 1
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.1, ease: 'easeOut' as const }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: `clamp(8px, ${sw * 0.009}px, 12px)`,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            backgroundColor: palette.enterBg,
            color: palette.enterText,
            border: 'none',
            padding: `${sh * 0.01}px ${sw * 0.025}px`,
            borderRadius: 3,
            cursor: 'pointer',
          }}
        >
          [ enter the town ]
        </motion.button>
      </div>

      {/* ── Day/Night toggle ─────────────────────────────────────── */}
      <motion.button
        onClick={() => setIsNight((v) => !v)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          backgroundColor: palette.toggleBg,
          color: palette.toggleText,
        }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 20,
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
    </div>
  )
}
