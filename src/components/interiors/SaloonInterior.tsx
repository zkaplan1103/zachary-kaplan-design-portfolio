import type { InteriorProps } from './interiorTypes'

// ─── Palettes ─────────────────────────────────────────────────────────────────
const NIGHT = {
  bg:        '#1a0e04',
  wall:      '#261409',
  floor:     '#2a1608',
  wood:      '#3d2008',
  accent:    '#FFB300',
  stroke:    '#c9a96e',
  strokeMid: 'rgba(201,169,110,0.5)',
  strokeFar: 'rgba(201,169,110,0.22)',
  winFill:   'rgba(201,169,110,0.07)',
  bottleFill:'rgba(255,140,0,0.18)',
  sheen:     'rgba(255,179,0,0.3)',
}
const DAY = {
  bg:        '#c4a46a',
  wall:      '#d4b47a',
  floor:     '#b8924e',
  wood:      '#8B6030',
  accent:    '#FFF9E0',
  stroke:    '#5a3a10',
  strokeMid: 'rgba(90,58,16,0.5)',
  strokeFar: 'rgba(90,58,16,0.22)',
  winFill:   'rgba(255,249,224,0.45)',
  bottleFill:'rgba(180,100,20,0.2)',
  sheen:     'rgba(255,249,224,0.4)',
}

// ─── Component ────────────────────────────────────────────────────────────────
// Full-bleed: wrapper fills bezel (position:absolute inset:0).
// SVG is 130% wide, centred at rest. panX shifts the whole canvas left/right
// to reveal hidden content at the edges — no item-level animation.

