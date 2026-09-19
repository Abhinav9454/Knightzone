import { useMemo, useState } from "react";
import {
  Brain,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  Gauge,
  Sparkles,
  Target,
  Zap,
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

type ModeFilter = "ALL" | DuelVaultMode;
type DifficultyFilter = "ALL" | DuelVaultDifficulty;
type TypeFilter = "ALL" | DuelVaultQuestionType;

type SprintTrack = {
  id: string;
  name: string;
  theme: string;
  mode: DuelVaultMode;
  difficulty: DuelVaultDifficulty;
  focusType: DuelVaultQuestionType;
  recommendedCount: number;
};

const TRACKS: SprintTrack[] = [
  {
    id: "iit-algo-core",
    name: "IIT Algo Core",
    theme: "DSA depth + speed under time pressure",
    mode: "CODING",
    difficulty: "HARD",
    focusType: "CODING",
    recommendedCount: 12,
  },
  {
    id: "iit-mcq-elite",
    name: "IIT MCQ Elite",
    theme: "Rapid conceptual elimination rounds",
    mode: "QUIZ",
    difficulty: "EXTREME",
    focusType: "MCQ",
    recommendedCount: 15,
  },
  {
    id: "iit-combo-rush",
    name: "IIT Combo Rush",
    theme: "Mixed coding + MCQ + rapid fire stack",
    mode: "QUIZ",
    difficulty: "HARD",
    focusType: "RAPID_FIRE",
    recommendedCount: 18,
  },
];

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

const formatSeconds = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const calculateEloDelta = (myRating: number, opponentRating: number, score: number, k = 32) => {
  const expected = 1 / (1 + Math.pow(10, (opponentRating - myRating) / 400));
  return Math.round(k * (score - expected));
};

export default function DuelProLabsPanel() {
  const vault = useMemo(() => buildDuelQuestionVault(3600), []);

  const [modeFilter, setModeFilter] = useState<ModeFilter>("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [questionCount, setQuestionCount] = useState(12);
  const [generatedPack, setGeneratedPack] = useState<DuelVaultQuestion[]>([]);

  const [myRating, setMyRating] = useState(1450);
  const [opponentRating, setOpponentRating] = useState(1520);

  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    warmup: false,
    complexity: false,
    edgeCases: false,
    dryRun: false,
    postReview: false,
  });

  const companies = useMemo(
    () => Array.from(new Set(vault.map((item) => item.companyTag))).sort(),
    [vault],
  );

  const filteredPool = useMemo(
    () =>
      vault.filter((item) => {
        if (modeFilter !== "ALL" && item.mode !== modeFilter) return false;
        if (difficultyFilter !== "ALL" && item.difficulty !== difficultyFilter) return false;
        if (typeFilter !== "ALL" && item.type !== typeFilter) return false;
        if (companyFilter !== "ALL" && item.companyTag !== companyFilter) return false;
        return true;
      }),
    [companyFilter, difficultyFilter, modeFilter, typeFilter, vault],
  );

  const packStats = useMemo(() => {
    if (!generatedPack.length) {
      return {
        totalTimeSeconds: 0,
        totalPoints: 0,
        mcq: 0,
        coding: 0,
        rapid: 0,
      };
    }
    return {
      totalTimeSeconds: generatedPack.reduce((sum, item) => sum + item.estimatedSeconds, 0),
      totalPoints: generatedPack.reduce((sum, item) => sum + item.points, 0),
      mcq: generatedPack.filter((item) => item.type === "MCQ").length,
      coding: generatedPack.filter((item) => item.type === "CODING").length,
      rapid: generatedPack.filter((item) => item.type === "RAPID_FIRE").length,
    };
  }, [generatedPack]);

  const completionPercent = Math.round(
    (Object.values(checklist).filter(Boolean).length / Object.keys(checklist).length) * 100,
  );

  const generatePack = (override?: {
    mode?: DuelVaultMode;
    difficulty?: DuelVaultDifficulty;
    focusType?: DuelVaultQuestionType;
    count?: number;
  }) => {
    const mode = override?.mode || (modeFilter === "ALL" ? null : modeFilter);
    const difficulty = override?.difficulty || (difficultyFilter === "ALL" ? null : difficultyFilter);
    const focusType = override?.focusType || (typeFilter === "ALL" ? null : typeFilter);
    const count = Math.max(5, Math.min(30, override?.count || questionCount));

    const pool = vault.filter((item) => {
      if (mode && item.mode !== mode) return false;
      if (difficulty && item.difficulty !== difficulty) return false;
      if (focusType && item.type !== focusType) return false;
      if (companyFilter !== "ALL" && item.companyTag !== companyFilter) return false;
      return true;
    });

    const source = pool.length >= count ? pool : filteredPool.length ? filteredPool : vault;
    const nextPack = shuffle(source).slice(0, count);
    setGeneratedPack(nextPack);
    toast.success(`Duel pack generated with ${nextPack.length} questions.`);
  };

  const exportPack = async () => {
    if (!generatedPack.length) {
      toast.error("Generate a pack first.");
      return;
    }
    const lines = generatedPack.map((item, index) => {
      const head = `${index + 1}. [${item.type}][${item.difficulty}] ${item.prompt}`;
      const meta = `   Topic: ${item.topic} | Company: ${item.companyTag} | Time: ${item.estimatedSeconds}s | Points: ${item.points}`;
      return `${head}\n${meta}`;
    });
    const payload = [
      "PRO DUEL PACK",
      `Total: ${generatedPack.length}`,
      `Time Budget: ${formatSeconds(packStats.totalTimeSeconds)}`,
      `Points: ${packStats.totalPoints}`,
      "",
      ...lines,
    ].join("\n");

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
        toast.success("Pack exported to clipboard.");
      } else {
        toast.info("Clipboard not available in this browser.");
      }
    } catch {
      toast.error("Could not export pack.");
    }
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-4">
        <article className="rounded-2xl border border-border bg-gradient-to-r from-primary/20 via-accent/10 to-success/10 p-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Cpu className="h-5 w-5 text-primary" />
            Pro Duel Labs
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Advanced pack builder, rating simulator, and IIT sprint tracks for serious duel prep.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-card/70 p-2">
              <p className="text-[11px] text-muted-foreground">Vault</p>
              <p className="text-lg font-semibold">{vault.length.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-border bg-card/70 p-2">
              <p className="text-[11px] text-muted-foreground">Filtered Pool</p>
              <p className="text-lg font-semibold">{filteredPool.length.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-border bg-card/70 p-2">
              <p className="text-[11px] text-muted-foreground">Pack Time</p>
              <p className="text-lg font-semibold">{formatSeconds(packStats.totalTimeSeconds)}</p>
            </div>
            <div className="rounded-lg border border-border bg-card/70 p-2">
              <p className="text-[11px] text-muted-foreground">Pack Points</p>
              <p className="text-lg font-semibold">{packStats.totalPoints}</p>
            </div>
          </div>
        </article>

        <article className="glass-card space-y-3 p-4">
          <h4 className="text-sm font-semibold">Adaptive Pack Builder</h4>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <select
              value={modeFilter}
              onChange={(event) => setModeFilter(event.target.value as ModeFilter)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">All modes</option>
              <option value="QUIZ">Quiz</option>
              <option value="CODING">Coding</option>
              <option value="TYPING">Rapid</option>
            </select>
            <select
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value as DifficultyFilter)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">All difficulty</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
              <option value="EXTREME">Extreme</option>
            </select>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">All types</option>
              <option value="MCQ">MCQ</option>
              <option value="CODING">Coding</option>
              <option value="RAPID_FIRE">Rapid Fire</option>
            </select>
            <select
              value={companyFilter}
              onChange={(event) => setCompanyFilter(event.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">All company styles</option>
              {companies.map((company) => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
            <Input
              type="number"
              min={5}
              max={30}
              value={questionCount}
              onChange={(event) => setQuestionCount(Number(event.target.value))}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => generatePack()} className="gap-1">
              <Target className="h-4 w-4" />
              Generate Pack
            </Button>
            <Button variant="outline" onClick={exportPack} className="gap-1">
              <ClipboardCheck className="h-4 w-4" />
              Export Pack
            </Button>
          </div>

          {!!generatedPack.length && (
            <>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded border border-border p-2 text-xs">
                  <p className="text-muted-foreground">MCQ</p>
                  <p className="text-base font-semibold">{packStats.mcq}</p>
                </div>
                <div className="rounded border border-border p-2 text-xs">
                  <p className="text-muted-foreground">Coding</p>
                  <p className="text-base font-semibold">{packStats.coding}</p>
                </div>
                <div className="rounded border border-border p-2 text-xs">
                  <p className="text-muted-foreground">Rapid</p>
                  <p className="text-base font-semibold">{packStats.rapid}</p>
                </div>
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                {generatedPack.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="rounded border border-border/80 p-2 text-xs">
                    <p className="font-medium">
                      {index + 1}. [{item.type}] {item.prompt}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {item.topic} • {item.companyTag} • {item.estimatedSeconds}s • {item.points} pts
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </article>

        <article className="glass-card p-4">
          <h4 className="text-sm font-semibold">IIT Sprint Tracks</h4>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            {TRACKS.map((track) => (
              <button
                key={track.id}
                type="button"
                onClick={() =>
                  generatePack({
                    mode: track.mode,
                    difficulty: track.difficulty,
                    focusType: track.focusType,
                    count: track.recommendedCount,
                  })
                }
                className="rounded-xl border border-border bg-card/70 p-3 text-left transition hover:-translate-y-0.5 hover:border-primary/50"
              >
                <p className="text-sm font-semibold">{track.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{track.theme}</p>
                <p className="mt-2 text-[11px] text-primary">
                  {track.recommendedCount} Q • {track.difficulty} • {track.focusType}
                </p>
              </button>
            ))}
          </div>
        </article>
      </div>

      <div className="space-y-4">
        <article className="glass-card p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Calculator className="h-4 w-4 text-primary" />
            ELO Outcome Simulator
          </h4>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Your Rating</p>
              <Input
                type="number"
                value={myRating}
                onChange={(event) => setMyRating(Number(event.target.value))}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Opponent Rating</p>
              <Input
                type="number"
                value={opponentRating}
                onChange={(event) => setOpponentRating(Number(event.target.value))}
              />
            </div>
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <div className="rounded border border-border p-2">
              <p className="text-muted-foreground">If You Win</p>
              <p className="text-base font-semibold text-success">+{calculateEloDelta(myRating, opponentRating, 1)}</p>
            </div>
            <div className="rounded border border-border p-2">
              <p className="text-muted-foreground">If Draw</p>
              <p className="text-base font-semibold">{calculateEloDelta(myRating, opponentRating, 0.5)}</p>
            </div>
            <div className="rounded border border-border p-2">
              <p className="text-muted-foreground">If Loss</p>
              <p className="text-base font-semibold text-destructive">{calculateEloDelta(myRating, opponentRating, 0)}</p>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Gauge className="h-4 w-4 text-primary" />
            Match Checklist
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Round readiness: {completionPercent}%
          </p>
          <div className="mt-3 space-y-2">
            {[
              { id: "warmup", label: "5-min warmup completed", icon: Zap },
              { id: "complexity", label: "Complexity templates revised", icon: Brain },
              { id: "edgeCases", label: "Edge-case checklist ready", icon: CheckCircle2 },
              { id: "dryRun", label: "Dry-run discipline enabled", icon: Target },
              { id: "postReview", label: "Post-match review plan set", icon: Sparkles },
            ].map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-2 rounded border border-border bg-card/70 px-2 py-2 text-xs"
              >
                <input
                  type="checkbox"
                  checked={!!checklist[item.id]}
                  onChange={(event) =>
                    setChecklist((prev) => ({
                      ...prev,
                      [item.id]: event.target.checked,
                    }))
                  }
                />
                <item.icon className="h-3.5 w-3.5 text-primary" />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

