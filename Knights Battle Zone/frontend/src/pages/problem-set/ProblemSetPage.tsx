import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { problemApi } from "@/lib/api";
import type { Problem, ProblemSetPageResponse, ProblemSetUpsertPayload } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminRole } from "@/lib/auth-role";
import { useRealtimeRefresh } from "@/lib/realtime";
import { getApiErrorMessage } from "@/lib/error";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Shield, Plus, Pencil, Trash2, BookOpenCheck, Eye } from "lucide-react";

type DifficultyFilter = "ALL" | "EASY" | "MEDIUM" | "HARD";

const DEFAULT_PAGE_SIZE = 20;

const DEFAULT_FORM: ProblemSetUpsertPayload = {
  title: "",
  description: "",
  difficulty: "EASY",
  inputFormat: "",
  outputFormat: "",
  sampleInput: "",
  sampleOutput: "",
  testCases: "",
  points: 120,
  timeLimitSeconds: 2,
};

export default function ProblemSetPage() {
  const location = useLocation();
  const { user } = useAuth();
  const admin = isAdminRole(user?.role);
  const isSimpleContext = location.pathname.startsWith("/simple");

  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("ALL");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [data, setData] = useState<ProblemSetPageResponse>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    page: 0,
    size: DEFAULT_PAGE_SIZE,
    difficulty: null,
    query: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [previewProblem, setPreviewProblem] = useState<Problem | null>(null);
  const [form, setForm] = useState<ProblemSetUpsertPayload>(DEFAULT_FORM);
  const errorToastShownRef = useRef(false);

  const loadPage = useCallback(async () => {
    try {
      const response = await problemApi.getProblemSetPage({
        page,
        size: pageSize,
        q: query.trim(),
        difficulty,
      });
      setData(response);
      errorToastShownRef.current = false;
      return true;
    } catch (error) {
      if (!errorToastShownRef.current) {
        toast.error(getApiErrorMessage(error, "Problem set load failed."));
        errorToastShownRef.current = true;
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [difficulty, page, pageSize, query]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  useRealtimeRefresh(loadPage, {
    intervalMs: 30000,
    scope: "contests",
    enabled: !editorOpen,
  });

  const fromIndex = useMemo(() => (data.totalElements === 0 ? 0 : data.page * data.size + 1), [data.page, data.size, data.totalElements]);
  const toIndex = useMemo(
    () => Math.min(data.totalElements, data.page * data.size + data.content.length),
    [data.content.length, data.page, data.size, data.totalElements],
  );

  const beginCreate = () => {
    setEditingProblem(null);
    setForm(DEFAULT_FORM);
    setEditorOpen(true);
  };

  const beginEdit = (problem: Problem) => {
    setEditingProblem(problem);
    setForm({
      title: problem.title || "",
      description: problem.description || "",
      difficulty: problem.difficulty,
      inputFormat: problem.inputFormat || "",
      outputFormat: problem.outputFormat || "",
      sampleInput: problem.sampleInput || "",
      sampleOutput: problem.sampleOutput || "",
      testCases: problem.testCases || "",
      points: Math.max(50, Math.min(1000, problem.points ?? 120)),
      timeLimitSeconds: Math.max(1, Math.min(10, problem.timeLimitSeconds ?? 2)),
    });
    setEditorOpen(true);
  };

  const resetEditor = () => {
    setEditorOpen(false);
    setEditingProblem(null);
    setForm(DEFAULT_FORM);
  };

  const handleSave = async () => {
    const payload: ProblemSetUpsertPayload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      inputFormat: form.inputFormat.trim(),
      outputFormat: form.outputFormat.trim(),
      sampleInput: form.sampleInput.trim(),
      sampleOutput: form.sampleOutput.trim(),
      testCases: form.testCases.trim(),
      points: Number(form.points),
      timeLimitSeconds: Number(form.timeLimitSeconds),
    };

    if (!payload.title || !payload.description || !payload.inputFormat || !payload.outputFormat || !payload.sampleInput || !payload.sampleOutput || !payload.testCases) {
      toast.error("All problem fields are required.");
      return;
    }

    setSaving(true);
    try {
      if (editingProblem) {
        await problemApi.update(editingProblem.id, payload);
        toast.success("Problem updated.");
      } else {
        await problemApi.create(payload);
        toast.success("Problem created.");
      }
      resetEditor();
      await loadPage();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save problem."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (problem: Problem) => {
    if (!window.confirm(`Delete "${problem.title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await problemApi.delete(problem.id);
      toast.success("Problem deleted.");
      await loadPage();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to delete problem."));
    }
  };

  const buildProblemLink = (problemId: number) => {
    const scopedBase = isSimpleContext ? "/simple/problem-set" : "/problem-set";
    return `${scopedBase}/${problemId}`;
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <section className="dashboard-hero surface-hover rounded-2xl border border-border/75 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="hero-chip mb-3">
              <BookOpenCheck className="h-3.5 w-3.5" />
              Coding Track
            </span>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">Problem Set</h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              Curated large coding set with progressive levels. Built for high-volume practice (50k+ sessions).
            </p>
          </div>
          {admin && (
            <Button type="button" className="gap-2" onClick={beginCreate}>
              <Plus size={14} />
              Create Problem
            </Button>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="metric-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Total Problems</p>
            <p className="mt-1 text-2xl font-bold">{data.totalElements}</p>
          </article>
          <article className="metric-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Current Page</p>
            <p className="mt-1 text-2xl font-bold">{data.page + 1}</p>
          </article>
          <article className="metric-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Page Size</p>
            <p className="mt-1 text-2xl font-bold">{data.size}</p>
          </article>
          <article className="metric-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Role Access</p>
            <p className="mt-1 text-sm font-bold">{admin ? "Admin CRUD Enabled" : "Read-only Learner"}</p>
          </article>
        </div>
      </section>

      <div className="content-panel surface-hover rounded-xl p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title or statement"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
              className="pl-11"
            />
          </div>
          <Select
            value={difficulty}
            onValueChange={(value) => {
              setDifficulty(value as DifficultyFilter);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Difficulty</SelectItem>
              <SelectItem value="EASY">Easy</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HARD">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(0);
            }}
          >
            <SelectTrigger className="w-full lg:w-40">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {editorOpen && admin && (
        <section className="content-panel rounded-xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">{editingProblem ? "Edit Problem" : "Create Problem"}</h2>
            <Badge variant="outline" className="gap-1">
              <Shield size={12} />
              Admin / Super Admin
            </Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Title" />
            <Select value={form.difficulty} onValueChange={(value) => setForm((prev) => ({ ...prev, difficulty: value as ProblemSetUpsertPayload["difficulty"] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Textarea className="mt-3 min-h-24" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Problem description" />
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Textarea value={form.inputFormat} onChange={(event) => setForm((prev) => ({ ...prev, inputFormat: event.target.value }))} placeholder="Input format" />
            <Textarea value={form.outputFormat} onChange={(event) => setForm((prev) => ({ ...prev, outputFormat: event.target.value }))} placeholder="Output format" />
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Textarea value={form.sampleInput} onChange={(event) => setForm((prev) => ({ ...prev, sampleInput: event.target.value }))} placeholder="Sample input" />
            <Textarea value={form.sampleOutput} onChange={(event) => setForm((prev) => ({ ...prev, sampleOutput: event.target.value }))} placeholder="Sample output" />
          </div>
          <Textarea className="mt-3 min-h-24 font-mono text-xs" value={form.testCases} onChange={(event) => setForm((prev) => ({ ...prev, testCases: event.target.value }))} placeholder='Hidden testcases JSON, example: [{"input":"2 3\\n","output":"5\\n"}]' />

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Input
              type="number"
              min={50}
              max={1000}
              value={form.points}
              onChange={(event) => setForm((prev) => ({ ...prev, points: Number(event.target.value) }))}
              placeholder="Points"
            />
            <Input
              type="number"
              min={1}
              max={10}
              value={form.timeLimitSeconds}
              onChange={(event) => setForm((prev) => ({ ...prev, timeLimitSeconds: Number(event.target.value) }))}
              placeholder="Time limit seconds"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editingProblem ? "Update Problem" : "Create Problem"}</Button>
            <Button type="button" variant="secondary" onClick={resetEditor} disabled={saving}>Cancel</Button>
          </div>
        </section>
      )}

      <section className="content-panel surface-hover rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {fromIndex}-{toIndex} of {data.totalElements}
          </p>
          <p className="hidden text-xs md:block">Page {data.page + 1} of {Math.max(1, data.totalPages)}</p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || page <= 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || page + 1 >= data.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {!loading && data.content.length === 0 && (
            <div className="rounded-lg border border-border p-5 text-center text-sm text-muted-foreground">
              No problems found for current filters.
            </div>
          )}

          {!loading && data.content.map((problem) => (
            <div key={problem.id} className="surface-hover rounded-lg border border-border/80 bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link to={buildProblemLink(problem.id)} className="text-base font-semibold hover:text-primary">
                    {problem.title}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{problem.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{problem.difficulty}</Badge>
                  <Badge variant="secondary">{problem.points ?? 120} pts</Badge>
                  <Badge variant="secondary">{problem.timeLimitSeconds ?? 2}s</Badge>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" className="gap-1" onClick={() => setPreviewProblem(problem)}>
                  <Eye size={13} />
                  Quick View
                </Button>
                <Button asChild type="button" variant="outline" size="sm">
                  <Link to={buildProblemLink(problem.id)}>Open Full Practice</Link>
                </Button>
              </div>

              {admin && (
                <div className="mt-3 flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => beginEdit(problem)}>
                    <Pencil size={13} />
                    Edit
                  </Button>
                  <Button type="button" variant="destructive" size="sm" className="gap-1" onClick={() => handleDelete(problem)}>
                    <Trash2 size={13} />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Dialog open={!!previewProblem} onOpenChange={(open) => !open && setPreviewProblem(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          {previewProblem && (
            <>
              <DialogHeader>
                <DialogTitle>{previewProblem.title}</DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{previewProblem.difficulty}</Badge>
                  <Badge variant="secondary">{previewProblem.points ?? 120} pts</Badge>
                  <Badge variant="secondary">{previewProblem.timeLimitSeconds ?? 2}s</Badge>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="mb-1 text-sm font-semibold">Description</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{previewProblem.description}</p>
                </div>

                {previewProblem.inputFormat && (
                  <div>
                    <h3 className="mb-1 text-sm font-semibold">Input Format</h3>
                    <p className="whitespace-pre-wrap text-muted-foreground">{previewProblem.inputFormat}</p>
                  </div>
                )}

                {previewProblem.outputFormat && (
                  <div>
                    <h3 className="mb-1 text-sm font-semibold">Output Format</h3>
                    <p className="whitespace-pre-wrap text-muted-foreground">{previewProblem.outputFormat}</p>
                  </div>
                )}

                {previewProblem.sampleInput && (
                  <div>
                    <h3 className="mb-1 text-sm font-semibold">Sample Input</h3>
                    <pre className="overflow-auto rounded border border-border bg-muted p-3 text-xs">{previewProblem.sampleInput}</pre>
                  </div>
                )}

                {previewProblem.sampleOutput && (
                  <div>
                    <h3 className="mb-1 text-sm font-semibold">Sample Output</h3>
                    <pre className="overflow-auto rounded border border-border bg-muted p-3 text-xs">{previewProblem.sampleOutput}</pre>
                  </div>
                )}

                <div className="pt-1">
                  <Button asChild size="sm">
                    <Link to={buildProblemLink(previewProblem.id)} onClick={() => setPreviewProblem(null)}>
                      Open Full Practice
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
