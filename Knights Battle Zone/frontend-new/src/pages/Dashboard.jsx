import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Code2,
  Swords,
  Trophy,
  Flame,
  Target,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Loader2,
  HelpCircle,
  Users,
  Keyboard,
  Briefcase,
  Check,
  Zap,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { dashboardApi, placementApi, contestsApi } from "../services/api";
import { RankBadge, TrophyIllustration } from "../components/svg";

const DEFAULT_TOPICS = [
  { name: "Data Structures", mastery: 45, color: "bg-indigo-500" },
  { name: "Algorithms", mastery: 38, color: "bg-emerald-500" },
  { name: "System Design", mastery: 25, color: "bg-amber-500" },
  { name: "Database", mastery: 35, color: "bg-blue-500" },
  { name: "OOP Concepts", mastery: 50, color: "bg-purple-500" },
];

const INITIAL_GOALS = [
  { id: "solve_prob", label: "Solve at least 1 algorithmic problem" },
  { id: "medium_hard", label: "Attempt a Medium or Hard problem" },
  { id: "typing_test", label: "Test typing velocity in Speed Typing" },
  { id: "arena_duel", label: "Compete in a 1v1 Battle Arena duel" },
];

export default function DashboardPage() {
  const { user, role, isAdmin } = useAuth();
  const { isNight } = useTheme();
  const [summary, setSummary] = useState(null);
  const [topics, setTopics] = useState(DEFAULT_TOPICS);
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Daily goals stored in localStorage for today
  const todayKey = `kbz_goals_${new Date().toISOString().slice(0, 10)}`;
  const [completedGoals, setCompletedGoals] = useState(() => {
    try {
      const saved = localStorage.getItem(todayKey);
      return saved ? JSON.parse(saved) : ["solve_prob"];
    } catch {
      return ["solve_prob"];
    }
  });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.allSettled([
      dashboardApi.getSummary(),
      placementApi.getReadiness(),
      contestsApi.getAll(0, 6),
    ])
      .then(([summaryRes, readinessRes, contestsRes]) => {
        if (!isMounted) return;

        // 1. Dashboard summary
        if (summaryRes.status === "fulfilled" && summaryRes.value) {
          setSummary(summaryRes.value);
        }

        // 2. Real Topic Readiness from placement API
        if (readinessRes.status === "fulfilled" && readinessRes.value?.topics) {
          const colors = [
            "bg-indigo-500",
            "bg-emerald-500",
            "bg-amber-500",
            "bg-blue-500",
            "bg-purple-500",
          ];
          const mappedTopics = readinessRes.value.topics.map((t, idx) => ({
            name: t.name,
            mastery: t.mastery ?? 40,
            color: colors[idx % colors.length],
          }));
          setTopics(mappedTopics);
        }

        // 3. Live Contests
        if (contestsRes.status === "fulfilled" && contestsRes.value) {
          const list = Array.isArray(contestsRes.value)
            ? contestsRes.value
            : contestsRes.value.content || [];
          const now = new Date();
          const upcoming = list
            .filter((c) => {
              const end = c.endTime ? new Date(c.endTime) : new Date(now.getTime() + 86400000);
              return end >= now;
            })
            .slice(0, 2)
            .map((c) => {
              const start = c.startTime ? new Date(c.startTime) : now;
              return {
                id: c.id,
                title: c.title || "Weekly Contest Challenge",
                date: start.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
                time: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                type: c.durationMinutes && c.durationMinutes <= 60 ? "Speed Contest" : "Rated Championship",
              };
            });
          setUpcomingContests(upcoming);
        }
      })
      .catch((err) => {
        console.warn("Dashboard data fetch issue:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleGoal = (goalId) => {
    setCompletedGoals((prev) => {
      const next = prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId];
      try {
        localStorage.setItem(todayKey, JSON.stringify(next));
      } catch (e) {
        console.warn("Could not save daily goals:", e);
      }
      return next;
    });
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "Knight";
  const currentRating = summary?.currentRating ?? 1000;

  const liveStats = [
    {
      icon: Code2,
      label: "Problems Solved",
      value: summary?.problemsSolved ?? 0,
      change: "All-time solved",
      color: "bg-white/5 text-[#c5ff55] border border-white/10",
    },
    {
      icon: Target,
      label: "Knight Rating",
      value: currentRating,
      change: "Platform rating",
      color: "bg-white/5 text-[#c5ff55] border border-white/10",
    },
    {
      icon: Swords,
      label: "Contests Joined",
      value: summary?.contestsParticipated ?? 0,
      change: `${summary?.upcomingContests ?? upcomingContests.length} upcoming`,
      color: "bg-white/5 text-[#c5ff55] border border-white/10",
    },
    {
      icon: Trophy,
      label: "Global Rank",
      value: summary?.globalRank ? `#${summary.globalRank}` : "#1",
      change: "Global leaderboard",
      color: "bg-white/5 text-[#c5ff55] border border-white/10",
    },
  ];

  const recentSubmissions = summary?.recentSubmissions || [];

  return (
    <main className="min-h-screen bg-[#0c0f0a] text-[#e0e4dc] pb-16">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* Header */}
        <header className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c5ff55]/20 bg-[#c5ff55]/[0.06] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#c5ff55]">
                <Zap size={12} />
                Knight Dashboard
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                  isAdmin
                    ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                    : "bg-[#c5ff55]/10 text-[#c5ff55] border-[#c5ff55]/30"
                }`}
              >
                {role}
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-black text-white tracking-tight sm:text-3xl">
              Welcome back, {displayName} 👋
            </h1>

            <p className="mt-1 text-sm text-[#aab1a1]">
              {isAdmin
                ? "Admin mode active • Manage problems, contests, and monitor community progress."
                : "Your training arena is live. Practice algorithms and level up your knight rank."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/problems"
              className="inline-flex items-center gap-2 rounded-xl bg-[#c5ff55] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#14170f] shadow-md shadow-[#c5ff55]/20 transition hover:bg-[#d5ff83]"
            >
              <Code2 size={16} />
              Solve a problem
            </Link>

            <Link
              to="/arena"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-white/10"
            >
              <Swords size={16} className="text-[#c5ff55]" />
              Join battle
            </Link>
          </div>
        </header>

        {/* Knight Rank Tier Progress */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <RankBadge rating={currentRating} className="w-16 h-16 shrink-0" />
              <div>
                <p className="text-base font-bold text-white">
                  Knight Rank & Progress
                </p>
                <p className="text-xs text-[#aab1a1] mt-0.5">
                  Current Rating: <span className="font-bold text-[#c5ff55]">{currentRating} Elo</span> •{" "}
                  {currentRating < 1200
                    ? "Novice Knight (Next Rank: Guardian at 1200)"
                    : currentRating < 1400
                    ? "Guardian Knight (Next Rank: Champion at 1400)"
                    : currentRating < 1600
                    ? "Champion Knight (Next Rank: Master at 1600)"
                    : "Grandmaster Knight"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-bold text-white">Rank Progress</span>
                <p className="text-xs text-[#788071]">
                  {Math.min(100, Math.round(((currentRating % 200) / 200) * 100))}% to next tier
                </p>
              </div>
              <div className="w-32 h-2.5 rounded-full bg-black/40 border border-white/10 overflow-hidden">
                <div
                  className="h-full bg-[#c5ff55] rounded-full transition-all duration-500 shadow-sm shadow-[#c5ff55]/50"
                  style={{ width: `${Math.min(100, Math.round(((currentRating % 200) / 200) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Live Stats Grid */}
        <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {liveStats.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.label}
                className="rounded-3xl border border-white/10 bg-[#161a14] p-5 shadow-sm hover:border-[#c5ff55]/40 hover:shadow-lg hover:shadow-[#c5ff55]/5 transition"
              >
                <div className="flex items-center justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${st.color}`}>
                    <Icon size={20} />
                  </div>
                  <span className="text-[11px] font-semibold text-[#788071]">
                    {st.change}
                  </span>
                </div>
                <p className="mt-4 text-2xl sm:text-3xl font-black text-white">
                  {st.value}
                </p>
                <p className="mt-1 text-xs font-semibold text-[#aab1a1]">
                  {st.label}
                </p>
              </div>
            );
          })}
        </section>

        {/* Quick Access Modules Navigation */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-white">
                Training & Community Hubs
              </h2>
              <p className="text-xs text-[#aab1a1] mt-0.5">
                Practice specific skill sets, join clubs, or test typing velocity
              </p>
            </div>
            <span className="text-xs font-bold text-[#c5ff55]">All Modules Ready</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/quizzes"
              className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#121610] p-4 transition hover:border-[#c5ff55]/40 hover:bg-[#161a14]"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#c5ff55] mb-3 group-hover:scale-105 transition">
                  <HelpCircle size={20} />
                </div>
                <h3
                  className={`text-sm font-bold transition ${
                    isNight
                      ? "text-white group-hover:text-[#c5ff55]"
                      : "text-slate-900 group-hover:text-emerald-700"
                  }`}
                >
                  Coding Quizzes
                </h3>
                <p className="text-xs text-[#aab1a1] mt-1 line-clamp-2">
                  Timed multiple-choice tests on core CS, Java, C++, and DSA concepts.
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#c5ff55]">
                Take Quiz <ArrowRight size={13} />
              </span>
            </Link>

            <Link
              to="/clubs"
              className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#121610] p-4 transition hover:border-[#c5ff55]/40 hover:bg-[#161a14]"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#c5ff55] mb-3 group-hover:scale-105 transition">
                  <Users size={20} />
                </div>
                <h3
                  className={`text-sm font-bold transition ${
                    isNight
                      ? "text-white group-hover:text-[#c5ff55]"
                      : "text-slate-900 group-hover:text-emerald-700"
                  }`}
                >
                  Knights Guilds
                </h3>
                <p className="text-xs text-[#aab1a1] mt-1 line-clamp-2">
                  Form coding squads, share editorials, and compete in guild rankings.
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#c5ff55]">
                Explore Clubs <ArrowRight size={13} />
              </span>
            </Link>

            <Link
              to="/typing"
              className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#121610] p-4 transition hover:border-[#c5ff55]/40 hover:bg-[#161a14]"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#c5ff55] mb-3 group-hover:scale-105 transition">
                  <Keyboard size={20} />
                </div>
                <h3
                  className={`text-sm font-bold transition ${
                    isNight
                      ? "text-white group-hover:text-[#c5ff55]"
                      : "text-slate-900 group-hover:text-emerald-700"
                  }`}
                >
                  Speed Typing
                </h3>
                <p className="text-xs text-[#aab1a1] mt-1 line-clamp-2">
                  High-velocity keystroke benchmarks on real programming snippets.
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#c5ff55]">
                Start Test <ArrowRight size={13} />
              </span>
            </Link>

            <Link
              to="/jobs"
              className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#121610] p-4 transition hover:border-[#c5ff55]/40 hover:bg-[#161a14]"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#c5ff55] mb-3 group-hover:scale-105 transition">
                  <Briefcase size={20} />
                </div>
                <h3
                  className={`text-sm font-bold transition ${
                    isNight
                      ? "text-white group-hover:text-[#c5ff55]"
                      : "text-slate-900 group-hover:text-emerald-700"
                  }`}
                >
                  Career Drives
                </h3>
                <p className="text-xs text-[#aab1a1] mt-1 line-clamp-2">
                  Direct hiring pipelines, internships, and engineering job openings.
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#c5ff55]">
                View Openings <ArrowRight size={13} />
              </span>
            </Link>
          </div>
        </section>

        {/* Main Grid: Recent Submissions on Left, Topic & Goals on Right */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Recent Submissions */}
          <div className="rounded-3xl border border-white/10 bg-[#161a14] shadow-sm">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div>
                <h2 className="text-lg font-bold text-white">Recent Submissions</h2>
                <p className="mt-0.5 text-xs text-[#aab1a1]">
                  Your official evaluations from the competitive judge
                </p>
              </div>

              <Link
                to="/problems"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c5ff55] hover:text-[#d5ff83]"
              >
                Browse problems
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="divide-y divide-white/5">
              {recentSubmissions.length === 0 ? (
                <div className="p-10 text-center">
                  <Code2 className="mx-auto h-10 w-10 text-[#788071] mb-2" />
                  <p className="text-sm font-semibold text-white">
                    No submissions recorded yet
                  </p>
                  <p className="text-xs text-[#aab1a1] mt-1 max-w-xs mx-auto">
                    Jump into the practice room or battle arena to register your first code evaluation!
                  </p>
                  <Link
                    to="/problems"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#c5ff55] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#14170f] hover:bg-[#d5ff83] transition"
                  >
                    Solve First Challenge <ArrowRight size={13} />
                  </Link>
                </div>
              ) : (
                recentSubmissions.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between hover:bg-white/[0.02] transition"
                  >
                    <div>
                      <p className="font-semibold text-white text-sm">
                        {s.problemTitle || `Problem #${s.problemId || "1"}`}
                      </p>
                      <p className="mt-0.5 text-xs text-[#788071]">
                        {s.language || "Java"} • {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString([], { month: "short", day: "numeric" }) : "Recent"}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                        s.status === "Accepted" || s.status === "ACCEPTED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : s.status === "Wrong Answer"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {s.status === "Accepted" || s.status === "ACCEPTED" ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <XCircle size={13} />
                      )}
                      {s.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Topic Mastery & Interactive Daily Goals */}
          <div className="space-y-6">
            {/* Topic Mastery */}
            <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Topic Mastery</h2>
                  <p className="text-xs text-[#aab1a1] mt-0.5">Calculated from your verified solved sets</p>
                </div>
                <TrendingUp size={18} className="text-[#c5ff55]" />
              </div>

              <div className="mt-5 space-y-4">
                {topics.map((t) => (
                  <div key={t.name}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{t.name}</span>
                      <span className="font-mono text-[#aab1a1]">{t.mastery}%</span>
                    </div>

                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-black/40 border border-white/10">
                      <div
                        className={`h-full rounded-full ${t.color || "bg-[#c5ff55]"} transition-all duration-500`}
                        style={{ width: `${t.mastery}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Daily Goals */}
            <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Today's Goals</h2>
                  <p className="text-xs text-[#aab1a1] mt-0.5">
                    {completedGoals.length} of {INITIAL_GOALS.length} completed
                  </p>
                </div>
                <Target size={18} className="text-[#c5ff55]" />
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/40 border border-white/10">
                <div
                  className="h-full bg-[#c5ff55] rounded-full transition-all duration-300"
                  style={{ width: `${(completedGoals.length / INITIAL_GOALS.length) * 100}%` }}
                />
              </div>

              <ul className="mt-4 space-y-2.5">
                {INITIAL_GOALS.map((goal) => {
                  const isDone = completedGoals.includes(goal.id);

                  return (
                    <li
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={`cursor-pointer flex items-center gap-3 rounded-2xl border p-3 transition ${
                        isDone
                          ? "border-[#c5ff55]/30 bg-[#c5ff55]/[0.06] text-[#788071]"
                          : "border-white/10 bg-[#121610] hover:border-white/20 text-[#e0e4dc]"
                      }`}
                    >
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-lg text-xs ${
                          isDone
                            ? "bg-[#c5ff55] text-[#14170f]"
                            : "border border-white/20 bg-black/40 text-transparent"
                        }`}
                      >
                        <Check size={12} />
                      </span>

                      <span className={`text-xs font-semibold ${isDone ? "line-through text-[#788071]" : "text-white"}`}>
                        {goal.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        {/* Live Upcoming Contests Preview */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-[#161a14] shadow-sm">
          <div className="flex items-center justify-between border-b border-white/10 p-6">
            <div>
              <h2 className="text-lg font-bold text-white">Upcoming Contests</h2>
              <p className="mt-0.5 text-xs text-[#aab1a1]">
                Live tournaments scheduled on Knights Battle Zone
              </p>
            </div>

            <Link
              to="/contests"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c5ff55] hover:text-[#d5ff83]"
            >
              All contests
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="p-6">
            {upcomingContests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-xs text-[#aab1a1]">
                No active tournaments scheduled right now. Check back soon or practice in the battle arena!
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {upcomingContests.map((contest) => (
                  <article
                    key={contest.id}
                    className="rounded-2xl border border-white/10 bg-[#121610] p-5 transition hover:border-[#c5ff55]/40 hover:bg-[#161a14]"
                  >
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c5ff55]/20 bg-[#c5ff55]/[0.06] px-3 py-1 text-xs font-semibold text-[#c5ff55]">
                      <CalendarDays size={13} />
                      {contest.type}
                    </span>

                    <h3 className="mt-3 font-bold text-white text-base">
                      {contest.title}
                    </h3>

                    <p className="mt-1.5 flex items-center gap-2 text-xs text-[#aab1a1]">
                      <Clock size={13} />
                      {contest.date} • {contest.time}
                    </p>

                    <Link
                      to={`/contests/${contest.id}`}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#c5ff55] hover:text-[#d5ff83]"
                    >
                      Enter Contest
                      <ArrowRight size={13} />
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}