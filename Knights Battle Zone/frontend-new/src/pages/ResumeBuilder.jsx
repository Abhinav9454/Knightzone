import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Sparkles,
  Download,
  Printer,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Code2,
  User,
  ShieldCheck,
  ChevronRight,
  Eye,
  RotateCcw,
  ExternalLink,
  Award,
  Palette,
  Type,
  Layout,
  Share2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const TEMPLATE_CATEGORIES = [
  "All Templates",
  "Software & Tech",
  "Cloud & DevOps",
  "AI & Data Science",
  "Leadership & Exec",
  "Academic & Minimal",
];

const TEMPLATES = [
  {
    id: "classic",
    name: "Classic ATS Standard",
    category: "Software & Tech",
    badge: "100% Bot Safe",
    desc: "Single-column ivy-league format favored by Google, Microsoft & Workday ATS.",
    color: "#0f172a",
  },
  {
    id: "modern",
    name: "Silicon Valley Tech",
    category: "Software & Tech",
    badge: "Top for Startups",
    desc: "Modern indigo typography with skill pills and clean project highlights.",
    color: "#2563eb",
  },
  {
    id: "executive",
    name: "Executive Leader",
    category: "Leadership & Exec",
    badge: "Senior / Staff",
    desc: "Refined navy-bar styling emphasizing metrics, leadership, and scale.",
    color: "#1e3a8a",
  },
  {
    id: "knight",
    name: "Knightzone Emerald",
    category: "Software & Tech",
    badge: "Competitive Coder",
    desc: "Signature dark-forest & emerald styling with algorithmic ratings section.",
    color: "#059669",
  },
  {
    id: "devops",
    name: "Cloud & DevOps Architect",
    category: "Cloud & DevOps",
    badge: "SRE & Infra",
    desc: "Specialized layout highlighting Kubernetes, CI/CD, uptime SLAs, and cloud infra.",
    color: "#0284c7",
  },
  {
    id: "data",
    name: "AI & ML Scientist",
    category: "AI & Data Science",
    badge: "PyTorch & LLMs",
    desc: "Designed for Data Scientists and ML Engineers with model metrics & compute stack.",
    color: "#7c3aed",
  },
  {
    id: "cyber",
    name: "Cybersecurity & Systems",
    category: "Software & Tech",
    badge: "Security & Kernel",
    desc: "Terminal-accented style focused on threat modeling, low-level C/C++, and audit compliance.",
    color: "#dc2626",
  },
  {
    id: "academic",
    name: "Harvard Academic & Research",
    category: "Academic & Minimal",
    badge: "Ivy League Scholar",
    desc: "Refined serif typography tailored for researchers, publications, and fellowships.",
    color: "#881337",
  },
  {
    id: "minimal",
    name: "Minimalist Swiss",
    category: "Academic & Minimal",
    badge: "Clean & Elegant",
    desc: "Ultra-clean spacing, light borders, and crisp high-contrast readability.",
    color: "#334155",
  },
  {
    id: "compact",
    name: "Compact Two-Column",
    category: "Software & Tech",
    badge: "1-Page High Density",
    desc: "Left rail for skills & education; main column for extensive experience.",
    color: "#475569",
  },
  {
    id: "creative",
    name: "Product & UX Engineer",
    category: "Software & Tech",
    badge: "Modern Showcase",
    desc: "Vibrant visual accents with sleek modern cards showcasing UI systems & impact.",
    color: "#d97706",
  },
];

const ACCENT_COLORS = [
  { name: "Slate Black", hex: "#0f172a" },
  { name: "Knight Emerald", hex: "#059669" },
  { name: "Tech Blue", hex: "#2563eb" },
  { name: "Cloud Sky", hex: "#0284c7" },
  { name: "AI Purple", hex: "#7c3aed" },
  { name: "Crimson Red", hex: "#dc2626" },
  { name: "Harvard Crimson", hex: "#881337" },
  { name: "Warm Amber", hex: "#d97706" },
];

const SAMPLE_RESUME = {
  fullName: "Alex Morgan",
  headline: "Senior Software Engineer | Cloud Architecture & Distributed Systems",
  email: "alex.morgan.cloud@example.com",
  phone: "+1 (555) 382-9104",
  location: "San Francisco, CA",
  portfolio: "https://alexmorgan.dev",
  github: "https://github.com/alexm-cloud",
  linkedin: "https://linkedin.com/in/alexmorgan-cloud",
  summary:
    "High-impact Software Engineer with 4+ years of experience designing fault-tolerant microservices and low-latency full stack web architectures. Scaled distributed execution platform to 250k+ concurrent events while cutting average API response times by 42%. Strong focus on Java, Spring Boot, React, MySQL, Redis, and containerized deployments.",
  experiences: [
    {
      id: 1,
      role: "Senior Software Engineer",
      company: "Apex Cloud Technologies",
      duration: "2023 - Present",
      location: "San Francisco, CA",
      bullets: [
        "Architected real-time WebSocket messaging engine handling 50,000+ simultaneous connections with sub-35ms latency.",
        "Engineered async RabbitMQ message dispatch pipeline to isolate worker execution sandbox, reducing worker starvation by 46%.",
        "Optimized complex SQL leaderboard queries using composite indexing and Redis sliding window caches, decreasing P99 latency from 1.4s to 65ms.",
      ],
    },
    {
      id: 2,
      role: "Backend Systems Engineer",
      company: "Nexus Data Labs",
      duration: "2021 - 2023",
      location: "Austin, TX",
      bullets: [
        "Developed resilient REST APIs in Java Spring Boot with OAuth2/JWT security filters and centralized token bucket rate-limiting.",
        "Automated multi-stage Docker build containers and GitHub Actions CI/CD pipelines, accelerating deployment frequency by 3.5x.",
      ],
    },
  ],
  projects: [
    {
      id: 1,
      name: "Distributed Code Judge & Sparring Arena",
      tech: "Java, Spring Boot, React, Redis, Docker, RabbitMQ",
      link: "https://github.com/alexm-cloud/distributed-engine",
      bullets: [
        "Built isolated code execution sandbox with CPU/Memory cgroups enforcing strict test case constraints across C++, Java, and Python.",
        "Integrated real-time matchmaking queue with ELO rating algorithms and automated cheat detection telemetry.",
      ],
    },
    {
      id: 2,
      name: "High-Volume Resume ATS Auditor & Parser",
      tech: "Spring Boot, Python, FastAPI, React, TailwindCSS",
      link: "https://github.com/alexm-cloud/ats-auditor",
      bullets: [
        "Implemented multi-layer keyword extraction and section-matching algorithm validating 50+ ATS compliance criteria in under 300ms.",
      ],
    },
  ],
  education: [
    {
      id: 1,
      degree: "B.S. in Computer Science and Engineering",
      institution: "University of California, Berkeley",
      duration: "2017 - 2021",
      score: "GPA: 3.85 / 4.0",
    },
  ],
  skills: {
    languages: "Java, JavaScript (ES6+), TypeScript, C++, Python, SQL",
    frameworks: "Spring Boot, Spring Security, React 19, Node.js, TailwindCSS",
    databases: "MySQL, PostgreSQL, Redis, MongoDB",
    tools: "Docker, Docker Compose, Git, RabbitMQ, Linux, Postman, Maven, Kubernetes",
  },
};

