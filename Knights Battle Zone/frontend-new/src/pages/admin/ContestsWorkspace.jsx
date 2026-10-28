import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Clock,
  History,
  Zap,
  ArrowLeft,
  Check,
  Loader2,
  Calendar,
  AlertTriangle,
  Code2,
  ExternalLink,
  Layers,
} from "lucide-react";
import { adminApi } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";

export default function ContestsWorkspace({
  contests = [],
  onRefresh = () => {},
  showNotification = () => {},
  triggerStudio = 0,
}) {
  const { isNight } = useTheme();
  const [viewMode, setViewMode] = useState("list"); // "list" | "studio" | "problem_adder"
  const [editingContestId, setEditingContestId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "LIVE" | "UPCOMING" | "COMPLETED"
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Contest Form State
  const [contestForm, setContestForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    durationMinutes: 120,
  });

  // Attached Problem State
  const [selectedContestForProblem, setSelectedContestForProblem] = useState(null);
  const [contestProblemForm, setContestProblemForm] = useState({
    title: "",
    description: "",
    difficulty: "MEDIUM",
    points: 100,
    timeLimit: 2,
    memoryLimit: 256,
    inputFormat: "Standard array or numbers on stdin",
    outputFormat: "Expected output result",
    sampleInput: "nums = [2, 7, 11, 15], target = 9",
    sampleOutput: "[0, 1]",
  });

  // Helper to determine status
  const getStatus = (c) => {
    const now = new Date();
    const start = c.startTime ? new Date(c.startTime) : null;
    const end = c.endTime ? new Date(c.endTime) : null;
    if (!start || !end) return "UPCOMING";
    if (now > end) return "COMPLETED";
    if (now >= start && now <= end) return "LIVE";
    return "UPCOMING";
  };

  // Open Full-Page Studio
  const handleOpenStudio = (contestToEdit = null) => {
    if (contestToEdit) {
      setEditingContestId(contestToEdit.id);
      setContestForm({
        title: contestToEdit.title || "",
        description: contestToEdit.description || "",
        startTime: contestToEdit.startTime ? contestToEdit.startTime.slice(0, 16) : "",
        endTime: contestToEdit.endTime ? contestToEdit.endTime.slice(0, 16) : "",
        durationMinutes: contestToEdit.durationMinutes || 120,
      });
    } else {
      setEditingContestId(null);
      const now = new Date();
      const inOneHour = new Date(now.getTime() + 3600000);
      const inTwoDays = new Date(now.getTime() + 172800000);
      setContestForm({
        title: "",
        description: "",
        startTime: inOneHour.toISOString().slice(0, 16),
        endTime: inTwoDays.toISOString().slice(0, 16),
        durationMinutes: 120,
      });
    }
    setViewMode("studio");
  };

  useEffect(() => {
    if (triggerStudio > 0) {
      handleOpenStudio(null);
    }
  }, [triggerStudio]);

  // Save Contest (Create or Update)
  const handleSaveContest = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!contestForm.title.trim()) {
      showNotification("Contest title is required", true);
      return;
    }
    try {
      setSaving(true);
      const startTimeIso = contestForm.startTime
        ? new Date(contestForm.startTime).toISOString()
        : new Date().toISOString();
      const endTimeIso = contestForm.endTime
        ? new Date(contestForm.endTime).toISOString()
        : new Date(Date.now() + 86400000).toISOString();

      const payload = {
        title: contestForm.title.trim(),
        description: contestForm.description.trim(),
        startTime: startTimeIso,
        endTime: endTimeIso,
        durationMinutes: Number(contestForm.durationMinutes) || 120,
      };

      if (editingContestId) {
        await adminApi.updateContest(editingContestId, payload);
        showNotification(`Tournament #${editingContestId} updated successfully!`);
      } else {
        await adminApi.createContest(payload);
        showNotification("New tournament created and scheduled!");
      }

      setViewMode("list");
      setEditingContestId(null);
      onRefresh();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to save contest", true);
    } finally {
      setSaving(false);
    }
  };

  // Delete Confirmation Target State
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Delete Contest trigger
  const handleDeleteContest = (id, title) => {
    setDeleteTarget({ id, title });
  };

  const confirmDeleteContest = async () => {
    if (!deleteTarget) return;
    try {
      setActionLoadingId(`del-${deleteTarget.id}`);
      await adminApi.deleteContest(deleteTarget.id);
      showNotification(`Contest #${deleteTarget.id} ("${deleteTarget.title}") permanently removed.`);
      setDeleteTarget(null);
      onRefresh();
    } catch (err) {
      showNotification(err.response?.data?.message || "Could not delete contest.", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 1-Click Make Live
  const handleMakeLive = async (contest, durationMins = 120) => {
    try {
      setActionLoadingId(`live-${contest.id}`);
      const now = new Date();
      const startTime = new Date(now.getTime() - 60000).toISOString();
      const endTime = new Date(now.getTime() + durationMins * 60000).toISOString();

      const payload = {
        title: contest.title,
        description: contest.description || "",
        startTime,
        endTime,
        durationMinutes: durationMins,
      };

      await adminApi.updateContest(contest.id, payload);
      showNotification(`⚡ Tournament #${contest.id} ("${contest.title}") is now LIVE for ${durationMins}m!`);
      onRefresh();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to make contest live", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 1-Click Extend Duration
  const handleExtendDuration = async (contest, additionalMinutes = 60) => {
    try {
      setActionLoadingId(`ext-${contest.id}`);
      const currentEnd = contest.endTime ? new Date(contest.endTime) : new Date();
      const baseTime = currentEnd > new Date() ? currentEnd : new Date();
      const newEndTime = new Date(baseTime.getTime() + additionalMinutes * 60000).toISOString();
      const newDuration = (Number(contest.durationMinutes) || 60) + additionalMinutes;

      const payload = {
        title: contest.title,
        description: contest.description || "",
        startTime: contest.startTime || new Date().toISOString(),
        endTime: newEndTime,
        durationMinutes: newDuration,
      };

      await adminApi.updateContest(contest.id, payload);
      showNotification(`⚡ Contest #${contest.id} extended by +${additionalMinutes} mins!`);
      onRefresh();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to extend contest", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Problem Adder for Contest
  const handleOpenAddProblem = (contest) => {
    setSelectedContestForProblem(contest);
    setContestProblemForm({
      title: "",
      description: "",
      difficulty: "MEDIUM",
      points: 100,
      timeLimit: 2,
      memoryLimit: 256,
      inputFormat: "Standard array or numbers on stdin",
      outputFormat: "Expected output result",
      sampleInput: "nums = [2, 7, 11, 15], target = 9",
      sampleOutput: "[0, 1]",
    });
    setViewMode("problem_adder");
  };

  const handleSaveContestProblem = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedContestForProblem) return;
    try {
      setSaving(true);
      await adminApi.addProblemToContest(selectedContestForProblem.id, {
        title: contestProblemForm.title.trim(),
        description: contestProblemForm.description.trim(),
        difficulty: contestProblemForm.difficulty.toUpperCase(),
        points: Number(contestProblemForm.points) || 100,
        timeLimit: Number(contestProblemForm.timeLimit) || 2,
        memoryLimit: Number(contestProblemForm.memoryLimit) || 256,
        inputFormat: contestProblemForm.inputFormat.trim(),
        outputFormat: contestProblemForm.outputFormat.trim(),
        sampleInput: contestProblemForm.sampleInput.trim(),
        sampleOutput: contestProblemForm.sampleOutput.trim(),
      });
      showNotification(`Problem added to tournament "${selectedContestForProblem.title}"!`);
      setViewMode("list");
      setSelectedContestForProblem(null);
      onRefresh();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to attach problem to contest", true);
    } finally {
      setSaving(false);
    }
  };

  // Filtered contests
  const filteredContests = contests.filter((c) => {
    const matchesSearch =
      (c.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(c.id).includes(searchQuery);
    const status = getStatus(c);
    const matchesStatus = statusFilter === "ALL" || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const liveCount = contests.filter((c) => getStatus(c) === "LIVE").length;
  const upcomingCount = contests.filter((c) => getStatus(c) === "UPCOMING").length;
  const completedCount = contests.filter((c) => getStatus(c) === "COMPLETED").length;

  // =========================================================================
  // VIEW 1: FULL-PAGE TOURNAMENT STUDIO (CREATE & EDIT)
  // =========================================================================
  if (viewMode === "studio") {
    const isEditing = Boolean(editingContestId);
    return (
      <div className="space-y-6">
        {/* Studio Top Control Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setViewMode("list");
                setEditingContestId(null);
              }}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-[#aab1a1] hover:bg-white/10 hover:text-white transition"
            >
              <ArrowLeft size={14} /> Back to Tournaments
            </button>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-[#788874]">
                Enterprise Studio / Contests Orchestrator
              </div>
              <h2 className="text-xl font-black text-white">
                {isEditing ? `Edit Tournament #${editingContestId}` : "Create & Schedule New Tournament"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setViewMode("list");
                setEditingContestId(null);
              }}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-[#aab1a1] hover:text-white transition"
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={handleSaveContest}
              disabled={saving || !contestForm.title.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#c5ff55] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#0c0f0a] shadow-lg shadow-[#c5ff55]/20 hover:bg-[#d5ff83] disabled:opacity-50 transition"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {isEditing ? "Save Tournament Changes" : "Publish Tournament"}
            </button>
          </div>
        </div>

        {/* Studio Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form: 8 cols */}
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 sm:p-8 shadow-xl space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8f9d8a] mb-2">
                  Tournament Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Knight Invitational Grand Prix #48"
                  value={contestForm.title}
                  onChange={(e) => setContestForm({ ...contestForm, title: e.target.value })}
                  className="w-full rounded-2xl border border-white/15 bg-black/50 p-4 font-bold text-base text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#8f9d8a]">
                    Rules, Scoring System & Problem Topics
                  </label>
                  <span className="text-[10px] text-[#788874]">Supports Markdown & Code formatting</span>
                </div>
                <textarea
                  rows={9}
                  placeholder="Specify problem topics (DP, Graphs, Strings), scoring penalty rules, ACM-ICPC timing criteria, and prize ranks..."
                  value={contestForm.description}
                  onChange={(e) => setContestForm({ ...contestForm, description: e.target.value })}
                  className="w-full rounded-2xl border border-white/15 bg-black/50 p-4 text-xs font-mono text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none leading-relaxed transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#8f9d8a] mb-2">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={1440}
                    value={contestForm.durationMinutes}
                    onChange={(e) => setContestForm({ ...contestForm, durationMinutes: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs font-bold font-mono text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#8f9d8a] mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={contestForm.startTime}
                    onChange={(e) => setContestForm({ ...contestForm, startTime: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs font-mono text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#8f9d8a] mb-2">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={contestForm.endTime}
                    onChange={(e) => setContestForm({ ...contestForm, endTime: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs font-mono text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#788874] block">
                  ⚡ 1-Click Schedule Shortcuts:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const inOneHour = new Date(now.getTime() + 3600000);
                      setContestForm({
                        ...contestForm,
                        startTime: new Date(now.getTime() - 60000).toISOString().slice(0, 16),
                        endTime: inOneHour.toISOString().slice(0, 16),
                        durationMinutes: 60,
                      });
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-bold text-white hover:border-[#c5ff55] hover:text-[#c5ff55] transition"
                  >
                    Start LIVE Now (+1 Hour)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const inTwoHours = new Date(now.getTime() + 7200000);
                      setContestForm({
                        ...contestForm,
                        startTime: new Date(now.getTime() - 60000).toISOString().slice(0, 16),
                        endTime: inTwoHours.toISOString().slice(0, 16),
                        durationMinutes: 120,
                      });
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-bold text-white hover:border-[#c5ff55] hover:text-[#c5ff55] transition"
                  >
                    Start LIVE Now (+2 Hours)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const in24Hours = new Date(now.getTime() + 86400000);
                      setContestForm({
                        ...contestForm,
                        startTime: new Date(now.getTime() - 60000).toISOString().slice(0, 16),
                        endTime: in24Hours.toISOString().slice(0, 16),
                        durationMinutes: 1440,
                      });
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-bold text-white hover:border-[#c5ff55] hover:text-[#c5ff55] transition"
                  >
                    All-Day Hackathon (+24h)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Live Preview: 4 cols */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Trophy size={14} className="text-[#c5ff55]" /> Contest Card Live Preview
              </h3>

              <div className="rounded-2xl border border-white/15 bg-black/40 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#788874]">
                    {isEditing ? `TOURNAMENT #${editingContestId}` : "NEW TOURNAMENT"}
                  </span>
                  <span className="rounded-full bg-[#c5ff55]/15 border border-[#c5ff55]/30 px-2 py-0.5 text-[10px] font-black text-[#c5ff55]">
                    {contestForm.durationMinutes || 120} MINS
                  </span>
                </div>

                <div className="font-black text-white text-base">
                  {contestForm.title || "Contest Title Placeholder"}
                </div>

                <p className="text-xs text-[#aab1a1] line-clamp-3">
                  {contestForm.description || "Contest premise and description will appear here."}
                </p>

                <div className="border-t border-white/10 pt-3 text-[10px] text-[#788874] space-y-1">
                  <div>
                    <span className="font-bold text-white/70">Start:</span>{" "}
                    {contestForm.startTime ? new Date(contestForm.startTime).toLocaleString() : "Not set"}
                  </div>
                  <div>
                    <span className="font-bold text-white/70">End:</span>{" "}
                    {contestForm.endTime ? new Date(contestForm.endTime).toLocaleString() : "Not set"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: FULL-PAGE PROBLEM ATTACHER TO CONTEST
  // =========================================================================
  if (viewMode === "problem_adder" && selectedContestForProblem) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setViewMode("list");
                setSelectedContestForProblem(null);
              }}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-[#aab1a1] hover:text-white"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-[#788874]">
                Tournament Problem Engineering
              </div>
              <h2 className="text-xl font-black text-white">
                Attach Problem to: {selectedContestForProblem.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveContestProblem}
            disabled={saving || !contestProblemForm.title.trim()}
            className="rounded-xl bg-[#c5ff55] px-6 py-2.5 text-xs font-black uppercase text-[#0c0f0a] hover:bg-[#d5ff83] transition"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : "Attach Problem"}
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#161a14] p-8 space-y-5 max-w-4xl">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8f9d8a] mb-2">
              Problem Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Knight's Minimum Chess Moves"
              value={contestProblemForm.title}
              onChange={(e) => setContestProblemForm({ ...contestProblemForm, title: e.target.value })}
              className="w-full rounded-2xl border border-white/15 bg-black/50 p-4 font-bold text-white focus:border-[#c5ff55] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#8f9d8a] mb-1.5">Difficulty</label>
              <select
                value={contestProblemForm.difficulty}
                onChange={(e) => setContestProblemForm({ ...contestProblemForm, difficulty: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs font-bold text-white"
              >
                <option value="EASY" className="bg-[#161a14]">EASY</option>
                <option value="MEDIUM" className="bg-[#161a14]">MEDIUM</option>
                <option value="HARD" className="bg-[#161a14]">HARD</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#8f9d8a] mb-1.5">Points</label>
              <input
                type="number"
                value={contestProblemForm.points}
                onChange={(e) => setContestProblemForm({ ...contestProblemForm, points: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs font-bold font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#8f9d8a] mb-1.5">Time Limit (s)</label>
              <input
                type="number"
                value={contestProblemForm.timeLimit}
                onChange={(e) => setContestProblemForm({ ...contestProblemForm, timeLimit: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs font-bold font-mono text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[#8f9d8a] mb-2">Problem Statement *</label>
            <textarea
              rows={8}
              required
              placeholder="State the algorithmic challenge, rules, input constraints..."
              value={contestProblemForm.description}
              onChange={(e) => setContestProblemForm({ ...contestProblemForm, description: e.target.value })}
              className="w-full rounded-2xl border border-white/15 bg-black/50 p-4 text-xs font-mono text-white focus:border-[#c5ff55] focus:outline-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#8f9d8a] mb-1.5">Sample Input</label>
              <textarea
                rows={3}
                value={contestProblemForm.sampleInput}
                onChange={(e) => setContestProblemForm({ ...contestProblemForm, sampleInput: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/50 p-3 font-mono text-xs text-[#c5ff55]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#8f9d8a] mb-1.5">Sample Output</label>
              <textarea
                rows={3}
                value={contestProblemForm.sampleOutput}
                onChange={(e) => setContestProblemForm({ ...contestProblemForm, sampleOutput: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/50 p-3 font-mono text-xs text-white"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: FULL-PAGE TOURNAMENTS LIST & CONTROLS
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Top Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Trophy size={22} className="text-[#c5ff55]" /> Contests & Tournaments Orchestrator
          </h2>
          <p className="text-xs text-[#aab1a1] mt-0.5">
            Manage rated coding tournaments, live schedules, proctoring parameters, and attached problems.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenStudio()}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#c5ff55] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#0c0f0a] shadow-lg shadow-[#c5ff55]/20 hover:bg-[#d5ff83] transition"
        >
          <Plus size={16} /> Create Tournament Studio
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`rounded-2xl border p-4 shadow-sm ${isNight ? "border-white/10 bg-[#161a14]" : "border-slate-200 bg-white"}`}>
          <div className={`text-[11px] font-bold ${isNight ? "text-[#788874]" : "text-slate-500"}`}>Total Tournaments</div>
          <div className={`text-2xl font-black mt-1 ${isNight ? "text-white" : "text-slate-900"}`}>{contests.length}</div>
        </div>
        <div className={`rounded-2xl border p-4 shadow-sm ${isNight ? "border-emerald-500/20 bg-emerald-500/5" : "border-emerald-200 bg-emerald-50"}`}>
          <div className={`text-[11px] font-bold ${isNight ? "text-emerald-400" : "text-emerald-700"}`}>Live Active</div>
          <div className={`text-2xl font-black mt-1 ${isNight ? "text-white" : "text-emerald-900"}`}>{liveCount}</div>
        </div>
        <div className={`rounded-2xl border p-4 shadow-sm ${isNight ? "border-amber-500/20 bg-amber-500/5" : "border-amber-200 bg-amber-50"}`}>
          <div className={`text-[11px] font-bold ${isNight ? "text-amber-400" : "text-amber-700"}`}>Upcoming Scheduled</div>
          <div className={`text-2xl font-black mt-1 ${isNight ? "text-white" : "text-amber-900"}`}>{upcomingCount}</div>
        </div>
        <div className={`rounded-2xl border p-4 shadow-sm ${isNight ? "border-white/10 bg-[#161a14]" : "border-slate-200 bg-white"}`}>
          <div className={`text-[11px] font-bold ${isNight ? "text-[#788874]" : "text-slate-500"}`}>Completed</div>
          <div className={`text-2xl font-black mt-1 ${isNight ? "text-white" : "text-slate-900"}`}>{completedCount}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border p-3 shadow-sm ${
        isNight ? "border-white/10 bg-[#161a14]" : "border-slate-200 bg-white"
      }`}>
        <div className="relative flex-1">
          <Search size={15} className={`absolute left-3.5 top-3 ${isNight ? "text-[#5a6b56]" : "text-slate-400"}`} />
          <input
            type="text"
            placeholder="Search tournament by title, ID, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-xl border pl-10 pr-4 py-2 text-xs focus:outline-none transition ${
              isNight
                ? "border-white/10 bg-black/40 text-white placeholder-[#5a6b56] focus:border-[#c5ff55]"
                : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-emerald-600"
            }`}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "ALL", label: "All Status" },
            { id: "LIVE", label: `Live (${liveCount})` },
            { id: "UPCOMING", label: `Upcoming (${upcomingCount})` },
            { id: "COMPLETED", label: `Completed (${completedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                statusFilter === tab.id
                  ? isNight
                    ? "bg-[#c5ff55] text-[#0c0f0a] font-black"
                    : "bg-emerald-600 text-white font-black"
                  : isNight
                  ? "bg-white/5 border border-white/10 text-[#aab1a1] hover:text-white"
                  : "bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tournaments Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredContests.length === 0 ? (
          <div className={`col-span-full py-16 text-center text-xs rounded-3xl border ${
            isNight ? "border-white/10 bg-[#161a14] text-[#8f9d8a]" : "border-slate-200 bg-white text-slate-500"
          }`}>
            <Trophy size={32} className={`mx-auto mb-2 ${isNight ? "text-[#5a6b56]" : "text-slate-400"}`} />
            No tournaments match the selected filters.
          </div>
        ) : (
          filteredContests.map((c) => {
            const status = getStatus(c);
            const isLive = status === "LIVE";
            const isCompleted = status === "COMPLETED";

            return (
              <div
                key={c.id}
                className={`group flex flex-col justify-between rounded-3xl border p-6 transition shadow-xs hover:shadow-lg ${
                  isNight
                    ? "border-white/10 bg-[#161a14] hover:border-[#c5ff55]/40 hover:shadow-[#c5ff55]/5"
                    : "border-slate-200 bg-white hover:border-emerald-500 hover:shadow-emerald-500/10"
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-lg border ${
                        isNight
                          ? "text-[#c5ff55] bg-black/40 border-white/10"
                          : "text-emerald-800 bg-emerald-50 border-emerald-200"
                      }`}>
                        #{c.id}
                      </span>
                      {isLive && (
                        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 text-[10px] font-black uppercase">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          LIVE NOW
                        </span>
                      )}
                      {status === "UPCOMING" && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                          <Clock size={10} /> UPCOMING
                        </span>
                      )}
                      {isCompleted && (
                        <span className="flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                          <History size={10} /> COMPLETED
                        </span>
                      )}
                    </div>

                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono border ${
                      isNight
                        ? "bg-white/5 border-white/10 text-[#aab1a1]"
                        : "bg-slate-100 border-slate-200 text-slate-600"
                    }`}>
                      {c.durationMinutes || 120} MINS
                    </span>
                  </div>

                  <h3 className={`text-base font-black transition mb-1.5 ${
                    isNight ? "text-white group-hover:text-[#c5ff55]" : "text-slate-900 group-hover:text-emerald-700"
                  }`}>
                    <Link to={`/contests/${c.id}`}>{c.title}</Link>
                  </h3>

                  <p className={`text-xs line-clamp-2 leading-relaxed mb-4 ${
                    isNight ? "text-[#aab1a1]" : "text-slate-600"
                  }`}>
                    {c.description || "No description provided."}
                  </p>

                  <div className={`border-t pt-3 grid grid-cols-2 gap-2 text-[10px] ${
                    isNight ? "border-white/10 text-[#788874]" : "border-slate-100 text-slate-500"
                  }`}>
                    <div>
                      <span className={`font-bold block ${isNight ? "text-[#8f9d8a]" : "text-slate-700"}`}>Start Date:</span>
                      {c.startTime ? new Date(c.startTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "TBD"}
                    </div>
                    <div>
                      <span className={`font-bold block ${isNight ? "text-[#8f9d8a]" : "text-slate-700"}`}>
                        {isCompleted ? "Ended At:" : "End Date:"}
                      </span>
                      {c.endTime ? new Date(c.endTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "TBD"}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Controls */}
                <div className={`mt-5 pt-4 border-t flex flex-wrap items-center justify-between gap-2 ${
                  isNight ? "border-white/10" : "border-slate-100"
                }`}>
                  <div className="flex items-center gap-1.5">
                    {/* EDIT BUTTON (Opens Full-Page Studio) */}
                    <button
                      type="button"
                      onClick={() => handleOpenStudio(c)}
                      className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                        isNight
                          ? "border-white/15 bg-white/5 text-white hover:border-[#c5ff55] hover:text-[#c5ff55]"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-600 hover:text-emerald-700"
                      }`}
                    >
                      <Edit3 size={12} /> Edit Studio
                    </button>

                    {/* Attach Problem Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenAddProblem(c)}
                      className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                        isNight
                          ? "border-white/15 bg-white/5 text-[#aab1a1] hover:text-white hover:border-white/30"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                      }`}
                    >
                      <Code2 size={12} /> Add Problem
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Live Duration Quick Extender */}
                    {isLive && (
                      <button
                        type="button"
                        onClick={() => handleExtendDuration(c, 60)}
                        disabled={actionLoadingId === `ext-${c.id}`}
                        className={`rounded-xl border px-2.5 py-1.5 text-xs font-bold transition ${
                          isNight
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        +60m
                      </button>
                    )}

                    {/* Make Live Now if completed or upcoming */}
                    {!isLive && (
                      <button
                        type="button"
                        onClick={() => handleMakeLive(c, 120)}
                        disabled={actionLoadingId === `live-${c.id}`}
                        className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black uppercase transition ${
                          isNight
                            ? "bg-[#c5ff55] text-[#0c0f0a] hover:bg-[#d5ff83] shadow-md shadow-[#c5ff55]/20"
                            : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                        }`}
                      >
                        <Zap size={12} /> Make Live
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteContest(c.id, c.title)}
                      disabled={actionLoadingId === `del-${c.id}`}
                      className={`rounded-xl border p-1.5 transition ${
                        isNight
                          ? "border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/20"
                          : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                      }`}
                      title="Delete Tournament"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ENTERPRISE CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteContest}
        title="Permanently Delete Tournament?"
        itemType="Tournament"
        itemId={deleteTarget?.id}
        itemName={deleteTarget?.title}
        loading={Boolean(actionLoadingId)}
        warningMessage="Permanently deleting this tournament will remove all problem associations, live proctoring logs, anti-cheat strikes, and student leaderboard ranks."
      />
    </div>
  );
}
