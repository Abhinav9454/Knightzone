import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { contestApi, leaderboardApi } from "@/lib/api";
import type { Contest, ContestAccess, ContestFirstSolver, LeaderboardEntry, Problem } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, ArrowLeft, Play, AlertTriangle, Eye, Trophy } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error";
import { useRealtimeRefresh } from "@/lib/realtime";
import { connectLeaderboardRealtime } from "@/lib/leaderboardRealtime";
import { connectSubmissionRealtime } from "@/lib/submissionRealtime";

export default function ContestDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const contestId = Number(id);

  const [contest, setContest] = useState<Contest | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [firstSolvers, setFirstSolvers] = useState<ContestFirstSolver[]>([]);
  const [access, setAccess] = useState<ContestAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [nowMs, setNowMs] = useState(Date.now());
  const hasErrorToast = useRef(false);

  const loadContest = useCallback(async () => {
    if (!Number.isFinite(contestId)) {
      setLoading(false);
      return false;
    }

    try {
      const [contestData, problemData, accessData] = await Promise.all([
        contestApi.getById(contestId),
        contestApi.getProblems(contestId),
        contestApi.getAccess(contestId).catch(() => null as ContestAccess | null),
      ]);
      const [contestLeaderboard, contestFirstSolvers] = await Promise.all([
        leaderboardApi.getByContest(contestId).catch(() => [] as LeaderboardEntry[]),
        leaderboardApi.getFirstSolversByContest(contestId).catch(() => [] as ContestFirstSolver[]),
      ]);

      setContest(contestData);
      setProblems(problemData);
      setLeaderboard(contestLeaderboard);
      setFirstSolvers(contestFirstSolvers);
      setAccess(accessData);
      hasErrorToast.current = false;
      return true;
    } catch {
      if (!hasErrorToast.current) {
        toast.error("Unable to refresh contest data right now.");
        hasErrorToast.current = true;
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useRealtimeRefresh(loadContest, {
    intervalMs: 18000,
    maxIntervalMs: 75000,
    backoffMultiplier: 1.7,
    jitterRatio: 0.2,
    scope: "dashboard",
    enabled: Number.isFinite(contestId),
  });

  useEffect(() => {
    const leaderboardConnection = connectLeaderboardRealtime({
      onUpdate: () => {
        void loadContest();
      },
    });
    return () => {
      leaderboardConnection.close();
    };
  }, [loadContest]);

  useEffect(() => {
    if (!user?.id) return undefined;
    const submissionConnection = connectSubmissionRealtime(user.id, {
      onUpdate: () => {
        void loadContest();
      },
    });
    return () => {
      submissionConnection.close();
    };
  }, [loadContest, user?.id]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleRegister = async () => {
    if (!contest) return;
    try {
      const accessData = await contestApi.register(contest.id);
      setAccess(accessData);
      toast.success("Contest started. Your timer is running now.");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Contest registration endpoint is not available right now."));
    }
  };

  if (!contest) {
    return <div className="text-center py-20 text-muted-foreground">Contest not found</div>;
  }

  const diffColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "difficulty-easy";
      case "MEDIUM":
        return "difficulty-medium";
      case "HARD":
        return "difficulty-hard";
      default:
        return "";
    }
  };

  const myStanding = leaderboard.find((entry) => entry.userId === user?.id);
  const canAccessProblems = contest.status !== "ONGOING" || !!access?.registered;
  const firstProblemId = problems[0]?.id;
  const contestEndMs = access?.registered && access.attemptEndTime
    ? new Date(access.attemptEndTime).getTime()
    : new Date(contest.endTime).getTime();
  const remainingMs = Math.max(0, contestEndMs - nowMs);
  const remainingMinutes = Math.floor(remainingMs / 60000);
  const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);

  return (
    <div className="space-y-6">
      <Link to="/contests" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Back to contests
      </Link>

      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{contest.title}</h1>
            <p className="text-muted-foreground mt-1">{contest.description}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar size={14} />{new Date(contest.startTime).toLocaleString()}</span>
              <span className="flex items-center gap-1"><Clock size={14} />{contest.duration} min</span>
              <span className="flex items-center gap-1"><Users size={14} />{contest.participantCount ?? 0} participants</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge
              variant="outline"
              className={`text-sm ${contest.status === "ONGOING"
                ? "bg-success/15 text-success"
                : contest.status === "UPCOMING"
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
                }`}
            >
              {contest.status}
            </Badge>
            {contest.proctored && (
              <Badge variant="outline" className="text-xs bg-warning/15 text-warning border-warning/30">
                <Eye size={12} className="mr-1" /> Proctored
              </Badge>
            )}
            {contest.status === "UPCOMING" && (
              <Button onClick={handleRegister}>Register Now</Button>
            )}
            {contest.status === "ONGOING" && !access?.registered && (
              <Button onClick={handleRegister} className="gap-2"><Play size={14} /> Start Contest</Button>
            )}
            {contest.status === "ONGOING" && access?.registered && (
              <Button asChild className="gap-2" disabled={!firstProblemId}>
                <Link to={firstProblemId ? `/problems/${firstProblemId}?contestId=${contest.id}` : "#"}>
                  <Play size={14} /> Enter Contest
                </Link>
              </Button>
            )}
            {contest.status === "ONGOING" && access?.registered && (
              <Badge variant="outline" className="text-xs border-warning/30 text-warning bg-warning/10">
                Your contest ends in {remainingMinutes}m {remainingSeconds}s
              </Badge>
            )}
            {contest.status === "ONGOING" && !access?.registered && (
              <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/10">
                Timer starts as soon as you click Start Contest ({contest.duration} min)
              </Badge>
            )}
          </div>
        </div>
      </div>

      {contest.status === "ONGOING" && contest.proctored && contest.tabSwitchCount !== undefined && contest.tabSwitchCount > 0 && (
        <div className="glass-card p-4 border-warning/30 bg-warning/5 flex items-center gap-3">
          <AlertTriangle size={18} className="text-warning shrink-0" />
          <div>
            <p className="text-sm font-medium text-warning">Tab Switch Warning</p>
            <p className="text-xs text-muted-foreground">You have switched tabs <span className="font-bold text-warning">{contest.tabSwitchCount}</span> time(s) during this contest. This is monitored and may affect your standing.</p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4">Problems ({problems.length})</h2>
        <div className="space-y-2">
          {canAccessProblems && problems.map((problem, index) => (
            <Link key={problem.id} to={`/problems/${problem.id}?contestId=${contest.id}`} className="glass-card p-4 flex items-center justify-between hover:border-primary/30 transition-all">
              <div className="flex items-center gap-4">
                <span className="text-sm font-mono text-muted-foreground w-6">{String.fromCharCode(65 + index)}</span>
                <div>
                  <p className="font-medium">{problem.title}</p>
                  <div className="flex gap-2 mt-1">
                    {problem.tags?.map((tag) => <span key={tag} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-sm font-medium ${diffColor(problem.difficulty)}`}>{problem.difficulty}</span>
                {problem.acceptanceRate && <span className="text-xs text-muted-foreground">{problem.acceptanceRate}% AC</span>}
              </div>
            </Link>
          ))}
          {!canAccessProblems && (
            <div className="glass-card p-6 text-sm text-muted-foreground border-primary/20">
              Start Contest button dabate hi problem set unlock hoga aur personal timer start hoga.
            </div>
          )}
          {canAccessProblems && problems.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Problems will be revealed when the contest starts</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Trophy size={16} className="text-accent" />
            Contest Leaderboard
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="p-2 font-medium">Rank</th>
                  <th className="p-2 font-medium">User</th>
                  <th className="p-2 font-medium text-right">Solved</th>
                  <th className="p-2 font-medium text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.slice(0, 10).map((entry) => (
                  <tr key={`${entry.rank}-${entry.userId}`} className="border-b border-border/50">
                    <td className="p-2 font-mono">#{entry.rank}</td>
                    <td className="p-2 font-medium">{entry.username}</td>
                    <td className="p-2 text-right">{entry.problemsSolved}</td>
                    <td className="p-2 text-right font-semibold">{entry.score}</td>
                  </tr>
                ))}
                {leaderboard.length === 0 && (
                  <tr>
                    <td className="p-2 text-muted-foreground" colSpan={4}>No submissions yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-semibold mb-3">First Solver Board</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="p-2 font-medium">Problem</th>
                  <th className="p-2 font-medium">First Solver</th>
                  <th className="p-2 font-medium">Solved At</th>
                </tr>
              </thead>
              <tbody>
                {firstSolvers.map((item) => (
                  <tr key={item.problemId} className="border-b border-border/50">
                    <td className="p-2 font-medium">{item.problemTitle}</td>
                    <td className="p-2">{item.firstSolverName || "N/A"}</td>
                    <td className="p-2 text-muted-foreground">
                      {item.firstSolvedAt ? new Date(item.firstSolvedAt).toLocaleString() : "N/A"}
                    </td>
                  </tr>
                ))}
                {firstSolvers.length === 0 && (
                  <tr>
                    <td className="p-2 text-muted-foreground" colSpan={3}>No first-solver data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-semibold mb-3">Your Standing</h3>
        {myStanding ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Rank</p>
              <p className="text-lg font-bold">#{myStanding.rank}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Solved</p>
              <p className="text-lg font-bold">{myStanding.problemsSolved}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Score</p>
              <p className="text-lg font-bold">{myStanding.score}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">First AC</p>
                <p className="text-sm font-medium">
                  {myStanding.firstAcceptedAt ? new Date(myStanding.firstAcceptedAt).toLocaleTimeString() : "N/A"}
                </p>
              </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aapka rank tab show hoga jab aapka first accepted submission aa jayega.
          </p>
        )}
      </div>
    </div>
  );
}
