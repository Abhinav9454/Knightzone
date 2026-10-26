import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  CirclePlay,
  GitBranch,
  Search,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  TerminalSquare,
  Trophy,
  Zap,
  Loader2,
  CalendarDays,
  Clock3,
} from "lucide-react";
import { BattleArenaIllustration } from "../components/svg";
import { problemsApi, contestsApi } from "../services/api";
import { useTheme } from "../context/ThemeContext";

const DEFAULT_PROBLEMS = [
  {
    id: 1,
    title: "Two Sum",
    description: "Find two numbers in array that add up to a specific target.",
    topics: ["Array", "Hash Table"],
    level: "Easy",
    levelClass: "bg-emerald-50 text-emerald-700",
    acceptance: "52.4%",
  },
  {
    id: 2,
    title: "Valid Parentheses & Bracket Matching",
    description: "Determine whether input brackets are correctly paired and nested.",
    topics: ["Stack", "String"],
    level: "Easy",
    levelClass: "bg-emerald-50 text-emerald-700",
    acceptance: "48.2%",
  },
  {
    id: 3,
    title: "Longest Substring Without Repeating Characters",
    description: "Find the longest unique substring using dynamic sliding windows.",
    topics: ["String", "Sliding Window"],
    level: "Medium",
    levelClass: "bg-amber-50 text-amber-700",
    acceptance: "34.8%",
  },
  {
    id: 4,
    title: "Maximum Subarray Sum (Kadane's Algorithm)",
    description: "Find the contiguous subarray with maximum cumulative sum in linear time.",
    topics: ["Array", "Dynamic Programming"],
    level: "Medium",
    levelClass: "bg-amber-50 text-amber-700",
    acceptance: "39.1%",
  },
];

const pathways = [
  {
    number: "01",
    title: "Core Data Structures",
    detail: "Arrays, linked lists, binary trees, heaps, and graphs.",
    icon: GitBranch,
    count: "Curated Tracks",
    link: "/problems",
  },
  {
    number: "02",
    title: "Core Algorithms",
    detail: "Sliding window, binary search, recursion, and dynamic programming.",
    icon: Zap,
    count: "Battle Ready",
    link: "/problems",
  },
  {
    number: "03",
    title: "Placement Drives",
    detail: "Campus recruitment rounds, direct company openings, and resume review.",
    icon: Target,
    count: "Top Companies",
    link: "/jobs",
  },
];

function Eyebrow({ children, isNight = true }) {
  return (
    <p
      className={`mb-3 text-xs font-black uppercase tracking-[0.17em] ${
        isNight ? "text-white" : "text-slate-900 font-extrabold"
      }`}
    >
      {children}
    </p>
  );
}

