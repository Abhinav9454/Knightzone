import { useCallback, useMemo, useState } from "react";
import { BarChart3, Brain, CheckSquare, ClipboardCopy, FileText, ListChecks, Network, Rocket, ShieldCheck, Sparkles, Target, Wand2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MetricTile } from "./components/MetricTile";
import { SectionBlock } from "./components/SectionBlock";
import {
  aiModules,
  companyTrackOptions,
  computeGeneratedPlan,
  funnelSteps,
  geoFormatOptions,
  growthLoops,
  infraStack,
  kpiTargets,
  pricingTiers,
  resumeFormats,
  revenueStreams,
  roadmap,
  secretSauce,
  templateCategories,
} from "./data/blueprint";
import type { QuickQuizInput } from "./types";

const defaultQuiz: QuickQuizInput = {
  fullName: "",
  targetRole: "software engineer",
  yearsExperience: 2,
  companyTrack: "faang",
  geoFormat: "india",
};

type ResumeExperienceEntry = {
  role: string;
  company: string;
  duration: string;
  highlights: string[];
};

type ResumeProjectEntry = {
  name: string;
  stack: string;
  impact: string;
};

type ResumeEducationEntry = {
  degree: string;
  institute: string;
  year: string;
};

type ResumeDraft = {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string;
  targetJobDescription: string;
  experience: ResumeExperienceEntry[];
  projects: ResumeProjectEntry[];
  education: ResumeEducationEntry[];
};

type ResumeTone = "impact" | "balanced" | "technical";

const defaultDraft: ResumeDraft = {
  fullName: "",
  headline: "Software Engineer | Problem Solving | System Design",
  email: "you@example.com",
  phone: "+91-9876543210",
  location: "Bengaluru, India",
  summary:
    "Engineer focused on scalable backend systems, low-latency APIs, and product impact. Delivered features with measurable reliability and performance improvements.",
  skills: "Java, Spring Boot, React, TypeScript, MySQL, Redis, RabbitMQ, Docker, AWS",
  targetJobDescription:
    "Looking for a software engineer with distributed systems experience, API design, cloud deployment, and cross-functional ownership.",
  experience: [
    {
      role: "Software Engineer",
      company: "Product Company",
      duration: "2023 - Present",
      highlights: [
        "Built async submission pipeline and reduced average evaluation latency.",
        "Implemented service-level monitoring and alerting for production incidents.",
        "Improved database query performance for leaderboard and submission views.",
      ],
    },
    {
      role: "Associate Engineer",
      company: "Tech Startup",
      duration: "2021 - 2023",
      highlights: [
        "Delivered full-stack modules with authentication and role-based access.",
        "Automated CI/CD checks for safer releases and fewer regressions.",
      ],
    },
  ],
  projects: [
    {
      name: "Coding Contest Platform",
      stack: "React, Spring Boot, MySQL, Docker",
      impact: "Served end-to-end contest workflows with realtime submission updates.",
    },
    {
      name: "Resume Intelligence Tool",
      stack: "TypeScript, Node.js, OpenAI, Postgres",
      impact: "Generated ATS-ready bullet points and role-specific resume variants.",
    },
  ],
  education: [
    {
      degree: "B.Tech in Computer Science",
      institute: "Your University",
      year: "2021",
    },
  ],
};

const splitLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const toCommaList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const toStarBullet = (line: string, role: string) => {
  const normalized = line.replace(/^[-*•\s]+/, "").trim();
  if (!normalized) return "";
  return `Situation/Task (${role || "role"}): handled critical scope. Action: ${normalized}. Result: delivered measurable impact.`;
};

