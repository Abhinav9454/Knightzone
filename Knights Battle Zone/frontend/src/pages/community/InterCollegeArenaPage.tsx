import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { interCollegeApi } from "@/lib/api";
import type { CollegeStats } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  Bell,
  Calendar,
  CheckCircle2,
  Circle,
  Clock3,
  Filter,
  Flame,
  Gamepad2,
  GraduationCap,
  Medal,
  Search,
  Shield,
  Sparkles,
  Trophy,
  Users,
  Waves,
} from "lucide-react";
import { toast } from "sonner";

type EventCategory = "All" | "Sports" | "Coding" | "Gaming" | "Cultural" | "Academic";
type EventStatus = "All" | "Live" | "Upcoming" | "Completed";
type EventView = "grid" | "list";
type LeaderboardMode = "college" | "individual";
type PortalTab = "events" | "leaderboard" | "college" | "student" | "admin" | "super";

type ArenaEvent = {
  id: number;
  title: string;
  category: Exclude<EventCategory, "All">;
  status: Exclude<EventStatus, "All">;
  date: string;
  time: string;
  venue: string;
  colleges: number;
};

type IndividualRank = {
  rank: number;
  name: string;
  college: string;
  points: number;
  events: number;
  trend: "up" | "down" | "flat";
};

type NotificationItem = {
  id: number;
  message: string;
  time: string;
  unread: boolean;
};

const categories: EventCategory[] = ["All", "Sports", "Coding", "Gaming", "Cultural", "Academic"];
const statuses: EventStatus[] = ["All", "Live", "Upcoming", "Completed"];

const arenaEvents: ArenaEvent[] = [
  { id: 1, title: "Inter-College Cricket Final", category: "Sports", status: "Live", date: "2026-03-02", time: "4:00 PM", venue: "Main Ground", colleges: 8 },
  { id: 2, title: "Code Sprint 5.0", category: "Coding", status: "Upcoming", date: "2026-03-03", time: "10:00 AM", venue: "Online", colleges: 22 },
  { id: 3, title: "Valorant Campus Clash", category: "Gaming", status: "Upcoming", date: "2026-03-05", time: "1:30 PM", venue: "E-Sports Lab", colleges: 16 },
  { id: 4, title: "Debate League Final", category: "Cultural", status: "Completed", date: "2026-02-26", time: "11:00 AM", venue: "Auditorium", colleges: 9 },
  { id: 5, title: "Aptitude Relay", category: "Academic", status: "Upcoming", date: "2026-03-06", time: "9:30 AM", venue: "Seminar Hall", colleges: 12 },
  { id: 6, title: "Rapid Quiz Royale", category: "Academic", status: "Live", date: "2026-03-01", time: "3:15 PM", venue: "Online", colleges: 19 },
];

const individualRankings: IndividualRank[] = [
  { rank: 1, name: "Aarav Sharma", college: "MIT World Peace", points: 520, events: 11, trend: "up" },
  { rank: 2, name: "Riya Patil", college: "Pune Institute", points: 505, events: 12, trend: "up" },
  { rank: 3, name: "Neel Joshi", college: "VIT", points: 482, events: 10, trend: "flat" },
  { rank: 4, name: "Sakshi Nair", college: "AISSMS", points: 460, events: 10, trend: "down" },
  { rank: 5, name: "Dev More", college: "MIT World Peace", points: 452, events: 9, trend: "up" },
];

const studentNotifications: NotificationItem[] = [
  { id: 1, message: "Your Coding Battle starts in 30 minutes.", time: "5m ago", unread: true },
  { id: 2, message: "Team Falcon accepted your join request.", time: "22m ago", unread: true },
  { id: 3, message: "Quiz results published: You ranked #7.", time: "1h ago", unread: false },
  { id: 4, message: "College wall: New practice session tonight.", time: "3h ago", unread: false },
];

const collegeFallback: CollegeStats[] = [
  { rank: 1, college: "MIT World Peace", totalPoints: 2450, memberCount: 380, contestsWon: 12 },
  { rank: 2, college: "Pune Institute", totalPoints: 2320, memberCount: 342, contestsWon: 11 },
  { rank: 3, college: "VIT", totalPoints: 2210, memberCount: 331, contestsWon: 10 },
  { rank: 4, college: "AISSMS", totalPoints: 2105, memberCount: 300, contestsWon: 9 },
  { rank: 5, college: "Symbiosis", totalPoints: 2040, memberCount: 288, contestsWon: 8 },
];

const timeline = [
  { day: "Mon", title: "Coding Battle", status: "Tomorrow 10:00 AM" },
  { day: "Wed", title: "Gaming Knockout", status: "Registration Open" },
  { day: "Fri", title: "Debate League", status: "Slots Filling Fast" },
  { day: "Sun", title: "Mega Quiz", status: "Live at 7:00 PM" },
];