function SectionHeading({ eyebrow, title, description, action, isNight = true }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <Eyebrow isNight={isNight}>{eyebrow}</Eyebrow>
        <h2
          className={`text-2xl font-black tracking-tight sm:text-3xl ${
            isNight ? "text-white" : "text-slate-900"
          }`}
        >
          {title}
        </h2>
        {description && (
          <p
            className={`mt-2 max-w-2xl text-sm leading-6 sm:text-base ${
              isNight ? "text-[#aab1a1]" : "text-slate-600"
            }`}
          >
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function DifficultyBadge({ level, className }) {
  const styles =
    className ||
    (level === "Hard"
      ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
      : level === "Medium"
      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30");

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${styles}`}>
      {level}
    </span>
  );
}

export default function Home() {
  const { isNight } = useTheme();
  const [heroView, setHeroView] = useState("arena");
  const [liveProblems, setLiveProblems] = useState(DEFAULT_PROBLEMS);
  const [liveContests, setLiveContests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      problemsApi.getProblemSet({ page: 0, size: 4 }),
      contestsApi.getAll(0, 4),
    ]).then(([problemsRes, contestsRes]) => {
      if (!isMounted) return;

      // 1. Live Problems
      if (problemsRes.status === "fulfilled" && problemsRes.value?.content?.length > 0) {
        const mapped = problemsRes.value.content.slice(0, 4).map((p) => {
          const diff = p.difficulty
            ? p.difficulty.charAt(0).toUpperCase() + p.difficulty.slice(1).toLowerCase()
            : "Medium";
          return {
            id: p.id,
            title: p.title,
            description: p.description || "Solve this algorithmic challenge according to input constraints.",
            topics: [diff === "Hard" ? "Dynamic Programming" : diff === "Medium" ? "Algorithms" : "Array & Math"],
            level: diff,
            levelClass:
              diff === "Hard"
                ? "bg-rose-50 text-rose-700"
                : diff === "Medium"
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700",
            acceptance: "51.2%",
          };
        });
        setLiveProblems(mapped);
      }

      // 2. Live Contests
      if (contestsRes.status === "fulfilled" && contestsRes.value) {
        const list = Array.isArray(contestsRes.value)
          ? contestsRes.value
          : contestsRes.value.content || [];

        const now = new Date();
        const activeOrUpcoming = list
          .filter((c) => {
            const end = c.endTime ? new Date(c.endTime) : new Date(now.getTime() + 86400000);
            return end >= now;
          })
          .slice(0, 2)
          .map((c) => {
            const start = c.startTime ? new Date(c.startTime) : now;
            return {
              id: c.id,
              type: c.durationMinutes && c.durationMinutes <= 60 ? "SPEED CONTEST" : "RATED CHAMPIONSHIP",
              title: c.title || "Weekly Coding Challenge",
              date: start.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
              time: `${c.durationMinutes || 90} min`,
              tag: "All levels",
            };
          });

        if (activeOrUpcoming.length > 0) {
          setLiveContests(activeOrUpcoming);
        } else {
          setLiveContests([
            {
              id: 1,
              type: "WEEKLY CONTEST",
              title: "KBZ Weekly Championship",
              date: "This Weekend",
              time: "90 min",
              tag: "All levels",
            },
            {
              id: 2,
              type: "CAMPUS SPRINT",
              title: "Placement Algorithmic Sprint",
              date: "Upcoming Round",
              time: "60 min",
              tag: "Intermediate",
            },
          ]);
        }
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main
      className={`min-h-screen pb-16 transition-colors duration-200 ${
        isNight ? "bg-[#0c0f0a] text-[#e0e4dc]" : "bg-[#f8fafc] text-slate-800"
      }`}
    >
      {/* Hero Section */}
      <section
        className={`relative overflow-hidden border-b transition-colors duration-200 ${
          isNight ? "border-white/10 bg-[#121610]" : "border-slate-200 bg-white shadow-xs"
        }`}
      >
        <div
          className={`pointer-events-none absolute -right-28 -top-28 h-[30rem] w-[30rem] rounded-full blur-3xl ${
            isNight ? "bg-[#c5ff55]/5" : "bg-emerald-500/10"
          }`}
        />
        <div
          className={`pointer-events-none absolute -bottom-40 left-[28%] h-80 w-80 rounded-full blur-3xl ${
            isNight ? "bg-[#10b981]/5" : "bg-emerald-500/5"
          }`}
        />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <div
              className={`mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold ${
                isNight
                  ? "border-white/15 bg-white/5 text-white"
                  : "border-slate-300 bg-slate-100 text-slate-800"
              }`}
            >
              <Sparkles
                size={14}
                className={isNight ? "text-white" : "text-slate-900"}
              />{" "}
              A BETTER WAY TO PRACTICE DSA
            </div>

            <h1
              className={`max-w-2xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl ${
                isNight ? "text-white" : "text-slate-900"
              }`}
            >
              Become the kind of{" "}
              <span
                className={`block ${
                  isNight ? "text-white" : "text-slate-900"
                }`}
              >
                developer who solves.
              </span>
            </h1>

            <p
              className={`mt-6 max-w-xl text-base leading-7 sm:text-lg sm:leading-8 ${
                isNight ? "text-[#aab1a1]" : "text-slate-600"
              }`}
            >
              Practice with purpose, master core patterns, and test your speed in live 1v1 arenas. KBZ unifies competitive problem solving, campus drives, and developer duels into one focused workspace.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/problems"
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-black uppercase tracking-wider transition shadow-md focus:outline-none focus:ring-4 ${
                  isNight
                    ? "bg-[#c5ff55] text-[#14170f] shadow-[#c5ff55]/20 hover:bg-[#d5ff83] focus:ring-[#c5ff55]/30"
                    : "bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700 focus:ring-emerald-500/30"
                }`}
              >
                Explore problems <ArrowRight size={17} />
              </Link>

              <Link
                to="/arena"
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3.5 text-sm font-bold transition ${
                  isNight
                    ? "border-white/15 bg-white/5 text-white hover:border-[#c5ff55]/40 hover:bg-white/10"
                    : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-400 shadow-xs"
                }`}
              >
                <Swords
                  size={16}
                  className={isNight ? "text-white" : "text-slate-900"}
                />{" "}
                Enter 1v1 Arena
              </Link>
            </div>

            <div
              className={`mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm ${
                isNight ? "text-[#788874]" : "text-slate-500"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Check
                  size={16}
                  className={isNight ? "text-white" : "text-slate-900"}
                />{" "}
                Sandboxed Multi-Language Judge
              </span>
              <span className="inline-flex items-center gap-2">
                <Check
                  size={16}
                  className={isNight ? "text-white" : "text-slate-900"}
                />{" "}
                Live Matchmaking & Elo Ratings
              </span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-xl">
            <div
              className={`overflow-hidden rounded-2xl border shadow-2xl transition-colors duration-200 ${
                isNight
                  ? "border-white/10 bg-[#161a14]"
                  : "border-slate-200 bg-white shadow-xl"
              }`}
            >
              {/* Header with Switcher Tabs */}
              <div
                className={`flex items-center justify-between border-b px-4 py-3 transition-colors duration-200 ${
                  isNight
                    ? "border-white/10 bg-[#11140f]"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHeroView("arena")}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-black uppercase tracking-wider transition ${
                      heroView === "arena"
                        ? isNight
                          ? "bg-[#c5ff55] text-[#14170f] shadow-sm"
                          : "bg-emerald-600 text-white shadow-sm"
                        : isNight
                        ? "text-[#788874] hover:text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Swords size={13} />
                    Battle Arena
                  </button>

                  <button
                    onClick={() => setHeroView("editor")}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-black uppercase tracking-wider transition ${
                      heroView === "editor"
                        ? isNight
                          ? "bg-[#c5ff55] text-[#14170f] shadow-sm"
                          : "bg-emerald-600 text-white shadow-sm"
                        : isNight
                        ? "text-[#788874] hover:text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <TerminalSquare size={13} />
                    Workspace
                  </button>
                </div>

                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                    isNight
                      ? "border-white/10 bg-black/40 text-white"
                      : "border-slate-200 bg-white text-slate-900 shadow-xs"
                  }`}
                >
                  {heroView === "arena" ? "Live Arena" : "JavaScript"}
                </span>
              </div>

              {heroView === "arena" ? (
                <div
                  className={`p-5 flex flex-col items-center transition-colors duration-200 ${
                    isNight
                      ? "bg-gradient-to-b from-[#161a14] to-[#121610]"
                      : "bg-gradient-to-b from-slate-50 to-white"
                  }`}
                >
                  <BattleArenaIllustration className="w-full h-auto max-h-[290px]" />
                  <div
                    className={`flex items-center justify-between w-full border-t pt-3 mt-1 ${
                      isNight ? "border-white/10" : "border-slate-200"
                    }`}
                  >
                    <span
                      className={`text-[11px] font-mono flex items-center gap-1.5 ${
                        isNight ? "text-[#788874]" : "text-slate-500"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full animate-pulse ${
                          isNight ? "bg-[#c5ff55]" : "bg-emerald-500"
                        }`}
                      />
                      Live Matchmaking Queue Ready
                    </span>
                    <Link
                      to="/arena"
                      className={`text-xs font-bold hover:underline flex items-center gap-1 ${
                        isNight
                          ? "text-white"
                          : "text-slate-900 font-black"
                      }`}
                    >
                      Enter Arena <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-[0.88fr_1.12fr]">
                  <div
                    className={`border-b p-4 md:border-b-0 md:border-r ${
                      isNight
                        ? "border-white/10 bg-[#161a14]"
                        : "border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
                          isNight ? "text-[#788874]" : "text-slate-500"
                        }`}
                      >
                        Problem 001
                      </span>
                      <DifficultyBadge level="Easy" />
                    </div>
                    <h3
                      className={`mt-3 text-base font-bold ${
                        isNight ? "text-white" : "text-slate-900"
                      }`}
                    >
                      Two Sum
                    </h3>
                    <p
                      className={`mt-2 text-xs leading-5 ${
                        isNight ? "text-[#aab1a1]" : "text-slate-600"
                      }`}
                    >
                      Given an array of integers, return the indices of two numbers that add up to the target.
                    </p>
                    <div
                      className={`mt-4 rounded-xl border p-3 ${
                        isNight
                          ? "border-white/10 bg-black/40"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <p
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                          isNight ? "text-[#788874]" : "text-slate-500"
                        }`}
                      >
                        Example
                      </p>
                      <p
                        className={`mt-1 font-mono text-xs ${
                          isNight ? "text-[#e0e4dc]" : "text-slate-700"
                        }`}
                      >
                        nums = [2, 7, 11, 15]
                      </p>
                      <p
                        className={`font-mono text-xs ${
                          isNight ? "text-[#e0e4dc]" : "text-slate-700"
                        }`}
                      >
                        target = 9
                      </p>
                      <p
                        className={`mt-1 font-mono text-xs font-semibold ${
                          isNight ? "text-white" : "text-slate-900"
                        }`}
                      >
                        Output: [0, 1]
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#0e120c] p-4 text-slate-100">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-white">Solution.js</span>
                      <span className="text-[10px] font-mono text-[#788874]">Editor preview</span>
                    </div>
                    <div className="space-y-2 font-mono text-[11px] leading-5">
                      <div>
                        <span className="mr-3 text-[#5a6b56]">1</span>
                        <span className="text-rose-400">function</span>{" "}
                        <span className="text-[#c5ff55]">twoSum</span>(nums, target) {"{"}
                      </div>
                      <div>
                        <span className="mr-3 text-[#5a6b56]">2</span>
                        <span className="pl-3 text-rose-400">const</span> seen ={" "}
                        <span className="text-rose-400">new</span> Map();
                      </div>
                      <div>
                        <span className="mr-3 text-[#5a6b56]">3</span>
                        <span className="pl-3 text-rose-400">for</span> (
                        <span className="text-rose-400">let</span> i = 0; i &lt; nums.length; i++) {"{"}
                      </div>
                      <div>
                        <span className="mr-3 text-[#5a6b56]">4</span>
                        <span className="pl-6 text-rose-400">const</span> need = target - nums[i];
                      </div>
                      <div>
                        <span className="mr-3 text-[#5a6b56]">5</span>
                        <span className="pl-6 text-rose-400">if</span> (seen.has(need)){" "}
                        <span className="text-emerald-400">return [seen.get(need), i];</span>
                      </div>
                      <div>
                        <span className="mr-3 text-[#5a6b56]">6</span>
                        <span className="pl-3 text-[#788874]">{"}"}</span>
                      </div>
                      <div>
                        <span className="mr-3 text-[#5a6b56]">7</span>
                        <span className="text-[#788874]">{"}"}</span>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3">
                      <span className="text-[10px] font-mono text-[#788874]">Standard Test Harness</span>
                      <Link
                        to="/problems/1"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#c5ff55] px-3 py-1.5 text-[11px] font-black uppercase text-[#14170f] hover:bg-[#d5ff83] transition"
                      >
                        <CirclePlay size={13} /> Try It Live
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <Link
                to="/problems"
                className={`rounded-xl border p-3 text-center transition ${
                  isNight
                    ? "border-white/10 bg-[#161a14] hover:border-[#c5ff55]/40"
                    : "border-slate-200 bg-white hover:border-emerald-500/40 shadow-xs"
                }`}
              >
                <BookOpen
                  className={`mx-auto ${
                    isNight ? "text-white" : "text-slate-900"
                  }`}
                  size={18}
                />
                <p
                  className={`mt-2 text-xs font-bold ${
                    isNight ? "text-white" : "text-slate-900"
                  }`}
                >
                  Practice
                </p>
                <p
                  className={`mt-1 text-[10px] ${
                    isNight ? "text-[#788874]" : "text-slate-500"
                  }`}
                >
                  Build foundations
                </p>
              </Link>
              <Link
                to="/dashboard"
                className={`rounded-xl border p-3 text-center transition ${
                  isNight
                    ? "border-white/10 bg-[#161a14] hover:border-white/40"
                    : "border-slate-200 bg-white hover:border-slate-400 shadow-xs"
                }`}
              >
                <BarChart3
                  className={`mx-auto ${
                    isNight ? "text-white" : "text-slate-900"
                  }`}
                  size={18}
                />
                <p
                  className={`mt-2 text-xs font-bold ${
                    isNight ? "text-white" : "text-slate-900"
                  }`}
                >
                  Progress
                </p>
                <p
                  className={`mt-1 text-[10px] ${
                    isNight ? "text-[#788874]" : "text-slate-500"
                  }`}
                >
                  See improvement
                </p>
              </Link>
              <Link
                to="/arena"
                className={`rounded-xl border p-3 text-center transition ${
                  isNight
                    ? "border-white/10 bg-[#161a14] hover:border-white/40"
                    : "border-slate-200 bg-white hover:border-slate-400 shadow-xs"
                }`}
              >
                <Swords
                  className={`mx-auto ${
                    isNight ? "text-white" : "text-slate-900"
                  }`}
                  size={18}
                />
                <p
                  className={`mt-2 text-xs font-bold ${
                    isNight ? "text-white" : "text-slate-900"
                  }`}
                >
                  Compete
                </p>
                <p
                  className={`mt-1 text-[10px] ${
                    isNight ? "text-[#788874]" : "text-slate-500"
                  }`}
                >
                  1v1 Code Battle
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Direct Search Bar */}
      <section className="mx-auto max-w-7xl px-5 pt-8 sm:px-8">
        <div
          className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 shadow-xs transition ${
            isNight ? "border-white/10 bg-[#161a14]" : "border-slate-200 bg-white"
          }`}
        >
          <div>
            <p
              className={`text-sm font-bold ${
                isNight ? "text-white" : "text-slate-900"
              }`}
            >
              Ready to test your algorithms?
            </p>
            <p
              className={`mt-1 text-xs ${
                isNight ? "text-[#788874]" : "text-slate-500"
              }`}
            >
              Jump into curated difficulty sets or browse active contests.
            </p>
          </div>
          <Link
            to="/problems"
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              isNight
                ? "border-white/15 bg-white/5 text-white hover:border-[#c5ff55]/40 hover:text-[#c5ff55]"
                : "border-slate-300 bg-white text-slate-800 hover:border-emerald-500 hover:text-emerald-700 shadow-xs"
            }`}
          >
            <Search size={16} /> Find a problem <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Practice Room Problems */}
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <SectionHeading
          isNight={isNight}
          eyebrow="The practice room"
          title="Problems that make you better"
          description="Work through popular algorithmic patterns, from arrays and two pointers to advanced dynamic programming."
          action={
            <Link
              to="/problems"
              className={`inline-flex items-center gap-1 text-sm font-bold hover:underline ${
                isNight ? "text-white" : "text-slate-900"
              }`}
            >
              Browse problem set <ChevronRight size={17} />
            </Link>
          }
        />

        <div
          className={`overflow-hidden rounded-2xl border shadow-sm ${
            isNight ? "border-white/10 bg-[#161a14]" : "border-slate-200 bg-white"
          }`}
        >
          <div
            className={`hidden grid-cols-[64px_minmax(0,1fr)_minmax(150px,0.7fr)_90px_80px] gap-4 border-b px-5 py-3 text-[11px] font-mono font-bold uppercase tracking-wider md:grid ${
              isNight
                ? "border-white/10 bg-[#121610] text-[#788874]"
                : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            <span>#</span>
            <span>Title</span>
            <span>Topics</span>
            <span>Level</span>
            <span className="text-right">Action</span>
          </div>

          {liveProblems.map((problem, index) => (
            <Link
              to={`/problems/${problem.id}`}
              key={problem.id}
              className={`grid gap-2 px-5 py-4 transition md:grid-cols-[64px_minmax(0,1fr)_minmax(150px,0.7fr)_90px_80px] md:items-center md:gap-4 ${
                isNight ? "hover:bg-white/[0.03]" : "hover:bg-slate-50"
              } ${
                index !== liveProblems.length - 1
                  ? isNight
                    ? "border-b border-white/5"
                    : "border-b border-slate-100"
                  : ""
              }`}
            >
              <span
                className={`text-xs font-mono font-bold ${
                  isNight ? "text-[#788874]" : "text-slate-400"
                }`}
              >
                #{problem.id}
              </span>
              <div>
                <p
                  className={`text-sm font-semibold ${
                    isNight ? "text-white" : "text-slate-900"
                  }`}
                >
                  {problem.title}
                </p>
                <p
                  className={`mt-0.5 text-xs line-clamp-1 ${
                    isNight ? "text-[#8f9d8a]" : "text-slate-500"
                  }`}
                >
                  {problem.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {problem.topics.map((topic) => (
                  <span
                    key={topic}
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${
                      isNight
                        ? "border-white/10 bg-white/5 text-[#aab1a1]"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                    }`}
                  >
                    {topic}
                  </span>
                ))}
              </div>
              <span>
                <DifficultyBadge level={problem.level} />
              </span>
              <span
                className={`text-left text-xs font-bold md:text-right ${
                  isNight ? "text-white" : "text-slate-900"
                }`}
              >
                Solve →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Guided Pathways */}
      <section
        className={`border-y ${
          isNight
            ? "border-white/10 bg-[#121610]"
            : "border-slate-200 bg-slate-50/50"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <SectionHeading
            isNight={isNight}
            eyebrow="Learn with direction"
            title="Choose your path"
            description="Structured pathways turn scattered coding practice into verifiable interview and competitive readiness."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {pathways.map(({ number, title, detail, icon: Icon, count, link }) => (
              <Link
                to={link}
                key={title}
                className={`group rounded-2xl border p-5 transition hover:-translate-y-1 sm:p-6 ${
                  isNight
                    ? "border-white/10 bg-[#161a14] hover:border-[#c5ff55]/40 hover:shadow-lg"
                    : "border-slate-200 bg-white hover:border-emerald-500/40 shadow-xs hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                      isNight
                        ? "border-white/15 bg-white/5 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-900"
                    }`}
                  >
                    <Icon size={21} />
                  </div>
                  <span
                    className={`font-mono text-xs ${
                      isNight ? "text-[#788874]" : "text-slate-400"
                    }`}
                  >
                    {number}
                  </span>
                </div>
                <h3
                  className={`mt-5 text-base font-bold transition ${
                    isNight
                      ? "text-white group-hover:text-[#c5ff55]"
                      : "text-slate-900 group-hover:text-emerald-600"
                  }`}
                >
                  {title}
                </h3>
                <p
                  className={`mt-2 min-h-12 text-sm leading-6 ${
                    isNight ? "text-[#8f9d8a]" : "text-slate-600"
                  }`}
                >
                  {detail}
                </p>
                <div
                  className={`mt-5 flex items-center justify-between border-t pt-4 ${
                    isNight ? "border-white/10" : "border-slate-200"
                  }`}
                >
                  <span
                    className={`text-xs font-mono font-medium ${
                      isNight ? "text-[#788874]" : "text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                  <ArrowUpRight
                    size={17}
                    className={`transition ${
                      isNight
                        ? "text-[#788874] group-hover:text-[#c5ff55]"
                        : "text-slate-400 group-hover:text-emerald-600"
                    }`}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Competitive Coding / Live Contests */}
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <SectionHeading
          isNight={isNight}
          eyebrow="Competitive coding"
          title="Practice solo. Prove it in a contest."
          description="Timed challenges give you a way to apply your skills, manage pressure, and climb the platform rankings."
          action={
            <Link
              to="/contests"
              className={`inline-flex items-center gap-1 text-sm font-bold hover:underline ${
                isNight ? "text-white" : "text-slate-900"
              }`}
            >
              View all contests <ChevronRight size={17} />
            </Link>
          }
        />

        <div className="grid gap-4 md:grid-cols-2">
          {liveContests.map((contest) => (
            <div
              key={contest.id || contest.title}
              className={`rounded-2xl border p-5 transition sm:p-6 shadow-xs ${
                isNight
                  ? "border-white/10 bg-[#161a14] hover:border-[#c5ff55]/40"
                  : "border-slate-200 bg-white hover:border-emerald-500/40"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] font-mono font-bold tracking-[0.12em] ${
                    isNight
                      ? "border-[#c5ff55]/30 bg-[#c5ff55]/10 text-[#c5ff55]"
                      : "border-emerald-300 bg-emerald-50 text-emerald-800"
                  }`}
                >
                  {contest.type}
                </span>
                <span
                  className={`text-xs font-mono ${
                    isNight ? "text-[#788874]" : "text-slate-500"
                  }`}
                >
                  {contest.tag}
                </span>
              </div>

              <h3
                className={`mt-4 text-lg font-bold ${
                  isNight ? "text-white" : "text-slate-900"
                }`}
              >
                {contest.title}
              </h3>

              <div
                className={`mt-2 flex gap-3 text-sm font-mono ${
                  isNight ? "text-[#8f9d8a]" : "text-slate-500"
                }`}
              >
                <span>{contest.date}</span>
                <span>·</span>
                <span>{contest.time}</span>
              </div>

              <Link
                to={`/contests/${contest.id || 1}`}
                className={`mt-5 inline-flex items-center gap-2 text-sm font-bold hover:underline ${
                  isNight ? "text-white" : "text-slate-900 font-extrabold"
                }`}
              >
                Contest details <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        className={`border-t transition-colors duration-200 ${
          isNight
            ? "border-white/10 bg-[#0c0f0a] text-[#788874]"
            : "border-slate-200 bg-white text-slate-500"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            <span
              className={`font-bold ${isNight ? "text-white" : "text-slate-900"}`}
            >
              Knight Battle Zone
            </span>
            <span
              className={`mx-2 ${
                isNight ? "text-white/20" : "text-slate-300"
              }`}
            >
              |
            </span>
            Practice with purpose.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <Link
              to="/problems"
              className={isNight ? "hover:text-white" : "hover:text-slate-900"}
            >
              Problems
            </Link>
            <Link
              to="/contests"
              className={isNight ? "hover:text-white" : "hover:text-slate-900"}
            >
              Contests
            </Link>
            <Link
              to="/arena"
              className={isNight ? "hover:text-white" : "hover:text-slate-900"}
            >
              Arena
            </Link>
            <Link
              to="/leaderboard"
              className={isNight ? "hover:text-white" : "hover:text-slate-900"}
            >
              Leaderboard
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
