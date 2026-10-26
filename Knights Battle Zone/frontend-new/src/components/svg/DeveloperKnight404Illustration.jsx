import React, { useState } from "react";

export default function DeveloperKnight404Illustration({
  className = "w-80 h-80 sm:w-96 sm:h-96 lg:w-[460px] lg:h-[460px]",
  interactive = true,
  onPing = null,
}) {
  const [pingTrigger, setPingTrigger] = useState(0);

  const handleClick = () => {
    if (!interactive) return;
    setPingTrigger((prev) => prev + 1);
    if (onPing) onPing();
  };

  return (
    <div
      onClick={handleClick}
      className={`relative flex items-center justify-center select-none ${
        interactive ? "cursor-pointer group" : ""
      } ${className}`}
      title={interactive ? "Click to dispatch active radar ping" : undefined}
    >
      <svg
        viewBox="0 0 360 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_50px_rgba(197,255,85,0.3)] transition-transform duration-500 group-hover:scale-[1.02]"
      >
        <defs>
          <style>{`
            @keyframes radarSpin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes radarReverse {
              0% { transform: rotate(360deg); }
              100% { transform: rotate(0deg); }
            }
            @keyframes scanBeam {
              0%, 100% { transform: translateY(0px); opacity: 0.2; }
              50% { transform: translateY(160px); opacity: 0.95; }
            }
            @keyframes pulseSonar1 {
              0% { r: 50px; opacity: 0.85; stroke-width: 2.5px; }
              100% { r: 165px; opacity: 0; stroke-width: 0.5px; }
            }
            @keyframes pulseSonar2 {
              0% { r: 35px; opacity: 0.9; stroke-width: 3px; }
              100% { r: 155px; opacity: 0; stroke-width: 0.5px; }
            }
            @keyframes interactivePing {
              0% { r: 20px; opacity: 1; stroke-width: 4px; }
              100% { r: 175px; opacity: 0; stroke-width: 1px; }
            }
            @keyframes visorGlow {
              0%, 100% { filter: drop-shadow(0 0 5px #c5ff55); opacity: 0.85; }
              50% { filter: drop-shadow(0 0 20px #c5ff55); opacity: 1; }
            }
            @keyframes floatParticle {
              0%, 100% { transform: translateY(0px) scale(1); opacity: 0.7; }
              50% { transform: translateY(-10px) scale(1.12); opacity: 1; }
            }
            @keyframes codeFlicker {
              0%, 100% { opacity: 0.85; filter: drop-shadow(0 0 8px #c5ff55); }
              45% { opacity: 0.4; filter: drop-shadow(0 0 2px #c5ff55); }
              55% { opacity: 1; filter: drop-shadow(0 0 14px #c5ff55); }
            }
            @keyframes hudGlitch {
              0%, 100% { opacity: 0.9; }
              92% { opacity: 0.9; }
              93% { opacity: 0.3; transform: translateX(1px); }
              95% { opacity: 1; transform: translateX(-1px); }
              98% { opacity: 0.6; }
            }
            .anim-radar {
              transform-origin: 180px 180px;
              animation: radarSpin 10s linear infinite;
            }
            .anim-radar-fast {
              transform-origin: 180px 180px;
              animation: radarReverse 7s linear infinite;
            }
            .anim-radar-sweep {
              transform-origin: 180px 180px;
              animation: radarSpin 4s linear infinite;
            }
            .anim-scan {
              animation: scanBeam 3.2s ease-in-out infinite;
            }
            .anim-sonar-1 {
              transform-origin: 180px 180px;
              animation: pulseSonar1 3.5s cubic-bezier(0, 0.2, 0.8, 1) infinite;
            }
            .anim-sonar-2 {
              transform-origin: 180px 180px;
              animation: pulseSonar2 3.5s cubic-bezier(0, 0.2, 0.8, 1) 1.75s infinite;
            }
            .anim-user-ping {
              transform-origin: 180px 180px;
              animation: interactivePing 1.2s ease-out forwards;
            }
            .anim-visor {
              animation: visorGlow 2.5s ease-in-out infinite;
            }
            .anim-code {
              animation: codeFlicker 2.8s ease-in-out infinite;
            }
            .anim-particle-1 { animation: floatParticle 3.2s ease-in-out infinite; }
            .anim-particle-2 { animation: floatParticle 4.2s ease-in-out 1s infinite; }
            .anim-particle-3 { animation: floatParticle 3.8s ease-in-out 0.5s infinite; }
            .anim-particle-4 { animation: floatParticle 4.6s ease-in-out 1.5s infinite; }
            .anim-hud { animation: hudGlitch 6s infinite; }
          `}</style>

          {/* Gradients */}
          <linearGradient id="rkShieldGrad" x1="180" y1="90" x2="180" y2="270" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e3b2b" />
            <stop offset="50%" stopColor="#0f291c" />
            <stop offset="100%" stopColor="#071710" />
          </linearGradient>

          <linearGradient id="rkBorderGrad" x1="110" y1="90" x2="250" y2="270" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c5ff55" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          <linearGradient id="rkScanGrad" x1="0" y1="0" x2="0" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c5ff55" stopOpacity="0" />
            <stop offset="50%" stopColor="#c5ff55" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>

          {/* Radar Sweep Wedge Gradient */}
          <radialGradient id="rkRadarFan" cx="180" cy="180" r="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c5ff55" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#10b981" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="rkSweepLinear" x1="180" y1="180" x2="330" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c5ff55" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>

          {/* Filters */}
          <filter id="rkLaserGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#c5ff55" floodOpacity="0.9" />
          </filter>

          <filter id="rkOuterGlow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ================= 1. OUTER SCI-FI HUD BRACKETS ================= */}
        <g stroke="#c5ff55" strokeWidth="1.5" opacity="0.6" className="anim-hud">
          {/* Top-Left Bracket */}
          <path d="M 22 45 L 22 22 L 45 22" fill="none" />
          <circle cx="22" cy="22" r="2" fill="#c5ff55" />
          {/* Top-Right Bracket */}
          <path d="M 338 45 L 338 22 L 315 22" fill="none" />
          <circle cx="338" cy="22" r="2" fill="#c5ff55" />
          {/* Bottom-Left Bracket */}
          <path d="M 22 315 L 22 338 L 45 338" fill="none" />
          <circle cx="22" cy="338" r="2" fill="#c5ff55" />
          {/* Bottom-Right Bracket */}
          <path d="M 338 315 L 338 338 L 315 338" fill="none" />
          <circle cx="338" cy="338" r="2" fill="#c5ff55" />
        </g>

        {/* Telemetry Corner Labels */}
        <text x="30" y="38" fill="#788874" fontSize="8" fontFamily="monospace" fontWeight="bold">
          LAT: 0x404
        </text>
        <text x="330" y="38" textAnchor="end" fill="#788874" fontSize="8" fontFamily="monospace" fontWeight="bold">
          LNG: 0xDEAD
        </text>
        <text x="30" y="330" fill="#788874" fontSize="8" fontFamily="monospace" fontWeight="bold">
          FREQ: 5.8GHz
        </text>
        <text x="330" y="330" textAnchor="end" fill="#c5ff55" fontSize="8" fontFamily="monospace" fontWeight="bold">
          STATUS: SEEK
        </text>

        {/* ================= 2. BACKGROUND RADAR GRIDS & CONCENTRIC RINGS ================= */}
        {/* Outermost Boundary Ring */}
        <circle cx="180" cy="180" r="165" stroke="#1d3828" strokeWidth="1" strokeDasharray="3 6" opacity="0.5" />
        <circle cx="180" cy="180" r="148" stroke="#254a34" strokeWidth="1" opacity="0.6" />
        <circle cx="180" cy="180" r="122" stroke="#2d5c41" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.65" />
        <circle cx="180" cy="180" r="95" stroke="#3a7452" strokeWidth="1" opacity="0.75" />
        <circle cx="180" cy="180" r="68" stroke="#4a8f65" strokeWidth="1" strokeDasharray="6 6" opacity="0.8" />

        {/* Cardinal Bearing Labels */}
        <text x="180" y="27" textAnchor="middle" fill="#c5ff55" fontSize="9" fontFamily="monospace" fontWeight="black">
          N · 000°
        </text>
        <text x="338" y="183" fill="#788874" fontSize="8" fontFamily="monospace" fontWeight="bold">
          090°
        </text>
        <text x="180" y="352" textAnchor="middle" fill="#788874" fontSize="8" fontFamily="monospace" fontWeight="bold">
          180°
        </text>
        <text x="22" y="183" fill="#788874" fontSize="8" fontFamily="monospace" fontWeight="bold">
          270°
        </text>

        {/* Crosshair coordinate axes */}
        <line x1="180" y1="30" x2="180" y2="330" stroke="#1e3b2b" strokeWidth="1" strokeDasharray="3 5" opacity="0.7" />
        <line x1="30" y1="180" x2="330" y2="180" stroke="#1e3b2b" strokeWidth="1" strokeDasharray="3 5" opacity="0.7" />

        {/* Sonar Pulsing Ripples */}
        <circle cx="180" cy="180" r="50" stroke="#c5ff55" fill="none" className="anim-sonar-1" />
        <circle cx="180" cy="180" r="35" stroke="#10b981" fill="none" className="anim-sonar-2" />

        {/* User Interactive Click Sonar Wave */}
        {pingTrigger > 0 && (
          <circle
            key={pingTrigger}
            cx="180"
            cy="180"
            r="20"
            stroke="#c5ff55"
            fill="none"
            className="anim-user-ping"
          />
        )}

        {/* ================= 3. SWEEPING RADAR SCANNER CONE ================= */}
        <g className="anim-radar-sweep">
          {/* Sweeping Conic Wedge (60 degrees) */}
          <path
            d="M 180 180 L 335 180 A 155 155 0 0 0 314 102 Z"
            fill="url(#rkSweepLinear)"
            opacity="0.35"
          />
          {/* Leading Radar Edge Line */}
          <line
            x1="180"
            y1="180"
            x2="335"
            y2="180"
            stroke="#c5ff55"
            strokeWidth="2"
            filter="url(#rkLaserGlow)"
          />
          <circle cx="335" cy="180" r="3" fill="#c5ff55" />
        </g>

        {/* ================= 4. ROTATING ORBITAL TECH RINGS ================= */}
        {/* Outer Orbit with tick marks */}
        <g className="anim-radar">
          <circle
            cx="180"
            cy="180"
            r="156"
            stroke="url(#rkBorderGrad)"
            strokeWidth="1.5"
            strokeDasharray="25 60 40 80 15 45"
          />
          <circle cx="336" cy="180" r="3" fill="#c5ff55" />
          <circle cx="24" cy="180" r="2.5" fill="#10b981" />
          <circle cx="180" cy="24" r="3" fill="#c5ff55" />
          <circle cx="180" cy="336" r="2.5" fill="#10b981" />
        </g>

        {/* Counter-rotating Inner Data Ring */}
        <g className="anim-radar-fast">
          <circle
            cx="180"
            cy="180"
            r="135"
            stroke="#c5ff55"
            strokeWidth="1"
            strokeDasharray="10 30 5 45"
            opacity="0.7"
          />
        </g>

        {/* ================= 5. CROSSED CYBER KATANAS IN BACKGROUND ================= */}
        <g opacity="0.35">
          <line x1="120" y1="100" x2="240" y2="260" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="240" y1="100" x2="120" y2="260" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" />
          {/* Katana Hilts */}
          <circle cx="120" cy="100" r="3" fill="#c5ff55" />
          <circle cx="240" cy="100" r="3" fill="#c5ff55" />
        </g>

        {/* ================= 6. HOLOGRAPHIC KNIGHT DEFENDER SHIELD ================= */}
        {/* Shield Outer Glow Halo */}
        <path
          d="M180 92 L246 118 V182 C246 222 218 258 180 270 C142 258 114 222 114 182 V118 L180 92 Z"
          fill="url(#rkShieldGrad)"
          stroke="url(#rkBorderGrad)"
          strokeWidth="3.5"
          filter="url(#rkLaserGlow)"
        />

        {/* Inner Tech Bezel */}
        <path
          d="M180 106 L234 128 V180 C234 214 210 244 180 255 C150 244 126 214 126 180 V128 L180 106 Z"
          fill="#0c1f17"
          stroke="#1b412f"
          strokeWidth="1.5"
        />

        {/* Circuit traces on shield face */}
        <path
          d="M138 142 H158 L168 152 V192"
          stroke="#25593e"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="138" cy="142" r="2.5" fill="#c5ff55" />
        <circle cx="168" cy="192" r="2" fill="#10b981" />

        <path
          d="M222 142 H202 L192 152 V192"
          stroke="#25593e"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="222" cy="142" r="2.5" fill="#c5ff55" />
        <circle cx="192" cy="192" r="2" fill="#10b981" />

        {/* Knight Helmet Top Crest Plume */}
        <path d="M180 112 L187 124 H173 L180 112 Z" fill="#c5ff55" />
        <line x1="180" y1="106" x2="180" y2="125" stroke="#c5ff55" strokeWidth="2.5" strokeLinecap="round" />

        {/* Knight Glowing Cyber Visor (The Sentinel Eye) */}
        <g className="anim-visor">
          <path
            d="M156 142 H204 L212 156 H148 L156 142 Z"
            fill="#c5ff55"
          />
          {/* Slit Grid Lines */}
          <line x1="160" y1="147" x2="200" y2="147" stroke="#0a1a13" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="164" y1="152" x2="196" y2="152" stroke="#0a1a13" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Developer Code Monogram: < / > */}
        <g className="anim-code">
          {/* Left Bracket < */}
          <path
            d="M166 178 L157 187 L166 196"
            stroke="#c5ff55"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Slash / */}
          <line
            x1="183"
            y1="175"
            x2="177"
            y2="199"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Right Bracket > */}
          <path
            d="M194 178 L203 187 L194 196"
            stroke="#c5ff55"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* 404 Core Diamond Base */}
        <path
          d="M180 214 L193 226 L180 238 L167 226 L180 214 Z"
          fill="#10b981"
          stroke="#c5ff55"
          strokeWidth="1.8"
        />
        <text
          x="180"
          y="230"
          textAnchor="middle"
          fill="#07140e"
          fontSize="10"
          fontWeight="900"
          fontFamily="monospace"
        >
          404
        </text>

        {/* ================= 7. VERTICAL SCANNING LASER BEAM ================= */}
        <g className="anim-scan">
          {/* Laser Line */}
          <line
            x1="116"
            y1="102"
            x2="244"
            y2="102"
            stroke="#c5ff55"
            strokeWidth="2.5"
            filter="url(#rkLaserGlow)"
          />
          {/* Laser Field */}
          <rect
            x="118"
            y="76"
            width="124"
            height="26"
            fill="url(#rkScanGrad)"
          />
        </g>

        {/* ================= 8. FLOATING CODE PARTICLES & CALLOUT BOXES ================= */}
        {/* Top-Right: { } */}
        <g className="anim-particle-1" transform="translate(254, 76)">
          <rect x="0" y="0" width="44" height="24" rx="6" fill="#142b1f" stroke="#25593e" strokeWidth="1.2" />
          <text x="22" y="16" textAnchor="middle" fill="#c5ff55" fontSize="12" fontFamily="monospace" fontWeight="bold">
            {`{ }`}
          </text>
        </g>

        {/* Top-Left: HEAD~0 */}
        <g className="anim-particle-2" transform="translate(38, 76)">
          <rect x="0" y="0" width="68" height="24" rx="6" fill="#142b1f" stroke="#25593e" strokeWidth="1.2" />
          <circle cx="10" cy="12" r="3.5" fill="#ef4444" className="animate-pulse" />
          <text x="40" y="16" textAnchor="middle" fill="#fca5a5" fontSize="10" fontFamily="monospace" fontWeight="bold">
            HEAD~0
          </text>
        </g>

        {/* Mid-Left: !404 ERR */}
        <g className="anim-particle-3" transform="translate(24, 168)">
          <rect x="0" y="0" width="56" height="24" rx="6" fill="#142b1f" stroke="#ef4444" strokeWidth="1.2" />
          <circle cx="9" cy="12" r="3" fill="#ef4444" className="animate-pulse" />
          <text x="34" y="16" textAnchor="middle" fill="#fca5a5" fontSize="10" fontFamily="monospace" fontWeight="bold">
            !404
          </text>
        </g>

        {/* Bottom-Right: NULL_PTR */}
        <g className="anim-particle-4" transform="translate(258, 248)">
          <rect x="0" y="0" width="70" height="24" rx="6" fill="#142b1f" stroke="#10b981" strokeWidth="1.2" />
          <text x="35" y="16" textAnchor="middle" fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="bold">
            NULL_PTR
          </text>
        </g>

        {/* Ambient Binary Floating Numbers */}
        <text x="74" y="270" fill="#326045" fontSize="10" fontFamily="monospace">0101</text>
        <text x="70" y="130" fill="#326045" fontSize="10" fontFamily="monospace">0100</text>
        <text x="278" y="150" fill="#326045" fontSize="10" fontFamily="monospace">NULL</text>
        <text x="175" y="65" fill="#326045" fontSize="9" fontFamily="monospace">SECTOR_404</text>
      </svg>
    </div>
  );
}