export function SaloonInterior({ isNight, panX }: InteriorProps) {
  const p = isNight ? NIGHT : DAY

  return (
    <div
      style={{
        position:        'absolute',
        inset:           0,
        backgroundColor: p.bg,
        overflow:        'hidden',
        transition:      'background-color 1.5s',
      }}
    >
      <svg
        viewBox="0 0 420 260"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position:   'absolute',
          top:        0,
          left:       '-15%',
          width:      '130%',
          height:     '100%',
          transform:  `translateX(${panX}px)`,
          transitionProperty:       'transform',
          transitionDuration:       '0.25s',
          transitionTimingFunction: 'ease-out',
        }}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* ── Back wall ── */}
        <rect x="0" y="0" width="420" height="260" fill={p.wall} />

        {/* Ceiling rail */}
        <line x1="0" y1="26" x2="420" y2="26" stroke={p.strokeFar} strokeWidth="1" strokeOpacity="0.5" />
        <line x1="105" y1="26" x2="105" y2="65" stroke={p.strokeFar} strokeWidth="0.8" />
        <line x1="210" y1="26" x2="210" y2="65" stroke={p.strokeFar} strokeWidth="0.8" />
        <line x1="315" y1="26" x2="315" y2="65" stroke={p.strokeFar} strokeWidth="0.8" />

        {/* Windows — far left & far right (hidden until panned) */}
        {[[-2, 40], [374, 40]].map(([wx, wy]) => (
          <g key={wx}>
            <rect x={wx} y={wy} width="48" height="66"
              fill={p.winFill} stroke={p.strokeFar} strokeWidth="0.8"
            />
            <line x1={wx + 24} y1={wy} x2={wx + 24} y2={wy + 66} stroke={p.strokeFar} strokeOpacity="0.35" strokeWidth="0.8" />
            <line x1={wx}      y1={wy + 33} x2={wx + 48} y2={wy + 33} stroke={p.strokeFar} strokeOpacity="0.35" strokeWidth="0.8" />
            {/* Day: sunbeam shaft */}
            {!isNight && (
              <polygon
                points={`${wx},${wy + 66} ${wx + 48},${wy + 66} ${wx + 72},260 ${wx - 24},260`}
                fill="rgba(255,249,200,0.07)"
                stroke="none"
              />
            )}
          </g>
        ))}

        {/* Ceiling lamps */}
        {[105, 210, 315].map((x) => (
          <g key={x}>
            <line x1={x} y1="0"  x2={x}   y2="30" stroke={p.strokeFar} strokeWidth="0.8" />
            <ellipse cx={x} cy="38" rx="13" ry="5" fill={p.wood} stroke={p.stroke} strokeWidth="1.2" />
            <circle cx={x} cy="38" r="9"
              fill={isNight ? p.accent : 'rgba(255,255,200,0.65)'}
              stroke={p.stroke} strokeWidth="0.8"
              style={{ filter: isNight ? `drop-shadow(0 0 10px ${p.accent})` : 'none' }}
            />
            {/* Night: glow pool on floor */}
            {isNight && (
              <ellipse cx={x} cy="222" rx="28" ry="5"
                fill="rgba(255,179,0,0.1)" stroke="none"
                style={{ filter: 'blur(5px)' }}
              />
            )}
          </g>
        ))}

        {/* ── Floor ── */}
        <rect x="0" y="222" width="420" height="38" fill={p.floor} />
        <line x1="0" y1="222" x2="420" y2="222" stroke={p.stroke} strokeWidth="1" strokeOpacity="0.5" />
        {/* Floorboard planks */}
        {[232, 244, 254].map((y) => (
          <line key={y} x1="0" y1={y} x2="420" y2={y} stroke={p.strokeFar} strokeOpacity="0.18" strokeWidth="0.8" />
        ))}

        {/* ── Bar counter — left side ── */}
        <rect x="20" y="140" width="160" height="16" fill={p.wood} stroke={p.stroke} strokeWidth="1.2" />
        {/* Counter top sheen */}
        <line x1="22" y1="141" x2="178" y2="141" stroke={p.sheen} strokeWidth="2" />
        <line x1="20" y1="156" x2="20"  y2="222" stroke={p.stroke} strokeWidth="1.2" />
        <line x1="180" y1="156" x2="180" y2="222" stroke={p.stroke} strokeWidth="1.2" />

        {/* Shelf + bottles */}
        <line x1="22" y1="100" x2="178" y2="100" stroke={p.stroke} strokeWidth="1" />
        {[40, 62, 84, 106, 128, 150, 170].map((x) => (
          <g key={x}>
            <rect x={x - 5} y="78" width="10" height="22" rx="2"
              fill={p.bottleFill} stroke={p.strokeMid} strokeWidth="0.9"
            />
            <line x1={x} y1="76" x2={x} y2="70" stroke={p.strokeMid} strokeWidth="0.8" />
          </g>
        ))}

        {/* Bar stools */}
        {[45, 80, 115, 150].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy="173" rx="10" ry="4" fill={p.wood} stroke={p.stroke} strokeWidth="1" />
            <line x1={x} y1="177" x2={x} y2="222" stroke={p.stroke} strokeWidth="1" />
          </g>
        ))}

        {/* ── Piano — right side ── */}
        <rect x="252" y="166" width="124" height="56" fill={p.wood} stroke={p.stroke} strokeWidth="1.2" />
        <rect x="252" y="166" width="124" height="20" fill={isNight ? '#2a1608' : '#7a5025'} stroke={p.stroke} strokeWidth="1.2" />
        {/* Keys */}
        {[268, 282, 296, 310, 324, 338, 352, 366].map((x) => (
          <line key={x} x1={x} y1="186" x2={x} y2="214" stroke={p.strokeMid} strokeOpacity="0.5" strokeWidth="0.9" />
        ))}
        {/* Piano legs */}
        <line x1="258" y1="222" x2="258" y2="234" stroke={p.stroke} strokeWidth="2" />
        <line x1="370" y1="222" x2="370" y2="234" stroke={p.stroke} strokeWidth="2" />

        {/* ── Swinging door frame ── */}
        <rect x="190" y="170" width="24" height="52" rx="2"
          fill={p.wood} stroke={p.stroke} strokeWidth="1"
          style={{ transformOrigin: '190px 222px', transform: 'rotateY(-12deg)' }}
        />
        <rect x="214" y="170" width="24" height="52" rx="2"
          fill={p.wood} stroke={p.stroke} strokeWidth="1"
          style={{ transformOrigin: '238px 222px', transform: 'rotateY(12deg)' }}
        />
        {/* Hinge dots */}
        <circle cx="191" cy="182" r="2.5" fill={p.stroke} />
        <circle cx="191" cy="200" r="2.5" fill={p.stroke} />
        <circle cx="237" cy="182" r="2.5" fill={p.stroke} />
        <circle cx="237" cy="200" r="2.5" fill={p.stroke} />
      </svg>
    </div>
  )
}
