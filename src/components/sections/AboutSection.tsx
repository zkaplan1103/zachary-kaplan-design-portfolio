import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'

// ── Sub-components ──────────────────────────────────────────────────────────

function CornerBracket({
  position,
  color,
}: {
  position: 'tl' | 'tr' | 'bl' | 'br'
  color: string
}) {
  const base: React.CSSProperties = {
    position: 'absolute',
    width: 16,
    height: 16,
    pointerEvents: 'none',
    zIndex: 10,
  }
  const borders: Record<string, React.CSSProperties> = {
    tl: { top: -1, left: -1, borderTop: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` },
    tr: { top: -1, right: -1, borderTop: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` },
    bl: { bottom: -1, left: -1, borderBottom: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` },
    br: { bottom: -1, right: -1, borderBottom: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` },
  }
  return <div aria-hidden="true" style={{ ...base, ...borders[position] }} />
}

function HudBadge({ children, dark }: { children: React.ReactNode; dark: boolean }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.6rem',
        letterSpacing: '0.14em',
        color: dark ? 'rgba(80,255,100,0.5)' : 'rgba(100,80,40,0.45)',
        border: `1px solid ${dark ? 'rgba(80,255,100,0.2)' : 'rgba(150,120,60,0.2)'}`,
        padding: '3px 8px',
        borderRadius: 2,
        whiteSpace: 'nowrap' as const,
      }}
    >
      {children}
    </span>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function AboutSection() {
  const theme = useUIStore((s) => s.theme)
  const dark = theme === 'dark'

  const sectionRef = useRef<HTMLDivElement>(null)

  // ── Mouse tracking ───────────────────────────────────────────────────────
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 200, damping: 30 })
  const springY = useSpring(mouseY, { stiffness: 200, damping: 30 })
  // Pixel-based: center = 0, edges ≈ ±half-dimension
  const mouseRotateX = useTransform(springY, [-200, 200], [6, -6])
  const mouseRotateY = useTransform(springX, [-430, 430], [-8, 8])

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left - rect.width / 2)
    mouseY.set(e.clientY - rect.top - rect.height / 2)
  }
  function handleMouseLeave() {
    mouseX.set(0)
    mouseY.set(0)
  }

  // ── Scroll-linked rotation (same pattern as ParallaxLayer) ───────────────
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  // entering from below (8°) → centered (5°) → above viewport (2°)
  const scrollRotateY = useTransform(scrollYProgress, [0, 0.5, 1], [8, 5, 2])

  // ── Theme colors ─────────────────────────────────────────────────────────
  const cardBg = dark ? 'rgba(10, 16, 10, 0.96)' : 'rgba(252, 250, 246, 0.97)'
  const cardBorder = dark ? 'rgba(80,255,100,0.25)' : 'rgba(150,120,60,0.3)'
  const cardGlow = dark
    ? '0 0 40px rgba(80,255,100,0.06), 0 25px 60px rgba(0,0,0,0.6)'
    : '0 20px 60px rgba(0,0,0,0.1), inset 0 0 60px rgba(150,120,60,0.04)'
  const hudText = dark ? 'rgba(80,255,100,0.6)' : 'rgba(100,80,40,0.55)'
  const hudBg = dark ? 'rgba(80,255,100,0.05)' : 'rgba(150,120,60,0.06)'
  const photoBorder = dark ? 'rgba(80,255,100,0.15)' : 'rgba(150,120,60,0.2)'
  const redact = dark ? 'rgba(80,255,100,0.32)' : 'rgba(100,80,40,0.18)'
  const bracketColor = dark ? 'rgba(80,255,100,0.4)' : 'rgba(150,120,60,0.35)'

  return (
    <section
      id="about"
      ref={sectionRef}
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
      }}
    >
      {/* Section label */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          letterSpacing: '0.2em',
          color: dark ? 'rgba(80,255,100,0.18)' : 'rgba(100,80,40,0.18)',
          textTransform: 'uppercase' as const,
          pointerEvents: 'none',
        }}
      >
        SECTION_02 / PROFILE
      </div>

      {/* Outer perspective container */}
      <div style={{ perspective: '1200px', width: '100%', maxWidth: 860 }}>
        {/* Relative wrapper — anchors floating badges to card width */}
        <div style={{ position: 'relative' }}>

          {/* Floating badge — top right */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ delay: 1.0, duration: 0.5 }}
            style={{ position: 'absolute', top: -28, right: 0, zIndex: 10 }}
          >
            <HudBadge dark={dark}>CLEARANCE: OPEN</HudBadge>
          </motion.div>

          {/* Floating badge — bottom left */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            style={{ position: 'absolute', bottom: -28, left: 0, zIndex: 10 }}
          >
            <HudBadge dark={dark}>SPEC: FRONTEND DESIGN + ENGINEERING</HudBadge>
          </motion.div>

          {/*
           * ── Layer 1: Entrance ──────────────────────────────────────────
           * Handles opacity + y only — no rotateY conflict with scroll layer
           */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformStyle: 'preserve-3d' as const }}
          >
            {/*
             * ── Layer 2: Scroll rotation ───────────────────────────────
             * rotateY driven by scrollYProgress via useTransform
             */}
            <motion.div
              style={{
                rotateY: scrollRotateY,
                transformStyle: 'preserve-3d' as const,
              }}
            >
              {/*
               * ── Layer 3: Mouse rotation ────────────────────────────
               * rotateX + rotateY from mouse springs
               * Idle float (y) lives here — separate from scroll rotation
               */}
              <motion.div
                style={{
                  rotateX: mouseRotateX,
                  rotateY: mouseRotateY,
                  transformStyle: 'preserve-3d' as const,
                }}
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                {/* ─── The Card ──────────────────────────────────────── */}
                <div
                  style={{
                    position: 'relative',
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 8,
                    boxShadow: cardGlow,
                    overflow: 'hidden',
                    cursor: 'default',
                    userSelect: 'none' as const,
                  }}
                >
                  <CornerBracket position="tl" color={bracketColor} />
                  <CornerBracket position="tr" color={bracketColor} />
                  <CornerBracket position="bl" color={bracketColor} />
                  <CornerBracket position="br" color={bracketColor} />

                  {/* Scan line — dark mode only */}
                  {dark && (
                    <motion.div
                      aria-hidden="true"
                      animate={{ y: ['-5%', '105%'] }}
                      transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: 'linear',
                        repeatDelay: 1.5,
                      }}
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        height: 2,
                        background: 'rgba(80,255,100,0.12)',
                        zIndex: 20,
                        pointerEvents: 'none',
                      }}
                    />
                  )}

                  {/* ── HUD top bar ──────────────────────────────────── */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      backgroundColor: hudBg,
                      borderBottom: `1px solid ${cardBorder}`,
                    }}
                  >
                    {/* Traffic dots */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['#ff5f56', '#ffbd2e', dark ? 'rgba(80,255,100,0.7)' : '#27c93f'].map(
                        (c, i) => (
                          <div
                            key={i}
                            style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c }}
                          />
                        )
                      )}
                    </div>
                    {/* Filename */}
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        letterSpacing: '0.12em',
                        color: hudText,
                      }}
                    >
                      &gt; ZACHARY_KAPLAN.md
                    </span>
                    {/* Classification tag */}
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.6rem',
                        letterSpacing: '0.1em',
                        color: dark ? 'rgba(80,255,100,0.3)' : 'rgba(100,80,40,0.28)',
                      }}
                    >
                      [CLASSIFIED]
                    </span>
                  </div>

                  {/* ── Card body: 2/5 photo + 3/5 bio ─────────────── */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 3fr',
                      minHeight: 320,
                    }}
                  >
                    {/* Left — photo placeholder */}
                    <div
                      style={{
                        padding: 24,
                        borderRight: `1px solid ${cardBorder}`,
                        display: 'flex',
                        flexDirection: 'column' as const,
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 16,
                        backgroundColor: dark ? 'rgba(80,255,100,0.02)' : 'rgba(150,120,60,0.03)',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '3/4',
                          border: `1px dashed ${photoBorder}`,
                          borderRadius: 4,
                          display: 'flex',
                          flexDirection: 'column' as const,
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.55rem',
                            letterSpacing: '0.18em',
                            color: hudText,
                            opacity: 0.55,
                          }}
                        >
                          IMAGE_PENDING
                        </span>
                        <div style={{ width: 28, height: 2, backgroundColor: redact }} />
                      </div>
                      {/* Redaction bars */}
                      <div
                        style={{
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column' as const,
                          gap: 7,
                        }}
                      >
                        {[68, 48, 80].map((w, i) => (
                          <div
                            key={i}
                            style={{
                              height: 6,
                              width: `${w}%`,
                              backgroundColor: redact,
                              borderRadius: 1,
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Right — bio */}
                    <div
                      style={{
                        padding: '28px 28px 28px 28px',
                        display: 'flex',
                        flexDirection: 'column' as const,
                        justifyContent: 'center',
                        gap: 16,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.6rem',
                          letterSpacing: '0.2em',
                          color: hudText,
                          textTransform: 'uppercase' as const,
                        }}
                      >
                        // BIO.TXT
                      </div>
                      <p
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.95rem',
                          lineHeight: 1.75,
                          color: 'var(--fg)',
                          margin: 0,
                        }}
                      >
                        I&apos;m Zachary Kaplan — a frontend designer and developer. I believe great
                        design is invisible: it guides, delights, and gets out of the way.
                      </p>
                      <p
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.875rem',
                          lineHeight: 1.75,
                          color: 'var(--muted)',
                          margin: 0,
                        }}
                      >
                        With a background spanning visual design, motion, and frontend engineering, I
                        bring a holistic perspective to every project — care for every pixel and the
                        micro-interactions that make a product feel alive.
                      </p>
                    </div>
                  </div>

                  {/* ── HUD data bar ─────────────────────────────────── */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '9px 16px',
                      backgroundColor: hudBg,
                      borderTop: `1px solid ${cardBorder}`,
                      gap: 12,
                      flexWrap: 'wrap' as const,
                    }}
                  >
                    {['LOC: NEW YORK, NY', '·', 'STATUS: AVAILABLE', '·'].map((item, i) => (
                      <span
                        key={i}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.6rem',
                          letterSpacing: '0.12em',
                          color:
                            item === '·'
                              ? dark
                                ? 'rgba(80,255,100,0.18)'
                                : 'rgba(100,80,40,0.18)'
                              : hudText,
                        }}
                      >
                        {item}
                      </span>
                    ))}
                    {/* Redaction block */}
                    <div style={{ display: 'flex', gap: 3, marginLeft: 'auto' }}>
                      {[38, 26, 50].map((w, i) => (
                        <div
                          key={i}
                          style={{ width: w, height: 8, backgroundColor: redact, borderRadius: 1 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {/* ─── End Card ──────────────────────────────────────── */}
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
