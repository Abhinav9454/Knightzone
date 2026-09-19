import { useMemo, useState } from "react";
import {
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InterviewQuestionBankItem } from "@/lib/types";
import {
  DEFAULT_INTERVIEW_VAULT_COUNT,
  getMockInterviewVaultSnapshot,
  getMockInterviewVaultStats,
  type InterviewVaultDifficulty,
  type InterviewVaultFormat,
  type InterviewVaultQuestion,
  type InterviewVaultType,
} from "@/lib/mock-interview-vault";

type TypeFilter = "ALL" | InterviewVaultType;
type DifficultyFilter = "ALL" | InterviewVaultDifficulty;
type FormatFilter = "ALL" | InterviewVaultFormat;

const PAGE_SIZE = 12;
const MCQ_ROUND_SIZE = 10;
const CANDIDATE_NAMES = [
  "Aarav Sharma",
  "Ishita Verma",
  "Rohan Iyer",
  "Meera Nair",
  "Aditya Singh",
  "Nitya Kulkarni",
  "Ritika Bose",
  "Kabir Khan",
];

interface InterviewQuestionVaultPanelProps {
  backendQuestions: InterviewQuestionBankItem[];
  onUsePreset?: (preset: {
    type: InterviewVaultType;
    difficulty: InterviewVaultDifficulty;
    questionFormat: "MIXED" | InterviewVaultFormat;
    topics: string;
    targetCompany: string;
    mcqCount: number;
    codingCount: number;
  }) => void;
}

const firstTag = (value?: string) => {
  if (!value) return "General";
  return value.split(",").map((item) => item.trim()).filter(Boolean)[0] || "General";
};

const normalizeBackendQuestion = (item: InterviewQuestionBankItem): InterviewVaultQuestion => ({
  id: item.id,
  type: (item.type || "TECHNICAL") as InterviewVaultType,
  difficulty: (item.difficulty || "INTERMEDIATE") as InterviewVaultDifficulty,
  category: item.category || "general",
  questionFormat: (item.questionFormat || "OPEN_ENDED") as InterviewVaultFormat,
  question: item.question,
  options: item.options || [],
  correctAnswer: item.correctAnswer || "",
  explanation: item.explanation || item.aiEvaluationCriteria || "Focus on structured answer and clarity.",
  expectedComplexity: item.expectedComplexity || "O(n)",
  companyTag: item.companyTag || "General",
  estimatedSeconds: item.estimatedSeconds || 180,
  expectedPoints: item.expectedPoints,
  aiEvaluationCriteria: item.aiEvaluationCriteria,
  tags: item.tags,
  isActive: item.isActive,
});

