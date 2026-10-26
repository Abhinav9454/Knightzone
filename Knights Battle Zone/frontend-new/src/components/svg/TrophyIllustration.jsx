import React from "react";

export default function TrophyIllustration({ className = "w-28 h-28" }) {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="goldCup" x1="40" y1="20" x2="120" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
        <linearGradient id="goldPedestal" x1="50" y1="110" x2="110" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#854d0e" />
        </linearGradient>
        <radialGradient id="cupGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde047" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
        </radialGradient>
        <filter id="trophySoftGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Aura Glow */}
      <circle cx="80" cy="70" r="60" fill="url(#cupGlow)" />

      {/* Trophy Handles */}
      {/* Left Handle */}
      <path
        d="M50 40 C30 40 25 70 52 75"
        stroke="#eab308"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right Handle */}
      <path
        d="M110 40 C130 40 135 70 108 75"
        stroke="#eab308"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />

      {/* Cup Body */}
      <path
        d="M48 26 H112 V56 C112 78 98 94 80 94 C62 94 48 78 48 56 V26 Z"
        fill="url(#goldCup)"
        filter="url(#trophySoftGlow)"
      />

      {/* Cup Lip */}
      <rect x="44" y="22" width="72" height="8" rx="4" fill="#fef08a" />

      {/* Cup Highlight Stripe */}
      <path
        d="M56 30 C56 60 62 76 72 84"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Central Star Badge */}
      <polygon
        points="80,44 83,52 91,52 85,57 87,65 80,60 73,65 75,57 69,52 77,52"
        fill="#ffffff"
      />

      {/* Stem */}
      <path d="M72 94 H88 V112 H72 Z" fill="#ca8a04" />
      <ellipse cx="80" cy="112" rx="14" ry="4" fill="#eab308" />

      {/* Base Pedestal */}
      <path d="M60 114 H100 L108 136 H52 Z" fill="url(#goldPedestal)" />
      <rect x="46" y="136" width="68" height="10" rx="3" fill="#713f12" />

      {/* Base Inscription Plaque */}
      <rect x="58" y="122" width="44" height="9" rx="2" fill="#fef08a" />
      <text x="63" y="129" fill="#854d0e" fontSize="6" fontWeight="bold" fontFamily="sans-serif">KNIGHTZONE</text>

      {/* Sparkles */}
      <circle cx="36" cy="24" r="2" fill="#fde047" />
      <circle cx="126" cy="30" r="2.5" fill="#fde047" />
      <circle cx="120" cy="95" r="2" fill="#fde047" />
      <circle cx="40" cy="90" r="1.5" fill="#fde047" />
    </svg>
  );
}
