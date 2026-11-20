type ArtworkKind = "moire" | "silicon" | "ipc" | "env"

function CoverArtwork({
  kind,
  compact = false,
}: {
  kind: ArtworkKind
  compact?: boolean
}) {
  const height = compact ? 184 : 340

  if (kind === "moire") {
    return (
      <svg
        viewBox="0 0 960 360"
        width="100%"
        height={height}
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="Cobalt architectural grid with highlighted evidence nodes and signal links"
        className="cover-svg"
      >
        <defs>
          <linearGradient id="bg-moire" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#040b42" />
            <stop offset="55%" stopColor="#0d1e8c" />
            <stop offset="100%" stopColor="#04082d" />
          </linearGradient>
          <radialGradient id="glow-a" cx="68%" cy="44%" r="36%">
            <stop offset="0%" stopColor="#2438e0" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#040b42" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="960" height="360" fill="url(#bg-moire)" />
        <rect width="960" height="360" fill="url(#glow-a)" />
        {Array.from({ length: 18 }, (_, i) => (
          <line
            key={`v-${i}`}
            x1={60 + i * 50}
            y1={24}
            x2={60 + i * 50}
            y2={336}
            stroke="#5a7cff"
            strokeOpacity={i % 3 === 0 ? 0.28 : 0.12}
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <line
            key={`h-${i}`}
            x1={40}
            y1={36 + i * 42}
            x2={920}
            y2={36 + i * 42}
            stroke="#5a7cff"
            strokeOpacity={i % 2 === 0 ? 0.24 : 0.11}
            strokeWidth={1}
          />
        ))}
        <path
          d="M 160 120 C 260 60, 320 220, 440 162 S 610 92, 720 144 S 820 224, 860 128"
          fill="none"
          stroke="#9ab4ff"
          strokeWidth="2"
          strokeOpacity="0.85"
        />
        <path
          d="M 160 220 C 290 250, 350 110, 490 198 S 650 264, 770 176"
          fill="none"
          stroke="#ff6b35"
          strokeWidth="2.2"
          strokeOpacity="0.92"
        />
        {[
          { x: 160, y: 120, hot: false },
          { x: 310, y: 158, hot: true },
          { x: 440, y: 162, hot: false },
          { x: 560, y: 124, hot: true },
          { x: 660, y: 196, hot: true },
          { x: 720, y: 144, hot: true },
          { x: 770, y: 176, hot: false },
          { x: 860, y: 128, hot: true },
        ].map((n, idx) => (
          <g key={`n-${idx}`}>
            <rect
              x={n.x - 14}
              y={n.y - 14}
              width={28}
              height={28}
              rx={3}
              fill={n.hot ? "#e94e24" : "#2438e0"}
              fillOpacity={n.hot ? 0.92 : 0.85}
              stroke="#dbe4ff"
              strokeOpacity="0.65"
              strokeWidth="1.2"
            />
            <rect
              x={n.x - 5}
              y={n.y - 5}
              width={10}
              height={10}
              fill="#ffffff"
              fillOpacity="0.9"
            />
          </g>
        ))}
      </svg>
    )
  }

  if (kind === "silicon") {
    return (
      <svg
        viewBox="0 0 960 360"
        width="100%"
        height={height}
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="x86 instruction matrix and 63-byte opcode floorplan"
        className="cover-svg"
      >
        <rect width="960" height="360" fill="#050b2e" />
        {Array.from({ length: 24 }, (_, col) =>
          Array.from({ length: 9 }, (_, row) => {
            const active = (col * 7 + row * 11) % 5 === 0
            const accent = (col + row * 3) % 13 === 0
            return (
              <rect
                key={`c-${col}-${row}`}
                x={36 + col * 37}
                y={26 + row * 34}
                width={26}
                height={22}
                rx={2}
                fill={accent ? "#f05a28" : active ? "#2d4eff" : "#111c59"}
                fillOpacity={accent ? 0.95 : active ? 0.8 : 0.65}
              />
            )
          })
        )}
      </svg>
    )
  }

  if (kind === "ipc") {
    return (
      <svg
        viewBox="0 0 960 360"
        width="100%"
        height={height}
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="Concentric Electron IPC process rings bridging renderer to main"
        className="cover-svg"
      >
        <rect width="960" height="360" fill="#000443" />
        {[40, 75, 110, 145, 180, 215, 250].map((r, i) => (
          <circle
            key={`r1-${i}`}
            cx={320}
            cy={180}
            r={r}
            fill="none"
            stroke="#3f62ff"
            strokeOpacity={0.55 - i * 0.06}
            strokeWidth="1.5"
          />
        ))}
        {[40, 75, 110, 145, 180, 215].map((r, i) => (
          <circle
            key={`r2-${i}`}
            cx={640}
            cy={180}
            r={r}
            fill="none"
            stroke="#ff6b35"
            strokeOpacity={0.6 - i * 0.07}
            strokeWidth="1.5"
          />
        ))}
        <line
          x1="320"
          y1="180"
          x2="640"
          y2="180"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeDasharray="6 6"
        />
        <circle cx="320" cy="180" r="8" fill="#ffffff" />
        <circle cx="640" cy="180" r="8" fill="#ff6b35" />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 960 360"
      width="100%"
      height={height}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Deterministic RL trace waveform and replay buckets"
      className="cover-svg"
    >
      <rect width="960" height="360" fill="#071038" />
      {Array.from({ length: 32 }, (_, i) => {
        const h = 48 + Math.round(Math.abs(Math.sin(i * 0.45)) * 185)
        const hot = i >= 12 && i <= 18
        return (
          <rect
            key={`b-${i}`}
            x={42 + i * 28}
            y={300 - h}
            width={16}
            height={h}
            rx={2}
            fill={hot ? "#ff6b35" : "#2438e0"}
            fillOpacity={hot ? 0.92 : 0.72}
          />
        )
      })}
    </svg>
  )
}

export { CoverArtwork }
