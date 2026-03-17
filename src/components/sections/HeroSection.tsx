import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
// import { useLenis } from 'lenis/react'
// import { MagneticButton } from '@/components/animations/MagneticButton'
// import { Button } from '@/components/ui/Button'
// import { slideUp } from '@/lib/variants'
import { charReveal, bootContainer } from '@/lib/variants'
import { useUIStore } from '@/store/uiStore'

// ── Sub-components ──────────────────────────────────────────────────────────

interface EnvProps {
  dark: boolean
}

/**
 * GridFloor — CSS 3D perspective grid plane (bottom 60% of hero section).
 * perspective + rotateX creates the classic converging retrowave floor look.
 * Grid lines converge at the vanishing point (top-center of the container).
 */
function GridFloor({ dark }: EnvProps) {
  const gridColor = dark ? 'rgba(80,255,100,0.14)' : 'rgba(100,80,40,0.10)'
  const fogColor = dark ? '#0d0d0d' : '#f8f7f4'

  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
        overflow: 'hidden',
        perspective: '400px',
        perspectiveOrigin: '50% 0%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Rotated grid plane — hinge at top edge = horizon */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '-30%',
          right: '-30%',
          height: '400%',
          transform: 'rotateX(80deg)',
          transformOrigin: '50% 0%',
          backgroundImage: [
            `repeating-linear-gradient(${gridColor} 0, ${gridColor} 1px, transparent 1px, transparent 70px)`,
            `repeating-linear-gradient(90deg, ${gridColor} 0, ${gridColor} 1px, transparent 1px, transparent 70px)`,
          ].join(', '),
        }}
      />

      {/* Depth fog — hides far grid edge, reinforces horizon */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to bottom, ${fogColor} 0%, ${fogColor} 8%, transparent 55%)`,
          pointerEvents: 'none',
        }}
      />
    </motion.div>
  )
}

/**
 * HorizonLine — 1px glowing line at the grid/sky boundary.
 * Positioned at the top of the GridFloor (bottom: 60% of section).
 */
function HorizonLine({ dark }: EnvProps) {
  const lineColor = dark ? 'rgba(80,255,100,0.7)' : 'rgba(150,120,60,0.5)'
  const glowColor = dark ? 'rgba(80,255,100,0.2)' : 'rgba(150,120,60,0.12)'

  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        bottom: '60%',
        left: 0,
        right: 0,
        height: '1px',
        zIndex: 1,
        background: `linear-gradient(90deg, transparent 0%, ${lineColor} 20%, ${lineColor} 80%, transparent 100%)`,
        boxShadow: `0 0 8px 2px ${glowColor}`,
        pointerEvents: 'none',
      }}
    />
  )
}

// ── Main component ───────────────────────────────────────────────────────────

const NAME_CHARS = 'ZACHARY KAPLAN'.split('')

export function HeroSection() {
  const theme = useUIStore((s) => s.theme)
  const dark = theme === 'dark'

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* z:0 — 3D grid floor (bottom 60% of section) */}
      <GridFloor dark={dark} />

      {/* z:1 — Horizon glow line at grid/sky boundary */}
      <HorizonLine dark={dark} />

      {/*
       * z:10 — Text content.
       * Occupies top 60% of section (above horizon), content centered within.
       * Text floats visually above the grid floor.
       */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: '40%',
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          padding: '0 24px',
        }}
      >
        {/* Status line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase' as const,
            color: dark ? 'rgba(80,255,100,0.5)' : 'rgba(100,80,40,0.5)',
            marginBottom: '2rem',
          }}
        >
          &gt;_ SYSTEM ONLINE
        </motion.p>

        {/* Name — typewriter stagger via bootContainer */}
        <motion.h1
          variants={bootContainer}
          initial="hidden"
          animate="visible"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(2rem, 6vw, 4.5rem)',
            fontWeight: 500,
            letterSpacing: '0.2em',
            color: 'var(--fg)',
            marginBottom: '1.25rem',
            lineHeight: 1,
            textAlign: 'center' as const,
            whiteSpace: 'nowrap' as const,
          }}
        >
          {NAME_CHARS.map((char, i) => (
            <motion.span
              key={i}
              variants={charReveal}
              style={{
                display: char === ' ' ? 'inline-block' : 'inline',
                width: char === ' ' ? '0.5em' : 'auto',
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.h1>

        {/* Role + blinking cursor */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.5 }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(0.75rem, 1.8vw, 1rem)',
            color: 'var(--muted)',
            letterSpacing: '0.08em',
            marginBottom: '2.5rem',
            textAlign: 'center' as const,
          }}
        >
          Frontend Designer &amp; Developer
          <motion.span
            animate={{ opacity: [1, 1, 0, 0, 1] }}
            transition={{
              delay: 2.1,
              duration: 0.8,
              times: [0, 0.4, 0.5, 0.9, 1],
              repeat: Infinity,
              ease: 'linear' as const,
            }}
            style={{ marginLeft: '0.15em' }}
          >
            █
          </motion.span>
        </motion.p>

        {/* CTAs — commented out while building theme
        <motion.div
          variants={slideUp}
          initial="hidden"
          animate="visible"
          custom={2.4}
          transition={{ delay: 2.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' as const, justifyContent: 'center' }}
        >
          <MagneticButton>
            <Button size="lg" onClick={() => scrollTo('work')}>
              View Work
            </Button>
          </MagneticButton>
          <MagneticButton>
            <Button size="lg" variant="secondary" onClick={() => scrollTo('contact')}>
              Get in Touch
            </Button>
          </MagneticButton>
        </motion.div>
        */}
      </div>

      {/*
       * Scroll indicator.
       * position:fixed inside CRTScreen (which has transform:perspective) =
       * fixed relative to the screen wrapper (not the browser viewport).
       * Anchors to the bottom of the visible CRT screen regardless of section height.
       */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.2, duration: 0.6 }}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          gap: '6px',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase' as const,
            color: 'var(--muted)',
          }}
        >
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          style={{ color: 'var(--muted)' }}
        >
          <ArrowDown size={14} />
        </motion.div>
      </motion.div>
    </section>
  )
}
