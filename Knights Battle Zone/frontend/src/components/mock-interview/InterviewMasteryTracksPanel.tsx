import { useMemo, useState } from "react";
import {
  BarChart3,
  Briefcase,
  CalendarClock,
  GraduationCap,
  Rocket,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InterviewMasteryTrackProgress } from "@/lib/types";
import {
  DEFAULT_INTERVIEW_VAULT_COUNT,
  getMockInterviewVaultSnapshot,
  getMockInterviewVaultStats,
  type InterviewVaultDifficulty,
  type InterviewVaultFormat,
  type InterviewVaultQuestion,
  type InterviewVaultType,
} from "@/lib/mock-interview-vault";

export interface InterviewMasteryPlanPreset {
  trackId: string;
  trackTitle: string;
  type: InterviewVaultType;
  difficulty: InterviewVaultDifficulty;
  questionFormat: "MIXED" | InterviewVaultFormat;
  topics: string;
  targetCompany: string;
  mcqCount: number;
  codingCount: number;
  durationMinutes: number;
  weeklyGoal: string;
  readinessScore: number;
  currentWeek: number;
}

interface InterviewMasteryTracksPanelProps {
  onApplyPlan?: (preset: InterviewMasteryPlanPreset) => void;
  masteryProgress?: InterviewMasteryTrackProgress[];
  onRecordSprint?: (trackId: string) => void | Promise<void>;
}

interface MasteryTrackDefinition {
  id: string;
  title: string;
  subtitle: string;
  type: InterviewVaultType;
  difficulty: InterviewVaultDifficulty;
  questionFormat: "MIXED" | InterviewVaultFormat;
  topics: string;
  targetCompany: string;
  mcqCount: number;
  codingCount: number;
  durationMinutes: number;
  weeklyGoal: string;
  outcomes: string[];
  pillars: string[];
}

const TRACKS: MasteryTrackDefinition[] = [
  {
    id: "dsa-accelerator",
    title: "DSA Accelerator",
    subtitle: "Problem solving speed with hard coding rounds",
    type: "TECHNICAL",
    difficulty: "ADVANCED",
    questionFormat: "MIXED",
    topics: "Arrays, Graphs, Dynamic Programming, Hashing",
    targetCompany: "Google",
    mcqCount: 6,
    codingCount: 8,
    durationMinutes: 60,
    weeklyGoal: "5 full interviews + 2 hard revision blocks",
    outcomes: [
      "Improve coding round closure under 45 minutes",
      "Build clear complexity communication",
      "Train fallback strategy for stuck states",
    ],
    pillars: ["Algorithm depth", "Complexity proof", "Edge-case discipline"],
  },
  {
    id: "system-design-core",
    title: "System Design Core",
    subtitle: "Architecture + trade-off heavy technical interviews",
    type: "CUSTOM",
    difficulty: "ADVANCED",
    questionFormat: "OPEN_ENDED",
    topics: "System Design, Databases, Caching, Microservices",
    targetCompany: "Uber",
    mcqCount: 3,
    codingCount: 4,
    durationMinutes: 60,
    weeklyGoal: "4 design mocks + 2 architecture retrospectives",
    outcomes: [
      "Structure large-system answers using layered approach",
      "Defend trade-offs with cost and reliability reasoning",
      "Improve API and data model articulation",
    ],
    pillars: ["Scalability", "Reliability", "Cost-awareness"],
  },
  {
    id: "behavioral-executive",
    title: "Behavioral Executive",
    subtitle: "Leadership and ownership storytelling with STAR rigor",
    type: "BEHAVIORAL",
    difficulty: "INTERMEDIATE",
    questionFormat: "MIXED",
    topics: "Leadership, Conflict Resolution, Stakeholder Management",
    targetCompany: "Microsoft",
    mcqCount: 8,
    codingCount: 2,
    durationMinutes: 45,
    weeklyGoal: "6 storytelling drills + 1 recorded reflection",
    outcomes: [
      "Craft concise stories with measurable impact",
      "Handle follow-up probes without losing structure",
      "Increase confidence in panel style discussions",
    ],
    pillars: ["Story clarity", "Executive communication", "Ownership mindset"],
  },
  {
    id: "hr-readiness",
    title: "HR Readiness Pro",
    subtitle: "Offer-stage HR and role-fit interview preparation",
    type: "HR",
    difficulty: "INTERMEDIATE",
    questionFormat: "MCQ",
    topics: "Compensation, Role Alignment, Motivation, Work Style",
    targetCompany: "Amazon",
    mcqCount: 10,
    codingCount: 0,
    durationMinutes: 30,
    weeklyGoal: "7 quick HR drills + daily response refinement",
    outcomes: [
      "Negotiate with clarity and professionalism",
      "Improve alignment answers for role and culture",
      "Avoid vague responses in salary and growth discussions",
    ],
    pillars: ["Professional tone", "Role-fit precision", "Negotiation confidence"],
  },
];

