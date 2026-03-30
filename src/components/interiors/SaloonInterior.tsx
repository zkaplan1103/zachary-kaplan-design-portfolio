export function SaloonInterior() {
  return (
    <svg
      viewBox="0 0 320 200"
      width="100%"
      style={{ maxWidth: 480, opacity: 0.75 }}
      stroke="#c9a96e"
      strokeWidth="1.2"
      fill="none"
      strokeLinecap="round"
      aria-label="Saloon interior"
    >
      {/* Floor */}
      <line x1="0" y1="170" x2="320" y2="170" />
      {/* Ceiling beam */}
      <line x1="0" y1="20" x2="320" y2="20" strokeOpacity="0.4" />
      <line x1="80"  y1="20" x2="80"  y2="50" strokeOpacity="0.25" />
      <line x1="160" y1="20" x2="160" y2="50" strokeOpacity="0.25" />
      <line x1="240" y1="20" x2="240" y2="50" strokeOpacity="0.25" />
      {/* Bar counter */}
      <rect x="18" y="108" width="126" height="12" />
      <line x1="18"  y1="120" x2="18"  y2="170" />
      <line x1="144" y1="120" x2="144" y2="170" />
      {/* Bar stools */}
      {[38, 68, 98, 128].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="136" rx="8" ry="3" />
          <line x1={x} y1="139" x2={x} y2="170" />
        </g>
      ))}
      {/* Shelf with bottles */}
      <line x1="20" y1="78" x2="142" y2="78" />
      {[32, 52, 72, 92, 112, 132].map((x) => (
        <g key={x}>
          <rect x={x - 4} y="58" width="8" height="20" rx="2" />
          <line x1={x} y1="56" x2={x} y2="52" />
        </g>
      ))}
      {/* Piano */}
      <rect x="198" y="128" width="96" height="42" />
      <line x1="198" y1="143" x2="294" y2="143" />
      {[210, 220, 230, 240, 250, 260, 270, 280].map((x) => (
        <line key={x} x1={x} y1="143" x2={x} y2="170" strokeOpacity="0.45" />
      ))}
      {/* Piano legs */}
      <line x1="204" y1="170" x2="204" y2="178" />
      <line x1="288" y1="170" x2="288" y2="178" />
      {/* Swinging saloon doors */}
      <path d="M148 170 Q158 132 168 170" />
      <path d="M158 170 Q168 132 178 170" />
      {/* Lamps on ceiling */}
      {[80, 160, 240].map((x) => (
        <g key={x}>
          <circle cx={x} cy="32" r="7" />
          <line x1={x} y1="20" x2={x} y2="25" />
        </g>
      ))}
    </svg>
  )
}