const buildPlainResumeText = (draft: ResumeDraft, resolvedName: string, skills: string[]) => {
  const lines: string[] = [];
  lines.push(resolvedName);
  lines.push(draft.headline);
  lines.push([draft.email, draft.phone, draft.location].filter(Boolean).join(" | "));
  lines.push("");
  lines.push("SUMMARY");
  lines.push(draft.summary);
  lines.push("");
  lines.push("SKILLS");
  lines.push(skills.join(", "));
  lines.push("");
  lines.push("EXPERIENCE");
  draft.experience.forEach((item) => {
    lines.push(`${item.role} | ${item.company} | ${item.duration}`);
    item.highlights.forEach((highlight) => lines.push(`- ${highlight}`));
  });
  lines.push("");
  lines.push("PROJECTS");
  draft.projects.forEach((item) => {
    lines.push(`${item.name} | ${item.stack}`);
    lines.push(`- ${item.impact}`);
  });
  lines.push("");
  lines.push("EDUCATION");
  draft.education.forEach((item) => {
    lines.push(`${item.degree} | ${item.institute} | ${item.year}`);
  });
  return lines.join("\n");
};

export function ResumeCareerOSPage() {
  const [quiz, setQuiz] = useState<QuickQuizInput>(defaultQuiz);
  const [draft, setDraft] = useState<ResumeDraft>(defaultDraft);
  const [selectedFormatId, setSelectedFormatId] = useState<string>("text");
  const [resumeTone, setResumeTone] = useState<ResumeTone>("impact");

  const plan = useMemo(() => computeGeneratedPlan(quiz), [quiz]);

  const updateQuiz = <K extends keyof QuickQuizInput>(key: K, value: QuickQuizInput[K]) => {
    setQuiz((prev) => ({ ...prev, [key]: value }));
  };

  const updateDraft = <K extends keyof ResumeDraft>(key: K, value: ResumeDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const updateExperience = <K extends keyof ResumeExperienceEntry>(index: number, key: K, value: ResumeExperienceEntry[K]) => {
    setDraft((prev) => {
      const next = [...prev.experience];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, experience: next };
    });
  };

  const updateProject = <K extends keyof ResumeProjectEntry>(index: number, key: K, value: ResumeProjectEntry[K]) => {
    setDraft((prev) => {
      const next = [...prev.projects];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, projects: next };
    });
  };

  const updateEducation = <K extends keyof ResumeEducationEntry>(index: number, key: K, value: ResumeEducationEntry[K]) => {
    setDraft((prev) => {
      const next = [...prev.education];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, education: next };
    });
  };

  const resolvedName = useMemo(() => {
    return draft.fullName.trim() || quiz.fullName.trim() || "Candidate Name";
  }, [draft.fullName, quiz.fullName]);

  const skillsList = useMemo(() => toCommaList(draft.skills), [draft.skills]);

  const completenessScore = useMemo(() => {
    const checks = [
      resolvedName,
      draft.headline,
      draft.summary,
      draft.email,
      skillsList.length > 0 ? "ok" : "",
      draft.experience[0]?.role || "",
      draft.experience[0]?.company || "",
      draft.experience[0]?.highlights?.[0] || "",
      draft.projects[0]?.name || "",
      draft.education[0]?.degree || "",
    ];

    const filled = checks.filter((value) => String(value).trim().length > 0).length;
    return Math.round((filled / checks.length) * 100);
  }, [resolvedName, draft, skillsList]);

  const jdKeywords = useMemo(() => {
    const tokens = draft.targetJobDescription.toLowerCase().match(/[a-z][a-z0-9+.#-]{2,}/g) || [];
    const filtered = tokens.filter((token) => token.length >= 4);
    return Array.from(new Set(filtered)).slice(0, 14);
  }, [draft.targetJobDescription]);

  const resumeCorpus = useMemo(() => {
    return [
      resolvedName,
      draft.headline,
      draft.summary,
      draft.skills,
      draft.experience.map((item) => `${item.role} ${item.company} ${item.highlights.join(" ")}`).join(" "),
      draft.projects.map((item) => `${item.name} ${item.stack} ${item.impact}`).join(" "),
    ]
      .join(" ")
      .toLowerCase();
  }, [resolvedName, draft]);

  const matchedKeywords = useMemo(() => {
    return jdKeywords.filter((keyword) => resumeCorpus.includes(keyword));
  }, [jdKeywords, resumeCorpus]);

  const keywordCoverage = jdKeywords.length > 0
    ? Math.round((matchedKeywords.length / jdKeywords.length) * 100)
    : 0;
  const missingKeywords = jdKeywords.filter((keyword) => !matchedKeywords.includes(keyword)).slice(0, 8);

  const liveAtsScore = Math.round((plan.atsScore * 0.45) + (completenessScore * 0.35) + (keywordCoverage * 0.2));
  const selectedFormat = useMemo(
    () => resumeFormats.find((item) => item.id === selectedFormatId) ?? resumeFormats[0],
    [selectedFormatId],
  );

  const toneDescriptor = useMemo(() => {
    if (resumeTone === "technical") {
      return "architecture depth, scale, and engineering trade-offs";
    }
    if (resumeTone === "balanced") {
      return "clear impact plus collaboration and execution maturity";
    }
    return "quantified business impact with ownership-first language";
  }, [resumeTone]);

  const sectionChecks = useMemo(() => {
    const checks = [
      { label: "Name and headline", done: Boolean(resolvedName && draft.headline.trim()) },
      { label: "Summary present", done: draft.summary.trim().length > 50 },
      { label: "Core skills listed", done: skillsList.length >= 6 },
      {
        label: "Experience with achievements",
        done: draft.experience.some((item) => item.highlights.length >= 2),
      },
      { label: "At least one project", done: draft.projects.some((item) => item.name.trim() && item.impact.trim()) },
      { label: "Education section", done: draft.education.some((item) => item.degree.trim() && item.institute.trim()) },
      { label: "Job description mapped", done: jdKeywords.length >= 6 },
    ];
    return checks;
  }, [draft, jdKeywords.length, resolvedName, skillsList.length]);

  const sectionCompletionScore = useMemo(() => {
    const done = sectionChecks.filter((item) => item.done).length;
    return Math.round((done / sectionChecks.length) * 100);
  }, [sectionChecks]);

  const readinessScore = useMemo(() => {
    return Math.round((liveAtsScore * 0.55) + (sectionCompletionScore * 0.45));
  }, [liveAtsScore, sectionCompletionScore]);

  const executionChecklist = useMemo(() => {
    const updates: string[] = [];
    if (missingKeywords.length > 0) {
      updates.push(`Inject missing JD keywords: ${missingKeywords.slice(0, 3).join(", ")}`);
    }
    if (skillsList.length < 8) {
      updates.push("Expand skills section to at least 8 relevant role keywords.");
    }
    if (!draft.experience.some((item) => item.highlights.some((line) => /\d/.test(line)))) {
      updates.push("Add measurable numbers in experience bullets (%, ms, users, revenue, etc).");
    }
    if (!draft.projects.some((item) => item.impact.trim().length >= 60)) {
      updates.push("Strengthen one project with problem-action-result impact narrative.");
    }
    if (draft.summary.trim().length < 120) {
      updates.push("Make summary sharper with role-fit and scope ownership in 3-4 lines.");
    }
    if (updates.length === 0) {
      updates.push("Resume baseline strong. Create one company-specific variant for higher conversion.");
    }
    return updates.slice(0, 5);
  }, [draft.experience, draft.projects, draft.summary, missingKeywords, skillsList.length]);

  const optimizedHeadline = useMemo(() => {
    const role = quiz.targetRole.trim() || "Software Engineer";
    return `${role} | ${toneDescriptor} | ${selectedFormat?.label || "Text Resume"} Ready`;
  }, [quiz.targetRole, selectedFormat, toneDescriptor]);

  const handleAutoEnhanceSummary = useCallback(() => {
    const primarySkill = skillsList[0] || "problem solving";
    const enhanced = [
      `${resolvedName} is a ${quiz.targetRole} profile aligned for ${quiz.companyTrack.toUpperCase()} hiring track.`,
      `Strong hands-on ownership across ${primarySkill}, system reliability, and delivery against business KPIs.`,
      `Currently positioned for ${plan.nextMoves[0] || "next-level engineering ownership"} with ${quiz.geoFormat.toUpperCase()} resume formatting standards.`,
    ].join(" ");

    setDraft((prev) => ({ ...prev, summary: enhanced }));
    toast.success("Summary upgraded for target role and company track.");
  }, [plan.nextMoves, quiz.companyTrack, quiz.geoFormat, quiz.targetRole, resolvedName, skillsList]);

  const handleStarUpgrade = useCallback(() => {
    setDraft((prev) => ({
      ...prev,
      experience: prev.experience.map((item) => ({
        ...item,
        highlights: item.highlights
          .map((line) => toStarBullet(line, item.role))
          .filter(Boolean),
      })),
    }));
    toast.success("Experience bullets converted to STAR-style format.");
  }, []);

  const handleCopyResume = useCallback(async () => {
    const payload = buildPlainResumeText(draft, resolvedName, skillsList);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
        toast.success("Resume draft copied to clipboard.");
        return;
      }
      toast.error("Clipboard API not available in this browser.");
    } catch {
      toast.error("Failed to copy resume text.");
    }
  }, [draft, resolvedName, skillsList]);

  const handleApplyHeadline = useCallback(() => {
    setDraft((prev) => ({ ...prev, headline: optimizedHeadline }));
    toast.success("Optimized headline applied.");
  }, [optimizedHeadline]);

  return (
    <div className="space-y-6">
      <section className="dashboard-hero rounded-2xl border border-border/75 p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <span className="hero-chip mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              AI Career Operating System
            </span>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">
              Resume Builder 2.0 - Hyper Personalized Career Platform
            </h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Resume se aage badhkar complete career transformation layer: ATS intelligence, prediction engine,
              template marketplace, growth loops, and monetization architecture.
            </p>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Core Mission</p>
            <p className="mt-1 text-sm font-semibold">24x7 personal career coach for unlimited growth</p>
          </div>
        </div>
      </section>

      <SectionBlock
        title="Quick Quiz and AI Blueprint"
        description="Role, experience, company track, and geo format ke base par platform personalized strategy generate karta hai."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input
              value={quiz.fullName}
              onChange={(event) => updateQuiz("fullName", event.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label>Target Role</Label>
            <Input
              value={quiz.targetRole}
              onChange={(event) => updateQuiz("targetRole", event.target.value)}
              placeholder="software engineer"
            />
          </div>
          <div className="space-y-2">
            <Label>Years of Experience</Label>
            <Input
              type="number"
              min={0}
              max={25}
              value={quiz.yearsExperience}
              onChange={(event) => updateQuiz("yearsExperience", Number(event.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>Target Company Track</Label>
            <Select
              value={quiz.companyTrack}
              onValueChange={(value) => updateQuiz("companyTrack", value as QuickQuizInput["companyTrack"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {companyTrackOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Resume Geo Format</Label>
            <Select
              value={quiz.geoFormat}
              onValueChange={(value) => updateQuiz("geoFormat", value as QuickQuizInput["geoFormat"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {geoFormatOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionBlock>

      <SectionBlock
        title="Live Resume Studio"
        description="Editable resume draft + real-time preview + ATS gap finder. Yahan se actual resume output improve hoga, sirf concept nahi."
      >
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Candidate Name</Label>
                <Input
                  value={draft.fullName}
                  onChange={(event) => updateDraft("fullName", event.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Headline</Label>
                <Input
                  value={draft.headline}
                  onChange={(event) => updateDraft("headline", event.target.value)}
                  placeholder="Role + value proposition"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={draft.email}
                  onChange={(event) => updateDraft("email", event.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={draft.phone}
                  onChange={(event) => updateDraft("phone", event.target.value)}
                  placeholder="+91-XXXXXXXXXX"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Location</Label>
                <Input
                  value={draft.location}
                  onChange={(event) => updateDraft("location", event.target.value)}
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Professional Summary</Label>
              <Textarea
                value={draft.summary}
                onChange={(event) => updateDraft("summary", event.target.value)}
                className="min-h-[110px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Skills (comma separated)</Label>
              <Textarea
                value={draft.skills}
                onChange={(event) => updateDraft("skills", event.target.value)}
                className="min-h-[85px]"
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold">Experience</p>
              {draft.experience.map((item, index) => (
                <article key={`experience-${index}`} className="rounded-lg border border-border/70 bg-card p-3">
                  <div className="grid gap-2 md:grid-cols-3">
                    <Input
                      value={item.role}
                      onChange={(event) => updateExperience(index, "role", event.target.value)}
                      placeholder="Role"
                    />
                    <Input
                      value={item.company}
                      onChange={(event) => updateExperience(index, "company", event.target.value)}
                      placeholder="Company"
                    />
                    <Input
                      value={item.duration}
                      onChange={(event) => updateExperience(index, "duration", event.target.value)}
                      placeholder="Duration"
                    />
                  </div>
                  <Textarea
                    value={item.highlights.join("\n")}
                    onChange={(event) => updateExperience(index, "highlights", splitLines(event.target.value))}
                    className="mt-2 min-h-[95px]"
                    placeholder="One achievement per line"
                  />
                </article>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold">Projects</p>
              {draft.projects.map((item, index) => (
                <article key={`project-${index}`} className="rounded-lg border border-border/70 bg-card p-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <Input
                      value={item.name}
                      onChange={(event) => updateProject(index, "name", event.target.value)}
                      placeholder="Project name"
                    />
                    <Input
                      value={item.stack}
                      onChange={(event) => updateProject(index, "stack", event.target.value)}
                      placeholder="Tech stack"
                    />
                  </div>
                  <Textarea
                    value={item.impact}
                    onChange={(event) => updateProject(index, "impact", event.target.value)}
                    className="mt-2 min-h-[75px]"
                    placeholder="Impact statement"
                  />
                </article>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold">Education</p>
              {draft.education.map((item, index) => (
                <article key={`education-${index}`} className="grid gap-2 rounded-lg border border-border/70 bg-card p-3 md:grid-cols-3">
                  <Input
                    value={item.degree}
                    onChange={(event) => updateEducation(index, "degree", event.target.value)}
                    placeholder="Degree"
                  />
                  <Input
                    value={item.institute}
                    onChange={(event) => updateEducation(index, "institute", event.target.value)}
                    placeholder="Institute"
                  />
                  <Input
                    value={item.year}
                    onChange={(event) => updateEducation(index, "year", event.target.value)}
                    placeholder="Year"
                  />
                </article>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Target Job Description (for keyword coverage)</Label>
              <Textarea
                value={draft.targetJobDescription}
                onChange={(event) => updateDraft("targetJobDescription", event.target.value)}
                className="min-h-[95px]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" className="gap-2" onClick={handleAutoEnhanceSummary}>
                <Wand2 className="h-4 w-4" />
                Auto-Enhance Summary
              </Button>
              <Button type="button" size="sm" variant="outline" className="gap-2" onClick={handleStarUpgrade}>
                <Sparkles className="h-4 w-4" />
                STAR Bullet Upgrade
              </Button>
              <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => void handleCopyResume()}>
                <ClipboardCopy className="h-4 w-4" />
                Copy Resume Text
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <article className="rounded-xl border border-border/70 bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-black">{resolvedName}</p>
                  <p className="text-sm text-muted-foreground">{draft.headline}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[draft.email, draft.phone, draft.location].filter(Boolean).join(" | ")}
                  </p>
                </div>
                <Badge variant="outline" className="gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Live Preview
                </Badge>
              </div>

              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Summary</p>
                  <p className="mt-1">{draft.summary}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Skills</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {skillsList.map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Experience</p>
                  <div className="mt-2 space-y-3">
                    {draft.experience.map((item, index) => (
                      <article key={`preview-exp-${index}`}>
                        <p className="font-semibold">
                          {item.role} | {item.company}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.duration}</p>
                        <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                          {item.highlights.map((highlight, highlightIndex) => (
                            <li key={`exp-line-${index}-${highlightIndex}`}>- {highlight}</li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Projects</p>
                  <div className="mt-2 space-y-2">
                    {draft.projects.map((item, index) => (
                      <article key={`preview-project-${index}`}>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.stack}</p>
                        <p className="text-sm text-muted-foreground">- {item.impact}</p>
                      </article>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Education</p>
                  <div className="mt-2 space-y-1">
                    {draft.education.map((item, index) => (
                      <p key={`preview-education-${index}`} className="text-sm text-muted-foreground">
                        {item.degree} | {item.institute} | {item.year}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-border/70 bg-card p-4">
              <p className="text-sm font-semibold">ATS Gap Finder</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <MetricTile
                  label="Live ATS"
                  value={`${liveAtsScore}/100`}
                  tone={liveAtsScore >= 75 ? "success" : "warning"}
                />
                <MetricTile
                  label="Completeness"
                  value={`${completenessScore}%`}
                  tone={completenessScore >= 80 ? "success" : "warning"}
                />
                <MetricTile
                  label="Keyword Match"
                  value={`${keywordCoverage}%`}
                  tone={keywordCoverage >= 60 ? "success" : "warning"}
                />
              </div>

              <div className="mt-4 rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between text-sm">
                  <p className="font-medium">Target JD Coverage</p>
                  <span className="text-xs text-muted-foreground">
                    {matchedKeywords.length}/{jdKeywords.length || 0} keywords matched
                  </span>
                </div>
                <Progress value={keywordCoverage} className="mt-2 h-2" />
                {jdKeywords.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Job description paste karoge to missing keyword suggestions automatically dikhenge.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Matched</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {matchedKeywords.map((keyword) => (
                          <Badge key={`match-${keyword}`} className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                            <ShieldCheck className="h-3 w-3" />
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {missingKeywords.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Missing</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {missingKeywords.map((keyword) => (
                            <Badge key={`missing-${keyword}`} variant="outline">{keyword}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-3 rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                <p className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Recommendation: keep summary concise, quantify impact, and ensure top missing JD keywords appear in experience/projects.
                </p>
              </div>
            </article>
          </div>
        </div>
      </SectionBlock>

      <SectionBlock
        title="Resume Builder 2.0 Execution Console"
        description="Format selection, tone strategy, readiness score, and actionable checklist in one place for faster resume upgrades."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-xl border border-border/70 bg-card p-4">
            <p className="text-sm font-semibold">Output Strategy</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Resume Format</Label>
                <Select value={selectedFormatId} onValueChange={setSelectedFormatId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resumeFormats.map((format) => (
                      <SelectItem key={format.id} value={format.id}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={resumeTone} onValueChange={(value) => setResumeTone(value as ResumeTone)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="impact">Impact</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-border/60 bg-muted/25 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Optimized Headline</p>
              <p className="mt-1 text-sm font-medium">{optimizedHeadline}</p>
              <p className="mt-1 text-xs text-muted-foreground">{selectedFormat?.description}</p>
              <Button type="button" size="sm" className="mt-3 gap-2" onClick={handleApplyHeadline}>
                <Target className="h-4 w-4" />
                Apply Headline
              </Button>
            </div>

            <div className="mt-4 rounded-lg border border-border/60 p-3">
              <div className="flex items-center justify-between text-sm">
                <p className="font-medium">Final Readiness Score</p>
                <span className="font-semibold">{readinessScore}/100</span>
              </div>
              <Progress value={readinessScore} className="mt-2 h-2" />
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">ATS {liveAtsScore}/100</Badge>
                <Badge variant="outline">Completion {sectionCompletionScore}%</Badge>
                <Badge variant="secondary">{selectedFormat?.output}</Badge>
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-border/70 bg-card p-4">
            <p className="text-sm font-semibold">Completion Checklist</p>
            <div className="mt-3 space-y-2">
              {sectionChecks.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                  <span className="text-sm">{item.label}</span>
                  {item.done ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                      <CheckSquare className="mr-1 h-3.5 w-3.5" />
                      Done
                    </Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-dashed border-border/60 p-3">
              <p className="flex items-center gap-1 text-sm font-medium">
                <ListChecks className="h-4 w-4" />
                Priority Update Queue
              </p>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                {executionChecklist.map((item) => (
                  <p key={item}>- {item}</p>
                ))}
              </div>
            </div>
          </article>
        </div>
      </SectionBlock>

      <SectionBlock
        title="Resume Intelligence Dashboard"
        description="Real-time scoring layer: ATS score, interview call probability, role match, and percentile ranking."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile label="ATS Composite Score" value={`${plan.atsScore}/100`} />
          <MetricTile label="Interview Probability" value={`${plan.interviewProbability}%`} tone="success" />
          <MetricTile label="Role Match Confidence" value={`${plan.roleMatch}%`} />
          <MetricTile label="Industry Percentile" value={`Top ${Math.max(1, 100 - plan.industryRankPercentile)}%`} tone="warning" />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border/70 bg-card p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Resume DNA</p>
            <p className="mt-1 text-lg font-semibold">{plan.resumeDna}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Unique signature for ATS optimization strategy and company-fit profiling.
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Promotion Timeline</p>
            <p className="mt-1 text-sm font-medium">{plan.promotionTimeline}</p>
            <p className="mt-2 text-xs text-muted-foreground">Salary projection: {plan.salaryProjection}</p>
            <Progress value={plan.atsScore} className="mt-3 h-2" />
          </div>
        </div>
      </SectionBlock>

      <SectionBlock
        title="Multi-format Resume Generation"
        description="Single profile se multiple output channels generate hote hain, hiring context ke hisab se."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {resumeFormats.map((format) => (
            <article key={format.id} className="rounded-xl border border-border/70 bg-card p-4">
              <p className="font-semibold">{format.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{format.description}</p>
              <Badge variant="outline" className="mt-3">{format.output}</Badge>
            </article>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        title="Revolutionary AI Features"
        description="Prediction, personalization, and recommendation engines ko modular AI modules ke form me structure kiya gaya hai."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {aiModules.map((module) => (
            <article key={module.id} className="rounded-xl border border-border/70 bg-card p-4">
              <p className="font-semibold">{module.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{module.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {module.signals.map((signal) => (
                  <Badge key={signal} variant="secondary">{signal}</Badge>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        title="Template Architecture and Matching"
        description="Industry-role-experience-track matrix ke basis par smart template recommendation generate hoti hai."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border/70 bg-card p-4">
            <p className="text-sm font-semibold">Recommended Templates</p>
            <div className="mt-3 space-y-3">
              {plan.recommendedTemplates.map((template) => (
                <article key={template.name} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{template.name}</p>
                    <Badge variant="outline">AI {template.aiScore}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {template.industry.join(", ")} | Roles: {template.roles.join(", ")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Features: {template.features.join(", ")}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-card p-4">
            <p className="text-sm font-semibold">Category Matrix</p>
            <div className="mt-3 space-y-3 text-sm">
              {templateCategories.map((category) => (
                <article key={category.category} className="rounded-lg border border-border/60 p-3">
                  <p className="font-medium">{category.category}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{category.subCategories}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{category.aiFeatures}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </SectionBlock>

      <SectionBlock
        title="Career Prediction and Interview Readiness"
        description="Profile intelligence se next moves, targeted formats, and interview prep pack auto-generated."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-xl border border-border/70 bg-card p-4 lg:col-span-1">
            <p className="text-sm font-semibold">Next Career Moves</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {plan.nextMoves.map((move) => (
                <li key={move}>- {move}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-xl border border-border/70 bg-card p-4 lg:col-span-1">
            <p className="text-sm font-semibold">Recommended Formats</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {plan.recommendedFormats.map((format) => (
                <Badge key={format.id} variant="outline">{format.label}</Badge>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Company-track specific output strategy to improve recruiter response.
            </p>
          </article>
          <article className="rounded-xl border border-border/70 bg-card p-4 lg:col-span-1">
            <p className="text-sm font-semibold">Interview Question Predictor</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {plan.interviewQuestions.map((question) => (
                <li key={question}>- {question}</li>
              ))}
            </ul>
          </article>
        </div>
      </SectionBlock>

      <SectionBlock
        title="User Experience Funnel and Monetization"
        description="Acquisition to retention flow aur multi-stream revenue model ko conversion-centric tarike se define kiya gaya hai."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-border/70 bg-card p-4">
            <p className="text-sm font-semibold">Conversion Funnel</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {funnelSteps.map((step) => (
                <li key={step.id}>{step.id}. {step.label}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-xl border border-border/70 bg-card p-4">
            <p className="text-sm font-semibold">Pricing and Revenue Layers</p>
            <div className="mt-2 space-y-3">
              {pricingTiers.map((tier) => (
                <div key={tier.name} className="rounded-lg border border-border/60 p-3">
                  <p className="font-medium">{tier.name} - {tier.price}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{tier.target}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{tier.includes.join(" | ")}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              {revenueStreams.map((stream) => (
                <p key={stream.title}>- {stream.title}: {stream.description}</p>
              ))}
            </div>
          </article>
        </div>
      </SectionBlock>

      <SectionBlock
        title="Scalability, Growth Loops, and Roadmap"
        description="Billion-user readiness architecture plus phased launch execution in one operational view."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-xl border border-border/70 bg-card p-4 lg:col-span-1">
            <p className="text-sm font-semibold">Infrastructure Stack</p>
            <div className="mt-2 space-y-3 text-sm">
              {infraStack.map((section) => (
                <div key={section.section}>
                  <p className="font-medium">{section.section}</p>
                  <p className="text-xs text-muted-foreground">{section.stack.join(" | ")}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-border/70 bg-card p-4 lg:col-span-1">
            <p className="text-sm font-semibold">Viral Growth Loops</p>
            <div className="mt-2 space-y-2 text-sm text-muted-foreground">
              {growthLoops.map((loop) => (
                <p key={loop.title}>- {loop.title}: {loop.flow}</p>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-border/70 bg-card p-4 lg:col-span-1">
            <p className="text-sm font-semibold">Execution Roadmap</p>
            <div className="mt-2 space-y-2 text-sm text-muted-foreground">
              {roadmap.map((item) => (
                <p key={item.phase}>
                  - {item.timeline} | {item.phase}: {item.goals.join(", ")}
                </p>
              ))}
            </div>
          </article>
        </div>
      </SectionBlock>

      <SectionBlock
        title="Competitive Moat and Action Plan"
        description="Differentiation features with execution checklist for product and engineering teams."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-border/70 bg-card p-4">
            <p className="text-sm font-semibold">Secret Sauce Stack</p>
            <div className="mt-2 space-y-2 text-sm text-muted-foreground">
              {secretSauce.map((item) => (
                <p key={item.title}>- {item.title}: {item.value}</p>
              ))}
            </div>
          </article>
          <article className="rounded-xl border border-border/70 bg-card p-4">
            <p className="text-sm font-semibold">Immediate Action Plan</p>
            <div className="mt-2 space-y-2 text-sm text-muted-foreground">
              {plan.actionPlan.map((action) => (
                <p key={action}>- {action}</p>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" className="gap-2"><Rocket className="h-4 w-4" />Start MVP Sprint</Button>
              <Button size="sm" variant="outline" className="gap-2"><Brain className="h-4 w-4" />Train AI Layer</Button>
              <Button size="sm" variant="outline" className="gap-2"><Network className="h-4 w-4" />Enable Marketplace</Button>
              <Button size="sm" variant="outline" className="gap-2"><BarChart3 className="h-4 w-4" />Track KPI Board</Button>
              <Button size="sm" variant="outline" className="gap-2"><ShieldCheck className="h-4 w-4" />Ship Compliance</Button>
            </div>
          </article>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {kpiTargets.map((kpi) => (
            <article key={kpi.horizon} className="rounded-xl border border-border/70 bg-card p-4">
              <p className="font-semibold">{kpi.horizon} KPI Targets</p>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                {kpi.targets.map((target) => (
                  <p key={target}>- {target}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionBlock>
    </div>
  );
}
