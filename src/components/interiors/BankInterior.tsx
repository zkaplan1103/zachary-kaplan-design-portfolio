export function BankInterior() {
  return (
    <svg
      viewBox="0 0 320 200"
      width="100%"
      style={{ maxWidth: 480, opacity: 0.75 }}
      stroke="#c9a96e"
      strokeWidth="1.2"
      fill="none"
      strokeLinecap="round"
      aria-label="Bank interior"
    >
      {/* Floor */}
      <line x1="0" y1="170" x2="320" y2="170" />
      {/* Teller counter */}
      <rect x="58" y="98" width="204" height="12" />
      <line x1="58"  y1="110" x2="58"  y2="170" />
      <line x1="262" y1="110" x2="262" y2="170" />
      {/* Teller windows / grilles — 3 bays */}
      {[78, 148, 218].map((x) => (
        <g key={x}>
          <rect x={x} y="55" width="44" height="43" />
          {[x + 8, x + 18, x + 28, x + 38].map((gx) => (
            <line key={gx} x1={gx} y1="55" x2={gx} y2="98" strokeOpacity="0.5" />
          ))}
          <line x1={x} y1="76" x2={x + 44} y2="76" strokeOpacity="0.4" />
          {/* Teller window base slot */}
          <rect x={x + 8} y="92" width="28" height="6" strokeOpacity="0.6" />
        </g>
      ))}
      {/* Vault door — left wall, circular */}
      <circle cx="28" cy="118" r="32" />
      <circle cx="28" cy="118" r="24" strokeOpacity="0.6" />
      {/* Vault spokes */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = (deg * Math.PI) / 180
        return (
          <line
            key={deg}
            x1={28 + Math.cos(r) * 8}
            y1={118 + Math.sin(r) * 8}
            x2={28 + Math.cos(r) * 22}
            y2={118 + Math.sin(r) * 22}
            strokeOpacity="0.45"
          />
        )
      })}
      <circle cx="28" cy="118" r="6" />
      {/* Vault handle */}
      <line x1="34" y1="118" x2="48" y2="118" />
      <circle cx="50" cy="118" r="3" />
      {/* Safe on floor — right side */}
      <rect x="272" y="126" width="38" height="44" />
      <rect x="280" y="134" width="22" height="26" strokeOpacity="0.6" />
      <circle cx="291" cy="147" r="6" strokeOpacity="0.75" />
      <circle cx="291" cy="147" r="2" />
      {/* Chandelier */}
      <line x1="160" y1="0"  x2="160" y2="28" />
      <ellipse cx="160" cy="34" rx="22" ry="7" />
      {[-14, -6, 2, 10, 18].map((dx) => (
        <line key={dx} x1={160 + dx} y1="41" x2={160 + dx + 2} y2="54" strokeOpacity="0.45" />
      ))}
    </svg>
  )
}
