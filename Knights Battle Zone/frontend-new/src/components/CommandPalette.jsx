import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Swords,
  Code2,
  Trophy,
  Users,
  Keyboard,
  Briefcase,
  HelpCircle,
  LayoutDashboard,
  User,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const COMMAND_ITEMS = [
  {
    id: "arena",
    title: "1v1 Battle Arena",
    subtitle: "Real-time algorithmic duels and AI bot sparring",
    category: "Competitive Modes",
    icon: Swords,
    path: "/arena",
  },
  {
    id: "contests",
    title: "Tournaments & Contests",
    subtitle: "Knight Grand Prix and weekly rated challenges",
    category: "Competitive Modes",
    icon: Trophy,
    path: "/contests",
  },
  {
    id: "problems",
    title: "Problem Catalog",
    subtitle: "DSA practice, editorial solutions, and test cases",
    category: "Practice",
    icon: Code2,
    path: "/problems",
  },
  {
    id: "typing",
    title: "Speed Coding Test",
    subtitle: "Benchmark typing velocity on JS, Python, and C++ syntax",
    category: "Practice",
    icon: Keyboard,
    path: "/typing",
  },
  {
    id: "clubs",
    title: "Coding Clubs & Circles",
    subtitle: "Peer learning squads, curriculum roadmap, and doubts",
    category: "Community",
    icon: Users,
    path: "/clubs",
  },
  {
    id: "leaderboard",
    title: "Global Leaderboard",
    subtitle: "National standings, ratings, and campus rankings",
    category: "Community",
    icon: Trophy,
    path: "/leaderboard",
  },
  {
    id: "jobs",
    title: "Jobs & Placements",
    subtitle: "Verified tech openings, ATS resume audit & tracker",
    category: "Career",
    icon: Briefcase,
    path: "/jobs",
  },
  {
    id: "quizzes",
    title: "Technical Quizzes",
    subtitle: "Timed aptitude assessments and answer keys",
    category: "Career",
    icon: HelpCircle,
    path: "/quizzes",
  },
  {
    id: "dashboard",
    title: "Knight Dashboard",
    subtitle: "Personal progress, topic readiness & daily goals",
    category: "Account",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    id: "profile",
    title: "Knight Profile",
    subtitle: "Badges, contest rating, and duel statistics",
    category: "Account",
    icon: User,
    path: "/profile",
  },
];

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Filter items
  const filteredItems = COMMAND_ITEMS.filter((item) => {
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex].path);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Palette Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#161a14] shadow-2xl shadow-black/80"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
              <Search size={18} className="text-[#aab1a1]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Teleport to Arena, Problems, Contests, Guilds... (ESC to close)"
                className="w-full bg-transparent text-sm text-white placeholder-[#788071] outline-none"
              />
              <span className="hidden sm:inline-flex items-center rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-[#aab1a1]">
                ESC
              </span>
            </div>

            {/* List Results */}
            <div className="max-h-96 overflow-y-auto p-2">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-semibold text-[#aab1a1]">
                    No matching destinations found for "{query}"
                  </p>
                  <p className="mt-1 text-xs text-[#788071]">
                    Try searching "arena", "contests", "jobs", or "dsa"
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredItems.map((item, index) => {
                    const Icon = item.icon;
                    const isSelected = index === selectedIndex;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.path)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition ${
                          isSelected
                            ? "bg-[#c5ff55]/15 text-[#c5ff55]"
                            : "text-[#c7ccc2] hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                              isSelected
                                ? "bg-[#c5ff55] text-[#14170f]"
                                : "bg-white/5 text-[#aab1a1]"
                            }`}
                          >
                            <Icon size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-bold ${
                                  isSelected ? "text-white" : "text-[#c7ccc2]"
                                }`}
                              >
                                {item.title}
                              </span>
                              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold text-[#788071]">
                                {item.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#788071]">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        <ArrowRight
                          size={14}
                          className={`transition ${
                            isSelected
                              ? "translate-x-0.5 text-[#c5ff55] opacity-100"
                              : "opacity-0"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Hints Footer */}
            <div className="flex items-center justify-between border-t border-white/10 bg-black/40 px-4 py-2.5 text-[11px] text-[#788071]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[9px]">
                    ↑
                  </kbd>
                  <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[9px]">
                    ↓
                  </kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[9px]">
                    ↵
                  </kbd>
                  to select
                </span>
              </div>
              <span className="font-semibold text-[#c5ff55]/80">
                Knightzone Teleport
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
