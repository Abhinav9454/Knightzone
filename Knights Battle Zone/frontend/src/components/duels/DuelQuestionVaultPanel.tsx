import { useMemo, useState } from "react";
import {
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  GaugeCircle,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildDuelQuestionVault,
  type DuelVaultDifficulty,
  type DuelVaultMode,
  type DuelVaultQuestion,
  type DuelVaultQuestionType,
} from "@/lib/duel-question-vault";

const QUESTION_COUNT = 3600;
const PAGE_SIZE = 10;
const MCQ_LAB_SIZE = 5;

const difficultyTone: Record<DuelVaultDifficulty, string> = {
  EASY: "bg-success/10 text-success border-success/30",
  MEDIUM: "bg-primary/10 text-primary border-primary/30",
  HARD: "bg-warning/10 text-warning border-warning/30",
  EXTREME: "bg-destructive/10 text-destructive border-destructive/30",
};

const typeTone: Record<DuelVaultQuestionType, string> = {
  MCQ: "bg-accent/10 text-accent border-accent/30",
  CODING: "bg-primary/10 text-primary border-primary/30",
  RAPID_FIRE: "bg-warning/10 text-warning border-warning/30",
};

type ModeFilter = "ALL" | DuelVaultMode;
type TypeFilter = "ALL" | DuelVaultQuestionType;
type DifficultyFilter = "ALL" | DuelVaultDifficulty;

const includesIgnoreCase = (value: string, search: string) =>
  value.toLowerCase().includes(search.toLowerCase());

