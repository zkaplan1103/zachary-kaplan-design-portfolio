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
  overlay: 'rgba(242,201,76,0.08)',
  toggleBg: '#1a1207',
  toggleText: '#F2C94C',
  tumbleweed: '#8B6914',
  subtitle: 'rgba(26,18,7,0.6)',
  enterBg: '#1a1207',
  enterText: '#F2C94C',
  enterHoverBg: '#2d1f0e',
}

const NIGHT = {
  skyTop: '#0a0e1a',
  skyBot: '#1a1e3a',
  ground: '#1a1610',
  groundEdge: '#0d0b08',
  text: '#f0efe9',
  textShadow: 'rgba(0,0,0,0.6)',
  panelBorder: 'rgba(240,239,233,0.15)',
  overlay: 'rgba(10,14,26,0.3)',
  toggleBg: '#f0efe9',
  toggleText: '#0a0e1a',
  tumbleweed: '#5a4a2a',
  subtitle: 'rgba(240,239,233,0.5)',
  enterBg: '#f0efe9',
  enterText: '#0a0e1a',
  enterHoverBg: '#d4d3cd',
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
  y: Math.random() * 40,
  size: 1 + Math.random() * 2,
  delay: Math.random() * 3,
  duration: 2 + Math.random() * 2,
}))

// ─── Screen dimensions helper ───────────────────────────────────────────────

function getScreenDims() {
  return {
    sw: (BEZEL.screen.width / 100) * window.innerWidth,
    sh: (BEZEL.screen.height / 100) * window.innerHeight,
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function WesternTown() {
  const [isNight, setIsNight] = useState(false)
  const [screenDims, setScreenDims] = useState(getScreenDims)
  const mouseRef = useRef({ x: 0, y: 0 })
  const [parallaxX, setParallaxX] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const palette = isNight ? NIGHT : DAY

  // Resize handler
  useEffect(() => {
    function onResize() { setScreenDims(getScreenDims()) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Mouse parallax
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const centerX = rect.left + rect.width / 2
    const normalizedX = (e.clientX - centerX) / (rect.width / 2) // -1 to 1
    mouseRef.current.x = normalizedX
    setParallaxX(normalizedX * -20) // 20px max shift
  }, [])

  const { sw, sh } = screenDims

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      style={{
        width: sw > 0 ? `${Math.round(sw)}px` : '100%',
        height: sh > 0 ? `${Math.round(sh)}px` : '100vh',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* ── Sky gradient ───────────────────────────────────────────── */}
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

      {/* ── Town background (parallax) ─────────────────────────────── */}
      <motion.div
        animate={{ x: parallaxX }}
        transition={{ type: 'spring', stiffness: 120, damping: 25 }}
        style={{
          position: 'absolute',
          bottom: '18%',
          left: '-5%',
          right: '-5%',
          height: '45%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: '2%',
          pointerEvents: 'none',
        }}
      >
        {/* Placeholder town buildings — CSS silhouettes */}
        {[
          { w: '8%', h: '55%' },
          { w: '12%', h: '75%' },
          { w: '10%', h: '65%' },
          { w: '6%', h: '45%' },
          { w: '14%', h: '80%' },
          { w: '9%', h: '60%' },
          { w: '11%', h: '70%' },
          { w: '7%', h: '50%' },
        ].map((b, i) => (
          <motion.div
            key={i}
            animate={{
              backgroundColor: isNight ? '#0d0b08' : '#8B7332',
            }}
            transition={{ duration: 0.8 }}
            style={{
              width: b.w,
              height: b.h,
              borderRadius: '2px 2px 0 0',
              position: 'relative',
            }}
          >
            {/* Window lights (night only) */}
            {isNight && (
              <>
                <div style={{
                  position: 'absolute', top: '15%', left: '20%', width: '25%', height: '12%',
                  backgroundColor: 'rgba(255,180,60,0.7)', borderRadius: 1,
                }} />
                <div style={{
                  position: 'absolute', top: '15%', right: '20%', width: '25%', height: '12%',
                  backgroundColor: Math.random() > 0.3 ? 'rgba(255,180,60,0.5)' : 'transparent',
                  borderRadius: 1,
                }} />
                <div style={{
                  position: 'absolute', top: '40%', left: '20%', width: '25%', height: '12%',
                  backgroundColor: Math.random() > 0.5 ? 'rgba(255,180,60,0.4)' : 'transparent',
                  borderRadius: 1,
                }} />
              </>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* ── Ground ─────────────────────────────────────────────────── */}
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
          height: '18%',
        }}
      />

      {/* ── Tumbleweed ─────────────────────────────────────────────── */}
      <motion.div
        animate={{
          x: [sw * -0.1, sw * 1.1],
          rotate: [0, 720],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'linear',
          repeatDelay: 4,
        }}
        style={{
          position: 'absolute',
          bottom: '17%',
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: `2px solid ${palette.tumbleweed}`,
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      />

      {/* ── Content overlay ────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          padding: '5%',
        }}
      >
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 'clamp(48px, 8vw, 120px)',
            color: palette.text,
            textShadow: `2px 2px 8px ${palette.textShadow}`,
            letterSpacing: '0.08em',
            lineHeight: 1,
            marginBottom: '0.15em',
            textAlign: 'center',
          }}
        >
          ZK DESIGNS
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 'clamp(10px, 1.4vw, 16px)',
            color: palette.subtitle,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '2em',
          }}
        >
          designer / developer
        </motion.p>

        {/* 2×2 Panel Grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'clamp(8px, 1.5vw, 16px)',
            width: 'clamp(200px, 45vw, 480px)',
            marginBottom: '2em',
          }}
        >
          {PANELS.map((panel) => (
            <motion.div
              key={panel.label}
              whileHover={{ scale: 1.05, y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{
                aspectRatio: '3/4',
                backgroundColor: panel.color,
                borderRadius: 6,
                border: `1px solid ${palette.panelBorder}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                padding: '8%',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Cowboy silhouette placeholder */}
              <div
                style={{
                  position: 'absolute',
                  inset: '10%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.15,
                }}
              >
                <svg width="80%" height="80%" viewBox="0 0 100 120" fill="black">
                  <circle cx="50" cy="20" r="12" />
                  <ellipse cx="50" cy="15" rx="20" ry="4" />
                  <rect x="40" y="32" width="20" height="40" rx="4" />
                  <rect x="35" y="72" width="12" height="35" rx="3" />
                  <rect x="53" y="72" width="12" height="35" rx="3" />
                </svg>
              </div>
              <span
                style={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: 'clamp(12px, 1.8vw, 20px)',
                  color: '#000000',
                  opacity: 0.7,
                  letterSpacing: '0.1em',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {panel.label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Enter button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 'clamp(11px, 1.2vw, 14px)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            backgroundColor: palette.enterBg,
            color: palette.enterText,
            border: 'none',
            padding: '0.8em 2.5em',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          [ Enter Town ]
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
          top: 16,
          right: 16,
          zIndex: 20,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
        }}
      >
        {isNight ? '☀' : '☾'}
      </motion.button>
    </div>
  )
}
