import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Users, Search, ShieldCheck } from "lucide-react";
import { ClubCard } from "@/components/clubs/ClubCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { clubApi } from "@/lib/api";
import { useRealtimeRefresh } from "@/lib/realtime";
import type { ClubSummary, ClubVisibility } from "@/lib/types";

type ClubFilter = "ALL" | "JOINED" | "PUBLIC" | "PRIVATE";
type ClubSort = "MEMBERS_DESC" | "NAME_ASC";

export default function ClubsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const isSimpleContext = location.pathname.startsWith("/simple");

  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joiningClubId, setJoiningClubId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ClubFilter>("ALL");
  const [sortBy, setSortBy] = useState<ClubSort>("MEMBERS_DESC");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<ClubVisibility>("PUBLIC");

  const toScopedClubPath = (clubId: number) => (isSimpleContext ? `/simple/clubs/${clubId}` : `/clubs/${clubId}`);

  const loadClubs = useCallback(async () => {
    try {
      const data = await clubApi.listClubs();
      setClubs(data);
    } catch {
      toast.error("Unable to load clubs right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useRealtimeRefresh(loadClubs, { intervalMs: 10000, scope: "clubs" });

  const createClub = async () => {
    if (!isAdmin) {
      toast.error("Only admin can create clubs.");
      return;
    }

    if (!name.trim()) {
      toast.error("Club name is required.");
      return;
    }

    setCreating(true);
    try {
      const created = await clubApi.createClub({
        name: name.trim(),
        description: description.trim() || undefined,
        visibility,
      });
      toast.success("Club created successfully.");
      setName("");
      setDescription("");
      setVisibility("PUBLIC");
      navigate(toScopedClubPath(created.id));
    } catch {
      toast.error("Unable to create club.");
    } finally {
      setCreating(false);
    }
  };

  const joinClub = async (clubId: number) => {
    setJoiningClubId(clubId);
    try {
      await clubApi.joinClub(clubId);
      toast.success("Joined club.");
      await loadClubs();
    } catch {
      toast.error("Unable to join club.");
    } finally {
      setJoiningClubId(null);
    }
  };

  const summary = useMemo(() => {
    const joined = clubs.filter((club) => club.joined).length;
    const publicCount = clubs.filter((club) => club.visibility === "PUBLIC").length;
    const privateCount = clubs.filter((club) => club.visibility === "PRIVATE").length;
    const totalMembers = clubs.reduce((sum, club) => sum + club.memberCount, 0);

    return {
      total: clubs.length,
      joined,
      publicCount,
      privateCount,
      totalMembers,
    };
  }, [clubs]);

  const visibleClubs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = clubs.filter((club) => {
      if (filter === "JOINED" && !club.joined) return false;
      if (filter === "PUBLIC" && club.visibility !== "PUBLIC") return false;
      if (filter === "PRIVATE" && club.visibility !== "PRIVATE") return false;

      if (!normalizedSearch) return true;
      return (
        club.name.toLowerCase().includes(normalizedSearch) ||
        (club.description || "").toLowerCase().includes(normalizedSearch)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "NAME_ASC") return a.name.localeCompare(b.name);
      return b.memberCount - a.memberCount;
    });
  }, [clubs, filter, search, sortBy]);

  return (
    <div className="space-y-6">
      <section className="dashboard-hero rounded-2xl border border-border/75 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="hero-chip mb-3">
              <Users className="h-3.5 w-3.5" />
              Community Workspace
            </span>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">Guilds and Clubs</h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              Build focused peer groups, run structured activities, and track member engagement.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <article className="metric-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Total Clubs</p>
            <p className="mt-1 text-2xl font-bold">{summary.total}</p>
          </article>
          <article className="metric-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Joined</p>
            <p className="mt-1 text-2xl font-bold">{summary.joined}</p>
          </article>
          <article className="metric-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Public</p>
            <p className="mt-1 text-2xl font-bold">{summary.publicCount}</p>
          </article>
          <article className="metric-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Private</p>
            <p className="mt-1 text-2xl font-bold">{summary.privateCount}</p>
          </article>
          <article className="metric-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Total Members</p>
            <p className="mt-1 text-2xl font-bold">{summary.totalMembers}</p>
          </article>
        </div>
      </section>

      {isAdmin ? (
        <section className="content-panel rounded-xl p-4 md:p-5">
          <h2 className="text-lg font-semibold">Create a Club</h2>
          <p className="mt-1 text-sm text-muted-foreground">Define club identity, visibility, and onboarding space.</p>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              Club Name
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Velocity Coders"
              />
            </label>
            <label className="text-sm">
              Visibility
              <select
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as ClubVisibility)}
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </label>
            <label className="text-sm md:col-span-2">
              Description
              <textarea
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Focus area, activity model, and expected member outcomes"
              />
            </label>
          </div>

          <Button className="mt-3" disabled={creating} onClick={() => void createClub()}>
            {creating ? "Creating..." : "Create Club"}
          </Button>
        </section>
      ) : (
        <section className="rounded-xl border border-border/75 bg-card/80 p-4">
          <h2 className="text-lg font-semibold">Club Access Level</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Club creation is available for admin and super admin accounts. Students can join and participate in existing clubs.
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Membership actions remain fully available.
          </p>
        </section>
      )}

      <section className="content-panel rounded-xl p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search clubs by name or description"
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(["ALL", "JOINED", "PUBLIC", "PRIVATE"] as ClubFilter[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  filter === item
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "MEMBERS_DESC", label: "Most Members" },
              { id: "NAME_ASC", label: "Name" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSortBy(item.id as ClubSort)}
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
      </section>

      <section>
        <h2 className="text-lg font-semibold">Explore Clubs</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleClubs.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                joining={joiningClubId === club.id}
                onJoin={joinClub}
                onOpen={(id) => navigate(toScopedClubPath(id))}
              />
            ))}

            {visibleClubs.length === 0 && (
              <div className="md:col-span-2 xl:col-span-3 rounded-xl border border-border/75 bg-card/80 p-8 text-center">
                <p className="text-lg font-semibold">No clubs found for this filter</p>
                <p className="mt-1 text-sm text-muted-foreground">Try another search keyword or filter.</p>
              </div>
            )}
          </div>
      </section>
    </div>
  );
}

