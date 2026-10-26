import React from "react";

export default function BattleArenaIllustration({ className = "w-full max-w-xl h-auto" }) {
  return (
    <svg
      viewBox="0 0 600 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="neonOrange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff7828" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
        <linearGradient id="neonCyan" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="neonLime" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c5ff55" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="gridGrad" x1="300" y1="150" x2="300" y2="450" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
        </linearGradient>
        <radialGradient id="arenaCoreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.35" />
          <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Ambient Radial Core */}
      <circle cx="300" cy="270" r="180" fill="url(#arenaCoreGlow)" />

      {/* Isometric Battle Grid Floor */}
      <g opacity="0.6">
        <polygon points="300,160 520,270 300,380 80,270" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
        <polygon points="300,190 480,270 300,350 120,270" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />
        <polygon points="300,220 440,270 300,320 160,270" fill="none" stroke="url(#gridGrad)" strokeWidth="1.5" />

        {/* Isometric Grid Lines */}
        <line x1="300" y1="160" x2="300" y2="380" stroke="#f1f5f9" strokeWidth="1" />
        <line x1="80" y1="270" x2="520" y2="270" stroke="#f1f5f9" strokeWidth="1" />
        <line x1="190" y1="215" x2="410" y2="325" stroke="#fed7aa" strokeWidth="1" opacity="0.7" />
        <line x1="190" y1="325" x2="410" y2="215" stroke="#bae6fd" strokeWidth="1" opacity="0.7" />
      </g>

      {/* Glowing Central Arena Platform */}
      <g filter="url(#softGlow)">
        <polygon points="300,230 380,270 300,310 220,270" fill="#0f172a" stroke="url(#neonOrange)" strokeWidth="2" />
        <polygon points="300,240 360,270 300,300 240,270" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
      </g>

      {/* Core Energy Crystal / Monolith */}
      <g>
        {/* Crystal facets */}
        <polygon points="300,190 320,250 300,270 280,250" fill="url(#neonOrange)" opacity="0.9" />
        <polygon points="300,190 320,250 300,225" fill="#ffedd5" opacity="0.8" />
        <polygon points="300,270 320,250 300,300 280,250" fill="url(#neonCyan)" opacity="0.85" />
        {/* Central Core Light */}
        <circle cx="300" cy="250" r="5" fill="#ffffff" filter="url(#softGlow)" />
      </g>

      {/* Left Combat Node: Algorithms & Data Structures */}
      <g transform="translate(140, 160)" className="animate-pulse">
        <rect x="0" y="0" width="110" height="64" rx="12" fill="#ffffff" stroke="#fed7aa" strokeWidth="1.5" />
        <circle cx="20" cy="24" r="9" fill="#fff7ed" />
        <path d="M16 24L19 27L24 21" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="36" y="24" fill="#0f172a" fontSize="11" fontWeight="700" fontFamily="sans-serif">DSA Matrix</text>
        <text x="36" y="38" fill="#64748b" fontSize="9" fontFamily="monospace">O(log N) Time</text>
        <line x1="12" y1="52" x2="98" y2="52" stroke="#ea580c" strokeWidth="2" strokeDasharray="60 30" strokeLinecap="round" />
      </g>
      {/* Light line connecting left node to center */}
      <path d="M195 224 Q 240 250 280 255" fill="none" stroke="#ea580c" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />

      {/* Right Combat Node: Code Execution Terminal */}
      <g transform="translate(350, 140)">
        <rect x="0" y="0" width="120" height="70" rx="12" fill="#ffffff" stroke="#bae6fd" strokeWidth="1.5" />
        <rect x="12" y="14" width="96" height="20" rx="6" fill="#0f172a" />
        <text x="18" y="28" fill="#38bdf8" fontSize="10" fontFamily="monospace">&gt; test.pass()</text>
        <text x="14" y="48" fill="#0f172a" fontSize="11" fontWeight="700" fontFamily="sans-serif">100% Passed</text>
        <circle cx="100" cy="48" r="4" fill="#10b981" />
      </g>
      {/* Light line connecting right node to center */}
      <path d="M410 210 Q 360 240 320 255" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />

      {/* Floating Code Orbit Runes */}
      {/* Rune 1: Curly Braces */}
      <g transform="translate(100, 310)">
        <circle cx="20" cy="20" r="18" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.2" />
        <text x="14" y="26" fill="#f97316" fontSize="16" fontWeight="bold" fontFamily="monospace">{"{"}</text>
      </g>
      {/* Rune 2: Binary stream */}
      <g transform="translate(450, 320)">
        <circle cx="22" cy="22" r="20" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.2" />
        <text x="12" y="27" fill="#0284c7" fontSize="13" fontWeight="bold" fontFamily="monospace">&lt;/&gt;</text>
      </g>
      {/* Rune 3: Knight Blade */}
      <g transform="translate(285, 80)">
        <circle cx="15" cy="15" r="16" fill="#ffffff" stroke="#c5ff55" strokeWidth="2" filter="url(#softGlow)" />
        <path d="M15 6L15 22M11 10L19 10" stroke="#047857" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Glowing Sparks and Constellation Stars */}
      <circle cx="180" cy="110" r="2.5" fill="#f97316" />
      <circle cx="430" cy="90" r="3" fill="#38bdf8" />
      <circle cx="500" cy="230" r="2" fill="#c5ff55" />
      <circle cx="100" cy="220" r="2" fill="#3b82f6" />
      <circle cx="250" cy="420" r="2.5" fill="#f97316" />
      <circle cx="370" cy="400" r="3" fill="#10b981" />
    </svg>
  );
}
