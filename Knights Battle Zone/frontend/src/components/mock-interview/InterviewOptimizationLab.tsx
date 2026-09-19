import { useMemo, useState } from "react";
import { AlertTriangle, Gauge, Lightbulb, Rocket, Timer, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_INTERVIEW_VAULT_COUNT,
  getMockInterviewVaultSnapshot,
  type InterviewVaultDifficulty,
  type InterviewVaultQuestion,
} from "@/lib/mock-interview-vault";

interface OptimizationReport {
  score: number;
  readability: number;
  complexityConfidence: number;
  clarity: number;
  benchmarkFit: number;
  correctnessRisk: number;
  estimatedRuntime: string;
  strengths: string[];
  antiPatterns: string[];
  notes: string[];
  elapsedSeconds: number;
}

const detectComplexity = (text: string): string => {
  const source = text.toLowerCase();
  if (source.includes("o(1)")) return "O(1)";
  if (source.includes("o(log n)")) return "O(log n)";
  if (source.includes("o(n log n)")) return "O(n log n)";
  if (source.includes("o(n^2)") || source.includes("o(n2)") || source.includes("nested")) return "O(n^2)";
  if (source.includes("o(n)")) return "O(n)";
  return "Unknown";
};

const complexityRank = (value?: string): number => {
  const normalized = (value || "").toLowerCase();
  if (normalized.includes("o(1)")) return 1;
  if (normalized.includes("o(log n)")) return 2;
  if (normalized.includes("o(n)")) return 3;
  if (normalized.includes("o(n log n)")) return 4;
  if (normalized.includes("o(n^2)") || normalized.includes("o(n2)")) return 5;
  return 6;
};

const buildReport = (
  approach: string,
  code: string,
  expectedComplexity?: string,
  startedAt?: number,
): OptimizationReport => {
  const payload = `${approach}\n${code}`.toLowerCase();
  const hasComplexity = payload.includes("o(");
  const hasSpaceComplexity = payload.includes("space complexity") || payload.includes("space:");
  const hasEdgeCases = payload.includes("edge") || payload.includes("corner") || payload.includes("null");
  const hasTradeOff = payload.includes("trade") || payload.includes("memory");
  const hasDataStructure = payload.includes("hash") || payload.includes("heap") || payload.includes("queue") || payload.includes("stack");
  const hasOptimization = payload.includes("optimiz") || payload.includes("prun") || payload.includes("cache");
  const hasReadableIntent = payload.includes("step") || payload.includes("explain") || payload.includes("invariant");
  const hasDryRun = payload.includes("dry run") || payload.includes("example");
  const hasFailurePath = payload.includes("fail") || payload.includes("invalid");
  const hasTests = payload.includes("test case") || payload.includes("unit test");
  const usesNestedLoops = code.toLowerCase().includes("for") && code.toLowerCase().split("for").length > 2;
  const mentionsRecursion = payload.includes("recurs");
  const mentionsMemoization = payload.includes("memo") || payload.includes("dp");

  const readability = Math.min(
    100,
    30 + (hasReadableIntent ? 18 : 0) + (approach.length > 260 ? 16 : 6) + (hasDryRun ? 12 : 0) + (hasTests ? 8 : 0),
  );
  const complexityConfidence = Math.min(
    100,
    15
      + (hasComplexity ? 28 : 0)
      + (hasSpaceComplexity ? 12 : 0)
      + (hasDataStructure ? 20 : 0)
      + (hasOptimization ? 18 : 0)
      + (hasTradeOff ? 10 : 0),
  );
  const clarity = Math.min(
    100,
    24 + (hasEdgeCases ? 18 : 0) + (hasFailurePath ? 10 : 0) + (approach.length > 180 ? 22 : 8) + (code.length > 130 ? 14 : 6),
  );

  const claimedComplexity = detectComplexity(payload);
  const expectedRank = complexityRank(expectedComplexity);
  const claimedRank = complexityRank(claimedComplexity);
  const complexityGap = Math.abs(expectedRank - claimedRank);
  const benchmarkFit = Math.max(20, 100 - complexityGap * 18);

  let correctnessRisk = 60;
  if (hasEdgeCases) correctnessRisk -= 14;
  if (hasTests) correctnessRisk -= 10;
  if (hasFailurePath) correctnessRisk -= 8;
  if (usesNestedLoops && !hasOptimization) correctnessRisk += 12;
  if (mentionsRecursion && !mentionsMemoization) correctnessRisk += 8;
  correctnessRisk = Math.max(5, Math.min(95, correctnessRisk));

  const antiPatterns: string[] = [];
  if (!hasComplexity) antiPatterns.push("Complexity statement missing.");
  if (!hasEdgeCases) antiPatterns.push("Edge-case handling not explicit.");
  if (usesNestedLoops && !hasOptimization) antiPatterns.push("Nested loops without optimization strategy.");
  if (mentionsRecursion && !mentionsMemoization) antiPatterns.push("Recursion used without memoization discussion.");
  if (!hasTradeOff) antiPatterns.push("Time vs space trade-off not discussed.");
  if (!hasTests) antiPatterns.push("Test case strategy missing.");

  const strengths: string[] = [];
  if (hasComplexity) strengths.push("Complexity communication present.");
  if (hasDataStructure) strengths.push("Data structure rationale is visible.");
  if (hasOptimization) strengths.push("Optimization intent is clear.");
  if (hasEdgeCases) strengths.push("Edge-case awareness present.");
  if (hasDryRun) strengths.push("Dry-run style explanation improves confidence.");
  if (hasTests) strengths.push("Validation mindset shown via test planning.");

  const notes: string[] = [];
  if (benchmarkFit < 70) notes.push(`Benchmark mismatch: expected ${expectedComplexity || "target complexity"}, claimed ${claimedComplexity}.`);
  if (correctnessRisk > 45) notes.push("Correctness risk is moderate/high. Add edge paths and tests.");
  if (!notes.length) notes.push("Strong optimization narrative with good benchmark alignment.");

  const score = Math.round(
    readability * 0.22
      + complexityConfidence * 0.33
      + clarity * 0.2
      + benchmarkFit * 0.15
      + (100 - correctnessRisk) * 0.1,
  );

  const elapsedSeconds = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : 0;

  return {
    score,
    readability,
    complexityConfidence,
    clarity,
    benchmarkFit,
    correctnessRisk,
    estimatedRuntime: claimedComplexity,
    strengths,
    antiPatterns,
    notes,
    elapsedSeconds,
  };
};

