import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { adaptiveApi } from "@/lib/api";
import { useRealtimeRefresh } from "@/lib/realtime";
import type { AdaptiveProblemRecommendation, AdaptiveSkillHistoryEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function AdaptiveInsightsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? 0;

  const [skill, setSkill] = useState<number | null>(null);
  const [recommended, setRecommended] = useState<AdaptiveProblemRecommendation | null>(null);
  const [history, setHistory] = useState<AdaptiveSkillHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [problemIdInput, setProblemIdInput] = useState("");
  const [solved, setSolved] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const [nextSkill, nextRecommended, nextHistory] = await Promise.all([
        adaptiveApi.getSkill(userId),
        adaptiveApi.getRecommendedProblem(userId),
        adaptiveApi.getSkillHistory(userId, 12),
      ]);
      setSkill(nextSkill);
      setRecommended(nextRecommended);
      setHistory(nextHistory);
    } catch {
      toast.error("Adaptive insights load failed.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useRealtimeRefresh(load, { intervalMs: 15000, scope: "adaptive" });

  const submitSkillUpdate = async () => {
    const problemId = Number(problemIdInput);
    if (!userId || Number.isNaN(problemId) || problemId <= 0) {
      toast.error("Valid problem ID required.");
      return;
    }

    setUpdating(true);
    try {
      await adaptiveApi.updateSkill({ userId, problemId, solved });
      setProblemIdInput("");
      toast.success("Skill updated.");
      await load();
    } catch {
      toast.error("Unable to update skill.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Adaptive Insights</h1>
        <p className="text-muted-foreground">
          Backend adaptive engine se skill level, recommendation aur progression.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-card/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Current Skill</p>
          <p className="mt-1 text-3xl font-bold">{(skill ?? 0).toFixed(2)}</p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Recommended Problem</p>
          {recommended ? (
            <div className="mt-1 space-y-1">
              <p className="font-semibold">{recommended.title}</p>
              <p className="text-sm text-muted-foreground">
                Difficulty: {recommended.difficulty} | Category: {recommended.category}
              </p>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">No recommendation currently.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border/70 bg-card/70 p-4">
        <h2 className="text-lg font-semibold">Manual Skill Update</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            Problem ID
            <input
              className="mt-1 w-full rounded-md border bg-background px-3 py-2"
              type="number"
              min={1}
              value={problemIdInput}
              onChange={(event) => setProblemIdInput(event.target.value)}
            />
          </label>
          <label className="flex items-end gap-2 text-sm">
            <input
              type="checkbox"
              checked={solved}
              onChange={(event) => setSolved(event.target.checked)}
            />
            Solved
          </label>
          <div className="flex items-end">
            <Button disabled={updating} onClick={() => void submitSkillUpdate()}>
              {updating ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border/70 bg-card/70 p-4">
        <h2 className="text-lg font-semibold">Skill History</h2>
        <div className="mt-3 space-y-2">
          {history.map((entry, index) => (
            <div key={`${entry.updatedAt}-${index}`} className="rounded-lg border border-border/60 px-3 py-2 text-sm">
              <p className="font-medium">
                Skill {entry.skillLevel.toFixed(2)} | Problem #{entry.problemId}
              </p>
              <p className="text-xs text-muted-foreground">
                {entry.solved ? "Solved" : "Not solved"} | {new Date(entry.updatedAt).toLocaleString()}
              </p>
            </div>
          ))}
          {!loading && history.length === 0 && (
            <p className="text-sm text-muted-foreground">No skill history available.</p>
          )}
        </div>
      </section>
    </div>
  );
}
