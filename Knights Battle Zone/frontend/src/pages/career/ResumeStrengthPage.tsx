import { useEffect, useMemo, useRef, useState } from "react";
import { resumeApi } from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  FileBadge2,
  FileText,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  XCircle,
} from "lucide-react";
import type { ResumeHardCheck, ResumeStrength } from "@/lib/types";

type ResumeApiError = {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
};

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_UPLOAD_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt"];

const clampScore = (value: number, min = 0, max = 100): number => Math.min(max, Math.max(min, value));

const getFileExtension = (fileName: string): string => {
  const lower = fileName.toLowerCase();
  const dot = lower.lastIndexOf(".");
  return dot >= 0 ? lower.slice(dot) : "";
};

const gradeFromScore = (score: number): string => {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  return "D";
};

const verdictFromScore = (score: number): string => {
  if (score >= 85) return "Strong for MNC shortlisting";
  if (score >= 70) return "Good base, upgrade impact";
  if (score >= 55) return "Borderline for screening";
  return "Needs major revision";
};

const ratingLabelFromPoints = (points: number): string => {
  if (points >= 9) return "Excellent";
  if (points >= 8) return "Very Good";
  if (points >= 7) return "Good";
  if (points >= 6) return "Average";
  return "Needs Improvement";
};

const scoreToneClass = (score: number): string => {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-destructive";
};

const scoreProgressClass = (score: number): string => {
  if (score >= 80) return "[&>div]:bg-success";
  if (score >= 60) return "[&>div]:bg-warning";
  return "[&>div]:bg-destructive";
};

const statusBadgeClass = (status: string): string => {
  if (status === "PASS") return "border-success/40 bg-success/10 text-success";
  if (status === "WARN") return "border-warning/40 bg-warning/10 text-warning";
  return "border-destructive/40 bg-destructive/10 text-destructive";
};

const severityBadgeClass = (severity: string): string => {
  if (severity === "CRITICAL") return "border-destructive/40 text-destructive";
  if (severity === "MAJOR") return "border-warning/40 text-warning";
  return "border-primary/30 text-primary";
};

const checkIcon = (status: string) => {
  if (status === "PASS") return <CheckCircle2 size={16} className="text-success" />;
  if (status === "WARN") return <AlertTriangle size={16} className="text-warning" />;
  return <XCircle size={16} className="text-destructive" />;
};

