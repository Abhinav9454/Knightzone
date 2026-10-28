import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { Menu, Search, ShieldAlert, Bell } from "lucide-react";
import Sidebar from "./Sidebar";
import CommandPalette from "./CommandPalette";
import ThemeToggle from "./ThemeToggle";
import KnightChatWidget from "./KnightChatWidget";
import NotificationDrawer from "./NotificationDrawer";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { KnightLogo } from "./svg";

const AppLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { isNight } = useTheme();
  const { isAdmin, adminMode, setAdminMode } = useAuth();
  const navigate = useNavigate();

  const closeMenu = () => setMenuOpen(false);

  // Global Ctrl + K / Cmd + K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isNight ? "bg-[#0c0f0a] text-[#e0e4dc]" : "bg-[#f6f8f4] text-slate-800"
      }`}
    >
      {/* Global Command Palette Modal */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Global Realtime In-App Notifications Drawer (Feature 9) */}
      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      {/* Unified Desktop & Mobile Sidebar */}
      <Sidebar mobileOpen={menuOpen} onClose={closeMenu} />

      {/* Desktop Floating Action Bar (Top Right) */}
      <div className="hidden lg:flex fixed top-4 right-6 z-30 items-center gap-2.5">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold backdrop-blur-md transition shadow-sm ${
            isNight
              ? "border-white/10 bg-[#161a14]/80 text-[#aab1a1] hover:text-white hover:border-white/20"
              : "border-slate-200 bg-white/90 text-slate-600 hover:text-slate-900 shadow-slate-200"
          }`}
          title="Command Palette (Ctrl + K)"
        >
          <Search size={14} className="text-[#c5ff55]" />
          <span>Quick Find</span>
          <kbd className="rounded border border-white/20 bg-black/40 px-1.5 py-0.5 text-[10px] font-mono text-white">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => setNotificationsOpen(true)}
          aria-label="Open notifications center"
          className={`relative flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur-md transition shadow-sm ${
            isNight
              ? "border-white/10 bg-[#161a14]/80 text-white hover:bg-white/10 hover:border-[#c5ff55]/40"
              : "border-slate-200 bg-white/90 text-slate-800 hover:bg-slate-100"
          }`}
          title="Battle Alerts & Notifications"
        >
          <Bell size={16} />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-sm shadow-rose-500/50">
            3
          </span>
        </button>

        <ThemeToggle />
      </div>

      {/* Mobile top navigation header (< lg) */}
      <header
        className={`fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between px-4 backdrop-blur-lg border-b lg:hidden transition-colors duration-200 ${
          isNight
            ? "border-white/10 bg-[#121610]/95"
            : "border-slate-200 bg-white/95 shadow-sm"
        }`}
      >
        <Link
          to="/"
          className="flex items-center gap-2.5"
        >
          <KnightLogo className="h-8 w-8" animated />
          <span
            className={`text-sm font-black tracking-[0.12em] ${
              isNight ? "text-white" : "text-slate-900"
            }`}
          >
            KNIGHT<span className={isNight ? "text-[#c5ff55]" : "text-emerald-600"}>ZONE</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            aria-label="Notifications"
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition ${
              isNight
                ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                : "border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200"
            }`}
          >
            <Bell size={18} />
            <span className="absolute 1 top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
          </button>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Quick Teleport (Ctrl + K)"
            title="Search & Teleport (Ctrl + K)"
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
              isNight
                ? "border-white/10 bg-white/5 text-[#c5ff55] hover:bg-white/10"
                : "border-slate-200 bg-slate-100 text-emerald-600 hover:bg-slate-200"
            }`}
          >
            <Search size={18} />
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
              isNight
                ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                : "border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200"
            }`}
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Admin Candidate Preview Mode Banner */}
      {isAdmin && !adminMode && (
        <div className="fixed top-0 inset-x-0 z-50 bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white px-4 py-2 text-xs font-bold flex items-center justify-between border-b border-purple-500/30 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <ShieldAlert size={14} className="text-purple-300" />
            <span>Candidate Preview Active: You are viewing KnightZone as a candidate.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setAdminMode(true);
              navigate("/admin");
            }}
            className="rounded-lg bg-white/20 hover:bg-white/30 text-white px-3 py-1 text-[11px] font-black uppercase tracking-wider transition"
          >
            Return to Admin Console
          </button>
        </div>
      )}

      {/* Page content - with responsive top spacing on mobile and left offset on desktop */}
      <div className={`min-h-screen pt-16 lg:pl-[72px] lg:pt-0 transition-all duration-300 ${isAdmin && !adminMode ? "pt-24 lg:pt-10" : ""}`}>
        <Outlet />
      </div>

      {/* Global Knight AI & Live Support Chat Widget */}
      <KnightChatWidget />
    </div>
  );
};

export default AppLayout;
