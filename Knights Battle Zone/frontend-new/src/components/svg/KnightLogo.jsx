import React from "react";

export default function KnightLogo({ className = "w-8 h-8", animated = false }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${animated ? "hover:scale-105 transition-transform duration-300" : ""}`}
    >
      <defs>
        <linearGradient id="shieldGrad" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c5ff55" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="swordGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="glow" x1="32" y1="12" x2="32" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c5ff55" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#047857" stopOpacity="0" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#064e3b" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Outer Hex Shield */}
      <path
        d="M32 4L54 14V34C54 46.5 44.5 57 32 60C19.5 57 10 46.5 10 34V14L32 4Z"
        fill="url(#shieldGrad)"
        filter="url(#shadow)"
      />

      {/* Inner Inset Shield */}
      <path
        d="M32 8L50 16.5V33.5C50 44 42 53 32 55.5C22 53 14 44 14 33.5V16.5L32 8Z"
        fill="#0f2922"
      />

      {/* Inner Glow Aura */}
      <path
        d="M32 10L48 18V33C48 42.5 41 50.5 32 53C23 50.5 16 42.5 16 33V18L32 10Z"
        fill="url(#glow)"
        opacity="0.3"
      />

      {/* Left Blade */}
      <path
        d="M20 18L32 30L30 32L18 20L15 22L17 16L23 18L20 18Z"
        fill="url(#swordGrad)"
      />
      {/* Right Blade */}
      <path
        d="M44 18L32 30L34 32L46 20L49 22L47 16L41 18L44 18Z"
        fill="url(#swordGrad)"
      />

      {/* Knight Helm Visor */}
      <path
        d="M26 26H38L41 33H23L26 26Z"
        fill="#c5ff55"
      />
      {/* Visor Slits */}
      <line x1="28" y1="29.5" x2="36" y2="29.5" stroke="#0f2922" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="29" y1="32" x2="35" y2="32" stroke="#0f2922" strokeWidth="1.2" strokeLinecap="round" />

      {/* Knight Chest Core / Diamond */}
      <polygon
        points="32,37 36,43 32,49 28,43"
        fill="#c5ff55"
      />
      <circle cx="32" cy="43" r="1.5" fill="#064e3b" />
    </svg>
  );
}
