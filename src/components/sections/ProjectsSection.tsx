import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '@/store/uiStore'
import { depthReveal, cardStagger, loadExpand } from '@/lib/variants'
import { projects } from '@/data/projects'
import type { Project } from '@/types'

// ── CornerBracket ────────────────────────────────────────────────────────────

function CornerBracket({
  position,
  color,
  visible,
}: {
  position: 'tl' | 'tr' | 'bl' | 'br'
  color: string
  visible: boolean
}) {
  const base: React.CSSProperties = {
    position: 'absolute',
    width: 14,
    height: 14,
    pointerEvents: 'none',
    zIndex: 10,
    opacity: visible ? 0.7 : 0,
    transition: 'opacity 0.2s ease',
  }
  const borders: Record<string, React.CSSProperties> = {
    tl: { top: -1, left: -1, borderTop: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` },
    tr: { top: -1, right: -1, borderTop: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` },
    bl: { bottom: -1, left: -1, borderBottom: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` },
    br: { bottom: -1, right: -1, borderBottom: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` },
  }
  return <div aria-hidden="true" style={{ ...base, ...borders[position] }} />
}

// ── ProjectFileCard ──────────────────────────────────────────────────────────

function ProjectFileCard({ project, dark, index }: { project: Project; dark: boolean; index: number }) {
  const [loading, setLoading] = useState(false)
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()

  const cardBg = dark ? 'rgba(7,7,20,0.95)' : 'rgba(252,250,246,0.97)'
  const cardBorder = dark ? 'rgba(65,105,255,0.25)' : 'rgba(150,120,60,0.3)'
  const bracketColor = dark ? 'rgba(65,105,255,0.7)' : 'rgba(150,120,60,0.5)'
  const metaBarBg = dark ? 'rgba(65,105,255,0.05)' : 'rgba(150,120,60,0.06)'
  const metaBarBorder = dark ? 'rgba(65,105,255,0.15)' : 'rgba(150,120,60,0.2)'
  const metaText = dark ? 'rgba(65,105,255,0.6)' : 'rgba(100,80,40,0.55)'
  const thumbBg = dark ? 'rgba(14,14,36,1)' : 'rgba(240,238,234,1)'
  const pixelGrid = dark
    ? `repeating-linear-gradient(rgba(65,105,255,0.04) 0, rgba(65,105,255,0.04) 1px, transparent 1px, transparent 8px),
       repeating-linear-gradient(90deg, rgba(65,105,255,0.04) 0, rgba(65,105,255,0.04) 1px, transparent 1px, transparent 8px)`
    : `repeating-linear-gradient(rgba(100,80,40,0.06) 0, rgba(100,80,40,0.06) 1px, transparent 1px, transparent 8px),
       repeating-linear-gradient(90deg, rgba(100,80,40,0.06) 0, rgba(100,80,40,0.06) 1px, transparent 1px, transparent 8px)`

  const ledColor = hovered
    ? 'rgba(0,200,255,0.9)'
    : dark
    ? 'rgba(65,105,255,0.55)'
    : 'rgba(150,120,60,0.5)'

  const fileNum = `PROJECT_0${index + 1}.ZK`
  const fileSize = `${(1.2 + index * 0.7).toFixed(1)} MB`

  function handleClick() {
    if (loading) return
    setLoading(true)
    setTimeout(() => navigate(`/work/${project.slug}`), 520)
  }

  return (
    <motion.div
      variants={depthReveal}
      animate={loading ? 'expanding' : 'idle'}
      style={{ position: 'relative', cursor: 'pointer' }}
      whileHover={
        loading
          ? {}
          : {
              y: -8,
              boxShadow: dark
                ? '0 20px 60px rgba(65,105,255,0.15), 0 0 0 1px rgba(0,200,255,0.4)'
                : '0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(150,120,60,0.4)',
            }
      }
      transition={{ y: { type: 'spring', stiffness: 300, damping: 25 } }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={handleClick}
    >
      {/* loadExpand variant applied here */}
      <motion.div
        variants={loadExpand}
        animate={loading ? 'expanding' : 'idle'}
        style={{
          position: 'relative',
          backgroundColor: cardBg,
          border: `1px solid ${hovered && !loading ? (dark ? 'rgba(0,200,255,0.4)' : 'rgba(150,120,60,0.5)') : cardBorder}`,
          borderRadius: 6,
          overflow: 'hidden',
          transition: 'border-color 0.2s ease',
        }}
      >
        <CornerBracket position="tl" color={bracketColor} visible={hovered} />
        <CornerBracket position="tr" color={bracketColor} visible={hovered} />
        <CornerBracket position="bl" color={bracketColor} visible={hovered} />
        <CornerBracket position="br" color={bracketColor} visible={hovered} />

        {/* Thumbnail area */}
        <div
          style={{
            aspectRatio: '16/9',
            backgroundColor: thumbBg,
            backgroundImage: pixelGrid,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            filter: hovered ? 'blur(0px)' : 'blur(1px)',
            transition: 'filter 0.3s ease',
            overflow: 'hidden',
          }}
        >
          {project.thumbnail ? (
            <img
              src={project.thumbnail}
              alt={project.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                imageRendering: 'pixelated',
              }}
            />
          ) : (
            <>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.55rem',
                  letterSpacing: '0.18em',
                  color: metaText,
                  opacity: 0.5,
                }}
              >
                PREVIEW_UNAVAILABLE
              </span>
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                }}
              >
                {[40, 28, 52].map((w, i) => (
                  <div
                    key={i}
                    style={{
                      width: w,
                      height: 3,
                      borderRadius: 1,
                      backgroundColor: dark ? 'rgba(65,105,255,0.2)' : 'rgba(100,80,40,0.15)',
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* File metadata bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            backgroundColor: metaBarBg,
            borderTop: `1px solid ${metaBarBorder}`,
            gap: 8,
          }}
        >
          {/* Left: LED + filename */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <motion.div
              animate={
                hovered
                  ? { scale: [1, 1.4, 1], opacity: [0.9, 1, 0.9] }
                  : { scale: 1, opacity: 0.55 }
              }
              transition={
                hovered
                  ? { repeat: Infinity, duration: 1.2, ease: 'easeInOut' }
                  : { duration: 0.3 }
              }
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                backgroundColor: ledColor,
                flexShrink: 0,
                transition: 'background-color 0.2s ease',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.58rem',
                letterSpacing: '0.1em',
                color: metaText,
              }}
            >
              {fileNum}
            </span>
          </div>

          {/* Center: year + tag */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.55rem',
                letterSpacing: '0.08em',
                color: dark ? 'rgba(65,105,255,0.4)' : 'rgba(100,80,40,0.4)',
              }}
            >
              {project.year}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.55rem',
                letterSpacing: '0.08em',
                color: metaText,
                opacity: 0.7,
              }}
            >
              {project.tags[0]?.toUpperCase()}
            </span>
          </div>

          {/* Right: file size */}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.55rem',
              letterSpacing: '0.08em',
              color: dark ? 'rgba(65,105,255,0.35)' : 'rgba(100,80,40,0.35)',
            }}
          >
            {fileSize}
          </span>
        </div>

        {/* Project title (below meta bar) */}
        <div
          style={{
            padding: '10px 12px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '0.9rem',
              letterSpacing: '0.01em',
              color: 'var(--fg)',
            }}
          >
            {project.title}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.78rem',
              color: 'var(--muted)',
              lineHeight: 1.4,
            }}
          >
            {project.tagline}
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main Section ─────────────────────────────────────────────────────────────

export function ProjectsSection() {
  const theme = useUIStore((s) => s.theme)
  const dark = theme === 'dark'

  return (
    <section
      id="projects"
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
          color: dark ? 'rgba(65,105,255,0.20)' : 'rgba(100,80,40,0.18)',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}
      >
        SECTION_03 / PROJECTS
      </div>

      <div style={{ width: '100%', maxWidth: 860 }}>
        {/* Heading */}
        <motion.h2
          variants={depthReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
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
          SELECTED WORK
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
            marginBottom: '3rem',
            marginTop: 0,
          }}
        >
          {projects.length} FILES LOADED — SELECT TO OPEN
        </motion.p>

        {/* Card grid */}
        <motion.div
          variants={cardStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
          }}
        >
          {projects.map((project, i) => (
            <ProjectFileCard key={project.id} project={project} dark={dark} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
