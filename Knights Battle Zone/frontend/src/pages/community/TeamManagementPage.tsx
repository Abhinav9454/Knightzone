import { useCallback, useEffect, useMemo, useState } from "react";
import { teamApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, ShieldCheck, Trophy, UserPlus, Users } from "lucide-react";
import type { Team } from "@/lib/types";

export default function TeamManagementPage() {
  const [creating, setCreating] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "name" | "contests">("score");
  const [inviteByTeam, setInviteByTeam] = useState<Record<number, string>>({});
  const [busyTeamId, setBusyTeamId] = useState<number | null>(null);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await teamApi.getAll();
      setTeams(res.data);
    } catch {
      toast.error("Unable to load teams right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  const handleCreate = async () => {
    const normalizedName = teamName.trim();
    if (normalizedName.length < 3) {
      toast.error("Team name must be at least 3 characters.");
      return;
    }
    setBusyTeamId(-1);
    try {
      const res = await teamApi.create(normalizedName);
      setTeams((prev) => [res.data, ...prev]);
      toast.success(`Team "${normalizedName}" created.`);
      setCreating(false);
      setTeamName("");
    } catch {
      toast.error("Unable to create team right now.");
    } finally {
      setBusyTeamId(null);
    }
  };

  const handleInvite = async (teamId: number) => {
    const userId = Number(inviteByTeam[teamId] || "");
    if (!Number.isInteger(userId) || userId <= 0) {
      toast.error("Enter a valid numeric user ID.");
      return;
    }
    setBusyTeamId(teamId);
    try {
      await teamApi.invite(teamId, userId);
      toast.success("Invitation sent.");
      setInviteByTeam((prev) => ({ ...prev, [teamId]: "" }));
      await loadTeams();
    } catch {
      toast.error("Unable to send invite.");
    } finally {
      setBusyTeamId(null);
    }
  };

  const summary = useMemo(() => {
    const totalMembers = teams.reduce((sum, team) => sum + team.members.length, 0);
    const averageScore = teams.length > 0
      ? Math.round(teams.reduce((sum, team) => sum + team.score, 0) / teams.length)
      : 0;
    const captainCount = teams.reduce(
      (sum, team) => sum + team.members.filter((member) => member.role.toLowerCase() === "captain").length,
      0,
    );
    return {
      totalTeams: teams.length,
      totalMembers,
      averageScore,
      captainCount,
    };
  }, [teams]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredTeams = useMemo(() => {
    const filtered = teams.filter((team) => {
      if (!normalizedQuery) {
        return true;
      }
      if (team.name.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
      return team.members.some((member) => member.name.toLowerCase().includes(normalizedQuery));
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "contests") {
        return b.contestsPlayed - a.contestsPlayed;
      }
      return b.score - a.score;
    });
  }, [teams, normalizedQuery, sortBy]);

  return (
    <div className="space-y-6 page-transition">
      <section className="page-shell space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="hero-chip mb-3">Collaboration Workspace</p>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="text-primary" />
              Team Management
            </h1>
            <p className="text-muted-foreground">
              Build squads, assign ownership, and track team performance.
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setCreating((prev) => !prev)}
          >
            <Plus size={14} />
            {creating ? "Close" : "New Team"}
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Total Teams</p>
            <p className="text-2xl font-bold">{summary.totalTeams}</p>
          </div>
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Total Members</p>
            <p className="text-2xl font-bold">{summary.totalMembers}</p>
          </div>
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Average Score</p>
            <p className="text-2xl font-bold">{summary.averageScore}</p>
          </div>
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Captains</p>
            <p className="text-2xl font-bold">{summary.captainCount}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
              placeholder="Search team or member"
            />
          </div>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Sort by</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as "score" | "name" | "contests")}
              className="w-full"
            >
              <option value="score">Score</option>
              <option value="contests">Contests Played</option>
              <option value="name">Team Name</option>
            </select>
          </label>
        </div>
      </section>

      {creating && (
        <section className="glass-card p-4 space-y-3">
          <h2 className="font-semibold">Create New Team</h2>
          <div className="flex flex-wrap gap-3">
            <Input
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="Enter team name"
              className="max-w-xl bg-muted"
            />
            <Button disabled={busyTeamId === -1} onClick={() => void handleCreate()}>
              {busyTeamId === -1 ? "Creating..." : "Create Team"}
            </Button>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </section>
      )}

      <div className="grid gap-4">
        {!loading && filteredTeams.length === 0 && (
          <div className="glass-card p-4 text-sm text-muted-foreground">
            No teams found for this filter. Create your first team to start collaboration.
          </div>
        )}
        {filteredTeams.map((team) => (
          <section key={team.id} className="glass-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-lg">{team.name}</h3>
                <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Trophy size={14} className="text-accent" />
                    {team.score} pts
                  </span>
                  <span>{team.contestsPlayed} contests</span>
                </p>
              </div>
              <Badge variant="outline" className="gap-1">
                <ShieldCheck size={12} />
                Team #{team.id}
              </Badge>
            </div>

            <div className="grid gap-2">
              {team.members.map((member) => (
                <div key={member.userId} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <span className="font-medium">{member.name}</span>
                  <Badge variant={member.role === "Captain" ? "default" : "outline"} className="text-xs">
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="grid gap-2 md:grid-cols-[220px_auto]">
              <Input
                type="number"
                min={1}
                value={inviteByTeam[team.id] || ""}
                onChange={(event) =>
                  setInviteByTeam((prev) => ({ ...prev, [team.id]: event.target.value }))
                }
                placeholder="Invite user ID"
              />
              <Button
                variant="outline"
                className="gap-2 md:w-fit"
                disabled={busyTeamId === team.id}
                onClick={() => void handleInvite(team.id)}
              >
                <UserPlus size={14} />
                {busyTeamId === team.id ? "Sending..." : "Invite Member"}
              </Button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
