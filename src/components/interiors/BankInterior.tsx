import { motion, useTransform } from 'framer-motion'
import type { InteriorProps } from './interiorTypes'

// ─── Palettes ─────────────────────────────────────────────────────────────────
const NIGHT = {
  bg:        '#1A1412',
  wall:      '#1e1208',
  floor:     '#160c04',
  wood:      '#2a1608',
  accent:    '#FFB300',
  stroke:    '#c9a96e',
  strokeMid: 'rgba(201,169,110,0.5)',
  strokeFar: 'rgba(201,169,110,0.22)',
  vaultRing: 'rgba(201,169,110,0.55)',
  winFill:   'rgba(201,169,110,0.06)',
  sheen:     'rgba(255,179,0,0.22)',
  lampGlow:  'drop-shadow(0 0 10px #FFB300)',
  brass:     '#8B6914',
  brassMid:  '#c9a96e',
}
const DAY = {
  bg:        '#A1887F',
  wall:      '#BCAAA4',
  floor:     '#8D6E63',
  wood:      '#6D4C41',
  accent:    '#FFF9E0',
  stroke:    '#4E342E',
  strokeMid: 'rgba(78,52,46,0.5)',
  strokeFar: 'rgba(78,52,46,0.22)',
  vaultRing: 'rgba(78,52,46,0.5)',
  winFill:   'rgba(255,249,224,0.4)',
  sheen:     'rgba(255,248,150,0.35)',
  lampGlow:  'none',
  brass:     '#C09030',
  brassMid:  '#D4A030',
}

// ─── Shared geometry ──────────────────────────────────────────────────────────
const W = '160%'
const L = '-30%'

// viewBox: 420×280 — ceiling moulding and floor tile both visible.
// Teller counter: centre zone (x 66–328). Chandelier above (cx=210).
// Vault door far left (cx≈22, partially OOV, revealed by panning left).
// Floor safe far right (x=354, partially OOV, revealed by panning right).
// Brass railing spans full width as FG furniture element.

