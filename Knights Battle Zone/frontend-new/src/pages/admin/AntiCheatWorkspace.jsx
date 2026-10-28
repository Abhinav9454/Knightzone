import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  ShieldCheck,
  RefreshCw,
  UserX,
  FileCode,
  Flame,
  Maximize2,
  Copy,
  Scan,
  Loader2,
  Check,
  X,
  Filter,
  Zap,
} from "lucide-react";
import { adminApi, proctoringApi } from "../../services/api";

export default function AntiCheatWorkspace({
  contests = [],
  flaggedSubmissions = [],
  reviewFlags = [],
  suspiciousUsers = [],
  onRefresh = () => {},
  showNotification = () => {},
}) {
  const [activeSubTab, setActiveSubTab] = useState("plagiarism"); // "plagiarism" | "proctoring" | "submissions" | "flags" | "suspicious"
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Plagiarism state
  const [plagiarismFlags, setPlagiarismFlags] = useState([]);
  const [loadingPlagiarism, setLoadingPlagiarism] = useState(false);
  const [selectedContestId, setSelectedContestId] = useState(contests[0]?.id || "");
  const [scanning, setScanning] = useState(false);

  // Side-by-Side Diff Modal State
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [inspectingFlag, setInspectingFlag] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // Proctoring tab state
  const [proctoringSearch, setProctoringSearch] = useState("");

  // Load plagiarism flags on mount or when contest changes
  useEffect(() => {
    loadPlagiarismData();
  }, [selectedContestId]);

  const loadPlagiarismData = async () => {
    try {
      setLoadingPlagiarism(true);
      let data = [];
      if (selectedContestId) {
        data = await adminApi.getContestPlagiarismFlags(selectedContestId);
      } else {
        data = await adminApi.getPlagiarismFlags();
      }
      setPlagiarismFlags(Array.isArray(data) ? data : []);
    } catch {
      // Graceful fallback to initial state
      setPlagiarismFlags([]);
    } finally {
      setLoadingPlagiarism(false);
    }
  };

  const handleRunPlagiarismScan = async () => {
    if (!selectedContestId) {
      showNotification("Please select a tournament to scan", true);
      return;
    }
    try {
      setScanning(true);
      const res = await adminApi.scanContestPlagiarism(selectedContestId);
      showNotification(res.message || "Plagiarism scan complete!");
      await loadPlagiarismData();
      onRefresh();
    } catch {
      showNotification("Plagiarism scan failed or no submissions found", true);
    } finally {
      setScanning(false);
    }
  };

  const handleOpenDiffModal = async (flag) => {
    setInspectingFlag(flag);
    setDiffModalOpen(true);
    setLoadingComparison(true);
    try {
      const data = await adminApi.getPlagiarismComparison(flag.id);
      setComparisonData(data);
    } catch {
      showNotification("Could not load submission code comparison", true);
    } finally {
      setLoadingComparison(false);
    }
  };

  const handleResolvePlagiarism = async (flagId, resolution) => {
    try {
      setActionLoadingId(`plag-${flagId}`);
      await adminApi.resolvePlagiarismFlag(flagId, resolution);
      showNotification(`Flag #${flagId} marked as ${resolution}`);
      setDiffModalOpen(false);
      loadPlagiarismData();
      onRefresh();
    } catch {
      showNotification("Could not update plagiarism flag", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReviewSubmission = async (id, action) => {
    try {
      setActionLoadingId(`sub-${id}`);
      await adminApi.reviewFlaggedSubmission(id, action);
      showNotification(`Submission #${id} marked as ${action}.`);
      onRefresh();
    } catch {
      showNotification("Could not review submission", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResolveFlag = async (id) => {
    try {
      setActionLoadingId(`flag-${id}`);
      await adminApi.resolveReviewFlag(id);
      showNotification(`Review flag #${id} resolved.`);
      onRefresh();
    } catch {
      showNotification("Could not resolve flag", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDismissFlag = async (id) => {
    try {
      setActionLoadingId(`flag-${id}`);
      await adminApi.dismissReviewFlag(id);
      showNotification(`Review flag #${id} dismissed.`);
      onRefresh();
    } catch {
      showNotification("Could not dismiss flag", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <ShieldAlert size={22} className="text-rose-400" /> Integrity & Anti-Cheat Command Center
          </h2>
          <p className="text-xs text-[#aab1a1] mt-0.5">
            AST Winnowing code plagiarism matrix, full-screen 3-strike proctoring auditor, and suspicious user behavior detection.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            loadPlagiarismData();
            onRefresh();
          }}
          className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition"
        >
          <RefreshCw size={14} className="text-[#c5ff55]" /> Sync Integrity Data
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 shadow-sm">
          <div className="text-[11px] font-bold text-rose-400">Plagiarism Flags</div>
          <div className="text-2xl font-black text-white mt-1">{plagiarismFlags.length}</div>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-sm">
          <div className="text-[11px] font-bold text-amber-400">Flagged Submissions</div>
          <div className="text-2xl font-black text-white mt-1">{flaggedSubmissions.length}</div>
        </div>
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-sm">
          <div className="text-[11px] font-bold text-blue-400">Open Review Flags</div>
          <div className="text-2xl font-black text-white mt-1">{reviewFlags.length}</div>
        </div>
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 shadow-sm">
          <div className="text-[11px] font-bold text-purple-400">Suspicious Users</div>
          <div className="text-2xl font-black text-white mt-1">{suspiciousUsers.length}</div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab("plagiarism")}
          className={`pb-3 px-3 text-xs font-bold transition border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === "plagiarism"
              ? "border-[#c5ff55] text-[#c5ff55] font-black"
              : "border-transparent text-[#788874] hover:text-white"
          }`}
        >
          <Scan size={14} />
          <span>Code Plagiarism Matrix ({plagiarismFlags.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("proctoring")}
          className={`pb-3 px-3 text-xs font-bold transition border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === "proctoring"
              ? "border-amber-400 text-amber-400 font-black"
              : "border-transparent text-[#788874] hover:text-white"
          }`}
        >
          <Maximize2 size={14} />
          <span>3-Strike Proctoring Monitor</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("submissions")}
          className={`pb-3 px-3 text-xs font-bold transition border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === "submissions"
              ? "border-rose-400 text-rose-400 font-black"
              : "border-transparent text-[#788874] hover:text-white"
          }`}
        >
          <FileCode size={14} />
          <span>Flagged Submissions ({flaggedSubmissions.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("flags")}
          className={`pb-3 px-3 text-xs font-bold transition border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === "flags"
              ? "border-blue-400 text-blue-400 font-black"
              : "border-transparent text-[#788874] hover:text-white"
          }`}
        >
          <AlertTriangle size={14} />
          <span>Review Tickets ({reviewFlags.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("suspicious")}
          className={`pb-3 px-3 text-xs font-bold transition border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === "suspicious"
              ? "border-purple-400 text-purple-400 font-black"
              : "border-transparent text-[#788874] hover:text-white"
          }`}
        >
          <UserX size={14} />
          <span>Suspicious Users ({suspiciousUsers.length})</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* SUB-TAB 1: CODE PLAGIARISM & SIMILARITY MATRIX                      */}
      {/* ==================================================================== */}
      {activeSubTab === "plagiarism" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl border border-white/10 bg-[#141812]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#aab1a1]">Select Tournament:</span>
              <select
                value={selectedContestId}
                onChange={(e) => setSelectedContestId(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#0e120c] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c5ff55]"
              >
                <option value="">All Contests (Pending Flags)</option>
                {contests.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} - {c.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleRunPlagiarismScan}
              disabled={scanning || !selectedContestId}
              className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Running AST Winnowing Scan...
                </>
              ) : (
                <>
                  <Scan size={14} />
                  Trigger Plagiarism Scan
                </>
              )}
            </button>
          </div>

          {/* Plagiarism Flags Table */}
          <div className="rounded-3xl border border-white/10 bg-[#161a14] overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-black/40 font-bold uppercase tracking-wider text-[#788874]">
                <tr>
                  <th className="p-4">Flag ID</th>
                  <th className="p-4">Submission Pair</th>
                  <th className="p-4">Similarity %</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Detected At</th>
                  <th className="p-4 text-right">Side-by-Side Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loadingPlagiarism ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#8f9d8a]">
                      <Loader2 size={24} className="animate-spin mx-auto mb-2 text-[#c5ff55]" />
                      Analyzing code similarity index...
                    </td>
                  </tr>
                ) : plagiarismFlags.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#8f9d8a]">
                      <ShieldCheck size={32} className="mx-auto mb-2 text-emerald-400" />
                      Zero plagiarism detected for this tournament. All code is original.
                    </td>
                  </tr>
                ) : (
                  plagiarismFlags.map((flag) => (
                    <tr key={flag.id} className="hover:bg-white/[0.02] transition">
                      <td className="p-4 font-mono font-bold text-rose-400">#{flag.id}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">Sub #{flag.submissionId1}</span>
                          <span className="text-[#788874]">vs</span>
                          <span className="font-mono font-bold text-white">Sub #{flag.submissionId2}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full ${
                                flag.similarityScore > 85 ? "bg-rose-500" : "bg-amber-400"
                              }`}
                              style={{ width: `${Math.min(100, flag.similarityScore || 0)}%` }}
                            />
                          </div>
                          <span className="font-mono font-black text-rose-400">
                            {flag.similarityScore ? flag.similarityScore.toFixed(1) : "80+"}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                            flag.status === "RESOLVED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {flag.status || "PENDING"}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-[#aab1a1]">
                        {flag.createdAt ? new Date(flag.createdAt).toLocaleString() : "Just now"}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenDiffModal(flag)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-950/40 px-3 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-900/40 transition shadow-xs"
                        >
                          <Eye size={13} />
                          <span>Inspect Diff</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 2: 3-STRIKE PROCTORING MONITOR                               */}
      {/* ==================================================================== */}
      {activeSubTab === "proctoring" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-[#e0e4dc] leading-relaxed">
              <strong className="text-amber-300">Contest Full-Screen Proctoring Rules:</strong> Candidates are allowed a maximum of 2 warnings.
              On the <strong>3rd strike</strong> (fullscreen exit, tab switch, window blur, or copy-paste violation), the system automatically locks the code editor and records disqualification.
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Maximize2 size={16} className="text-[#c5ff55]" />
                Live Integrity & Strike Audit
              </h3>
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Filter candidate by name or email..."
                  value={proctoringSearch}
                  onChange={(e) => setProctoringSearch(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0e120c] px-3 py-1.5 text-xs text-white placeholder-[#788874]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contests.slice(0, 3).map((c, i) => (
                <div key={c.id} className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#c5ff55]">Contest #{c.id}</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Proctoring Enforced
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white line-clamp-1">{c.title}</p>
                  <div className="space-y-1.5 pt-2 border-t border-white/5 text-xs">
                    <div className="flex items-center justify-between text-[#aab1a1]">
                      <span>Max Allowed Strikes:</span>
                      <strong className="text-white">3 Strikes</strong>
                    </div>
                    <div className="flex items-center justify-between text-[#aab1a1]">
                      <span>Detection Sensor:</span>
                      <strong className="text-purple-300">HTML5 Fullscreen API</strong>
                    </div>
                    <div className="flex items-center justify-between text-[#aab1a1]">
                      <span>Auto-Action on Strike 3:</span>
                      <strong className="text-rose-400">Immediate Disqualification</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 3: FLAGGED SUBMISSIONS                                       */}
      {/* ==================================================================== */}
      {activeSubTab === "submissions" && (
        <div className="rounded-3xl border border-white/10 bg-[#161a14] overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-black/40 font-bold uppercase tracking-wider text-[#788874]">
              <tr>
                <th className="p-4">Submission</th>
                <th className="p-4">Knight / User</th>
                <th className="p-4">Similarity %</th>
                <th className="p-4">Flag Reason</th>
                <th className="p-4">Current Status</th>
                <th className="p-4 text-right">Moderator Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {flaggedSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#8f9d8a]">
                    <ShieldCheck size={32} className="mx-auto mb-2 text-emerald-400" />
                    Clean tournament! Zero flagged code submissions.
                  </td>
                </tr>
              ) : (
                flaggedSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition">
                    <td className="p-4 font-mono font-bold text-[#c5ff55]">#{sub.id}</td>
                    <td className="p-4 font-bold text-white">{sub.userName || sub.userEmail}</td>
                    <td className="p-4 font-mono font-black text-rose-400">
                      {sub.similarityScore ? `${sub.similarityScore}%` : "HIGH"}
                    </td>
                    <td className="p-4 text-xs text-[#e0e4dc]">{sub.flagReason || "Plagiarism Match"}</td>
                    <td className="p-4">
                      <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase bg-white/10 text-white">
                        {sub.status || "PENDING"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleReviewSubmission(sub.id, "DISQUALIFIED")}
                          disabled={actionLoadingId === `sub-${sub.id}`}
                          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition"
                        >
                          Disqualify
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewSubmission(sub.id, "APPROVED")}
                          disabled={actionLoadingId === `sub-${sub.id}`}
                          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
                        >
                          Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 4: REVIEW TICKETS                                            */}
      {/* ==================================================================== */}
      {activeSubTab === "flags" && (
        <div className="rounded-3xl border border-white/10 bg-[#161a14] overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-black/40 font-bold uppercase tracking-wider text-[#788874]">
              <tr>
                <th className="p-4">Flag ID</th>
                <th className="p-4">Reported By</th>
                <th className="p-4">Target Entity</th>
                <th className="p-4">Reason</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reviewFlags.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#8f9d8a]">
                    No open review tickets.
                  </td>
                </tr>
              ) : (
                reviewFlags.map((flag) => (
                  <tr key={flag.id} className="hover:bg-white/[0.02] transition">
                    <td className="p-4 font-mono font-bold text-amber-400">#{flag.id}</td>
                    <td className="p-4 font-bold text-white">{flag.reporterEmail || "System Auto"}</td>
                    <td className="p-4 text-[#aab1a1]">{flag.targetType} #{flag.targetId}</td>
                    <td className="p-4 text-xs text-[#e0e4dc]">{flag.reason}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleResolveFlag(flag.id)}
                          className="rounded-xl bg-emerald-500/20 text-emerald-400 px-3 py-1.5 text-xs font-bold hover:bg-emerald-500/30"
                        >
                          Resolve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDismissFlag(flag.id)}
                          className="rounded-xl bg-white/10 text-[#aab1a1] px-3 py-1.5 text-xs font-bold hover:bg-white/20"
                        >
                          Dismiss
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 5: SUSPICIOUS USERS                                          */}
      {/* ==================================================================== */}
      {activeSubTab === "suspicious" && (
        <div className="rounded-3xl border border-white/10 bg-[#161a14] overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-black/40 font-bold uppercase tracking-wider text-[#788874]">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Risk Score</th>
                <th className="p-4">Violation Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {suspiciousUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[#8f9d8a]">
                    No suspicious user activity detected.
                  </td>
                </tr>
              ) : (
                suspiciousUsers.map((u, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition">
                    <td className="p-4 font-bold text-white">{u.name || u.username}</td>
                    <td className="p-4 text-[#aab1a1]">{u.email}</td>
                    <td className="p-4 font-mono font-black text-rose-400">{u.riskScore || "MED"}</td>
                    <td className="p-4 text-xs text-[#e0e4dc]">{u.violationSummary || "Frequent Window Blur"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SIDE-BY-SIDE PLAGIARISM CODE COMPARISON MODAL                       */}
      {/* ==================================================================== */}
      {diffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col rounded-3xl border border-white/15 bg-[#121610] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#0e120c]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
                  <Scan size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Plagiarism Code Diff Inspector #{inspectingFlag?.id}
                  </h3>
                  <p className="text-xs text-[#aab1a1]">
                    Similarity Match:{" "}
                    <strong className="text-rose-400 font-mono">
                      {inspectingFlag?.similarityScore ? inspectingFlag.similarityScore.toFixed(1) : "80+"}%
                    </strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleResolvePlagiarism(inspectingFlag.id, "DISQUALIFIED")}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-xs font-bold transition shadow-sm"
                >
                  Confirm Plagiarism & Penalize
                </button>
                <button
                  type="button"
                  onClick={() => handleResolvePlagiarism(inspectingFlag.id, "FALSE_POSITIVE")}
                  className="rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 text-xs font-bold transition"
                >
                  Mark False Positive
                </button>
                <button
                  type="button"
                  onClick={() => setDiffModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-[#aab1a1] hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body: Side-by-Side View */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingComparison ? (
                <div className="py-20 text-center">
                  <Loader2 size={32} className="animate-spin mx-auto text-[#c5ff55] mb-2" />
                  <p className="text-xs text-[#aab1a1]">Fetching raw code AST tokens from database...</p>
                </div>
              ) : comparisonData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Candidate 1 */}
                  <div className="rounded-2xl border border-white/10 bg-black/60 p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div>
                        <p className="text-xs font-bold text-white">
                          {comparisonData.submission1?.userName || "Candidate 1"}
                        </p>
                        <p className="text-[10px] text-[#788874]">
                          {comparisonData.submission1?.userEmail}
                        </p>
                      </div>
                      <span className="font-mono text-[10px] text-[#c5ff55] font-bold">
                        Sub #{comparisonData.submission1?.id} ({comparisonData.submission1?.language || "code"})
                      </span>
                    </div>
                    <pre className="p-3 rounded-xl bg-[#090c07] border border-white/5 font-mono text-xs text-[#c2cbbe] overflow-x-auto max-h-[50vh] leading-relaxed">
                      <code>{comparisonData.submission1?.code || "// Code not found"}</code>
                    </pre>
                  </div>

                  {/* Candidate 2 */}
                  <div className="rounded-2xl border border-white/10 bg-black/60 p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div>
                        <p className="text-xs font-bold text-white">
                          {comparisonData.submission2?.userName || "Candidate 2"}
                        </p>
                        <p className="text-[10px] text-[#788874]">
                          {comparisonData.submission2?.userEmail}
                        </p>
                      </div>
                      <span className="font-mono text-[10px] text-[#c5ff55] font-bold">
                        Sub #{comparisonData.submission2?.id} ({comparisonData.submission2?.language || "code"})
                      </span>
                    </div>
                    <pre className="p-3 rounded-xl bg-[#090c07] border border-white/5 font-mono text-xs text-[#c2cbbe] overflow-x-auto max-h-[50vh] leading-relaxed">
                      <code>{comparisonData.submission2?.code || "// Code not found"}</code>
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-[#8f9d8a]">
                  No submission code available for side-by-side comparison.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
