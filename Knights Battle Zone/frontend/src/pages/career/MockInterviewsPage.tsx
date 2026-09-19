import { useEffect, useMemo, useState } from "react";
import { interviewApi } from "@/lib/api";
import { useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Video,
  Calendar,
  User,
  Mic,
  MessageSquare,
  Brain,
  LineChart,
  LibraryBig,
  Layers,
  Rocket,
  SlidersHorizontal,
  Trophy,
  Play,
  SkipForward,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type {
  InterviewMasteryTrackProgress,
  InterviewQuestionBankItem,
  MockInterviewSession,
  UserInterviewAnalytics,
} from "@/lib/types";
import { getApiErrorMessage } from "@/lib/error";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useRealtimeRefresh } from "@/lib/realtime";
import { isAdminRole } from "@/lib/auth-role";
import InterviewQuestionVaultPanel from "@/components/mock-interview/InterviewQuestionVaultPanel";
import InterviewOptimizationLab from "@/components/mock-interview/InterviewOptimizationLab";
import InterviewMasteryTracksPanel from "@/components/mock-interview/InterviewMasteryTracksPanel";
import { DEFAULT_INTERVIEW_VAULT_COUNT } from "@/lib/mock-interview-vault";

type InterviewMode = "AI" | "PEER" | "EXPERT";
type InterviewType = "TECHNICAL" | "BEHAVIORAL" | "HR" | "CUSTOM";
type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type QuestionFormat = "MIXED" | "OPEN_ENDED" | "MCQ" | "CODING";
type PageTab = "dashboard" | "setup" | "tracks" | "vault" | "optimizer" | "history" | "profile" | "admin";
type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const formatLabel = (value?: string) =>
  value
    ? value
        .toLowerCase()
        .split("_")
        .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
        .join(" ")
    : "General";

const formatDateTime = (value?: string) => {
  if (!value) return "Not scheduled";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not scheduled";
  return parsed.toLocaleString();
};

const getScoreText = (value?: number) =>
  typeof value === "number" && Number.isFinite(value) ? `${Math.round(value)}%` : "Awaiting score";

const getStatusBadgeVariant = (status: MockInterviewSession["status"]): BadgeVariant => {
  if (status === "COMPLETED") return "default";
  if (status === "IN_PROGRESS") return "secondary";
  if (status === "CANCELLED") return "destructive";
  return "outline";
};

