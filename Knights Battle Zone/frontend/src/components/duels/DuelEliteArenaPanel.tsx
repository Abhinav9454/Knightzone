import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BrainCircuit,
  ClipboardCheck,
  Clock3,
  Crown,
  Gauge,
  RefreshCcw,
  Rocket,
  Swords,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  buildDuelQuestionVault,
  type DuelVaultDifficulty,
  type DuelVaultQuestion,
} from "@/lib/duel-question-vault";

type DuelRoundStatus = "idle" | "playing" | "completed";
type DifficultyFilter = "ALL" | DuelVaultDifficulty;

type RoundResult = {
  answered: number;
  correct: number;
  accuracy: number;
  score: number;
  rivalScore: number;
  timeSpentSeconds: number;
  winner: "YOU" | "RIVAL" | "DRAW";
};

const RIVAL_NAMES = [
  "AaravStorm",
  "CodeMonkX",
  "BinaryRider",
  "GraphTitan",
  "AlgoFury",
  "StackWizard",
  "NodeBreaker",
  "RapidCoder",
  "LoopNinja",
  "HeapMaster",
];

const ROUND_TIME_MULTIPLIER: Record<DuelVaultDifficulty, number> = {
  EASY: 34,
  MEDIUM: 40,
  HARD: 48,
  EXTREME: 56,
};

const randomPick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

const formatSeconds = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const toWinner = (score: number, rivalScore: number): RoundResult["winner"] => {
  if (score > rivalScore) return "YOU";
  if (rivalScore > score) return "RIVAL";
  return "DRAW";
};

