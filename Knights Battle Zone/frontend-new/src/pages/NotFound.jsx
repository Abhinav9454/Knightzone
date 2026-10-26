import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Zap,
  Maximize2,
  Minimize2,
  Activity,
  Radio,
  RotateCcw,
  Clock,
} from "lucide-react";
import {
  DeveloperKnight404Illustration,
  KnightLogo,
  KnightCrest,
} from "../components/svg";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../context/ThemeContext";

const RADAR_SECTORS = [
  { id: "SEC-NW", label: "SECTOR NW // 0x404A", top: "14%", left: "7%", delay: "0.4s", duration: "5.4s", freq: "4.2GHz" },
  { id: "SEC-NE", label: "SECTOR NE // 0xDEAD", top: "18%", right: "8%", delay: "2.6s", duration: "6.2s", freq: "5.8GHz" },
  { id: "CORR-W", label: "CORRIDOR W // VOID",  top: "50%", left: "4%",   delay: "1.2s", duration: "4.6s", freq: "3.6GHz" },
  { id: "CORR-E", label: "CORRIDOR E // UNLINK",top: "48%", right: "5%",  delay: "3.7s", duration: "5.8s", freq: "5.1GHz" },
  { id: "SEC-SW", label: "SECTOR SW // DROP",   bottom: "14%", left: "8%", delay: "3.1s", duration: "5.0s", freq: "2.4GHz" },
  { id: "SEC-SE", label: "SECTOR SE // ECHO",   bottom: "16%", right: "9%", delay: "1.7s", duration: "6.5s", freq: "6.4GHz" },
];

