import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  CalendarDays,
  Clock3,
  Code2,
  ArrowRight,
  Users,
  CircleCheck,
  Circle,
  Medal,
  Loader2,
} from "lucide-react";
import { contestsApi } from "../services/api";
import { TrophyIllustration } from "../components/svg";

const contests = [
  {
    id: 1,
    name: "Weekly Coding Challenge",
    code: "KZ-001",
    type: "Weekly Contest",
    date: "Sun, Oct 25, 2026",
    startTime: "8:00 PM",
    duration: "90 minutes",
    problems: 4,
    level: "All levels",
    status: "Upcoming",
    description:
      "A balanced contest covering arrays, strings, hashing, and basic graph concepts.",
  },
  {
    id: 2,
    name: "Placement Preparation Round",
    code: "KZ-002",
    type: "Rated Contest",
    date: "Sun, Nov 01, 2026",
    startTime: "9:00 PM",
    duration: "120 minutes",
    problems: 5,
    level: "Intermediate",
    status: "Upcoming",
    description:
      "Practice frequently asked interview-style problems and improve your speed under time pressure.",
  },
  {
    id: 3,
    name: "Campus Battle Royale",
    code: "KZ-003",
    type: "College Contest",
    date: "Sun, Nov 08, 2026",
    startTime: "6:00 PM",
    duration: "2 hours",
    problems: 6,
    level: "All levels",
    status: "Upcoming",
    description:
      "Represent your college in a live multi-round coding championship.",
  },
];

const pastContests = [
  {
    id: 101,
    name: "Foundations Sprint",
    date: "Oct 04, 2026",
    duration: "90 minutes",
    problems: 3,
    participants: "1,240",
    status: "Completed",
  },
  {
    id: 102,
    name: "September Endgame",
    date: "Sep 27, 2026",
    duration: "120 minutes",
    problems: 5,
    participants: "2,180",
    status: "Completed",
  },
  {
    id: 103,
    name: "Algorithm Sprint",
    date: "Sep 20, 2026",
    duration: "60 minutes",
    problems: 3,
    participants: "980",
    status: "Completed",
  },
];

const myContests = [
  {
    id: 201,
    name: "Weekly Coding Challenge",
    date: "Oct 25, 2026",
    status: "Registered",
  },
  {
    id: 202,
    name: "Foundations Sprint",
    date: "Oct 04, 2026",
    status: "Completed",
  },
];

const TABS = ["Upcoming", "Past", "My Contests"];

