import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { duelApi, userApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeRefresh } from "@/lib/realtime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { connectUserMatchRealtime } from "@/lib/matchRealtime";
import {
  Activity,
  Brain,
  Check,
  GanttChartSquare,
  Flag,
  GitBranch,
  Loader2,
  MessageSquareWarning,
  ShieldAlert,
  Play,
  Plus,
  Search,
  Sword,
  Target,
  Timer,
  Trophy,
  Crown,
  X,
  type LucideIcon,
} from "lucide-react";
import type {
  Duel,
  DuelAdvancedLeaderboardEntry,
  DuelFairPlaySummary,
  DuelMatchQuality,
  IntegrationStats,
  PlatformAnalytics,
  User,
} from "@/lib/types";
import { getApiErrorMessage } from "@/lib/error";
import { isAdminRole } from "@/lib/auth-role";
import DuelQuestionVaultPanel from "@/components/duels/DuelQuestionVaultPanel";
import DuelEliteArenaPanel from "@/components/duels/DuelEliteArenaPanel";
import DuelProLabsPanel from "@/components/duels/DuelProLabsPanel";

type Mode = "CODING" | "TYPING" | "QUIZ";
type DuelView = "PLAY" | "ARENA" | "QUESTIONS" | "ELITE" | "LABS" | "RANKINGS" | "ANALYTICS" | "HISTORY";
type DuelWorkspace = "hub" | "play" | "arena" | "questions" | "elite" | "labs" | "rankings" | "analytics" | "history";
type DuelWorkspaceCard = {
  id: Exclude<DuelWorkspace, "hub">;
  view: DuelView;
  title: string;
  description: string;
  actionLabel: string;
  icon: LucideIcon;
};

const DUEL_VIEW_TO_WORKSPACE: Record<DuelView, Exclude<DuelWorkspace, "hub">> = {
  PLAY: "play",
  ARENA: "arena",
  QUESTIONS: "questions",
  ELITE: "elite",
  LABS: "labs",
  RANKINGS: "rankings",
  ANALYTICS: "analytics",
  HISTORY: "history",
};

const DUEL_WORKSPACE_TO_VIEW: Record<Exclude<DuelWorkspace, "hub">, DuelView> = {
  play: "PLAY",
  arena: "ARENA",
  questions: "QUESTIONS",
  elite: "ELITE",
  labs: "LABS",
  rankings: "RANKINGS",
  analytics: "ANALYTICS",
  history: "HISTORY",
};

const DUEL_ROUTE_SEGMENTS: ReadonlyArray<Exclude<DuelWorkspace, "hub">> = [
  "play",
  "arena",
  "questions",
  "elite",
  "labs",
  "rankings",
  "analytics",
  "history",
];

const getDuelsBasePath = (pathname: string) =>
  pathname.startsWith("/simple/") ? "/simple/duels" : "/duels";

const getDuelWorkspaceFromPath = (pathname: string): DuelWorkspace => {
  const segments = pathname.toLowerCase().split("/").filter(Boolean);
  const duelsIndex = segments.lastIndexOf("duels");
  const workspaceSegment = duelsIndex >= 0 ? segments[duelsIndex + 1] : "";
  if (DUEL_ROUTE_SEGMENTS.includes(workspaceSegment as Exclude<DuelWorkspace, "hub">)) {
    return workspaceSegment as Exclude<DuelWorkspace, "hub">;
  }
  return "hub";
};

const DUEL_WORKSPACE_CARDS: DuelWorkspaceCard[] = [
  {
    id: "play",
    view: "PLAY",
    title: "Play Lobby",
    description: "Manage matchmaking, custom challenges, and pending invites.",
    actionLabel: "Open play lobby",
    icon: Play,
  },
  {
    id: "arena",
    view: "ARENA",
    title: "Live Arena",
    description: "Select an active duel, submit scores, and perform match actions.",
    actionLabel: "Open arena",
    icon: Sword,
  },
  {
    id: "questions",
    view: "QUESTIONS",
    title: "Question Vault",
    description: "Access a 3000+ question bank with strict MCQ checks and duel-ready packs.",
    actionLabel: "Open vault",
    icon: Target,
  },
  {
    id: "elite",
    view: "ELITE",
    title: "Elite Arena",
    description: "Timed pressure duels, rival simulator, and pro match reports.",
    actionLabel: "Open elite arena",
    icon: Crown,
  },
  {
    id: "labs",
    view: "LABS",
    title: "Pro Labs",
    description: "Adaptive pack builder, ELO simulator, and IIT sprint tracks.",
    actionLabel: "Open pro labs",
    icon: Brain,
  },
  {
    id: "rankings",
    view: "RANKINGS",
    title: "Rankings",
    description: "Track leaderboards, skill tiers, and fair-play standings.",
    actionLabel: "Open rankings",
    icon: Trophy,
  },
  {
    id: "analytics",
    view: "ANALYTICS",
    title: "Analytics",
    description: "Review engagement, retention, and integration analytics.",
    actionLabel: "Open analytics",
    icon: Activity,
  },
  {
    id: "history",
    view: "HISTORY",
    title: "History",
    description: "Review completed duels and the full results timeline.",
    actionLabel: "Open history",
    icon: Timer,
  },
];

