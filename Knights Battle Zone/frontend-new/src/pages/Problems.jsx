
import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  Check,
  Bookmark,
  Code2,
  ChevronDown,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { problemsApi, submissionsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const problems = [
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    topic: "Array",
    acceptance: "49.2%",
    points: 10,
    solved: true,
  },
  {
    id: 2,
    title: "Valid Parentheses",
    difficulty: "Easy",
    topic: "Stack",
    acceptance: "42.8%",
    points: 10,
    solved: true,
  },
  {
    id: 3,
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    topic: "String",
    acceptance: "34.6%",
    points: 20,
    solved: false,
  },
  {
    id: 4,
    title: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    topic: "Binary Search",
    acceptance: "37.1%",
    points: 40,
    solved: false,
  },
  {
    id: 5,
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    topic: "Array",
    acceptance: "54.3%",
    points: 10,
    solved: false,
  },
  {
    id: 6,
    title: "Merge Intervals",
    difficulty: "Medium",
    topic: "Sorting",
    acceptance: "46.7%",
    points: 20,
    solved: false,
  },
  {
    id: 7,
    title: "Reverse Linked List",
    difficulty: "Easy",
    topic: "Linked List",
    acceptance: "72.5%",
    points: 10,
    solved: false,
  },
  {
    id: 8,
    title: "Trapping Rain Water",
    difficulty: "Hard",
    topic: "Two Pointers",
    acceptance: "61.8%",
    points: 40,
    solved: false,
  },
];

const difficultyStyles = {
  Easy: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
  Medium: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
  Hard: "bg-rose-500/10 text-rose-400 border border-rose-500/30",
};