export function BankInterior({ isNight, mouseSpring, sw }: InteriorProps) {
  const p = isNight ? NIGHT : DAY

  // Group A (wall/ceiling/windows/floor): slow — 10% of sw
  const wallX = useTransform(mouseSpring, v => v * sw * -0.10)
  // Group B (teller counter, vault, safe, railing, teller NPC): fast — 20% of sw
  const furnX = useTransform(mouseSpring, v => v * sw * -0.20)

  return (
    <div style={{
      position: 'absolute', inset: 0,
      backgroundColor: p.bg,
      overflow: 'hidden',
      transition: 'background-color 1.5s',
    }}>

      {/* ══ GROUP A — WALL / CEILING / TELLER WINDOWS / FLOOR ══ */}
      <motion.div style={{
        position: 'absolute', top: 0, bottom: 0,
        left: L, width: W,
        x: wallX,
      }}>
        <svg
          viewBox="0 0 420 280"
          preserveAspectRatio="xMidYMid slice"
          width="100%" height="100%"
          style={{ display: 'block' }}
          fill="none" strokeLinecap="round" strokeLinejoin="round"
        >
          {/* Back wall */}
          <rect x="0" y="0" width="420" height="280" fill={p.wall} />

          {/* Ceiling moulding */}
          <line x1="0" y1="22" x2="420" y2="22" stroke={p.strokeFar} strokeWidth="1"   strokeOpacity="0.45" />
          <line x1="0" y1="28" x2="420" y2="28" stroke={p.strokeFar} strokeWidth="0.6" strokeOpacity="0.25" />

          {/* Chandelier — centre drop */}
          <line x1="210" y1="0" x2="210" y2="34" stroke={p.strokeFar} strokeWidth="1" />
          <ellipse cx="210" cy="42" rx="30" ry="9" fill={p.wood} stroke={p.strokeFar} strokeWidth="1" />
          {[-20, -10, 0, 10, 20].map(dx => (
            <g key={dx}>
              <line
                x1={210 + dx} y1="51"
                x2={210 + dx + 2} y2="68"
                stroke={p.strokeFar} strokeOpacity="0.4" strokeWidth="0.8"
              />
              <circle cx={210 + dx + 1} cy="70" r="3"
                fill={isNight ? p.accent : 'rgba(255,248,192,0.65)'}
                stroke={p.strokeFar} strokeWidth="0.7"
                style={{ filter: isNight ? `drop-shadow(0 0 6px ${p.accent})` : 'none' }}
              />
            </g>
          ))}
          {isNight && (
            <ellipse cx="210" cy="240" rx="55" ry="7"
              fill="rgba(255,179,0,0.1)" stroke="none"
              style={{ filter: 'blur(6px)' }}
            />
          )}

          {/* Teller windows — 3 bays on back wall */}
          {[86, 172, 258].map(x => (
            <g key={x}>
              <rect x={x} y="66" width="56" height="54"
                fill={isNight ? 'rgba(201,169,110,0.04)' : 'rgba(255,249,224,0.12)'}
                stroke={p.strokeFar} strokeWidth="0.9"
              />
              {[x + 10, x + 22, x + 34, x + 46].map(gx => (
                <line key={gx} x1={gx} y1="66" x2={gx} y2="120"
                  stroke={p.strokeFar} strokeOpacity="0.35" strokeWidth="0.7"
                />
              ))}
              <line x1={x} y1="93" x2={x + 56} y2="93"
                stroke={p.strokeFar} strokeOpacity="0.3" strokeWidth="0.8"
              />
              {/* Transaction slot */}
              <rect x={x + 10} y="116" width="36" height="4"
                stroke={p.strokeFar} strokeOpacity="0.5" strokeWidth="0.8"
              />
            </g>
          ))}

          {/* Day: light shaft from chandelier */}
          {!isNight && (
            <polygon
              points="184,51 236,51 258,240 160,240"
              fill="rgba(255,249,200,0.06)" stroke="none"
            />
          )}

          {/* Floor */}
          <rect x="0" y="248" width="420" height="32" fill={p.floor} />
          <line x1="0" y1="248" x2="420" y2="248" stroke={p.stroke} strokeWidth="1" strokeOpacity="0.5" />
          {/* Floor tile grid */}
          {[258, 268, 276].map(y => (
            <line key={y} x1="0" y1={y} x2="420" y2={y}
              stroke={p.strokeFar} strokeOpacity="0.15" strokeWidth="0.8"
            />
          ))}
        </svg>
      </motion.div>

      {/* ══ GROUP B — TELLER COUNTER / VAULT / SAFE / BRASS RAILING / TELLER NPC ══ */}
      <motion.div style={{
        position: 'absolute', top: 0, bottom: 0,
        left: L, width: W,
        x: furnX,
        pointerEvents: 'none',
      }}>
        <svg
          viewBox="0 0 420 280"
          preserveAspectRatio="xMidYMid slice"
          width="100%" height="100%"
          style={{ display: 'block' }}
          fill="none" strokeLinecap="round" strokeLinejoin="round"
        >
          {/* Vault door — far left, partially OOV (revealed by panning left) */}
          <circle cx="22"  cy="158" r="40" fill={isNight ? '#1a1006' : '#5D4037'} stroke={p.stroke} strokeWidth="1.2" />
          <circle cx="22"  cy="158" r="30" stroke={p.vaultRing} strokeWidth="1" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
            const rad = (deg * Math.PI) / 180
            return (
              <line
                key={deg}
                x1={22 + Math.cos(rad) * 10} y1={158 + Math.sin(rad) * 10}
                x2={22 + Math.cos(rad) * 26} y2={158 + Math.sin(rad) * 26}
                stroke={p.vaultRing} strokeOpacity="0.5" strokeWidth="0.9"
              />
            )
          })}
          <circle cx="22" cy="158" r="8" fill={p.wood} stroke={p.stroke} strokeWidth="1.2" />
          <line x1="30" y1="158" x2="50" y2="158" stroke={p.stroke} strokeWidth="2" />
          <circle cx="53" cy="158" r="4" fill={p.wood} stroke={p.stroke} strokeWidth="1" />
          {isNight && (
            <ellipse cx="22" cy="198" rx="30" ry="5"
              fill="rgba(255,179,0,0.08)" stroke="none"
              style={{ filter: 'blur(6px)' }}
            />
          )}

          {/* Teller counter */}
          <rect x="66"  y="120" width="262" height="16" fill={p.wood} stroke={p.stroke} strokeWidth="1.2" />
          <line x1="68"  y1="121" x2="326" y2="121" stroke={p.sheen} strokeWidth="2" />
          <line x1="66"  y1="136" x2="66"  y2="248" stroke={p.stroke} strokeWidth="1.2" />
          <line x1="328" y1="136" x2="328" y2="248" stroke={p.stroke} strokeWidth="1.2" />

          {/* Teller NPC — behind counter, centre bay */}
          <g id="teller" transform="translate(197, 96)">
            {/* Hat brim */}
            <line x1="-6" y1="6"  x2="6"  y2="6"  stroke={p.stroke} strokeWidth="1.2" />
            <path d="M-4 6 L-4 2 Q0 0 4 2 L4 6" stroke={p.stroke} strokeWidth="1.2" fill="none" />
            {/* Head */}
            <ellipse cx="0" cy="11" rx="3.5" ry="3" stroke={p.stroke} strokeWidth="1" />
            {/* Body above counter */}
            <line x1="0" y1="14" x2="0" y2="22" stroke={p.stroke} strokeWidth="1.2" />
            {/* Arms on counter */}
            <line x1="0" y1="18" x2="-8" y2="22" stroke={p.stroke} strokeWidth="1" />
            <line x1="0" y1="18" x2="8"  y2="22" stroke={p.stroke} strokeWidth="1" />
          </g>

          {/* Floor safe — far right, partially OOV (revealed by panning right) */}
          <rect x="358" y="172" width="50" height="60" fill={p.wood} stroke={p.stroke} strokeWidth="1.2" />
          <rect x="368" y="182" width="30" height="36"
            fill={isNight ? '#1a0d04' : '#5D4037'}
            stroke={p.strokeMid} strokeOpacity="0.6" strokeWidth="0.9"
          />
          <circle cx="383" cy="200" r="9"  fill={p.wood} stroke={p.strokeMid} strokeOpacity="0.7" />
          <circle cx="383" cy="200" r="3.5" fill={isNight ? p.accent : '#c8a020'} />
          {isNight && (
            <circle cx="383" cy="200" r="9" fill="none"
              stroke={p.accent} strokeWidth="0.5"
              style={{ filter: `drop-shadow(0 0 4px ${p.accent})` }}
            />
          )}

          {/* Brass customer railing — foreground, spans full width */}
          <rect x="0" y="200" width="420" height="5"
            fill={p.brass} stroke={p.strokeMid} strokeWidth="0.8"
          />
          {[30, 90, 150, 210, 270, 330, 390].map(x => (
            <g key={x}>
              <rect x={x - 3} y="200" width="6" height="34"
                fill={p.brass} stroke={p.strokeMid} strokeWidth="0.8"
              />
              {/* Post cap */}
              <ellipse cx={x} cy="200" rx="5" ry="3"
                fill={p.brassMid} stroke={p.strokeMid} strokeWidth="0.7"
              />
            </g>
          ))}
        </svg>
      </motion.div>

    </div>
  )
}