type DuelLeaderboardEntry = {
  userId: number;
  username: string;
  rating: number;
  wins: number;
  losses: number;
  totalDuels: number;
};

const formatScore = (score?: number | null) =>
  typeof score === "number" ? score.toString() : "Pending";

const formatRemainingTime = (totalSeconds?: number | null) => {
  const safeSeconds = Math.max(0, totalSeconds ?? 0);
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function DuelsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeWorkspace = getDuelWorkspaceFromPath(location.pathname);
  const duelsBasePath = getDuelsBasePath(location.pathname);
  const activeWorkspace = routeWorkspace;
  const activeView: DuelView =
    activeWorkspace === "hub" ? "PLAY" : DUEL_WORKSPACE_TO_VIEW[activeWorkspace];
  const [duels, setDuels] = useState<Duel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [leaderboard, setLeaderboard] = useState<DuelLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedOpponentId, setSelectedOpponentId] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("CODING");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [durationSeconds, setDurationSeconds] = useState(300);
  const [submitting, setSubmitting] = useState(false);
  const [activeDuelId, setActiveDuelId] = useState<number | null>(null);
  const [myScoreInput, setMyScoreInput] = useState("80");
  const [advancedLeaderboard, setAdvancedLeaderboard] = useState<DuelAdvancedLeaderboardEntry[]>([]);
  const [matchQuality, setMatchQuality] = useState<DuelMatchQuality | null>(null);
  const [fairPlaySummary, setFairPlaySummary] = useState<DuelFairPlaySummary | null>(null);
  const [platformAnalytics, setPlatformAnalytics] = useState<PlatformAnalytics | null>(null);
  const [integrationStats, setIntegrationStats] = useState<IntegrationStats[]>([]);

  const hasLoadErrorToast = useRef(false);

  const loadData = useCallback(async () => {
    try {
      const [duelData, userRes, board, advancedBoard, quality, fairPlay, analytics] = await Promise.all([
        duelApi.getAll(),
        userApi.getAll().catch(() => ({ data: [] as User[] })),
        duelApi.leaderboard("all", 10).catch(() => [] as DuelLeaderboardEntry[]),
        duelApi.advancedLeaderboard(12).catch(() => [] as DuelAdvancedLeaderboardEntry[]),
        duelApi.matchQuality({ mode, difficulty, durationSeconds, maxRatingGap: 300 }).catch(() => null),
        duelApi.fairPlaySummary().catch(() => null),
        duelApi.platformAnalytics().catch(() => null),
      ]);
      setDuels(duelData);
      setUsers(userRes.data);
      setLeaderboard(board);
      setAdvancedLeaderboard(advancedBoard);
      setMatchQuality(quality);
      setFairPlaySummary(fairPlay);
      setPlatformAnalytics(analytics);

      if (user?.username) {
        const [discord, github] = await Promise.all([
          duelApi.integrationStats("discord", user.username).catch(() => null),
          duelApi.integrationStats("github", user.username).catch(() => null),
        ]);
        setIntegrationStats([discord, github].filter(Boolean) as IntegrationStats[]);
      } else {
        setIntegrationStats([]);
      }
      hasLoadErrorToast.current = false;
      return true;
    } catch {
      if (!hasLoadErrorToast.current) {
        toast.error("Unable to load duel data.");
        hasLoadErrorToast.current = true;
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [difficulty, durationSeconds, mode, user?.username]);

  useRealtimeRefresh(loadData, {
    intervalMs: 15000,
    maxIntervalMs: 75000,
    backoffMultiplier: 1.7,
    jitterRatio: 0.2,
    scope: "duels",
  });

  useEffect(() => {
    if (!user?.id) return undefined;
    const connection = connectUserMatchRealtime(user.id, {
      onUpdate: () => {
        void loadData();
      },
    });
    return () => {
      connection.close();
    };
  }, [loadData, user?.id]);

  useEffect(() => {
    if (!activeDuelId) return;
    const activeDuel = duels.find((duel) => duel.id === activeDuelId);
    if (!activeDuel || activeDuel.status !== "ACTIVE") {
      setActiveDuelId(null);
    }
  }, [activeDuelId, duels]);

  const availableOpponents = useMemo(
    () =>
      users
        .filter((candidate) => candidate.id !== user?.id)
        .filter((candidate) => {
          const name = candidate.name || "";
          return name.toLowerCase().includes(query.toLowerCase());
        }),
    [users, user?.id, query],
  );
  const canCreateCustomDuel = availableOpponents.length > 0;

  const myDuels = useMemo(
    () =>
      duels.filter(
        (duel) => duel.challengerId === user?.id || duel.opponentId === user?.id,
      ),
    [duels, user?.id],
  );

  const pendingDuels = useMemo(
    () => myDuels.filter((duel) => duel.status === "PENDING"),
    [myDuels],
  );
  const incomingPendingDuels = useMemo(
    () => pendingDuels.filter((duel) => duel.opponentId === user?.id),
    [pendingDuels, user?.id],
  );
  const outgoingPendingDuels = useMemo(
    () => pendingDuels.filter((duel) => duel.challengerId === user?.id),
    [pendingDuels, user?.id],
  );
  const activeDuels = useMemo(
    () => myDuels.filter((duel) => duel.status === "ACTIVE"),
    [myDuels],
  );
  const completedDuels = useMemo(
    () =>
      myDuels
        .filter(
          (duel) => duel.status === "COMPLETED" || duel.status === "ABANDONED",
        )
        .sort(
          (a, b) =>
            new Date(b.completedAt || b.createdAt).getTime() -
            new Date(a.completedAt || a.createdAt).getTime(),
        ),
    [myDuels],
  );

  const wins = completedDuels.filter((duel) => duel.winnerId === user?.id).length;
  const losses = completedDuels.filter(
    (duel) => duel.winnerId && duel.winnerId !== user?.id,
  ).length;
  const draws = completedDuels.filter((duel) => !duel.winnerId).length;
  const total = completedDuels.length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  const selectedDuel = useMemo(() => {
    if (!activeDuelId) return null;
    return activeDuels.find((duel) => duel.id === activeDuelId) || null;
  }, [activeDuelId, activeDuels]);

  const myAdvancedEntry = useMemo(
    () => advancedLeaderboard.find((entry) => entry.userId === user?.id),
    [advancedLeaderboard, user?.id],
  );

  const canOpenAdmin = isAdminRole(user?.role);
  const isFullscreen = searchParams.get("fullscreen") === "1";
  const workspacePath = useCallback(
    (workspace: DuelWorkspace) => (workspace === "hub" ? duelsBasePath : `${duelsBasePath}/${workspace}`),
    [duelsBasePath],
  );

  const navigateToWorkspace = useCallback((workspace: DuelWorkspace, replace = false) => {
    const pathname = workspace === "hub" ? duelsBasePath : `${duelsBasePath}/${workspace}`;
    const search = searchParams.toString();
    navigate({ pathname, search: search ? `?${search}` : "" }, { replace });
  }, [duelsBasePath, navigate, searchParams]);

  const openDuelWorkspace = useCallback((view: DuelView) => {
    navigateToWorkspace(DUEL_VIEW_TO_WORKSPACE[view]);
  }, [navigateToWorkspace]);

  const activeWorkspaceCard = useMemo(
    () => DUEL_WORKSPACE_CARDS.find((card) => card.id === activeWorkspace) ?? null,
    [activeWorkspace],
  );

  const openFullscreen = (duelId?: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("fullscreen", "1");
    if (duelId) {
      next.set("duelId", String(duelId));
    } else {
      next.delete("duelId");
    }
    setSearchParams(next, { replace: true });
  };

  const closeFullscreen = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("fullscreen");
    next.delete("duelId");
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const duelIdParam = Number(searchParams.get("duelId"));
    if (!Number.isFinite(duelIdParam) || duelIdParam <= 0) return;
    const existsInMyDuels = myDuels.some((duel) => duel.id === duelIdParam);
    if (existsInMyDuels && activeDuelId !== duelIdParam) {
      setActiveDuelId(duelIdParam);
      openDuelWorkspace("ARENA");
    }
  }, [searchParams, myDuels, activeDuelId, openDuelWorkspace]);

  useEffect(() => {
    if (activeDuelId || !activeDuels.length) return;
    setActiveDuelId(activeDuels[0].id);
  }, [activeDuelId, activeDuels]);

  useEffect(() => {
    if (isFullscreen) {
      openDuelWorkspace("ARENA");
    }
  }, [isFullscreen, openDuelWorkspace]);

  const sendChallenge = async () => {
    if (!selectedOpponentId) {
      toast.error("Select a user first.");
      return;
    }
    try {
      setSubmitting(true);
      await duelApi.challenge({
        opponentId: selectedOpponentId,
        mode,
        difficulty,
        durationSeconds,
      });
      toast.success("Challenge sent.");
      await loadData();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Could not send challenge."));
    } finally {
      setSubmitting(false);
    }
  };

  const joinMatchmaking = async () => {
    try {
      setSubmitting(true);
      const duel = await duelApi.matchmaking({
        mode,
        difficulty,
        durationSeconds,
        maxRatingGap: 300,
      });

      if (duel.status === "ACTIVE") {
        toast.success("Match found. Duel started.");
        setActiveDuelId(duel.id);
        openDuelWorkspace("ARENA");
        openFullscreen(duel.id);
      } else {
        toast.success("Added to matchmaking queue.");
      }

      await loadData();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Matchmaking failed."));
    } finally {
      setSubmitting(false);
    }
  };

  const accept = async (id: number) => {
    try {
      const duel = await duelApi.accept(id);
      setActiveDuelId(duel.id);
      openDuelWorkspace("ARENA");
      openFullscreen(duel.id);
      toast.success("Duel accepted. Arena is live.");
      await loadData();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Could not accept duel."));
    }
  };

  const decline = async (id: number) => {
    try {
      await duelApi.decline(id);
      toast.info("Duel declined.");
      await loadData();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Could not decline duel."));
    }
  };

  const submitScore = async () => {
    if (!selectedDuel) return;

    const parsed = Number(myScoreInput);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      toast.error("Score should be between 0 and 100.");
      return;
    }

    try {
      setSubmitting(true);
      const updated = await duelApi.submit(selectedDuel.id, {
        score: parsed,
        completed: true,
      });
      toast.success("Score submitted.");
      if (updated.status === "COMPLETED") {
        toast.success(`Duel completed. Winner: ${updated.winner || "Draw"}`);
      }
      await loadData();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Could not submit score."));
    } finally {
      setSubmitting(false);
    }
  };

  const abandon = async () => {
    if (!selectedDuel) return;

    try {
      setSubmitting(true);
      await duelApi.abandon(selectedDuel.id);
      toast.info("You abandoned this duel.");
      setActiveDuelId(null);
      await loadData();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Could not abandon duel."));
    } finally {
      setSubmitting(false);
    }
  };

  const reportSuspicious = async () => {
    if (!selectedDuel || !user?.id) {
      toast.error("Select an active duel first.");
      return;
    }

    const reportedUserId = selectedDuel.challengerId === user.id
      ? selectedDuel.opponentId
      : selectedDuel.challengerId;

    if (!reportedUserId) {
      toast.error("Opponent not available for this duel.");
      return;
    }

    try {
      setSubmitting(true);
      await duelApi.reportFairPlay({
        duelId: selectedDuel.id,
        reportedUserId,
        reason: "Suspicious gameplay pattern observed in duel.",
      });
      toast.success("Community report submitted.");
      await loadData();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Could not submit report."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-gradient-to-r from-primary/20 via-accent/10 to-success/15 p-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Sword className="text-primary" />
          Duels - Face Your Rival
        </h1>
        <p className="mt-1 text-muted-foreground">
          Real-time 1v1 battles across Coding, Typing, and Quiz modes.
        </p>
        <div className="mt-3">
          {isFullscreen ? (
            <Button variant="outline" size="sm" onClick={closeFullscreen}>
              Exit full screen
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => openFullscreen(activeDuelId ?? undefined)}>
              Open full screen
            </Button>
          )}
        </div>
      </section>

      {activeWorkspace === "hub" ? (
        <section className="glass-card p-4">
          <h2 className="text-base font-semibold">Choose Duel Workspace</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Open one workspace at a time. Each card opens its own dedicated route.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-8">
            {DUEL_WORKSPACE_CARDS.map((card) => (
              <Link
                key={card.id}
                to={workspacePath(card.id)}
                className="rounded-xl border border-border bg-background p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5"
              >
                <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <card.icon className="h-4 w-4" />
                </span>
                <p className="text-sm font-semibold">{card.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
                <p className="mt-3 text-xs font-semibold text-primary">{card.actionLabel}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="glass-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Active Workspace</p>
              <p className="text-base font-semibold">{activeWorkspaceCard?.title || "Duel Workflow"}</p>
              <p className="text-sm text-muted-foreground">{activeWorkspaceCard?.description || "Continue your duel flow."}</p>
            </div>
            <Button asChild type="button" variant="outline">
              <Link to={workspacePath("hub")}>Back to cards</Link>
            </Button>
          </div>
        </section>
      )}

      {activeWorkspace !== "hub" && (
      <>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Rating</p>
          <p className="text-2xl font-bold">{user?.rating ?? 1000}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Wins</p>
          <p className="text-2xl font-bold text-success">{wins}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Losses</p>
          <p className="text-2xl font-bold text-destructive">{losses}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Win Rate</p>
          <p className="text-2xl font-bold">{winRate}%</p>
          <p className="text-[11px] text-muted-foreground">Draws: {draws}</p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Skill Rank</p>
          <p className="text-2xl font-bold">
            {myAdvancedEntry?.skillTier || "BRONZE"}
          </p>
          <p className="text-[11px] text-muted-foreground">ELO + decay adjusted tier</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Effective Rating</p>
          <p className="text-2xl font-bold">
            {myAdvancedEntry?.effectiveRating ?? (user?.rating ?? 1000)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Decay penalty: {myAdvancedEntry?.rankDecayPenalty ?? 0}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Matchmaking ETA</p>
          <p className="text-2xl font-bold">{matchQuality?.estimatedWaitSeconds ?? 0}s</p>
          <p className="text-[11px] text-muted-foreground">
            Pool: {matchQuality?.queuePoolSize ?? 0} | Risk: {matchQuality?.rankDecayRisk ?? "LOW"}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Fair Play Flags</p>
          <p className="text-2xl font-bold">{fairPlaySummary?.openFlagsAgainstUser ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">
            Total: {fairPlaySummary?.totalFlagsAgainstUser ?? 0} | Reports: {fairPlaySummary?.reportsSubmitted ?? 0}
          </p>
        </div>
      </section>

      {(activeView === "PLAY" || activeView === "ARENA") && (
      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        {activeView === "PLAY" && (
        <div className="space-y-4">
          <div className="glass-card space-y-3 p-4">
            <h2 className="font-semibold">Duel Lobby</h2>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Mode</Label>
                <select
                  value={mode}
                  onChange={(event) => setMode(event.target.value as Mode)}
                  className="mt-1 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm"
                >
                  <option value="CODING">Coding</option>
                  <option value="TYPING">Typing</option>
                  <option value="QUIZ">Quiz</option>
                </select>
              </div>

              <div>
                <Label>Difficulty</Label>
                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm"
                >
                  <option value="ANY">Any</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>

              <div>
                <Label>Duration</Label>
                <select
                  value={durationSeconds}
                  onChange={(event) => setDurationSeconds(Number(event.target.value))}
                  className="mt-1 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm"
                >
                  <option value={120}>2 min</option>
                  <option value={300}>5 min</option>
                  <option value={600}>10 min</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={joinMatchmaking} disabled={submitting} className="gap-2">
                <Search size={14} />
                Find Match
              </Button>
              <Button
                onClick={sendChallenge}
                disabled={submitting || !canCreateCustomDuel}
                variant="outline"
                className="gap-2"
              >
                <Plus size={14} />
                Create Custom Duel
              </Button>
            </div>
            {!canCreateCustomDuel && (
              <p className="text-xs text-muted-foreground">
                Opponent directory unavailable right now. Use Find Match to start instantly.
              </p>
            )}

            <div className="border-t border-border pt-3">
              <Label>Select Opponent (for custom duel)</Label>
              <Input
                className="mt-2"
                placeholder="Search user by name..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />

              <div className="mt-2 max-h-36 space-y-1 overflow-y-auto">
                {availableOpponents.slice(0, 8).map((candidate) => (
                  <button
                    key={candidate.id}
                    onClick={() => setSelectedOpponentId(candidate.id)}
                    className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                      selectedOpponentId === candidate.id
                        ? "bg-primary/20 text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    {candidate.name} <span className="text-muted-foreground">({candidate.email})</span>
                  </button>
                ))}
                {!availableOpponents.length && (
                  <p className="px-1 py-2 text-xs text-muted-foreground">No users found.</p>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card space-y-3 p-4">
            <h2 className="font-semibold">Pending Challenges</h2>
            {pendingDuels.length === 0 && (
              <p className="text-sm text-muted-foreground">No pending invites.</p>
            )}

            {incomingPendingDuels.map((duel) => (
              <div
                key={duel.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    Challenge from {duel.challengerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {duel.mode} - {duel.difficulty} - {Math.round((duel.durationSeconds || 300) / 60)} min
                  </p>
                  {duel.inviteCode && (
                    <p className="text-xs text-primary">Invite Code: {duel.inviteCode}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" onClick={() => accept(duel.id)} className="gap-1">
                    <Check size={14} />
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => decline(duel.id)} className="gap-1">
                    <X size={14} />
                    Decline
                  </Button>
                </div>
              </div>
            ))}

            {outgoingPendingDuels.length > 0 && (
              <div className="space-y-2 rounded-md border border-border/70 bg-muted/20 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sent challenges</p>
                {outgoingPendingDuels.map((duel) => (
                  <div key={duel.id} className="flex items-center justify-between rounded border border-border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{duel.opponentName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {duel.mode} - {duel.difficulty}
                      </p>
                    </div>
                    <Badge variant="outline">Waiting</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        <div className={`space-y-4 ${activeView === "ARENA" ? "xl:col-span-2" : ""}`}>
          {activeView === "ARENA" && (
          <div className="glass-card p-4">
            <h2 className="mb-3 font-semibold">Duel Arena</h2>

            {!selectedDuel && (
              <>
                <p className="mb-3 text-sm text-muted-foreground">Choose an active duel to play.</p>
                <div className="space-y-2">
                  {activeDuels.map((duel) => (
                    <button
                      key={duel.id}
                      onClick={() => {
                        setActiveDuelId(duel.id);
                        openDuelWorkspace("ARENA");
                        openFullscreen(duel.id);
                      }}
                      className="w-full rounded-md border border-border p-3 text-left hover:bg-muted/40"
                    >
                      <p className="text-sm font-medium">
                        {duel.challengerName} vs {duel.opponentName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {duel.mode} - {duel.problemTitle || "Challenge Arena"}
                      </p>
                    </button>
                  ))}
                  {!activeDuels.length && (
                    <p className="text-xs text-muted-foreground">No active duel right now.</p>
                  )}
                </div>
              </>
            )}

            {selectedDuel && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {selectedDuel.challengerName} vs {selectedDuel.opponentName}
                  </p>
                  <Badge className="bg-success/15 text-success">LIVE</Badge>
                </div>

                <p className="text-sm text-muted-foreground">
                  Mode: {selectedDuel.mode} - Difficulty: {selectedDuel.difficulty}
                </p>
                <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <Timer size={14} />
                  Remaining: {formatRemainingTime(selectedDuel.remainingSeconds ?? selectedDuel.durationSeconds ?? 300)}
                </p>

                {selectedDuel.problemId && (
                  <Button variant="outline" asChild className="w-full">
                    <Link to={`/problems/${selectedDuel.problemId}`} className="inline-flex items-center gap-2">
                      <Play size={14} />
                      Open Problem Arena
                    </Link>
                  </Button>
                )}

                <div className="space-y-2 rounded-md border border-border p-3">
                  <Label>Your Score (0-100)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={myScoreInput}
                    onChange={(event) => setMyScoreInput(event.target.value)}
                    placeholder="Enter score"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={submitScore} disabled={submitting} className="gap-1">
                      <Target size={14} />
                      Submit Score
                    </Button>
                    <Button variant="outline" onClick={abandon} disabled={submitting} className="gap-1">
                      <Flag size={14} />
                      Abandon
                    </Button>
                    <Button variant="outline" onClick={reportSuspicious} disabled={submitting} className="gap-1">
                      <ShieldAlert size={14} />
                      Report
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border border-border p-3 text-sm">
                  <p>Current Scores:</p>
                  <p className="text-muted-foreground">
                    {selectedDuel.challengerName}: {formatScore(selectedDuel.player1Score)}
                  </p>
                  <p className="text-muted-foreground">
                    {selectedDuel.opponentName}: {formatScore(selectedDuel.player2Score)}
                  </p>
                </div>
              </div>
            )}
          </div>
          )}

          {activeView === "PLAY" && (
          <div className="glass-card p-4">
            <h2 className="mb-2 font-semibold">Top Players</h2>
            <div className="space-y-2">
              {leaderboard.slice(0, 8).map((entry, index) => (
                <div
                  key={entry.userId}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <p className="text-sm">
                    #{index + 1} {entry.username}
                  </p>
                  <p className="font-mono text-sm">{entry.rating} pts</p>
                </div>
              ))}
              {!leaderboard.length && (
                <p className="text-xs text-muted-foreground">Leaderboard unavailable.</p>
              )}
            </div>
          </div>
          )}
        </div>
      </section>
      )}

      {activeView === "QUESTIONS" && <DuelQuestionVaultPanel />}

      {activeView === "ELITE" && <DuelEliteArenaPanel />}

      {activeView === "LABS" && <DuelProLabsPanel />}

      {activeView === "HISTORY" && (
      <section className="glass-card space-y-3 p-4">
        <h2 className="font-semibold">Your Duel Results</h2>

        {completedDuels.slice(0, 12).map((duel) => (
          <div
            key={duel.id}
            className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
          >
            <div>
              <p className="text-sm font-medium">
                {duel.challengerName} vs {duel.opponentName}
              </p>
              <p className="text-xs text-muted-foreground">
                {duel.mode} - {duel.problemTitle || "Arena Challenge"}
              </p>
              <p className="text-xs text-muted-foreground">
                Score: {formatScore(duel.player1Score)} vs {formatScore(duel.player2Score)}
              </p>
            </div>
            <div className="text-right">
              <p className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
                <Trophy size={14} />
                {duel.winner || "Draw"}
              </p>
              {duel.player1RatingAfter && duel.player2RatingAfter && (
                <p className="text-[11px] text-muted-foreground">Ratings updated</p>
              )}
            </div>
          </div>
        ))}

        {!loading && completedDuels.length === 0 && (
          <p className="text-sm text-muted-foreground">No completed duels yet.</p>
        )}
      </section>
      )}

      {activeView === "RANKINGS" && (
      <section className="grid gap-5 xl:grid-cols-2">
        <div className="glass-card p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <GanttChartSquare size={16} />
            Advanced Matchmaking
          </h2>
          <div className="space-y-2">
            {advancedLeaderboard.slice(0, 8).map((entry, index) => (
              <div key={entry.userId} className="flex items-center justify-between rounded border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">#{index + 1} {entry.username}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {entry.skillTier} | W/L {entry.wins}/{entry.losses} | inactive {entry.inactiveDays}d
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{entry.effectiveRating}</p>
                  <p className="text-[11px] text-muted-foreground">base {entry.rating}</p>
                </div>
              </div>
            ))}
            {!advancedLeaderboard.length && <p className="text-xs text-muted-foreground">Advanced ranking unavailable.</p>}
          </div>
          {matchQuality && (
            <div className="mt-3 rounded border border-border p-3 text-sm">
              <p className="font-medium">Match quality recommendation</p>
              <p className="text-muted-foreground">
                Use ~{matchQuality.recommendedRatingGap} rating gap for faster and fair matchmaking.
              </p>
            </div>
          )}
        </div>

        <div className="glass-card p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <MessageSquareWarning size={16} />
            Anti-Cheat & Community Reports
          </h2>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded border border-border p-2">
              <p className="text-[11px] text-muted-foreground">Open Flags</p>
              <p className="text-xl font-bold">{fairPlaySummary?.openFlagsAgainstUser ?? 0}</p>
            </div>
            <div className="rounded border border-border p-2">
              <p className="text-[11px] text-muted-foreground">Total Flags</p>
              <p className="text-xl font-bold">{fairPlaySummary?.totalFlagsAgainstUser ?? 0}</p>
            </div>
            <div className="rounded border border-border p-2">
              <p className="text-[11px] text-muted-foreground">Reports Submitted</p>
              <p className="text-xl font-bold">{fairPlaySummary?.reportsSubmitted ?? 0}</p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {(fairPlaySummary?.recentFlagsAgainstUser || []).slice(0, 6).map((flag) => (
              <div key={flag.id} className="rounded border border-border px-3 py-2">
                <p className="text-sm font-medium">{flag.flagType} - {flag.severity}</p>
                <p className="text-xs text-muted-foreground">{flag.reason}</p>
              </div>
            ))}
            {!fairPlaySummary?.recentFlagsAgainstUser?.length && (
              <p className="text-xs text-muted-foreground">No recent flags. Keep competing fair.</p>
            )}
          </div>
        </div>
      </section>
      )}

      {activeView === "ANALYTICS" && (
      <section className="grid gap-5 xl:grid-cols-2">
        <div className="glass-card p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Activity size={16} />
            Data & Analytics
          </h2>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded border border-border p-2">
              <p className="text-[11px] text-muted-foreground">DAU</p>
              <p className="text-xl font-bold">{platformAnalytics?.retention.dau ?? 0}</p>
            </div>
            <div className="rounded border border-border p-2">
              <p className="text-[11px] text-muted-foreground">WAU</p>
              <p className="text-xl font-bold">{platformAnalytics?.retention.wau ?? 0}</p>
            </div>
            <div className="rounded border border-border p-2">
              <p className="text-[11px] text-muted-foreground">MAU</p>
              <p className="text-xl font-bold">{platformAnalytics?.retention.mau ?? 0}</p>
            </div>
          </div>
          <div className="mt-3 rounded border border-border p-3">
            <p className="text-sm font-medium">Engagement</p>
            <p className="text-xs text-muted-foreground">
              Total duels: {platformAnalytics?.engagement.totalDuels ?? 0} | Completed: {platformAnalytics?.engagement.completedDuels ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">
              Active/Pending: {platformAnalytics?.engagement.activePendingDuels ?? 0} | Avg completion: {platformAnalytics?.engagement.avgCompletionMinutes ?? 0} min
            </p>
          </div>
          <div className="mt-3 space-y-1">
            <p className="text-sm font-medium">Popular passages</p>
            {(platformAnalytics?.popularPassages || []).slice(0, 4).map((passage) => (
              <p key={passage.snippet} className="text-xs text-muted-foreground">
                • {passage.snippet} ({passage.uses})
              </p>
            ))}
          </div>
          <div className="mt-3 space-y-1">
            <p className="text-sm font-medium">Difficulty distribution</p>
            {(platformAnalytics?.difficultyDistribution || []).map((bucket) => (
              <p key={bucket.difficulty} className="text-xs text-muted-foreground">
                • {bucket.difficulty}: {bucket.count}
              </p>
            ))}
          </div>
        </div>

        <div className="glass-card p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <GitBranch size={16} />
            API Integrations
          </h2>
          <p className="text-sm text-muted-foreground">
            Discord bot and GitHub profile badge payloads are available via integration APIs.
          </p>
          <div className="mt-3 space-y-2">
            {integrationStats.map((integration) => (
              <div key={integration.platform} className="rounded border border-border p-3">
                <p className="text-sm font-semibold">{integration.platform}</p>
                <p className="text-xs text-muted-foreground">{integration.summary}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Profile: {integration.profileUrl}</p>
                <p className="text-[11px] text-muted-foreground">Widget: {integration.widgetUrl}</p>
              </div>
            ))}
            {!integrationStats.length && (
              <p className="text-xs text-muted-foreground">Integration payload unavailable for current profile username.</p>
            )}
          </div>
          {user?.username && (
            <div className="mt-3 rounded border border-border p-2 text-[11px] text-muted-foreground">
              <p>API paths:</p>
              <p>/api/duels/integrations/discord/{user.username}</p>
              <p>/api/duels/integrations/github/{user.username}</p>
            </div>
          )}
        </div>
      </section>
      )}

      {canOpenAdmin && activeView === "ANALYTICS" && (
        <section className="rounded-xl border border-border bg-card/60 p-4">
          <h2 className="mb-2 font-semibold">Admin Snapshot</h2>
          <p className="text-sm text-muted-foreground">
            Manage games, users, and reports from Admin panel.
          </p>
          <Button asChild variant="outline" className="mt-2">
            <Link to="/admin">Open Admin Panel</Link>
          </Button>
        </section>
      )}
      </>
      )}
    </div>
  );
}
