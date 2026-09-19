import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { quizApi, quizAttemptApi } from "@/lib/api";
import type { Quiz, QuizAttempt } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Clock, Maximize } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error";
import { useExamSecurity } from "@/hooks/useExamSecurity";

const getTimerStorageKey = (quizId: number, userId?: number) => `quiz-timer-start-${quizId}-${userId || 0}`;

export default function QuizAttemptPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const quizId = Number(id);

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [timerStartMs, setTimerStartMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!Number.isFinite(quizId)) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    const load = async () => {
      try {
        const [quizData, myAttempts] = await Promise.all([
          quizApi.getById(quizId),
          quizAttemptApi.getMy().catch(() => [] as QuizAttempt[]),
        ]);

        if (!mounted) return;

        setQuiz(quizData);
        const existingAttempt = myAttempts.find((item) => item.quizId === quizId) || null;
        setAttempt(existingAttempt);
        if (existingAttempt?.answers?.length) {
          const map: Record<number, number> = {};
          for (const answer of existingAttempt.answers) {
            if (answer.selectedOption !== undefined) {
              map[answer.questionId] = answer.selectedOption;
            }
          }
          setAnswers(map);
        }

        if (!existingAttempt) {
          const key = getTimerStorageKey(quizId, user?.id);
          const stored = sessionStorage.getItem(key);
          const startMs = stored ? Number(stored) : Date.now();
          if (!stored) sessionStorage.setItem(key, String(startMs));
          setTimerStartMs(startMs);
        }
      } catch {
        if (mounted) toast.error("Unable to load quiz.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [quizId, user?.id]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remainingSeconds = useMemo(() => {
    if (!quiz || !timerStartMs || attempt) return null;
    const endMs = timerStartMs + quiz.durationMinutes * 60 * 1000;
    return Math.max(0, Math.floor((endMs - nowMs) / 1000));
  }, [quiz, timerStartMs, attempt, nowMs]);

  const submitQuiz = useCallback(async () => {
    if (!quiz) return;
    const invalidQuestion = quiz.questions.find((question) => !question.id);
    if (invalidQuestion) {
      toast.error("Quiz data invalid: question id missing.");
      return;
    }

    try {
      setSubmitting(true);
      const payloadAnswers = quiz.questions.map((question) => ({
        questionId: Number(question.id),
        selectedOption: answers[Number(question.id)],
      }));
      const result = await quizAttemptApi.submit({
        quizId: quiz.id,
        answers: payloadAnswers,
      });
      setAttempt(result);
      sessionStorage.removeItem(getTimerStorageKey(quiz.id, user?.id));
      toast.success(`Quiz submitted: ${result.score}/${result.totalPoints}`);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Quiz submit failed."));
    } finally {
      setSubmitting(false);
    }
  }, [answers, quiz, user?.id]);

  const secureModeEnabled = !!quiz && !attempt;
  const security = useExamSecurity({
    enabled: secureModeEnabled,
    examType: "quiz",
    examId: quizId,
    maxViolations: 3,
    requireFullscreen: true,
    onLock: () => {
      if (!autoSubmitted) {
        setAutoSubmitted(true);
        void submitQuiz();
      }
    },
  });

  const lockOverlayOpen = secureModeEnabled && security.locked;

  useEffect(() => {
    if (!quiz || attempt || submitting || autoSubmitted) return;
    if (remainingSeconds !== 0) return;

    setAutoSubmitted(true);
    void submitQuiz();
  }, [remainingSeconds, quiz, attempt, submitting, autoSubmitted, submitQuiz]);

  if (!quiz) return <div className="py-20 text-center text-muted-foreground">Quiz not found</div>;

  const timerMinutes = remainingSeconds !== null ? Math.floor(remainingSeconds / 60) : 0;
  const timerSeconds = remainingSeconds !== null ? remainingSeconds % 60 : 0;
  const fullscreenRequired = secureModeEnabled && !security.isFullscreen;
  const fullscreenGateOpen = secureModeEnabled && !security.isFullscreen && !security.locked;
  const locked = !!attempt || remainingSeconds === 0 || security.locked || fullscreenRequired;
  if (quiz.questions.length === 0) {
    return (
      <div className="space-y-6">
        <Link to="/quizzes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Back to quizzes
        </Link>
        <div className="glass-card p-6 text-muted-foreground">No questions available in this quiz.</div>
      </div>
    );
  }
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const currentQuestionId = Number(currentQuestion?.id);
  const hasPrevious = currentQuestionIndex > 0;
  const hasNext = currentQuestionIndex < quiz.questions.length - 1;

  return (
    <div className="space-y-6">
      {fullscreenGateOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-warning/35 bg-card p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warning/15 text-warning">
              <Maximize size={22} />
            </div>
            <h2 className="text-xl font-bold">Fullscreen Required</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Quiz secure mode ke liye laptop-screen fullscreen mandatory hai. Fullscreen ke bina quiz locked rahega.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Agar fullscreen exit hua to violation count badhega aur 3 violations par auto-submit ho jayega.
            </p>
            <Button
              type="button"
              className="mt-5 w-full gap-2"
              onClick={() => void security.requestFullscreen()}
            >
              <Maximize size={14} />
              Enter Fullscreen and Continue Quiz
            </Button>
          </div>
        </div>
      )}
      {lockOverlayOpen && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-destructive/35 bg-card p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <AlertTriangle size={22} />
            </div>
            <h2 className="text-xl font-bold">Quiz Session Locked</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Security violations limit exceed ho gaya. Quiz auto-submit process start ho chuka hai.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Reason: {security.lockReason || "Security threshold exceeded"}
            </p>
          </div>
        </div>
      )}

      <Link to="/quizzes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Back to quizzes
      </Link>

      <div className="glass-card p-6 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            <p className="text-muted-foreground">{quiz.description || "No description"}</p>
          </div>
          {!attempt && (
            <Badge variant="outline" className="text-sm border-warning/30 text-warning bg-warning/10">
              <Clock size={14} className="mr-1" />
              Time left: {timerMinutes}m {timerSeconds}s
            </Badge>
          )}
        </div>

        {attempt && (
          <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            Submitted: {attempt.score}/{attempt.totalPoints}
          </div>
        )}

        {!attempt && (
          <div className={`rounded-md border px-3 py-2 text-sm ${
            security.locked
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : fullscreenRequired
                ? "border-warning/40 bg-warning/10 text-warning"
                : "border-primary/30 bg-primary/10 text-primary"
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2">
                <AlertTriangle size={14} />
                Secure mode active. Violations: {security.violationCount}/3
              </p>
              {!security.isFullscreen && !security.locked && (
                <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => void security.requestFullscreen()}>
                  <Maximize size={14} />
                  Enter Fullscreen
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <div className="glass-card p-6 space-y-5">
          <div className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </div>

            <div className="space-y-2">
              <p className="font-medium">
                Q{currentQuestionIndex + 1}. {currentQuestion.text}
              </p>
              <div className="space-y-1">
                {currentQuestion.options.map((option, optionIndex) => {
                  const optionId = Number(option.id);
                  const selected = answers[currentQuestionId] === optionId;
                  return (
                    <button
                      key={`quiz-${quiz.id}-q-${currentQuestionId}-o-${optionId || optionIndex}`}
                      type="button"
                      disabled={locked}
                      onClick={() => {
                        if (!option.id || locked) return;
                        setAnswers((prev) => ({ ...prev, [currentQuestionId]: Number(option.id) }));
                      }}
                      className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background/40 hover:border-primary/40"
                      } ${locked ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${selected ? "bg-primary" : "bg-muted-foreground/40"}`} />
                        {option.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!hasPrevious || locked}
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!hasNext || locked}
              onClick={() => setCurrentQuestionIndex((prev) => Math.min(quiz.questions.length - 1, prev + 1))}
            >
              Next
            </Button>
            {!attempt && (
              <Button onClick={() => void submitQuiz()} disabled={submitting || remainingSeconds === 0 || locked}>
                {submitting ? "Submitting..." : "Submit Quiz"}
              </Button>
            )}
          </div>
        </div>

        <div className="glass-card p-4">
          <p className="mb-3 text-sm font-semibold">Questions</p>
          <div className="grid grid-cols-4 gap-2">
            {quiz.questions.map((question, index) => {
              const qId = Number(question.id);
              const answered = answers[qId] !== undefined;
              const selected = index === currentQuestionIndex;
              const tone = answered ? "bg-success/20 border-success/40 text-success" : "bg-destructive/10 border-destructive/30 text-destructive";
              const selectedRing = selected ? "ring-2 ring-primary/40" : "";
              return (
                <button
                  key={question.id || index}
                  type="button"
                  disabled={locked}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`rounded-md border px-2 py-2 text-xs font-semibold transition ${tone} ${selectedRing} ${locked ? "cursor-not-allowed opacity-70" : ""}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
