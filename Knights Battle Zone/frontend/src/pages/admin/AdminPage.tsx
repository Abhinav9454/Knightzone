import { useCallback, useEffect, useMemo, useState } from "react";
import { contestApi, quizApi, superAdminApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LiveChatAdminPanel } from "@/components/livechat/LiveChatAdminPanel";
import { APP_PAGE_REGISTRY } from "@/config/page-registry";
import type { AppPageCategory } from "@/config/page-registry";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Shield,
  Users,
  Trophy,
  CircleHelp,
  Sparkles,
  CalendarClock,
  Activity,
  Settings,
  Crown,
  UserPlus,
  ShieldAlert,
  ScanSearch,
  AlertTriangle,
  Server,
  CheckCircle2,
} from "lucide-react";
import type { Contest, Quiz, User } from "@/lib/types";
import { isSuperAdminRole, normalizeRole } from "@/lib/auth-role";

type ProblemForm = {
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  sampleInput: string;
  sampleOutput: string;
  hiddenTestCases: string;
  points: string;
};

type ContestForm = {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  durationMinutes: string;
  problems: ProblemForm[];
};

type QuizOptionForm = {
  text: string;
  isCorrect: boolean;
};

type QuizQuestionForm = {
  text: string;
  points: string;
  options: QuizOptionForm[];
};

type QuizForm = {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  durationMinutes: string;
  questions: QuizQuestionForm[];
};

type AdminCreateForm = {
  name: string;
  email: string;
  password: string;
  college: string;
  accessDurationHours: string;
};

type ContestEditForm = {
  title: string;
  startTime: string;
  endTime: string;
  durationMinutes: string;
};

type QuizEditForm = {
  title: string;
  startTime: string;
  endTime: string;
  durationMinutes: string;
};

type AdminTab = "super-admin" | "contests" | "quizzes" | "monitoring";
type AdminCapability = { id: string; label: string; role: "ADMIN" | "SUPER_ADMIN" | "BOTH" };

const toInputDateTime = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

const makeProblem = (): ProblemForm => ({
  title: "",
  description: "",
  difficulty: "MEDIUM",
  sampleInput: "",
  sampleOutput: "",
  hiddenTestCases: "",
  points: "100",
});

const makeContestDefaults = (): ContestForm => {
  const start = new Date(Date.now() + 60 * 60 * 1000);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return {
    title: "",
    description: "",
    startTime: toInputDateTime(start),
    endTime: toInputDateTime(end),
    durationMinutes: "120",
    problems: [makeProblem()],
  };
};

const makeQuizDefaults = (): QuizForm => {
  const start = new Date(Date.now() + 60 * 60 * 1000);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    title: "",
    description: "",
    startTime: toInputDateTime(start),
    endTime: toInputDateTime(end),
    durationMinutes: "60",
    questions: [
      {
        text: "",
        points: "1",
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      },
    ],
  };
};

const makeQuizQuestion = (): QuizQuestionForm => ({
  text: "",
  points: "1",
  options: [
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ],
});

const makeAdminDefaults = (): AdminCreateForm => ({
  name: "",
  email: "",
  password: "",
  college: "",
  accessDurationHours: "24",
});

const getContestTone = (status: Contest["status"]) => {
  if (status === "ONGOING") return "border-success/40 text-success";
  if (status === "UPCOMING") return "border-primary/40 text-primary";
  return "border-muted-foreground/30 text-muted-foreground";
};

