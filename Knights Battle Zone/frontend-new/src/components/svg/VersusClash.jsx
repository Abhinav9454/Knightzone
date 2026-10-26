import React from "react";

export default function VersusClash({ className = "w-48 h-32" }) {
  return (
    <svg
      viewBox="0 0 240 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="bladeLeft" x1="20" y1="140" x2="140" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="50%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id="bladeRight" x1="220" y1="140" x2="100" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
        <radialGradient id="clashBurst" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#fef08a" />
          <stop offset="70%" stopColor="#f97316" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
        <filter id="clashGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Clash Center Flash */}
      <circle cx="120" cy="70" r="45" fill="url(#clashBurst)" filter="url(#clashGlow)" opacity="0.8" />

      {/* Sparks Shockwave Ring */}
      <ellipse cx="120" cy="70" rx="60" ry="24" stroke="#fed7aa" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" />

      {/* Left Blade (Orange Energy) */}
      <g>
        <line x1="30" y1="130" x2="145" y2="35" stroke="url(#bladeLeft)" strokeWidth="6" strokeLinecap="round" />
        <line x1="30" y1="130" x2="145" y2="35" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        {/* Hilt */}
        <line x1="22" y1="124" x2="38" y2="136" stroke="#ea580c" strokeWidth="5" strokeLinecap="round" />
        <circle cx="16" cy="138" r="4" fill="#c2410c" />
      </g>

      {/* Right Blade (Cyan Energy) */}
      <g>
        <line x1="210" y1="130" x2="95" y2="35" stroke="url(#bladeRight)" strokeWidth="6" strokeLinecap="round" />
        <line x1="210" y1="130" x2="95" y2="35" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        {/* Hilt */}
        <line x1="202" y1="136" x2="218" y2="124" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
        <circle cx="224" cy="138" r="4" fill="#0369a1" />
      </g>

      {/* Central Flash Core */}
      <polygon points="120,50 125,65 140,70 125,75 120,90 115,75 100,70 115,65" fill="#ffffff" filter="url(#clashGlow)" />

      {/* Lightning Arcs */}
      <path d="M120 70 L135 55 L130 50 L145 40" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M120 70 L105 85 L110 90 L95 100" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* VS Badge */}
      <g transform="translate(105, 115)">
        <rect x="0" y="0" width="30" height="20" rx="6" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
        <text x="7" y="14" fill="#c5ff55" fontSize="11" fontWeight="900" fontFamily="sans-serif">VS</text>
      </g>
    </svg>
  );
}
