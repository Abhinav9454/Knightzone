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
  Search,
  Zap,
  Filter,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { contestsApi, adminApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { TrophyIllustration, KnightCrest } from "../components/svg";

const TABS = ["Live & Upcoming", "Past Contests", "All Contests", "My Contests"];

export default function Contests() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { isNight } = useTheme();
  const [activeTab, setActiveTab] = useState("Live & Upcoming");
  const [contests, setContests] = useState([]);
  const [registeredContestIds, setRegisteredContestIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadContests();
  }, [isAuthenticated]);

  const loadContests = async () => {
    try {
      setLoading(true);
      const data = await contestsApi.getAll(0, 100);
      const list = Array.isArray(data) ? data : data?.content || [];

      const now = new Date();
      const mapped = list.map((c) => {
        const start = c.startTime ? new Date(c.startTime) : new Date();
        const end = c.endTime
          ? new Date(c.endTime)
          : new Date(start.getTime() + (c.durationMinutes || 90) * 60000);

        let status = "Upcoming";
        if (now >= start && now <= end) {
          status = "Live";
        } else if (now > end) {
          status = "Completed";
        }

        return {
          id: c.id,
          name: c.title || "Contest Championship",
          code: `KZ-00${c.id}`,
          type: c.durationMinutes && c.durationMinutes <= 60 ? "Speed Contest" : "Rated Championship",
          startDate: start,
          endDate: end,
          dateStr: start.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
          startTimeStr: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          duration: `${c.durationMinutes || 90} minutes`,
          problems: 3,
          level: "All levels",
          status,
          description:
            c.description ||
            "Timed algorithmic challenge. Solve challenges quickly with minimal penalties to climb the rating leaderboard.",
        };
      });

      setContests(mapped);

      // Check registered contests if user is logged in
      if (isAuthenticated && mapped.length > 0) {
        const registeredSet = new Set();
        await Promise.allSettled(
          mapped.slice(0, 20).map(async (c) => {
            try {
              const access = await contestsApi.getAccess(c.id);
              if (access && access.registered) {
                registeredSet.add(c.id);
              }
            } catch {
              // not registered
            }
          })
        );
        setRegisteredContestIds(registeredSet);
      }
    } catch (err) {
      console.warn("Could not load backend contests:", err);
      // Fallback fallback sample contests
      setContests([
        {
          id: 1,
          name: "Weekly Algorithmic Clash",
          code: "KZ-001",
          type: "Rated Championship",
          startDate: new Date(),
          endDate: new Date(Date.now() + 7200000),
          dateStr: new Date().toLocaleDateString(),
          startTimeStr: "8:00 PM",
          duration: "120 minutes",
          problems: 4,
          level: "All levels",
          status: "Live",
          description: "Balanced algorithmic challenges covering arrays, strings, dynamic programming, and graphs.",
        },
        {
          id: 2,
          name: "Campus Placement Sprint",
          code: "KZ-002",
          type: "Speed Contest",
          startDate: new Date(Date.now() + 86400000 * 3),
          endDate: new Date(Date.now() + 86400000 * 3 + 5400000),
          dateStr: new Date(Date.now() + 86400000 * 3).toLocaleDateString(),
          startTimeStr: "9:00 PM",
          duration: "90 minutes",
          problems: 3,
          level: "Intermediate",
          status: "Upcoming",
          description: "High-yield interview pattern questions designed to test problem-solving speed under pressure.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredContests = contests.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (activeTab === "Live & Upcoming") {
      return c.status === "Live" || c.status === "Upcoming";
    }
    if (activeTab === "Past Contests") {
      return c.status === "Completed";
    }
    if (activeTab === "All Contests") {
      return true;
    }
    if (activeTab === "My Contests") {
      return registeredContestIds.has(c.id);
    }
    return true;
  });

  const handleAdminMakeLive = async (contestId, durationMins = 120) => {
    try {
      const contest = contests.find((c) => c.id === contestId);
      const now = new Date();
      const startTime = new Date(now.getTime() - 60000).toISOString();
      const endTime = new Date(now.getTime() + durationMins * 60000).toISOString();
      await adminApi.updateContest(contestId, {
        title: contest?.name || "Contest Championship",
        description: contest?.description || "",
        startTime,
        endTime,
        durationMinutes: durationMins,
      });
      alert(`⚡ Contest revived! Now actively LIVE for ${durationMins} minutes.`);
      await loadContests();
      setActiveTab("Live & Upcoming");
    } catch (err) {
      alert("Failed to make contest live: " + (err.response?.data?.message || err.message));
    }
  };

  const liveCount = contests.filter((c) => c.status === "Live").length;
  const upcomingCount = contests.filter((c) => c.status === "Upcoming").length;
  const pastCount = contests.filter((c) => c.status === "Completed").length;

  return (
    <main className="min-h-screen bg-[#0c0f0a] text-[#e0e4dc] pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden border-b border-white/10 bg-[#121610] py-10 px-6 sm:px-10">
        <div className="absolute -right-8 -top-8 opacity-10 pointer-events-none">
          <KnightCrest className="w-80 h-80" />
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c5ff55]/20 bg-[#c5ff55]/[0.06] px-3 py-1 text-xs font-bold text-[#c5ff55] mb-3">
                <Trophy size={14} className="text-[#c5ff55]" />
                Official Competitive Arena
              </div>

              <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                Compete. Improve.
                <span className="block text-[#c5ff55]">Get Ranked.</span>
              </h1>

              <p className="mt-3 text-sm text-[#aab1a1] max-w-xl leading-relaxed">
                Join live timed coding tournaments, tackle fresh algorithmic challenges under timer constraints, earn XP, and climb the Knight Battle Zone leaderboards.
              </p>
            </div>

            <div className="flex items-center gap-5">
              <TrophyIllustration className="hidden sm:block w-24 h-24 shrink-0 drop-shadow-md" />
              <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-[#161a14] p-4 shadow-sm">
                <div className="text-center px-2">
                  <p className="text-2xl font-black text-emerald-400">{liveCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#788071]">Live Now</p>
                </div>
                <div className="text-center px-2 border-x border-white/10">
                  <p className="text-2xl font-black text-[#c5ff55]">{upcomingCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#788071]">Upcoming</p>
                </div>
                <div className="text-center px-2">
                  <p className="text-2xl font-black text-[#aab1a1]">{pastCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#788071]">Past</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Tabs Controls */}
          <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-xl w-full md:w-auto">
              {TABS.map((tab) => {
                const isSelected = activeTab === tab;
                const count =
                  tab === "Live & Upcoming"
                    ? liveCount + upcomingCount
                    : tab === "Past Contests"
                    ? pastCount
                    : tab === "All Contests"
                    ? contests.length
                    : registeredContestIds.size;

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                      isSelected
                        ? "bg-[#c5ff55] text-[#14170f] font-black"
                        : "text-[#aab1a1] hover:text-white"
                    }`}
                  >
                    <span>{tab}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                        isSelected ? "bg-[#14170f] text-[#c5ff55]" : "bg-white/10 text-[#aab1a1]"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:w-72">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#788071]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contests..."
                className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-9 pr-4 text-xs font-semibold text-white placeholder:text-[#788071] focus:border-[#c5ff55] focus:outline-none shadow-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content List */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={32} className="animate-spin text-[#c5ff55]" />
            <p className="text-xs font-bold text-[#788071]">Loading contest battlefields...</p>
          </div>
        ) : filteredContests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-[#161a14] p-12 text-center">
            <Trophy className="mx-auto h-12 w-12 text-[#788071] mb-3 opacity-60" />
            <h3 className="text-base font-bold text-white">No contests found</h3>
            <p className="text-xs text-[#aab1a1] mt-1 max-w-sm mx-auto">
              {activeTab === "My Contests"
                ? "You haven't registered for any contests yet. Register for an upcoming contest to compete!"
                : "No contests matched your current filter or search criteria."}
            </p>
            {activeTab === "My Contests" && (
              <button
                onClick={() => setActiveTab("Live & Upcoming")}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#c5ff55] px-4 py-2 text-xs font-black uppercase text-[#14170f] hover:bg-[#d5ff83] transition shadow-md shadow-[#c5ff55]/20"
              >
                Browse Upcoming Contests <ArrowRight size={13} />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContests.map((c) => {
              const isRegistered = registeredContestIds.has(c.id);

              return (
                <article
                  key={c.id}
                  className="group rounded-3xl border border-white/10 bg-[#161a14] p-6 transition shadow-xs hover:border-[#c5ff55]/40 hover:shadow-lg hover:shadow-[#c5ff55]/5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                            c.status === "Live"
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 animate-pulse"
                              : c.status === "Upcoming"
                              ? "bg-[#c5ff55]/15 text-[#c5ff55] border border-[#c5ff55]/30"
                              : "bg-white/10 text-white/70"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {c.status === "Live" ? "LIVE NOW" : c.status === "Upcoming" ? "UPCOMING" : "COMPLETED"}
                        </span>

                        <span className="text-xs font-bold text-[#788071]">{c.code}</span>
                        <span className="text-white/20">•</span>
                        <span className="text-xs font-semibold text-[#aab1a1]">{c.type}</span>

                        {isRegistered && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 size={11} /> Registered
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-xl font-bold transition ${
                          isNight
                            ? "text-white group-hover:text-[#c5ff55]"
                            : "text-slate-900 group-hover:text-emerald-700"
                        }`}
                      >
                        {c.name}
                      </h3>

                      <p className="text-xs text-[#aab1a1] leading-relaxed max-w-3xl">
                        {c.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-5 text-xs text-[#aab1a1] pt-1">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={14} className="text-[#c5ff55]" />
                          {c.dateStr} • {c.startTimeStr}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={14} className="text-[#c5ff55]" />
                          {c.duration}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <Code2 size={14} className="text-[#c5ff55]" />
                          {c.problems} Challenges
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-start lg:items-end gap-3 border-t border-white/10 pt-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
                      <Link
                        to={`/contests/${c.id}`}
                        className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider transition shadow-sm ${
                          c.status === "Live"
                            ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/20"
                            : c.status === "Upcoming"
                            ? "bg-[#c5ff55] text-[#14170f] hover:bg-[#d5ff83] shadow-[#c5ff55]/20"
                            : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                        }`}
                      >
                        {c.status === "Live"
                          ? "Enter Live Battlefield"
                          : c.status === "Upcoming"
                          ? isRegistered
                            ? "View Contest Info"
                            : "Register & Details"
                          : "View Standings & Solutions"}
                        <ArrowRight size={14} />
                      </Link>

                      <span className="text-[11px] font-semibold text-[#788071]">
                        {c.status === "Live"
                          ? "Active submissions ongoing"
                          : c.status === "Upcoming"
                          ? "Registration is open"
                          : "Official scoreboard final"}
                      </span>

                      {/* Admin Quick Make Live Action on Completed Contests */}
                      {isAdmin && c.status === "Completed" && (
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/10 w-full justify-start lg:justify-end">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                            <Zap size={11} className="text-[#c5ff55]" /> Admin:
                          </span>
                          <button
                            onClick={() => handleAdminMakeLive(c.id, 60)}
                            className="rounded-lg bg-[#c5ff55] px-2 py-0.5 text-[10px] font-black text-[#14170f] hover:bg-[#d5ff83] transition"
                            title="Make contest live for 1 hour"
                          >
                            ⚡ Live +1h
                          </button>
                          <button
                            onClick={() => handleAdminMakeLive(c.id, 120)}
                            className="rounded-lg bg-[#c5ff55] px-2 py-0.5 text-[10px] font-black text-[#14170f] hover:bg-[#d5ff83] transition"
                            title="Make contest live for 2 hours"
                          >
                            ⚡ Live +2h
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}