export default function Contests() {
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [backendContests, setBackendContests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    contestsApi
      .getAll(0, 50)
      .then((data) => {
        if (isMounted && data?.content && data.content.length > 0) {
          const mapped = data.content.map((c) => ({
            id: c.id,
            name: c.title,
            code: `KZ-00${c.id}`,
            type: "Live Contest",
            date: c.startTime ? new Date(c.startTime).toLocaleDateString() : "Upcoming",
            startTime: c.startTime
              ? new Date(c.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "8:00 PM",
            duration: `${c.durationMinutes || 90} minutes`,
            problems: 3,
            level: "All levels",
            status: new Date(c.endTime) > new Date() ? "Upcoming" : "Completed",
            description: c.description || "Timed algorithm competition on Knights Battle Zone.",
          }));
          setBackendContests(mapped);
        }
      })
      .catch((err) => {
        console.warn("Could not load backend contests, using default", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const contestList = backendContests.length > 0 ? backendContests : contests;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        {/* Header */}
        <header className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-9">
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-600">
                <Trophy size={14} />
                Contest Arena
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Compete. Improve.
                <span className="block text-indigo-600">Get ranked.</span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                Join timed coding contests, solve real algorithmic challenges,
                earn XP, and climb the Knight Battle Zone leaderboard.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <TrophyIllustration className="hidden sm:block w-28 h-28 shrink-0 drop-shadow-md" />
              <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:w-72">
                {[
                  { label: "Upcoming", value: contestList.length },
                  { label: "Problems", value: "15+" },
                  { label: "Format", value: "Timed" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3 sm:p-4 text-center"
                  >
                    <p className="text-xl font-bold text-slate-900">
                      {item.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <div
            role="tablist"
            aria-label="Contest categories"
            className="flex w-fit rounded-xl border border-slate-200 bg-white p-1"
          >
            {TABS.map((tab) => {
              const isSelected = activeTab === tab;

              return (
                <button
                  key={tab}
                  role="tab"
                  id={`tab-${tab}`}
                  aria-selected={isSelected}
                  aria-controls={`panel-${tab}`}
                  onClick={() => setActiveTab(tab)}
                  className={[
                    "rounded-lg px-4 py-2.5 text-sm font-semibold transition",
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-100",
                  ].join(" ")}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <Link
            to="/leaderboard"
            className="hidden items-center gap-2 text-sm font-semibold text-indigo-600 sm:inline-flex"
          >
            <Medal size={16} />
            Leaderboard
          </Link>
        </div>

        {/* Upcoming contests */}
        {activeTab === "Upcoming" && (
          <section
            id="panel-Upcoming"
            role="tabpanel"
            aria-labelledby="tab-Upcoming"
            className="mt-6 space-y-4"
          >
            {contestList.map((contest) => (
              <article
                key={contest.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/50 sm:p-7"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                        {contest.type}
                      </span>

                      <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">
                        {contest.level}
                      </span>

                      <span className="font-mono text-xs text-slate-400">
                        {contest.code}
                      </span>
                    </div>

                    <h2 className="mt-4 text-xl font-bold text-slate-900 sm:text-2xl">
                      {contest.name}
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                      {contest.description}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
                      <span className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-indigo-500" />
                        {contest.date}
                      </span>

                      <span className="flex items-center gap-2">
                        <Clock3 size={16} className="text-indigo-500" />
                        {contest.startTime} • {contest.duration}
                      </span>

                      <span className="flex items-center gap-2">
                        <Code2 size={16} className="text-indigo-500" />
                        {contest.problems} problems
                      </span>

                      <span className="flex items-center gap-2">
                        <Users size={16} className="text-indigo-500" />
                        Open to all
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-3 border-t border-slate-100 pt-5 lg:items-end lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">
                      <CircleCheck size={14} />
                      Registration open
                    </span>

                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
                    >
                      Register now
                      <ArrowRight size={16} />
                    </button>

                    <Link
                      to="/problems"
                      className="text-xs font-semibold text-slate-500 hover:text-indigo-600"
                    >
                      Practice before contest
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        {/* Past contests */}
        {activeTab === "Past" && (
          <section
            id="panel-Past"
            role="tabpanel"
            aria-labelledby="tab-Past"
            className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white"
          >
            {pastContests.map((contest, index) => (
              <div
                key={contest.id}
                className={`flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between ${
                  index !== pastContests.length - 1
                    ? "border-b border-slate-100"
                    : ""
                }`}
              >
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {contest.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {contest.date} • {contest.duration} • {contest.problems}{" "}
                    problems • {contest.participants} participants
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    <Circle size={14} />
                    {contest.status}
                  </span>

                  <Link
                    to="/contests"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    View problems
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* My contests */}
        {activeTab === "My Contests" && (
          <section
            id="panel-My Contests"
            role="tabpanel"
            aria-labelledby="tab-My Contests"
            className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white"
          >
            {myContests.map((contest, index) => (
              <div
                key={contest.id}
                className={`flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between ${
                  index !== myContests.length - 1
                    ? "border-b border-slate-100"
                    : ""
                }`}
              >
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {contest.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {contest.date}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
                    contest.status === "Registered"
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {contest.status}
                </span>
              </div>
            ))}
          </section>
        )}

        {/* Practice CTA */}
        <section className="mt-8 rounded-3xl bg-slate-900 p-8 text-white sm:p-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
                Prepare smart
              </p>

              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                Practice before the timer starts.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
                Build confidence with topic-wise problems, mock contests, and
                previous challenge archives.
              </p>
            </div>

            <Link
              to="/problems"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Practice problems
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}