const toneByDifficulty: Record<InterviewVaultDifficulty, string> = {
  BEGINNER: "text-success",
  INTERMEDIATE: "text-primary",
  ADVANCED: "text-warning",
};

export default function InterviewOptimizationLab() {
  const codingQuestions = useMemo(
    () =>
      getMockInterviewVaultSnapshot(DEFAULT_INTERVIEW_VAULT_COUNT).filter(
        (item) => item.questionFormat === "CODING",
      ),
    [],
  );

  const [selectedId, setSelectedId] = useState<number>(codingQuestions[0]?.id ?? 1);
  const [approach, setApproach] = useState("");
  const [codeDraft, setCodeDraft] = useState("");
  const [report, setReport] = useState<OptimizationReport | null>(null);
  const [analysisStartedAt, setAnalysisStartedAt] = useState<number>(Date.now());

  const activeQuestion = useMemo(
    () => codingQuestions.find((item) => item.id === selectedId) || codingQuestions[0] || null,
    [codingQuestions, selectedId],
  );

  const runAnalysis = () => {
    if (!approach.trim() || !codeDraft.trim()) {
      toast.error("Approach and code draft both required for hard optimization check.");
      return;
    }
    const nextReport = buildReport(
      approach,
      codeDraft,
      activeQuestion?.expectedComplexity,
      analysisStartedAt,
    );
    setReport(nextReport);
    toast.success(`Optimization score generated: ${nextReport.score}/100`);
  };

  const randomChallenge = () => {
    if (!codingQuestions.length) return;
    const randomItem = codingQuestions[Math.floor(Math.random() * codingQuestions.length)];
    setSelectedId(randomItem.id);
    setApproach("");
    setCodeDraft("");
    setReport(null);
    setAnalysisStartedAt(Date.now());
    toast.info("New optimization challenge loaded.");
  };

  const loadStrictTemplate = () => {
    setApproach(
      "1) Clarify constraints and expected input size.\n"
      + "2) Present optimized approach with chosen data structure.\n"
      + "3) Mention time and space complexity explicitly.\n"
      + "4) Cover edge cases and one dry run.\n"
      + "5) Explain trade-offs against alternate approach.",
    );
    setCodeDraft(
      "// Pseudocode template\n"
      + "// Handle edge cases first\n"
      + "// Build optimized data structure\n"
      + "// Iterate once with invariant checks\n"
      + "// Return final answer\n",
    );
    setReport(null);
    setAnalysisStartedAt(Date.now());
    toast.success("Strict optimization template loaded.");
  };

  if (!activeQuestion) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        Optimization lab temporarily unavailable.
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-4 rounded-xl border border-border bg-card/80 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Rocket className="h-5 w-5 text-primary" />
              Optimization Lab
            </h3>
            <p className="text-sm text-muted-foreground">
              Coding interview optimization drills with strict quality checks.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadStrictTemplate}>Load Template</Button>
            <Button variant="outline" onClick={randomChallenge}>New Challenge</Button>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <select
            value={selectedId}
            onChange={(event) => {
              setSelectedId(Number(event.target.value));
              setReport(null);
              setAnalysisStartedAt(Date.now());
            }}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {codingQuestions.slice(0, 220).map((question) => (
              <option key={question.id} value={question.id}>
                #{question.id} {question.companyTag} - {question.category}
              </option>
            ))}
          </select>
          <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            Benchmark target: {activeQuestion.expectedComplexity} in {activeQuestion.estimatedSeconds}s
          </div>
        </div>

        <div className="rounded-lg border border-border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{activeQuestion.type}</Badge>
            <Badge variant="outline">{activeQuestion.difficulty}</Badge>
            <span className={`text-xs font-medium ${toneByDifficulty[activeQuestion.difficulty]}`}>
              {activeQuestion.companyTag} style
            </span>
          </div>
          <p className="mt-2 text-sm font-medium">{activeQuestion.question}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Approach Explanation</p>
          <Textarea
            rows={5}
            value={approach}
            onChange={(event) => setApproach(event.target.value)}
            placeholder="Explain approach, complexity, edge cases, trade-offs, and test strategy..."
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Code / Pseudocode Draft</p>
          <Textarea
            rows={8}
            value={codeDraft}
            onChange={(event) => setCodeDraft(event.target.value)}
            placeholder="Paste code or pseudocode..."
          />
        </div>

        <Button onClick={runAnalysis} className="gap-1">
          <Zap className="h-4 w-4" />
          Run Hard Optimization Check
        </Button>
      </section>

      <aside className="space-y-3">
        <article className="rounded-xl border border-border bg-card/80 p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Gauge className="h-4 w-4 text-primary" />
            Optimization Report
          </h4>
          {!report && (
            <p className="mt-2 text-sm text-muted-foreground">
              Submit approach and code to generate an interview optimization report.
            </p>
          )}
          {report && (
            <div className="mt-2 space-y-3">
              <div className="rounded-md border border-border p-2">
                <p className="text-xs text-muted-foreground">Final Score</p>
                <p className="text-2xl font-bold">{report.score}/100</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded border border-border p-2">
                  <p className="text-[11px] text-muted-foreground">Readability</p>
                  <p className="text-sm font-semibold">{report.readability}</p>
                </div>
                <div className="rounded border border-border p-2">
                  <p className="text-[11px] text-muted-foreground">Complexity</p>
                  <p className="text-sm font-semibold">{report.complexityConfidence}</p>
                </div>
                <div className="rounded border border-border p-2">
                  <p className="text-[11px] text-muted-foreground">Clarity</p>
                  <p className="text-sm font-semibold">{report.clarity}</p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded border border-border p-2">
                  <p className="text-[11px] text-muted-foreground">Benchmark Fit</p>
                  <p className="text-sm font-semibold">{report.benchmarkFit}</p>
                </div>
                <div className="rounded border border-border p-2">
                  <p className="text-[11px] text-muted-foreground">Correctness Risk</p>
                  <p className="text-sm font-semibold">{report.correctnessRisk}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Estimated runtime claim: {report.estimatedRuntime}
              </p>
            </div>
          )}
        </article>

        <article className="rounded-xl border border-border bg-card/80 p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="h-4 w-4 text-primary" />
            Strength Signals
          </h4>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {(report?.strengths || [
              "Add explicit complexity statement with data-structure rationale.",
              "Mention edge-case strategy before coding.",
              "Provide dry run and one alternate approach trade-off.",
            ]).map((note) => (
              <li key={note}>- {note}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-border bg-card/80 p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-primary" />
            Risk Notes
          </h4>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {(report?.antiPatterns || [
              "Avoid nested loops without pruning or indexing.",
              "Back complexity claim with exact justification.",
              "Include tests for null, boundary, and duplicate cases.",
            ]).map((note) => (
              <li key={note}>- {note}</li>
            ))}
          </ul>
          {report?.notes?.length ? (
            <p className="mt-2 text-xs text-muted-foreground">{report.notes[0]}</p>
          ) : null}
        </article>

        <article className="rounded-xl border border-border bg-card/80 p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Timer className="h-4 w-4 text-primary" />
            Sprint Goal
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Target 3 challenges/day. Keep optimization score above 82 and correctness risk below 35.
          </p>
          {report ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Analysis cycle time: {report.elapsedSeconds}s
            </p>
          ) : null}
        </article>
      </aside>
    </div>
  );
}
