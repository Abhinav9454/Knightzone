import { useState, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import Sidebar from "./Sidebar";
import CommandPalette from "./CommandPalette";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "../context/ThemeContext";
import { KnightLogo } from "./svg";

const AppLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { isNight } = useTheme();

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

      {/* Unified Desktop & Mobile Sidebar */}
      <Sidebar mobileOpen={menuOpen} onClose={closeMenu} />

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

      {/* Page content - with responsive top spacing on mobile and left offset on desktop */}
      <div className="min-h-screen pt-16 lg:pl-[72px] lg:pt-0 transition-all duration-300">
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
