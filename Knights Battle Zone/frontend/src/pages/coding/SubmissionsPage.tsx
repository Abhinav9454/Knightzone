import { useCallback, useEffect, useState } from "react";
import { contestApi, submissionApi } from "@/lib/api";
import { useRealtimeRefresh } from "@/lib/realtime";
import { connectSubmissionRealtime } from "@/lib/submissionRealtime";
import type { Submission } from "@/lib/types";
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const verdictConfig: Record<string, { icon: typeof CheckCircle2; className: string }> = {
  ACCEPTED: { icon: CheckCircle2, className: "verdict-accepted" },
  WRONG_ANSWER: { icon: XCircle, className: "verdict-wrong" },
  TIME_LIMIT: { icon: Clock, className: "verdict-pending" },
  RUNTIME_ERROR: { icon: AlertTriangle, className: "verdict-wrong" },
  COMPILATION_ERROR: { icon: XCircle, className: "verdict-wrong" },
  QUEUED: { icon: Clock, className: "verdict-pending" },
  RUNNING: { icon: Clock, className: "verdict-pending" },
};

export default function SubmissionsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadSubmissions = useCallback(async () => {
    try {
      const [submissionData, contests] = await Promise.all([
        submissionApi.getUserSubmissions(),
        contestApi.getAll(),
      ]);

      const titleByProblemId = new Map<number, string>();
      await Promise.all(
        contests.map(async (contest) => {
          try {
            const problems = await contestApi.getProblems(contest.id);
            problems.forEach((problem) => titleByProblemId.set(problem.id, problem.title));
          } catch {
            // Ignore partial mapping failures.
          }
        }),
      );

      const enriched = submissionData.map((submission) => ({
        ...submission,
        problemTitle: submission.problemTitle || titleByProblemId.get(submission.problemId) || `Problem #${submission.problemId}`,
      }));

      setSubmissions(enriched);
      setLoadError(false);
    } catch {
      setSubmissions([]);
      setLoadError((previous) => {
        if (!previous) {
          toast.error("Unable to load submissions from backend right now.");
        }
        return true;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const hasInFlightSubmission = submissions.some(
    (submission) => submission.verdict === "QUEUED" || submission.verdict === "RUNNING",
  );

  useRealtimeRefresh(loadSubmissions, {
    scope: "submissions",
    intervalMs: hasInFlightSubmission ? 3000 : 0,
  });

  useEffect(() => {
    if (!user?.id) return;

    const connection = connectSubmissionRealtime(user.id, {
      onUpdate: () => {
        void loadSubmissions();
      },
    });

    return () => {
      connection.close();
    };
  }, [loadSubmissions, user?.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Submissions</h1>
        <p className="text-muted-foreground">Track all your code submissions</p>
      </div>

      {loadError && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Submissions service is temporarily unavailable. Auto-refresh will try again on next visit.
        </div>
      )}

      <div className="glass-card overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3 font-medium">#</th>
                <th className="p-3 font-medium">Problem</th>
                <th className="p-3 font-medium">Language</th>
                <th className="p-3 font-medium">Verdict</th>
                <th className="p-3 font-medium">Time</th>
                <th className="p-3 font-medium">Memory</th>
                <th className="p-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => {
                const cfg = verdictConfig[submission.verdict] || verdictConfig.QUEUED;
                const Icon = cfg.icon;
                return (
                  <tr key={submission.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono text-muted-foreground">{submission.id}</td>
                    <td className="p-3 font-medium">{submission.problemTitle || `Problem #${submission.problemId}`}</td>
                    <td className="p-3">
                      <span className="font-mono text-xs px-2 py-1 rounded bg-muted">{submission.language}</span>
                    </td>
                    <td className="p-3">
                      <span className={`flex items-center gap-1.5 ${cfg.className}`}>
                        <Icon size={14} />
                        {submission.verdict.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{submission.executionTime !== undefined ? `${submission.executionTime}ms` : "N/A"}</td>
                    <td className="p-3 text-muted-foreground">{submission.memoryUsed ? `${(submission.memoryUsed / 1024).toFixed(1)}KB` : "N/A"}</td>
                    <td className="p-3 text-muted-foreground">{new Date(submission.submittedAt).toLocaleString()}</td>
                  </tr>
                );
              })}
              {!loading && submissions.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    No submissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
