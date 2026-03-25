import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Building dialogue data ─────────────────────────────────────────────────

export interface BuildingDialogue {
  name: string
  text: string
}

export const BUILDING_DIALOGUES: Record<string, BuildingDialogue> = {
  saloon: {
    name: "> THE LUCKY SPUR SALOON",
    text: "Cold drinks, warm company, and a story or two about the man who built this town.",
  },
  sheriff: {
    name: "> SHERIFF'S OFFICE",
    text: "Case files, wanted posters, evidence boards. Every project I have ever worked on lives in here.",
  },
  bank: {
    name: "> KAPLAN & CO. PORTFOLIO VAULT",
    text: "The good stuff. Locked up tight. You look trustworthy enough.",
  },
  telegraph: {
    name: "> TELEGRAPH OFFICE",
    text: "Send a message. I check this more than I should.",
  },
  smithy: {
    name: "> THE FORGE",
    text: "Where the process lives. How I think, how I build, how I work.",
  },
  general: {
    name: "> GENERAL STORE",
    text: "Tools of the trade. Everything a frontier designer needs under one roof.",
  },
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface PokemonTextBoxProps {
  buildingId: string | null
  sw: number
  sh: number
}

// ─── Component ──────────────────────────────────────────────────────────────

const TYPE_SPEED = 35 // ms per character

export function PokemonTextBox({ buildingId, sw, sh }: PokemonTextBoxProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cursorRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const dialogue = buildingId ? BUILDING_DIALOGUES[buildingId] : null

  // Typewriter effect
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (!dialogue) {
      setDisplayedText('')
      return
    }

    const fullText = dialogue.text
    let i = 0
    setDisplayedText('')

    intervalRef.current = setInterval(() => {
      i++
      setDisplayedText(fullText.slice(0, i))
      if (i >= fullText.length) {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }, TYPE_SPEED)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [dialogue])

  // Blinking cursor
  useEffect(() => {
    cursorRef.current = setInterval(() => setShowCursor((v) => !v), 400)
    return () => {
      if (cursorRef.current) clearInterval(cursorRef.current)
    }
  }, [])

  return (
    <AnimatePresence>
      {dialogue && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute',
            bottom: sh * 0.04,
            left: '50%',
            transform: 'translateX(-50%)',
            width: sw * 0.85,
            background: 'rgba(0, 0, 10, 0.92)',
            border: '3px solid #c8a050',
            borderRadius: 0,
            padding: '12px 20px',
            boxShadow: 'inset 0 0 0 1px rgba(200,160,80,0.3)',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          {/* Building name */}
          <p
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 10,
              color: '#c8a050',
              letterSpacing: '0.2em',
              margin: '0 0 6px 0',
              textTransform: 'uppercase',
            }}
          >
            {dialogue.name}
          </p>

          {/* Dialogue text */}
          <p
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 11,
              color: '#f0efe9',
              lineHeight: 1.6,
              margin: 0,
              minHeight: 36,
            }}
          >
            {displayedText}
          </p>

          {/* Blinking indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              right: 12,
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 10,
              color: '#c8a050',
              opacity: showCursor ? 1 : 0,
            }}
          >
            ▼
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
