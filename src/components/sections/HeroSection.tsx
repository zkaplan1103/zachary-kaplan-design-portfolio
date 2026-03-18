import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { motion, type Variants } from 'framer-motion'
import { charReveal, fadeIn } from '@/lib/variants'

// ── Constants ─────────────────────────────────────────────────────────────────

const NAME = 'ZACHARY KAPLAN'
const NAME_CHARS = NAME.split('')

const heroNameContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 1.0,
    },
  },
}

const ctaContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 2.8,
    },
  },
}

const CORNERS: CSSProperties[] = [
  { top: 20, left: 20 },
  { top: 20, right: 20 },
  { bottom: 20, left: 20 },
  { bottom: 20, right: 20 },
]

// ── Blinking cursor ───────────────────────────────────────────────────────────

function BlinkingCursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{
        times: [0, 0.49, 0.5, 0.99],
        repeat: Infinity,
        duration: 0.8,
        ease: 'linear' as const,
      }}
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: '0.55em',
        height: '1em',
        backgroundColor: 'var(--fg)',
        marginLeft: '4px',
        verticalAlign: 'text-bottom',
      }}
    />
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function HeroSection() {
  const [nameComplete, setNameComplete] = useState(false)

  useEffect(() => {
    // delayChildren 1.0s + 13 stagger intervals × 0.06s + 150ms buffer
    const ms = (1.0 + 13 * 0.06 + 0.15) * 1000
    const id = setTimeout(() => setNameComplete(true), ms)
    return () => clearTimeout(id)
  }, [])

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        backgroundColor: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Border rect — draws clockwise pathLength 0→1 over 1.5s */}
      <svg
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          width: 'calc(100% - 32px)',
          height: 'calc(100% - 32px)',
          pointerEvents: 'none',
          zIndex: 1,
          overflow: 'visible',
        }}
      >
        <motion.rect
          x="0.5"
          y="0.5"
          width="99%"
          height="99%"
          fill="none"
          stroke="rgba(240,239,233,0.12)"
          strokeWidth={1}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: 'linear' as const }}
        />
      </svg>

      {/* Corner dots — snap in at t=2.8s */}
      {CORNERS.map((pos, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0, delay: 2.8 }}
          aria-hidden="true"
          style={{
            position: 'absolute',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--muted)',
            zIndex: 2,
            lineHeight: 1,
            ...pos,
          }}
        >
          ·
        </motion.span>
      ))}

      {/* Content stack */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          textAlign: 'center' as const,
          padding: '0 24px',
        }}
      >
        {/* Name — typewriter reveal */}
        <motion.h1
          variants={heroNameContainer}
          initial="hidden"
          animate="visible"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'clamp(40px, 8vw, 100px)',
            color: 'var(--fg)',
            letterSpacing: '0.05em',
            lineHeight: 1,
            margin: 0,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-end',
            whiteSpace: 'nowrap' as const,
          }}
        >
          {NAME_CHARS.map((char, i) => (
            <motion.span key={i} variants={charReveal}>
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
          {!nameComplete && <BlinkingCursor />}
        </motion.h1>

        {/* Separator — scaleX left-to-right */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.4, ease: 'linear' as const, delay: 2.0 }}
          style={{
            width: '100%',
            maxWidth: '360px',
            height: '1px',
            backgroundColor: 'var(--muted)',
            transformOrigin: 'left' as const,
            marginBottom: '1.5rem',
            opacity: 0.4,
          }}
        />

        {/* Role */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 2.4 }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            letterSpacing: '0.2em',
            color: 'var(--muted)',
            textTransform: 'uppercase' as const,
            margin: 0,
            marginBottom: '2.5rem',
          }}
        >
          DESIGNER / DEVELOPER
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={ctaContainer}
          initial="hidden"
          animate="visible"
          style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap' as const,
            justifyContent: 'center' as const,
          }}
        >
          {(['[ VIEW WORK ]', '[ CONTACT ]'] as const).map((label) => (
            <motion.a
              key={label}
              href={label.includes('WORK') ? '#work' : '#contact'}
              variants={fadeIn}
              whileHover={{ y: -4 }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,239,233,0.4)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,239,233,0.15)'
              }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                letterSpacing: '0.15em',
                color: 'var(--fg)',
                textDecoration: 'none',
                border: '1px solid rgba(240,239,233,0.15)',
                padding: '10px 20px',
                display: 'inline-block',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
            >
              {label}
            </motion.a>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator — fixed to CRT screen bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 3.2 }}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <motion.span
          animate={{ opacity: [1, 1, 0.15, 0.15] }}
          transition={{
            times: [0, 0.49, 0.5, 0.99],
            repeat: Infinity,
            duration: 0.8,
            ease: 'linear' as const,
            delay: 3.7,
          }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '6px',
            letterSpacing: '0.15em',
            color: 'var(--muted)',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <svg width="8" height="10" viewBox="0 0 8 10" shapeRendering="crispEdges" aria-hidden="true">
            <path d="M3 0 H5 V6 H7 L4 10 L1 6 H3 Z" fill="currentColor" />
          </svg>
          SCROLL
        </motion.span>
      </motion.div>
    </section>
  )
}