export default function ResumeStrengthPage() {
  const [strength, setStrength] = useState<ResumeStrength | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const sampleSnapshots = useMemo(() => {
    const pool = [
      {
        name: "Aarav Mehta",
        role: "Backend Engineer",
        highlight: "Reduced API response latency by 42% and improved service uptime to 99.95%.",
      },
      {
        name: "Riya Kapoor",
        role: "Frontend Developer",
        highlight: "Shipped an accessibility-first dashboard used by 12k+ monthly active users.",
      },
      {
        name: "Karan Singh",
        role: "Data Analyst",
        highlight: "Automated reporting workflow and cut weekly manual effort by 8 hours.",
      },
      {
        name: "Neha Sharma",
        role: "SDE Intern",
        highlight: "Implemented CI checks that reduced production bugs by 31% in one quarter.",
      },
      {
        name: "Dev Patel",
        role: "Cloud Engineer",
        highlight: "Optimized infra spend by 27% through autoscaling and resource right-sizing.",
      },
    ];
    return [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
  }, []);

  useEffect(() => {
    resumeApi
      .getStrength()
      .then((res) => setStrength(res.data))
      .catch(() => toast.error("Unable to load resume strength right now."))
      .finally(() => setLoading(false));
  }, []);

  const uploadResume = async (file?: File | null) => {
    if (!file) return;
    const fileExtension = getFileExtension(file.name);
    if (!ALLOWED_UPLOAD_EXTENSIONS.includes(fileExtension)) {
      toast.error("Invalid file type. Use PDF, DOC, DOCX, or TXT.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      toast.error("File is too large. Maximum allowed size is 5MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setUploading(true);
    try {
      const res = await resumeApi.upload(file);
      setStrength(res.data);
      toast.success(res.data.message || "Resume uploaded and validated.");
    } catch (error: unknown) {
      const apiError = error as ResumeApiError;
      const message =
        apiError.response?.data?.error ||
        apiError.response?.data?.message ||
        "Resume upload failed. Use PDF/DOC/DOCX/TXT up to 5MB.";
      toast.error(message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const hasAudit = Boolean(strength);
  const overallScore = hasAudit ? clampScore(Number(strength?.overallScore ?? 0)) : 0;
  const grade = hasAudit ? (strength?.grade ?? gradeFromScore(overallScore)) : "--";
  const verdict = hasAudit ? (strength?.verdict ?? verdictFromScore(overallScore)) : "Upload resume to get scoring insights";
  const benchmark = strength?.benchmark ?? "Upload resume for benchmark details";
  const breakdown = useMemo(() => strength?.breakdown ?? [], [strength?.breakdown]);
  const hardChecks = useMemo(() => strength?.hardChecks ?? [], [strength?.hardChecks]);
  const priorityActions = useMemo(() => strength?.priorityActions ?? [], [strength?.priorityActions]);
  const checkedAt = strength?.checkedAt ? new Date(strength.checkedAt).toLocaleString() : "Not available";
  const deepAnalysis = Boolean(strength?.deepAnalysis);
  const uploadedFileName = strength?.fileName ?? "No file";

  const atsScore = useMemo(() => {
    if (!hasAudit) return null;
    const atsBreakdownScore = breakdown.find((item) => {
      const category = item.category.toLowerCase();
      return category.includes("ats") || category.includes("readability") || category.includes("keyword");
    })?.score;
    if (typeof atsBreakdownScore === "number" && Number.isFinite(atsBreakdownScore)) {
      return clampScore(Math.round(atsBreakdownScore));
    }
    return overallScore;
  }, [breakdown, hasAudit, overallScore]);

  const pointsOutOf10 = hasAudit ? Math.round(overallScore) / 10 : null;
  const ratingOutOf5 = hasAudit ? Math.round((overallScore / 20) * 10) / 10 : null;
  const ratingLabel = hasAudit && pointsOutOf10 !== null ? ratingLabelFromPoints(pointsOutOf10) : "--";

  return (
    <div className="page-shell mx-auto max-w-6xl space-y-6">
      <section className="dashboard-hero overflow-hidden rounded-2xl border border-primary/20 p-6 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            <Badge className="hero-chip gap-2">
              <Sparkles size={14} />
              Hard Resume Audit
            </Badge>
            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">Resume Strength Studio</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Professional scoring for ATS readability, recruiter impact, and MNC screening readiness.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-success" />
                Strict validation pipeline
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileBadge2 size={13} className="text-primary" />
                Recruiter-focused scoring
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldAlert size={13} className="text-warning" />
                Critical issue detection
              </span>
            </div>
          </div>

          <div className="glass-card rounded-xl border-primary/25 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Overall Score</p>
            <div className="mt-3 flex items-end gap-3">
              <p className={`text-5xl font-black ${scoreToneClass(overallScore)}`}>{hasAudit ? overallScore : "--"}</p>
              <p className="pb-1 text-sm text-muted-foreground">/100</p>
            </div>
            <div className="mt-4 space-y-2">
              <Progress value={overallScore} className={`h-2.5 ${scoreProgressClass(overallScore)}`} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Grade: {grade}</span>
                <span>{deepAnalysis ? "Deep audit" : "File-level audit"}</span>
              </div>
            </div>
            <p className="mt-4 text-sm font-medium">{verdict}</p>
          </div>
        </div>
      </section>

      <section className="glass-card space-y-4 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Upload Resume for Hard Checking</h2>
            <p className="text-sm text-muted-foreground">
              PDF, DOC, DOCX, TXT only. Max size 5MB. Tiny or incomplete files are rejected.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => uploadResume(e.target.files?.[0] || null)}
            />
            <Button
              className="gap-2"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={14} />
              Upload Resume
            </Button>
          </div>
        </div>
        {strength?.validationNote && (
          <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
            {strength.validationNote}
          </div>
        )}
      </section>

      {!loading && !strength && (
        <div className="glass-card rounded-xl border-dashed p-6 text-sm text-muted-foreground">
          No resume audit yet. Upload a resume to generate professional-grade insights.
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">ATS</p>
          <p className={`mt-1 text-3xl font-black ${scoreToneClass(atsScore ?? 0)}`}>
            {atsScore !== null ? `${atsScore}/100` : "--"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Applicant tracking readability score</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Points (Out of 10)</p>
          <p className={`mt-1 text-3xl font-black ${scoreToneClass(overallScore)}`}>
            {pointsOutOf10 !== null ? `${pointsOutOf10.toFixed(1)}/10` : "--"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Normalized screening score</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Rating</p>
          <p className="mt-1 text-3xl font-black">{ratingLabel}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {ratingOutOf5 !== null ? `${ratingOutOf5.toFixed(1)}/5 recruiter rating` : "Upload resume to compute rating"}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Grade</p>
          <p className="mt-1 text-3xl font-black">{grade}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Benchmark</p>
          <p className="mt-1 text-sm font-medium">{benchmark}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Last Checked</p>
          <p className="mt-1 text-sm font-medium">{checkedAt}</p>
          <p className="mt-1 text-xs text-muted-foreground">File: {uploadedFileName}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            <h2 className="text-xl font-bold">Category Breakdown</h2>
          </div>
          {breakdown.length === 0 && !loading && (
            <div className="glass-card p-4 text-sm text-muted-foreground">
              Breakdown not available yet.
            </div>
          )}
          {breakdown.map((item) => (
            <article key={item.category} className="glass-card p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {item.score >= 75 ? (
                    <CheckCircle2 size={15} className="text-success" />
                  ) : item.score >= 55 ? (
                    <AlertTriangle size={15} className="text-warning" />
                  ) : (
                    <XCircle size={15} className="text-destructive" />
                  )}
                  <p className="font-semibold">{item.category}</p>
                </div>
                <p className={`font-mono text-sm font-bold ${scoreToneClass(item.score)}`}>{item.score}/100</p>
              </div>
              <Progress value={item.score} className={`mb-2 h-1.5 ${scoreProgressClass(item.score)}`} />
              <p className="text-xs text-muted-foreground">{item.suggestion}</p>
            </article>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" />
            <h2 className="text-xl font-bold">Hard Validation Results</h2>
          </div>
          {hardChecks.length === 0 && !loading && (
            <div className="glass-card p-4 text-sm text-muted-foreground">
              Upload resume to run strict ATS and recruiter checks.
            </div>
          )}
          {hardChecks.map((check: ResumeHardCheck) => (
            <article key={check.id} className="glass-card p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {checkIcon(check.status)}
                  <p className="font-semibold">{check.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${statusBadgeClass(check.status)}`}>
                    {check.status}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] ${severityBadgeClass(check.severity)}`}>
                    {check.severity}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{check.detail}</p>
              <p className="mt-2 text-xs font-medium">{check.action}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="text-lg font-bold">Priority Fixes</h2>
          <p className="mt-1 text-sm text-muted-foreground">Apply these to increase shortlist probability.</p>
          <div className="mt-4 space-y-2">
            {priorityActions.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">No immediate actions detected.</p>
            )}
            {priorityActions.map((action, index) => (
              <div key={`${action}-${index}`} className="rounded-lg border border-border/70 bg-muted/25 px-3 py-2 text-sm">
                <span className="mr-2 font-mono text-xs text-primary">{index + 1}.</span>
                {action}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="text-lg font-bold">Random Resume Snapshots</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sample style references with random profiles to guide stronger bullet writing.
          </p>
          <div className="mt-4 space-y-3">
            {sampleSnapshots.map((sample) => (
              <article key={sample.name} className="rounded-lg border border-border/75 bg-card p-3">
                <p className="text-sm font-semibold">{sample.name}</p>
                <p className="text-xs text-primary">{sample.role}</p>
                <p className="mt-2 text-xs text-muted-foreground">{sample.highlight}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