const matchesTrack = (question: InterviewVaultQuestion, track: MasteryTrackDefinition) => {
  if (question.type !== track.type) return false;
  if (track.questionFormat !== "MIXED" && question.questionFormat !== track.questionFormat) return false;
  if (question.difficulty !== track.difficulty && track.difficulty === "ADVANCED") return false;
  return true;
};

const prioritySort = (question: InterviewVaultQuestion, track: MasteryTrackDefinition) => {
  const companyBoost = question.companyTag === track.targetCompany ? 100 : 0;
  const difficultyBoost =
    question.difficulty === track.difficulty ? 30 : question.difficulty === "INTERMEDIATE" ? 12 : 4;
  const codingBoost = question.questionFormat === "CODING" ? 15 : 0;
  const topicBoost = question.tags?.toLowerCase().includes(track.topics.split(",")[0].trim().toLowerCase()) ? 12 : 0;
  return companyBoost + difficultyBoost + codingBoost + topicBoost;
};

export default function InterviewMasteryTracksPanel({
  onApplyPlan,
  masteryProgress = [],
  onRecordSprint,
}: InterviewMasteryTracksPanelProps) {
  const bank = useMemo(() => getMockInterviewVaultSnapshot(DEFAULT_INTERVIEW_VAULT_COUNT), []);
  const stats = useMemo(() => getMockInterviewVaultStats(bank), [bank]);
  const progressByTrackId = useMemo(
    () =>
      masteryProgress.reduce<Record<string, InterviewMasteryTrackProgress>>((acc, progress) => {
        acc[progress.trackId] = progress;
        return acc;
      }, {}),
    [masteryProgress],
  );

  const [selectedTrackId, setSelectedTrackId] = useState(TRACKS[0].id);
  const [roundSeed, setRoundSeed] = useState(0);
  const [week, setWeek] = useState(1);

  const selectedTrack = useMemo(
    () => TRACKS.find((track) => track.id === selectedTrackId) || TRACKS[0],
    [selectedTrackId],
  );

  const availabilityCount = useMemo(
    () => bank.filter((question) => matchesTrack(question, selectedTrack)).length,
    [bank, selectedTrack],
  );

  const simulationRound = useMemo(() => {
    const scoped = bank
      .filter((question) => matchesTrack(question, selectedTrack))
      .sort((a, b) => prioritySort(b, selectedTrack) - prioritySort(a, selectedTrack));

    if (!scoped.length) return [];

    const packSize = Math.min(12, Math.max(6, selectedTrack.mcqCount + selectedTrack.codingCount));
    const start = (roundSeed * packSize) % scoped.length;
    const first = scoped.slice(start, start + packSize);
    if (first.length === packSize) return first;
    return [...first, ...scoped.slice(0, packSize - first.length)];
  }, [bank, roundSeed, selectedTrack]);

  const readinessScore = Math.min(
    99,
    Math.round(
      (availabilityCount / Math.max(1, stats.total)) * 520
      + (selectedTrack.difficulty === "ADVANCED" ? 30 : 18)
      + (selectedTrack.questionFormat === "MIXED" ? 16 : 10),
    ),
  );

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-gradient-to-r from-primary/20 via-info/10 to-success/10 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <GraduationCap className="h-5 w-5 text-primary" />
              Mastery Tracks
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Structured interview plans built on {stats.total.toLocaleString()} validated prompts with MCQ + coding coverage.
            </p>
          </div>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            Pro prep mode
          </Badge>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border border-border bg-card/80 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Question Bank</p>
            <p className="text-lg font-semibold">{stats.total.toLocaleString()}</p>
          </div>
          <div className="rounded-md border border-border bg-card/80 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">MCQ Pool</p>
            <p className="text-lg font-semibold">{stats.byFormat.MCQ.toLocaleString()}</p>
          </div>
          <div className="rounded-md border border-border bg-card/80 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Coding Pool</p>
            <p className="text-lg font-semibold">{stats.byFormat.CODING.toLocaleString()}</p>
          </div>
          <div className="rounded-md border border-border bg-card/80 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Company Styles</p>
            <p className="text-lg font-semibold">{stats.companyCount}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          {TRACKS.map((track) => {
            const selected = track.id === selectedTrack.id;
            const savedProgress = progressByTrackId[track.id];
            const trackAvailability = bank.filter((question) => matchesTrack(question, track)).length;
            const trackReadiness = Math.min(
              99,
              Math.round(
                (trackAvailability / Math.max(1, stats.total)) * 520
                + (track.difficulty === "ADVANCED" ? 30 : 18)
                + (track.questionFormat === "MIXED" ? 16 : 10),
              ),
            );
            return (
              <article
                key={track.id}
                className={`rounded-xl border p-4 transition ${
                  selected
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-card/80 hover:border-primary/20"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold">{track.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">{track.subtitle}</p>
                  </div>
                  <Badge variant="outline">{track.difficulty}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">{track.type}</Badge>
                  <Badge variant="outline">{track.questionFormat}</Badge>
                  <Badge variant="outline">{track.durationMinutes} min</Badge>
                  {savedProgress?.status && <Badge variant="outline">{savedProgress.status}</Badge>}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Pillars: {track.pillars.join(" | ")}</p>
                {savedProgress && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Progress: {(savedProgress.completionPercent || 0).toFixed(0)}% | Sprints: {savedProgress.completedSprints || 0} | Readiness: {(savedProgress.readinessScore || 0).toFixed(0)}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={selected ? "default" : "outline"}
                    onClick={() => setSelectedTrackId(track.id)}
                  >
                    {selected ? "Selected" : "Select Track"}
                  </Button>
                  {onApplyPlan && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onApplyPlan({
                          trackId: track.id,
                          trackTitle: track.title,
                          type: track.type,
                          difficulty: track.difficulty,
                          questionFormat: track.questionFormat,
                          topics: track.topics,
                          targetCompany: track.targetCompany,
                          mcqCount: track.mcqCount,
                          codingCount: track.codingCount,
                          durationMinutes: track.durationMinutes,
                          weeklyGoal: track.weeklyGoal,
                          readinessScore: savedProgress?.readinessScore ?? trackReadiness,
                          currentWeek: week,
                        });
                        toast.success(`${track.title} applied to Interview Setup.`);
                      }}
                    >
                      Apply In Setup
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <aside className="space-y-3">
          <article className="rounded-xl border border-border bg-card/80 p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <Target className="h-4 w-4 text-primary" />
              Track Summary
            </h4>
            <div className="mt-2 space-y-2 text-xs text-muted-foreground">
              <p><span className="font-medium text-foreground">Topics:</span> {selectedTrack.topics}</p>
              <p><span className="font-medium text-foreground">Target Company:</span> {selectedTrack.targetCompany}</p>
              <p><span className="font-medium text-foreground">Weekly Goal:</span> {selectedTrack.weeklyGoal}</p>
              <p><span className="font-medium text-foreground">Question Availability:</span> {availabilityCount.toLocaleString()}</p>
              {progressByTrackId[selectedTrack.id] && (
                <p>
                  <span className="font-medium text-foreground">Saved Progress:</span> {(progressByTrackId[selectedTrack.id].completionPercent || 0).toFixed(0)}% ({progressByTrackId[selectedTrack.id].status || "ON_TRACK"})
                </p>
              )}
            </div>
            <div className="mt-3 rounded-md border border-border p-3">
              <p className="text-[11px] text-muted-foreground">Readiness Index</p>
              <p className="text-2xl font-bold">{readinessScore}/100</p>
              <p className="text-[11px] text-muted-foreground">Based on difficulty fit, coverage, and format balance.</p>
            </div>
          </article>

          <article className="rounded-xl border border-border bg-card/80 p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <CalendarClock className="h-4 w-4 text-primary" />
              Weekly Sprint Planner
            </h4>
            <div className="mt-2 flex items-center gap-2">
              <select
                value={week}
                onChange={(event) => setWeek(Number(event.target.value))}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs"
              >
                <option value={1}>Week 1</option>
                <option value={2}>Week 2</option>
                <option value={3}>Week 3</option>
                <option value={4}>Week 4</option>
              </select>
              <Button type="button" size="sm" variant="outline" onClick={() => setRoundSeed((seed) => seed + 1)}>
                <Sparkles className="mr-1 h-3 w-3" />
                Refresh Round
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Week {week} focus: {selectedTrack.outcomes[(week - 1) % selectedTrack.outcomes.length]}
            </p>
            {onRecordSprint && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => onRecordSprint(selectedTrack.id)}
              >
                Mark Sprint Complete
              </Button>
            )}
          </article>

          <article className="rounded-xl border border-border bg-card/80 p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <Rocket className="h-4 w-4 text-primary" />
              Simulation Blueprint
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Professional interview pack with mixed pressure stages.
            </p>
            <div className="mt-2 space-y-2">
              {simulationRound.slice(0, 6).map((question, index) => (
                <div key={`${question.id}-${index}`} className="rounded-md border border-border p-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{question.questionFormat}</Badge>
                    <Badge variant="outline" className="text-[10px]">{question.difficulty}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs">{question.question}</p>
                </div>
              ))}
              {!simulationRound.length && (
                <p className="rounded-md border border-dashed border-border p-2 text-xs text-muted-foreground">
                  No simulation questions for selected track.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-xl border border-border bg-card/80 p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className="h-4 w-4 text-primary" />
              Outcomes
            </h4>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {selectedTrack.outcomes.map((outcome) => (
                <li key={outcome}>- {outcome}</li>
              ))}
            </ul>
          </article>

          <article className="rounded-xl border border-border bg-card/80 p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <Briefcase className="h-4 w-4 text-primary" />
              Interview Standard
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Focus on clear communication, optimization-first reasoning, and evidence-backed decisions.
            </p>
          </article>
        </aside>
      </section>
    </div>
  );
}
