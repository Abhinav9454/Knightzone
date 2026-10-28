import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ShieldAlert,
  ShieldCheck,
  Trophy,
  Code2,
  HelpCircle,
  Briefcase,
  Users,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Lock,
  Layers,
  LifeBuoy,
  Activity,
  Sliders,
} from "lucide-react";
import {
  adminApi,
  contestsApi,
  problemsApi,
  quizzesApi,
  jobsApi,
  liveChatApi,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { KnightCrest } from "../components/svg";

// Import Dedicated Full-Page Workspaces
import OverviewWorkspace from "./admin/OverviewWorkspace";
import ContestsWorkspace from "./admin/ContestsWorkspace";
import ProblemsWorkspace from "./admin/ProblemsWorkspace";
import QuizzesWorkspace from "./admin/QuizzesWorkspace";
import JobsWorkspace from "./admin/JobsWorkspace";
import SupportDeskWorkspace from "./admin/SupportDeskWorkspace";
import AntiCheatWorkspace from "./admin/AntiCheatWorkspace";
import UsersWorkspace from "./admin/UsersWorkspace";
import AuditLogsWorkspace from "./admin/AuditLogsWorkspace";
import SystemConfigWorkspace from "./admin/SystemConfigWorkspace";

export default function Admin() {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const { isNight } = useTheme();
  const navigate = useNavigate();
  const { tab } = useParams();

  // Helper to map route slug to workspace tab id
  const resolveTabId = (param) => {
    if (!param) return "overview";
    const lower = param.toLowerCase();
    if (lower === "anti-cheat" || lower === "anticheat" || lower === "integrity") {
      return "integrity";
    }
    if (lower === "audit" || lower === "audit-logs" || lower === "logs") {
      return "audit";
    }
    if (lower === "config" || lower === "system-config" || lower === "settings") {
      return "config";
    }
    if (["overview", "contests", "problems", "quizzes", "jobs", "support", "users", "audit", "config"].includes(lower)) {
      return lower;
    }
    return "overview";
  };

  // Active Workspace Tab
  const [activeTab, setActiveTab] = useState(() => resolveTabId(tab));
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  // Sync tab on URL param change
  useEffect(() => {
    if (tab) {
      setActiveTab(resolveTabId(tab));
    }
  }, [tab]);

  // Primary Entities State
  const [contests, setContests] = useState([]);
  const [problems, setProblems] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [supportQueue, setSupportQueue] = useState([]);
  const [flaggedSubmissions, setFlaggedSubmissions] = useState([]);
  const [reviewFlags, setReviewFlags] = useState([]);
  const [suspiciousUsers, setSuspiciousUsers] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Child studios quick trigger
  const [contestStudioTrigger, setContestStudioTrigger] = useState(0);
  const [problemStudioTrigger, setProblemStudioTrigger] = useState(0);
  const [quizStudioTrigger, setQuizStudioTrigger] = useState(0);

  // Security Gatekeeper Check
  const designatedEmail = "admin@knightzone.dev";
  const userEmail = (user?.email || "").toLowerCase();
  const isDesignatedAdmin =
    userEmail === designatedEmail.toLowerCase() ||
    (user?.role && user.role.toUpperCase() === "ADMIN") ||
    isAdmin;

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    let slug = tabId;
    if (tabId === "integrity") slug = "anti-cheat";
    else if (tabId === "audit") slug = "audit-logs";
    else if (tabId === "config") slug = "system-config";
    navigate(`/admin/${slug}`, { replace: true });
  };

  useEffect(() => {
    if (isAuthenticated && isDesignatedAdmin) {
      loadAllAdminData();
    }
  }, [isAuthenticated, isDesignatedAdmin]);

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      setActionError("");

      const [
        contestsRes,
        problemsRes,
        quizzesRes,
        jobsRes,
        flaggedRes,
        flagsRes,
        suspiciousRes,
        peersRes,
        queueRes,
      ] = await Promise.allSettled([
        contestsApi.getAll(0, 100),
        problemsApi.getProblemSet({ page: 0, size: 100 }),
        quizzesApi.getAll(0, 100),
        jobsApi.getAll(),
        adminApi.getFlaggedSubmissions(),
        adminApi.getReviewFlags(),
        adminApi.getSuspiciousUsers(),
        adminApi.getUsers(),
        liveChatApi.getQueue(),
      ]);

      if (contestsRes.status === "fulfilled") {
        setContests(
          Array.isArray(contestsRes.value)
            ? contestsRes.value
            : contestsRes.value?.content || []
        );
      }
      if (problemsRes.status === "fulfilled") {
        setProblems(
          Array.isArray(problemsRes.value?.content)
            ? problemsRes.value.content
            : Array.isArray(problemsRes.value)
            ? problemsRes.value
            : []
        );
      }
      if (quizzesRes.status === "fulfilled") {
        setQuizzes(
          Array.isArray(quizzesRes.value)
            ? quizzesRes.value
            : quizzesRes.value?.content || []
        );
      }
      if (jobsRes.status === "fulfilled") {
        setJobs(Array.isArray(jobsRes.value) ? jobsRes.value : []);
      }
      if (flaggedRes.status === "fulfilled") {
        setFlaggedSubmissions(Array.isArray(flaggedRes.value) ? flaggedRes.value : []);
      }
      if (flagsRes.status === "fulfilled") {
        setReviewFlags(Array.isArray(flagsRes.value) ? flagsRes.value : []);
      }
      if (suspiciousRes.status === "fulfilled") {
        setSuspiciousUsers(Array.isArray(suspiciousRes.value) ? suspiciousRes.value : []);
      }
      if (peersRes.status === "fulfilled") {
        setUsersList(Array.isArray(peersRes.value) ? peersRes.value : []);
      }
      if (queueRes.status === "fulfilled") {
        setSupportQueue(Array.isArray(queueRes.value) ? queueRes.value : []);
      }
    } catch (err) {
      console.warn("Error loading admin telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(""), 4500);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(""), 4500);
    }
  };

  // --------------------------------------------------------------------------
  // ACCESS DENIED GATEKEEPER
  // --------------------------------------------------------------------------
  if (!isAuthenticated || !isDesignatedAdmin) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 mb-4 shadow-xl">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">Access Denied: Admin Portal Restricted</h2>
        <p className="text-xs text-[#aab1a1] max-w-md mt-2 mb-6 leading-relaxed">
          The Admin Portal is strictly restricted. Only the designated administrator account (
          <strong className="text-[#c5ff55]">{designatedEmail}</strong>) is authorized to access the Knightzone
          management console.
        </p>
        <div className="flex gap-3">
          <Link
            to="/login"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition"
          >
            Switch Account
          </Link>
          <Link
            to="/dashboard"
            className="rounded-xl bg-[#c5ff55] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#14170f] hover:bg-[#d5ff83] transition shadow-md shadow-[#c5ff55]/20"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Navigation Tabs Configuration
  const navTabs = [
    { id: "overview", label: "Overview", icon: Layers, count: null },
    { id: "contests", label: "Tournaments", icon: Trophy, count: contests.length },
    { id: "problems", label: "Problem Bank", icon: Code2, count: problems.length },
    { id: "quizzes", label: "Quizzes", icon: HelpCircle, count: quizzes.length },
    { id: "jobs", label: "Career Drives", icon: Briefcase, count: jobs.length },
    { id: "support", label: "Live Support Desk", icon: LifeBuoy, count: supportQueue.length },
    { id: "integrity", label: "Anti-Cheat", icon: ShieldAlert, count: flaggedSubmissions.length + reviewFlags.length },
    { id: "audit", label: "Audit Trails", icon: Activity, count: null },
    { id: "config", label: "System Config", icon: Sliders, count: null },
    { id: "users", label: "Knights & Roles", icon: Users, count: usersList.length },
  ];

  return (
    <div className={`min-h-screen ${isNight ? "bg-[#0c0f0a] text-[#f1f2ec]" : "bg-[#f6f8f4] text-slate-900"} pb-16`}>
      {/* ==================================================================== */}
      {/* TOP EXECUTIVE BANNER & GLOBAL CONTROLS                                */}
      {/* ==================================================================== */}
      <div className={`relative overflow-hidden border-b ${isNight ? "border-white/10 bg-[#121610]" : "border-slate-200 bg-white"} py-8 px-6 sm:px-10`}>
        <div className="absolute -right-8 -top-8 opacity-10 pointer-events-none">
          <KnightCrest className="w-80 h-80" glow={false} />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider mb-2 ${
                isNight
                  ? "border-purple-500/30 bg-purple-950/40 text-purple-300"
                  : "border-purple-200 bg-purple-50 text-purple-700"
              }`}>
                <ShieldCheck size={14} />
                KNIGHTZONE ENTERPRISE ADMIN PORTAL
              </div>
              <h1 className={`text-3xl font-black ${isNight ? "text-white" : "text-slate-900"} tracking-tight`}>
                Platform Control Center
              </h1>
              <p className={`text-xs ${isNight ? "text-[#aab1a1]" : "text-slate-600"} mt-1`}>
                Unified administration console for live tournaments, problem repository, assessment quizzes, careers, and live support.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={loadAllAdminData}
                disabled={loading}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition shadow-sm ${
                  isNight
                    ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <RefreshCw size={14} className={loading ? "animate-spin text-[#c5ff55]" : isNight ? "text-[#c5ff55]" : "text-emerald-600"} />
                Sync Telemetry
              </button>
            </div>
          </div>

          {/* Feedback alerts */}
          {actionSuccess && (
            <div className={`mt-4 flex items-center gap-2 rounded-2xl border p-3 text-xs font-bold animate-in fade-in ${
              isNight
                ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-400"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}>
              <CheckCircle2 size={16} />
              {actionSuccess}
            </div>
          )}
          {actionError && (
            <div className={`mt-4 flex items-center gap-2 rounded-2xl border p-3 text-xs font-bold animate-in fade-in ${
              isNight
                ? "border-rose-500/30 bg-rose-950/30 text-rose-400"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}>
              <AlertTriangle size={16} />
              {actionError}
            </div>
          )}

          {/* MASTER WORKSPACE TABS */}
          <div className={`mt-8 flex flex-wrap items-center gap-1.5 border-b ${isNight ? "border-white/10" : "border-slate-200"} no-scrollbar overflow-x-auto`}>
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 pb-3.5 px-4 text-xs font-bold transition border-b-2 whitespace-nowrap ${
                    isActive
                      ? isNight
                        ? "border-[#c5ff55] text-[#c5ff55] font-black"
                        : "border-emerald-600 text-emerald-700 font-black"
                      : isNight
                      ? "border-transparent text-[#788874] hover:text-white"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span
                      className={`rounded-full px-2 py-0.2 text-[10px] font-mono ${
                        isActive
                          ? isNight
                            ? "bg-[#c5ff55]/20 text-[#c5ff55]"
                            : "bg-emerald-100 text-emerald-800 font-bold"
                          : isNight
                          ? "bg-white/5 text-[#aab1a1]"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* DEDICATED FULL-PAGE WORKSPACES                                       */}
      {/* ==================================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* WORKSPACE 1: OVERVIEW */}
        {activeTab === "overview" && (
          <OverviewWorkspace
            contests={contests}
            problems={problems}
            quizzes={quizzes}
            jobs={jobs}
            supportQueue={supportQueue}
            flaggedSubmissions={flaggedSubmissions}
            reviewFlags={reviewFlags}
            usersList={usersList}
            setActiveTab={handleTabChange}
            onOpenContestStudio={() => {
              handleTabChange("contests");
              setContestStudioTrigger((prev) => prev + 1);
            }}
            onOpenProblemStudio={() => {
              handleTabChange("problems");
              setProblemStudioTrigger((prev) => prev + 1);
            }}
            onOpenQuizStudio={() => {
              handleTabChange("quizzes");
              setQuizStudioTrigger((prev) => prev + 1);
            }}
          />
        )}

        {/* WORKSPACE 2: CONTESTS */}
        {activeTab === "contests" && (
          <ContestsWorkspace
            contests={contests}
            onRefresh={loadAllAdminData}
            showNotification={showNotification}
            triggerStudio={contestStudioTrigger}
          />
        )}

        {/* WORKSPACE 3: PROBLEMS */}
        {activeTab === "problems" && (
          <ProblemsWorkspace
            problems={problems}
            onRefresh={loadAllAdminData}
            showNotification={showNotification}
            triggerStudio={problemStudioTrigger}
          />
        )}

        {/* WORKSPACE 4: QUIZZES */}
        {activeTab === "quizzes" && (
          <QuizzesWorkspace
            quizzes={quizzes}
            onRefresh={loadAllAdminData}
            showNotification={showNotification}
            triggerStudio={quizStudioTrigger}
          />
        )}

        {/* WORKSPACE 5: CAREER DRIVES */}
        {activeTab === "jobs" && (
          <JobsWorkspace
            jobs={jobs}
            onRefresh={loadAllAdminData}
            showNotification={showNotification}
          />
        )}

        {/* WORKSPACE 6: LIVE SUPPORT DESK */}
        {activeTab === "support" && (
          <SupportDeskWorkspace
            supportQueue={supportQueue}
            onRefresh={loadAllAdminData}
            showNotification={showNotification}
            currentUser={user}
          />
        )}

        {/* WORKSPACE 7: ANTI-CHEAT INTEGRITY */}
        {activeTab === "integrity" && (
          <AntiCheatWorkspace
            contests={contests}
            flaggedSubmissions={flaggedSubmissions}
            reviewFlags={reviewFlags}
            suspiciousUsers={suspiciousUsers}
            onRefresh={loadAllAdminData}
            showNotification={showNotification}
          />
        )}

        {/* WORKSPACE 8: USERS & ROLES */}
        {activeTab === "users" && (
          <UsersWorkspace
            usersList={usersList}
            onRefresh={loadAllAdminData}
            showNotification={showNotification}
            currentUser={user}
          />
        )}

        {/* WORKSPACE 9: SECURITY AUDIT TRAILS */}
        {activeTab === "audit" && (
          <AuditLogsWorkspace
            showNotification={showNotification}
          />
        )}

        {/* WORKSPACE 10: GLOBAL SYSTEM CONFIG & MAINTENANCE */}
        {activeTab === "config" && (
          <SystemConfigWorkspace
            showNotification={showNotification}
          />
        )}
      </div>
    </div>
  );
}