export default function DuelQuestionVaultPanel() {
  const allQuestions = useMemo(() => buildDuelQuestionVault(QUESTION_COUNT), []);

  const [query, setQuery] = useState("");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("ALL");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [labVersion, setLabVersion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [submittedIds, setSubmittedIds] = useState<Record<number, boolean>>({});
  const [recommendedPack, setRecommendedPack] = useState<DuelVaultQuestion[]>([]);

  const companies = useMemo(
    () => Array.from(new Set(allQuestions.map((item) => item.companyTag))).sort(),
    [allQuestions],
  );

  const filteredQuestions = useMemo(() => {
    const next = allQuestions.filter((item) => {
      if (modeFilter !== "ALL" && item.mode !== modeFilter) return false;
      if (typeFilter !== "ALL" && item.type !== typeFilter) return false;
      if (difficultyFilter !== "ALL" && item.difficulty !== difficultyFilter) return false;
      if (companyFilter !== "ALL" && item.companyTag !== companyFilter) return false;
      if (!query.trim()) return true;
      return (
        includesIgnoreCase(item.title, query)
        || includesIgnoreCase(item.prompt, query)
        || includesIgnoreCase(item.topic, query)
        || item.tags.some((tag) => includesIgnoreCase(tag, query))
      );
    });

    return next;
  }, [allQuestions, companyFilter, difficultyFilter, modeFilter, query, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedQuestions = useMemo(
    () => filteredQuestions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredQuestions, safePage],
  );

  const mcqCount = allQuestions.filter((item) => item.type === "MCQ").length;
  const codingCount = allQuestions.filter((item) => item.type === "CODING").length;
  const rapidCount = allQuestions.filter((item) => item.type === "RAPID_FIRE").length;

  const mcqPool = useMemo(() => filteredQuestions.filter((item) => item.type === "MCQ"), [filteredQuestions]);
  const labQuestions = useMemo(() => {
    if (!mcqPool.length) return [] as DuelVaultQuestion[];
    const start = (labVersion * MCQ_LAB_SIZE) % mcqPool.length;
    const first = mcqPool.slice(start, start + MCQ_LAB_SIZE);
    if (first.length === MCQ_LAB_SIZE) return first;
    return [...first, ...mcqPool.slice(0, MCQ_LAB_SIZE - first.length)];
  }, [labVersion, mcqPool]);

  const answeredCount = labQuestions.filter((item) => !!selectedAnswers[item.id]).length;
  const correctCount = labQuestions.filter(
    (item) => submittedIds[item.id] && selectedAnswers[item.id] === item.correctAnswer,
  ).length;
  const accuracy = labQuestions.length ? Math.round((correctCount / labQuestions.length) * 100) : 0;
  const strictScore = labQuestions.reduce((score, item) => {
    if (!submittedIds[item.id]) return score;
    const selected = selectedAnswers[item.id];
    if (!selected) return score;
    return selected === item.correctAnswer ? score + 4 : score - 1;
  }, 0);

  const evaluateLab = () => {
    if (!labQuestions.length) {
      toast.error("No MCQ set available for selected filters.");
      return;
    }
    const evaluatedScore = labQuestions.reduce((score, item) => {
      const selected = selectedAnswers[item.id];
      if (!selected) return score;
      return selected === item.correctAnswer ? score + 4 : score - 1;
    }, 0);
    const nextSubmitted = { ...submittedIds };
    labQuestions.forEach((item) => {
      nextSubmitted[item.id] = true;
    });
    setSubmittedIds(nextSubmitted);
    toast.success(`MCQ evaluation complete. Strict score: ${evaluatedScore}`);
  };

  const generateRecommendedPack = () => {
    const source = filteredQuestions.length ? filteredQuestions : allQuestions;
    const recommended = source
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, 15);
    setRecommendedPack(recommended);
    toast.success("Pro duel pack generated.");
  };

  const exportRecommendedPack = async () => {
    if (!recommendedPack.length) {
      toast.error("Generate a pack first.");
      return;
    }
    const payload = recommendedPack
      .map(
        (question, index) =>
          `${index + 1}. [${question.type}][${question.difficulty}] ${question.prompt}\n   ${question.topic} | ${question.companyTag} | ${question.estimatedSeconds}s | ${question.points}pts`,
      )
      .join("\n");
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
        toast.success("Pack copied to clipboard.");
      } else {
        toast.info("Clipboard not supported.");
      }
    } catch {
      toast.error("Could not copy pack.");
    }
  };

  return (
    <section className="grid gap-5 2xl:grid-cols-[1.35fr,0.85fr]">
      <div className="space-y-4">
        <article className="rounded-2xl border border-border bg-gradient-to-r from-primary/15 via-accent/10 to-success/15 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <BrainCircuit className="h-5 w-5 text-primary" />
                Pro Duel Question Vault
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Structured bank with {QUESTION_COUNT.toLocaleString()} curated duel prompts, coding sets, and strict MCQ rounds.
              </p>
            </div>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              IIT-level prep mode
            </Badge>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-background/70 p-3">
              <p className="text-xs text-muted-foreground">Total Vault</p>
              <p className="text-lg font-bold">{allQuestions.length.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 p-3">
              <p className="text-xs text-muted-foreground">MCQ</p>
              <p className="text-lg font-bold">{mcqCount.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 p-3">
              <p className="text-xs text-muted-foreground">Coding</p>
              <p className="text-lg font-bold">{codingCount.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 p-3">
              <p className="text-xs text-muted-foreground">Rapid Fire</p>
              <p className="text-lg font-bold">{rapidCount.toLocaleString()}</p>
            </div>
          </div>
        </article>

        <article className="glass-card space-y-3 p-4">
          <h3 className="text-sm font-semibold">Question Search & Filters</h3>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <Input
              placeholder="Search by topic, tag, prompt..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              className="xl:col-span-2"
            />
            <select
              value={modeFilter}
              onChange={(event) => {
                setModeFilter(event.target.value as ModeFilter);
                setPage(1);
              }}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">All modes</option>
              <option value="CODING">Coding mode</option>
              <option value="QUIZ">Quiz mode</option>
              <option value="TYPING">Rapid mode</option>
            </select>
            <select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value as TypeFilter);
                setPage(1);
              }}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">All types</option>
              <option value="MCQ">MCQ</option>
              <option value="CODING">Coding</option>
              <option value="RAPID_FIRE">Rapid Fire</option>
            </select>
            <select
              value={difficultyFilter}
              onChange={(event) => {
                setDifficultyFilter(event.target.value as DifficultyFilter);
                setPage(1);
              }}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">All difficulty</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
              <option value="EXTREME">Extreme</option>
            </select>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={companyFilter}
              onChange={(event) => {
                setCompanyFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">All company style</option>
              {companies.map((company) => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              Showing {filteredQuestions.length.toLocaleString()} questions
            </div>
          </div>
        </article>

        <article className="space-y-3">
          {pagedQuestions.map((question) => (
            <div key={question.id} className="rounded-xl border border-border bg-card/80 p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={typeTone[question.type]}>{question.type}</Badge>
                <Badge variant="outline" className={difficultyTone[question.difficulty]}>{question.difficulty}</Badge>
                <Badge variant="outline">{question.mode}</Badge>
                <span className="text-xs text-muted-foreground">{question.topic}</span>
                <span className="text-xs text-muted-foreground">{question.companyTag}</span>
              </div>
              <p className="mt-2 text-sm font-semibold">{question.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{question.prompt}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>Points: {question.points}</span>
                <span>Time: {question.estimatedSeconds}s</span>
                <span>Tags: {question.tags.slice(0, 3).join(", ")}</span>
              </div>
            </div>
          ))}
          {!pagedQuestions.length && (
            <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No questions found for current filters.
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/70 px-3 py-2">
            <p className="text-xs text-muted-foreground">Page {safePage} of {totalPages}</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage <= 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={safePage >= totalPages}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </article>
      </div>

      <div className="space-y-4">
        <article className="glass-card p-4">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Strict MCQ Evaluation Lab
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Hard checking: `+4` correct, `-1` wrong, `0` unattempted.
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded border border-border p-2">
              <p className="text-[11px] text-muted-foreground">Attempted</p>
              <p className="text-lg font-semibold">{answeredCount}/{labQuestions.length}</p>
            </div>
            <div className="rounded border border-border p-2">
              <p className="text-[11px] text-muted-foreground">Accuracy</p>
              <p className="text-lg font-semibold">{accuracy}%</p>
            </div>
            <div className="rounded border border-border p-2">
              <p className="text-[11px] text-muted-foreground">Strict Score</p>
              <p className="text-lg font-semibold">{strictScore}</p>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            {labQuestions.map((question) => {
              const submitted = !!submittedIds[question.id];
              const selected = selectedAnswers[question.id];
              const isCorrect = selected && selected === question.correctAnswer;

              return (
                <div key={question.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{question.prompt}</p>
                  <div className="mt-2 space-y-1">
                    {question.options.map((option) => {
                      const optionCorrect = option === question.correctAnswer;
                      const optionSelected = selected === option;
                      const optionClass = submitted
                        ? optionCorrect
                          ? "border-success bg-success/10 text-success"
                          : optionSelected
                            ? "border-destructive bg-destructive/10 text-destructive"
                            : "border-border bg-background text-foreground"
                        : optionSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-foreground hover:bg-muted/40";

                      return (
                        <button
                          key={option}
                          type="button"
                          className={`w-full rounded border px-3 py-1.5 text-left text-xs transition ${optionClass}`}
                          onClick={() =>
                            setSelectedAnswers((prev) => ({
                              ...prev,
                              [question.id]: option,
                            }))
                          }
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  {submitted && (
                    <p className="mt-2 text-[11px] text-muted-foreground">{question.explanation}</p>
                  )}
                </div>
              );
            })}
            {!labQuestions.length && (
              <p className="text-sm text-muted-foreground">MCQ set unavailable for selected filters.</p>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" onClick={evaluateLab} className="gap-1">
              <Target className="h-4 w-4" />
              Evaluate Hard
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLabVersion((value) => value + 1);
                toast.info("New MCQ lab set loaded.");
              }}
              className="gap-1"
            >
              <Sparkles className="h-4 w-4" />
              New MCQ Set
            </Button>
          </div>
        </article>

        <article className="rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <GaugeCircle className="h-4 w-4 text-primary" />
            Duel Pack Recommendation
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Suggested pack: 15 questions (6 coding + 6 MCQ + 3 rapid fire) with progressive difficulty.
          </p>
          <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
            <p>Estimated runtime: 42-55 minutes</p>
            <p>Focus coverage: problem solving, speed, and decision quality</p>
            <p>Best for: placement duel rounds and shortlist tests</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full"
            onClick={generateRecommendedPack}
          >
            Generate Challenge Pack
          </Button>
          {!!recommendedPack.length && (
            <>
              <Button
                type="button"
                variant="outline"
                className="mt-2 w-full"
                onClick={exportRecommendedPack}
              >
                Export Pack
              </Button>
              <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-2 text-xs">
                {recommendedPack.map((question, index) => (
                  <div key={`${question.id}-${index}`} className="rounded border border-border/70 p-1.5">
                    <p className="font-medium">
                      {index + 1}. [{question.type}] {question.prompt}
                    </p>
                    <p className="text-muted-foreground">
                      {question.topic} • {question.companyTag} • {question.estimatedSeconds}s
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
