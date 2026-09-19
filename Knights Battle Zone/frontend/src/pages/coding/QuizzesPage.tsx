import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { quizApi, quizAttemptApi } from "@/lib/api";
import type { Quiz, QuizAttempt } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, CircleHelp, Search, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type QuizStatus = "UPCOMING" | "ONGOING" | "PAST";
type QuizFilter = "ALL" | QuizStatus | "ATTEMPTED" | "NOT_ATTEMPTED";

const getStatus = (startTime: string, endTime: string): QuizStatus => {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (now < start) return "UPCOMING";
  if (now > end) return "PAST";
  return "ONGOING";
};

const statusStyles: Record<QuizStatus, string> = {
  UPCOMING: "bg-primary/15 text-primary border-primary/30",
  ONGOING: "bg-success/15 text-success border-success/30",
  PAST: "bg-muted text-muted-foreground border-border",
};

export default function QuizzesPage() {
  const location = useLocation();
  const isSimpleContext = location.pathname.startsWith("/simple");

  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attemptsByQuizId, setAttemptsByQuizId] = useState<Record<number, QuizAttempt>>({});
  const [nowMs, setNowMs] = useState(Date.now());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<QuizFilter>("ALL");

  useEffect(() => {
    let mounted = true;

    const loadQuizzes = async () => {
      try {
        const [data, myAttempts] = await Promise.all([
          quizApi.getAll(),
          quizAttemptApi.getMy().catch(() => [] as QuizAttempt[]),
        ]);

        if (mounted) {
          setQuizzes(data);
          setAttemptsByQuizId(Object.fromEntries(myAttempts.map((attempt) => [attempt.quizId, attempt])));
        }
      } catch {
        if (mounted) toast.error("Unable to load quizzes right now.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadQuizzes();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const toScopedQuizPath = (quizId: number) => (isSimpleContext ? `/simple/quizzes/${quizId}` : `/quizzes/${quizId}`);

  const summary = useMemo(() => {
    const attemptedCount = Object.keys(attemptsByQuizId).length;
    const ongoingCount = quizzes.filter((quiz) => getStatus(quiz.startTime, quiz.endTime) === "ONGOING").length;
    const upcomingCount = quizzes.filter((quiz) => getStatus(quiz.startTime, quiz.endTime) === "UPCOMING").length;

    const scores = Object.values(attemptsByQuizId)
      .map((attempt) => (attempt.totalPoints > 0 ? (attempt.score / attempt.totalPoints) * 100 : 0))
      .filter((score) => Number.isFinite(score));

    const avgScore = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;

    return {
      total: quizzes.length,
      attemptedCount,
      ongoingCount,
      upcomingCount,
      avgScore,
    };
  }, [attemptsByQuizId, quizzes]);

  const filteredQuizzes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const visible = quizzes.filter((quiz) => {
      const status = getStatus(quiz.startTime, quiz.endTime);
      const attempted = Boolean(attemptsByQuizId[quiz.id]);

      if (filter === "ATTEMPTED" && !attempted) return false;
      if (filter === "NOT_ATTEMPTED" && attempted) return false;
      if (filter !== "ALL" && filter !== "ATTEMPTED" && filter !== "NOT_ATTEMPTED" && status !== filter) return false;

      if (!normalizedSearch) return true;
      return (
        quiz.title.toLowerCase().includes(normalizedSearch) ||
        (quiz.description || "").toLowerCase().includes(normalizedSearch)
      );
    });

    return [...visible].sort((a, b) => {
      const statusOrder: Record<QuizStatus, number> = { ONGOING: 0, UPCOMING: 1, PAST: 2 };
      const statusA = getStatus(a.startTime, a.endTime);
      const statusB = getStatus(b.startTime, b.endTime);
      if (statusOrder[statusA] !== statusOrder[statusB]) return statusOrder[statusA] - statusOrder[statusB];
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  }, [attemptsByQuizId, filter, quizzes, search]);

  return (
    <div className="space-y-6">
      <section className="dashboard-hero rounded-2xl border border-border/75 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="hero-chip mb-3">
              <CircleHelp className="h-3.5 w-3.5" />
              Assessment Readiness
            </span>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">Quizzes</h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              Attempt quizzes with live windows, monitor your score quality, and focus on pending assessments.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <article className="metric-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Total Quizzes</p>
            <p className="mt-1 text-2xl font-bold">{summary.total}</p>
          </article>
          <article className="metric-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Ongoing</p>
            <p className="mt-1 text-2xl font-bold">{summary.ongoingCount}</p>
          </article>
          <article className="metric-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Upcoming</p>
            <p className="mt-1 text-2xl font-bold">{summary.upcomingCount}</p>
          </article>
          <article className="metric-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Attempted</p>
            <p className="mt-1 text-2xl font-bold">{summary.attemptedCount}</p>
          </article>
          <article className="metric-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Average Score</p>
            <p className="mt-1 text-2xl font-bold">{summary.avgScore}%</p>
          </article>
        </div>
      </section>

      <section className="content-panel rounded-xl p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search quiz title or description"
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(["ALL", "ONGOING", "UPCOMING", "PAST", "ATTEMPTED", "NOT_ATTEMPTED"] as QuizFilter[]).map((item) => (
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
                {item.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredQuizzes.map((quiz) => {
          const status = getStatus(quiz.startTime, quiz.endTime);
          const endMs = new Date(quiz.endTime).getTime();
          const remainingMs = Math.max(0, endMs - nowMs);
          const remainingMinutes = Math.floor(remainingMs / 60000);
          const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
          const existingAttempt = attemptsByQuizId[quiz.id];

          return (
            <article key={quiz.id} className="rounded-xl border border-border/75 bg-card/80 p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 font-semibold">{quiz.title}</h3>
                <Badge variant="outline" className={`text-xs ${statusStyles[status]}`}>
                  {status}
                </Badge>
              </div>

              <p className="line-clamp-3 text-sm text-muted-foreground">
                {quiz.description || "No description available for this quiz."}
              </p>

              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p className="inline-flex items-center gap-1.5"><Calendar size={12} /> {new Date(quiz.startTime).toLocaleString()}</p>
                <p className="inline-flex items-center gap-1.5"><Clock size={12} /> {quiz.durationMinutes} minutes</p>
                <p>{quiz.questions?.length ?? 0} questions</p>
              </div>

              {status === "ONGOING" && (
                <div className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                  <span className="inline-flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    Ends in {remainingMinutes}m {remainingSeconds}s
                  </span>
                </div>
              )}

              {existingAttempt && (
                <div className="mt-3 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    Attempted: {existingAttempt.score}/{existingAttempt.totalPoints}
                  </span>
                </div>
              )}

              <Link to={toScopedQuizPath(quiz.id)}>
                <Button className="mt-4 w-full">
                  {existingAttempt ? "Review Attempt" : "Start Quiz"}
                </Button>
              </Link>
            </article>
          );
        })}

        {!loading && filteredQuizzes.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 rounded-xl border border-border/75 bg-card/80 p-8 text-center">
            <p className="text-lg font-semibold">No quizzes found for this view</p>
            <p className="mt-1 text-sm text-muted-foreground">Adjust filters or search keyword to expand results.</p>
          </div>
        )}
      </div>
    </div>
  );
}

