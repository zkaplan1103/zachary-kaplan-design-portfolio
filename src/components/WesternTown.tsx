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
  building: '#8B7332',
  footerText: 'rgba(26,18,7,0.45)',
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
  footerText: 'rgba(240,239,233,0.35)',
}

// ─── Panel data ─────────────────────────────────────────────────────────────

const PANELS = [
  { color: '#F2C94C', label: 'DESIGN' },
  { color: '#EB5757', label: 'DEVELOP' },
  { color: '#27AE60', label: 'DEPLOY' },
  { color: '#2D9CDB', label: 'DELIVER' },
]

// ─── Stars (only visible at night) ──────────────────────────────────────────

const STARS = Array.from({ length: 60 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 45,
  size: 1 + Math.random() * 2,
  delay: Math.random() * 3,
  duration: 2 + Math.random() * 2,
}))

// ─── Buildings data ─────────────────────────────────────────────────────────

const BUILDINGS = [
  { w: 7, h: 50, hasSign: false },
  { w: 10, h: 70, hasSign: true },
  { w: 8, h: 55, hasSign: false },
  { w: 12, h: 80, hasSign: true },
  { w: 6, h: 40, hasSign: false },
  { w: 9, h: 65, hasSign: false },
  { w: 14, h: 85, hasSign: true },
  { w: 7, h: 48, hasSign: false },
  { w: 11, h: 72, hasSign: true },
  { w: 8, h: 58, hasSign: false },
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

// ─── Component ──────────────────────────────────────────────────────────────

export function WesternTown() {
  const [isNight, setIsNight] = useState(false)
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
    setParallaxX(normalizedX * -15)
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
      {/* ── Sky gradient (full background) ─────────────────────────── */}
      <motion.div
        animate={{ background: `linear-gradient(to bottom, ${palette.skyTop}, ${palette.skyBot})` }}
        transition={{ duration: 0.8 }}
        style={{ position: 'absolute', inset: 0 }}
      />

      {/* ── Stars (night only) ─────────────────────────────────────── */}
      <AnimatePresence>
        {isNight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            {STARS.map((star, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: star.duration, delay: star.delay, repeat: Infinity }}
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

      {/* ════════════════════════════════════════════════════════════════
          TOP THIRD — SKY / TITLE CARD
          ════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '38%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10,
          paddingTop: '3%',
        }}
      >
        {/* 2x2 Panel Grid — small title card in the sky */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: Math.max(3, sh * 0.008),
            width: sw * 0.32,
            maxWidth: 280,
            position: 'relative',
          }}
        >
          {PANELS.map((panel) => (
            <motion.div
              key={panel.label}
              whileHover={{ scale: 1.06, y: -2 }}
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
                  fontSize: `clamp(9px, ${sw * 0.012}px, 16px)`,
                  color: '#000000',
                  opacity: 0.7,
                  letterSpacing: '0.08em',
                }}
              >
                {panel.label}
              </span>
            </motion.div>
          ))}

          {/* ZK DESIGNS overlay on top of grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
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
                fontSize: `clamp(28px, ${sw * 0.04}px, 52px)`,
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
          transition={{ duration: 0.5, delay: 0.8 }}
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

      {/* ════════════════════════════════════════════════════════════════
          MIDDLE THIRD — TOWN BUILDINGS (parallax)
          ════════════════════════════════════════════════════════════════ */}
      <motion.div
        animate={{ x: parallaxX }}
        transition={{ type: 'spring', stiffness: 120, damping: 25 }}
        style={{
          position: 'absolute',
          bottom: '22%',
          left: '-3%',
          right: '-3%',
          height: '35%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: sw * 0.005,
          pointerEvents: 'none',
        }}
      >
        {BUILDINGS.map((b, i) => (
          <motion.div
            key={i}
            animate={{ backgroundColor: palette.building }}
            transition={{ duration: 0.8 }}
            style={{
              width: `${b.w}%`,
              height: `${b.h}%`,
              borderRadius: '2px 2px 0 0',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            {/* Window grid */}
            {Array.from({ length: Math.floor(b.h / 20) }).map((_, row) => (
              <div key={row} style={{ display: 'flex', justifyContent: 'space-evenly', paddingTop: '15%' }}>
                {[0, 1].map((col) => (
                  <div
                    key={col}
                    style={{
                      width: '28%',
                      aspectRatio: '1 / 1.2',
                      backgroundColor: isNight
                        ? ((i + row + col) % 3 !== 0 ? 'rgba(255,180,60,0.6)' : 'rgba(255,180,60,0.15)')
                        : 'rgba(0,0,0,0.12)',
                      borderRadius: 1,
                    }}
                  />
                ))}
              </div>
            ))}

            {/* Saloon/shop sign */}
            {b.hasSign && (
              <div
                style={{
                  position: 'absolute',
                  top: -4,
                  left: '10%',
                  right: '10%',
                  height: 6,
                  backgroundColor: isNight ? '#2a1a0a' : '#5a4020',
                  borderRadius: 1,
                }}
              />
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════
          BOTTOM THIRD — GROUND + FOREGROUND CTA
          ════════════════════════════════════════════════════════════════ */}

      {/* Ground */}
      <motion.div
        animate={{
          background: `linear-gradient(to bottom, ${palette.ground}, ${palette.groundEdge})`,
        }}
        transition={{ duration: 0.8 }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '22%',
        }}
      />

      {/* Tumbleweed */}
      <motion.div
        animate={{
          x: [sw * -0.1, sw * 1.1],
          rotate: [0, 720],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'linear' as const,
          repeatDelay: 5,
        }}
        style={{
          position: 'absolute',
          bottom: '21%',
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: `2px solid ${palette.tumbleweed}`,
          opacity: 0.45,
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
          height: '22%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          gap: sh * 0.015,
        }}
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: `clamp(7px, ${sw * 0.008}px, 10px)`,
            color: palette.footerText,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
          }}
        >
          est. 2024 &#10022; population: 1
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: `clamp(9px, ${sw * 0.01}px, 13px)`,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            backgroundColor: palette.enterBg,
            color: palette.enterText,
            border: 'none',
            padding: `${sh * 0.012}px ${sw * 0.03}px`,
            borderRadius: 3,
            cursor: 'pointer',
          }}
        >
          [ enter the town ]
        </motion.button>
      </div>

      {/* ── Day/Night toggle ───────────────────────────────────────── */}
      <motion.button
        onClick={() => setIsNight((v) => !v)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          backgroundColor: palette.toggleBg,
          color: palette.toggleText,
        }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 20,
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
        }}
      >
        {isNight ? '\u2600' : '\u263E'}
      </motion.button>
    </div>
  )
}
