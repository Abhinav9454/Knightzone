import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { contributionApi } from "@/lib/api";
import { useRealtimeRefresh } from "@/lib/realtime";
import type {
  ContributionHistoryItem,
  ContributionSummary,
  ContributionTypeInfo,
  ContributorEntry,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Award,
  BookOpen,
  Clock3,
  Flame,
  PenSquare,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

const HISTORY_LIMIT = 60;

function badgeTone(level?: string) {
  if (!level) return "text-muted-foreground";
  if (level.includes("Elite") || level.includes("Expert")) return "text-primary";
  if (level.includes("Advanced") || level.includes("Rising")) return "text-success";
  return "text-muted-foreground";
}

function contributionIcon(typeKey: string) {
  if (typeKey === "ARTICLE" || typeKey === "TUTORIAL") return BookOpen;
  if (typeKey === "SOLUTION") return Target;
  if (typeKey === "REVIEW") return Award;
  return PenSquare;
}

export default function ContributionsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? 0;

  const [rows, setRows] = useState<ContributorEntry[]>([]);
  const [summary, setSummary] = useState<ContributionSummary | null>(null);
  const [types, setTypes] = useState<ContributionTypeInfo[]>([]);
  const [history, setHistory] = useState<ContributionHistoryItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [historyFilter, setHistoryFilter] = useState("ALL");

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [leaderboard, nextSummary, nextTypes, nextHistory] = await Promise.all([
        contributionApi.getLeaderboard(20),
        contributionApi.getUserSummary(userId),
        contributionApi.getTypes(),
        contributionApi.getUserHistory(userId, HISTORY_LIMIT),
      ]);
      setRows(leaderboard);
      setSummary(nextSummary);
      setTypes(nextTypes);
      setHistory(nextHistory);
      setSelectedType((prev) => {
        if (prev && nextTypes.some((item) => item.key === prev)) {
          return prev;
        }
        return nextTypes[0]?.key || "";
      });
    } catch {
      toast.error("Contribution data load failed.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useRealtimeRefresh(load, { intervalMs: 12000, scope: "contributions" });

  const selectedTypeMeta = useMemo(
    () => types.find((item) => item.key === selectedType) || null,
    [selectedType, types],
  );

  const myRank = useMemo(() => {
    const index = rows.findIndex((item) => item.userId === userId);
    return index >= 0 ? index + 1 : null;
  }, [rows, userId]);

  const pointsToNextRank = useMemo(() => {
    if (!summary || !myRank || myRank <= 1) {
      return 0;
    }
    const above = rows[myRank - 2];
    if (!above) {
      return 0;
    }
    return Math.max(0, above.totalPoints - summary.totalPoints);
  }, [myRank, rows, summary]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === "ALL") {
      return history;
    }
    return history.filter((item) => item.type === historyFilter);
  }, [history, historyFilter]);

  const maxBreakdownPoints = useMemo(() => {
    if (!summary?.typeBreakdown || summary.typeBreakdown.length === 0) {
      return 1;
    }
    return Math.max(...summary.typeBreakdown.map((item) => item.points), 1);
  }, [summary]);

  const submitContribution = async () => {
    if (!userId || !selectedTypeMeta) {
      toast.error("Contribution type is required.");
      return;
    }

    let parsedReference: number | undefined;
    if (referenceId.trim()) {
      const parsed = Number(referenceId);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        toast.error("Reference ID must be a positive number.");
        return;
      }
      parsedReference = parsed;
    }

    if (selectedTypeMeta.requiresReferenceId && !parsedReference) {
      toast.error(`${selectedTypeMeta.label} requires a valid reference ID.`);
      return;
    }

    setSubmitting(true);
    try {
      await contributionApi.addContribution({
        userId,
        type: selectedTypeMeta.key,
        referenceId: parsedReference,
      });
      setReferenceId("");
      toast.success("Contribution submitted successfully.");
      await load();
    } catch {
      toast.error("Unable to submit contribution.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 page-transition">
      <section className="page-shell space-y-5">
        <header>
          <p className="hero-chip mb-3">Community Impact Engine</p>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="text-primary" />
            Contributions
          </h1>
          <p className="text-muted-foreground">
            Build credibility through quality content, reviews, and collaborative improvements.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Total Points</p>
            <p className="text-2xl font-bold">{summary?.totalPoints ?? 0}</p>
          </div>
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Total Contributions</p>
            <p className="text-2xl font-bold">{summary?.totalContributions ?? 0}</p>
          </div>
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Current Streak</p>
            <p className="text-2xl font-bold">{`${summary?.currentStreakDays ?? 0} days`}</p>
          </div>
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Last 30 Days</p>
            <p className="text-2xl font-bold">{summary?.pointsLast30Days ?? 0}</p>
          </div>
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Contribution Rank</p>
            <p className="text-2xl font-bold">{myRank ? `#${myRank}` : "Unranked"}</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={badgeTone(summary?.badgeLevel)}>
              <Award size={12} className="mr-1" />
              {summary?.badgeLevel || "New Contributor"}
            </Badge>
            <Badge variant="outline">
              <Sparkles size={12} className="mr-1" />
              Best Type: {summary?.bestType || "N/A"}
            </Badge>
            {pointsToNextRank > 0 && (
              <Badge variant="outline">
                <Target size={12} className="mr-1" />
                {pointsToNextRank} pts to next rank
              </Badge>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="glass-card p-4 space-y-4">
          <h2 className="text-lg font-semibold">Contribution Missions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {types.map((item) => {
              const Icon = contributionIcon(item.key);
              return (
                <div
                  key={item.key}
                  className={`rounded-lg border p-3 transition ${selectedType === item.key ? "border-primary/60 bg-primary/5" : "border-border/70 bg-card"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold flex items-center gap-2">
                        <Icon size={14} className="text-primary" />
                        {item.label}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <Badge variant="outline">+{item.points}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{item.hint}</p>
                </div>
              );
            })}
            {!loading && types.length === 0 && (
              <p className="text-sm text-muted-foreground">No contribution missions available.</p>
            )}
          </div>
        </div>

        <div className="glass-card p-4 space-y-4">
          <h2 className="text-lg font-semibold">Submit Contribution</h2>
          <div className="space-y-3">
            <label className="text-sm">
              Type
              <select
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
                className="mt-1 w-full"
              >
                {types.map((item) => (
                  <option key={item.key} value={item.key}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Reference ID {selectedTypeMeta?.requiresReferenceId ? "*" : "(optional)"}
              <Input
                type="number"
                min={1}
                value={referenceId}
                onChange={(event) => setReferenceId(event.target.value)}
                placeholder="e.g. problem/comment/article id"
              />
            </label>

            <div className="rounded-lg border border-border/70 bg-muted/25 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Hard Validation</p>
              <p>- Wrong or missing reference IDs may be rejected.</p>
              <p>- Duplicate low-effort submissions reduce review confidence.</p>
              <p>- High-quality, verifiable submissions rank faster.</p>
            </div>

            <Button disabled={submitting || !selectedTypeMeta} onClick={() => void submitContribution()}>
              {submitting ? "Submitting..." : `Submit (+${selectedTypeMeta?.points || 0} pts)`}
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="glass-card p-4">
          <h2 className="text-lg font-semibold">Top Contributors</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="px-2 py-2">Rank</th>
                  <th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">Points</th>
                  <th className="px-2 py-2">Contributions</th>
                  <th className="px-2 py-2">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.userId} className="border-b border-border/40">
                    <td className="px-2 py-2 font-semibold">#{index + 1}</td>
                    <td className="px-2 py-2">
                      <span className={row.userId === userId ? "font-semibold text-primary" : ""}>{row.username || `User-${row.userId}`}</span>
                    </td>
                    <td className="px-2 py-2 font-semibold">{row.totalPoints}</td>
                    <td className="px-2 py-2">{row.contributionsCount ?? "-"}</td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">
                      {row.lastContributionAt ? new Date(row.lastContributionAt).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && rows.length === 0 && (
              <p className="py-3 text-sm text-muted-foreground">No contribution leaderboard data yet.</p>
            )}
          </div>
        </div>

        <div className="glass-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">Type Breakdown</h2>
          {(summary?.typeBreakdown || []).map((item) => {
            const percent = Math.round((item.points / maxBreakdownPoints) * 100);
            return (
              <div key={item.type} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <p className="font-medium">{item.label}</p>
                  <span className="text-muted-foreground">{item.points} pts ({item.count})</span>
                </div>
                <Progress value={percent} className="h-1.5" />
              </div>
            );
          })}
          {!loading && (summary?.typeBreakdown || []).length === 0 && (
            <p className="text-sm text-muted-foreground">No type breakdown available.</p>
          )}
        </div>
      </section>

      <section className="glass-card p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <div className="flex items-center gap-2 text-sm">
            <Clock3 size={14} className="text-muted-foreground" />
            <select value={historyFilter} onChange={(event) => setHistoryFilter(event.target.value)}>
              <option value="ALL">All Types</option>
              {types.map((item) => (
                <option key={item.key} value={item.key}>{item.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-muted-foreground">
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Reference</th>
                <th className="px-2 py-2">Points</th>
                <th className="px-2 py-2">Created At</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item) => (
                <tr key={item.id} className="border-b border-border/40">
                  <td className="px-2 py-2">{item.label}</td>
                  <td className="px-2 py-2">{item.referenceId || "-"}</td>
                  <td className="px-2 py-2 font-semibold">+{item.points}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredHistory.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <p className="font-medium">No contribution activity yet.</p>
              <p className="mt-1">Start by submitting your first verified contribution.</p>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border/70 bg-muted/25 p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground flex items-center gap-2">
            <Flame size={12} className="text-warning" />
            Pro Tip
          </p>
          <p className="mt-1">Consistent daily contributions across different types increase rank and badge level faster than bulk single-type submissions.</p>
        </div>
      </section>
    </div>
  );
}
