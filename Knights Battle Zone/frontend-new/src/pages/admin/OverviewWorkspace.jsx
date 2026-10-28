import React from "react";
import {
  Trophy,
  Code2,
  HelpCircle,
  Briefcase,
  LifeBuoy,
  ShieldAlert,
  Users,
  Plus,
  ArrowRight,
  Server,
  Zap,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function OverviewWorkspace({
  contests = [],
  problems = [],
  quizzes = [],
  jobs = [],
  supportQueue = [],
  flaggedSubmissions = [],
  reviewFlags = [],
  usersList = [],
  setActiveTab = () => {},
  onOpenContestStudio = () => {},
  onOpenProblemStudio = () => {},
  onOpenQuizStudio = () => {},
}) {
  const { isNight } = useTheme();

  const liveContestsCount = contests.filter((c) => {
    const now = new Date();
    const start = c.startTime ? new Date(c.startTime) : null;
    const end = c.endTime ? new Date(c.endTime) : null;
    return start && end && now >= start && now <= end;
  }).length;

  const liveQuizzesCount = quizzes.filter((q) => {
    const now = new Date();
    const start = q.startTime ? new Date(q.startTime) : null;
    const end = q.endTime ? new Date(q.endTime) : null;
    return start && end && now >= start && now <= end;
  }).length;

  const kpis = [
    {
      label: "Active Live Contests",
      value: liveContestsCount,
      sub: `${contests.length} total tournaments`,
      icon: Trophy,
      tab: "contests",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    },
    {
      label: "Problem Bank Bank",
      value: problems.length,
      sub: "Across Easy, Medium & Hard",
      icon: Code2,
      tab: "problems",
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25",
    },
    {
      label: "Live Quizzes",
      value: liveQuizzesCount,
      sub: `${quizzes.length} assessment sets`,
      icon: HelpCircle,
      tab: "quizzes",
      color: isNight ? "text-[#c5ff55] bg-[#c5ff55]/10 border-[#c5ff55]/25" : "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      label: "Live Support Queue",
      value: supportQueue.length,
      sub: "Incoming user tickets",
      icon: LifeBuoy,
      tab: "support",
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
    },
    {
      label: "Career Placement Drives",
      value: jobs.length,
      sub: "Active campus job postings",
      icon: Briefcase,
      tab: "jobs",
      color: "text-blue-400 bg-blue-500/10 border-blue-500/25",
    },
    {
      label: "Integrity Flags",
      value: flaggedSubmissions.length + reviewFlags.length,
      sub: "Requires moderator review",
      icon: ShieldAlert,
      tab: "integrity",
      color: "text-rose-400 bg-rose-500/10 border-rose-500/25",
    },
    {
      label: "Registered Knights",
      value: usersList.length,
      sub: "Campus coders & engineers",
      icon: Users,
      tab: "users",
      color: "text-purple-400 bg-purple-500/10 border-purple-500/25",
    },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-sm font-black uppercase tracking-wider ${isNight ? "text-[#788874]" : "text-slate-500"}`}>
            Enterprise Platform Telemetry
          </h2>
          <span className={`text-xs ${isNight ? "text-[#aab1a1]" : "text-slate-500"}`}>Real-time synchronized across all services</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div
                key={idx}
                onClick={() => setActiveTab(kpi.tab)}
                className={`group rounded-3xl border p-5 cursor-pointer transition-all shadow-xs flex flex-col justify-between ${
                  isNight
                    ? "border-white/10 bg-[#161a14] hover:border-[#c5ff55]/40 hover:bg-white/[0.03]"
                    : "border-slate-200 bg-white hover:border-emerald-500 hover:shadow-emerald-500/10"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${kpi.color}`}>
                      <Icon size={20} />
                    </div>
                    <span className={`text-[10px] font-black uppercase flex items-center gap-1 transition ${
                      isNight ? "text-[#788874] group-hover:text-[#c5ff55]" : "text-slate-400 group-hover:text-emerald-700"
                    }`}>
                      Manage <ArrowRight size={10} />
                    </span>
                  </div>
                  <div className={`text-3xl font-black ${isNight ? "text-white" : "text-slate-900"}`}>{kpi.value}</div>
                  <div className={`text-xs font-bold mt-1 ${isNight ? "text-white" : "text-slate-700"}`}>{kpi.label}</div>
                </div>
                <div className={`text-[11px] mt-3 border-t pt-2 ${isNight ? "border-white/5 text-[#788874]" : "border-slate-100 text-slate-500"}`}>
                  {kpi.sub}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Launch Studios Row */}
      <div className={`rounded-3xl border p-6 sm:p-8 shadow-xs space-y-4 ${
        isNight ? "border-white/10 bg-[#121610]" : "border-slate-200 bg-white"
      }`}>
        <h3 className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${
          isNight ? "text-white" : "text-slate-900"
        }`}>
          <Zap size={16} className={isNight ? "text-[#c5ff55]" : "text-emerald-700"} /> Quick Studio Authoring Launchers
        </h3>
        <p className={`text-xs max-w-xl ${isNight ? "text-[#aab1a1]" : "text-slate-600"}`}>
          Directly jump into full-page authoring studios to create new tournaments, code challenges, or assessment quizzes without navigating menus.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            onClick={onOpenContestStudio}
            className={`flex items-center justify-between rounded-2xl border p-4 text-left transition group ${
              isNight
                ? "border-white/10 bg-white/5 hover:border-[#c5ff55]/50 hover:bg-[#c5ff55]/10"
                : "border-slate-200 bg-slate-50 hover:border-emerald-500 hover:bg-emerald-50"
            }`}
          >
            <div>
              <div className={`font-bold text-xs transition ${
                isNight ? "text-white group-hover:text-[#c5ff55]" : "text-slate-900 group-hover:text-emerald-700"
              }`}>
                Tournament Studio
              </div>
              <div className={`text-[10px] mt-0.5 ${isNight ? "text-[#788874]" : "text-slate-500"}`}>Author & schedule live tournament</div>
            </div>
            <Plus size={16} className={isNight ? "text-[#c5ff55]" : "text-emerald-600"} />
          </button>

          <button
            type="button"
            onClick={onOpenProblemStudio}
            className={`flex items-center justify-between rounded-2xl border p-4 text-left transition group ${
              isNight
                ? "border-white/10 bg-white/5 hover:border-[#c5ff55]/50 hover:bg-[#c5ff55]/10"
                : "border-slate-200 bg-slate-50 hover:border-emerald-500 hover:bg-emerald-50"
            }`}
          >
            <div>
              <div className={`font-bold text-xs transition ${
                isNight ? "text-white group-hover:text-[#c5ff55]" : "text-slate-900 group-hover:text-emerald-700"
              }`}>
                Problem Bank Studio
              </div>
              <div className={`text-[10px] mt-0.5 ${isNight ? "text-[#788874]" : "text-slate-500"}`}>Author challenge with test cases</div>
            </div>
            <Plus size={16} className={isNight ? "text-[#c5ff55]" : "text-emerald-600"} />
          </button>

          <button
            type="button"
            onClick={onOpenQuizStudio}
            className={`flex items-center justify-between rounded-2xl border p-4 text-left transition group ${
              isNight
                ? "border-white/10 bg-white/5 hover:border-[#c5ff55]/50 hover:bg-[#c5ff55]/10"
                : "border-slate-200 bg-slate-50 hover:border-emerald-500 hover:bg-emerald-50"
            }`}
          >
            <div>
              <div className={`font-bold text-xs transition ${
                isNight ? "text-white group-hover:text-[#c5ff55]" : "text-slate-900 group-hover:text-emerald-700"
              }`}>
                Quiz Architect Studio
              </div>
              <div className={`text-[10px] mt-0.5 ${isNight ? "text-[#788874]" : "text-slate-500"}`}>Build MCQ assessment & timer</div>
            </div>
            <Plus size={16} className={isNight ? "text-[#c5ff55]" : "text-emerald-600"} />
          </button>
        </div>
      </div>

      {/* Microservice Architecture Status */}
      <div className={`rounded-3xl border p-6 shadow-xs space-y-4 ${
        isNight ? "border-white/10 bg-[#161a14]" : "border-slate-200 bg-white"
      }`}>
        <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
          isNight ? "text-white" : "text-slate-900"
        }`}>
          <Server size={14} className={isNight ? "text-[#c5ff55]" : "text-emerald-700"} /> Platform Infrastructure Health
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          {[
            { service: "Spring Backend API", port: "8080", status: "HEALTHY", version: "v3.3.4 (Java 17)" },
            { service: "MySQL Database", port: "3307", status: "HEALTHY", version: "v8.0 (InnoDB)" },
            { service: "Redis Cache & Queue", port: "6379", status: "HEALTHY", version: "v7-Alpine" },
            { service: "RabbitMQ Broker", port: "5672", status: "HEALTHY", version: "v3.13-Management" },
            { service: "Code Judge Executor", port: "Internal", status: "ONLINE", version: "Docker Isolated" },
          ].map((srv, idx) => (
            <div key={idx} className={`rounded-2xl border p-3.5 space-y-1 ${
              isNight ? "border-white/10 bg-black/40 text-white" : "border-slate-200 bg-slate-50 text-slate-900"
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-mono text-[9px] ${isNight ? "text-[#788874]" : "text-slate-500"}`}>:{srv.port}</span>
                <span className="flex items-center gap-1 text-[9px] font-black text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {srv.status}
                </span>
              </div>
              <div className={`font-bold text-xs truncate ${isNight ? "text-white" : "text-slate-900"}`}>{srv.service}</div>
              <div className={`text-[10px] font-mono ${isNight ? "text-[#788874]" : "text-slate-500"}`}>{srv.version}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
