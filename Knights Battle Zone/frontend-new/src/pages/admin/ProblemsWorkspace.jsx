import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Code2,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  ArrowLeft,
  Check,
  Loader2,
  ExternalLink,
  Cpu,
  Layers,
  Sparkles,
  Terminal,
} from "lucide-react";
import { adminApi } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";

export default function ProblemsWorkspace({
  problems = [],
  onRefresh = () => {},
  showNotification = () => {},
  triggerStudio = 0,
}) {
  const { isNight } = useTheme();
  const [viewMode, setViewMode] = useState("list"); // "list" | "studio"
  const [editingProblemId, setEditingProblemId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Problem Form State
  const [problemForm, setProblemForm] = useState({
    title: "",
    description: "",
    difficulty: "MEDIUM",
    inputFormat: "Standard array or string input",
    outputFormat: "Expected output result",
    sampleInput: "nums = [2, 7, 11, 15], target = 9",
    sampleOutput: "[0, 1]",
    testCases: "nums = [2,7,11,15], target = 9 | [0,1]",
    points: 100,
    timeLimitSeconds: 2,
  });

  // Open Full-Page Studio
  const handleOpenStudio = (probToEdit = null) => {
    if (probToEdit) {
      setEditingProblemId(probToEdit.id);
      setProblemForm({
        title: probToEdit.title || "",
        description: probToEdit.description || "",
        difficulty: probToEdit.difficulty || "MEDIUM",
        inputFormat: probToEdit.inputFormat || "Standard input",
        outputFormat: probToEdit.outputFormat || "Expected output",
        sampleInput: probToEdit.sampleInput || "",
        sampleOutput: probToEdit.sampleOutput || "",
        testCases: probToEdit.testCases || `${probToEdit.sampleInput || ""} | ${probToEdit.sampleOutput || ""}`,
        points: probToEdit.points || 100,
        timeLimitSeconds: probToEdit.timeLimitSeconds || 2,
      });
    } else {
      setEditingProblemId(null);
      setProblemForm({
        title: "",
        description: "",
        difficulty: "MEDIUM",
        inputFormat: "Standard array or string input",
        outputFormat: "Expected output result",
        sampleInput: "nums = [2, 7, 11, 15], target = 9",
        sampleOutput: "[0, 1]",
        testCases: "nums = [2,7,11,15], target = 9 | [0,1]",
        points: 100,
        timeLimitSeconds: 2,
      });
    }
    setViewMode("studio");
  };

  useEffect(() => {
    if (triggerStudio > 0) {
      handleOpenStudio(null);
    }
  }, [triggerStudio]);

  // Save Problem (Create or Update)
  const handleSaveProblem = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!problemForm.title.trim() || !problemForm.description.trim()) {
      showNotification("Problem title and statement are required", true);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: problemForm.title.trim(),
        description: problemForm.description.trim(),
        difficulty: problemForm.difficulty.toUpperCase(),
        inputFormat: problemForm.inputFormat.trim(),
        outputFormat: problemForm.outputFormat.trim(),
        sampleInput: problemForm.sampleInput.trim(),
        sampleOutput: problemForm.sampleOutput.trim(),
        testCases: problemForm.testCases.trim(),
        points: Number(problemForm.points) || 100,
        timeLimitSeconds: Number(problemForm.timeLimitSeconds) || 2,
      };

      if (editingProblemId) {
        await adminApi.updateProblem(editingProblemId, payload);
        showNotification(`Problem #${editingProblemId} updated in problem bank!`);
      } else {
        await adminApi.createProblem(payload);
        showNotification("New problem created and published to problem bank!");
      }

      setViewMode("list");
      setEditingProblemId(null);
      onRefresh();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to save problem", true);
    } finally {
      setSaving(false);
    }
  };

  // Delete Confirmation Modal Target State
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Delete Problem trigger
  const handleDeleteProblem = (id, title) => {
    setDeleteTarget({ id, title });
  };

  const confirmDeleteProblem = async () => {
    if (!deleteTarget) return;
    try {
      setActionLoadingId(`del-${deleteTarget.id}`);
      await adminApi.deleteProblem(deleteTarget.id);
      showNotification(`Problem #${deleteTarget.id} ("${deleteTarget.title}") permanently removed.`);
      setDeleteTarget(null);
      onRefresh();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to delete problem.", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered problems
  const filteredProblems = problems.filter((p) => {
    const matchesSearch =
      (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.id).includes(searchQuery);
    const matchesDiff =
      difficultyFilter === "ALL" || (p.difficulty || "").toUpperCase() === difficultyFilter;
    return matchesSearch && matchesDiff;
  });

  const easyCount = problems.filter((p) => (p.difficulty || "").toUpperCase() === "EASY").length;
  const mediumCount = problems.filter((p) => (p.difficulty || "").toUpperCase() === "MEDIUM").length;
  const hardCount = problems.filter((p) => (p.difficulty || "").toUpperCase() === "HARD").length;

  // =========================================================================
  // VIEW 1: FULL-PAGE PROBLEM STUDIO (CREATE & EDIT)
  // =========================================================================
  if (viewMode === "studio") {
    const isEditing = Boolean(editingProblemId);

    return (
      <div className="space-y-6">
        {/* Studio Top Control Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setViewMode("list");
                setEditingProblemId(null);
              }}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-[#aab1a1] hover:bg-white/10 hover:text-white transition"
            >
              <ArrowLeft size={14} /> Back to Problem Bank
            </button>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-[#788874]">
                Enterprise Studio / Problem Bank Engineering
              </div>
              <h2 className="text-xl font-black text-white">
                {isEditing ? `Edit Problem #${editingProblemId}` : "Create Arena Coding Problem"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setViewMode("list");
                setEditingProblemId(null);
              }}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-[#aab1a1] hover:text-white transition"
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={handleSaveProblem}
              disabled={saving || !problemForm.title.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#c5ff55] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#0c0f0a] shadow-lg shadow-[#c5ff55]/20 hover:bg-[#d5ff83] disabled:opacity-50 transition"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {isEditing ? "Save Problem Changes" : "Save to Problem Bank"}
            </button>
          </div>
        </div>

        {/* 2 Columns Studio Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Problem Statement & Specs (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 sm:p-8 shadow-xl space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8f9d8a] mb-2">
                  Problem Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Subarray with Given XOR Sum"
                  value={problemForm.title}
                  onChange={(e) => setProblemForm({ ...problemForm, title: e.target.value })}
                  className="w-full rounded-2xl border border-white/15 bg-black/50 p-4 font-bold text-base text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#8f9d8a] mb-1.5">
                    Difficulty
                  </label>
                  <select
                    value={problemForm.difficulty}
                    onChange={(e) => setProblemForm({ ...problemForm, difficulty: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs font-bold text-white focus:border-[#c5ff55] focus:outline-none"
                  >
                    <option value="EASY" className="bg-[#161a14]">EASY</option>
                    <option value="MEDIUM" className="bg-[#161a14]">MEDIUM</option>
                    <option value="HARD" className="bg-[#161a14]">HARD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#8f9d8a] mb-1.5">
                    Points
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={1000}
                    value={problemForm.points}
                    onChange={(e) => setProblemForm({ ...problemForm, points: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs font-mono font-bold text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#8f9d8a] mb-1.5">
                    Time Limit (s)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={problemForm.timeLimitSeconds}
                    onChange={(e) => setProblemForm({ ...problemForm, timeLimitSeconds: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs font-mono font-bold text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8f9d8a] mb-2">
                  Problem Statement & Constraints *
                </label>
                <textarea
                  rows={12}
                  required
                  placeholder="Explain algorithmic challenge, expected constraints (1 <= N <= 10^5), and runtime requirements..."
                  value={problemForm.description}
                  onChange={(e) => setProblemForm({ ...problemForm, description: e.target.value })}
                  className="w-full rounded-2xl border border-white/15 bg-black/50 p-4 text-xs font-mono text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none leading-relaxed transition"
                />
              </div>
            </div>
          </div>

          {/* Right Column: I/O Formats & Test Cases (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 sm:p-8 shadow-xl space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Code2 size={14} className="text-[#c5ff55]" /> Input / Output Specs & Test Cases
              </h3>

              <div>
                <label className="block text-xs font-bold uppercase text-[#8f9d8a] mb-1.5">
                  Input Format
                </label>
                <input
                  type="text"
                  placeholder="e.g. Integer N on first line followed by N space-separated integers"
                  value={problemForm.inputFormat}
                  onChange={(e) => setProblemForm({ ...problemForm, inputFormat: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs text-white focus:border-[#c5ff55] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#8f9d8a] mb-1.5">
                  Output Format
                </label>
                <input
                  type="text"
                  placeholder="e.g. Return maximum sum as a single 64-bit integer"
                  value={problemForm.outputFormat}
                  onChange={(e) => setProblemForm({ ...problemForm, outputFormat: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs text-white focus:border-[#c5ff55] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#8f9d8a] mb-1.5">
                    Sample Input
                  </label>
                  <textarea
                    rows={4}
                    placeholder="nums = [2, 7, 11, 15]"
                    value={problemForm.sampleInput}
                    onChange={(e) => setProblemForm({ ...problemForm, sampleInput: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-3 font-mono text-xs text-[#c5ff55] focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#8f9d8a] mb-1.5">
                    Sample Output
                  </label>
                  <textarea
                    rows={4}
                    placeholder="[0, 1]"
                    value={problemForm.sampleOutput}
                    onChange={(e) => setProblemForm({ ...problemForm, sampleOutput: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-3 font-mono text-xs text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase text-[#8f9d8a]">
                    Evaluator Test Suites
                  </label>
                  <span className="text-[10px] text-[#788874]">format: input | expected_output</span>
                </div>
                <textarea
                  rows={5}
                  placeholder="nums = [2,7,11,15], target = 9 | [0,1]"
                  value={problemForm.testCases}
                  onChange={(e) => setProblemForm({ ...problemForm, testCases: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/50 p-3 font-mono text-xs text-[#e0e4dc] focus:border-[#c5ff55] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: FULL-PAGE PROBLEMS LIST & REPOSITORY
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Code2 size={22} className="text-[#c5ff55]" /> Problem Bank Engineering
          </h2>
          <p className="text-xs text-[#aab1a1] mt-0.5">
            Author, calibrate, and manage algorithmic problems across Easy, Medium, and Hard tiers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenStudio()}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#c5ff55] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#0c0f0a] shadow-lg shadow-[#c5ff55]/20 hover:bg-[#d5ff83] transition"
        >
          <Plus size={16} /> Create Problem Studio
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`rounded-2xl border p-4 shadow-sm ${isNight ? "border-white/10 bg-[#161a14]" : "border-slate-200 bg-white"}`}>
          <div className={`text-[11px] font-bold ${isNight ? "text-[#788874]" : "text-slate-500"}`}>Total Problems</div>
          <div className={`text-2xl font-black mt-1 ${isNight ? "text-white" : "text-slate-900"}`}>{problems.length}</div>
        </div>
        <div className={`rounded-2xl border p-4 shadow-sm ${isNight ? "border-emerald-500/20 bg-emerald-500/5" : "border-emerald-200 bg-emerald-50"}`}>
          <div className={`text-[11px] font-bold ${isNight ? "text-emerald-400" : "text-emerald-700"}`}>Easy Level</div>
          <div className={`text-2xl font-black mt-1 ${isNight ? "text-white" : "text-emerald-900"}`}>{easyCount}</div>
        </div>
        <div className={`rounded-2xl border p-4 shadow-sm ${isNight ? "border-amber-500/20 bg-amber-500/5" : "border-amber-200 bg-amber-50"}`}>
          <div className={`text-[11px] font-bold ${isNight ? "text-amber-400" : "text-amber-700"}`}>Medium Level</div>
          <div className={`text-2xl font-black mt-1 ${isNight ? "text-white" : "text-amber-900"}`}>{mediumCount}</div>
        </div>
        <div className={`rounded-2xl border p-4 shadow-sm ${isNight ? "border-rose-500/20 bg-rose-500/5" : "border-rose-200 bg-rose-50"}`}>
          <div className={`text-[11px] font-bold ${isNight ? "text-rose-400" : "text-rose-700"}`}>Hard Level</div>
          <div className={`text-2xl font-black mt-1 ${isNight ? "text-white" : "text-rose-900"}`}>{hardCount}</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border p-3 shadow-sm ${
        isNight ? "border-white/10 bg-[#161a14]" : "border-slate-200 bg-white"
      }`}>
        <div className="relative flex-1">
          <Search size={15} className={`absolute left-3.5 top-3 ${isNight ? "text-[#5a6b56]" : "text-slate-400"}`} />
          <input
            type="text"
            placeholder="Search problems by title or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-xl border pl-10 pr-4 py-2 text-xs focus:outline-none transition ${
              isNight
                ? "border-white/10 bg-black/40 text-white placeholder-[#5a6b56] focus:border-[#c5ff55]"
                : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-emerald-600"
            }`}
          />
        </div>

        <div className="flex items-center gap-1.5">
          {["ALL", "EASY", "MEDIUM", "HARD"].map((diff) => (
            <button
              key={diff}
              type="button"
              onClick={() => setDifficultyFilter(diff)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                difficultyFilter === diff
                  ? isNight
                    ? "bg-[#c5ff55] text-[#0c0f0a] font-black"
                    : "bg-emerald-600 text-white font-black"
                  : isNight
                  ? "bg-white/5 border border-white/10 text-[#aab1a1] hover:text-white"
                  : "bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900"
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Problems Table */}
      <div className={`rounded-3xl border overflow-hidden shadow-sm ${
        isNight ? "border-white/10 bg-[#161a14]" : "border-slate-200 bg-white"
      }`}>
        <table className="w-full text-left text-xs">
          <thead className={`border-b font-bold uppercase tracking-wider ${
            isNight ? "border-white/10 bg-black/40 text-[#788874]" : "border-slate-200 bg-slate-50 text-slate-500"
          }`}>
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Problem Title</th>
              <th className="p-4">Difficulty</th>
              <th className="p-4">Points</th>
              <th className="p-4">Time Limit</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isNight ? "divide-white/5" : "divide-slate-100"}`}>
            {filteredProblems.length === 0 ? (
              <tr>
                <td colSpan={6} className={`py-12 text-center ${isNight ? "text-[#8f9d8a]" : "text-slate-500"}`}>
                  No problems found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredProblems.map((prob) => {
                const diff = (prob.difficulty || "MEDIUM").toUpperCase();
                return (
                  <tr key={prob.id} className={`transition ${isNight ? "hover:bg-white/[0.02]" : "hover:bg-slate-50"}`}>
                    <td className={`p-4 font-mono font-bold ${isNight ? "text-[#c5ff55]" : "text-emerald-700"}`}>#{prob.id}</td>
                    <td className="p-4">
                      <div className={`font-bold text-sm transition ${
                        isNight ? "text-white hover:text-[#c5ff55]" : "text-slate-900 hover:text-emerald-700"
                      }`}>
                        <Link to={`/problems/${prob.id}`}>{prob.title}</Link>
                      </div>
                      <div className={`text-[11px] line-clamp-1 mt-0.5 ${isNight ? "text-[#788874]" : "text-slate-500"}`}>
                        {prob.description}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                          diff === "EASY"
                            ? isNight ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : diff === "MEDIUM"
                            ? isNight ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-amber-50 text-amber-700 border border-amber-200"
                            : isNight ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {diff}
                      </span>
                    </td>
                    <td className={`p-4 font-mono font-bold ${isNight ? "text-white" : "text-slate-900"}`}>{prob.points || 100}</td>
                    <td className={`p-4 font-mono ${isNight ? "text-[#aab1a1]" : "text-slate-600"}`}>{prob.timeLimitSeconds || 2}s</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* EDIT BUTTON (Opens Full-Page Studio) */}
                        <button
                          type="button"
                          onClick={() => handleOpenStudio(prob)}
                          className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                            isNight
                              ? "border-white/15 bg-white/5 text-white hover:border-[#c5ff55] hover:text-[#c5ff55]"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-600 hover:text-emerald-700"
                          }`}
                        >
                          <Edit3 size={12} /> Edit Studio
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProblem(prob.id, prob.title)}
                          disabled={actionLoadingId === `del-${prob.id}`}
                          className={`rounded-xl border p-1.5 transition ${
                            isNight
                              ? "border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/20"
                              : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                          }`}
                          title="Delete Problem"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ENTERPRISE CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteProblem}
        title="Permanently Remove Problem?"
        itemType="Problem"
        itemId={deleteTarget?.id}
        itemName={deleteTarget?.title}
        loading={Boolean(actionLoadingId)}
        warningMessage="This action will permanently delete the problem statement, test cases, and all linked candidate submission telemetry. This cannot be undone."
      />
    </div>
  );
}