export default function ResumeBuilder() {
  const { user } = useAuth();
  const { isNight } = useTheme();

  const [resume, setResume] = useState(SAMPLE_RESUME);
  const [selectedTemplate, setSelectedTemplate] = useState("classic");
  const [selectedCategory, setSelectedCategory] = useState("All Templates");
  const [accentColor, setAccentColor] = useState("#0f172a");

  // Live ATS Score Calculator
  const atsScore = useMemo(() => {
    let score = 50;

    if (resume.fullName.trim()) score += 5;
    if (resume.email.includes("@")) score += 5;
    if (resume.phone.trim()) score += 5;
    if (resume.github.trim() || resume.linkedin.trim()) score += 5;

    const summaryWords = resume.summary.trim().split(/\s+/).length;
    if (summaryWords >= 25 && summaryWords <= 90) score += 10;

    const hasExperiences = resume.experiences && resume.experiences.length > 0;
    if (hasExperiences) {
      score += 5;
      const allBullets = resume.experiences.flatMap((e) => e.bullets).join(" ");
      const hasActionVerbs = /architected|engineered|built|optimized|developed|scaled|reduced|accelerated/i.test(allBullets);
      const hasMetrics = /\d+%|\d+x|\d+ms|\d+k/i.test(allBullets);
      if (hasActionVerbs) score += 5;
      if (hasMetrics) score += 5;
    }

    if (resume.projects && resume.projects.length >= 2) score += 5;
    const skillsCount = (resume.skills.languages + " " + resume.skills.frameworks + " " + resume.skills.tools)
      .split(",")
      .filter((s) => s.trim().length > 0).length;
    if (skillsCount >= 10) score += 5;

    return Math.min(98, score);
  }, [resume]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resume, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${resume.fullName.replace(/\s+/g, "_")}_Resume.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleAddExperience = () => {
    setResume((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          id: Date.now(),
          role: "Software Engineer",
          company: "Tech Company",
          duration: "2024 - Present",
          location: "Location",
          bullets: ["Spearheaded engineering improvements and built critical service features."],
        },
      ],
    }));
  };

  const handleRemoveExperience = (id) => {
    setResume((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((e) => e.id !== id),
    }));
  };

  const handleAddProject = () => {
    setResume((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          id: Date.now(),
          name: "Full Stack Web Application",
          tech: "React, Node.js, MySQL",
          link: "https://github.com",
          bullets: ["Implemented key end-to-end functionality with clean REST APIs."],
        },
      ],
    }));
  };

  const handleRemoveProject = (id) => {
    setResume((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  };

  return (
    <div className={`min-h-screen px-4 py-8 sm:px-6 lg:px-10 ${isNight ? "bg-[#0c0f0a] text-white" : "bg-[#f8faf6] text-slate-900"}`}>
      <div className="mx-auto max-w-7xl">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6 print:hidden">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#c5ff55]/10 border border-[#c5ff55]/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#c5ff55] mb-2">
              <Sparkles size={13} />
              Multi-Template ATS Resume Studio
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Knight <span className="text-[#c5ff55]">Resume Builder</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#8f9d8a]">
              Craft high-conversion technical resumes formatted in 6 distinct ATS-tested templates favored by Google, Amazon, and top tech employers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setResume(SAMPLE_RESUME)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/10"
              title="Pre-fill with verified sample tech resume"
            >
              <RotateCcw size={14} /> Fill Sample Resume
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-[#c5ff55] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#14170f] shadow-md shadow-[#c5ff55]/20 hover:bg-[#d5ff83] transition"
            >
              <Printer size={15} /> Print / Save PDF
            </button>

            <Link
              to="/resume-strength"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#c5ff55]/30 bg-[#c5ff55]/10 px-3.5 py-2 text-xs font-bold text-[#c5ff55] hover:bg-[#c5ff55]/20 transition"
            >
              <ShieldCheck size={14} /> Audit in ATS Scanner
            </Link>
          </div>
        </div>

        {/* Template Selector Carousel / Bar */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-[#161a14] p-5 shadow-lg print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Layout size={18} className="text-[#c5ff55]" />
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Choose Template ({TEMPLATES.length} Styles)
                </h3>
                <p className="text-xs text-[#8f9d8a]">Switch layout instantly without losing your written content.</p>
              </div>
            </div>

            {/* Accent Color Chooser */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#788874] mr-1">Accent:</span>
              {ACCENT_COLORS.map((col) => (
                <button
                  key={col.hex}
                  onClick={() => setAccentColor(col.hex)}
                  title={col.name}
                  className={`h-6 w-6 rounded-full border-2 transition-transform ${
                    accentColor === col.hex ? "scale-125 border-white ring-2 ring-[#c5ff55]" : "border-transparent hover:scale-110"
                  }`}
                  style={{ backgroundColor: col.hex }}
                />
              ))}
            </div>
          </div>

          {/* Quick Dropdown Section & Category Pills */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 mb-4 rounded-2xl bg-black/40 border border-white/10">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-[#788874] mr-1">Category:</span>
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                    selectedCategory === cat
                      ? "bg-[#c5ff55] text-[#14170f] font-black shadow-sm"
                      : "bg-white/5 text-[#aab1a1] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Dropdown Menu */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-[#788874]">Quick Pick:</span>
              <select
                value={selectedTemplate}
                onChange={(e) => {
                  const tmpl = TEMPLATES.find((t) => t.id === e.target.value);
                  setSelectedTemplate(e.target.value);
                  if (tmpl) setAccentColor(tmpl.color);
                }}
                className="rounded-xl border border-white/20 bg-[#161a14] px-3 py-1.5 text-xs font-bold text-[#c5ff55] focus:border-[#c5ff55] focus:outline-none cursor-pointer"
              >
                {TEMPLATE_CATEGORIES.filter((c) => c !== "All Templates").map((cat) => (
                  <optgroup key={cat} label={`── ${cat} ──`} className="bg-[#161a14] text-[#aab1a1]">
                    {TEMPLATES.filter((t) => t.category === cat).map((t) => (
                      <option key={t.id} value={t.id} className="bg-[#161a14] text-white">
                        {t.name} ({t.badge})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {(selectedCategory === "All Templates"
              ? TEMPLATES
              : TEMPLATES.filter((t) => t.category === selectedCategory)
            ).map((tmpl) => {
              const isSelected = selectedTemplate === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    setSelectedTemplate(tmpl.id);
                    setAccentColor(tmpl.color);
                  }}
                  className={`flex flex-col justify-between p-3.5 rounded-2xl border text-left transition ${
                    isSelected
                      ? "bg-[#c5ff55]/15 border-[#c5ff55] shadow-md shadow-[#c5ff55]/10"
                      : "bg-white/[0.02] border-white/10 hover:border-white/25 hover:bg-white/5"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tmpl.color }} />
                      <span className="text-[9px] font-black uppercase text-[#c5ff55] bg-[#c5ff55]/10 px-1.5 py-0.5 rounded">
                        {tmpl.badge}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-white">{tmpl.name}</h4>
                  </div>
                  <p className="text-[10px] text-[#788874] mt-1.5 leading-snug line-clamp-2">{tmpl.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ATS Score Live Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#161a14] px-5 py-3 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase text-[#788874]">Live ATS Score:</span>
            <span className="flex items-center gap-1 text-sm font-black text-white bg-black/40 px-3 py-1 rounded-xl border border-white/10">
              <span className={atsScore >= 85 ? "text-[#c5ff55]" : "text-amber-400"}>{atsScore}</span> / 100
            </span>
            <span className="text-xs font-bold text-[#c5ff55] bg-[#c5ff55]/10 border border-[#c5ff55]/20 px-2.5 py-0.5 rounded-md">
              {atsScore >= 85 ? "Tier 1 FAANG Ready" : "Solid Base"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#8f9d8a]">
            <span>Active Template: <b className="text-white capitalize">{selectedTemplate}</b></span>
          </div>
        </div>

        {/* Two-Column Editor & Live Paper Preview */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ========================================================= */}
          {/* LEFT COLUMN: RESUME FORM EDITOR (lg:col-span-6) */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 space-y-6 print:hidden">
            {/* 1. Personal & Contact Info */}
            <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-xl">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
                <User size={16} className="text-[#c5ff55]" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Contact & Header</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[#788874] font-bold block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={resume.fullName}
                    onChange={(e) => setResume({ ...resume, fullName: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#788874] font-bold block mb-1">Target Headline</label>
                  <input
                    type="text"
                    value={resume.headline}
                    onChange={(e) => setResume({ ...resume, headline: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#788874] font-bold block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={resume.email}
                    onChange={(e) => setResume({ ...resume, email: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#788874] font-bold block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={resume.phone}
                    onChange={(e) => setResume({ ...resume, phone: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#788874] font-bold block mb-1">Location (City, Country)</label>
                  <input
                    type="text"
                    value={resume.location}
                    onChange={(e) => setResume({ ...resume, location: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#788874] font-bold block mb-1">GitHub / Code URL</label>
                  <input
                    type="text"
                    value={resume.github}
                    onChange={(e) => setResume({ ...resume, github: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Professional Summary */}
            <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-[#c5ff55]" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Professional Summary</h3>
                </div>
                <span className="text-[10px] text-[#788874]">ATS recommended: 40-70 words</span>
              </div>

              <textarea
                rows={4}
                value={resume.summary}
                onChange={(e) => setResume({ ...resume, summary: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white focus:border-[#c5ff55] focus:outline-none leading-relaxed"
              />
            </div>

            {/* 3. Work Experience */}
            <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Briefcase size={16} className="text-[#c5ff55]" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Experience</h3>
                </div>

                <button
                  onClick={handleAddExperience}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#c5ff55] hover:underline"
                >
                  <Plus size={14} /> Add Role
                </button>
              </div>

              <div className="space-y-4">
                {resume.experiences.map((exp, expIdx) => (
                  <div key={exp.id} className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={exp.role}
                        placeholder="Job Title / Role"
                        onChange={(e) => {
                          const updated = [...resume.experiences];
                          updated[expIdx].role = e.target.value;
                          setResume({ ...resume, experiences: updated });
                        }}
                        className="font-bold text-xs text-white bg-transparent border-b border-white/10 pb-1 focus:outline-none focus:border-[#c5ff55]"
                      />

                      <button
                        onClick={() => handleRemoveExperience(exp.id)}
                        className="text-rose-400 hover:text-rose-300"
                        title="Remove role"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <input
                        type="text"
                        value={exp.company}
                        placeholder="Company Name"
                        onChange={(e) => {
                          const updated = [...resume.experiences];
                          updated[expIdx].company = e.target.value;
                          setResume({ ...resume, experiences: updated });
                        }}
                        className="rounded-lg border border-white/10 bg-black/40 p-2 text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        value={exp.duration}
                        placeholder="Duration (e.g. 2023 - Present)"
                        onChange={(e) => {
                          const updated = [...resume.experiences];
                          updated[expIdx].duration = e.target.value;
                          setResume({ ...resume, experiences: updated });
                        }}
                        className="rounded-lg border border-white/10 bg-black/40 p-2 text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#788874] block mb-1">
                        Impact Bullets (One per line, include metrics)
                      </label>
                      <textarea
                        rows={3}
                        value={exp.bullets.join("\n")}
                        onChange={(e) => {
                          const updated = [...resume.experiences];
                          updated[expIdx].bullets = e.target.value.split("\n");
                          setResume({ ...resume, experiences: updated });
                        }}
                        className="w-full rounded-lg border border-white/10 bg-black/40 p-2.5 text-xs text-white font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Projects */}
            <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Code2 size={16} className="text-[#c5ff55]" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Technical Projects</h3>
                </div>

                <button
                  onClick={handleAddProject}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#c5ff55] hover:underline"
                >
                  <Plus size={14} /> Add Project
                </button>
              </div>

              <div className="space-y-4">
                {resume.projects.map((proj, projIdx) => (
                  <div key={proj.id} className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={proj.name}
                        placeholder="Project Name"
                        onChange={(e) => {
                          const updated = [...resume.projects];
                          updated[projIdx].name = e.target.value;
                          setResume({ ...resume, projects: updated });
                        }}
                        className="font-bold text-xs text-white bg-transparent border-b border-white/10 pb-1 focus:outline-none focus:border-[#c5ff55]"
                      />

                      <button
                        onClick={() => handleRemoveProject(proj.id)}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <input
                        type="text"
                        value={proj.tech}
                        placeholder="Tech Stack (e.g. Java, React, Redis)"
                        onChange={(e) => {
                          const updated = [...resume.projects];
                          updated[projIdx].tech = e.target.value;
                          setResume({ ...resume, projects: updated });
                        }}
                        className="rounded-lg border border-white/10 bg-black/40 p-2 text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        value={proj.link}
                        placeholder="GitHub / Demo URL"
                        onChange={(e) => {
                          const updated = [...resume.projects];
                          updated[projIdx].link = e.target.value;
                          setResume({ ...resume, projects: updated });
                        }}
                        className="rounded-lg border border-white/10 bg-black/40 p-2 text-white focus:outline-none"
                      />
                    </div>

                    <textarea
                      rows={2}
                      value={proj.bullets.join("\n")}
                      onChange={(e) => {
                        const updated = [...resume.projects];
                        updated[projIdx].bullets = e.target.value.split("\n");
                        setResume({ ...resume, projects: updated });
                      }}
                      className="w-full rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Technical Skills Matrix */}
            <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-xl">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
                <Code2 size={16} className="text-[#c5ff55]" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Skills Matrix</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[#788874] font-bold block mb-1">Programming Languages</label>
                  <input
                    type="text"
                    value={resume.skills.languages}
                    onChange={(e) => setResume({ ...resume, skills: { ...resume.skills, languages: e.target.value } })}
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#788874] font-bold block mb-1">Frameworks & Libraries</label>
                  <input
                    type="text"
                    value={resume.skills.frameworks}
                    onChange={(e) => setResume({ ...resume, skills: { ...resume.skills, frameworks: e.target.value } })}
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#788874] font-bold block mb-1">Databases & Infrastructure</label>
                  <input
                    type="text"
                    value={resume.skills.databases}
                    onChange={(e) => setResume({ ...resume, skills: { ...resume.skills, databases: e.target.value } })}
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#788874] font-bold block mb-1">Developer Tools & Platforms</label>
                  <input
                    type="text"
                    value={resume.skills.tools}
                    onChange={(e) => setResume({ ...resume, skills: { ...resume.skills, tools: e.target.value } })}
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: DYNAMIC TEMPLATE RENDERER (lg:col-span-6) */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 sticky top-24">
            <ResumePreviewSheet
              resume={resume}
              template={selectedTemplate}
              accentColor={accentColor}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// TEMPLATE RENDERER COMPONENT
// ====================================================================
function ResumePreviewSheet({ resume, template, accentColor }) {
  // -------------------------------------------------------------
  // TEMPLATE 1: CLASSIC ATS STANDARD (Default Single-Column)
  // -------------------------------------------------------------
  if (template === "classic") {
    return (
      <div className="rounded-3xl border border-white/15 bg-white shadow-2xl text-slate-900 p-8 sm:p-10 font-sans min-h-[750px] print:m-0 print:p-0 print:border-none print:shadow-none">
        <div className="border-b-2 border-slate-900 pb-3 text-center">
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
            {resume.fullName || "Your Full Name"}
          </h2>
          <p className="text-xs font-bold text-slate-700 mt-0.5">{resume.headline}</p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
            {resume.email && <span>{resume.email}</span>}
            {resume.phone && <span>• {resume.phone}</span>}
            {resume.location && <span>• {resume.location}</span>}
            {resume.github && <span>• <a href={resume.github} className="text-blue-600 underline">GitHub</a></span>}
            {resume.linkedin && <span>• <a href={resume.linkedin} className="text-blue-600 underline">LinkedIn</a></span>}
          </div>
        </div>

        {resume.summary && (
          <div className="mt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
              Professional Summary
            </h3>
            <p className="text-[11px] leading-relaxed text-slate-700">{resume.summary}</p>
          </div>
        )}

        {resume.experiences?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2">
              Professional Experience
            </h3>
            <div className="space-y-3">
              {resume.experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-slate-900">
                      {exp.role} <span className="font-normal text-slate-700">| {exp.company}</span>
                    </span>
                    <span className="text-[10px] text-slate-600 font-medium">{exp.duration}</span>
                  </div>
                  <ul className="mt-1 list-disc list-outside pl-4 space-y-1 text-[11px] text-slate-700 leading-snug">
                    {exp.bullets.filter(b => b.trim()).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {resume.projects?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2">
              Key Projects
            </h3>
            <div className="space-y-3">
              {resume.projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-slate-900">
                      {proj.name} {proj.tech && <span className="font-mono text-[10px] font-normal text-slate-600">({proj.tech})</span>}
                    </span>
                    {proj.link && <span className="text-[10px] text-blue-600 underline">Code Link</span>}
                  </div>
                  <ul className="mt-1 list-disc list-outside pl-4 space-y-1 text-[11px] text-slate-700 leading-snug">
                    {proj.bullets.filter(b => b.trim()).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
            Technical Skills
          </h3>
          <div className="text-[11px] text-slate-700 space-y-1">
            <div><span className="font-bold text-slate-900">Languages:</span> {resume.skills.languages}</div>
            <div><span className="font-bold text-slate-900">Frameworks:</span> {resume.skills.frameworks}</div>
            <div><span className="font-bold text-slate-900">Databases & Tools:</span> {resume.skills.databases}, {resume.skills.tools}</div>
          </div>
        </div>

        {resume.education?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
              Education
            </h3>
            <div className="space-y-1 text-xs">
              {resume.education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline text-[11px]">
                  <div><span className="font-bold text-slate-900">{edu.degree}</span> • <span className="text-slate-700">{edu.institution}</span></div>
                  <div className="text-slate-600">{edu.duration}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // TEMPLATE 2: SILICON VALLEY TECH (Modern Tech Header + Pill Badges)
  // -------------------------------------------------------------
  if (template === "modern") {
    return (
      <div className="rounded-3xl border border-white/15 bg-white shadow-2xl text-slate-900 p-8 sm:p-10 font-sans min-h-[750px] print:m-0 print:p-0 print:border-none print:shadow-none">
        <div className="border-l-4 pl-4 pb-2" style={{ borderColor: accentColor }}>
          <h2 className="text-2xl font-black tracking-tight" style={{ color: accentColor }}>
            {resume.fullName || "Your Full Name"}
          </h2>
          <p className="text-xs font-bold text-slate-700 mt-0.5">{resume.headline}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
            {resume.email && <span>{resume.email}</span>}
            {resume.phone && <span>• {resume.phone}</span>}
            {resume.location && <span>• {resume.location}</span>}
            {resume.github && <span>• <a href={resume.github} className="text-blue-600 underline">GitHub</a></span>}
            {resume.linkedin && <span>• <a href={resume.linkedin} className="text-blue-600 underline">LinkedIn</a></span>}
          </div>
        </div>

        {resume.summary && (
          <div className="mt-5 rounded-xl bg-slate-50 p-3 border border-slate-200">
            <p className="text-[11px] leading-relaxed text-slate-700 font-medium">{resume.summary}</p>
          </div>
        )}

        {/* Skills Section with Badges */}
        <div className="mt-5">
          <h3 className="text-xs font-black uppercase tracking-wider pb-1 mb-2 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>
            Technical Capabilities
          </h3>
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            {(resume.skills.languages + ", " + resume.skills.frameworks + ", " + resume.skills.databases + ", " + resume.skills.tools)
              .split(",")
              .filter(s => s.trim())
              .map((s, i) => (
                <span key={i} className="rounded-md bg-slate-100 text-slate-800 font-bold px-2 py-0.5 border border-slate-200">
                  {s.trim()}
                </span>
              ))}
          </div>
        </div>

        {resume.experiences?.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs font-black uppercase tracking-wider pb-1 mb-2 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>
              Engineering Experience
            </h3>
            <div className="space-y-3.5">
              {resume.experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-extrabold text-slate-900">{exp.role}</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{exp.duration}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-600">{exp.company} • {exp.location}</p>
                  <ul className="mt-1.5 list-disc list-outside pl-4 space-y-1 text-[11px] text-slate-700 leading-snug">
                    {exp.bullets.filter(b => b.trim()).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {resume.projects?.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs font-black uppercase tracking-wider pb-1 mb-2 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>
              Featured Systems & Projects
            </h3>
            <div className="space-y-3">
              {resume.projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-slate-900">{proj.name}</span>
                    {proj.link && <span className="text-[10px] text-blue-600 underline">View Repo</span>}
                  </div>
                  {proj.tech && <p className="text-[10px] font-mono text-slate-500">{proj.tech}</p>}
                  <ul className="mt-1 list-disc list-outside pl-4 space-y-1 text-[11px] text-slate-700 leading-snug">
                    {proj.bullets.filter(b => b.trim()).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {resume.education?.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs font-black uppercase tracking-wider pb-1 mb-2 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>
              Education
            </h3>
            {resume.education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline text-[11px]">
                <div><span className="font-bold text-slate-900">{edu.degree}</span> • <span>{edu.institution}</span></div>
                <span className="text-slate-600">{edu.duration}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // TEMPLATE 3: EXECUTIVE LEADER (Prominent Top Banner + Formal Rule)
  // -------------------------------------------------------------
  if (template === "executive") {
    return (
      <div className="rounded-3xl border border-white/15 bg-white shadow-2xl text-slate-900 p-8 sm:p-10 font-serif min-h-[750px] print:m-0 print:p-0 print:border-none print:shadow-none">
        <div className="bg-slate-900 text-white p-6 -mx-8 -mt-8 sm:-mx-10 sm:-mt-10 rounded-t-3xl text-center">
          <h2 className="text-2xl font-black uppercase tracking-widest text-white">
            {resume.fullName || "Your Full Name"}
          </h2>
          <p className="text-xs font-sans font-semibold text-slate-300 mt-1">{resume.headline}</p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-400 font-sans">
            {resume.email && <span>{resume.email}</span>}
            {resume.phone && <span>{resume.phone}</span>}
            {resume.location && <span>{resume.location}</span>}
            {resume.linkedin && <span><a href={resume.linkedin} className="text-[#c5ff55] underline">LinkedIn</a></span>}
          </div>
        </div>

        {resume.summary && (
          <div className="mt-6 border-b border-slate-200 pb-4">
            <h3 className="text-xs font-sans font-black uppercase tracking-widest text-slate-900 mb-1.5">
              Executive Profile
            </h3>
            <p className="text-[11px] leading-relaxed text-slate-700">{resume.summary}</p>
          </div>
        )}

        {resume.experiences?.length > 0 && (
          <div className="mt-5 border-b border-slate-200 pb-4">
            <h3 className="text-xs font-sans font-black uppercase tracking-widest text-slate-900 mb-2">
              Career History & Leadership
            </h3>
            <div className="space-y-4">
              {resume.experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline font-sans text-xs">
                    <span className="font-bold text-slate-900">{exp.role}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{exp.duration}</span>
                  </div>
                  <p className="text-[11px] font-sans text-slate-600 italic">{exp.company} • {exp.location}</p>
                  <ul className="mt-1 list-disc list-outside pl-4 space-y-1 text-[11px] text-slate-700 leading-snug">
                    {exp.bullets.filter(b => b.trim()).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {resume.projects?.length > 0 && (
          <div className="mt-5 border-b border-slate-200 pb-4">
            <h3 className="text-sans text-xs font-black uppercase tracking-widest text-slate-900 mb-2">
              Strategic Initiatives & Systems
            </h3>
            <div className="space-y-3 font-sans">
              {resume.projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-slate-900">{proj.name}</span>
                    {proj.link && <span className="text-[10px] text-blue-600 underline">Architecture</span>}
                  </div>
                  <ul className="mt-1 list-disc list-outside pl-4 space-y-1 text-[11px] text-slate-700 leading-snug">
                    {proj.bullets.filter(b => b.trim()).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 font-sans">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-1.5">
            Core Competencies
          </h3>
          <p className="text-[11px] text-slate-700">
            <b>Technologies:</b> {resume.skills.languages}, {resume.skills.frameworks}<br/>
            <b>Infrastructure:</b> {resume.skills.databases}, {resume.skills.tools}
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // TEMPLATE 4: KNIGHTZONE EMERALD (Competitive Programmer Signature)
  // -------------------------------------------------------------
  if (template === "knight") {
    return (
      <div className="rounded-3xl border border-white/15 bg-white shadow-2xl text-slate-900 p-8 sm:p-10 font-sans min-h-[750px] print:m-0 print:p-0 print:border-none print:shadow-none">
        <div className="border-b-4 border-emerald-600 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
              {resume.fullName || "Your Full Name"}
            </h2>
            <p className="text-xs font-bold text-emerald-700">{resume.headline}</p>
            <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] text-slate-600 font-mono">
              <span>{resume.email}</span>
              <span>• {resume.phone}</span>
              <span>• {resume.location}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 border border-emerald-300">
              Knight Verified
            </span>
            <div className="mt-1 text-[10px] text-blue-600 underline font-mono">
              {resume.github && <div><a href={resume.github}>github/profile</a></div>}
            </div>
          </div>
        </div>

        {resume.summary && (
          <div className="mt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-1">
              <Code2 size={13} /> Algorithmic & Systems Profile
            </h3>
            <p className="text-[11px] text-slate-700 leading-relaxed">{resume.summary}</p>
          </div>
        )}

        {/* Competitive Skills Matrix */}
        <div className="mt-4 rounded-xl bg-emerald-50/60 border border-emerald-200 p-3">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-emerald-900 mb-1.5">
            Technical Arsenal
          </h4>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-800">
            <div><b>Languages:</b> {resume.skills.languages}</div>
            <div><b>Frameworks:</b> {resume.skills.frameworks}</div>
            <div><b>Databases:</b> {resume.skills.databases}</div>
            <div><b>DevOps/Tools:</b> {resume.skills.tools}</div>
          </div>
        </div>

        {resume.experiences?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-200 pb-1 mb-2">
              Engineering Experience
            </h3>
            <div className="space-y-3">
              {resume.experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-extrabold text-slate-900">{exp.role} <span className="font-medium text-emerald-700">@ {exp.company}</span></span>
                    <span className="text-[10px] text-slate-500 font-mono">{exp.duration}</span>
                  </div>
                  <ul className="mt-1 list-disc list-outside pl-4 space-y-1 text-[11px] text-slate-700 leading-snug">
                    {exp.bullets.filter(b => b.trim()).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {resume.projects?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-200 pb-1 mb-2">
              High-Scale Systems & Projects
            </h3>
            <div className="space-y-2.5">
              {resume.projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-slate-900">{proj.name}</span>
                    {proj.link && <span className="text-[10px] text-emerald-700 underline font-mono">Live Demo</span>}
                  </div>
                  <ul className="mt-1 list-disc list-outside pl-4 space-y-0.5 text-[11px] text-slate-700 leading-snug">
                    {proj.bullets.filter(b => b.trim()).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {resume.education?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-200 pb-1 mb-1">
              Academic Background
            </h3>
            {resume.education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline text-[11px]">
                <span className="font-bold text-slate-900">{edu.degree} • {edu.institution}</span>
                <span className="text-slate-600">{edu.duration}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // TEMPLATE 5: MINIMALIST SWISS (Clean Grid Spacing)
  // -------------------------------------------------------------
  if (template === "minimal") {
    return (
      <div className="rounded-3xl border border-white/15 bg-white shadow-2xl text-slate-900 p-8 sm:p-10 font-sans min-h-[750px] print:m-0 print:p-0 print:border-none print:shadow-none">
        <div className="pb-4">
          <h2 className="text-2xl font-light tracking-tight text-slate-900">
            <b className="font-black">{resume.fullName.split(" ")[0]}</b> {resume.fullName.split(" ").slice(1).join(" ")}
          </h2>
          <p className="text-xs font-mono text-slate-600 mt-0.5">{resume.headline}</p>

          <div className="mt-2 flex flex-wrap gap-x-4 text-[10px] font-mono text-slate-500">
            <span>{resume.email}</span>
            <span>{resume.phone}</span>
            <span>{resume.location}</span>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-3">
          <p className="text-[11px] text-slate-700 leading-relaxed">{resume.summary}</p>
        </div>

        {resume.experiences?.length > 0 && (
          <div className="mt-5 border-t border-slate-200 pt-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block mb-2">
              01 / EXPERIENCE
            </span>
            <div className="space-y-3">
              {resume.experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline text-xs font-mono">
                    <span className="font-bold text-slate-900">{exp.role} — {exp.company}</span>
                    <span className="text-[10px] text-slate-500">{exp.duration}</span>
                  </div>
                  <ul className="mt-1 list-disc list-outside pl-4 space-y-1 text-[11px] text-slate-700">
                    {exp.bullets.filter(b => b.trim()).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {resume.projects?.length > 0 && (
          <div className="mt-5 border-t border-slate-200 pt-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block mb-2">
              02 / SYSTEMS & WORK
            </span>
            <div className="space-y-3">
              {resume.projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline text-xs font-mono">
                    <span className="font-bold text-slate-900">{proj.name}</span>
                    {proj.link && <span className="text-[10px] text-slate-500 underline">Link</span>}
                  </div>
                  <ul className="mt-1 list-disc list-outside pl-4 space-y-1 text-[11px] text-slate-700">
                    {proj.bullets.filter(b => b.trim()).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 border-t border-slate-200 pt-3 text-[11px] font-mono text-slate-700">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
            03 / SKILLS
          </span>
          <p>{resume.skills.languages} • {resume.skills.frameworks} • {resume.skills.databases} • {resume.skills.tools}</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // TEMPLATE 6: COMPACT TWO-COLUMN (High-Density Split Layout)
  // -------------------------------------------------------------
  return (
    <div className="rounded-3xl border border-white/15 bg-white shadow-2xl text-slate-900 p-8 sm:p-10 font-sans min-h-[750px] print:m-0 print:p-0 print:border-none print:shadow-none">
      <div className="border-b-2 border-slate-900 pb-3 mb-4">
        <h2 className="text-2xl font-black uppercase text-slate-900">{resume.fullName}</h2>
        <p className="text-xs font-bold text-slate-700">{resume.headline}</p>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols) */}
        <div className="col-span-4 space-y-4 border-r border-slate-200 pr-4 text-xs">
          <div>
            <h4 className="font-black text-[10px] uppercase text-slate-500 tracking-wider mb-1">Contact</h4>
            <div className="text-[11px] text-slate-700 space-y-0.5 break-all">
              <div>{resume.email}</div>
              <div>{resume.phone}</div>
              <div>{resume.location}</div>
              {resume.github && <div><a href={resume.github} className="text-blue-600 underline">GitHub</a></div>}
            </div>
          </div>

          <div>
            <h4 className="font-black text-[10px] uppercase text-slate-500 tracking-wider mb-1">Skills</h4>
            <div className="text-[11px] text-slate-700 space-y-1">
              <div><b>Languages:</b> {resume.skills.languages}</div>
              <div><b>Frameworks:</b> {resume.skills.frameworks}</div>
              <div><b>Databases:</b> {resume.skills.databases}</div>
              <div><b>Tools:</b> {resume.skills.tools}</div>
            </div>
          </div>

          {resume.education?.length > 0 && (
            <div>
              <h4 className="font-black text-[10px] uppercase text-slate-500 tracking-wider mb-1">Education</h4>
              {resume.education.map((edu) => (
                <div key={edu.id} className="text-[11px] text-slate-700">
                  <div className="font-bold text-slate-900">{edu.degree}</div>
                  <div>{edu.institution}</div>
                  <div className="text-slate-500">{edu.duration}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (8 cols) */}
        <div className="col-span-8 space-y-4">
          {resume.summary && (
            <div>
              <h4 className="font-black text-[10px] uppercase text-slate-500 tracking-wider mb-1">Summary</h4>
              <p className="text-[11px] text-slate-700 leading-relaxed">{resume.summary}</p>
            </div>
          )}

          {resume.experiences?.length > 0 && (
            <div>
              <h4 className="font-black text-[10px] uppercase text-slate-500 tracking-wider mb-1">Experience</h4>
              <div className="space-y-3">
                {resume.experiences.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-bold text-slate-900">{exp.role}</span>
                      <span className="text-[10px] text-slate-500">{exp.duration}</span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-600">{exp.company}</p>
                    <ul className="mt-1 list-disc list-outside pl-4 space-y-0.5 text-[11px] text-slate-700 leading-snug">
                      {exp.bullets.filter(b => b.trim()).map((b, idx) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resume.projects?.length > 0 && (
            <div>
              <h4 className="font-black text-[10px] uppercase text-slate-500 tracking-wider mb-1">Key Projects</h4>
              <div className="space-y-2.5">
                {resume.projects.map((proj) => (
                  <div key={proj.id}>
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-bold text-slate-900">{proj.name}</span>
                      {proj.link && <span className="text-[10px] text-blue-600 underline">Link</span>}
                    </div>
                    <ul className="mt-1 list-disc list-outside pl-4 space-y-0.5 text-[11px] text-slate-700 leading-snug">
                      {proj.bullets.filter(b => b.trim()).map((b, idx) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // -------------------------------------------------------------
  // TEMPLATE 6: CLOUD & DEVOPS ARCHITECT
  // -------------------------------------------------------------
  if (template === "devops") {
    return (
      <div className="rounded-3xl border border-white/15 bg-white shadow-2xl text-slate-900 p-8 sm:p-10 font-sans min-h-[750px] print:m-0 print:p-0 print:border-none print:shadow-none">
        <div className="border-b-4 border-sky-600 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
              {resume.fullName || "Your Full Name"}
            </h2>
            <p className="text-xs font-bold text-sky-700 mt-0.5">{resume.headline}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:max-w-xs justify-end text-[10px]">
            <span className="rounded bg-sky-100 text-sky-800 font-bold px-2 py-0.5">Kubernetes</span>
            <span className="rounded bg-sky-100 text-sky-800 font-bold px-2 py-0.5">Terraform</span>
            <span className="rounded bg-sky-100 text-sky-800 font-bold px-2 py-0.5">AWS Cloud</span>
            <span className="rounded bg-sky-100 text-sky-800 font-bold px-2 py-0.5">CI/CD SRE</span>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
          {resume.email && <span>📧 {resume.email}</span>}
          {resume.phone && <span>📞 {resume.phone}</span>}
          {resume.location && <span>📍 {resume.location}</span>}
          {resume.github && <span>🐙 <a href={resume.github} className="text-sky-600 underline">GitHub</a></span>}
          {resume.linkedin && <span>💼 <a href={resume.linkedin} className="text-sky-600 underline">LinkedIn</a></span>}
        </div>

        {resume.summary && (
          <div className="mt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-sky-900 border-b border-sky-200 pb-0.5 mb-1.5 flex items-center justify-between">
              <span>Infrastructure & Systems Summary</span>
              <span className="text-[10px] text-sky-600 font-mono">99.99% SLA Target</span>
            </h3>
            <p className="text-[11px] leading-relaxed text-slate-700">{resume.summary}</p>
          </div>
        )}

        {resume.experiences?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-sky-900 border-b border-sky-200 pb-0.5 mb-2">
              Engineering & Cloud Experience
            </h3>
            <div className="space-y-3">
              {resume.experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-slate-900">
                      {exp.role} <span className="text-sky-700 font-medium">@ {exp.company}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{exp.duration}</span>
                  </div>
                  <ul className="mt-1 list-disc list-outside pl-4 space-y-1 text-[11px] text-slate-700 leading-snug">
                    {exp.bullets.filter(b => b.trim()).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {resume.projects?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-sky-900 border-b border-sky-200 pb-0.5 mb-2">
              Cloud Infrastructure & Automation Projects
            </h3>
            <div className="space-y-2.5">
              {resume.projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-slate-900">
                      {proj.name} {proj.tech && <span className="font-mono text-[10px] text-sky-700">[{proj.tech}]</span>}
                    </span>
                    {proj.link && <span className="text-[10px] text-sky-600 underline font-mono">Repo</span>}
                  </div>
                  <ul className="mt-1 list-disc list-outside pl-4 space-y-0.5 text-[11px] text-slate-700 leading-snug">
                    {proj.bullets.filter(b => b.trim()).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-sky-900 border-b border-sky-200 pb-0.5 mb-1.5">
            DevOps & Platform Tech Stack
          </h3>
          <div className="text-[11px] text-slate-700 space-y-1">
            <div><span className="font-bold text-slate-900">Cloud & Infra:</span> {resume.skills.tools}</div>
            <div><span className="font-bold text-slate-900">Data Stores & Messaging:</span> {resume.skills.databases}</div>
            <div><span className="font-bold text-slate-900">Automation & Code:</span> {resume.skills.languages}, {resume.skills.frameworks}</div>
          </div>
        </div>

        {resume.education?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-sky-900 border-b border-sky-200 pb-0.5 mb-1.5">
              Education
            </h3>
            <div className="space-y-1 text-xs">
              {resume.education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline text-[11px]">
                  <div><span className="font-bold text-slate-900">{edu.degree}</span> • <span>{edu.institution}</span></div>
                  <div className="text-slate-500">{edu.duration}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // TEMPLATE 7: AI & ML DATA SCIENTIST
  // -------------------------------------------------------------
  if (template === "data") {
    return (
      <div className="rounded-3xl border border-white/15 bg-white shadow-2xl text-slate-900 p-8 sm:p-10 font-sans min-h-[750px] print:m-0 print:p-0 print:border-none print:shadow-none">
        <div className="border-l-4 border-purple-600 pl-4 pb-2">
          <h2 className="text-2xl font-black uppercase tracking-tight text-purple-900">
            {resume.fullName || "Your Full Name"}
          </h2>
          <p className="text-xs font-bold text-purple-700 mt-0.5">{resume.headline}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 text-[11px] text-slate-600">
            {resume.email && <span>{resume.email}</span>}
            {resume.phone && <span>• {resume.phone}</span>}
            {resume.location && <span>• {resume.location}</span>}
            {resume.github && <span>• <a href={resume.github} className="text-purple-600 underline">GitHub / HuggingFace</a></span>}
          </div>
        </div>

        {resume.summary && (
          <div className="mt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-900 border-b border-purple-200 pb-0.5 mb-1.5">
              Research & Model Architecture Focus
            </h3>
            <p className="text-[11px] leading-relaxed text-slate-700">{resume.summary}</p>
          </div>
        )}

        {resume.experiences?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-900 border-b border-purple-200 pb-0.5 mb-2">
              Machine Learning Experience
            </h3>
            <div className="space-y-3">
              {resume.experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-slate-900">
                      {exp.role} <span className="text-purple-700 font-medium">| {exp.company}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{exp.duration}</span>
                  </div>
                  <ul className="mt-1 list-disc list-outside pl-4 space-y-1 text-[11px] text-slate-700 leading-snug">
                    {exp.bullets.filter(b => b.trim()).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {resume.projects?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-900 border-b border-purple-200 pb-0.5 mb-2">
              Neural Models & AI Systems
            </h3>
            <div className="space-y-2.5">
              {resume.projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-slate-900">
                      {proj.name} {proj.tech && <span className="font-mono text-[10px] text-purple-700">({proj.tech})</span>}
                    </span>
                    {proj.link && <span className="text-[10px] text-purple-600 underline">Code</span>}
                  </div>
                  <ul className="mt-1 list-disc list-outside pl-4 space-y-0.5 text-[11px] text-slate-700 leading-snug">
                    {proj.bullets.filter(b => b.trim()).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-purple-900 border-b border-purple-200 pb-0.5 mb-1.5">
            AI / ML Stack & Computation
          </h3>
          <div className="text-[11px] text-slate-700 space-y-1">
            <div><span className="font-bold text-slate-900">Core Languages:</span> {resume.skills.languages}</div>
            <div><span className="font-bold text-slate-900">Deep Learning Frameworks:</span> {resume.skills.frameworks}</div>
            <div><span className="font-bold text-slate-900">Vector Stores & Cloud Compute:</span> {resume.skills.databases}, {resume.skills.tools}</div>
          </div>
        </div>

        {resume.education?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-900 border-b border-purple-200 pb-0.5 mb-1.5">
              Education & Academic Background
            </h3>
            <div className="space-y-1 text-xs">
              {resume.education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline text-[11px]">
                  <div><span className="font-bold text-slate-900">{edu.degree}</span> • <span>{edu.institution}</span></div>
                  <div className="text-slate-500">{edu.duration}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // TEMPLATE 8: CYBERSECURITY & SYSTEMS
  // -------------------------------------------------------------
  if (template === "cyber") {
    return (
      <div className="rounded-3xl border border-white/15 bg-white shadow-2xl text-slate-900 p-8 sm:p-10 font-sans min-h-[750px] print:m-0 print:p-0 print:border-none print:shadow-none">
        <div className="border-b-2 border-red-800 pb-3 flex justify-between items-baseline">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-red-900">
              {resume.fullName || "Your Full Name"}
            </h2>
            <p className="text-xs font-bold text-slate-700 mt-0.5 font-mono">{resume.headline}</p>
          </div>
          <span className="rounded bg-red-100 text-red-800 font-mono text-[10px] font-bold px-2 py-0.5">
            SECURITY LEVEL: HIGH
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-x-3 text-[11px] text-slate-600 font-mono">
          {resume.email && <span>{resume.email}</span>}
          {resume.phone && <span>• {resume.phone}</span>}
          {resume.location && <span>• {resume.location}</span>}
          {resume.github && <span>• <a href={resume.github} className="text-red-700 underline">GitHub Security</a></span>}
        </div>

        {resume.summary && (
          <div className="mt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-red-900 border-b border-red-200 pb-0.5 mb-1.5">
              Security Profile & Threat Architecture
            </h3>
            <p className="text-[11px] leading-relaxed text-slate-700">{resume.summary}</p>
          </div>
        )}

        {resume.experiences?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-red-900 border-b border-red-200 pb-0.5 mb-2">
              Security & Systems Engineering Experience
            </h3>
            <div className="space-y-3">
              {resume.experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-slate-900">{exp.role} <span className="text-red-800 font-medium">| {exp.company}</span></span>
                    <span className="text-[10px] text-slate-500 font-mono">{exp.duration}</span>
                  </div>
                  <ul className="mt-1 list-disc list-outside pl-4 space-y-1 text-[11px] text-slate-700 leading-snug">
                    {exp.bullets.filter(b => b.trim()).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {resume.projects?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-red-900 border-b border-red-200 pb-0.5 mb-2">
              Security Tooling & Defense Projects
            </h3>
            <div className="space-y-2.5">
              {resume.projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-slate-900">{proj.name}</span>
                    {proj.link && <span className="text-[10px] text-red-700 underline font-mono">Proof of Concept</span>}
                  </div>
                  <ul className="mt-1 list-disc list-outside pl-4 space-y-0.5 text-[11px] text-slate-700 leading-snug">
                    {proj.bullets.filter(b => b.trim()).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-red-900 border-b border-red-200 pb-0.5 mb-1.5">
            Security Toolset & Protocols
          </h3>
          <div className="text-[11px] text-slate-700 space-y-1 font-mono">
            <div><span className="font-bold text-slate-900">Languages:</span> {resume.skills.languages}</div>
            <div><span className="font-bold text-slate-900">Frameworks:</span> {resume.skills.frameworks}</div>
            <div><span className="font-bold text-slate-900">Infrastructure:</span> {resume.skills.databases}, {resume.skills.tools}</div>
          </div>
        </div>

        {resume.education?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-red-900 border-b border-red-200 pb-0.5 mb-1.5">
              Education
            </h3>
            <div className="space-y-1 text-xs">
              {resume.education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline text-[11px]">
                  <div><span className="font-bold text-slate-900">{edu.degree}</span> • <span>{edu.institution}</span></div>
                  <div className="text-slate-500">{edu.duration}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // TEMPLATE 9: HARVARD ACADEMIC & RESEARCH
  // -------------------------------------------------------------
  if (template === "academic") {
    return (
      <div className="rounded-3xl border border-white/15 bg-[#fffdfa] shadow-2xl text-slate-900 p-8 sm:p-10 font-serif min-h-[750px] print:m-0 print:p-0 print:border-none print:shadow-none">
        <div className="border-b-2 border-[#881337] pb-3 text-center">
          <h2 className="text-2xl font-bold tracking-normal text-[#881337]">
            {resume.fullName || "Your Full Name"}
          </h2>
          <p className="text-xs italic text-slate-700 mt-1">{resume.headline}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-x-3 text-[11px] text-slate-600 font-sans">
            {resume.email && <span>{resume.email}</span>}
            {resume.phone && <span>• {resume.phone}</span>}
            {resume.location && <span>• {resume.location}</span>}
            {resume.portfolio && <span>• <a href={resume.portfolio} className="text-[#881337] underline">Academic Webpage</a></span>}
          </div>
        </div>

        {resume.summary && (
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#881337] border-b border-slate-300 pb-0.5 mb-1.5 font-sans">
              Curriculum Summary & Research Statement
            </h3>
            <p className="text-[11px] leading-relaxed text-slate-800 text-justify">{resume.summary}</p>
          </div>
        )}

        {resume.education?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#881337] border-b border-slate-300 pb-0.5 mb-1.5 font-sans">
              Education & Degrees Conferred
            </h3>
            <div className="space-y-1.5 text-xs">
              {resume.education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline text-[11px]">
                  <div><span className="font-bold text-slate-900">{edu.degree}</span>, <span>{edu.institution}</span></div>
                  <div className="text-slate-600 italic font-sans">{edu.duration}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {resume.experiences?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#881337] border-b border-slate-300 pb-0.5 mb-2 font-sans">
              Professional & Research Appointments
            </h3>
            <div className="space-y-3">
              {resume.experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-slate-900">{exp.role}, <span className="font-normal italic">{exp.company}</span></span>
                    <span className="text-[10px] text-slate-600 font-sans">{exp.duration}</span>
                  </div>
                  <ul className="mt-1 list-disc list-outside pl-4 space-y-1 text-[11px] text-slate-800 leading-snug">
                    {exp.bullets.filter(b => b.trim()).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {resume.projects?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#881337] border-b border-slate-300 pb-0.5 mb-2 font-sans">
              Selected Publications & Projects
            </h3>
            <div className="space-y-2.5">
              {resume.projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-slate-900">{proj.name}</span>
                    {proj.link && <span className="text-[10px] text-[#881337] underline font-sans">Link</span>}
                  </div>
                  <ul className="mt-1 list-disc list-outside pl-4 space-y-0.5 text-[11px] text-slate-800 leading-snug">
                    {proj.bullets.filter(b => b.trim()).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#881337] border-b border-slate-300 pb-0.5 mb-1.5 font-sans">
            Technical & Scholarly Proficiencies
          </h3>
          <div className="text-[11px] text-slate-800 space-y-1 font-sans">
            <div><span className="font-bold text-slate-900">Methodologies & Languages:</span> {resume.skills.languages}</div>
            <div><span className="font-bold text-slate-900">Frameworks:</span> {resume.skills.frameworks}</div>
            <div><span className="font-bold text-slate-900">Tools:</span> {resume.skills.databases}, {resume.skills.tools}</div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // TEMPLATE 10: COMPACT TWO-COLUMN (1-Page High Density)
  // -------------------------------------------------------------
  if (template === "compact") {
    return (
      <div className="rounded-3xl border border-white/15 bg-white shadow-2xl text-slate-900 p-6 sm:p-8 font-sans min-h-[750px] print:m-0 print:p-0 print:border-none print:shadow-none">
        <div className="border-b-2 border-slate-800 pb-2 mb-3">
          <h2 className="text-2xl font-black uppercase text-slate-900 leading-tight">
            {resume.fullName || "Your Full Name"}
          </h2>
          <p className="text-xs font-bold text-slate-700">{resume.headline}</p>
        </div>

        <div className="grid grid-cols-12 gap-5 items-start">
          {/* Left Column (4 cols) */}
          <div className="col-span-4 space-y-3.5 border-r border-slate-200 pr-3.5 text-xs">
            <div>
              <h4 className="font-black text-[10px] uppercase text-slate-900 border-b border-slate-300 pb-0.5 mb-1">Contact</h4>
              <div className="text-[10px] text-slate-700 space-y-0.5 break-all">
                <div>{resume.email}</div>
                <div>{resume.phone}</div>
                <div>{resume.location}</div>
                {resume.github && <div><a href={resume.github} className="text-blue-600 underline">GitHub</a></div>}
                {resume.linkedin && <div><a href={resume.linkedin} className="text-blue-600 underline">LinkedIn</a></div>}
              </div>
            </div>

            <div>
              <h4 className="font-black text-[10px] uppercase text-slate-900 border-b border-slate-300 pb-0.5 mb-1">Skills</h4>
              <div className="text-[10px] text-slate-700 space-y-1">
                <div><b>Languages:</b> {resume.skills.languages}</div>
                <div><b>Frameworks:</b> {resume.skills.frameworks}</div>
                <div><b>Databases:</b> {resume.skills.databases}</div>
                <div><b>Tools:</b> {resume.skills.tools}</div>
              </div>
            </div>

            {resume.education?.length > 0 && (
              <div>
                <h4 className="font-black text-[10px] uppercase text-slate-900 border-b border-slate-300 pb-0.5 mb-1">Education</h4>
                {resume.education.map((edu) => (
                  <div key={edu.id} className="text-[10px] text-slate-700 mb-1">
                    <div className="font-bold text-slate-900">{edu.degree}</div>
                    <div>{edu.institution}</div>
                    <div className="text-slate-500">{edu.duration}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column (8 cols) */}
          <div className="col-span-8 space-y-3">
            {resume.summary && (
              <div>
                <h4 className="font-black text-[10px] uppercase text-slate-900 border-b border-slate-300 pb-0.5 mb-1">Executive Summary</h4>
                <p className="text-[10px] text-slate-700 leading-snug">{resume.summary}</p>
              </div>
            )}

            {resume.experiences?.length > 0 && (
              <div>
                <h4 className="font-black text-[10px] uppercase text-slate-900 border-b border-slate-300 pb-0.5 mb-1">Experience</h4>
                <div className="space-y-2">
                  {resume.experiences.map((exp) => (
                    <div key={exp.id}>
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="font-bold text-slate-900">{exp.role}</span>
                        <span className="text-[9px] text-slate-500">{exp.duration}</span>
                      </div>
                      <p className="text-[10px] font-medium text-slate-600">{exp.company}</p>
                      <ul className="mt-0.5 list-disc list-outside pl-3 space-y-0.5 text-[10px] text-slate-700 leading-tight">
                        {exp.bullets.filter(b => b.trim()).map((b, idx) => (
                          <li key={idx}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resume.projects?.length > 0 && (
              <div>
                <h4 className="font-black text-[10px] uppercase text-slate-900 border-b border-slate-300 pb-0.5 mb-1">Key Projects</h4>
                <div className="space-y-1.5">
                  {resume.projects.map((proj) => (
                    <div key={proj.id}>
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="font-bold text-slate-900">{proj.name}</span>
                        {proj.link && <span className="text-[9px] text-blue-600 underline">Link</span>}
                      </div>
                      <ul className="mt-0.5 list-disc list-outside pl-3 space-y-0.5 text-[10px] text-slate-700 leading-tight">
                        {proj.bullets.filter(b => b.trim()).map((b, idx) => (
                          <li key={idx}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // TEMPLATE 11: PRODUCT & UX ENGINEER (Creative Showcase)
  // -------------------------------------------------------------
  return (
    <div className="rounded-3xl border border-white/15 bg-white shadow-2xl text-slate-900 p-8 sm:p-10 font-sans min-h-[750px] print:m-0 print:p-0 print:border-none print:shadow-none">
      <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent p-5 rounded-2xl border border-amber-500/20 mb-4">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">
          {resume.fullName || "Your Full Name"}
        </h2>
        <p className="text-xs font-bold text-amber-700 mt-0.5">{resume.headline}</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
          {resume.email && <span>{resume.email}</span>}
          {resume.phone && <span>• {resume.phone}</span>}
          {resume.location && <span>• {resume.location}</span>}
          {resume.portfolio && <span>• <a href={resume.portfolio} className="text-amber-700 underline font-bold">Portfolio Showcase</a></span>}
        </div>
      </div>

      {resume.summary && (
        <div className="mt-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 border-b border-amber-200 pb-0.5 mb-1.5">
            Product & Design Systems Impact
          </h3>
          <p className="text-[11px] leading-relaxed text-slate-700">{resume.summary}</p>
        </div>
      )}

      {resume.experiences?.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 border-b border-amber-200 pb-0.5 mb-2">
            Experience & Engineering Leadership
          </h3>
          <div className="space-y-3">
            {resume.experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-slate-900">{exp.role} <span className="text-amber-700">@ {exp.company}</span></span>
                  <span className="text-[10px] text-slate-500">{exp.duration}</span>
                </div>
                <ul className="mt-1 list-disc list-outside pl-4 space-y-1 text-[11px] text-slate-700 leading-snug">
                  {exp.bullets.filter(b => b.trim()).map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {resume.projects?.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 border-b border-amber-200 pb-0.5 mb-2">
            Selected Product Launches
          </h3>
          <div className="space-y-2.5">
            {resume.projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-slate-900">{proj.name}</span>
                  {proj.link && <span className="text-[10px] text-amber-700 underline">Interactive Demo</span>}
                </div>
                <ul className="mt-1 list-disc list-outside pl-4 space-y-0.5 text-[11px] text-slate-700 leading-snug">
                  {proj.bullets.filter(b => b.trim()).map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 border-b border-amber-200 pb-0.5 mb-1.5">
          Design & Technical Stack
        </h3>
        <div className="text-[11px] text-slate-700 space-y-1">
          <div><span className="font-bold text-slate-900">Languages & Tools:</span> {resume.skills.languages}, {resume.skills.tools}</div>
          <div><span className="font-bold text-slate-900">Frameworks:</span> {resume.skills.frameworks}</div>
        </div>
      </div>

      {resume.education?.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 border-b border-amber-200 pb-0.5 mb-1.5">
            Education
          </h3>
          <div className="space-y-1 text-xs">
            {resume.education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline text-[11px]">
                <div><span className="font-bold text-slate-900">{edu.degree}</span> • <span>{edu.institution}</span></div>
                <div className="text-slate-500">{edu.duration}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
