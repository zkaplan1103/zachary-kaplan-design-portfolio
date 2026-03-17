import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'
import { depthReveal } from '@/lib/variants'

// ── Ambient particles ─────────────────────────────────────────────────────────

const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left: `${5 + (i * 4.3) % 90}%`,
  top: `${10 + (i * 7.1) % 80}%`,
  size: i % 3 === 0 ? 3 : 2,
  colorDark: i % 2 === 0 ? 'rgba(65,105,255,0.4)' : 'rgba(0,200,255,0.3)',
  colorLight: i % 2 === 0 ? 'rgba(100,80,40,0.2)' : 'rgba(150,120,60,0.15)',
  duration: 4 + (i % 5),
  delay: (i * 0.3) % 3,
  yRange: 14 + (i % 8),
}))

// ── TerminalInput ─────────────────────────────────────────────────────────────

function TerminalInput({
  label,
  type = 'text',
  dark,
  multiline = false,
}: {
  label: string
  type?: string
  dark: boolean
  multiline?: boolean
}) {
  const [focused, setFocused] = useState(false)

  const inputStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.875rem',
    color: 'var(--fg)',
    background: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${
      focused
        ? dark
          ? 'rgba(65,105,255,0.7)'
          : 'rgba(150,120,60,0.6)'
        : dark
        ? 'rgba(65,105,255,0.25)'
        : 'rgba(150,120,60,0.3)'
    }`,
    boxShadow: focused
      ? dark
        ? '0 2px 0 rgba(65,105,255,0.25)'
        : '0 2px 0 rgba(150,120,60,0.2)'
      : 'none',
    outline: 'none',
    width: '100%',
    padding: '8px 0 8px 4px',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    resize: 'none' as const,
    letterSpacing: '0.03em',
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: multiline ? 'flex-start' : 'center',
        gap: 8,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.875rem',
          color: dark ? 'rgba(65,105,255,0.55)' : 'rgba(100,80,40,0.5)',
          userSelect: 'none',
          flexShrink: 0,
          paddingTop: multiline ? 10 : 0,
        }}
      >
        &gt;
      </span>
      {multiline ? (
        <textarea
          placeholder={label}
          rows={4}
          style={inputStyle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      ) : (
        <input
          type={type}
          placeholder={label}
          style={inputStyle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      )}
    </div>
  )
}

// ── Main Section ─────────────────────────────────────────────────────────────

export function ContactSection() {
  const theme = useUIStore((s) => s.theme)
  const dark = theme === 'dark'
  const formRef = useRef<HTMLFormElement>(null)
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <section
      id="contact"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        overflow: 'hidden',
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
        SECTION_05 / CONTACT
      </div>

      {/* Ambient particles */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            animate={{ y: [0, -p.yRange, 0], opacity: [0.2, 0.55, 0.2] }}
            transition={{
              repeat: Infinity,
              duration: p.duration,
              delay: p.delay,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: dark ? p.colorDark : p.colorLight,
            }}
          />
        ))}
      </div>

      {/* Form content */}
      <motion.div
        variants={depthReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}
      >
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)',
            letterSpacing: '-0.01em',
            color: 'var(--fg)',
            marginBottom: '0.4rem',
            marginTop: 0,
          }}
        >
          &gt; ESTABLISH_CONTACT
          <motion.span
            animate={{ opacity: [1, 1, 0, 0, 1] }}
            transition={{
              duration: 0.8,
              times: [0, 0.4, 0.5, 0.9, 1],
              repeat: Infinity,
              ease: 'linear' as const,
            }}
            style={{ marginLeft: '0.1em', color: dark ? '#4169ff' : '#c9a96e' }}
          >
            _
          </motion.span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25, duration: 0.5 }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            letterSpacing: '0.16em',
            color: dark ? 'rgba(65,105,255,0.45)' : 'rgba(100,80,40,0.45)',
            marginBottom: '3rem',
            marginTop: 0,
          }}
        >
          TRANSMISSION WILL BE RECEIVED
        </motion.p>

        {/* Form or sent confirmation */}
        {sent ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              color: dark ? 'rgba(65,105,255,0.8)' : 'rgba(100,80,40,0.7)',
              letterSpacing: '0.06em',
            }}
          >
            &gt; MESSAGE TRANSMITTED. STANDING BY.
            <motion.span
              animate={{ opacity: [1, 1, 0, 0, 1] }}
              transition={{
                duration: 0.8,
                times: [0, 0.4, 0.5, 0.9, 1],
                repeat: Infinity,
                ease: 'linear' as const,
              }}
            >
              _
            </motion.span>
          </motion.div>
        ) : (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            <TerminalInput label="NAME" dark={dark} />
            <TerminalInput label="EMAIL" type="email" dark={dark} />
            <TerminalInput label="MESSAGE" dark={dark} multiline />

            <motion.button
              type="submit"
              whileHover={{
                borderColor: dark ? 'rgba(0,200,255,0.7)' : 'rgba(150,120,60,0.7)',
                boxShadow: dark
                  ? '0 0 20px rgba(65,105,255,0.2)'
                  : '0 0 16px rgba(150,120,60,0.1)',
                color: dark ? 'rgba(0,200,255,0.9)' : 'rgba(100,80,40,0.9)',
              }}
              whileTap={{ scale: 0.97 }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                letterSpacing: '0.2em',
                color: dark ? 'rgba(65,105,255,0.7)' : 'rgba(100,80,40,0.7)',
                background: 'transparent',
                border: `1px solid ${dark ? 'rgba(65,105,255,0.35)' : 'rgba(150,120,60,0.35)'}`,
                borderRadius: 3,
                padding: '12px 32px',
                cursor: 'pointer',
                alignSelf: 'flex-start',
                marginTop: 8,
                transition: 'color 0.2s ease',
              }}
            >
              TRANSMIT_ ▶
            </motion.button>
          </form>
        )}
      </motion.div>
    </section>
  )
}