export default function DuelEliteArenaPanel() {
  const allQuestions = useMemo(() => buildDuelQuestionVault(3600), []);
  const allMcq = useMemo(
    () => allQuestions.filter((question) => question.type === "MCQ"),
    [allQuestions],
  );
  const allCoding = useMemo(
    () => allQuestions.filter((question) => question.type === "CODING"),
    [allQuestions],
  );

  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("ALL");
  const [roundSize, setRoundSize] = useState(10);
  const [status, setStatus] = useState<DuelRoundStatus>("idle");
  const [rivalName, setRivalName] = useState("CodeMonkX");
  const [roundQuestions, setRoundQuestions] = useState<DuelVaultQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const [rivalScore, setRivalScore] = useState(0);
  const [totalRoundSeconds, setTotalRoundSeconds] = useState(0);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [codingPrompt, setCodingPrompt] = useState<DuelVaultQuestion | null>(() =>
    allCoding.length ? randomPick(allCoding) : null,
  );

  const companyOptions = useMemo(
    () => Array.from(new Set(allMcq.map((item) => item.companyTag))).sort(),
    [allMcq],
  );

  const eligiblePool = useMemo(() => {
    const next = allMcq.filter((item) => {
      if (companyFilter !== "ALL" && item.companyTag !== companyFilter) return false;
      if (difficultyFilter !== "ALL" && item.difficulty !== difficultyFilter) return false;
      return true;
    });
    return next.length >= roundSize ? next : allMcq;
  }, [allMcq, companyFilter, difficultyFilter, roundSize]);

  const activeQuestion = roundQuestions[currentIndex] || null;
  const progress = roundQuestions.length
    ? Math.round(((currentIndex + 1) / roundQuestions.length) * 100)
    : 0;

  const finishRound = useCallback(() => {
    const answeredCount = roundQuestions.filter((question) => answers[question.id]).length;
    const correctCount = roundQuestions.filter(
      (question) => answers[question.id] === question.correctAnswer,
    ).length;
    const accuracy = roundQuestions.length
      ? Math.round((correctCount / roundQuestions.length) * 100)
      : 0;

    const finalResult: RoundResult = {
      answered: answeredCount,
      correct: correctCount,
      accuracy,
      score,
      rivalScore,
      timeSpentSeconds: totalRoundSeconds - timeLeftSeconds,
      winner: toWinner(score, rivalScore),
    };
    setResult(finalResult);
    setStatus("completed");
    toast.success(
      finalResult.winner === "YOU"
        ? "Elite duel won. Strong execution."
        : finalResult.winner === "RIVAL"
          ? "Rival won this round. Review and retry."
          : "Round draw. Push for faster decisions.",
    );
  }, [answers, rivalScore, roundQuestions, score, timeLeftSeconds, totalRoundSeconds]);

  useEffect(() => {
    if (status !== "playing") return;
    if (timeLeftSeconds <= 0) {
      finishRound();
      return;
    }
    const timer = window.setTimeout(() => {
      setTimeLeftSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [finishRound, status, timeLeftSeconds]);

  const startRound = () => {
    const picked = shuffle(eligiblePool).slice(0, roundSize);
    if (!picked.length) {
      toast.error("Question pool unavailable.");
      return;
    }
    const representativeDifficulty = difficultyFilter === "ALL" ? "MEDIUM" : difficultyFilter;
    const totalSeconds = picked.length * ROUND_TIME_MULTIPLIER[representativeDifficulty];

    setRoundQuestions(picked);
    setCurrentIndex(0);
    setSelectedOption("");
    setAnswers({});
    setScore(0);
    setRivalScore(0);
    setResult(null);
    setRivalName(randomPick(RIVAL_NAMES));
    setTotalRoundSeconds(totalSeconds);
    setTimeLeftSeconds(totalSeconds);
    setStatus("playing");
    toast.success("Elite round started.");
  };

  const submitCurrentAnswer = () => {
    if (status !== "playing" || !activeQuestion) return;
    if (!selectedOption) {
      toast.error("Pick one option first.");
      return;
    }

    const isCorrect = selectedOption === activeQuestion.correctAnswer;
    const pressureBonus = timeLeftSeconds > totalRoundSeconds * 0.55 ? 1 : 0;
    const delta = isCorrect ? 4 + pressureBonus : -1;
    const rivalDelta = Math.random() < (isCorrect ? 0.55 : 0.68) ? 3 : -1;

    setAnswers((prev) => ({
      ...prev,
      [activeQuestion.id]: selectedOption,
    }));
    setScore((prev) => prev + delta);
    setRivalScore((prev) => prev + rivalDelta);

    if (currentIndex >= roundQuestions.length - 1) {
      setSelectedOption("");
      window.setTimeout(() => finishRound(), 0);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedOption("");
  };

  const skipCurrentQuestion = () => {
    if (status !== "playing" || !activeQuestion) return;
    setScore((prev) => prev - 1);
    setRivalScore((prev) => prev + (Math.random() < 0.65 ? 2 : 0));

    if (currentIndex >= roundQuestions.length - 1) {
      window.setTimeout(() => finishRound(), 0);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedOption("");
  };

  const copyReport = async () => {
    if (!result) {
      toast.error("Complete a round to copy report.");
      return;
    }
    const reportText = [
      "Duel Elite Round Report",
      `Rival: ${rivalName}`,
      `Winner: ${result.winner}`,
      `Score: ${result.score} | Rival: ${result.rivalScore}`,
      `Accuracy: ${result.accuracy}% (${result.correct}/${roundQuestions.length})`,
      `Time Spent: ${formatSeconds(result.timeSpentSeconds)}`,
    ].join("\n");

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(reportText);
        toast.success("Round report copied.");
      } else {
        toast.info("Clipboard not supported in this browser.");
      }
    } catch {
      toast.error("Could not copy report.");
    }
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
      <div className="space-y-4">
        <article className="rounded-2xl border border-border bg-gradient-to-r from-primary/20 via-accent/10 to-warning/10 p-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Swords className="h-5 w-5 text-primary" />
            Elite Duel Arena
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Timed MCQ battle with strict scoring and pressure bonus. Designed for shortlist-level duel readiness.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-card/70 p-2">
              <p className="text-[11px] text-muted-foreground">Vault</p>
              <p className="text-lg font-semibold">{allMcq.length.toLocaleString()} MCQ</p>
            </div>
            <div className="rounded-lg border border-border bg-card/70 p-2">
              <p className="text-[11px] text-muted-foreground">Round Size</p>
              <p className="text-lg font-semibold">{roundSize}</p>
            </div>
            <div className="rounded-lg border border-border bg-card/70 p-2">
              <p className="text-[11px] text-muted-foreground">Your Score</p>
              <p className="text-lg font-semibold">{score}</p>
            </div>
            <div className="rounded-lg border border-border bg-card/70 p-2">
              <p className="text-[11px] text-muted-foreground">Rival</p>
              <p className="text-lg font-semibold">{rivalScore}</p>
            </div>
          </div>
        </article>

        <article className="glass-card space-y-3 p-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <select
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value as DifficultyFilter)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              disabled={status === "playing"}
            >
              <option value="ALL">All difficulty</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
              <option value="EXTREME">Extreme</option>
            </select>
            <select
              value={companyFilter}
              onChange={(event) => setCompanyFilter(event.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              disabled={status === "playing"}
            >
              <option value="ALL">All companies</option>
              {companyOptions.map((company) => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
            <select
              value={roundSize}
              onChange={(event) => setRoundSize(Number(event.target.value))}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              disabled={status === "playing"}
            >
              <option value={5}>5 questions</option>
              <option value={10}>10 questions</option>
              <option value={15}>15 questions</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={startRound} disabled={status === "playing"} className="gap-1">
              <Rocket className="h-4 w-4" />
              Start Elite Round
            </Button>
            {status === "completed" && (
              <Button variant="outline" onClick={copyReport} className="gap-1">
                <ClipboardCheck className="h-4 w-4" />
                Copy Report
              </Button>
            )}
            {status === "playing" && (
              <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning">
                Live vs {rivalName}
              </Badge>
            )}
          </div>
        </article>

        {status === "playing" && activeQuestion && (
          <article className="glass-card space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="font-medium">Question {currentIndex + 1} / {roundQuestions.length}</p>
              <p className="inline-flex items-center gap-1 text-muted-foreground">
                <Clock3 className="h-4 w-4" />
                {formatSeconds(timeLeftSeconds)}
              </p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="rounded-lg border border-border p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{activeQuestion.difficulty}</Badge>
                <Badge variant="outline">{activeQuestion.companyTag}</Badge>
                <Badge variant="outline">+4/-1 strict</Badge>
              </div>
              <p className="text-sm font-medium">{activeQuestion.prompt}</p>
            </div>

            <div className="space-y-2">
              {activeQuestion.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelectedOption(option)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                    selectedOption === option
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-muted/30"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={submitCurrentAnswer} className="gap-1">
                <Target className="h-4 w-4" />
                Lock Answer
              </Button>
              <Button variant="outline" onClick={skipCurrentQuestion}>
                Skip (-1)
              </Button>
            </div>
          </article>
        )}

        {status === "completed" && result && (
          <article className="rounded-xl border border-border bg-card/80 p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <Crown className="h-4 w-4 text-primary" />
              Elite Round Summary
            </h4>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded border border-border p-2">
                <p className="text-[11px] text-muted-foreground">Winner</p>
                <p className="text-lg font-semibold">{result.winner}</p>
              </div>
              <div className="rounded border border-border p-2">
                <p className="text-[11px] text-muted-foreground">Accuracy</p>
                <p className="text-lg font-semibold">{result.accuracy}%</p>
              </div>
              <div className="rounded border border-border p-2">
                <p className="text-[11px] text-muted-foreground">Final Score</p>
                <p className="text-lg font-semibold">{result.score}</p>
              </div>
              <div className="rounded border border-border p-2">
                <p className="text-[11px] text-muted-foreground">Rival Score</p>
                <p className="text-lg font-semibold">{result.rivalScore}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Correct answers: {result.correct}/{roundQuestions.length} | Time used: {formatSeconds(result.timeSpentSeconds)}
            </p>
          </article>
        )}
      </div>

      <div className="space-y-4">
        <article className="glass-card p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <BrainCircuit className="h-4 w-4 text-primary" />
            Coding Sprint Prompt
          </h4>
          {codingPrompt ? (
            <>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{codingPrompt.difficulty}</Badge>
                <Badge variant="outline">{codingPrompt.companyTag}</Badge>
                <Badge variant="outline">{codingPrompt.topic}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{codingPrompt.prompt}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Expected complexity: {codingPrompt.estimatedSeconds}s budget | {codingPrompt.points} points
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full gap-1"
                onClick={() => setCodingPrompt(allCoding.length ? randomPick(allCoding) : null)}
              >
                <RefreshCcw className="h-4 w-4" />
                New Sprint Prompt
              </Button>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Coding prompt unavailable.</p>
          )}
        </article>

        <article className="rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Gauge className="h-4 w-4 text-primary" />
            Pro Strategy
          </h4>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>1. First 20 seconds: pick elimination strategy for MCQ.</li>
            <li>2. Lock answer early when confidence is high.</li>
            <li>3. Use skip only on low confidence to preserve pace.</li>
            <li>4. Post-round: review wrong answers and repeat same difficulty once.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