export default function Problems() {
  const { user, isAuthenticated } = useAuth();
  const { isNight } = useTheme();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [topic, setTopic] = useState("All");
  const [status, setStatus] = useState("All");
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem("kbz_bookmarks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [solvedIds, setSolvedIds] = useState(new Set());
  const [backendProblems, setBackendProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's accepted submissions to accurately flag solved problems
  useEffect(() => {
    if (isAuthenticated) {
      submissionsApi
        .getMySubmissions()
        .then((subs) => {
          if (Array.isArray(subs)) {
            const accepted = new Set(
              subs
                .filter((s) => s.status === "Accepted" || s.status === "ACCEPTED")
                .map((s) => s.problemId)
            );
            setSolvedIds(accepted);
          }
        })
        .catch((e) => console.warn("Could not fetch my submissions for problem set:", e));
    } else {
      setSolvedIds(new Set());
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      setLoading(true);
      problemsApi
        .getProblemSet({
          page: 0,
          size: 100,
          q: search.trim() || undefined,
          difficulty: difficulty !== "All" ? difficulty : undefined,
        })
        .then((data) => {
          if (isMounted && data?.content && data.content.length > 0) {
            const mapped = data.content.map((p) => {
              const diff = p.difficulty
                ? p.difficulty.charAt(0).toUpperCase() + p.difficulty.slice(1).toLowerCase()
                : "Medium";
              return {
                id: p.id,
                title: p.title,
                difficulty: diff,
                topic: diff === "Hard" ? "Dynamic Programming" : diff === "Medium" ? "Algorithms" : "Array & Math",
                acceptance: "51.2%",
                points: p.points || 100,
                solved: solvedIds.has(p.id),
              };
            });
            setBackendProblems(mapped);
          } else if (isMounted && data?.content && data.content.length === 0) {
            setBackendProblems([]);
          }
        })
        .catch((err) => {
          console.warn("Could not fetch backend problems, using fallback", err);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search, difficulty, solvedIds]);

  const problemList = backendProblems.length > 0 ? backendProblems : problems;

  const topics = useMemo(
    () => ["All", ...new Set(problemList.map((problem) => problem.topic))],
    [problemList]
  );

  const filteredProblems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return problemList.filter((problem) => {
      const matchesSearch =
        problem.title.toLowerCase().includes(query) ||
        problem.topic.toLowerCase().includes(query);

      const matchesDifficulty =
        difficulty === "All" ||
        problem.difficulty === difficulty;

      const matchesTopic =
        topic === "All" || problem.topic === topic;

      const matchesStatus =
        status === "All" ||
        (status === "Solved" && problem.solved) ||
        (status === "Unsolved" && !problem.solved) ||
        (status === "Bookmarked" &&
          bookmarks.includes(problem.id));

      return (
        matchesSearch &&
        matchesDifficulty &&
        matchesTopic &&
        matchesStatus
      );
    });
  }, [problemList, search, difficulty, topic, status, bookmarks]);

  const solvedCount = problemList.filter(
    (problem) => problem.solved
  ).length;

  const resetFilters = () => {
    setSearch("");
    setDifficulty("All");
    setTopic("All");
    setStatus("All");
  };

  const toggleBookmark = (id) => {
    setBookmarks((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      try {
        localStorage.setItem("kbz_bookmarks", JSON.stringify(next));
      } catch (e) {
        console.warn("Could not save bookmarks:", e);
      }
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-[#0c0f0a] px-4 pb-12 pt-8 text-[#e0e4dc] sm:px-7 lg:px-10 lg:pt-10">
      <div className="mx-auto max-w-[1400px]">

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col justify-between gap-5 border-b border-white/10 pb-7 md:flex-row md:items-end"
        >
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.19em] text-[#c5ff55]">
              <Code2 size={15} />
              Practice workspace
            </div>

            <h1 className="text-3xl font-black tracking-[-0.055em] text-white sm:text-4xl">
              Problem set
              <span className="text-[#c5ff55]">.</span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#aab1a1]">
              Build consistency, sharpen your logic, and solve
              one problem at a time.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#161a14] px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c5ff55]/10 text-[#c5ff55]">
              <Check size={20} strokeWidth={2.5} />
            </div>

            <div>
              <p className="text-xl font-bold tracking-tight text-white">
                {solvedCount}
                <span className="ml-1 text-sm font-normal text-[#788071]">
                  / {problems.length}
                </span>
              </p>

              <p className="text-xs text-[#aab1a1]">
                Demo problems solved
              </p>
            </div>
          </div>
        </motion.header>

        {/* Progress */}
        <section className="mb-8 grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-[#161a14] p-5 sm:p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#aab1a1]">
                  Practice progress
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                  Keep the momentum.
                </h2>
              </div>

              <span className="rounded-lg bg-[#c5ff55]/10 border border-[#c5ff55]/20 px-3 py-1.5 text-sm font-black text-[#c5ff55]">
                {Math.round(
                  (solvedCount / problems.length) * 100
                )}%
              </span>
            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-black/40 border border-white/10">
              <div
                className="h-full rounded-full bg-[#c5ff55] transition-all shadow-sm shadow-[#c5ff55]/50"
                style={{
                  width: `${
                    (solvedCount / problems.length) * 100
                  }%`,
                }}
              />
            </div>

            <p className="mt-3 text-xs text-[#788071]">
              Illustrative progress from the sample problem list.
            </p>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#121610] p-5 text-white sm:p-6 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c5ff55]">
                Your next step
              </p>

              <h2 className="mt-3 text-xl font-black tracking-tight text-white">
                One more problem.
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#aab1a1]">
                Pick a challenge and understand the approach
                before coding.
              </p>
            </div>

            <Link
              to="/dashboard"
              className="mt-5 inline-flex w-fit items-center gap-2 text-sm font-bold text-[#c5ff55] hover:text-[#d5ff83] transition"
            >
              View dashboard
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>

        {/* Problems and filters */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#161a14] shadow-sm">
          <div className="border-b border-white/10 p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white">
                  All problems
                </h2>

                <p className="mt-1 text-xs text-[#788071]">
                  {filteredProblems.length} of {problems.length}{" "}
                  sample problems
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {/* Search */}
                <div className="relative min-w-0 sm:w-64">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#788071]"
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search problems or topics"
                    aria-label="Search problems or topics"
                    className="w-full rounded-lg border border-white/15 bg-black/40 py-2.5 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-[#788071] focus:border-[#c5ff55]"
                  />
                </div>

                {/* Difficulty filter */}
                <label className="relative">
                  <SlidersHorizontal
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#788071]"
                  />

                  <select
                    value={difficulty}
                    onChange={(event) =>
                      setDifficulty(event.target.value)
                    }
                    aria-label="Filter by difficulty"
                    className="w-full appearance-none rounded-lg border border-white/15 bg-[#121610] text-white py-2.5 pl-9 pr-9 text-sm outline-none focus:border-[#c5ff55] sm:w-auto"
                  >
                    <option value="All" className="bg-[#161a14] text-white">All difficulties</option>
                    <option value="Easy" className="bg-[#161a14] text-white">Easy</option>
                    <option value="Medium" className="bg-[#161a14] text-white">Medium</option>
                    <option value="Hard" className="bg-[#161a14] text-white">Hard</option>
                  </select>

                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#788071]"
                  />
                </label>

                {/* Topic filter */}
                <label className="relative">
                  <select
                    value={topic}
                    onChange={(event) =>
                      setTopic(event.target.value)
                    }
                    aria-label="Filter by topic"
                    className="w-full appearance-none rounded-lg border border-white/15 bg-[#121610] text-white py-2.5 pl-3 pr-9 text-sm outline-none focus:border-[#c5ff55] sm:w-auto"
                  >
                    {topics.map((item) => (
                      <option key={item} value={item} className="bg-[#161a14] text-white">
                        {item === "All" ? "All topics" : item}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#788071]"
                  />
                </label>
              </div>
            </div>

            {/* Status filters */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {["All", "Solved", "Unsolved", "Bookmarked"].map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setStatus(item)}
                    aria-pressed={status === item}
                    className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                      status === item
                        ? "bg-[#c5ff55] text-[#14170f] font-black"
                        : "bg-white/5 border border-white/10 text-[#aab1a1] hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {item}
                    {item === "Bookmarked" &&
                    bookmarks.length > 0
                      ? ` (${bookmarks.length})`
                      : ""}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={resetFilters}
                className={`ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  isNight ? "text-[#788071] hover:text-[#c5ff55]" : "text-slate-500 hover:text-emerald-700"
                }`}
              >
                <RotateCcw size={13} />
                Reset filters
              </button>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-[#121610] text-[10px] font-semibold uppercase tracking-[0.14em] text-[#788071] border-b border-white/10">
                <tr>
                  <th className="w-14 px-5 py-4">Status</th>
                  <th className="px-3 py-4">Problem</th>
                  <th className="px-3 py-4">Difficulty</th>
                  <th className="px-3 py-4">Topic</th>
                  <th className="px-3 py-4">Acceptance</th>
                  <th className="px-3 py-4 text-right">Points</th>
                  <th className="w-14 px-5 py-4">
                    <span className="sr-only">Bookmark</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {filteredProblems.map((problem, index) => {
                  const isBookmarked = bookmarks.includes(
                    problem.id
                  );

                  return (
                    <motion.tr
                      key={problem.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.025 }}
                      className="group transition hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-4">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            problem.solved
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "border border-white/10 text-transparent"
                          }`}
                        >
                          {problem.solved && <Check size={13} />}
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <Link
                          to={`/problems/${problem.id}`}
                          className={`font-semibold transition ${
                            isNight
                              ? "text-white group-hover:text-[#c5ff55] hover:text-[#c5ff55]"
                              : "text-slate-900 group-hover:text-emerald-700 hover:text-emerald-700"
                          }`}
                        >
                          {problem.title}
                        </Link>

                        <div className="mt-1 text-[11px] text-[#788071]">
                          KN-{String(problem.id).padStart(3, "0")}
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${difficultyStyles[problem.difficulty]}`}
                        >
                          {problem.difficulty}
                        </span>
                      </td>

                      <td className="px-3 py-4 text-sm text-[#aab1a1]">
                        {problem.topic}
                      </td>

                      <td className="px-3 py-4 text-sm tabular-nums text-[#aab1a1]">
                        {problem.acceptance}
                      </td>

                      <td className="px-3 py-4 text-right text-sm font-semibold tabular-nums text-white">
                        {problem.points}
                        <span className="ml-1 text-[10px] font-normal text-[#788071]">
                          pts
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            toggleBookmark(problem.id)
                          }
                          aria-label={
                            isBookmarked
                              ? `Remove bookmark for ${problem.title}`
                              : `Bookmark ${problem.title}`
                          }
                          aria-pressed={isBookmarked}
                          className={`rounded-md p-2 transition ${
                            isBookmarked
                              ? "bg-[#c5ff55]/10 text-[#c5ff55]"
                              : "text-[#788071] hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <Bookmark
                            size={16}
                            fill={
                              isBookmarked
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="divide-y divide-white/5 md:hidden">
            {filteredProblems.map((problem) => {
              const isBookmarked = bookmarks.includes(
                problem.id
              );

              return (
                <div key={problem.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        problem.solved
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "border border-white/10"
                      }`}
                    >
                      {problem.solved && <Check size={13} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/problems/${problem.id}`}
                        className={`font-semibold transition ${
                          isNight
                            ? "text-white hover:text-[#c5ff55]"
                            : "text-slate-900 hover:text-emerald-700"
                        }`}
                      >
                        {problem.title}
                      </Link>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-1 text-[11px] font-semibold ${difficultyStyles[problem.difficulty]}`}
                        >
                          {problem.difficulty}
                        </span>

                        <span className="text-xs text-[#aab1a1]">
                          {problem.topic}
                        </span>

                        <span className="text-xs text-[#aab1a1]">
                          {problem.points} pts
                        </span>
                      </div>

                      <p className="mt-2 text-[11px] text-[#788071]">
                        KN-{String(problem.id).padStart(3, "0")} ·
                        Acceptance {problem.acceptance}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        toggleBookmark(problem.id)
                      }
                      aria-label={
                        isBookmarked
                          ? `Remove bookmark for ${problem.title}`
                          : `Bookmark ${problem.title}`
                      }
                      aria-pressed={isBookmarked}
                      className={`rounded-md p-2 transition ${
                        isBookmarked
                          ? "text-[#c5ff55]"
                          : "text-[#788071] hover:text-white"
                      }`}
                    >
                      <Bookmark
                        size={17}
                        fill={
                          isBookmarked
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {filteredProblems.length === 0 && (
            <div className="px-6 py-16 text-center">
              <Search
                className="mx-auto text-[#788071]"
                size={28}
              />

              <h3 className="mt-4 font-bold text-white">
                No problems found
              </h3>

              <p className="mt-1 text-sm text-[#aab1a1]">
                Try another search or reset your filters.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-lg bg-[#c5ff55] px-4 py-2 text-xs font-black uppercase text-[#14170f] hover:bg-[#d5ff83] transition"
              >
                Clear filters
              </button>
            </div>
          )}

          <div className="border-t border-white/10 bg-[#121610] px-5 py-3 text-xs text-[#788071]">
            Sample problem data · Submission checking and code
            execution are not connected yet.
          </div>
        </section>

        <footer className="mt-6 flex flex-col justify-between gap-2 text-xs text-[#788071] sm:flex-row">
          <span>KNIGHTZONE / PRACTICE</span>
          <span>Progress starts with the next problem.</span>
        </footer>
      </div>
    </main>
  );
}
