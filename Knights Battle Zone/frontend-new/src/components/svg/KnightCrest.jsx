import React from "react";

export default function KnightCrest({ className = "w-64 h-64", glow = true }) {
  return (
    <svg
      viewBox="0 0 280 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="crestGold" x1="0" y1="0" x2="280" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c5ff55" />
          <stop offset="40%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="bladeGrad" x1="50" y1="50" x2="230" y2="230" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <radialGradient id="auraGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c5ff55" stopOpacity="0.25" />
          <stop offset="70%" stopColor="#047857" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <filter id="crestGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Glow */}
      {glow && <circle cx="140" cy="140" r="130" fill="url(#auraGlow)" />}

      {/* Sacred Geometry Orbit Rings */}
      <circle cx="140" cy="140" r="120" stroke="#c5ff55" strokeWidth="1" strokeDasharray="6 6" opacity="0.3" />
      <circle cx="140" cy="140" r="105" stroke="#10b981" strokeWidth="1.2" opacity="0.4" />
      <circle cx="140" cy="140" r="88" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" opacity="0.2" />

      {/* 8-Point Star Dial */}
      <g opacity="0.25" stroke="#c5ff55" strokeWidth="1">
        <line x1="140" y1="20" x2="140" y2="260" />
        <line x1="20" y1="140" x2="260" y2="140" />
        <line x1="55" y1="55" x2="225" y2="225" />
        <line x1="225" y1="55" x2="55" y2="225" />
      </g>

      {/* Crossed Greatswords Behind Shield */}
      {/* Sword 1: Top-left to Bottom-right */}
      <g>
        <line x1="50" y1="50" x2="230" y2="230" stroke="url(#bladeGrad)" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="42" y1="58" x2="58" y2="42" stroke="#c5ff55" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="36" cy="36" r="4.5" fill="#c5ff55" />
      </g>
      {/* Sword 2: Top-right to Bottom-left */}
      <g>
        <line x1="230" y1="50" x2="50" y2="230" stroke="url(#bladeGrad)" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="222" y1="42" x2="238" y2="58" stroke="#c5ff55" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="244" cy="36" r="4.5" fill="#c5ff55" />
      </g>

      {/* Central Majestic Shield */}
      <g filter={glow ? "url(#crestGlow)" : undefined}>
        {/* Shield Backing */}
        <path
          d="M140 65 L200 90 V155 C200 195 170 225 140 235 C110 225 80 195 80 155 V90 L140 65 Z"
          fill="#0c231c"
          stroke="url(#crestGold)"
          strokeWidth="3.5"
        />

        {/* Inner Shield Layer */}
        <path
          d="M140 78 L190 98 V152 C190 186 165 212 140 220 C115 212 90 186 90 152 V98 L140 78 Z"
          fill="#13352c"
          stroke="#10b981"
          strokeWidth="1.5"
          opacity="0.8"
        />

        {/* Knight Helmet Silhouette inside Shield */}
        {/* Plume */}
        <path
          d="M140 92 C148 92 154 98 152 108 L140 105 L128 108 C126 98 132 92 140 92 Z"
          fill="#c5ff55"
        />
        {/* Helm Head */}
        <path
          d="M125 106 H155 L160 128 L140 142 L120 128 L125 106 Z"
          fill="#06221a"
          stroke="#c5ff55"
          strokeWidth="1.5"
        />
        {/* Visor Bar */}
        <rect x="126" y="118" width="28" height="4" rx="2" fill="#c5ff55" />
        <line x1="130" y1="126" x2="150" y2="126" stroke="#c5ff55" strokeWidth="1.5" strokeLinecap="round" />

        {/* Chest Rune: Code Diamond */}
        <polygon points="140,154 152,170 140,186 128,170" fill="url(#crestGold)" />
        <circle cx="140" cy="170" r="3" fill="#0c231c" />

        {/* Bottom Banner Winglets */}
        <path d="M110 200 L140 216 L170 200" stroke="#c5ff55" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>

      {/* Orbiting Sparkles */}
      <circle cx="140" cy="35" r="3" fill="#c5ff55" />
      <circle cx="140" cy="245" r="3" fill="#c5ff55" />
      <circle cx="35" cy="140" r="3" fill="#c5ff55" />
      <circle cx="245" cy="140" r="3" fill="#c5ff55" />
    </svg>
  );
}
