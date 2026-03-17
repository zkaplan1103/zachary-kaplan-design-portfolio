import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'

// ── Data ─────────────────────────────────────────────────────────────────────

interface ExperienceEntry {
  id: string
  years: string
  role: string
  company: string
  location: string
  description: string
}

const EXPERIENCE: ExperienceEntry[] = [
  {
    id: '1',
    years: '2024 — PRESENT',
    role: 'Lead Frontend Designer',
    company: 'Studio / Agency Name',
    location: 'New York, NY',
    description:
      'Leading design and frontend development across client engagements — building design systems, interactive experiences, and motion-rich interfaces.',
  },
  {
    id: '2',
    years: '2022 — 2024',
    role: 'Frontend Designer',
    company: 'Digital Product Co.',
    location: 'New York, NY',
    description:
      'Designed and built interfaces for web products, bridging the gap between visual design and engineering with a focus on interaction quality.',
  },
  {
    id: '3',
    years: '2020 — 2022',
    role: 'UI / UX Designer',
    company: 'Creative Agency',
    location: 'Remote',
    description:
      'Created visual design and interaction specs for agency clients across brand, product, and editorial web projects.',
  },
  {
    id: '4',
    years: '2018 — 2020',
    role: 'Junior Designer',
    company: 'Design Studio',
    location: 'New York, NY',
    description:
      'Contributed to brand identity systems, print, and early web design work. Foundation in visual craft and typography.',
  },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function EntryPanel({
  entry,
  side,
  dark,
}: {
  entry: ExperienceEntry
  side: 'left' | 'right'
  dark: boolean
}) {
  const fromX = side === 'left' ? -40 : 40
  const cardBg = dark ? 'rgba(7,7,20,0.95)' : 'rgba(252,250,246,0.97)'
  const cardBorder = dark ? 'rgba(65,105,255,0.22)' : 'rgba(150,120,60,0.25)'
  const hudBg = dark ? 'rgba(65,105,255,0.05)' : 'rgba(150,120,60,0.05)'
  const hudText = dark ? 'rgba(65,105,255,0.55)' : 'rgba(100,80,40,0.5)'

  return (
    <motion.div
      initial={{ opacity: 0, x: fromX, scale: 0.92, filter: 'blur(4px)' }}
      whileInView={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      style={{
        width: '42%',
        position: 'relative',
        marginLeft: side === 'left' ? '0' : 'auto',
        marginRight: side === 'right' ? '0' : 'auto',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      <div
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        {/* HUD top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            backgroundColor: hudBg,
            borderBottom: `1px solid ${cardBorder}`,
          }}
        >
          <div style={{ display: 'flex', gap: 5 }}>
            {['#ff5f56', '#ffbd2e', dark ? 'rgba(65,105,255,0.7)' : '#27c93f'].map((c, i) => (
              <div
                key={i}
                style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c }}
              />
            ))}
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.58rem',
              letterSpacing: '0.1em',
              color: hudText,
            }}
          >
            {entry.role.replace(/\s+/g, '_').toUpperCase()}.ZK
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.55rem',
              letterSpacing: '0.08em',
              color: dark ? 'rgba(65,105,255,0.3)' : 'rgba(100,80,40,0.25)',
            }}
          >
            {entry.years.split(' ')[0]}
          </span>
        </div>

        {/* Panel body */}
        <div style={{ padding: '16px 14px 18px' }}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1rem',
              letterSpacing: '-0.01em',
              color: 'var(--fg)',
              margin: '0 0 4px',
            }}
          >
            {entry.role}
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              letterSpacing: '0.08em',
              color: hudText,
              margin: '0 0 10px',
            }}
          >
            {entry.company} · {entry.location}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.82rem',
              lineHeight: 1.65,
              color: 'var(--muted)',
              margin: 0,
            }}
          >
            {entry.description}
          </p>
        </div>

        {/* Timestamp bar */}
        <div
          style={{
            padding: '6px 14px',
            backgroundColor: hudBg,
            borderTop: `1px solid ${cardBorder}`,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.55rem',
              letterSpacing: '0.12em',
              color: hudText,
              opacity: 0.7,
            }}
          >
            TIMESTAMP: {entry.years}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Section ─────────────────────────────────────────────────────────────

export function ExperienceSection() {
  const theme = useUIStore((s) => s.theme)
  const dark = theme === 'dark'

  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start center', 'end center'],
  })
  const wireHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  const wireDimBg = dark ? 'rgba(65,105,255,0.1)' : 'rgba(150,120,60,0.12)'

  return (
    <section
      id="experience"
      style={{
        position: 'relative',
        minHeight: '100vh',
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
          color: dark ? 'rgba(65,105,255,0.20)' : 'rgba(100,80,40,0.18)',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}
      >
        SECTION_04 / EXPERIENCE
      </div>

      <div style={{ width: '100%', maxWidth: 860, margin: '0 auto' }}>
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            letterSpacing: '-0.01em',
            color: 'var(--fg)',
            marginBottom: '0.5rem',
            marginTop: 0,
          }}
        >
          CAREER LOG
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            letterSpacing: '0.18em',
            color: dark ? 'rgba(65,105,255,0.45)' : 'rgba(100,80,40,0.45)',
            marginBottom: '4rem',
            marginTop: 0,
          }}
        >
          {EXPERIENCE.length} ENTRIES — CHRONOLOGICAL DESC
        </motion.p>

        {/* Timeline container */}
        <div ref={sectionRef} style={{ position: 'relative', paddingBottom: 48 }}>
          {/* Central wire — dim background track */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: 2,
              transform: 'translateX(-50%)',
              backgroundColor: wireDimBg,
              borderRadius: 1,
            }}
          />
          {/* Active fill — scroll-driven */}
          <motion.div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              width: 2,
              height: wireHeight,
              transform: 'translateX(-50%)',
              background: 'linear-gradient(to bottom, #4169ff, #00c8ff)',
              borderRadius: 1,
              boxShadow: '0 0 8px rgba(65,105,255,0.4)',
            }}
          />

          {/* Entries */}
          {EXPERIENCE.map((entry, i) => {
            const side = i % 2 === 0 ? 'left' : 'right'
            return (
              <div
                key={entry.id}
                style={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: i < EXPERIENCE.length - 1 ? 48 : 0,
                }}
              >
                <EntryPanel entry={entry} side={side} dark={dark} />

                {/* Center node */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: dark ? '#4169ff' : '#c9a96e',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: dark
                      ? '0 0 12px rgba(65,105,255,0.6)'
                      : '0 0 8px rgba(201,169,110,0.5)',
                    border: `2px solid ${dark ? '#0e0e24' : '#ffffff'}`,
                    zIndex: 2,
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