export default function InterviewQuestionVaultPanel({
  backendQuestions,
  onUsePreset,
}: InterviewQuestionVaultPanelProps) {
  const generatedVault = useMemo(
    () => getMockInterviewVaultSnapshot(DEFAULT_INTERVIEW_VAULT_COUNT),
    [],
  );
  const generatedStats = useMemo(
    () => getMockInterviewVaultStats(generatedVault),
    [generatedVault],
  );
  const backendNormalized = useMemo(
    () => backendQuestions.map(normalizeBackendQuestion),
    [backendQuestions],
  );

  const mergedVault = useMemo(() => {
    const byQuestion = new Map<string, InterviewVaultQuestion>();
    generatedVault.forEach((question) => byQuestion.set(question.question.toLowerCase(), question));
    backendNormalized.forEach((question) => byQuestion.set(question.question.toLowerCase(), question));
    return Array.from(byQuestion.values());
  }, [backendNormalized, generatedVault]);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("ALL");
  const [formatFilter, setFormatFilter] = useState<FormatFilter>("ALL");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [strictOnly, setStrictOnly] = useState(true);
  const [maxSeconds, setMaxSeconds] = useState(900);
  const [page, setPage] = useState(1);
  const [roundVersion, setRoundVersion] = useState(0);
  const [sheetVersion, setSheetVersion] = useState(0);
  const [picked, setPicked] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});

  const companyOptions = useMemo(
    () => Array.from(new Set(mergedVault.map((q) => q.companyTag))).sort(),
    [mergedVault],
  );

  const filtered = useMemo(
    () =>
      mergedVault.filter((item) => {
        if (typeFilter !== "ALL" && item.type !== typeFilter) return false;
        if (difficultyFilter !== "ALL" && item.difficulty !== difficultyFilter) return false;
        if (formatFilter !== "ALL" && item.questionFormat !== formatFilter) return false;
        if (companyFilter !== "ALL" && item.companyTag !== companyFilter) return false;
        if (strictOnly && item.difficulty === "BEGINNER") return false;
        if (item.estimatedSeconds > maxSeconds) return false;
        if (!query.trim()) return true;
        const normalized = query.toLowerCase();
        return (
          item.question.toLowerCase().includes(normalized)
          || item.companyTag.toLowerCase().includes(normalized)
          || item.category.toLowerCase().includes(normalized)
          || firstTag(item.tags).toLowerCase().includes(normalized)
        );
      }),
    [
      companyFilter,
      difficultyFilter,
      formatFilter,
      maxSeconds,
      mergedVault,
      query,
      strictOnly,
      typeFilter,
    ],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageQuestions = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const mcqPool = useMemo(
    () => filtered.filter((item) => item.questionFormat === "MCQ" && item.options.length > 0),
    [filtered],
  );
  const mcqRound = useMemo(() => {
    if (!mcqPool.length) return [] as InterviewVaultQuestion[];
    const start = (roundVersion * MCQ_ROUND_SIZE) % mcqPool.length;
    const first = mcqPool.slice(start, start + MCQ_ROUND_SIZE);
    if (first.length === MCQ_ROUND_SIZE) return first;
    return [...first, ...mcqPool.slice(0, MCQ_ROUND_SIZE - first.length)];
  }, [mcqPool, roundVersion]);

  const strictScore = mcqRound.reduce((sum, question) => {
    if (!submitted[question.id]) return sum;
    const answer = picked[question.id];
    if (!answer) return sum;
    return answer === question.correctAnswer ? sum + 4 : sum - 1;
  }, 0);

  const strictCoverage = useMemo(() => {
    const total = Math.max(1, filtered.length);
    const coding = filtered.filter((question) => question.questionFormat === "CODING").length;
    const mcq = filtered.filter((question) => question.questionFormat === "MCQ").length;
    return {
      coding: Math.round((coding / total) * 100),
      mcq: Math.round((mcq / total) * 100),
    };
  }, [filtered]);

  const randomInterviewCopy = useMemo(() => {
    const source = filtered.length ? filtered : mergedVault;
    if (!source.length) {
      return {
        candidate: "Candidate",
        role: "Software Engineer",
        company: "General",
        questions: [] as InterviewVaultQuestion[],
      };
    }
    const seed = sheetVersion + source.length;
    const candidate = CANDIDATE_NAMES[seed % CANDIDATE_NAMES.length];
    const roleSeed = source[(seed * 3) % source.length];
    const role = firstTag(roleSeed.tags) || "Software Engineer";
    const company = roleSeed.companyTag;
    const start = (seed * 7) % source.length;
    const subset = source.slice(start, start + 5);
    const questions = subset.length === 5 ? subset : [...subset, ...source.slice(0, 5 - subset.length)];
    return { candidate, role, company, questions };
  }, [filtered, mergedVault, sheetVersion]);

  const evaluateRound = () => {
    if (!mcqRound.length) {
      toast.error("MCQ round unavailable for active filters.");
      return;
    }
    const evaluatedScore = mcqRound.reduce((sum, question) => {
      const answer = picked[question.id];
      if (!answer) return sum;
      return answer === question.correctAnswer ? sum + 4 : sum - 1;
    }, 0);
    const next = { ...submitted };
    mcqRound.forEach((question) => {
      next[question.id] = true;
    });
    setSubmitted(next);
    toast.success(`Hard check complete. Strict score: ${evaluatedScore}`);
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-gradient-to-r from-primary/15 via-accent/10 to-success/10 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <BrainCircuit className="h-5 w-5 text-primary" />
              Interview Question Vault
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Pro bank with {mergedVault.length.toLocaleString()} questions ({generatedStats.total.toLocaleString()} generated + backend bank), including MCQ and coding prompts.
            </p>
          </div>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            Hard assessment enabled
          </Badge>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border border-border bg-card/80 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Coding Coverage</p>
            <p className="text-lg font-semibold">{strictCoverage.coding}%</p>
          </div>
          <div className="rounded-md border border-border bg-card/80 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">MCQ Coverage</p>
            <p className="text-lg font-semibold">{strictCoverage.mcq}%</p>
          </div>
          <div className="rounded-md border border-border bg-card/80 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Strict Filter</p>
            <p className="text-lg font-semibold">{strictOnly ? "ON" : "OFF"}</p>
          </div>
          <div className="rounded-md border border-border bg-card/80 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Timer Cap</p>
            <p className="text-lg font-semibold">{maxSeconds}s</p>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search by topic, company, category..."
            className="xl:col-span-2"
          />
          <select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value as TypeFilter);
              setPage(1);
            }}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="ALL">All types</option>
            <option value="TECHNICAL">Technical</option>
            <option value="BEHAVIORAL">Behavioral</option>
            <option value="HR">HR</option>
            <option value="CUSTOM">Custom</option>
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
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
          <select
            value={formatFilter}
            onChange={(event) => {
              setFormatFilter(event.target.value as FormatFilter);
              setPage(1);
            }}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="ALL">All formats</option>
            <option value="OPEN_ENDED">Open Ended</option>
            <option value="MCQ">MCQ</option>
            <option value="CODING">Coding</option>
          </select>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <select
            value={companyFilter}
            onChange={(event) => {
              setCompanyFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="ALL">All company styles</option>
            {companyOptions.map((company) => (
              <option key={company} value={company}>{company}</option>
            ))}
          </select>
          <select
            value={maxSeconds}
            onChange={(event) => {
              setMaxSeconds(Number(event.target.value));
              setPage(1);
            }}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value={300}>300s max</option>
            <option value={600}>600s max</option>
            <option value={900}>900s max</option>
            <option value={1200}>1200s max</option>
          </select>
          <Button
            type="button"
            variant={strictOnly ? "default" : "outline"}
            onClick={() => {
              setStrictOnly((value) => !value);
              setPage(1);
            }}
          >
            Strict Difficulty: {strictOnly ? "ON" : "OFF"}
          </Button>
          <div className="rounded-md border border-border bg-card/80 px-3 py-2 text-xs text-muted-foreground">
            <Filter className="mr-1 inline h-3 w-3" />
            {filtered.length.toLocaleString()} matching questions
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          {pageQuestions.map((question) => (
            <article key={question.id} className="rounded-xl border border-border bg-card/80 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{question.type}</Badge>
                <Badge variant="outline">{question.difficulty}</Badge>
                <Badge variant="outline">{question.questionFormat}</Badge>
                <span className="text-xs text-muted-foreground">{question.companyTag}</span>
              </div>
              <p className="mt-2 text-sm font-semibold">{question.question}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {question.expectedComplexity} | {question.estimatedSeconds}s | {firstTag(question.tags)}
              </p>
              {onUsePreset && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    onUsePreset({
                      type: question.type,
                      difficulty: question.difficulty,
                      questionFormat: question.questionFormat,
                      topics: firstTag(question.tags),
                      targetCompany: question.companyTag,
                      mcqCount: question.questionFormat === "MCQ" ? 6 : 4,
                      codingCount: question.questionFormat === "CODING" ? 6 : 4,
                    });
                    toast.success("Preset copied to Interview Setup.");
                  }}
                >
                  Use In Setup
                </Button>
              )}
            </article>
          ))}
          {!pageQuestions.length && (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              No question found with selected filters.
            </p>
          )}

          <div className="flex items-center justify-between rounded-xl border border-border bg-card/70 px-3 py-2">
            <p className="text-xs text-muted-foreground">Page {safePage} / {totalPages}</p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage <= 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Prev
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={safePage >= totalPages}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          <article className="rounded-xl border border-border bg-card/80 p-4">
            <h4 className="text-sm font-semibold">Hard MCQ Round</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Strict scoring: +4 / -1 / 0. Train for high-pressure shortlisting rounds.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Round score: {strictScore}</p>

            <div className="mt-3 space-y-3">
              {mcqRound.map((question, index) => (
                <div key={question.id} className="rounded-md border border-border p-3">
                  <p className="text-xs font-medium">Q{index + 1}. {question.question}</p>
                  <div className="mt-2 space-y-1">
                    {question.options.map((option) => {
                      const selected = picked[question.id] === option;
                      const isSubmitted = !!submitted[question.id];
                      const correct = option === question.correctAnswer;
                      const className = isSubmitted
                        ? correct
                          ? "border-success bg-success/10 text-success"
                          : selected
                            ? "border-destructive bg-destructive/10 text-destructive"
                            : "border-border"
                        : selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted/30";
                      return (
                        <button
                          key={option}
                          type="button"
                          className={`w-full rounded border px-2 py-1 text-left text-xs transition ${className}`}
                          onClick={() =>
                            setPicked((prev) => ({
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
                  {!!submitted[question.id] && (
                    <p className="mt-2 text-[11px] text-muted-foreground">{question.explanation}</p>
                  )}
                </div>
              ))}
              {!mcqRound.length && <p className="text-xs text-muted-foreground">MCQ pool unavailable for selected filters.</p>}
            </div>

            <div className="mt-3 flex gap-2">
              <Button type="button" onClick={evaluateRound} className="gap-1">
                <Target className="h-4 w-4" />
                Evaluate
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRoundVersion((value) => value + 1);
                  setPicked({});
                  setSubmitted({});
                  toast.info("New MCQ round generated.");
                }}
                className="gap-1"
              >
                <Sparkles className="h-4 w-4" />
                New Round
              </Button>
            </div>
          </article>

          <article className="rounded-xl border border-border bg-card/80 p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-primary" />
              Random Interview Copy
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Practice snapshot with random candidate profile and curated question mix.
            </p>
            <div className="mt-2 rounded-md border border-border p-3 text-xs">
              <p><span className="font-medium">Candidate:</span> {randomInterviewCopy.candidate}</p>
              <p><span className="font-medium">Target Role:</span> {randomInterviewCopy.role}</p>
              <p><span className="font-medium">Company Style:</span> {randomInterviewCopy.company}</p>
            </div>
            <div className="mt-2 space-y-2">
              {randomInterviewCopy.questions.map((question, index) => (
                <div key={`${question.id}-${index}`} className="rounded border border-border px-2 py-1 text-xs">
                  <p className="font-medium">Q{index + 1}. {question.question}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {question.questionFormat} | {question.difficulty} | {question.estimatedSeconds}s
                  </p>
                </div>
              ))}
              {!randomInterviewCopy.questions.length && (
                <p className="text-xs text-muted-foreground">No questions available for copy generation.</p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full"
              onClick={() => {
                setSheetVersion((value) => value + 1);
                toast.success("New random interview copy generated.");
              }}
            >
              Generate New Copy
            </Button>
          </article>
        </aside>
      </section>
    </div>
  );
}
