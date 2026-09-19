import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { BadgeCheck, Brain, Crown, Flame, Gem, Lock, Palette, RotateCcw, Sparkles, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { typingApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import type { TypingMode, TypingProfile, TypingText } from "@/lib/types";
import {
  ACTIVE_SEASON,
  BATTLE_PASS_REWARDS,
  PREMIUM_FEATURES,
  canUseFeature,
  getTierProgress,
  grantBattlePassRewardsForXp,
  loadTypingPremiumState,
  saveTypingPremiumState,
  type CosmeticItem,
  type PremiumPlan,
  type TypingPremiumState,
} from "@/lib/typing-premium";
import {
  buildWeakKeyPassage,
  DEFAULT_COMMUNITY_PASSAGES,
  getTypingAiSuggestions,
  KEYBOARD_LAYOUTS,
  PRACTICE_MODE_DESCRIPTIONS,
  TYPING_LESSONS,
  type CommunityPassage,
  type KeyboardLayoutType,
  type TypingPracticeMode,
} from "@/lib/typing-enhancements";

const TIMED_DURATIONS = [30, 60, 120] as const;
const WORD_TARGETS = [10, 25, 50, 100] as const;
const MODE_LABELS: Record<TypingMode, string> = {
  TIMED: "Timed",
  WORD_COUNT: "Word Count",
  QUOTE: "Quote",
  CUSTOM: "Custom Text",
};
const COMMUNITY_KEY = "typing-community-passages-v1";
const FREE_CUSTOM_PASSAGE_LIMIT = 8;

type TypingView = "PRACTICE" | "PERFORMANCE" | "PREMIUM" | "CREATOR";
type TypingWorkspace = "hub" | "practice" | "performance" | "premium" | "creator";
type TypingWorkspaceCard = {
  id: Exclude<TypingWorkspace, "hub">;
  view: TypingView;
  title: string;
  description: string;
  actionLabel: string;
  icon: LucideIcon;
};

const typingViews: { id: TypingView; title: string; hint: string }[] = [
  { id: "PRACTICE", title: "Practice", hint: "Typing run setup and test area" },
  { id: "PERFORMANCE", title: "Performance", hint: "Stats, mistakes and AI tips" },
  { id: "PREMIUM", title: "Premium", hint: "Battle pass and cosmetics" },
  { id: "CREATOR", title: "Creator", hint: "Passage editor and community" },
];

const TYPING_VIEW_TO_WORKSPACE: Record<TypingView, Exclude<TypingWorkspace, "hub">> = {
  PRACTICE: "practice",
  PERFORMANCE: "performance",
  PREMIUM: "premium",
  CREATOR: "creator",
};

const TYPING_WORKSPACE_TO_VIEW: Record<Exclude<TypingWorkspace, "hub">, TypingView> = {
  practice: "PRACTICE",
  performance: "PERFORMANCE",
  premium: "PREMIUM",
  creator: "CREATOR",
};

const TYPING_ROUTE_SEGMENTS: ReadonlyArray<Exclude<TypingWorkspace, "hub">> = [
  "practice",
  "performance",
  "premium",
  "creator",
];

const getTypingBasePath = (pathname: string) =>
  pathname.startsWith("/simple/") ? "/simple/typing-speed" : "/typing-speed";

const getTypingWorkspaceFromPath = (pathname: string): TypingWorkspace => {
  const segments = pathname.toLowerCase().split("/").filter(Boolean);
  const typingIndex = segments.lastIndexOf("typing-speed");
  const workspaceSegment = typingIndex >= 0 ? segments[typingIndex + 1] : "";
  if (TYPING_ROUTE_SEGMENTS.includes(workspaceSegment as Exclude<TypingWorkspace, "hub">)) {
    return workspaceSegment as Exclude<TypingWorkspace, "hub">;
  }
  return "hub";
};

const TYPING_WORKSPACE_CARDS: TypingWorkspaceCard[] = [
  {
    id: "practice",
    view: "PRACTICE",
    title: "Practice Run",
    description: "Select a mode, load a passage, and start a typing test.",
    actionLabel: "Open practice",
    icon: Flame,
  },
  {
    id: "performance",
    view: "PERFORMANCE",
    title: "Performance Review",
    description: "Analyze WPM, accuracy, mistakes, and AI suggestions.",
    actionLabel: "Open performance",
    icon: Brain,
  },
  {
    id: "premium",
    view: "PREMIUM",
    title: "Premium & Battle Pass",
    description: "Manage plans, rewards, cosmetics, and unlock progression.",
    actionLabel: "Open premium",
    icon: Crown,
  },
  {
    id: "creator",
    view: "CREATOR",
    title: "Creator Tools",
    description: "Build custom drills with the passage editor and community library.",
    actionLabel: "Open creator",
    icon: Palette,
  },
];

const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function TypingSpeedPage() {
  const { isAuthenticated, user } = useAuth();
  const { theme, accentTheme, highlightTheme, setAccentTheme, setHighlightTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const routeWorkspace = getTypingWorkspaceFromPath(location.pathname);
  const typingBasePath = getTypingBasePath(location.pathname);

  const [uiMode, setUiMode] = useState<"SIMPLE" | "ADVANCED">("SIMPLE");
  const [activeView, setActiveView] = useState<TypingView>(() =>
    routeWorkspace === "hub" ? "PRACTICE" : TYPING_WORKSPACE_TO_VIEW[routeWorkspace],
  );
  const [activeWorkspace, setActiveWorkspace] = useState<TypingWorkspace>(routeWorkspace);
  const [mode, setMode] = useState<TypingMode>("TIMED");
  const [practiceMode, setPracticeMode] = useState<TypingPracticeMode>("STANDARD");
  const [layout, setLayout] = useState<KeyboardLayoutType>("QWERTY");
  const [duration, setDuration] = useState<number>(60);
  const [wordTarget, setWordTarget] = useState<number>(25);
  const [quoteCategory, setQuoteCategory] = useState<string>("General");
  const [quoteCategories, setQuoteCategories] = useState<string[]>([]);
  const [customText, setCustomText] = useState<string>("");
  const [sourceText, setSourceText] = useState<TypingText | null>(null);
  const [typed, setTyped] = useState("");
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [remainingSec, setRemainingSec] = useState(duration);
  const [finished, setFinished] = useState(false);
  const [keyMistakes, setKeyMistakes] = useState<Record<string, number>>({});
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [profile, setProfile] = useState<TypingProfile | null>(null);
  const [communityPassages, setCommunityPassages] = useState<CommunityPassage[]>([]);
  const [premiumState, setPremiumState] = useState<TypingPremiumState>(() => loadTypingPremiumState());
  const [editorTitle, setEditorTitle] = useState("");
  const [editorLanguage, setEditorLanguage] = useState<CommunityPassage["language"]>("typescript");
  const [editorTags, setEditorTags] = useState("practice,code");
  const [editorContent, setEditorContent] = useState("function solve(){\n  return 'clean typing';\n}");

  const endlessLock = useRef(false);
  const rewardedRunRef = useRef(false);
  const activeText = mode === "CUSTOM" ? customText : (sourceText?.content || "");
  const hiddenText = practiceMode === "BLIND" ? activeText.replace(/[^\s]/g, "*") : activeText;
  const isPremium = premiumState.plan !== "FREE";
  const isAdvancedUi = uiMode === "ADVANCED";
  const tierProgress = useMemo(() => getTierProgress(premiumState.seasonXp), [premiumState.seasonXp]);

  const elapsedSec = useMemo(() => {
    if (!startedAtMs) return 0;
    return Math.max(1, Math.floor((Date.now() - startedAtMs) / 1000));
  }, [startedAtMs]);

  const correctChars = useMemo(() => {
    let hit = 0;
    for (let index = 0; index < typed.length; index += 1) {
      if (typed[index] === activeText[index]) hit += 1;
    }
    return hit;
  }, [typed, activeText]);

  const errors = Math.max(typed.length - correctChars, 0);
  const accuracy = typed.length ? Math.round((correctChars / typed.length) * 100) : 100;
  const wpm = Math.max(0, Math.round((correctChars / 5) / (Math.max(elapsedSec, 1) / 60)));
  const progress = activeText.length ? Math.min(100, (typed.length / activeText.length) * 100) : 0;
  const typedWords = countWords(typed);

  const weakKeyDrill = useMemo(
    () => buildWeakKeyPassage({ ...(profile?.keyHeatmap || {}), ...keyMistakes }),
    [profile?.keyHeatmap, keyMistakes],
  );
  const aiSuggestions = useMemo(
    () => getTypingAiSuggestions({ wpm, accuracy, backspaceCount, keyMistakes }),
    [wpm, accuracy, backspaceCount, keyMistakes],
  );
  const topMistakes = useMemo(
    () => Object.entries(keyMistakes).sort((a, b) => b[1] - a[1]).slice(0, 5),
    [keyMistakes],
  );
  const mergedPassages = useMemo(() => {
    const byId = new Map<string, CommunityPassage>();
    [...communityPassages, ...DEFAULT_COMMUNITY_PASSAGES].forEach((passage) => byId.set(passage.id, passage));
    return Array.from(byId.values());
  }, [communityPassages]);

  const availableWorkspaceCards = useMemo(
    () =>
      TYPING_WORKSPACE_CARDS.filter((card) =>
        isAdvancedUi ? true : card.view !== "PREMIUM" && card.view !== "CREATOR",
      ),
    [isAdvancedUi],
  );

  const activeWorkspaceCard = useMemo(
    () => TYPING_WORKSPACE_CARDS.find((card) => card.id === activeWorkspace) ?? null,
    [activeWorkspace],
  );

  useEffect(() => {
    setActiveWorkspace(routeWorkspace);
    if (routeWorkspace !== "hub") {
      setActiveView(TYPING_WORKSPACE_TO_VIEW[routeWorkspace]);
    }
  }, [routeWorkspace]);

  const navigateToTypingWorkspace = useCallback((workspace: TypingWorkspace, replace = false) => {
    const pathname = workspace === "hub" ? typingBasePath : `${typingBasePath}/${workspace}`;
    navigate(pathname, { replace });
  }, [navigate, typingBasePath]);
  const typingWorkspacePath = useCallback(
    (workspace: Exclude<TypingWorkspace, "hub">) => `${typingBasePath}/${workspace}`,
    [typingBasePath],
  );

  const resetRun = useCallback(() => {
    setTyped("");
    setStartedAtMs(null);
    setRemainingSec(duration);
    setFinished(false);
    setBackspaceCount(0);
    setKeyMistakes({});
    rewardedRunRef.current = false;
  }, [duration]);

  const updatePremiumState = useCallback((updater: (prev: TypingPremiumState) => TypingPremiumState) => {
    setPremiumState((prev) => {
      const next = updater(prev);
      saveTypingPremiumState(next);
      return next;
    });
  }, []);

  const loadSource = useCallback(async () => {
    if (mode === "CUSTOM") {
      setSourceText(null);
      return;
    }
    try {
      const source = mode === "QUOTE"
        ? await typingApi.getRandomQuote(quoteCategory)
        : await typingApi.getRandomText({ category: "General", difficulty: "Medium", daily: false });
      setSourceText(source);
    } catch {
      toast.error("Unable to load typing text.");
    }
  }, [mode, quoteCategory]);

  const extendEndless = useCallback(async () => {
    if (practiceMode !== "ENDLESS" || endlessLock.current) return;
    endlessLock.current = true;
    try {
      if (mode === "CUSTOM") {
        setCustomText((prev) => `${prev} ${prev.slice(0, 180)}`.trim());
      } else {
        const extra = await typingApi.getRandomText({ category: "General", difficulty: "Medium", daily: false });
        setSourceText((prev) => (prev ? { ...prev, content: `${prev.content} ${extra.content}` } : extra));
      }
    } finally {
      endlessLock.current = false;
    }
  }, [mode, practiceMode]);

  const applyLesson = (lessonId: string) => {
    const lesson = TYPING_LESSONS.find((entry) => entry.id === lessonId);
    if (!lesson) return;
    setLayout(lesson.layout);
    setMode("CUSTOM");
    setPracticeMode("STANDARD");
    setCustomText(lesson.passage);
    resetRun();
    toast.success(`Lesson loaded: ${lesson.title}`);
  };

  const savePassage = () => {
    if (!editorTitle.trim() || !editorContent.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    if (!isPremium && communityPassages.length >= FREE_CUSTOM_PASSAGE_LIMIT) {
      toast.error(`Free plan supports only ${FREE_CUSTOM_PASSAGE_LIMIT} passages.`);
      return;
    }
    const nextPassage: CommunityPassage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: editorTitle.trim(),
      content: editorContent.trim(),
      language: editorLanguage,
      tags: editorTags.split(",").map((tag) => tag.trim()).filter(Boolean),
      author: user?.name || "Guest Author",
      createdAt: new Date().toISOString(),
    };
    setCommunityPassages((prev) => {
      const next = [nextPassage, ...prev].slice(0, isPremium ? 300 : FREE_CUSTOM_PASSAGE_LIMIT);
      localStorage.setItem(COMMUNITY_KEY, JSON.stringify(next));
      return next;
    });
    toast.success("Passage added to community library.");
  };

  const onInput = (value: string) => {
    if (finished) return;
    if (!activeText.trim()) {
      toast.error("Load text first.");
      return;
    }
    if (!startedAtMs) setStartedAtMs(Date.now());
    const maxLen = practiceMode === "ENDLESS" ? activeText.length + 220 : activeText.length + 1;
    const bounded = value.slice(0, Math.max(maxLen, 1));
    setTyped(bounded);
    if (practiceMode === "ENDLESS" && activeText.length - bounded.length < 35) {
      void extendEndless();
      return;
    }
    if (mode === "WORD_COUNT" && countWords(bounded) >= wordTarget) {
      setFinished(true);
      return;
    }
    if (practiceMode !== "ENDLESS" && bounded.length >= activeText.length) setFinished(true);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Backspace") {
      setBackspaceCount((prev) => prev + 1);
      return;
    }
    if (event.key.length !== 1) return;
    const expected = (activeText[typed.length] || "").toLowerCase();
    const actual = event.key.toLowerCase();
    if (expected !== actual) {
      setKeyMistakes((prev) => ({ ...prev, [actual]: (prev[actual] || 0) + 1 }));
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COMMUNITY_KEY);
      if (!raw) return;
      setCommunityPassages(JSON.parse(raw) as CommunityPassage[]);
    } catch {
      setCommunityPassages([]);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("typing-ui-mode");
    if (saved === "ADVANCED" || saved === "SIMPLE") {
      setUiMode(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("typing-ui-mode", uiMode);
  }, [uiMode]);

  useEffect(() => {
    void loadSource();
  }, [loadSource]);

  useEffect(() => {
    void typingApi.getQuoteCategories().then((categories) => {
      setQuoteCategories(categories || []);
      if (categories?.length && !categories.includes(quoteCategory)) {
        setQuoteCategory(categories[0]);
      }
    }).catch(() => setQuoteCategories([]));
  }, [quoteCategory]);

  useEffect(() => {
    if (!isAuthenticated) {
      setProfile(null);
      return;
    }
    void typingApi.getMyProfile().then(setProfile).catch(() => setProfile(null));
  }, [isAuthenticated]);

  useEffect(() => {
    if (practiceMode === "WEAK_KEYS") {
      setMode("CUSTOM");
      setCustomText(weakKeyDrill);
      resetRun();
    }
  }, [practiceMode, resetRun, weakKeyDrill]);

  useEffect(() => {
    if (!isAdvancedUi && practiceMode !== "STANDARD") {
      setPracticeMode("STANDARD");
    }
  }, [isAdvancedUi, practiceMode]);

  useEffect(() => {
    if (!isAdvancedUi && (activeView === "PREMIUM" || activeView === "CREATOR")) {
      setActiveView("PRACTICE");
      setActiveWorkspace("practice");
      navigateToTypingWorkspace("practice", true);
    }
  }, [activeView, isAdvancedUi, navigateToTypingWorkspace]);

  useEffect(() => {
    setRemainingSec(duration);
  }, [duration]);

  useEffect(() => {
    const timedActive = mode === "TIMED" && practiceMode !== "ZEN" && practiceMode !== "ENDLESS";
    if (!timedActive || !startedAtMs || finished) return;
    const timer = window.setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [finished, mode, practiceMode, startedAtMs]);

  useEffect(() => {
    if (!finished || rewardedRunRef.current) return;
    rewardedRunRef.current = true;
    const earnedXp = clamp(Math.round(wpm * 1.8 + accuracy * 0.6 - errors * 2), 20, 180);
    updatePremiumState((prev) => grantBattlePassRewardsForXp(prev, prev.seasonXp + earnedXp));
    if (!isAuthenticated) return;
    void typingApi.submitScore({
      mode,
      wpm,
      rawWpm: wpm,
      accuracy,
      testDuration: elapsedSec,
      wordCountTarget: mode === "WORD_COUNT" ? wordTarget : undefined,
      category: mode === "QUOTE" ? quoteCategory : sourceText?.category,
      textSnippet: activeText.slice(0, 120),
      textId: sourceText?.id,
      errors,
      keyPresses: typed.length + backspaceCount,
      keyMistakes,
    }).catch(() => undefined);
  }, [
    accuracy,
    activeText,
    backspaceCount,
    elapsedSec,
    errors,
    finished,
    isAuthenticated,
    keyMistakes,
    mode,
    quoteCategory,
    sourceText?.category,
    sourceText?.id,
    typed.length,
    updatePremiumState,
    wordTarget,
    wpm,
  ]);

  const setPlan = (plan: PremiumPlan) => {
    updatePremiumState((prev) => ({ ...prev, plan }));
    toast.success(`Plan switched to ${plan}`);
  };

  const unlockPaidTrack = () => {
    updatePremiumState((prev) => ({ ...prev, battlePassPaid: true }));
    toast.success("Paid track unlocked.");
  };

  const buyStreakFreeze = () => {
    if (!isPremium) {
      toast.error("Upgrade to Pro/Elite first.");
      return;
    }
    updatePremiumState((prev) => ({ ...prev, streakFreezes: prev.streakFreezes + 1 }));
    toast.success("Streak freeze added.");
  };

  const equipCosmetic = (item: CosmeticItem) => {
    if (!item.owned) {
      toast.error("Unlock this cosmetic first.");
      return;
    }
    updatePremiumState((prev) => ({
      ...prev,
      cosmetics: prev.cosmetics.map((entry) => (
        entry.type === item.type
          ? { ...entry, equipped: entry.id === item.id }
          : entry
      )),
    }));
  };

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/15 via-card/90 to-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Typing Pro Arena</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Fast, focused typing practice with optional advanced tools.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Plan: {premiumState.plan}</Badge>
            <Badge variant={finished ? "default" : "secondary"}>
              {finished ? "Run Complete" : startedAtMs ? "In Progress" : "Ready"}
            </Badge>
            <div className="inline-flex rounded-md border border-border p-1">
              <Button
                size="sm"
                variant={uiMode === "SIMPLE" ? "default" : "ghost"}
                onClick={() => setUiMode("SIMPLE")}
              >
                Simple
              </Button>
              <Button
                size="sm"
                variant={uiMode === "ADVANCED" ? "default" : "ghost"}
                onClick={() => setUiMode("ADVANCED")}
              >
                Advanced
              </Button>
            </div>
          </div>
        </div>
      </header>

      {isAdvancedUi && !canUseFeature(premiumState, "no_ads") && (
        <section className="glass-card flex items-center justify-between gap-3 border-amber-400/30 p-3">
          <div>
            <p className="text-sm font-semibold text-amber-300">Sponsored Tip</p>
            <p className="text-xs text-muted-foreground">Upgrade for no ads and extra premium controls.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setPlan("PRO")}>Upgrade</Button>
        </section>
      )}

      {activeWorkspace === "hub" ? (
        <section className="glass-card p-4">
          <h2 className="text-base font-semibold">Choose Typing Workflow</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose one workspace card, complete the flow, and return with "Back to cards."
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {availableWorkspaceCards.map((card) => (
              <Link
                key={card.id}
                to={typingWorkspacePath(card.id)}
                className="rounded-xl border border-border bg-background p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5"
              >
                <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <card.icon className="h-4 w-4" />
                </span>
                <p className="text-sm font-semibold">{card.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
                <p className="mt-3 text-xs font-semibold text-primary">{card.actionLabel}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="glass-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Active Workspace</p>
              <p className="text-base font-semibold">{activeWorkspaceCard?.title || "Typing Workflow"}</p>
              <p className="text-sm text-muted-foreground">{activeWorkspaceCard?.description || "Continue your typing work."}</p>
            </div>
            <Button type="button" variant="outline" onClick={() => navigateToTypingWorkspace("hub")}>
              Back to cards
            </Button>
          </div>
        </section>
      )}

      {activeWorkspace !== "hub" && (
      <>
      <section className="glass-card p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {typingViews
            .filter((view) => isAdvancedUi || (view.id !== "PREMIUM" && view.id !== "CREATOR"))
            .map((view) => (
              <Button
                asChild
                key={view.id}
                type="button"
                variant={activeView === view.id ? "default" : "outline"}
                className="h-auto justify-start px-3 py-3 text-left"
              >
                <Link to={typingWorkspacePath(TYPING_VIEW_TO_WORKSPACE[view.id])}>
                  <span className="leading-tight">
                    <span className="block text-sm font-semibold">{view.title}</span>
                    <span className="block text-xs text-muted-foreground">{view.hint}</span>
                  </span>
                </Link>
              </Button>
            ))}
        </div>
      </section>

      {activeView === "PRACTICE" && (
      <section className="glass-card space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Game Mode">
            <Select value={mode} onValueChange={(value) => setMode(value as TypingMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TIMED">Timed</SelectItem>
                <SelectItem value="WORD_COUNT">Word Count</SelectItem>
                <SelectItem value="QUOTE">Quote</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {isAdvancedUi && (
            <Field label="Practice Mode">
              <Select value={practiceMode} onValueChange={(value) => setPracticeMode(value as TypingPracticeMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(PRACTICE_MODE_DESCRIPTIONS).map((key) => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">{PRACTICE_MODE_DESCRIPTIONS[practiceMode]}</p>
            </Field>
          )}
          {isAdvancedUi && (
            <Field label="Layout">
              <Select value={layout} onValueChange={(value) => setLayout(value as KeyboardLayoutType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(KEYBOARD_LAYOUTS).map((key) => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field label="Quick Actions">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={resetRun}><RotateCcw className="mr-1 h-4 w-4" />Reset</Button>
              <Button
                variant="outline"
                onClick={() => {
                  void loadSource();
                  resetRun();
                }}
                disabled={mode === "CUSTOM"}
              >
                New Text
              </Button>
              {isAdvancedUi && <Button variant="outline" onClick={() => applyLesson(TYPING_LESSONS[0].id)}>Start Lesson</Button>}
            </div>
          </Field>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {mode === "TIMED" && (
            <Field label="Duration">
              <div className="flex flex-wrap gap-2">
                {TIMED_DURATIONS.map((value) => (
                  <Button key={value} variant={duration === value ? "default" : "outline"} onClick={() => setDuration(value)}>{value}s</Button>
                ))}
              </div>
            </Field>
          )}
          {mode === "WORD_COUNT" && (
            <Field label="Word Target">
              <div className="flex flex-wrap gap-2">
                {WORD_TARGETS.map((value) => (
                  <Button key={value} variant={wordTarget === value ? "default" : "outline"} onClick={() => setWordTarget(value)}>{value}</Button>
                ))}
              </div>
            </Field>
          )}
          {mode === "QUOTE" && (
            <Field label="Quote Category">
              <Select value={quoteCategory} onValueChange={setQuoteCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(quoteCategories.length ? quoteCategories : ["General"]).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          )}
          {isAdvancedUi && (
            <Field label="Theme">
              <p className="text-xs text-muted-foreground">Accent: {accentTheme} | Highlight: {highlightTheme}</p>
            </Field>
          )}
        </div>

        {mode === "CUSTOM" && (
          <Field label="Custom Passage">
            <textarea
              className="min-h-28 w-full rounded border border-border bg-background p-3 text-sm"
              value={customText}
              onChange={(event) => setCustomText(event.target.value)}
              placeholder="Paste or write your own typing passage here..."
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={resetRun}
                disabled={!customText.trim()}
              >
                Apply Custom Text
              </Button>
              <p className="text-xs text-muted-foreground">
                {countWords(customText)} words
              </p>
            </div>
          </Field>
        )}
      </section>
      )}

      {activeView === "PRACTICE" && (
      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-4">
          <div className="glass-card p-4">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
              <Metric label={mode === "TIMED" ? "Remaining" : "Elapsed"} value={`${mode === "TIMED" ? remainingSec : elapsedSec}s`} />
              <Metric label="WPM" value={String(wpm)} />
              <Metric label="Accuracy" value={`${accuracy}%`} />
              <Metric label="Errors" value={String(errors)} />
              <Metric label="Words" value={String(typedWords)} />
              <Metric label="Backspace" value={String(backspaceCount)} />
            </div>
            <Progress className="mt-3" value={progress} />
          </div>

          <div className="glass-card p-4">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              {MODE_LABELS[mode]} source {practiceMode === "BLIND" && <span className="text-amber-400">(Blind)</span>}
            </p>
            <div className="rounded border border-border bg-muted/20 p-3 leading-7">
              {(hiddenText || "No text loaded.").split("").map((char, index) => {
                const typedChar = typed[index];
                const expectedChar = activeText[index];
                const isTyped = index < typed.length;
                const isCurrent = index === typed.length && !finished;
                if (practiceMode === "BLIND") {
                  return (
                    <span
                      key={`${char}-${index}`}
                      className={isTyped ? "text-muted-foreground" : "text-foreground/80"}
                    >
                      {char}
                    </span>
                  );
                }
                return (
                  <span
                    key={`${char}-${index}`}
                    className={
                      isTyped
                        ? typedChar === expectedChar
                          ? "text-primary"
                          : "bg-red-500/15 text-red-500"
                        : isCurrent
                          ? "rounded-sm bg-primary/20 text-foreground"
                          : "text-foreground"
                    }
                  >
                    {char}
                  </span>
                );
              })}
            </div>
            {practiceMode === "BLIND" && (
              <p className="mt-2 text-xs text-muted-foreground">
                Blind mode: preview masked, accuracy still evaluated against original text.
              </p>
            )}
            <textarea
              className="typing-input typing-input-wrap mt-3 h-40 w-full rounded border border-border bg-background p-3"
              value={typed}
              onChange={(event) => onInput(event.target.value)}
              onKeyDown={onKeyDown}
              disabled={finished}
              placeholder="Type here..."
            />
            {finished && (
              <div className="mt-3 flex items-center gap-2 rounded border border-primary/30 bg-primary/10 p-2 text-sm">
                <BadgeCheck className="h-4 w-4 text-primary/80" />
                Test complete.
              </div>
            )}
          </div>

          {isAdvancedUi && (
            canUseFeature(premiumState, "advanced_heatmaps") ? (
              <div className="glass-card p-4">
                <h3 className="font-semibold">Advanced Heatmap</h3>
                <div className="mt-2 grid grid-cols-8 gap-2 md:grid-cols-10">
                  {Array.from("abcdefghijklmnopqrstuvwxyz").map((key) => {
                    const count = (profile?.keyHeatmap?.[key] || 0) + (keyMistakes[key] || 0);
                    const intensity = clamp(count * 12, 6, 96);
                    return (
                      <div
                        key={key}
                        className="rounded border border-border p-2 text-center text-xs"
                        style={{ background: `linear-gradient(180deg, hsl(var(--destructive) / ${intensity / 160}), transparent)` }}
                      >
                        <p className="font-semibold">{key.toUpperCase()}</p>
                        <p className="text-[10px] text-muted-foreground">{count}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <LockedCard title="Advanced analytics heatmaps" detail="Upgrade to Pro/Elite for detailed key heatmaps." />
            )
          )}
        </div>

        <div className="space-y-4">
          <div className="glass-card p-4">
            <h3 className="inline-flex items-center gap-2 font-semibold"><Brain className="h-4 w-4 text-primary" />AI Suggestions</h3>
            <div className="mt-2 space-y-2">
              {aiSuggestions.map((suggestion) => (
                <article key={suggestion.headline} className="rounded border border-border p-2">
                  <p className="text-sm font-semibold">{suggestion.headline}</p>
                  <p className="text-xs text-muted-foreground">{suggestion.detail}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="font-semibold">Run Insights</h3>
            <div className="mt-2 space-y-2">
              <p className="text-sm text-muted-foreground">
                Layout: <span className="font-medium text-foreground">{layout}</span> • Practice:{" "}
                <span className="font-medium text-foreground">{practiceMode}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Top Mistakes:
              </p>
              {topMistakes.length === 0 ? (
                <p className="text-xs text-muted-foreground">No repeated mistake keys yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {topMistakes.map(([key, count]) => (
                    <Badge key={key} variant="outline">
                      {key.toUpperCase()} x{count}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {isAdvancedUi && (
            <div className="glass-card p-4">
              <h3 className="inline-flex items-center gap-2 font-semibold"><Gem className="h-4 w-4 text-primary" />Premium</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["FREE", "PRO", "ELITE"] as PremiumPlan[]).map((plan) => (
                  <Button key={plan} variant={premiumState.plan === plan ? "default" : "outline"} onClick={() => setPlan(plan)}>
                    {plan}
                  </Button>
                ))}
                <Button variant="outline" onClick={buyStreakFreeze}><Flame className="mr-1 h-4 w-4" />Buy Freeze</Button>
                <Badge variant="outline">Freezes: {premiumState.streakFreezes}</Badge>
              </div>
              <div className="mt-3 space-y-2">
                {PREMIUM_FEATURES.map((feature) => (
                  <article key={feature.key} className="flex items-center justify-between rounded border border-border p-2">
                    <p className="text-sm">{feature.title}</p>
                    <Badge variant={canUseFeature(premiumState, feature.key) ? "default" : "secondary"}>
                      {canUseFeature(premiumState, feature.key) ? "On" : "Locked"}
                    </Badge>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      )}

      {activeView === "PERFORMANCE" && (
      <section className="grid gap-4 xl:grid-cols-2">
        <div className="glass-card p-4">
          <h2 className="mb-3 text-lg font-semibold">Performance Snapshot</h2>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            <Metric label={mode === "TIMED" ? "Remaining" : "Elapsed"} value={`${mode === "TIMED" ? remainingSec : elapsedSec}s`} />
            <Metric label="WPM" value={String(wpm)} />
            <Metric label="Accuracy" value={`${accuracy}%`} />
            <Metric label="Errors" value={String(errors)} />
            <Metric label="Words" value={String(typedWords)} />
            <Metric label="Backspace" value={String(backspaceCount)} />
          </div>
          <Progress className="mt-3" value={progress} />
          <div className="mt-3 rounded border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
            Layout: <span className="font-medium text-foreground">{layout}</span> | Practice:{" "}
            <span className="font-medium text-foreground">{practiceMode}</span>
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="inline-flex items-center gap-2 font-semibold"><Brain className="h-4 w-4 text-primary" />AI Suggestions</h3>
          <div className="mt-2 space-y-2">
            {aiSuggestions.map((suggestion) => (
              <article key={suggestion.headline} className="rounded border border-border p-2">
                <p className="text-sm font-semibold">{suggestion.headline}</p>
                <p className="text-xs text-muted-foreground">{suggestion.detail}</p>
              </article>
            ))}
          </div>
          <div className="mt-3 rounded border border-border p-3">
            <p className="text-sm text-muted-foreground">Top Mistakes:</p>
            {topMistakes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No repeated mistake keys yet.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {topMistakes.map(([key, count]) => (
                  <Badge key={key} variant="outline">
                    {key.toUpperCase()} x{count}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {isAdvancedUi && (
          canUseFeature(premiumState, "advanced_heatmaps") ? (
            <div className="glass-card p-4 xl:col-span-2">
              <h3 className="font-semibold">Advanced Heatmap</h3>
              <div className="mt-2 grid grid-cols-8 gap-2 md:grid-cols-10">
                {Array.from("abcdefghijklmnopqrstuvwxyz").map((key) => {
                  const count = (profile?.keyHeatmap?.[key] || 0) + (keyMistakes[key] || 0);
                  const intensity = clamp(count * 12, 6, 96);
                  return (
                    <div
                      key={key}
                      className="rounded border border-border p-2 text-center text-xs"
                      style={{ background: `linear-gradient(180deg, hsl(var(--destructive) / ${intensity / 160}), transparent)` }}
                    >
                      <p className="font-semibold">{key.toUpperCase()}</p>
                      <p className="text-[10px] text-muted-foreground">{count}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="xl:col-span-2">
              <LockedCard title="Advanced analytics heatmaps" detail="Upgrade to Pro/Elite for detailed key heatmaps." />
            </div>
          )
        )}
      </section>
      )}

      {isAdvancedUi && activeView === "PREMIUM" && (
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-card p-4">
          <h2 className="mb-3 inline-flex items-center gap-2 text-lg font-semibold"><Crown className="h-5 w-5 text-amber-400" />Battle Pass</h2>
          <div className="rounded border border-border p-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{ACTIVE_SEASON.name}</p>
              <Badge variant="outline">Tier {tierProgress.currentTier}/10</Badge>
            </div>
            <Progress className="mt-3" value={tierProgress.percent} />
            <p className="mt-1 text-xs text-muted-foreground">{tierProgress.intoTier}/{ACTIVE_SEASON.xpPerTier} XP</p>
            {!premiumState.battlePassPaid && (
              <Button className="mt-3 w-full" variant="outline" onClick={unlockPaidTrack}>Unlock Paid Track</Button>
            )}
          </div>
          <div className="mt-3 max-h-[320px] space-y-2 overflow-auto pr-1">
            {Array.from({ length: 10 }, (_, index) => index + 1).map((tier) => (
              <article key={tier} className="rounded border border-border p-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Tier {tier}</p>
                {BATTLE_PASS_REWARDS.filter((reward) => reward.tier === tier).map((reward) => (
                  <div key={reward.id} className="mt-1 flex items-center justify-between rounded border border-border px-2 py-1">
                    <p className="text-xs">{reward.track} - {reward.title}</p>
                    <Badge variant={premiumState.unlockedRewardIds.includes(reward.id) ? "default" : "secondary"}>
                      {premiumState.unlockedRewardIds.includes(reward.id) ? "Unlocked" : "Locked"}
                    </Badge>
                  </div>
                ))}
              </article>
            ))}
          </div>
        </div>

        <div className="glass-card p-4">
          <h2 className="mb-3 inline-flex items-center gap-2 text-lg font-semibold"><Sparkles className="h-5 w-5 text-primary" />Cosmetics</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {premiumState.cosmetics.map((item) => {
              const lockedByPlan = item.premiumOnly && !isPremium;
              return (
                <article key={item.id} className="rounded border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{item.name}</p>
                    <Badge variant="outline">{item.rarity}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.type}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {item.equipped ? (
                      <Badge className="bg-primary/80 hover:bg-primary/80">Equipped</Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => equipCosmetic(item)} disabled={!item.owned}>
                        Equip
                      </Button>
                    )}
                    {!item.owned && <Badge variant="secondary">Locked</Badge>}
                    {lockedByPlan && (
                      <Badge variant="outline" className="inline-flex items-center gap-1"><Lock className="h-3 w-3" />Premium</Badge>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {isAdvancedUi && activeView === "CREATOR" && (
      <section className="glass-card p-4">
        <h2 className="mb-3 inline-flex items-center gap-2 font-semibold"><Palette className="h-4 w-4" />Creator Tools</h2>
        <Tabs defaultValue="editor">
          <TabsList>
            <TabsTrigger value="editor">Passage Editor</TabsTrigger>
            <TabsTrigger value="community">Community Library</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-3 pt-3">
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Title"><input value={editorTitle} onChange={(event) => setEditorTitle(event.target.value)} className="h-10 w-full rounded border border-border bg-background px-3 text-sm" /></Field>
              <Field label="Language">
                <Select value={editorLanguage} onValueChange={(value) => setEditorLanguage(value as CommunityPassage["language"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plaintext">Plain text</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Tags"><input value={editorTags} onChange={(event) => setEditorTags(event.target.value)} className="h-10 w-full rounded border border-border bg-background px-3 text-sm" /></Field>
            </div>
            <div className="overflow-hidden rounded border border-border">
              <Editor
                height="260px"
                language={editorLanguage}
                value={editorContent}
                onChange={(value) => setEditorContent(value || "")}
                theme={theme === "light" ? "vs" : "vs-dark"}
                options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={savePassage}>Save Passage</Button>
              <Button variant="outline" onClick={() => { setMode("CUSTOM"); setCustomText(editorContent); resetRun(); }}>Use Passage</Button>
              {!isPremium && <Badge variant="outline">Free limit {FREE_CUSTOM_PASSAGE_LIMIT}</Badge>}
            </div>
          </TabsContent>

          <TabsContent value="community" className="pt-3">
            <div className="grid gap-3 md:grid-cols-2">
              {mergedPassages.map((passage) => (
                <article key={passage.id} className="rounded border border-border p-3">
                  <p className="font-semibold text-sm">{passage.title}</p>
                  <p className="text-xs text-muted-foreground">{passage.author}</p>
                  <pre className="mt-2 max-h-28 overflow-auto rounded border border-border bg-background p-2 text-[11px] whitespace-pre-wrap">{passage.content.slice(0, 220)}</pre>
                  <Button size="sm" className="mt-2" variant="outline" onClick={() => { setMode("CUSTOM"); setCustomText(passage.content); resetRun(); }}>
                    Practice This
                  </Button>
                </article>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="theme" className="pt-3">
            {canUseFeature(premiumState, "custom_themes") ? (
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Accent">
                  <Select value={accentTheme} onValueChange={(value) => setAccentTheme(value as typeof accentTheme)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cyan">Cyan</SelectItem>
                      <SelectItem value="emerald">Emerald</SelectItem>
                      <SelectItem value="rose">Rose</SelectItem>
                      <SelectItem value="amber">Amber</SelectItem>
                      <SelectItem value="violet">Violet</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Highlight">
                  <Select value={highlightTheme} onValueChange={(value) => setHighlightTheme(value as typeof highlightTheme)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cyan">Cyan</SelectItem>
                      <SelectItem value="lime">Lime</SelectItem>
                      <SelectItem value="amber">Amber</SelectItem>
                      <SelectItem value="pink">Pink</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Custom theme editing is available in Pro and Elite plans.</p>
            )}
          </TabsContent>
        </Tabs>
      </section>
      )}

      {!isAdvancedUi && (
        <section className="glass-card flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-muted-foreground">
            Advanced tools (battle pass, cosmetics, creator studio) hidden for a cleaner typing experience.
          </p>
          <Button variant="outline" onClick={() => setUiMode("ADVANCED")}>
            Open Advanced Tools
          </Button>
        </section>
      )}

      <div className="sr-only" aria-live="polite">Typing stats update: wpm {wpm}, accuracy {accuracy}%.</div>
      </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-muted/20 p-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}

function LockedCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="glass-card border-dashed p-4">
      <h3 className="inline-flex items-center gap-2 font-semibold"><Lock className="h-4 w-4 text-amber-400" />{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