const statusClass: Record<ArenaEvent["status"], string> = {
  Live: "bg-red-500/15 text-red-400 border-red-500/40",
  Upcoming: "bg-[#00B8FF]/15 text-[#7dd8ff] border-[#00B8FF]/50",
  Completed: "bg-slate-500/15 text-slate-300 border-slate-500/40",
};

const categoryIcon = {
  Sports: Trophy,
  Coding: Sparkles,
  Gaming: Gamepad2,
  Cultural: Waves,
  Academic: GraduationCap,
};

export default function InterCollegeArenaPage() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<CollegeStats[]>(collegeFallback);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<EventCategory>("All");
  const [status, setStatus] = useState<EventStatus>("All");
  const [viewMode, setViewMode] = useState<EventView>("grid");
  const [leaderboardMode, setLeaderboardMode] = useState<LeaderboardMode>("college");
  const [activeTab, setActiveTab] = useState<PortalTab>("events");

  useEffect(() => {
    let mounted = true;
    const fetchRankings = async () => {
      try {
        const data = await interCollegeApi.getCurrentRankings();
        if (mounted && data.length) {
          setRankings(data.sort((a, b) => a.rank - b.rank));
        }
      } catch {
        if (mounted) {
          setRankings(collegeFallback);
          toast.error("Live rankings unavailable. Showing fallback leaderboard data.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRankings();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    return arenaEvents.filter((event) => {
      if (category !== "All" && event.category !== category) return false;
      if (status !== "All" && event.status !== status) return false;
      if (search && !event.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [category, status, search]);

  const top3Colleges = useMemo(() => rankings.slice(0, 3), [rankings]);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f1228] via-[#1d1b4f] to-[#122541] p-6 md:p-10 text-white">
        <div className="absolute inset-0 opacity-35">
          <video
            className="h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            poster="https://images.unsplash.com/photo-1521412644187-c49fa049e84d?q=80&w=1600&auto=format&fit=crop"
          >
            <source src="https://cdn.coverr.co/videos/coverr-students-walking-in-campus-1579/1080p.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-transparent" />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            <Badge className="bg-white/15 text-white border-white/25">Inter-College Arena</Badge>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight" style={{ fontFamily: "Poppins, Inter, sans-serif" }}>
              Welcome to Inter-College Arena
            </h1>
            <p className="max-w-2xl text-white/85 text-sm md:text-base">
              Where Colleges Compete, Students Shine. Live events, real-time rankings, and role-based competition dashboards in one unified experience.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-[#6C5CE7] hover:bg-[#5b4bd0] text-white">Explore Events</Button>
              <Button variant="outline" className="border-white/35 bg-white/5 text-white hover:bg-white/15">View Leaderboard</Button>
            </div>
          </div>

          <div className="rounded-2xl border border-red-400/35 bg-black/35 p-4 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Live Now</p>
              <span className="inline-flex items-center gap-2 text-red-300 text-xs font-medium">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" /> LIVE
              </span>
            </div>
            <h3 className="text-lg font-semibold">Inter-College Cricket Final</h3>
            <p className="text-sm text-white/80">MIT World Peace 180/5 (20) vs Pune Institute 120/3 (15)</p>
            <Button size="sm" className="w-full bg-[#00B8FF] hover:bg-[#00a1df] text-white">Watch Live</Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border/80 bg-card/70 p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Featured Events</h2>
            <p className="text-xs text-muted-foreground">Swipe on mobile</p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:overflow-visible">
            {arenaEvents.slice(0, 4).map((event) => {
              const Icon = categoryIcon[event.category];
              return (
                <article
                  key={event.id}
                  className="min-w-[260px] md:min-w-0 rounded-xl border border-border bg-background/45 p-4 transition duration-300 hover:scale-[1.02] hover:border-[#6C5CE7]/60"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#6C5CE7]/15 text-[#a79cf3]">
                      <Icon size={17} />
                    </span>
                    <Badge variant="outline" className={statusClass[event.status]}>{event.status}</Badge>
                  </div>
                  <h3 className="text-sm font-semibold">{event.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground">{event.date} • {event.time}</p>
                  <p className="text-xs text-muted-foreground">{event.colleges} colleges</p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/70 p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Top Colleges</h2>
            <a className="text-xs text-[#00B8FF]" href="#leaderboard">View Full</a>
          </div>
          <div className="space-y-2">
            {rankings.slice(0, 5).map((row) => (
              <div key={row.college} className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
                <p className="text-sm"><span className="font-semibold">#{row.rank}</span> {row.college}</p>
                <span className="font-mono text-sm text-[#00F5A0]">{row.totalPoints}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/80 bg-card/70 p-4 md:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Upcoming Timeline</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">Join Gaming</Button>
            <Button size="sm" variant="outline">Register Hackathon</Button>
            <Button size="sm" variant="outline">Form Team</Button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {timeline.map((item) => (
            <div key={item.title} className="rounded-xl border border-border/70 bg-background/40 p-3">
              <p className="text-xs text-[#00B8FF] font-semibold">{item.day}</p>
              <p className="mt-1 text-sm font-semibold">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.status}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/80 bg-card/70 p-4 md:p-5 space-y-4" id="leaderboard">
        <div className="flex flex-wrap gap-2">
          {([
            ["events", "Events Page"],
            ["leaderboard", "Leaderboard"],
            ["college", "College Profile"],
            ["student", "Student Dashboard"],
            ["admin", "College Admin"],
            ["super", "Super Admin"],
          ] as Array<[PortalTab, string]>).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                activeTab === key ? "bg-[#6C5CE7] text-white" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "events" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search events"
                  className="pl-9"
                  aria-label="Search events"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Filter size={16} className="mt-2 text-muted-foreground" />
                {categories.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setCategory(chip)}
                    className={`rounded-full px-3 py-1.5 text-xs ${
                      chip === category ? "bg-[#6C5CE7] text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {statuses.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setStatus(chip)}
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    chip === status ? "bg-[#00B8FF] text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {chip}
                </button>
              ))}
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant={viewMode === "grid" ? "default" : "outline"} onClick={() => setViewMode("grid")}>Grid</Button>
                <Button size="sm" variant={viewMode === "list" ? "default" : "outline"} onClick={() => setViewMode("list")}>List</Button>
              </div>
            </div>

            <div className={viewMode === "grid" ? "grid gap-3 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
              {filteredEvents.map((event) => {
                const Icon = categoryIcon[event.category];
                return (
                  <article key={event.id} className="rounded-xl border border-border bg-background/50 p-4 transition duration-300 hover:border-[#6C5CE7]/55">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={16} className="text-[#00B8FF]" />
                        <p className="text-sm font-semibold">{event.title}</p>
                      </div>
                      <Badge variant="outline" className={statusClass[event.status]}>{event.status}</Badge>
                    </div>
                    <div className="grid gap-1 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1"><Calendar size={12} /> {event.date} • {event.time}</p>
                      <p className="flex items-center gap-1"><Users size={12} /> {event.colleges} colleges</p>
                      <p className="flex items-center gap-1"><Clock3 size={12} /> {event.venue}</p>
                    </div>
                    <Button size="sm" className="mt-3 w-full bg-[#6C5CE7] hover:bg-[#5b4bd0]">View Details</Button>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant={leaderboardMode === "college" ? "default" : "outline"} onClick={() => setLeaderboardMode("college")}>College Leaderboard</Button>
              <Button variant={leaderboardMode === "individual" ? "default" : "outline"} onClick={() => setLeaderboardMode("individual")}>Individual Leaderboard</Button>
            </div>

            {leaderboardMode === "college" ? (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  {top3Colleges.map((item) => (
                    <div key={item.college} className="rounded-xl border border-border bg-background/50 p-4 text-center">
                      <p className="text-xs text-muted-foreground">Rank #{item.rank}</p>
                      <p className="mt-1 font-semibold">{item.college}</p>
                      <p className="font-mono text-xl text-[#00F5A0]">{item.totalPoints}</p>
                    </div>
                  ))}
                </div>
                <div className="data-table-wrap">
                  <table className="data-table min-w-full">
                    <thead>
                      <tr>
                        <th>Rank</th><th>College</th><th>Points</th><th>Players</th><th>Wins</th><th>Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankings.map((item) => (
                        <tr key={item.college}>
                          <td>#{item.rank}</td>
                          <td>{item.college}</td>
                          <td className="font-mono">{item.totalPoints}</td>
                          <td>{item.memberCount}</td>
                          <td>{item.contestsWon}</td>
                          <td><span className="inline-flex items-center gap-1 text-emerald-400"><ArrowUpRight size={14} /> +2</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table min-w-full">
                  <thead>
                    <tr>
                      <th>Rank</th><th>Player</th><th>College</th><th>Points</th><th>Events</th><th>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {individualRankings.map((p) => (
                      <tr key={p.name}>
                        <td>#{p.rank}</td>
                        <td>{p.name}</td>
                        <td>{p.college}</td>
                        <td className="font-mono">{p.points}</td>
                        <td>{p.events}</td>
                        <td>{p.trend === "up" ? "?" : p.trend === "down" ? "?" : "?"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "college" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-gradient-to-r from-[#6C5CE7]/20 via-[#00B8FF]/15 to-[#00F5A0]/15 p-4">
              <h3 className="text-xl font-semibold">MIT World Peace University</h3>
              <p className="text-sm text-muted-foreground">Pune • Maharashtra</p>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ["Total Students", "2450"],
                  ["Players", "380"],
                  ["Total Points", "2450"],
                  ["Current Rank", "#2"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-black/20 p-3">
                    <p className="text-xs text-muted-foreground">{k}</p>
                    <p className="text-lg font-semibold">{v}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/50 p-4">
                <p className="font-semibold mb-2">Top Players</p>
                <div className="space-y-2 text-sm">
                  <p>1. Aarav Sharma • 520 pts</p>
                  <p>2. Dev More • 452 pts</p>
                  <p>3. Sneha Jain • 440 pts</p>
                  <p>4. Harsh Kulkarni • 420 pts</p>
                  <p>5. Isha Rao • 409 pts</p>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-background/50 p-4">
                <p className="font-semibold mb-2">Recent Results</p>
                <div className="space-y-2 text-sm">
                  <p>Cricket SF: Won vs VIT (by 22 runs)</p>
                  <p>Hackathon: Runner-up</p>
                  <p>Debate League: Won 3-1</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "student" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-semibold">Welcome back, {user?.name || "Student"}</h3>
              <Badge className="bg-[#00F5A0]/20 text-[#00F5A0]">MIT World Peace</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ["Events", "8"],
                ["Wins", "3"],
                ["Points", "150"],
                ["College Rank", "#4"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-border bg-background/50 p-4">
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p className="text-xl font-semibold">{v}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/50 p-4">
                <p className="font-semibold mb-2">Notifications</p>
                <div className="max-h-52 space-y-2 overflow-auto pr-1">
                  {studentNotifications.map((n) => (
                    <div key={n.id} className="flex items-start gap-2 rounded-lg border border-border/70 p-2">
                      <Bell size={14} className={n.unread ? "text-[#00B8FF] mt-0.5" : "text-muted-foreground mt-0.5"} />
                      <div className="text-sm">
                        <p>{n.message}</p>
                        <p className="text-xs text-muted-foreground">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-background/50 p-4">
                <p className="font-semibold mb-2">My Registered Events</p>
                <div className="space-y-2 text-sm">
                  <p className="rounded-md border border-border/70 p-2">Cricket Semi-final • Today 4 PM • Confirmed</p>
                  <p className="rounded-md border border-border/70 p-2">Hackathon • Tomorrow 9 AM • Confirmed</p>
                  <p className="rounded-md border border-border/70 p-2">Quiz • Feb 25 • Completed</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm">Join New Event</Button>
                  <Button size="sm" variant="outline">View Certificates</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "admin" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-[#00B8FF]" />
              <h3 className="text-xl font-semibold">College Admin Dashboard</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                ["Total Students", "2450"],
                ["Registered Players", "380"],
                ["Events", "12"],
                ["Total Points", "2450"],
                ["Rank", "#2"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-border bg-background/50 p-3">
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p className="text-lg font-semibold">{v}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/50 p-4">
                <p className="font-semibold mb-2">Pending Approvals</p>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center justify-between rounded border border-border/70 p-2">23 new students <Button size="sm">Review</Button></p>
                  <p className="flex items-center justify-between rounded border border-border/70 p-2">6 team edits <Button size="sm" variant="outline">Open</Button></p>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-background/50 p-4">
                <p className="font-semibold mb-2">Quick Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm">Manage Students</Button>
                  <Button size="sm" variant="outline">Manage Teams</Button>
                  <Button size="sm" variant="outline">Create Event</Button>
                  <Button size="sm" variant="outline">Announcements</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "super" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Medal size={18} className="text-[#6C5CE7]" />
              <h3 className="text-xl font-semibold">Super Admin Control Center</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ["Total Colleges", "48"],
                ["Total Students", "12,450"],
                ["Active Users", "1,245"],
                ["Growth", "+23%"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-border bg-background/50 p-4">
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p className="text-xl font-semibold">{v}</p>
                </div>
              ))}
            </div>
            <div className="data-table-wrap">
              <table className="data-table min-w-full">
                <thead>
                  <tr>
                    <th>College</th><th>Status</th><th>Students</th><th>Points</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.slice(0, 5).map((c) => (
                    <tr key={c.college}>
                      <td>{c.college}</td>
                      <td><span className="inline-flex items-center gap-1 text-emerald-400"><CheckCircle2 size={14} /> Verified</span></td>
                      <td>{c.memberCount}</td>
                      <td>{c.totalPoints}</td>
                      <td><Button size="sm" variant="outline">Manage</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <footer className="rounded-2xl border border-border/80 bg-card/70 p-4 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-2">
        <p>Inter-College Arena • Modern competitive campus platform</p>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1"><Flame size={14} /> Live Scores</span>
          <span className="inline-flex items-center gap-1"><Circle size={8} className="fill-[#00F5A0] text-[#00F5A0]" /> Real-time Leaderboards</span>
        </div>
      </footer>
    </div>
  );
}



