import React from "react";

export default function RankBadge({ rating = 1000, className = "w-20 h-20" }) {
  // Determine tier based on rating
  let tierName = "Novice Knight";
  let tierColor = "#3b82f6";
  let gradStart = "#60a5fa";
  let gradEnd = "#1d4ed8";

  if (rating >= 2000) {
    tierName = "Grandmaster";
    tierColor = "#a855f7";
    gradStart = "#c084fc";
    gradEnd = "#7e22ce";
  } else if (rating >= 1600) {
    tierName = "Knight Commander";
    tierColor = "#f59e0b";
    gradStart = "#fbbf24";
    gradEnd = "#b45309";
  } else if (rating >= 1200) {
    tierName = "Warrior Knight";
    tierColor = "#10b981";
    gradStart = "#34d399";
    gradEnd = "#047857";
  }

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id={`rankGrad-${rating}`} x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={gradStart} />
            <stop offset="100%" stopColor={gradEnd} />
          </linearGradient>
          <filter id="rankShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Wings / Laurel Wreath */}
        <path d="M15 35 C10 45 12 60 25 70" stroke={tierColor} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <path d="M85 35 C90 45 88 60 75 70" stroke={tierColor} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <circle cx="15" cy="35" r="2.5" fill={tierColor} />
        <circle cx="85" cy="35" r="2.5" fill={tierColor} />

        {/* Shield */}
        <path
          d="M50 14 L78 24 V52 C78 68 64 80 50 86 C36 80 22 68 22 52 V24 L50 14 Z"
          fill={`url(#rankGrad-${rating})`}
          filter="url(#rankShadow)"
        />

        {/* Inner Shield Bevel */}
        <path
          d="M50 20 L72 28 V50 C72 63 60 74 50 79 C40 74 28 63 28 50 V28 L50 20 Z"
          fill="#0f172a"
          opacity="0.85"
        />

        {/* Center Star Emblem */}
        <polygon
          points="50,34 53,42 61,42 55,47 57,55 50,50 43,55 45,47 39,42 47,42"
          fill={gradStart}
        />

        {/* Helm Accent */}
        <path d="M43 60 H57 L50 67 Z" fill="#ffffff" opacity="0.9" />
      </svg>
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-1">
        {tierName}
      </span>
    </div>
  );
}
