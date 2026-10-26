import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ showLabel = false, className = "" }) {
  const { theme, toggleTheme, isNight } = useTheme();

  const handleToggle = (e) => {
    e.stopPropagation();
    toggleTheme();
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isNight ? "Switch to Day Mode" : "Switch to Night Mode"}
      title={isNight ? "Switch to Day Mode (Light)" : "Switch to Night Mode (Dark)"}
      className={`group relative inline-flex items-center gap-2.5 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#c5ff55]/40 select-none ${
        isNight
          ? "border-white/15 bg-white/5 text-amber-300 hover:bg-white/10 hover:border-white/30"
          : "border-slate-300 bg-white text-indigo-600 hover:bg-slate-50 hover:border-slate-400 shadow-sm"
      } ${showLabel ? "px-3.5 py-2 w-full justify-between" : "h-9 w-9 sm:h-10 sm:w-10 justify-center"} ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isNight ? (
            <motion.div
              key="moon"
              initial={{ scale: 0.4, rotate: -60, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.4, rotate: 60, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center text-amber-300"
            >
              <Moon size={16} className="transition-transform group-hover:rotate-12" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ scale: 0.4, rotate: 60, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.4, rotate: -60, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center text-amber-500"
            >
              <Sun size={17} className="transition-transform group-hover:rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showLabel && (
        <span className="text-xs font-mono font-bold tracking-tight text-right flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isNight ? "bg-amber-400 animate-pulse" : "bg-emerald-500"
            }`}
          />
          {isNight ? "Night Mode" : "Day Mode"}
        </span>
      )}
    </button>
  );
}
