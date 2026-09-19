import { useCallback, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { contestApi } from "@/lib/api";
import type { Contest } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, Users, Calendar, Trophy, Activity, Hourglass } from "lucide-react";
import { toast } from "sonner";
import { useRealtimeRefresh } from "@/lib/realtime";

type StatusFilter = "ALL" | "UPCOMING" | "ONGOING" | "PAST";
type SortKey = "START_SOON" | "MOST_PARTICIPANTS" | "RECENTLY_CREATED";

export default function ContestsPage() {
  const location = useLocation();
  const isSimpleContext = location.pathname.startsWith("/simple");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortKey>("START_SOON");
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const hasErrorToast = useRef(false);

  const loadContests = useCallback(async () => {
    try {
      const data = await contestApi.getAll();
      setContests(data);
      hasErrorToast.current = false;
    } catch {
      if (!hasErrorToast.current) {
        toast.error("Unable to refresh contests right now.");
        hasErrorToast.current = true;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useRealtimeRefresh(loadContests, { intervalMs: 15000, scope: "dashboard" });

  const toScopedContestPath = (contestId: number) => (isSimpleContext ? `/simple/contests/${contestId}` : `/contests/${contestId}`);

  const contestSummary = useMemo(() => {
    const now = Date.now();
    const ongoing = contests.filter((contest) => contest.status === "ONGOING").length;
    const upcoming = contests.filter((contest) => contest.status === "UPCOMING").length;
    const past = contests.filter((contest) => contest.status === "PAST").length;
    const totalParticipants = contests.reduce((sum, contest) => sum + (contest.participantCount ?? 0), 0);

    const nextStart = contests
      .filter((contest) => new Date(contest.startTime).getTime() > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

    return {
      total: contests.length,
      ongoing,
      upcoming,
      past,
      totalParticipants,
      nextStart: nextStart ? new Date(nextStart.startTime) : null,
    };
  }, [contests]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const byFilter = contests.filter((contest) => {
      if (filter !== "ALL" && contest.status !== filter) return false;
      if (!normalizedSearch) return true;

      return (
        contest.title.toLowerCase().includes(normalizedSearch) ||
        contest.description.toLowerCase().includes(normalizedSearch)
      );
    });

    const sorted = [...byFilter].sort((a, b) => {
      if (sortBy === "MOST_PARTICIPANTS") {
        return (b.participantCount ?? 0) - (a.participantCount ?? 0);
      }

      if (sortBy === "RECENTLY_CREATED") {
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      }

      const now = Date.now();
      const distanceA = Math.abs(new Date(a.startTime).getTime() - now);
      const distanceB = Math.abs(new Date(b.startTime).getTime() - now);
      return distanceA - distanceB;
    });

    return sorted;
  }, [contests, filter, search, sortBy]);

  const statusColor = (status: string) => {
    switch (status) {
      case "ONGOING":
        return "bg-success/15 text-success border-success/30";
      case "UPCOMING":
        return "bg-primary/15 text-primary border-primary/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <section className="dashboard-hero surface-hover rounded-2xl border border-border/75 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="hero-chip mb-3">
              <Trophy className="h-3.5 w-3.5" />
              Competitive Workspace
            </span>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">Contests</h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              Track ongoing events, register for upcoming rounds, and review participation momentum.
            </p>
          </div>
          <div className="rounded-xl border border-border/75 bg-card/80 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Next Start Window</p>
            <p className="mt-1 font-semibold">
              {contestSummary.nextStart ? contestSummary.nextStart.toLocaleString() : "No upcoming contests"}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="metric-card surface-hover rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Total Contests</p>
            <p className="mt-1 text-2xl font-bold">{contestSummary.total}</p>
          </article>
          <article className="metric-card surface-hover rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Live Right Now</p>
            <p className="mt-1 text-2xl font-bold">{contestSummary.ongoing}</p>
          </article>
          <article className="metric-card surface-hover rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Upcoming</p>
            <p className="mt-1 text-2xl font-bold">{contestSummary.upcoming}</p>
          </article>
          <article className="metric-card surface-hover rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Total Participants</p>
            <p className="mt-1 text-2xl font-bold">{contestSummary.totalParticipants}</p>
          </article>
        </div>
      </section>

      <div className="content-panel surface-hover rounded-xl p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search contests by title or overview"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-11"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(["ALL", "ONGOING", "UPCOMING", "PAST"] as StatusFilter[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  filter === status
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "START_SOON", label: "Start Soon" },
              { id: "MOST_PARTICIPANTS", label: "Most Participants" },
              { id: "RECENTLY_CREATED", label: "Recent" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSortBy(item.id as SortKey)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                  sortBy === item.id
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/70 bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="metric-card surface-hover rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Filter Applied</p>
          <p className="mt-1 text-lg font-semibold">{filter}</p>
        </article>
        <article className="metric-card surface-hover rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Sort Mode</p>
          <p className="mt-1 text-lg font-semibold">{sortBy.replace(/_/g, " ")}</p>
        </article>
        <article className="metric-card surface-hover rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Visible Cards</p>
          <p className="mt-1 text-lg font-semibold">{filtered.length}</p>
        </article>
        <article className="metric-card surface-hover rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Completed Events</p>
          <p className="mt-1 text-lg font-semibold">{contestSummary.past}</p>
        </article>
      </div>

      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((contest) => (
          <Link
            key={contest.id}
            to={toScopedContestPath(contest.id)}
            className="group surface-hover rounded-xl border border-border/75 bg-card/80 p-5 transition-all hover:border-primary/50 hover:bg-card"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 flex-1 text-base font-semibold group-hover:text-primary">{contest.title}</h3>
              <Badge variant="outline" className={`text-xs ${statusColor(contest.status)}`}>
                {contest.status}
              </Badge>
            </div>

            <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
              {contest.description || "No description provided by organizer."}
            </p>

            <div className="space-y-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
              <p className="inline-flex items-center gap-2">
                <Calendar size={13} />
                Start: {new Date(contest.startTime).toLocaleString()}
              </p>
              <p className="inline-flex items-center gap-2">
                <Hourglass size={13} />
                End: {new Date(contest.endTime).toLocaleString()}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} />
                  {contest.durationMinutes ?? contest.duration} minutes
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users size={13} />
                  {contest.participantCount ?? 0} joined
                </span>
              </div>
            </div>
          </Link>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-border/75 bg-card/80 p-8 text-center">
            <p className="text-lg font-semibold">No contests match the current criteria</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try changing the search keyword, filter status, or sort mode.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


