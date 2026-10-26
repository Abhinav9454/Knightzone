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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { dashboardApi } from "../services/api";

const stats = [
  {
    icon: Code2,
    label: "Problems Solved",
    value: "148",
    change: "+12 this week",
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: Target,
    label: "Accuracy",
    value: "78%",
    change: "+4% this month",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Swords,
    label: "Battles Won",
    value: "23",
    change: "+3 this week",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Flame,
    label: "Current Streak",
    value: "9 days",
    change: "Keep it going",
    color: "bg-rose-50 text-rose-600",
  },
];

const topicProgress = [
  { topic: "Arrays", progress: 86, color: "bg-indigo-500" },
  { topic: "Strings", progress: 72, color: "bg-indigo-500" },
  { topic: "Hashing", progress: 64, color: "bg-indigo-500" },
  { topic: "Trees", progress: 48, color: "bg-amber-500" },
  { topic: "Graphs", progress: 36, color: "bg-amber-500" },
  { topic: "Dynamic Programming", progress: 22, color: "bg-rose-500" },
];

const recentSubmissions = [
  {
    id: 1,
    problem: "Two Sum",
    difficulty: "Easy",
    status: "Accepted",
    language: "JavaScript",
    time: "12 min ago",
  },
  {
    id: 2,
    problem: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    status: "Wrong Answer",
    language: "C++",
    time: "1 hour ago",
  },
  {
    id: 3,
    problem: "Binary Tree Level Order Traversal",
    difficulty: "Medium",
    status: "Accepted",
    language: "Python",
    time: "3 hours ago",
  },
  {
    id: 4,
    problem: "Course Schedule",
    difficulty: "Hard",
    status: "Time Limit Exceeded",
    language: "Java",
    time: "Yesterday",
  },
];

const upcomingContests = [
  {
    id: 1,
    title: "Weekly Coding Challenge",
    date: "Oct 20, 2026",
    time: "8:00 PM",
    type: "Individual",
  },
  {
    id: 2,
    title: "Campus Championship",
    date: "Oct 24, 2026",
    time: "10:00 AM",
    type: "Team Battle",
  },
];

const dailyGoals = [
  { label: "Solve 3 problems", completed: true },
  { label: "Attempt one medium problem", completed: true },
  { label: "Review one failed submission", completed: false },
  { label: "Join a practice duel", completed: false },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    dashboardApi
      .getSummary()
      .then((data) => {
        if (isMounted) setSummary(data);
      })
      .catch((err) => {
        console.warn("Could not load live dashboard summary", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = user?.name || user?.email?.split("@")[0] || "Knight";
  const liveStats = [
    {
      icon: Code2,
      label: "Problems Solved",
      value: summary?.problemsSolved ?? 0,
      change: "All-time solved",
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      icon: Target,
      label: "Rating",
      value: summary?.currentRating ?? 1000,
      change: "Platform rating",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: Swords,
      label: "Contests Joined",
      value: summary?.contestsParticipated ?? 0,
      change: `${summary?.upcomingContests ?? 0} upcoming`,
      color: "bg-amber-50 text-amber-600",
    },
    {
      icon: Trophy,
      label: "Global Rank",
      value: summary?.globalRank ? `#${summary.globalRank}` : "#1",
      change: "Global leaderboard",
      color: "bg-rose-50 text-rose-600",
    },
  ];

  const submissionsToDisplay =
    summary?.recentSubmissions && summary.recentSubmissions.length > 0
      ? summary.recentSubmissions.map((s) => ({
          id: s.id,
          problem: s.problemTitle || "Problem",
          difficulty: "Easy",
          status: s.status || "Accepted",
          language: s.language || "Java",
          time: s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "Recent",
        }))
      : recentSubmissions;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* Header */}
        <header className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Dashboard
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back, {displayName} 👋
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              You are 120 XP away from reaching Platinum Knight.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/problems"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              <Code2 size={17} />
              Solve a problem
            </Link>

            <Link
              to="/arena"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Swords size={17} />
              Join battle
            </Link>
          </div>
        </header>

        {/* XP progress */}
        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Knight Rank Progress
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Gold Knight • 2,480 / 2,600 XP
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-600">
              <Trophy size={15} />
              120 XP to Platinum
            </span>
          </div>

          <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400"
              style={{ width: "78%" }}
            />
          </div>
        </section>

        {/* KPI cards */}
        <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {liveStats.map(({ icon: Icon, label, value, change, color }) => (
            <article
              key={label}
              className="rounded-3xl border border-slate-200 bg-white p-6"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${color}`}
              >
                <Icon size={20} />
              </div>

              <p className="mt-5 text-xs font-medium uppercase tracking-wider text-slate-500">
                {label}
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {value}
              </p>

              <p className="mt-1 text-xs text-slate-500">{change}</p>
            </article>
          ))}
        </section>

        {/* Main grid */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Recent submissions */}
          <div className="rounded-3xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h2 className="text-lg font-semibold">Recent submissions</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your latest coding activity
                </p>
              </div>

              <Link
                to="/problems"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600"
              >
                View all
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {submissionsToDisplay.map((submission) => (
                <div
                  key={submission.id}
                  className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {submission.problem}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {submission.language} • {submission.difficulty} •{" "}
                      {submission.time}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      submission.status === "Accepted"
                        ? "bg-emerald-50 text-emerald-600"
                        : submission.status === "Wrong Answer"
                        ? "bg-rose-50 text-rose-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {submission.status === "Accepted" ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <XCircle size={14} />
                    )}
                    {submission.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Topic strength */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Topic strength</h2>
                <TrendingUp size={18} className="text-indigo-500" />
              </div>

              <div className="mt-6 space-y-5">
                {topicProgress.map((topic) => (
                  <div key={topic.topic}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        {topic.topic}
                      </span>
                      <span className="text-slate-500">
                        {topic.progress}%
                      </span>
                    </div>

                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${topic.color}`}
                        style={{ width: `${topic.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily goals */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Today’s goals</h2>
                <Target size={18} className="text-indigo-500" />
              </div>

              <ul className="mt-5 space-y-3">
                {dailyGoals.map((goal) => (
                  <li
                    key={goal.label}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3"
                  >
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full ${
                        goal.completed
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <CheckCircle2 size={15} />
                    </span>

                    <span
                      className={`text-sm ${
                        goal.completed
                          ? "text-slate-400 line-through"
                          : "text-slate-700"
                      }`}
                    >
                      {goal.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Upcoming contests */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 p-6">
            <div>
              <h2 className="text-lg font-semibold">Upcoming contests</h2>
              <p className="mt-1 text-sm text-slate-500">
                Register early and prepare with practice sets
              </p>
            </div>

            <Link
              to="/contests"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600"
            >
              All contests
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            {upcomingContests.map((contest) => (
              <article
                key={contest.id}
                className="rounded-2xl border border-slate-200 p-5 transition hover:border-indigo-200 hover:bg-indigo-50/40"
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                  <CalendarDays size={14} />
                  {contest.type}
                </span>

                <h3 className="mt-4 font-semibold text-slate-900">
                  {contest.title}
                </h3>

                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <Clock size={15} />
                  {contest.date} • {contest.time}
                </p>

                <Link
                  to="/contests"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600"
                >
                  Register now
                  <ArrowRight size={15} />
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}