export default function AdminPage() {
  const { user } = useAuth();
  const location = useLocation();
  const isSuperAdmin = isSuperAdminRole(user?.role);
  const isSimpleContext = location.pathname.startsWith("/simple");
  const [searchParams] = useSearchParams();

  const [tab, setTab] = useState<AdminTab>(isSuperAdmin ? "super-admin" : "contests");
  const [loading, setLoading] = useState(true);
  const [contests, setContests] = useState<Contest[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);

  const [contestForm, setContestForm] = useState<ContestForm>(makeContestDefaults);
  const [quizForm, setQuizForm] = useState<QuizForm>(makeQuizDefaults);
  const [adminForm, setAdminForm] = useState<AdminCreateForm>(makeAdminDefaults);

  const [savingContest, setSavingContest] = useState(false);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [contestEdit, setContestEdit] = useState<Record<number, ContestEditForm>>({});
  const [quizEdit, setQuizEdit] = useState<Record<number, QuizEditForm>>({});
  const [savingContestEdit, setSavingContestEdit] = useState<Record<number, boolean>>({});
  const [savingQuizEdit, setSavingQuizEdit] = useState<Record<number, boolean>>({});

  const sortedContests = useMemo(
    () => [...contests].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    [contests],
  );

  const sortedQuizzes = useMemo(
    () => [...quizzes].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    [quizzes],
  );

  const counts = useMemo(() => {
    const stats = { UPCOMING: 0, ONGOING: 0, PAST: 0 } as Record<Contest["status"], number>;
    for (const contest of contests) stats[contest.status] += 1;
    return stats;
  }, [contests]);

  const adminOnlyPages = useMemo(
    () => APP_PAGE_REGISTRY.filter((page) => page.access === "admin"),
    [],
  );

  const accessiblePages = useMemo(
    () => APP_PAGE_REGISTRY.filter((page) => page.access === "all" || page.access === "admin"),
    [],
  );

  const pagesByCategory = useMemo(() => {
    const categoryOrder: AppPageCategory[] = ["Core", "Coding", "Career", "Community", "Placement", "Admin", "Support"];
    return categoryOrder
      .map((category) => ({
        category,
        pages: accessiblePages.filter((page) => page.category === category),
      }))
      .filter((group) => group.pages.length > 0);
  }, [accessiblePages]);

  const accessSummary = useMemo(() => {
    const sidebarPages = accessiblePages.filter((page) => page.inSidebar).length;
    return {
      total: accessiblePages.length,
      sidebar: sidebarPages,
      adminOnly: adminOnlyPages.length,
      shared: accessiblePages.length - adminOnlyPages.length,
    };
  }, [accessiblePages, adminOnlyPages]);

  const adminCapabilities = useMemo<AdminCapability[]>(() => {
    const common: AdminCapability[] = [
      { id: "contest-create", label: "Create contests", role: "BOTH" },
      { id: "contest-edit", label: "Edit contests", role: "BOTH" },
      { id: "contest-delete", label: "Delete contests", role: "BOTH" },
      { id: "quiz-create", label: "Create quizzes", role: "BOTH" },
      { id: "quiz-edit", label: "Edit quizzes", role: "BOTH" },
      { id: "quiz-delete", label: "Delete quizzes", role: "BOTH" },
      { id: "integrity-monitor", label: "Open integrity monitoring", role: "BOTH" },
      { id: "review-flags", label: "Review flagged submissions", role: "BOTH" },
      { id: "suspicious-users", label: "Audit suspicious users", role: "BOTH" },
      { id: "backend-health", label: "View backend health", role: "BOTH" },
    ];

    if (!isSuperAdmin) {
      return common;
    }

    return [
      { id: "admin-create", label: "Create admin accounts", role: "SUPER_ADMIN" },
      { id: "admin-delete", label: "Delete admin accounts", role: "SUPER_ADMIN" },
      ...common,
    ];
  }, [isSuperAdmin]);

  const toScopedHref = useCallback(
    (href: string) => {
      if (!isSimpleContext) return href;
      return `/simple${href}`;
    },
    [isSimpleContext],
  );

  const loadAdminData = useCallback(async () => {
    try {
      const [contestData, quizData] = await Promise.all([contestApi.getAll(), quizApi.getAll()]);
      setContests(contestData);
      setQuizzes(quizData);
      setContestEdit(Object.fromEntries(
        contestData.map((contest) => [
          contest.id,
          {
            title: contest.title || "",
            startTime: toInputDateTime(new Date(contest.startTime)),
            endTime: toInputDateTime(new Date(contest.endTime)),
            durationMinutes: String(contest.duration || 120),
          },
        ]),
      ));
      setQuizEdit(Object.fromEntries(
        quizData.map((quiz) => [
          quiz.id,
          {
            title: quiz.title || "",
            startTime: toInputDateTime(new Date(quiz.startTime)),
            endTime: toInputDateTime(new Date(quiz.endTime)),
            durationMinutes: String(quiz.durationMinutes || 60),
          },
        ]),
      ));
      if (isSuperAdmin) {
        const adminData = await superAdminApi.getAdmins();
        setAdmins(adminData);
      }
    } catch {
      toast.error("Failed to load admin data from backend.");
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    if (!requestedTab) return;
    if (requestedTab === "contests" || requestedTab === "quizzes" || requestedTab === "monitoring") {
      setTab(requestedTab);
    }
    if (requestedTab === "super-admin" && isSuperAdmin) {
      setTab("super-admin");
    }
  }, [searchParams, isSuperAdmin]);

  const submitContest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!contestForm.title.trim()) return toast.error("Contest title is required.");
    if (new Date(contestForm.endTime).getTime() <= new Date(contestForm.startTime).getTime()) {
      return toast.error("Contest end time must be after start time.");
    }
    if (contestForm.problems.some((problem) => !problem.title.trim())) {
      return toast.error("Problem title is required.");
    }
    const duration = Number(contestForm.durationMinutes);
    if (!Number.isFinite(duration) || duration <= 0) {
      return toast.error("Contest duration must be a positive number.");
    }

    try {
      setSavingContest(true);
      await contestApi.create({
        title: contestForm.title.trim(),
        description: contestForm.description.trim(),
        startTime: contestForm.startTime,
        endTime: contestForm.endTime,
        durationMinutes: duration,
        problems: contestForm.problems.map((problem) => ({
          title: problem.title.trim(),
          description: problem.description.trim(),
          difficulty: problem.difficulty,
          sampleInput: problem.sampleInput,
          sampleOutput: problem.sampleOutput,
          testCases: problem.hiddenTestCases,
          points: Number(problem.points) > 0 ? Number(problem.points) : 100,
        })),
      });
      toast.success("Contest created successfully.");
      setContestForm(makeContestDefaults());
      await loadAdminData();
    } catch {
      toast.error("Contest creation failed.");
    } finally {
      setSavingContest(false);
    }
  };

  const submitQuiz = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!quizForm.title.trim()) return toast.error("Quiz title is required.");
    if (new Date(quizForm.endTime).getTime() <= new Date(quizForm.startTime).getTime()) {
      return toast.error("Quiz end time must be after start time.");
    }
    if (!quizForm.questions.length || quizForm.questions.some((question) => !question.text.trim())) {
      return toast.error("At least one question is required.");
    }

    const invalidQuestion = quizForm.questions.find((q) => q.options.some((o) => !o.text.trim()) || !q.options.some((o) => o.isCorrect));
    if (invalidQuestion) return toast.error("Each question needs 4 options and one correct answer.");

    try {
      setSavingQuiz(true);
      await quizApi.create({
        title: quizForm.title.trim(),
        description: quizForm.description.trim(),
        startTime: quizForm.startTime,
        endTime: quizForm.endTime,
        durationMinutes: Number(quizForm.durationMinutes) > 0 ? Number(quizForm.durationMinutes) : 30,
        questions: quizForm.questions.map((q) => ({
          text: q.text.trim(),
          points: Number(q.points) > 0 ? Number(q.points) : 1,
          options: q.options.map((opt) => ({ text: opt.text.trim(), isCorrect: opt.isCorrect })),
        })),
      });
      toast.success("Quiz created successfully.");
      setQuizForm(makeQuizDefaults());
      await loadAdminData();
    } catch {
      toast.error("Quiz creation failed.");
    } finally {
      setSavingQuiz(false);
    }
  };

  const submitAdmin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!adminForm.name.trim() || !adminForm.email.trim() || !adminForm.password.trim()) {
      return toast.error("Name, email and password are required.");
    }
    const duration = Number(adminForm.accessDurationHours);
    if (!Number.isFinite(duration) || duration < 1) {
      return toast.error("Admin access duration must be at least 1 hour.");
    }

    try {
      setSavingAdmin(true);
      await superAdminApi.createAdmin({
        name: adminForm.name.trim(),
        email: adminForm.email.trim(),
        password: adminForm.password,
        college: adminForm.college.trim() || undefined,
        accessDurationHours: duration,
      });
      toast.success("Admin account created.");
      setAdminForm(makeAdminDefaults());
      await loadAdminData();
    } catch {
      toast.error("Failed to create admin.");
    } finally {
      setSavingAdmin(false);
    }
  };

  const saveContestChanges = async (contestId: number) => {
    const edit = contestEdit[contestId];
    if (!edit?.title?.trim()) return toast.error("Contest title is required.");
    if (new Date(edit.endTime).getTime() <= new Date(edit.startTime).getTime()) {
      return toast.error("Contest end time must be after start time.");
    }
    const duration = Number(edit.durationMinutes);
    if (!Number.isFinite(duration) || duration <= 0) {
      return toast.error("Contest duration must be a positive number.");
    }

    setSavingContestEdit((prev) => ({ ...prev, [contestId]: true }));
    try {
      await contestApi.update(contestId, {
        title: edit.title.trim(),
        startTime: edit.startTime,
        endTime: edit.endTime,
        durationMinutes: duration,
      });
      toast.success("Contest updated.");
      await loadAdminData();
    } catch {
      toast.error("Failed to update contest.");
    } finally {
      setSavingContestEdit((prev) => ({ ...prev, [contestId]: false }));
    }
  };

  const saveQuizChanges = async (quizId: number) => {
    const edit = quizEdit[quizId];
    if (!edit?.title?.trim()) return toast.error("Quiz title is required.");
    if (new Date(edit.endTime).getTime() <= new Date(edit.startTime).getTime()) {
      return toast.error("Quiz end time must be after start time.");
    }
    const duration = Number(edit.durationMinutes);
    if (!Number.isFinite(duration) || duration <= 0) {
      return toast.error("Quiz duration must be a positive number.");
    }

    setSavingQuizEdit((prev) => ({ ...prev, [quizId]: true }));
    try {
      await quizApi.update(quizId, {
        title: edit.title.trim(),
        startTime: edit.startTime,
        endTime: edit.endTime,
        durationMinutes: duration,
      });
      toast.success("Quiz updated.");
      await loadAdminData();
    } catch {
      toast.error("Failed to update quiz.");
    } finally {
      setSavingQuizEdit((prev) => ({ ...prev, [quizId]: false }));
    }
  };

  const deleteContest = async (contestId: number) => {
    try {
      await contestApi.delete(contestId);
      toast.success("Contest deleted.");
      await loadAdminData();
    } catch {
      toast.error("Failed to delete contest.");
    }
  };

  const deleteQuiz = async (quizId: number) => {
    try {
      await quizApi.delete(quizId);
      toast.success("Quiz deleted.");
      await loadAdminData();
    } catch {
      toast.error("Failed to delete quiz.");
    }
  };

  const deleteAdmin = async (adminId: number) => {
    try {
      await superAdminApi.deleteAdmin(adminId);
      toast.success("Admin deleted.");
      await loadAdminData();
    } catch {
      toast.error("Failed to delete admin.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-[#071424] via-[#0b1f33] to-[#0f2f3f] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles size={14} />
              Elite Control Console
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{isSuperAdmin ? "Super Admin Panel" : "Admin Panel"}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {isSuperAdmin
                ? "Top-level platform command center for creating admins, contests and quizzes."
                : "Manage contests, quizzes, and platform operations from one powerful workspace."}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2">
            {isSuperAdmin ? <Crown className="h-4 w-4 text-accent" /> : <Shield className="h-4 w-4 text-accent" />}
            <span className="text-xs font-medium text-muted-foreground">{isSuperAdmin ? "SUPER_ADMIN ACCESS" : "ADMIN ACCESS"}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card border-primary/20 bg-gradient-to-br from-card to-primary/10 p-4">
          <p className="text-xs text-muted-foreground">Total Contests</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-2xl font-bold">{contests.length}</p>
            <Trophy className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="glass-card border-success/20 bg-gradient-to-br from-card to-success/10 p-4">
          <p className="text-xs text-muted-foreground">Live Now</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-2xl font-bold">{counts.ONGOING}</p>
            <Activity className="h-5 w-5 text-success" />
          </div>
        </div>
        <div className="glass-card border-accent/20 bg-gradient-to-br from-card to-accent/10 p-4">
          <p className="text-xs text-muted-foreground">Upcoming</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-2xl font-bold">{counts.UPCOMING}</p>
            <CalendarClock className="h-5 w-5 text-accent" />
          </div>
        </div>
        <div className="glass-card border-primary/20 bg-gradient-to-br from-card to-primary/10 p-4">
          <p className="text-xs text-muted-foreground">{isSuperAdmin ? "Admin Accounts" : "Total Quizzes"}</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-2xl font-bold">{isSuperAdmin ? admins.length : quizzes.length}</p>
            {isSuperAdmin ? <Users className="h-5 w-5 text-primary" /> : <CircleHelp className="h-5 w-5 text-primary" />}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="glass-card xl:col-span-2 border-primary/20 bg-gradient-to-br from-card to-primary/10 p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-primary" />
              <h3 className="font-semibold">Admin-Exclusive Pages</h3>
            </div>
            <Badge variant="outline">{adminOnlyPages.length} pages</Badge>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            These routes are exclusive to admin access. Open any page directly from here.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {adminOnlyPages.map((page) => (
              <Link
                key={page.id}
                to={toScopedHref(page.href)}
                className="rounded-lg border border-border bg-background/40 p-3 transition-all hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex items-center gap-2">
                  <page.icon className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">{page.label}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{page.summary}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="glass-card border-accent/25 bg-gradient-to-br from-card to-accent/10 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Shield size={16} className="text-accent" />
            <h3 className="font-semibold">Role Capabilities</h3>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            {isSuperAdmin ? "SUPER_ADMIN + ADMIN powers active." : "ADMIN powers active."}
          </p>
          <div className="space-y-2">
            {adminCapabilities.map((capability) => (
              <div key={capability.id} className="flex items-center justify-between rounded-md border border-border bg-background/40 px-3 py-2">
                <span className="text-sm">{capability.label}</span>
                <span className="inline-flex items-center gap-1 text-xs text-success">
                  <CheckCircle2 size={13} />
                  Allowed
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-card border-primary/20 bg-gradient-to-br from-card to-primary/5 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold">Full Admin Access Matrix</h3>
            <p className="text-sm text-muted-foreground">
              Complete visibility of every route currently available to admin users.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Total: {accessSummary.total}</Badge>
            <Badge variant="outline">Sidebar: {accessSummary.sidebar}</Badge>
            <Badge variant="outline">Shared: {accessSummary.shared}</Badge>
            <Badge variant="outline">Admin-Only: {accessSummary.adminOnly}</Badge>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {pagesByCategory.map((group) => (
            <div key={group.category} className="rounded-lg border border-border bg-background/35 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">{group.category}</p>
                <Badge variant="secondary">{group.pages.length}</Badge>
              </div>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {group.pages.map((page) => (
                  <Link
                    key={page.id}
                    to={toScopedHref(page.href)}
                    className="flex items-center justify-between rounded-md border border-border bg-background/50 px-3 py-2 transition-all hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span className="inline-flex items-center gap-2 text-sm">
                      <page.icon className="h-4 w-4 text-primary" />
                      {page.label}
                    </span>
                    <Badge variant={page.access === "admin" ? "default" : "outline"} className="text-[10px] uppercase">
                      {page.access === "admin" ? "Admin" : "Shared"}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Tabs value={tab} onValueChange={(value) => setTab(value as AdminTab)}>
        <TabsList className={`grid w-full border border-border/70 bg-gradient-to-r from-[#0c1828] to-[#13253a] p-1 ${isSuperAdmin ? "grid-cols-4" : "grid-cols-3"}`}>
          {isSuperAdmin && (
            <TabsTrigger value="super-admin" className="gap-2">
              <Crown size={14} />
              Super Admin
            </TabsTrigger>
          )}
          <TabsTrigger value="contests" className="gap-2">
            <Trophy size={14} />
            Contests
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="gap-2">
            <CircleHelp size={14} />
            Quizzes
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="gap-2">
            <ShieldAlert size={14} />
            Monitoring
          </TabsTrigger>
        </TabsList>

        {isSuperAdmin && (
          <TabsContent value="super-admin" className="mt-5 space-y-4">
            <div className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent-foreground">
              Super Admin has power to create admin and delete admin.
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
            <form onSubmit={submitAdmin} className="glass-card border-primary/25 bg-gradient-to-br from-card to-primary/10 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <UserPlus size={16} className="text-primary" />
                  <h3 className="font-semibold">Create Admin Account</h3>
                </div>
                <Input placeholder="Full name" value={adminForm.name} onChange={(e) => setAdminForm((p) => ({ ...p, name: e.target.value }))} />
                <Input type="email" placeholder="Email" value={adminForm.email} onChange={(e) => setAdminForm((p) => ({ ...p, email: e.target.value }))} />
                <Input type="password" placeholder="Password (min 6)" value={adminForm.password} onChange={(e) => setAdminForm((p) => ({ ...p, password: e.target.value }))} />
                <Input placeholder="College / Organization (optional)" value={adminForm.college} onChange={(e) => setAdminForm((p) => ({ ...p, college: e.target.value }))} />
                <Input type="number" min={1} max={8760} placeholder="Access duration (hours)" value={adminForm.accessDurationHours} onChange={(e) => setAdminForm((p) => ({ ...p, accessDurationHours: e.target.value }))} />
                <Button disabled={savingAdmin} className="gap-2">
                  <Plus size={14} />
                  {savingAdmin ? "Creating..." : "Create Admin"}
                </Button>
              </form>

              <div className="glass-card border-accent/25 bg-gradient-to-br from-card to-accent/10 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-accent" />
                  <h3 className="font-semibold">Admin Directory</h3>
                </div>
                <div className="space-y-2 max-h-[320px] overflow-y-auto">
                  {admins.map((admin) => (
                    <div key={admin.id} className="rounded-md border border-border bg-muted/20 px-3 py-2">
                      <p className="font-medium text-sm">{admin.name}</p>
                      <p className="text-xs text-muted-foreground">{admin.email}</p>
                      {admin.adminExpiresAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Expires: {new Date(admin.adminExpiresAt).toLocaleString()}
                        </p>
                      )}
                      <div className="mt-1">
                        <Badge variant="outline">{admin.role}</Badge>
                      </div>
                      {normalizeRole(admin.role) === "ADMIN" && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="mt-2"
                          onClick={() => deleteAdmin(admin.id)}
                        >
                          Delete Admin
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        <TabsContent value="contests" className="mt-5 space-y-5">
          <div className="grid gap-5 xl:grid-cols-3">
            <form onSubmit={submitContest} className="glass-card xl:col-span-2 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Create New Contest</h2>
                <Badge variant="outline" className="border-primary/30 text-primary">Pro Builder</Badge>
              </div>
              <div className="space-y-3 rounded-lg border border-border/70 bg-background/40 p-4">
                <Input value={contestForm.title} onChange={(event) => setContestForm((p) => ({ ...p, title: event.target.value }))} placeholder="Contest title" />
                <Textarea value={contestForm.description} onChange={(event) => setContestForm((p) => ({ ...p, description: event.target.value }))} placeholder="Contest description" />
                <div className="grid gap-3 md:grid-cols-3">
                  <Input type="datetime-local" value={contestForm.startTime} onChange={(event) => setContestForm((p) => ({ ...p, startTime: event.target.value }))} />
                  <Input type="datetime-local" value={contestForm.endTime} onChange={(event) => setContestForm((p) => ({ ...p, endTime: event.target.value }))} />
                  <Input type="number" min={1} value={contestForm.durationMinutes} onChange={(event) => setContestForm((p) => ({ ...p, durationMinutes: event.target.value }))} placeholder="Duration (minutes)" />
                </div>
              </div>

              {contestForm.problems.map((problem, index) => (
                <div key={`problem-${index}`} className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Problem {index + 1}</p>
                    {contestForm.problems.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setContestForm((p) => ({ ...p, problems: p.problems.filter((_, i) => i !== index) }))}>
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                  <Input value={problem.title} onChange={(event) => setContestForm((p) => ({ ...p, problems: p.problems.map((item, i) => i === index ? { ...item, title: event.target.value } : item) }))} placeholder="Problem title" />
                  <Textarea value={problem.description} onChange={(event) => setContestForm((p) => ({ ...p, problems: p.problems.map((item, i) => i === index ? { ...item, description: event.target.value } : item) }))} placeholder="Problem description" />
                  <div className="grid gap-2 md:grid-cols-2">
                    <Input value={problem.sampleInput} onChange={(event) => setContestForm((p) => ({ ...p, problems: p.problems.map((item, i) => i === index ? { ...item, sampleInput: event.target.value } : item) }))} placeholder="Sample input (visible)" />
                    <Input value={problem.sampleOutput} onChange={(event) => setContestForm((p) => ({ ...p, problems: p.problems.map((item, i) => i === index ? { ...item, sampleOutput: event.target.value } : item) }))} placeholder="Sample output (visible)" />
                  </div>
                  <Textarea value={problem.hiddenTestCases} onChange={(event) => setContestForm((p) => ({ ...p, problems: p.problems.map((item, i) => i === index ? { ...item, hiddenTestCases: event.target.value } : item) }))} placeholder="Hidden test cases (admin only)" />
                </div>
              ))}

              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" className="gap-2" onClick={() => setContestForm((p) => ({ ...p, problems: [...p.problems, makeProblem()] }))}>
                  <Plus size={14} /> Add Problem
                </Button>
                <Button size="sm" className="gap-2" disabled={savingContest}>
                  <Plus size={14} /> {savingContest ? "Creating..." : "Create Contest"}
                </Button>
              </div>
            </form>

            <div className="glass-card border-primary/25 bg-gradient-to-br from-card to-primary/10 p-4 space-y-2">
              <p className="text-sm font-semibold">Quick Summary</p>
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Upcoming</span><Badge variant="outline">{counts.UPCOMING}</Badge></div>
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Ongoing</span><Badge variant="outline">{counts.ONGOING}</Badge></div>
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Past</span><Badge variant="outline">{counts.PAST}</Badge></div>
            </div>
          </div>

          <div className="glass-card overflow-x-auto">
            <div className="border-b border-border p-4"><h3 className="font-semibold">Manage Existing Contests</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1360px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Title</th>
                    <th className="p-3 font-medium">Created By</th>
                    <th className="p-3 font-medium">Created On</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Start</th>
                    <th className="p-3 font-medium">End</th>
                    <th className="p-3 font-medium">Duration</th>
                    <th className="p-3 font-medium">Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedContests.map((contest) => (
                    <tr key={contest.id} className="border-b border-border/50 hover:bg-muted/20 align-top">
                      <td className="p-3 font-medium min-w-[220px]">
                        <Input
                          value={contestEdit[contest.id]?.title || ""}
                          onChange={(event) => setContestEdit((prev) => ({
                            ...prev,
                            [contest.id]: { ...prev[contest.id], title: event.target.value },
                          }))}
                        />
                      </td>
                      <td className="p-3 min-w-[200px]">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{contest.createdBy?.name || "--"}</p>
                          <p className="text-xs text-muted-foreground">
                            {contest.createdBy?.publicUserId || contest.createdBy?.email || "--"}
                          </p>
                          {contest.createdBy?.role && (
                            <Badge variant="outline" className="text-[10px]">{normalizeRole(contest.createdBy.role)}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3 min-w-[180px] text-xs text-muted-foreground">
                        {contest.createdAt ? new Date(contest.createdAt).toLocaleString() : "--"}
                      </td>
                      <td className="p-3"><Badge variant="outline" className={getContestTone(contest.status)}>{contest.status}</Badge></td>
                      <td className="p-3 min-w-[210px]">
                        <Input
                          type="datetime-local"
                          value={contestEdit[contest.id]?.startTime || ""}
                          onChange={(event) => setContestEdit((prev) => ({
                            ...prev,
                            [contest.id]: { ...prev[contest.id], startTime: event.target.value },
                          }))}
                        />
                      </td>
                      <td className="p-3 min-w-[210px]">
                        <Input
                          type="datetime-local"
                          value={contestEdit[contest.id]?.endTime || ""}
                          onChange={(event) => setContestEdit((prev) => ({
                            ...prev,
                            [contest.id]: { ...prev[contest.id], endTime: event.target.value },
                          }))}
                        />
                      </td>
                      <td className="p-3 min-w-[140px]">
                        <Input
                          type="number"
                          min={1}
                          value={contestEdit[contest.id]?.durationMinutes || ""}
                          onChange={(event) => setContestEdit((prev) => ({
                            ...prev,
                            [contest.id]: { ...prev[contest.id], durationMinutes: event.target.value },
                          }))}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex max-w-md flex-col gap-2">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={!!savingContestEdit[contest.id]}
                              onClick={() => saveContestChanges(contest.id)}
                            >
                              {savingContestEdit[contest.id] ? "Saving..." : "Save Changes"}
                            </Button>
                            <Button type="button" size="sm" variant="destructive" onClick={() => deleteContest(contest.id)}>Delete</Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="quizzes" className="mt-5 space-y-4">
          <form onSubmit={submitQuiz} className="glass-card border-primary/20 bg-gradient-to-br from-card to-primary/10 p-5 space-y-3">
            <h3 className="font-semibold">Create Quiz</h3>
            <Input placeholder="Quiz title" value={quizForm.title} onChange={(e) => setQuizForm((p) => ({ ...p, title: e.target.value }))} />
            <Textarea placeholder="Quiz description" value={quizForm.description} onChange={(e) => setQuizForm((p) => ({ ...p, description: e.target.value }))} />
            <div className="grid gap-2 md:grid-cols-3">
              <Input type="datetime-local" value={quizForm.startTime} onChange={(e) => setQuizForm((p) => ({ ...p, startTime: e.target.value }))} />
              <Input type="datetime-local" value={quizForm.endTime} onChange={(e) => setQuizForm((p) => ({ ...p, endTime: e.target.value }))} />
              <Input type="number" min={1} value={quizForm.durationMinutes} onChange={(e) => setQuizForm((p) => ({ ...p, durationMinutes: e.target.value }))} placeholder="Duration (minutes)" />
            </div>
            {quizForm.questions.map((question, questionIndex) => (
              <div key={`quiz-question-${questionIndex}`} className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Question {questionIndex + 1}
                  </p>
                  {quizForm.questions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setQuizForm((p) => ({
                        ...p,
                        questions: p.questions.filter((_, i) => i !== questionIndex),
                      }))}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <Input
                    placeholder="Question"
                    value={question.text}
                    onChange={(e) => setQuizForm((p) => ({
                      ...p,
                      questions: p.questions.map((item, i) => (
                        i === questionIndex ? { ...item, text: e.target.value } : item
                      )),
                    }))}
                  />
                  <Input
                    type="number"
                    min={1}
                    placeholder="Points"
                    value={question.points}
                    onChange={(e) => setQuizForm((p) => ({
                      ...p,
                      questions: p.questions.map((item, i) => (
                        i === questionIndex ? { ...item, points: e.target.value } : item
                      )),
                    }))}
                  />
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  {question.options.map((option, optionIndex) => (
                    <div key={`q-${questionIndex}-opt-${optionIndex}`} className="flex items-center gap-2">
                      <Input
                        placeholder={`Option ${optionIndex + 1}`}
                        value={option.text}
                        onChange={(e) => setQuizForm((p) => ({
                          ...p,
                          questions: p.questions.map((item, i) => (
                            i === questionIndex
                              ? {
                                ...item,
                                options: item.options.map((opt, oi) => (
                                  oi === optionIndex ? { ...opt, text: e.target.value } : opt
                                )),
                              }
                              : item
                          )),
                        }))}
                      />
                      <Button
                        type="button"
                        variant={option.isCorrect ? "default" : "outline"}
                        size="sm"
                        onClick={() => setQuizForm((p) => ({
                          ...p,
                          questions: p.questions.map((item, i) => (
                            i === questionIndex
                              ? {
                                ...item,
                                options: item.options.map((opt, oi) => ({
                                  ...opt,
                                  isCorrect: oi === optionIndex,
                                })),
                              }
                              : item
                          )),
                        }))}
                      >
                        Correct
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="gap-2"
                onClick={() => setQuizForm((p) => ({ ...p, questions: [...p.questions, makeQuizQuestion()] }))}
              >
                <Plus size={14} /> Add Question
              </Button>
              <Button disabled={savingQuiz} className="gap-2">
                <Plus size={14} />{savingQuiz ? "Creating..." : "Create Quiz"}
              </Button>
            </div>
          </form>

          <div className="glass-card overflow-x-auto">
            <div className="border-b border-border p-4"><h3 className="font-semibold">Quiz Catalog</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1440px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Title</th>
                    <th className="p-3 font-medium">Created By</th>
                    <th className="p-3 font-medium">Created On</th>
                    <th className="p-3 font-medium">Questions</th>
                    <th className="p-3 font-medium">Duration</th>
                    <th className="p-3 font-medium">Start</th>
                    <th className="p-3 font-medium">End</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedQuizzes.map((quiz) => (
                    <tr key={quiz.id} className="border-b border-border/50 hover:bg-muted/20 align-top">
                      <td className="p-3 min-w-[220px]">
                        <Input
                          value={quizEdit[quiz.id]?.title || ""}
                          onChange={(event) => setQuizEdit((prev) => ({
                            ...prev,
                            [quiz.id]: { ...prev[quiz.id], title: event.target.value },
                          }))}
                        />
                      </td>
                      <td className="p-3 min-w-[200px]">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{quiz.createdBy?.name || "--"}</p>
                          <p className="text-xs text-muted-foreground">
                            {quiz.createdBy?.publicUserId || quiz.createdBy?.email || "--"}
                          </p>
                          {quiz.createdBy?.role && (
                            <Badge variant="outline" className="text-[10px]">{normalizeRole(quiz.createdBy.role)}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3 min-w-[180px] text-xs text-muted-foreground">
                        {quiz.createdAt ? new Date(quiz.createdAt).toLocaleString() : "--"}
                      </td>
                      <td className="p-3 text-muted-foreground">{quiz.questions.length}</td>
                      <td className="p-3 min-w-[120px]">
                        <Input
                          type="number"
                          min={1}
                          value={quizEdit[quiz.id]?.durationMinutes || ""}
                          onChange={(event) => setQuizEdit((prev) => ({
                            ...prev,
                            [quiz.id]: { ...prev[quiz.id], durationMinutes: event.target.value },
                          }))}
                        />
                      </td>
                      <td className="p-3 min-w-[210px]">
                        <Input
                          type="datetime-local"
                          value={quizEdit[quiz.id]?.startTime || ""}
                          onChange={(event) => setQuizEdit((prev) => ({
                            ...prev,
                            [quiz.id]: { ...prev[quiz.id], startTime: event.target.value },
                          }))}
                        />
                      </td>
                      <td className="p-3 min-w-[210px]">
                        <Input
                          type="datetime-local"
                          value={quizEdit[quiz.id]?.endTime || ""}
                          onChange={(event) => setQuizEdit((prev) => ({
                            ...prev,
                            [quiz.id]: { ...prev[quiz.id], endTime: event.target.value },
                          }))}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={!!savingQuizEdit[quiz.id]}
                            onClick={() => saveQuizChanges(quiz.id)}
                          >
                            {savingQuizEdit[quiz.id] ? "Saving..." : "Save Changes"}
                          </Button>
                          <Button type="button" size="sm" variant="destructive" onClick={() => deleteQuiz(quiz.id)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="mt-5 space-y-4">
          <div className="glass-card p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Admin Monitoring Tools</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Contest, quiz, integrity and suspicious activity controls are available only inside admin panel.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Link to={toScopedHref("/admin/integrity")} className="glass-card p-4 transition-all hover:border-primary/40 hover:-translate-y-0.5">
              <div className="mb-2 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <p className="font-semibold">Integrity Monitor</p>
              </div>
              <p className="text-sm text-muted-foreground">Track live risk and cheating signal summaries.</p>
            </Link>

            <Link to={toScopedHref("/admin/review-flags")} className="glass-card p-4 transition-all hover:border-primary/40 hover:-translate-y-0.5">
              <div className="mb-2 flex items-center gap-2">
                <ScanSearch className="h-4 w-4 text-primary" />
                <p className="font-semibold">Review Flags</p>
              </div>
              <p className="text-sm text-muted-foreground">Inspect flagged submissions and review actions.</p>
            </Link>

            <Link to={toScopedHref("/admin/suspicious")} className="glass-card p-4 transition-all hover:border-primary/40 hover:-translate-y-0.5">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <p className="font-semibold">Suspicious Users</p>
              </div>
              <p className="text-sm text-muted-foreground">Audit user-level anomalies and suspicious behavior.</p>
            </Link>

            <Link to={toScopedHref("/backend-health")} className="glass-card p-4 transition-all hover:border-primary/40 hover:-translate-y-0.5">
              <div className="mb-2 flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                <p className="font-semibold">System Health</p>
              </div>
              <p className="text-sm text-muted-foreground">Check backend connectivity and service health.</p>
            </Link>
          </div>

          <LiveChatAdminPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