const MAIN_RADAR_WAVES = [0, 1.2, 2.4, 3.6, 4.8, 6.0];

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isNight } = useTheme();

  const [teleportCountdown, setTeleportCountdown] = useState(15);
  const [autoRedirectPaused, setAutoRedirectPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pingCount, setPingCount] = useState(0);
  const [pingStatus, setPingStatus] = useState("RADAR_SCAN: ROUTE_UNRESOLVED");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clickShockwaves, setClickShockwaves] = useState([]);

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto redirect countdown
  useEffect(() => {
    if (autoRedirectPaused) return;

    const timer = setInterval(() => {
      setTeleportCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRedirectPaused, navigate]);

  // Global Keyboard Navigation (hotkeys)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      const key = e.key.toLowerCase();
      if (key === "escape") {
        navigate(-1);
      } else if (key === "h") {
        navigate("/dashboard");
      } else if (key === "a") {
        navigate("/arena");
      } else if (key === "p") {
        navigate("/problems");
      } else if (key === "t" || key === "c") {
        navigate("/contests");
      } else if (key === " ") {
        e.preventDefault();
        triggerRadarPing();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  const triggerRadarPing = () => {
    setPingCount((prev) => prev + 1);
    const statuses = [
      "SONAR_SWEEP: 0x404 NO_SIGNAL",
      "BEACON_PULSE: VOID_DETECTED",
      "QUANTUM_TRACE: SECTOR_EMPTY",
      "SUBSPACE_ECHO: TARGET_OFFLINE",
      "KERNEL_RADAR: GRID_DESYNC",
    ];
    setPingStatus(statuses[(pingCount + 1) % statuses.length]);
  };

  // Dispatch interactive visual shockwave ring
  const handlePageClick = (e) => {
    if (e.target.closest("button") || e.target.closest("a") || e.target.closest("input")) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newWave = {
      id: Date.now() + Math.random(),
      x,
      y,
    };

    setClickShockwaves((prev) => [...prev.slice(-4), newWave]);
    triggerRadarPing();

    setTimeout(() => {
      setClickShockwaves((prev) => prev.filter((item) => item.id !== newWave.id));
    }, 2400);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      onClick={handlePageClick}
      className={`h-screen max-h-screen w-screen overflow-hidden flex flex-col justify-between relative font-sans cursor-crosshair transition-colors duration-200 select-none ${
        isNight
          ? "bg-[#0c0f0a] text-[#e0e4dc] selection:bg-[#c5ff55] selection:text-[#0c0f0a]"
          : "bg-white text-slate-800 selection:bg-emerald-500 selection:text-white"
      }`}
    >
      {/* Dynamic Cyber Grid Background */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${
          isNight ? "opacity-[0.035]" : "opacity-[0.05]"
        }`}
        style={{
          backgroundImage: `linear-gradient(to right, ${
            isNight ? "#c5ff55" : "#10b981"
          } 1px, transparent 1px), linear-gradient(to bottom, ${
            isNight ? "#c5ff55" : "#10b981"
          } 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />

      {/* Background Watermark Crests */}
      <div
        className={`absolute -right-32 -top-32 pointer-events-none select-none blur-[1px] transition-opacity duration-200 ${
          isNight ? "opacity-10 text-white" : "opacity-[0.03] text-emerald-950"
        }`}
      >
        <KnightCrest className="w-[580px] h-[580px]" glow={false} />
      </div>
      <div
        className={`absolute -left-36 -bottom-36 pointer-events-none select-none blur-[1px] transition-opacity duration-200 ${
          isNight ? "opacity-5 text-white" : "opacity-[0.02] text-emerald-950"
        }`}
      >
        <KnightCrest className="w-[620px] h-[620px]" glow={false} />
      </div>

      {/* ================= FULL-PAGE CONTINUOUS MULTI-ORDER RADAR SYSTEM ================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <style>{`
          @keyframes fullPageRadarWave {
            0% {
              width: 60px;
              height: 60px;
              opacity: 0.85;
              border-width: 2px;
              box-shadow: 0 0 20px ${isNight ? "rgba(197, 255, 85, 0.45)" : "rgba(16, 185, 129, 0.4)"};
            }
            35% {
              opacity: 0.45;
              border-width: 1.5px;
            }
            70% {
              opacity: 0.2;
              border-width: 1px;
            }
            100% {
              width: 2600px;
              height: 2600px;
              opacity: 0;
              border-width: 0.5px;
              box-shadow: 0 0 60px transparent;
            }
          }
          @keyframes fullPageRadarSweep {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
          }
          @keyframes sectorSonarPulse {
            0% {
              width: 10px;
              height: 10px;
              opacity: 0.95;
              border-width: 2px;
            }
            100% {
              width: 440px;
              height: 440px;
              opacity: 0;
              border-width: 0.5px;
            }
          }
          @keyframes shockwaveExpand {
            0% {
              width: 30px;
              height: 30px;
              opacity: 1;
              border-width: 3px;
              box-shadow: 0 0 25px ${isNight ? "rgba(197, 255, 85, 0.9)" : "rgba(16, 185, 129, 0.8)"};
            }
            100% {
              width: 2800px;
              height: 2800px;
              opacity: 0;
              border-width: 0.5px;
              box-shadow: 0 0 80px transparent;
            }
          }
          .full-radar-ring {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border-radius: 9999px;
            border-style: solid;
            border-color: ${isNight ? "rgba(197, 255, 85, 0.32)" : "rgba(16, 185, 129, 0.28)"};
            pointer-events: none;
            animation: fullPageRadarWave 7.2s cubic-bezier(0.12, 0.45, 0.2, 1) infinite;
          }
          .sector-sonar-ring {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border-radius: 9999px;
            border-style: solid;
            border-color: ${isNight ? "rgba(197, 255, 85, 0.28)" : "rgba(16, 185, 129, 0.24)"};
            pointer-events: none;
          }
          .shockwave-ring {
            position: absolute;
            transform: translate(-50%, -50%);
            border-radius: 9999px;
            border-style: solid;
            border-color: ${isNight ? "#c5ff55" : "#10b981"};
            pointer-events: none;
            animation: shockwaveExpand 2.2s cubic-bezier(0.08, 0.5, 0.2, 1) forwards;
          }
        `}</style>

        {/* 1. Grand 360° Rotating Radar Sweep across the whole viewport */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none ${
            isNight ? "opacity-30 mix-blend-screen" : "opacity-25"
          }`}
          style={{
            width: "max(170vw, 170vh)",
            height: "max(170vw, 170vh)",
            minWidth: "1200px",
            minHeight: "1200px",
            background: isNight
              ? "conic-gradient(from 0deg, transparent 0deg, transparent 310deg, rgba(197, 255, 85, 0.04) 345deg, rgba(197, 255, 85, 0.25) 360deg)"
              : "conic-gradient(from 0deg, transparent 0deg, transparent 310deg, rgba(16, 185, 129, 0.03) 345deg, rgba(16, 185, 129, 0.20) 360deg)",
            animation: "fullPageRadarSweep 10s linear infinite",
          }}
        />

        {/* 2. Static Concentric Radar Grid Rings */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full border border-dashed pointer-events-none ${
            isNight ? "border-[#c5ff55]/15" : "border-emerald-500/20"
          }`}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full border border-dashed pointer-events-none ${
            isNight ? "border-[#c5ff55]/10" : "border-emerald-500/15"
          }`}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1150px] h-[1150px] rounded-full border border-dashed pointer-events-none ${
            isNight ? "border-[#c5ff55]/[0.08]" : "border-emerald-500/10"
          }`}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1650px] h-[1650px] rounded-full border border-dashed pointer-events-none ${
            isNight ? "border-[#c5ff55]/[0.05]" : "border-emerald-500/[0.07]"
          }`}
        />

        {/* Radar Cardinal Crosshair Lines */}
        <div
          className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px pointer-events-none ${
            isNight
              ? "bg-gradient-to-b from-transparent via-[#c5ff55]/15 to-transparent"
              : "bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent"
          }`}
        />
        <div
          className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px pointer-events-none ${
            isNight
              ? "bg-gradient-to-r from-transparent via-[#c5ff55]/15 to-transparent"
              : "bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"
          }`}
        />

        {/* Central Core Ambient Glow */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full blur-[110px] pointer-events-none ${
            isNight ? "bg-[#c5ff55]/[0.04]" : "bg-emerald-500/[0.05]"
          }`}
        />

        {/* 3. Continuous Outward Radar Waves */}
        {MAIN_RADAR_WAVES.map((delay, index) => (
          <div
            key={index}
            className="full-radar-ring"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}

        {/* 4. Asynchronous Multi-Beacon Sector Pings */}
        {RADAR_SECTORS.map((sector) => (
          <div
            key={sector.id}
            className="absolute z-10 pointer-events-none select-none hidden md:block"
            style={{
              top: sector.top,
              bottom: sector.bottom,
              left: sector.left,
              right: sector.right,
            }}
          >
            {/* Pulsing Beacon Center */}
            <div className="relative flex items-center justify-center">
              <span
                className={`h-2 w-2 rounded-full animate-ping ${
                  isNight ? "bg-[#c5ff55]" : "bg-emerald-500"
                }`}
              />
              <span
                className={`absolute h-1.5 w-1.5 rounded-full ${
                  isNight ? "bg-[#c5ff55]" : "bg-emerald-600"
                }`}
              />

              {/* Staggered Outward Sector Ripples */}
              <div
                className="sector-sonar-ring"
                style={{
                  animation: `sectorSonarPulse ${sector.duration} cubic-bezier(0.1, 0.45, 0.2, 1) infinite`,
                  animationDelay: sector.delay,
                }}
              />
              <div
                className="sector-sonar-ring"
                style={{
                  animation: `sectorSonarPulse ${sector.duration} cubic-bezier(0.1, 0.45, 0.2, 1) infinite`,
                  animationDelay: `calc(${sector.delay} + 1.8s)`,
                }}
              />
            </div>

            {/* High-tech Sector Telemetry Readout */}
            <div
              className={`mt-2 font-mono text-[9px] whitespace-nowrap border rounded-md px-2 py-0.5 backdrop-blur-sm flex items-center gap-1.5 shadow-md ${
                isNight
                  ? "bg-black/60 border-white/10 text-[#788874]"
                  : "bg-white/90 border-slate-200 text-slate-600 shadow-sm"
              }`}
            >
              <span
                className={`w-1 h-1 rounded-full inline-block animate-pulse ${
                  isNight ? "bg-[#c5ff55]" : "bg-emerald-600"
                }`}
              />
              <span
                className={`font-bold ${
                  isNight ? "text-white" : "text-slate-900"
                }`}
              >
                {sector.label}
              </span>
              <span className={isNight ? "text-[#5a6b56]" : "text-slate-400"}>
                [{sector.freq}]
              </span>
            </div>
          </div>
        ))}

        {/* 5. User-Triggered Active Sonar Shockwaves */}
        {clickShockwaves.map((sw) => (
          <div
            key={sw.id}
            className="shockwave-ring"
            style={{ left: sw.x, top: sw.y }}
          />
        ))}
      </div>

      {/* ================= 1. TOP COMBAT COMMAND BAR ================= */}
      <header
        className={`border-b px-4 sm:px-8 py-2 relative z-30 shrink-0 transition-colors duration-200 ${
          isNight
            ? "border-white/10 bg-[#121610]/95 backdrop-blur-md"
            : "border-slate-200 bg-white/95 backdrop-blur-md shadow-xs"
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Identity */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group shrink-0"
          >
            <KnightLogo className="h-7 w-7" animated />
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-black tracking-wider transition ${
                    isNight
                      ? "text-white group-hover:text-[#c5ff55]"
                      : "text-slate-900 group-hover:text-emerald-600"
                  }`}
                >
                  KNIGHT
                  <span className={isNight ? "text-white" : "text-slate-900"}>
                    ZONE
                  </span>
                </span>
                <span className="rounded bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.2 text-[8px] font-mono font-black text-rose-500 uppercase tracking-widest animate-pulse">
                  ROUTE_404
                </span>
              </div>
              <p
                className={`text-[8px] font-mono flex items-center gap-1.5 ${
                  isNight ? "text-[#788874]" : "text-slate-500"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full inline-block animate-ping ${
                    isNight ? "bg-[#c5ff55]" : "bg-emerald-500"
                  }`}
                />
                KERNEL RADAR PROTOCOL ACTIVE
              </p>
            </div>
          </Link>

          {/* Center Telemetry Readout (Desktop only) */}
          <div
            className={`hidden md:flex items-center gap-3.5 rounded-xl border px-3.5 py-1 text-xs font-mono ${
              isNight
                ? "border-white/10 bg-black/40 text-[#788874]"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Clock
                size={12}
                className={isNight ? "text-white" : "text-slate-900"}
              />
              {currentTime.toUTCString().slice(17, 25)} UTC
            </span>
            <span className={isNight ? "text-white/20" : "text-slate-300"}>|</span>
            <span className="flex items-center gap-1.5">
              <Activity size={12} className={isNight ? "text-white" : "text-slate-900"} />
              LATENCY: <strong className={isNight ? "text-white" : "text-slate-900"}>14ms</strong>
            </span>
            <span className={isNight ? "text-white/20" : "text-slate-300"}>|</span>
            <span>
              SECTOR: <strong className="text-rose-500">UNRESOLVED</strong>
            </span>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            {/* Day / Night Theme Toggle */}
            <ThemeToggle className="h-8 w-8" />

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className={`hidden sm:flex p-1.5 rounded-xl border transition ${
                isNight
                  ? "border-white/10 bg-white/5 text-[#aab1a1] hover:text-white hover:bg-white/10"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-xs"
              }`}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            {/* Auto Teleport Counter */}
            <div
              className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-mono ${
                isNight
                  ? "border-[#c5ff55]/30 bg-[#c5ff55]/10 text-[#aab1a1]"
                  : "border-emerald-300 bg-emerald-50 text-slate-700"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full animate-ping ${
                  isNight ? "bg-[#c5ff55]" : "bg-emerald-500"
                }`}
              />
              <span className="hidden sm:inline">Teleport</span>
              <strong
                className={isNight ? "text-white" : "text-slate-900"}
              >
                {teleportCountdown}s
              </strong>
              <button
                onClick={() => setAutoRedirectPaused(!autoRedirectPaused)}
                className={`text-[9px] font-bold underline ml-0.5 ${
                  isNight
                    ? "text-[#aab1a1] hover:text-white"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {autoRedirectPaused ? "Resume" : "Pause"}
              </button>
            </div>

            {/* Instant Warp Button */}
            <Link
              to="/dashboard"
              className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-mono font-black transition shadow-sm ${
                isNight
                  ? "bg-[#c5ff55] text-[#0c0f0a] hover:bg-[#d5ff83] shadow-[#c5ff55]/20"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20"
              }`}
            >
              <Zap size={12} />
              <span>HQ</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ================= 2. FULL-PAGE GRAND RADAR CENTERPIECE ================= */}
      <main className="max-w-4xl mx-auto px-4 py-2 sm:py-3 relative z-10 flex-1 flex flex-col items-center justify-center text-center w-full min-h-0 overflow-hidden">
        <div className="relative flex flex-col items-center justify-center w-full my-auto">
          {/* Scaled down radar illustration */}
          <DeveloperKnight404Illustration
            className={`w-[170px] h-[170px] sm:w-[205px] sm:h-[205px] md:w-[240px] md:h-[240px] lg:w-[260px] lg:h-[260px] max-w-full ${
              isNight
                ? "drop-shadow-[0_0_50px_rgba(197,255,85,0.4)]"
                : "drop-shadow-[0_0_35px_rgba(16,185,129,0.25)]"
            }`}
            interactive={true}
            onPing={triggerRadarPing}
          />

          {/* Dynamic Status Beacon Badge */}
          <div
            onClick={triggerRadarPing}
            className={`cursor-pointer group -mt-2 sm:-mt-3 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-mono shadow-md backdrop-blur-md transition transform hover:scale-105 ${
              isNight
                ? "border-white/20 bg-[#121610]/95 text-white"
                : "border-slate-300 bg-white/95 text-slate-900 shadow-sm"
            }`}
          >
            <Radio
              size={12}
              className={`animate-pulse ${
                isNight ? "text-white" : "text-slate-900"
              }`}
            />
            <span className="font-bold tracking-wider">{pingStatus}</span>
            <span
              className={`text-[10px] ${
                isNight
                  ? "text-[#788874] group-hover:text-white"
                  : "text-slate-400 group-hover:text-slate-700"
              }`}
            >
              ({pingCount} Pings)
            </span>
          </div>

          {/* 404 Headline & Subtitle */}
          <div className="mt-2 sm:mt-3">
            <h1
              className={`text-5xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight select-none leading-none ${
                isNight ? "text-white" : "text-slate-900"
              }`}
            >
              4
              <span
                className={`inline-block animate-pulse ${
                  isNight ? "text-white" : "text-slate-900"
                }`}
              >
                0
              </span>
              4
            </h1>
            <h2
              className={`text-base sm:text-lg font-black uppercase tracking-wider mt-1 ${
                isNight ? "text-white" : "text-slate-800"
              }`}
            >
              Segment Fault · Route Void
            </h2>
            <p
              className={`mt-1 text-xs sm:text-sm max-w-md mx-auto leading-relaxed ${
                isNight ? "text-[#aab1a1]" : "text-slate-600"
              }`}
            >
              Target coordinate does not exist in the platform registry. Initiate
              emergency rollback or warp directly to a battle zone.
            </p>
          </div>

          {/* Primary Quick Controls */}
          <div className="mt-3 sm:mt-3.5 flex items-center justify-center gap-2.5 sm:gap-3 flex-wrap">
            <button
              onClick={() => navigate(-1)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs sm:text-sm font-mono font-bold transition shadow-xs ${
                isNight
                  ? "border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/30"
                  : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-400"
              }`}
            >
              <ArrowLeft size={14} />
              <span>Rollback [ESC]</span>
            </button>

            <Link
              to="/dashboard"
              className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs sm:text-sm font-mono font-black transition shadow-md ${
                isNight
                  ? "bg-[#c5ff55] text-[#0c0f0a] hover:bg-[#d5ff83] shadow-[#c5ff55]/25"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20"
              }`}
            >
              <Zap size={14} />
              <span>Warp HQ [H]</span>
            </Link>

            <button
              onClick={triggerRadarPing}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs sm:text-sm font-mono font-bold transition ${
                isNight
                  ? "border-white/20 bg-white/5 text-white hover:bg-white/10"
                  : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
              }`}
            >
              <RotateCcw size={14} />
              <span>Ping Radar [Space]</span>
            </button>
          </div>
        </div>
      </main>

      {/* ================= 3. BOTTOM COCKPIT TICKER FOOTER ================= */}
      <footer
        className={`border-t py-1.5 px-4 sm:px-8 text-[11px] font-mono shrink-0 relative z-20 transition-colors duration-200 ${
          isNight
            ? "border-white/10 bg-[#0e120c] text-[#5a6b56]"
            : "border-slate-200 bg-slate-50 text-slate-500"
        }`}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span
              className={`font-black ${
                isNight ? "text-white" : "text-slate-900"
              }`}
            >
              KNIGHTZONE KERNEL
            </span>
            <span>•</span>
            <span>DISPATCHER v2.4.0</span>
            <span>•</span>
            <span className={isNight ? "text-[#aab1a1]" : "text-slate-600"}>
              STATUS: 404 UNRESOLVED
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-[10px]">
            <span>Press [H] HQ</span>
            <span>·</span>
            <span>[A] Duel Arena</span>
            <span>·</span>
            <span>[P] Problem Set</span>
            <span>·</span>
            <span>[ESC] Back</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