export default function MockInterviewsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState<PageTab>("dashboard");

  const [mode, setMode] = useState<InterviewMode>("AI");
  const [interviewType, setInterviewType] = useState<InterviewType>("TECHNICAL");
  const [difficulty, setDifficulty] = useState<Difficulty>("INTERMEDIATE");
  const [questionFormat, setQuestionFormat] = useState<QuestionFormat>("MIXED");
  const [targetCompany, setTargetCompany] = useState("Google");
  const [mcqCount, setMcqCount] = useState(4);
  const [codingCount, setCodingCount] = useState(4);
  const [topics, setTopics] = useState("Software Engineer");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [scheduledTime, setScheduledTime] = useState(new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16));
  const [interviewerName, setInterviewerName] = useState("");
  const [strictMode, setStrictMode] = useState(true);
  const [negativeMarking, setNegativeMarking] = useState(true);
  const [focusSprintsPerWeek, setFocusSprintsPerWeek] = useState(5);
  const [activeMasteryTrackId, setActiveMasteryTrackId] = useState<string | null>(null);
  const [activeMasteryTrackTitle, setActiveMasteryTrackTitle] = useState<string>("");

  const [sessions, setSessions] = useState<MockInterviewSession[]>([]);
  const [analytics, setAnalytics] = useState<UserInterviewAnalytics | null>(null);
  const [overallStats, setOverallStats] = useState<{ totalUsers: number; totalInterviews: number; completedInterviews: number; averageOverallScore: number } | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestionBankItem[]>([]);
  const [masteryProgress, setMasteryProgress] = useState<InterviewMasteryTrackProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [activeAiSessionId, setActiveAiSessionId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [answering, setAnswering] = useState(false);

  const [profileBio, setProfileBio] = useState("Aspiring SDE focused on frontend + DSA");
  const [profileSkills, setProfileSkills] = useState("JavaScript, React, Python, DSA");
  const [profileTargetRoles, setProfileTargetRoles] = useState("SDE, Frontend Developer");
  const [availableForPeer, setAvailableForPeer] = useState(true);
  const { run, running } = useAsyncAction();
  const hasLoadedOnce = useRef(false);
  const hasLoadErrorToast = useRef(false);

  const isAdmin = isAdminRole(user?.role);

  const loadAll = useCallback(async () => {
    if (!user?.id) return false;
    const shouldShowLoader = !hasLoadedOnce.current;
    if (shouldShowLoader) {
      setLoading(true);
    }
    try {
      const [mySessions, myAnalytics, bank, mastery] = await Promise.all([
        interviewApi.getMyInterviews(),
        interviewApi.getUserAnalytics(user.id),
        interviewApi.getQuestions().catch(() => []),
        interviewApi.getMasteryProgress().catch(() => []),
      ]);
      setSessions(mySessions);
      setAnalytics(myAnalytics);
      setQuestions(bank);
      setMasteryProgress(mastery);

      if (isAdmin) {
        const overall = await interviewApi.getOverallAnalytics().catch(() => null);
        setOverallStats(overall);
      }
      hasLoadErrorToast.current = false;
      return true;
    } catch {
      if (!hasLoadErrorToast.current) {
        toast.error("Unable to load mock interview data.");
        hasLoadErrorToast.current = true;
      }
      return false;
    } finally {
      if (shouldShowLoader) {
        hasLoadedOnce.current = true;
        setLoading(false);
      }
    }
  }, [isAdmin, user?.id]);

  useRealtimeRefresh(loadAll, {
    enabled: !!user?.id,
    intervalMs: 30000,
    maxIntervalMs: 150000,
    backoffMultiplier: 1.8,
    jitterRatio: 0.2,
    scope: "mock-interviews",
  });

  useEffect(() => {
    if (activeMasteryTrackId || masteryProgress.length === 0) return;
    setActiveMasteryTrackId(masteryProgress[0].trackId);
    setActiveMasteryTrackTitle(masteryProgress[0].trackTitle || "");
  }, [activeMasteryTrackId, masteryProgress]);

  const activeAiSession = useMemo(
    () => sessions.find((s) => s.id === activeAiSessionId) || null,
    [sessions, activeAiSessionId],
  );

  const upcoming = useMemo(
    () =>
      sessions
        .filter((s) => s.status === "SCHEDULED" || s.status === "IN_PROGRESS")
        .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
        .slice(0, 4),
    [sessions],
  );

  const history = useMemo(
    () =>
      sessions
        .filter((s) => s.status === "COMPLETED" || s.status === "CANCELLED")
        .sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime()),
    [sessions],
  );

  const recentFeedback = useMemo(
    () =>
      sessions
        .filter((s) => !!s.feedback || typeof s.overallScore === "number")
        .sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime())
        .slice(0, 3),
    [sessions],
  );

  const activeQuestion = activeAiSession?.questions?.[currentQuestionIndex];
  const activeQuestionFormat = ((activeQuestion?.questionFormat || "OPEN_ENDED") as string).toUpperCase();
  const isActiveQuestionMcq = activeQuestionFormat === "MCQ";
  const totalActiveQuestions = activeAiSession?.questions?.length ?? 0;
  const questionProgress =
    totalActiveQuestions > 0
      ? Math.round(((currentQuestionIndex + 1) / totalActiveQuestions) * 100)
      : 0;

  useEffect(() => {
    if (!activeAiSession?.questions?.length) {
      if (currentQuestionIndex !== 0) {
        setCurrentQuestionIndex(0);
      }
      return;
    }
    if (currentQuestionIndex >= activeAiSession.questions.length) {
      setCurrentQuestionIndex(activeAiSession.questions.length - 1);
    }
  }, [activeAiSession, currentQuestionIndex]);

  useEffect(() => {
    if (!activeQuestion?.questionId) {
      setSelectedOption("");
      return;
    }
    setSelectedOption(activeQuestion.selectedOption || "");
  }, [activeQuestion?.questionId, activeQuestion?.selectedOption]);

  const startInterview = async () => {
    try {
      setCreating(true);
      if (mode === "AI") {
        const strictBonus = strictMode ? 2 : 0;
        const totalAiQuestions = Math.max(3, Math.min(20, mcqCount + codingCount + strictBonus));
        const safeMcqCount = Math.min(10, strictMode ? mcqCount + 1 : mcqCount);
        const safeCodingCount = Math.min(10, strictMode ? codingCount + 1 : codingCount);
        const session = await interviewApi.startAi({
          interviewType,
          difficulty,
          questionFormat,
          topics,
          targetCompany,
          durationMinutes,
          questionCount: totalAiQuestions,
          mcqCount: safeMcqCount,
          codingCount: safeCodingCount,
          strictMode,
          negativeMarking,
          masteryTrackId: activeMasteryTrackId || undefined,
          masteryTrackTitle: activeMasteryTrackTitle || undefined,
        });
        setSessions((prev) => [session, ...prev.filter((p) => p.id !== session.id)]);
        if (session.masteryTrackId) {
          setActiveMasteryTrackId(session.masteryTrackId);
        }
        if (session.masteryTrackTitle) {
          setActiveMasteryTrackTitle(session.masteryTrackTitle);
        }
        setActiveAiSessionId(session.id);
        setCurrentQuestionIndex(0);
        setCurrentAnswer("");
        setSelectedOption("");
        toast.success("AI mock interview started.");
        setTab("dashboard");
        openFullscreen(session.id);
        return;
      }

      if (mode === "PEER") {
        const session = await interviewApi.requestPeer({
          interviewerName: interviewerName.trim() || undefined,
          scheduledTime,
          durationMinutes,
          interviewType,
          difficulty,
          topics,
        });
        setSessions((prev) => [session, ...prev.filter((p) => p.id !== session.id)]);
        toast.success("Peer interview requested.");
        setTab("dashboard");
        openFullscreen(session.id);
        return;
      }

      const session = await interviewApi.scheduleExpert({
        interviewerName: interviewerName.trim() || undefined,
        scheduledTime,
        durationMinutes,
        interviewType,
        difficulty,
        topics,
      });
      setSessions((prev) => [session, ...prev.filter((p) => p.id !== session.id)]);
      toast.success("Expert session scheduled.");
      setTab("dashboard");
      openFullscreen(session.id);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Could not start/schedule interview."));
    } finally {
      setCreating(false);
    }
  };

  const submitAiAnswer = async () => {
    if (!activeAiSession || !activeQuestion?.questionId) return;
    const questionFormatId = (activeQuestion.questionFormat || "OPEN_ENDED").toUpperCase();
    const isMcq = questionFormatId === "MCQ";
    if (isMcq && !selectedOption) {
      toast.error("Please select one option.");
      return;
    }
    if (!isMcq && !currentAnswer.trim()) {
      toast.error("Please write your answer.");
      return;
    }

    try {
      setAnswering(true);
      const updated = await interviewApi.submitAi({
        interviewId: activeAiSession.id,
        questionId: activeQuestion.questionId,
        answer: isMcq ? selectedOption : currentAnswer.trim(),
        selectedOption: isMcq ? selectedOption : undefined,
        timeSpent: 120,
      });
      setSessions((prev) => [updated, ...prev.filter((s) => s.id !== updated.id)]);
      setCurrentAnswer("");
      setSelectedOption("");
      if (currentQuestionIndex < (updated.questions?.length || 0) - 1) {
        setCurrentQuestionIndex((idx) => idx + 1);
      }
      if (updated.status === "COMPLETED") {
        toast.success("Interview completed. Feedback ready.");
        void loadAll();
      } else {
        toast.success("Answer submitted.");
      }
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Could not submit answer."));
    } finally {
      setAnswering(false);
    }
  };

  const skipQuestion = () => {
    if (!activeAiSession?.questions?.length) return;
    setCurrentQuestionIndex((idx) => Math.min(idx + 1, activeAiSession.questions!.length - 1));
    setCurrentAnswer("");
    setSelectedOption("");
  };

  const cancelSession = async (id: number) => {
    const cancelled = await run(
      () => interviewApi.cancel(id),
      { successMessage: "Interview cancelled.", errorMessage: "Could not cancel interview." },
    );
    if (cancelled === null) return;
    await loadAll();
  };

  const addDemoQuestion = async () => {
    const created = await run(
      () =>
        interviewApi.createQuestion({
          type: interviewType,
          difficulty,
          category: "general",
          questionFormat: "MCQ",
          question: "How do you prioritize tasks under tight deadlines?",
          options: [
            "Risk + impact matrix with clear communication",
            "Randomly pick easiest tasks first",
            "Delay stakeholder update until done",
            "Work without prioritization",
          ],
          correctAnswer: "Risk + impact matrix with clear communication",
          explanation: "Strong answers include prioritization framework and communication rhythm.",
          expectedComplexity: "Decision framework",
          companyTag: targetCompany,
          estimatedSeconds: 120,
          expectedPoints: "priority matrix, communication, risk management",
          aiEvaluationCriteria: "clarity, structure, practical example",
          tags: "behavioral,time-management",
          isActive: true,
        }),
      { successMessage: "Question added.", errorMessage: "Could not add question." },
    );
    if (!created) return;
    setQuestions((prev) => [created, ...prev]);
  };

  const persistMasteryTrack = async (payload: {
    trackId: string;
    trackTitle?: string;
    interviewType?: string;
    difficulty?: string;
    questionFormat?: string;
    topics?: string;
    targetCompany?: string;
    weeklyGoal?: string;
    plannedSprintsPerWeek?: number;
    currentWeek?: number;
    readinessScore?: number;
    strictMode?: boolean;
    negativeMarking?: boolean;
  }) => {
    const saved = await run(
      () => interviewApi.upsertMasteryProgress(payload),
      { successMessage: "Mastery track progress saved.", errorMessage: "Could not save mastery track progress." },
    );
    if (!saved) return null;
    setMasteryProgress((prev) => [saved, ...prev.filter((item) => item.trackId !== saved.trackId)]);
    return saved;
  };

  const markSprintComplete = async (trackId: string) => {
    const updated = await run(
      () => interviewApi.recordMasterySession({ trackId }),
      { successMessage: "Sprint marked complete.", errorMessage: "Could not mark sprint progress." },
    );
    if (!updated) return;
    setMasteryProgress((prev) => [updated, ...prev.filter((item) => item.trackId !== updated.trackId)]);
  };

  const score = analytics?.averageScore ?? 0;
  const totalInterviews = analytics?.totalInterviews ?? sessions.length;
  const completedInterviews =
    analytics?.completedInterviews ?? sessions.filter((s) => s.status === "COMPLETED").length;
  const momentum = Math.max(
    0,
    Math.round((analytics?.communicationAverage ?? 0) - (analytics?.confidenceAverage ?? 0)),
  );
  const vaultQuestionCount = Math.max(DEFAULT_INTERVIEW_VAULT_COUNT, questions.length);
  const masteryAverageCompletion =
    masteryProgress.length > 0
      ? masteryProgress.reduce((sum, item) => sum + (item.completionPercent ?? 0), 0) / masteryProgress.length
      : 0;
  const masteryAverageReadiness =
    masteryProgress.length > 0
      ? masteryProgress.reduce((sum, item) => sum + (item.readinessScore ?? 0), 0) / masteryProgress.length
      : 0;
  const masteryAverageLastSession =
    masteryProgress.filter((item) => typeof item.lastSessionScore === "number").length > 0
      ? masteryProgress
          .filter((item) => typeof item.lastSessionScore === "number")
          .reduce((sum, item) => sum + (item.lastSessionScore ?? 0), 0)
        / masteryProgress.filter((item) => typeof item.lastSessionScore === "number").length
      : 0;
  const masteryTrendDelta = masteryAverageReadiness - masteryAverageLastSession;
  const masteryTrendLabel =
    masteryAverageLastSession <= 0
      ? "Not enough data"
      : masteryTrendDelta > 1
        ? `Up +${masteryTrendDelta.toFixed(1)}`
        : masteryTrendDelta < -1
          ? `Down ${masteryTrendDelta.toFixed(1)}`
          : "Steady";
  const needsAttentionTracks = masteryProgress.filter(
    (item) => (item.status || "").toUpperCase() === "NEEDS_ATTENTION",
  );

  const tabs: ReadonlyArray<readonly [PageTab, string, typeof Video]> = [
    ["dashboard", "Dashboard", Video],
    ["setup", "Interview Setup", Calendar],
    ["tracks", "Mastery Tracks", Layers],
    ["vault", "Question Vault", LibraryBig],
    ["optimizer", "Optimization Lab", Rocket],
    ["history", "History & Analytics", LineChart],
    ["profile", "Profile & Settings", User],
    ...(isAdmin ? ([["admin", "Admin", Shield]] as const) : []),
  ];

  const isFullscreen = searchParams.get("fullscreen") === "1";

  const openFullscreen = (sessionId?: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("fullscreen", "1");
    if (sessionId) {
      next.set("sessionId", String(sessionId));
    } else {
      next.delete("sessionId");
    }
    setSearchParams(next, { replace: true });
  };

  const closeFullscreen = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("fullscreen");
    next.delete("sessionId");
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const sessionIdParam = Number(searchParams.get("sessionId"));
    if (!Number.isFinite(sessionIdParam) || sessionIdParam <= 0) return;
    const matchedSession = sessions.find((session) => session.id === sessionIdParam);
    if (!matchedSession) return;
    if (matchedSession.mode === "AI") {
      setActiveAiSessionId(matchedSession.id);
      setCurrentQuestionIndex(0);
      setCurrentAnswer("");
      setSelectedOption("");
      if (typeof matchedSession.strictMode === "boolean") {
        setStrictMode(matchedSession.strictMode);
      }
      if (typeof matchedSession.negativeMarking === "boolean") {
        setNegativeMarking(matchedSession.negativeMarking);
      }
      if (matchedSession.masteryTrackId) {
        setActiveMasteryTrackId(matchedSession.masteryTrackId);
      }
      if (matchedSession.masteryTrackTitle) {
        setActiveMasteryTrackTitle(matchedSession.masteryTrackTitle);
      }
    }
    setTab("dashboard");
  }, [searchParams, sessions]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-gradient-to-r from-[#2563EB]/20 via-[#7C3AED]/15 to-[#10B981]/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Video className="text-primary" />
              Mock Interviews
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Practice with AI or real interviewers, use 4200+ prompts, and improve interview confidence with hard-level checks.
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-sm">
            <p className="text-muted-foreground">Live Sync</p>
            <p className="font-medium">Connected</p>
          </div>
        </div>
        <div className="mt-3">
          {isFullscreen ? (
            <Button variant="outline" size="sm" onClick={closeFullscreen}>
              Exit full screen
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => openFullscreen(activeAiSessionId ?? undefined)}>
              Open full screen
            </Button>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {tabs.map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
              tab === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-border/80 bg-card/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Interviews</p>
              <p className="mt-1 text-2xl font-bold">{totalInterviews}</p>
              <p className="mt-1 text-xs text-muted-foreground">Total sessions requested</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-card/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Average Score</p>
              <p className="mt-1 text-2xl font-bold">{score.toFixed(1)}%</p>
              <p className="mt-1 text-xs text-muted-foreground">Across completed sessions</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-card/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Completed</p>
              <p className="mt-1 text-2xl font-bold">{completedInterviews}</p>
              <p className="mt-1 text-xs text-muted-foreground">Final feedback delivered</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-card/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Momentum</p>
              <p className="mt-1 text-2xl font-bold text-success">{momentum}%</p>
              <p className="mt-1 text-xs text-muted-foreground">Communication vs confidence</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-card/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Question Vault</p>
              <p className="mt-1 text-2xl font-bold">{vaultQuestionCount.toLocaleString()}</p>
              <p className="mt-1 text-xs text-muted-foreground">MCQ + coding + interview prompts</p>
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/70 p-4 space-y-3">
            <h2 className="font-semibold">Mastery Analytics</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">Tracked Tracks</p>
                <p className="text-xl font-bold">{masteryProgress.length}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">Avg Completion</p>
                <p className="text-xl font-bold">{masteryAverageCompletion.toFixed(1)}%</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">Readiness Trend</p>
                <p className="text-xl font-bold">{masteryTrendLabel}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">Needs Attention</p>
                <p className="text-xl font-bold">{needsAttentionTracks.length}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {needsAttentionTracks.length > 0
                ? `Focus tracks: ${needsAttentionTracks
                    .slice(0, 3)
                    .map((item) => item.trackTitle || item.trackId)
                    .join(", ")}`
                : "All tracked mastery plans are on track."}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border/80 bg-card/70 p-4 space-y-3">
              <h2 className="font-semibold">Quick Actions</h2>
              <p className="text-sm text-muted-foreground">
                Start instantly or configure a scheduled session from setup.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setMode("AI");
                    setTab("setup");
                  }}
                  className="gap-2"
                >
                  <Brain size={14} /> AI Mock
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setTab("tracks")}
                  className="gap-2"
                >
                  <Layers size={14} /> Mastery Tracks
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMode("PEER");
                    setTab("setup");
                  }}
                  className="gap-2"
                >
                  <User size={14} /> Peer Interview
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMode("EXPERT");
                    setTab("setup");
                  }}
                  className="gap-2"
                >
                  <Calendar size={14} /> Schedule Expert
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border/80 bg-card/70 p-4 space-y-3">
              <h2 className="font-semibold">Upcoming Interviews</h2>
              {upcoming.length === 0 && (
                <p className="text-sm text-muted-foreground">No upcoming interviews.</p>
              )}
              {upcoming.map((s) => (
                <div key={s.id} className="rounded-md border border-border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">
                      {formatLabel(s.mode)} - {formatLabel(s.interviewType)}
                    </p>
                    <Badge variant={getStatusBadgeVariant(s.status)}>{formatLabel(s.status)}</Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">{formatDateTime(s.scheduledTime)}</p>
                  {s.mode === "AI" && (
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge variant="outline">{s.strictMode ? "Hard Mode ON" : "Standard Mode"}</Badge>
                      <Badge variant="outline">{s.negativeMarking ? "MCQ +4 / -1" : "MCQ +1 / 0"}</Badge>
                      {s.masteryTrackTitle && <Badge variant="outline">Track: {s.masteryTrackTitle}</Badge>}
                    </div>
                  )}
                  <div className="mt-2 flex gap-2">
                    {s.mode === "AI" && s.status !== "COMPLETED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActiveAiSessionId(s.id);
                          setCurrentQuestionIndex(0);
                          setCurrentAnswer("");
                          setSelectedOption("");
                          setTab("dashboard");
                          openFullscreen(s.id);
                        }}
                      >
                        Continue
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => cancelSession(s.id)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border/80 bg-card/70 p-4 space-y-3">
              <h2 className="font-semibold">Recent Feedback</h2>
              {recentFeedback.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Complete sessions to unlock detailed feedback here.
                </p>
              )}
              {recentFeedback.map((s) => (
                <div key={s.id} className="rounded-md border border-border p-3 text-sm">
                  <p className="font-medium">
                    {formatLabel(s.mode)} {formatLabel(s.interviewType)} | {getScoreText(s.overallScore)}
                  </p>
                  <p className="text-muted-foreground">{s.feedback || s.recommendations || "Feedback pending"}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border/80 bg-card/70 p-4 space-y-3">
              <h2 className="font-semibold">Achievements</h2>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`flex h-14 items-center justify-center rounded-lg border ${
                      i <= 2 ? "border-success/40 bg-success/10" : "border-border bg-muted/30"
                    }`}
                  >
                    <Trophy size={18} className={i <= 2 ? "text-success" : "text-muted-foreground"} />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Strongest: {analytics?.strongestArea || "Not enough data"} | Weakest:{" "}
                {analytics?.weakestArea || "Not enough data"}
              </p>
            </div>
          </div>

          {activeAiSession && activeAiSession.mode === "AI" && (
            <div className="rounded-xl border border-border/80 bg-card/70 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold inline-flex items-center gap-2"><Brain size={16} /> AI Mock Interview Room</h2>
                <Badge variant={getStatusBadgeVariant(activeAiSession.status)}>
                  {formatLabel(activeAiSession.status)}
                </Badge>
              </div>

              {!!activeQuestion && (
                <>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <p>Question {currentQuestionIndex + 1} of {totalActiveQuestions}</p>
                    <p>{questionProgress}% complete</p>
                  </div>
                  <Progress value={questionProgress} className="h-2" />
                  <div className="rounded-md border border-border p-3 text-sm font-medium">
                    {activeQuestion.questionText}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline">{activeQuestionFormat}</Badge>
                    {activeQuestion.expectedComplexity && (
                      <Badge variant="outline">Target: {activeQuestion.expectedComplexity}</Badge>
                    )}
                    <Badge variant="outline">{activeAiSession.strictMode ? "Hard Mode ON" : "Standard Mode"}</Badge>
                    <Badge variant="outline">{activeAiSession.negativeMarking ? "MCQ +4 / -1" : "MCQ +1 / 0"}</Badge>
                    {activeAiSession.masteryTrackTitle && (
                      <Badge variant="outline">Track: {activeAiSession.masteryTrackTitle}</Badge>
                    )}
                  </div>
                  {isActiveQuestionMcq ? (
                    <div className="space-y-2">
                      {(activeQuestion.options || []).map((option) => (
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
                      {!activeQuestion.options?.length && (
                        <p className="text-xs text-muted-foreground">No options available for this MCQ.</p>
                      )}
                    </div>
                  ) : (
                    <Textarea
                      rows={5}
                      placeholder="Type your answer here..."
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                    />
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={skipQuestion} className="gap-1"><SkipForward size={14} /> Skip</Button>
                    <Button onClick={submitAiAnswer} disabled={answering} className="gap-1">
                      <Play size={14} /> {answering ? "Submitting..." : "Submit Answer"}
                    </Button>
                  </div>

                  {activeQuestion.aiFeedback && (
                    <div className="rounded-md border border-success/40 bg-success/10 p-3 text-sm">
                      <p className="font-medium">AI Feedback</p>
                      <p>{activeQuestion.aiFeedback}</p>
                      <p className="text-xs mt-1">Score: {getScoreText(activeQuestion.score)}</p>
                    </div>
                  )}
                </>
              )}
              {!activeQuestion && (
                <p className="text-sm text-muted-foreground">No pending questions in this AI session.</p>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "setup" && (
        <div className="rounded-xl border border-border/80 bg-card/70 p-5 space-y-4">
          <h2 className="font-semibold">Configure Your Interview</h2>
          <p className="text-sm text-muted-foreground">
            Select interview mode, target area, and schedule. Configuration updates instantly.
          </p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Mode</Label>
              <select value={mode} onChange={(e) => setMode(e.target.value as InterviewMode)} className="w-full mt-1 rounded-md border border-border bg-muted px-3 py-2 text-sm">
                <option value="AI">AI Mock</option>
                <option value="PEER">Peer Interview</option>
                <option value="EXPERT">Expert Session</option>
              </select>
            </div>
            <div>
              <Label>Interview Type</Label>
              <select value={interviewType} onChange={(e) => setInterviewType(e.target.value as InterviewType)} className="w-full mt-1 rounded-md border border-border bg-muted px-3 py-2 text-sm">
                <option value="TECHNICAL">Technical</option>
                <option value="BEHAVIORAL">Behavioral</option>
                <option value="HR">HR</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
            <div>
              <Label>Difficulty</Label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="w-full mt-1 rounded-md border border-border bg-muted px-3 py-2 text-sm">
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
            <div>
              <Label>Topics / Role</Label>
              <Input value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="Software Engineer, System Design..." />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <select value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className="w-full mt-1 rounded-md border border-border bg-muted px-3 py-2 text-sm">
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
            <div>
              <Label>Scheduled Time</Label>
              <Input type="datetime-local" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
            </div>
          </div>

          {mode === "AI" && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Question Format</Label>
                <select
                  value={questionFormat}
                  onChange={(e) => setQuestionFormat(e.target.value as QuestionFormat)}
                  className="w-full mt-1 rounded-md border border-border bg-muted px-3 py-2 text-sm"
                >
                  <option value="MIXED">Mixed (MCQ + Coding + Open)</option>
                  <option value="MCQ">MCQ only</option>
                  <option value="CODING">Coding only</option>
                  <option value="OPEN_ENDED">Open ended only</option>
                </select>
              </div>
              <div>
                <Label>Target Company Style</Label>
                <Input
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder="Google, Microsoft, Amazon..."
                />
              </div>
              <div>
                <Label>MCQ Count</Label>
                <select
                  value={mcqCount}
                  onChange={(e) => setMcqCount(Number(e.target.value))}
                  className="w-full mt-1 rounded-md border border-border bg-muted px-3 py-2 text-sm"
                >
                  <option value={2}>2</option>
                  <option value={4}>4</option>
                  <option value={6}>6</option>
                  <option value={8}>8</option>
                  <option value={10}>10</option>
                </select>
              </div>
              <div>
                <Label>Coding Count</Label>
                <select
                  value={codingCount}
                  onChange={(e) => setCodingCount(Number(e.target.value))}
                  className="w-full mt-1 rounded-md border border-border bg-muted px-3 py-2 text-sm"
                >
                  <option value={2}>2</option>
                  <option value={4}>4</option>
                  <option value={6}>6</option>
                  <option value={8}>8</option>
                  <option value={10}>10</option>
                </select>
              </div>
              <div>
                <Label>Practice Sprints / Week</Label>
                <select
                  value={focusSprintsPerWeek}
                  onChange={(e) => setFocusSprintsPerWeek(Number(e.target.value))}
                  className="w-full mt-1 rounded-md border border-border bg-muted px-3 py-2 text-sm"
                >
                  <option value={3}>3 sessions</option>
                  <option value={5}>5 sessions</option>
                  <option value={7}>7 sessions</option>
                  <option value={10}>10 sessions</option>
                </select>
              </div>
            </div>
          )}

          {mode === "AI" && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-border p-3">
                <p className="inline-flex items-center gap-2 text-sm font-medium">
                  <SlidersHorizontal size={14} />
                  Evaluation Strictness
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={strictMode ? "default" : "outline"}
                    onClick={() => setStrictMode(true)}
                  >
                    Hard Mode
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={!strictMode ? "default" : "outline"}
                    onClick={() => setStrictMode(false)}
                  >
                    Standard
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Hard mode increases pressure with stricter mix and higher scoring expectations.
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">MCQ Marking Style</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={negativeMarking ? "default" : "outline"}
                    onClick={() => setNegativeMarking(true)}
                  >
                    +4 / -1
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={!negativeMarking ? "default" : "outline"}
                    onClick={() => setNegativeMarking(false)}
                  >
                    +1 / 0
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Applied in Mock Vault rounds to simulate shortlist pressure.
                </p>
              </div>
            </div>
          )}

          {mode !== "AI" && (
            <div>
              <Label>Interviewer Username or User ID (optional)</Label>
              <Input
                value={interviewerName}
                onChange={(e) => setInterviewerName(e.target.value)}
                placeholder="username or User ID (e.g., CA7X2M9QP)"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                If you enter a valid User ID, interview will be assigned to that exact user.
              </p>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-border p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Mode</p>
              <p className="font-medium">{formatLabel(mode)}</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Type</p>
              <p className="font-medium">{formatLabel(interviewType)}</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Difficulty</p>
              <p className="font-medium">{formatLabel(difficulty)}</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Duration</p>
              <p className="font-medium">{durationMinutes} minutes</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Format</p>
              <p className="font-medium">{mode === "AI" ? formatLabel(questionFormat) : "Interviewer-led"}</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Question Mix</p>
              <p className="font-medium">
                {mode === "AI" ? `${mcqCount} MCQ + ${codingCount} Coding` : "Session based"}
              </p>
            </div>
            {mode === "AI" && (
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Strictness</p>
                <p className="font-medium">{strictMode ? "Hard Mode" : "Standard Mode"}</p>
              </div>
            )}
            {mode === "AI" && (
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Practice Plan</p>
                <p className="font-medium">{focusSprintsPerWeek} sprints/week</p>
              </div>
            )}
            {mode === "AI" && activeMasteryTrackId && (
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Active Mastery Track</p>
                <p className="font-medium">{activeMasteryTrackTitle || activeMasteryTrackId}</p>
              </div>
            )}
          </div>

          <Button onClick={startInterview} disabled={creating || running} className="gap-2">
            <CheckCircle2 size={14} /> {creating || running ? "Please wait..." : "Start / Schedule Interview"}
          </Button>
        </div>
      )}

      {tab === "tracks" && (
        <InterviewMasteryTracksPanel
          masteryProgress={masteryProgress}
          onRecordSprint={markSprintComplete}
          onApplyPlan={async (preset) => {
            setMode("AI");
            setInterviewType(preset.type);
            setDifficulty(preset.difficulty);
            setQuestionFormat(preset.questionFormat);
            setTopics(preset.topics);
            setTargetCompany(preset.targetCompany);
            setMcqCount(preset.mcqCount);
            setCodingCount(preset.codingCount);
            setDurationMinutes(preset.durationMinutes);
            setStrictMode(true);
            setNegativeMarking(true);
            setActiveMasteryTrackId(preset.trackId);
            setActiveMasteryTrackTitle(preset.trackTitle);
            await persistMasteryTrack({
              trackId: preset.trackId,
              trackTitle: preset.trackTitle,
              interviewType: preset.type,
              difficulty: preset.difficulty,
              questionFormat: preset.questionFormat,
              topics: preset.topics,
              targetCompany: preset.targetCompany,
              weeklyGoal: preset.weeklyGoal,
              plannedSprintsPerWeek: focusSprintsPerWeek,
              currentWeek: preset.currentWeek,
              readinessScore: preset.readinessScore,
              strictMode: true,
              negativeMarking: true,
            });
            setTab("setup");
            toast.success("Mastery track synced to Interview Setup.");
          }}
        />
      )}

      {tab === "vault" && (
        <InterviewQuestionVaultPanel
          backendQuestions={questions}
          onUsePreset={(preset) => {
            setMode("AI");
            setInterviewType(preset.type);
            setDifficulty(preset.difficulty);
            setQuestionFormat(preset.questionFormat);
            setTopics(preset.topics);
            setTargetCompany(preset.targetCompany);
            setMcqCount(preset.mcqCount);
            setCodingCount(preset.codingCount);
            setStrictMode(true);
            setTab("setup");
          }}
        />
      )}

      {tab === "optimizer" && <InterviewOptimizationLab />}

      {tab === "history" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/80 bg-card/70 p-4">
            <h2 className="font-semibold inline-flex items-center gap-2"><LineChart size={16} /> Performance Analytics</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mt-3">
              <div><p className="text-xs text-muted-foreground">Technical</p><Progress value={analytics?.technicalAverage ?? 0} className="h-2 mt-1" /><p className="text-sm mt-1">{getScoreText(analytics?.technicalAverage)}</p></div>
              <div><p className="text-xs text-muted-foreground">Communication</p><Progress value={analytics?.communicationAverage ?? 0} className="h-2 mt-1" /><p className="text-sm mt-1">{getScoreText(analytics?.communicationAverage)}</p></div>
              <div><p className="text-xs text-muted-foreground">Problem Solving</p><Progress value={analytics?.problemSolvingAverage ?? 0} className="h-2 mt-1" /><p className="text-sm mt-1">{getScoreText(analytics?.problemSolvingAverage)}</p></div>
              <div><p className="text-xs text-muted-foreground">Confidence</p><Progress value={analytics?.confidenceAverage ?? 0} className="h-2 mt-1" /><p className="text-sm mt-1">{getScoreText(analytics?.confidenceAverage)}</p></div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Strongest: {analytics?.strongestArea || "Not enough data"} | Weakest: {analytics?.weakestArea || "Not enough data"}
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/70 p-4 space-y-3">
            <h2 className="font-semibold">Interview History</h2>
            {history.length === 0 && <p className="text-sm text-muted-foreground">No completed/cancelled interviews yet.</p>}
            {history.map((s) => (
              <div key={s.id} className="rounded-md border border-border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{formatDateTime(s.scheduledTime)} - {formatLabel(s.mode)} {formatLabel(s.interviewType)}</p>
                  <Badge variant={getStatusBadgeVariant(s.status)}>{formatLabel(s.status)}</Badge>
                </div>
                <p className="text-muted-foreground">
                  Score: {getScoreText(s.overallScore)} | {s.topics || "General"}
                </p>
                {s.mode === "AI" && (
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge variant="outline">{s.strictMode ? "Hard Mode ON" : "Standard Mode"}</Badge>
                    <Badge variant="outline">{s.negativeMarking ? "MCQ +4 / -1" : "MCQ +1 / 0"}</Badge>
                    {s.masteryTrackTitle && <Badge variant="outline">Track: {s.masteryTrackTitle}</Badge>}
                  </div>
                )}
                {s.recordingUrl && <p className="text-primary text-xs mt-1">Recording: {s.recordingUrl}</p>}
                {s.certificateUrl && <p className="text-success text-xs mt-1">Certificate: {s.certificateUrl}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "profile" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/80 bg-card/70 p-4 space-y-3">
            <h2 className="font-semibold">Profile & Preferences</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Bio</Label>
                <Textarea rows={3} value={profileBio} onChange={(e) => setProfileBio(e.target.value)} />
              </div>
              <div>
                <Label>Skills</Label>
                <Textarea rows={3} value={profileSkills} onChange={(e) => setProfileSkills(e.target.value)} />
              </div>
              <div>
                <Label>Target Roles</Label>
                <Input value={profileTargetRoles} onChange={(e) => setProfileTargetRoles(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input id="peerAvail" type="checkbox" checked={availableForPeer} onChange={(e) => setAvailableForPeer(e.target.checked)} />
                <Label htmlFor="peerAvail">Available for peer interviews</Label>
              </div>
            </div>
            <Button onClick={() => toast.success("Preferences saved locally.")}>Save Preferences</Button>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/70 p-4">
            <h2 className="font-semibold mb-2">Live Interview Room (Peer/Expert Demo)</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground mb-2">Your Video</p>
                <div className="h-28 bg-muted rounded flex items-center justify-center"><Video size={18} /></div>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground mb-2">Interviewer</p>
                <div className="h-28 bg-muted rounded flex items-center justify-center"><User size={18} /></div>
              </div>
            </div>
            <div className="mt-3 rounded-md border border-border p-3 text-sm">
              <p className="font-medium">Current Question</p>
              <p className="text-muted-foreground">Tell me about a time you handled a conflict.</p>
            </div>
            <div className="mt-3 rounded-md border border-border p-3">
              <p className="text-xs text-muted-foreground mb-2">Chat</p>
              <div className="text-sm space-y-1 max-h-24 overflow-y-auto">
                <p><span className="font-medium">Interviewer:</span> Can you elaborate more?</p>
                <p><span className="font-medium">You:</span> Sure, let me explain with a STAR format example.</p>
              </div>
              <div className="mt-2 flex gap-2">
                <Input placeholder="Type message..." />
                <Button size="sm" variant="outline" className="gap-1"><MessageSquare size={14} /> Send</Button>
              </div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" className="gap-1"><Mic size={14} /> Mute</Button>
                <Button size="sm" variant="outline">Stop Video</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "admin" && isAdmin && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/80 bg-card/70 p-4">
            <h2 className="font-semibold inline-flex items-center gap-2"><Shield size={16} /> Admin Dashboard</h2>
            <div className="grid gap-3 md:grid-cols-4 mt-3">
              <div className="rounded-md border border-border p-3"><p className="text-xs text-muted-foreground">Users</p><p className="text-xl font-bold">{overallStats?.totalUsers ?? 0}</p></div>
              <div className="rounded-md border border-border p-3"><p className="text-xs text-muted-foreground">Interviews</p><p className="text-xl font-bold">{overallStats?.totalInterviews ?? 0}</p></div>
              <div className="rounded-md border border-border p-3"><p className="text-xs text-muted-foreground">Completed</p><p className="text-xl font-bold">{overallStats?.completedInterviews ?? 0}</p></div>
              <div className="rounded-md border border-border p-3"><p className="text-xs text-muted-foreground">Avg Score</p><p className="text-xl font-bold">{Math.round(overallStats?.averageOverallScore ?? 0)}%</p></div>
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/70 p-4 space-y-3">
            <h2 className="font-semibold">Question Bank Management</h2>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">Total questions: {questions.length}</p>
              <Button size="sm" onClick={addDemoQuestion}>Add Question</Button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {questions.map((q) => (
                <div key={q.id} className="rounded-md border border-border p-3 text-sm">
                  <p className="font-medium">
                    {q.type} - {q.difficulty} - {q.category} - {formatLabel(q.questionFormat || "OPEN_ENDED")}
                  </p>
                  <p className="text-muted-foreground">{q.question}</p>
                  {q.options?.length ? (
                    <p className="text-xs text-muted-foreground mt-1">Options: {q.options.length}</p>
                  ) : null}
                </div>
              ))}
              {!questions.length && <p className="text-sm text-muted-foreground">No questions found.</p>}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground" aria-live="polite" />
      )}
    </div>
  );
}







