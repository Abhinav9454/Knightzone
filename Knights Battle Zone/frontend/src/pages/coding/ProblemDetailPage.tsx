import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { contestApi, problemApi, submissionApi } from "@/lib/api";
import type { ContestAccess, Problem, Submission } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lightbulb,
  Maximize,
  Play,
  Send,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";
import { useExamSecurity } from "@/hooks/useExamSecurity";
import { useRealtimeRefresh } from "@/lib/realtime";
import { connectSubmissionRealtime } from "@/lib/submissionRealtime";
import { getApiErrorMessage } from "@/lib/error";

const languages = [
  { value: "cpp", label: "C++", monacoLang: "cpp" },
  { value: "java", label: "Java", monacoLang: "java" },
  { value: "python", label: "Python", monacoLang: "python" },
];

const defaultCode: Record<string, string> = {
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your solution here\n    return 0;\n}',
  java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Your solution here\n    }\n}',
  python: "# Your solution here\n",
};

type LeftTab = "description" | "editorial" | "solutions" | "submissions";
type BottomTab = "testcase" | "result";

export default function ProblemDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const problemId = Number(id);
  const contestIdFromQuery = Number(searchParams.get("contestId"));
  const source = searchParams.get("source");
  const isProblemSetRoute = location.pathname.includes("/problem-set/");
  const isProblemSetSource = source === "problem-set" || isProblemSetRoute;
  const isSimpleContext = location.pathname.startsWith("/simple");
  const contestId = !isProblemSetSource && Number.isFinite(contestIdFromQuery) && contestIdFromQuery > 0 ? contestIdFromQuery : 0;
  const problemBasePath = isSimpleContext ? "/simple/problems" : "/problems";

  const [problem, setProblem] = useState<Problem | null>(null);
  const [contestProblems, setContestProblems] = useState<Problem[]>([]);
  const [contestAccess, setContestAccess] = useState<ContestAccess | null>(null);
  const [prevSubmissions, setPrevSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(defaultCode.cpp);
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [voted, setVoted] = useState<null | "up" | "down">(null);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [runResult, setRunResult] = useState<Submission | null>(null);
  const [leftTab, setLeftTab] = useState<LeftTab>("description");
  const [bottomTab, setBottomTab] = useState<BottomTab>("testcase");
  const [customInput, setCustomInput] = useState("");
  const [nowMs, setNowMs] = useState(Date.now());
  const [securityLocked, setSecurityLocked] = useState(false);
  const isProblemSetProblem = (problem?.contestMode || "").toUpperCase() === "PROBLEM_SET";
  const isPracticeProblemSet = isProblemSetSource || isProblemSetProblem;
  const isContestMode = contestId > 0 && !isPracticeProblemSet && problem !== null;

  const remainingSeconds = (() => {
    if (!isContestMode) return null;
    if (contestAccess?.attemptEndTime) {
      const diff = Math.floor((new Date(contestAccess.attemptEndTime).getTime() - nowMs) / 1000);
      return Math.max(0, diff);
    }
    if (typeof contestAccess?.remainingSeconds === "number") return Math.max(0, contestAccess.remainingSeconds);
    return null;
  })();

  const contestSecurityEnabled = isContestMode && !!contestAccess?.registered && (remainingSeconds === null || remainingSeconds > 0);

  const handleContestViolation = useCallback(() => {
    if (!isContestMode || !contestId || !user?.id) return;
    void contestApi.logTabSwitch(contestId, user.id).catch(() => {
      // Ignore logging issues to avoid breaking user flow.
    });
  }, [contestId, isContestMode, user?.id]);

  const contestSecurity = useExamSecurity({
    enabled: contestSecurityEnabled,
    examType: "contest",
    examId: contestId,
    maxViolations: 5,
    requireFullscreen: true,
    onViolation: handleContestViolation,
    onLock: () => {
      setSecurityLocked(true);
      toast.error("Security threshold exceeded. Contest session locked.");
    },
  });

  const contestExamBlocked = contestSecurityEnabled && (securityLocked || contestSecurity.locked || !contestSecurity.isFullscreen);
  const fullscreenGateOpen = contestSecurityEnabled && !contestSecurity.isFullscreen && !contestSecurity.locked && !securityLocked;

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const loadProblemSubmissions = useCallback(async () => {
    if (!Number.isFinite(problemId)) return;
    try {
      const submissionsData = await submissionApi.getByProblem(problemId);
      setPrevSubmissions(submissionsData);
    } catch {
      // silent to avoid repetitive toasts during auto-refresh
    }
  }, [problemId]);

  useEffect(() => {
    let mounted = true;

    if (!Number.isFinite(problemId)) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    const loadProblem = async () => {
      try {
        const problemData = isProblemSetSource
          ? await problemApi.getProblemSetById(problemId)
          : await problemApi.getById(problemId);
        if (!mounted) return;
        setProblem(problemData);
        await loadProblemSubmissions();
      } catch {
        if (!mounted) return;
        setProblem(null);
        setPrevSubmissions([]);
        toast.error("Unable to load problem details from backend.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProblem();
    return () => {
      mounted = false;
    };
  }, [isProblemSetSource, problemId, loadProblemSubmissions]);

  const hasInFlightSubmission = prevSubmissions.some(
    (submission) => submission.verdict === "QUEUED" || submission.verdict === "RUNNING",
  );

  useRealtimeRefresh(loadProblemSubmissions, {
    enabled: Number.isFinite(problemId),
    scope: "submissions",
    intervalMs: hasInFlightSubmission ? 2000 : 0,
  });

  useEffect(() => {
    if (!user?.id || !Number.isFinite(problemId)) return;

    const connection = connectSubmissionRealtime(user.id, {
      onUpdate: (payload) => {
        if (!payload.problemId || payload.problemId === problemId) {
          void loadProblemSubmissions();
        }
      },
    });

    return () => {
      connection.close();
    };
  }, [loadProblemSubmissions, problemId, user?.id]);

  useEffect(() => {
    let mounted = true;
    if (!isContestMode) {
      setContestProblems([]);
      setContestAccess(null);
      return () => {
        mounted = false;
      };
    }

    const loadContestContext = async () => {
      try {
        const [problemsData, accessData] = await Promise.all([
          contestApi.getProblems(contestId),
          contestApi.getAccess(contestId).catch(() => null as ContestAccess | null),
        ]);
        if (!mounted) return;
        setContestProblems(problemsData);
        setContestAccess(accessData);
      } catch {
        if (!mounted) return;
        setContestProblems([]);
        toast.error("Unable to load contest problem list.");
      }
    };

    loadContestContext();
    return () => {
      mounted = false;
    };
  }, [contestId, isContestMode]);

  useEffect(() => {
    setHintsRevealed(0);
    setRunResult(null);
    setLeftTab("description");
    setBottomTab("testcase");
  }, [problemId]);

  if (!problem) {
    return <div className="text-center py-20 text-muted-foreground">Problem not found</div>;
  }

  const currentProblemIndex = contestProblems.findIndex((item) => item.id === problem.id);
  const hasNavigator = isContestMode && contestProblems.length > 0 && currentProblemIndex >= 0;
  const prevProblem = hasNavigator && currentProblemIndex > 0 ? contestProblems[currentProblemIndex - 1] : null;
  const nextProblem = hasNavigator && currentProblemIndex < contestProblems.length - 1 ? contestProblems[currentProblemIndex + 1] : null;

  const backHref = isPracticeProblemSet
    ? (isSimpleContext ? "/simple/problem-set" : "/problem-set")
    : (isContestMode ? (isSimpleContext ? `/simple/contests/${contestId}` : `/contests/${contestId}`) : (isSimpleContext ? "/simple/contests" : "/contests"));
  const problemLetter = currentProblemIndex >= 0 ? String.fromCharCode(65 + currentProblemIndex) : "";
  const timerLabel = remainingSeconds === null
    ? null
    : `${Math.floor(remainingSeconds / 60)}m ${String(remainingSeconds % 60).padStart(2, "0")}s`;

  const handleSubmit = async () => {
    if (contestExamBlocked) {
      toast.error("Re-enter fullscreen to continue.");
      return;
    }
    if (!code.trim()) {
      toast.error("Code cannot be empty.");
      return;
    }

    if (isContestMode && contestId > 0 && !contestAccess?.registered) {
      try {
        const startedAccess = await contestApi.register(contestId);
        setContestAccess(startedAccess);
        toast.success("Contest timer started. Enter fullscreen and submit again.");
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Unable to start contest session."));
      }
      return;
    }

    setSubmitting(true);
    try {
      const submission = await submissionApi.submit({
        problemId: problem.id,
        language,
        code,
      });
      setPrevSubmissions((current) => [submission, ...current]);
      setBottomTab("result");
      toast.success(`Solution submitted! Verdict: ${submission.verdict.replace(/_/g, " ")}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Submission failed. Check backend and judge service."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRun = async () => {
    if (contestExamBlocked) {
      toast.error("Re-enter fullscreen to continue.");
      return;
    }
    if (!code.trim()) {
      toast.error("Code cannot be empty.");
      return;
    }

    if (isContestMode && contestId > 0 && !contestAccess?.registered) {
      try {
        const startedAccess = await contestApi.register(contestId);
        setContestAccess(startedAccess);
        toast.success("Contest timer started. Enter fullscreen and run again.");
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Unable to start contest session."));
      }
      return;
    }

    setRunning(true);
    try {
      const result = await submissionApi.run({
        problemId: problem.id,
        language,
        code,
      });
      setRunResult(result);
      setBottomTab("result");
      toast.success(`Run complete: ${result.verdict.replace(/_/g, " ")}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Run failed. Check backend and judge service."));
    } finally {
      setRunning(false);
    }
  };

  const handleLangChange = (val: string) => {
    setLanguage(val);
    setCode(defaultCode[val] || "");
  };

  const handleVote = async (type: "up" | "down") => {
    setVoted(type);
    toast.success(type === "up" ? "Upvoted!" : "Downvoted.");
    try {
      await problemApi.vote(problem.id, { value: type === "up" ? 1 : -1 });
    } catch {
      // optimistic UI
    }
  };

  const VerdictIcon = ({ verdict }: { verdict: string }) => {
    if (verdict === "ACCEPTED") return <CheckCircle2 size={14} className="text-success" />;
    if (verdict.includes("WRONG") || verdict.includes("ERROR")) return <XCircle size={14} className="text-destructive" />;
    return <Clock size={14} className="text-warning" />;
  };

  return (
    <div className="-mx-4 -my-4 space-y-3 md:-mx-6 md:-my-6">
      {fullscreenGateOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-warning/35 bg-card p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warning/15 text-warning">
              <Maximize size={22} />
            </div>
            <h2 className="text-xl font-bold">Fullscreen Required</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Contest mode me fullscreen mandatory hai. Fullscreen ke bina run/submit aur editor locked rahega.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Secure mode violation limit: 5. Limit cross hone par session lock ho jayega.
            </p>
            <Button
              type="button"
              className="mt-5 w-full gap-2"
              onClick={() => void contestSecurity.requestFullscreen()}
            >
              <Maximize size={14} />
              Enter Fullscreen and Continue
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between border-b border-border bg-card px-4 py-2 md:px-6">
        <div className="flex items-center gap-2">
          <Link to={backHref} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> {isPracticeProblemSet ? "Problem Set" : isContestMode ? "Contest" : "Back"}
          </Link>
          {hasNavigator && (
            <>
              <span className="text-muted-foreground">|</span>
              <span className="text-sm font-semibold">Problem List</span>
              <div className="hidden items-center gap-1 md:flex">
                {contestProblems.map((item, index) => {
                  const active = item.id === problem.id;
                  return (
                    <Link
                      key={item.id}
                      to={`${problemBasePath}/${item.id}?contestId=${contestId}`}
                      className={`rounded-md border px-2 py-1 text-xs font-medium ${
                        active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {timerLabel && (
            <Badge variant="outline" className={`${remainingSeconds === 0 ? "border-destructive/30 text-destructive" : "border-warning/30 text-warning"} bg-warning/10`}>
              <Clock size={13} className="mr-1" /> Time Left: {timerLabel}
            </Badge>
          )}
        </div>
      </div>

      {contestSecurityEnabled && (
        <div className={`mx-3 rounded-lg border px-3 py-2 text-sm md:mx-4 ${
          contestExamBlocked
            ? "border-warning/40 bg-warning/10 text-warning"
            : "border-primary/30 bg-primary/10 text-primary"
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2">
              <AlertTriangle size={14} />
              Secure contest mode active. Violations: {contestSecurity.violationCount}/5
            </p>
            {!contestSecurity.isFullscreen && !contestSecurity.locked && !securityLocked && (
              <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => void contestSecurity.requestFullscreen()}>
                <Maximize size={14} />
                Enter Fullscreen
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-3 px-3 pb-3 md:grid-cols-[1.05fr_0.95fr] md:px-4 md:pb-4">
        <section className="flex min-h-[calc(100vh-9.5rem)] flex-col rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <div className="flex gap-1 overflow-x-auto">
              {(["description", "editorial", "solutions", "submissions"] as LeftTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setLeftTab(tab)}
                  className={`rounded-md px-3 py-1.5 text-sm capitalize transition ${
                    leftTab === tab ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {hasNavigator && (
              <div className="flex items-center gap-1">
                <Button asChild size="icon" variant="ghost" disabled={!prevProblem}>
                  <Link to={prevProblem ? `${problemBasePath}/${prevProblem.id}?contestId=${contestId}` : "#"}>
                    <ChevronLeft size={16} />
                  </Link>
                </Button>
                <span className="text-xs font-semibold text-muted-foreground">{problemLetter && `Q${problemLetter}`}</span>
                <Button asChild size="icon" variant="ghost" disabled={!nextProblem}>
                  <Link to={nextProblem ? `${problemBasePath}/${nextProblem.id}?contestId=${contestId}` : "#"}>
                    <ChevronRight size={16} />
                  </Link>
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4">
            {leftTab === "description" && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">{problem.title}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {isContestMode ? "Solve carefully and submit before timer ends." : "Solve at your own pace in practice mode."}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      problem.difficulty === "EASY"
                        ? "difficulty-easy border-success/30"
                        : problem.difficulty === "MEDIUM"
                          ? "difficulty-medium border-warning/30"
                          : "difficulty-hard border-destructive/30"
                    }`}
                  >
                    {problem.difficulty}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    {problem.tags?.map((tag) => (
                      <span key={tag} className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className={`gap-1 ${voted === "up" ? "text-success" : "text-muted-foreground"}`} onClick={() => handleVote("up")}>
                      <ThumbsUp size={14} /> {(problem.upvotes || 0) + (voted === "up" ? 1 : 0)}
                    </Button>
                    <Button variant="ghost" size="sm" className={`gap-1 ${voted === "down" ? "text-destructive" : "text-muted-foreground"}`} onClick={() => handleVote("down")}>
                      <ThumbsDown size={14} /> {(problem.downvotes || 0) + (voted === "down" ? 1 : 0)}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 text-sm leading-relaxed text-secondary-foreground">
                  <p className="whitespace-pre-wrap">{problem.description}</p>

                  {problem.constraints && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold">Constraints</h3>
                      <pre className="overflow-auto rounded border border-border bg-muted p-3 text-xs">{problem.constraints}</pre>
                    </div>
                  )}

                  {problem.inputFormat && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold">Input Format</h3>
                      <p>{problem.inputFormat}</p>
                    </div>
                  )}

                  {problem.outputFormat && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold">Output Format</h3>
                      <p>{problem.outputFormat}</p>
                    </div>
                  )}

                  {problem.sampleInput && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold">Sample Input</h3>
                      <pre className="overflow-auto rounded border border-border bg-muted p-3 text-xs">{problem.sampleInput}</pre>
                    </div>
                  )}

                  {problem.sampleOutput && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold">Sample Output</h3>
                      <pre className="overflow-auto rounded border border-border bg-muted p-3 text-xs">{problem.sampleOutput}</pre>
                    </div>
                  )}
                </div>

                {problem.hints && problem.hints.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <Lightbulb size={14} className="text-accent" /> Hints
                    </h3>
                    <div className="space-y-2">
                      {problem.hints.map((hint, index) => (
                        <div key={`${hint}-${index}`}>
                          {index < hintsRevealed ? (
                            <div className="rounded border border-accent/20 bg-accent/10 p-3 text-sm text-accent">{hint}</div>
                          ) : index === hintsRevealed ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 border-accent/30 text-accent"
                              onClick={() => setHintsRevealed((current) => current + 1)}
                            >
                              <Lightbulb size={14} /> Reveal Hint {index + 1}
                            </Button>
                          ) : (
                            <div className="rounded bg-muted/50 p-3 text-sm italic text-muted-foreground">
                              Hint {index + 1} - reveal previous hint first
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {leftTab === "editorial" && (
              <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                Editorial content abhi add nahi hua hai. Admin yahan official explanation publish kar sakte hain.
              </div>
            )}

            {leftTab === "solutions" && (
              <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                Community solutions are currently moderated before publishing. Use the run and submit panel for full evaluation.
              </div>
            )}

            {leftTab === "submissions" && (
              <div className="space-y-2">
                {prevSubmissions.length > 0 ? (
                  prevSubmissions.map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between rounded border border-border bg-muted/30 p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <VerdictIcon verdict={submission.verdict} />
                        <span className="font-mono text-xs">{submission.language}</span>
                        <span className="font-medium">{submission.verdict.replace(/_/g, " ")}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{submission.testCasesPassed ?? "-"} / {submission.totalTestCases ?? "-"}</span>
                        {submission.executionTime !== undefined && <span>{submission.executionTime}ms</span>}
                        <span>{new Date(submission.submittedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No submissions yet.</p>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="flex min-h-[calc(100vh-9.5rem)] flex-col rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Code</span>
              <Select value={language} onValueChange={handleLangChange}>
                <SelectTrigger className="h-8 w-28 bg-muted text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50 border-border bg-card">
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={handleRun} disabled={running || submitting || contestExamBlocked} className="gap-2">
              <Play size={14} /> {running ? "Running..." : "Run"}
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={submitting || running || contestExamBlocked} className="gap-2">
              <Send size={14} /> {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>

          <div className="min-h-[420px] flex-1">
            <Editor
              height="100%"
              language={languages.find((item) => item.value === language)?.monacoLang || "cpp"}
              value={code}
              onChange={(value) => setCode(value || "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                padding: { top: 12 },
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                renderLineHighlight: "all",
                cursorBlinking: "smooth",
                readOnly: contestExamBlocked,
              }}
            />
          </div>

          <div className="border-t border-border">
            <div className="flex items-center gap-1 border-b border-border px-3 py-2">
              <button
                type="button"
                onClick={() => setBottomTab("testcase")}
                className={`rounded px-2 py-1 text-sm ${bottomTab === "testcase" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
              >
                Testcase
              </button>
              <button
                type="button"
                onClick={() => setBottomTab("result")}
                className={`rounded px-2 py-1 text-sm ${bottomTab === "result" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
              >
                Test Result
              </button>
            </div>

            {bottomTab === "testcase" ? (
              <div className="p-3">
                <p className="mb-2 text-xs text-muted-foreground">Custom Input (for local run reference)</p>
                <textarea
                  value={customInput}
                  onChange={(event) => setCustomInput(event.target.value)}
                  placeholder={problem.sampleInput || "Enter custom input"}
                  disabled={contestExamBlocked}
                  className="min-h-[100px] w-full rounded border border-border bg-background p-2 text-xs font-mono outline-none ring-0"
                />
              </div>
            ) : (
              <div className="p-3">
                {runResult ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">Run Result</span>
                      <span
                        className={`font-medium ${
                          runResult.verdict === "ACCEPTED"
                            ? "text-success"
                            : runResult.verdict === "WRONG_ANSWER"
                              ? "text-warning"
                              : "text-destructive"
                        }`}
                      >
                        {runResult.verdict.replace(/_/g, " ")}
                      </span>
                    </div>
                    <pre className="max-h-32 overflow-auto rounded border border-border bg-muted/30 p-2 text-xs">
                      {runResult.verdict === "ACCEPTED"
                        ? `Sample test passed.\nExecution: ${runResult.executionTime ?? 0} ms`
                        : runResult.verdict === "WRONG_ANSWER"
                          ? (runResult.output?.trim() || "Output does not match expected sample output.")
                          : (runResult.output?.trim() || "Runtime/compile issue while running sample test.")}
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">You must run your code first.</p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
