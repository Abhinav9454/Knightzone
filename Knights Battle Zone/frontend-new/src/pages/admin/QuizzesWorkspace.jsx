import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle,
  Plus,
  Search,
  Edit3,
  Trash2,
  ArrowLeft,
  Check,
  Loader2,
  Clock,
  History,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { adminApi } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";

export default function QuizzesWorkspace({
  quizzes = [],
  onRefresh = () => {},
  showNotification = () => {},
  triggerStudio = 0,
}) {
  const { isNight } = useTheme();
  const [viewMode, setViewMode] = useState("list"); // "list" | "studio"
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Quiz Form State
  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    durationMinutes: 20,
    passingScore: 60,
  });

  // Dynamic Questions Builder
  const [quizQuestions, setQuizQuestions] = useState([
    {
      text: "What is the amortized time complexity of inserting into a Dynamic Array (std::vector or ArrayList)?",
      points: 10,
      options: [
        { text: "O(1)", isCorrect: true },
        { text: "O(N)", isCorrect: false },
        { text: "O(log N)", isCorrect: false },
        { text: "O(N^2)", isCorrect: false },
      ],
    },
  ]);

  // Helper to determine status
  const getStatus = (q) => {
    const now = new Date();
    const start = q.startTime ? new Date(q.startTime) : null;
    const end = q.endTime ? new Date(q.endTime) : null;
    if (!start || !end) return "UPCOMING";
    if (now > end) return "COMPLETED";
    if (now >= start && now <= end) return "LIVE";
    return "UPCOMING";
  };

  // Open Full-Page Studio
  const handleOpenStudio = (quizToEdit = null) => {
    if (quizToEdit) {
      setEditingQuizId(quizToEdit.id);
      setQuizForm({
        title: quizToEdit.title || "",
        description: quizToEdit.description || "",
        startTime: quizToEdit.startTime ? quizToEdit.startTime.slice(0, 16) : "",
        endTime: quizToEdit.endTime ? quizToEdit.endTime.slice(0, 16) : "",
        durationMinutes: quizToEdit.durationMinutes || 20,
        passingScore: quizToEdit.passingScore || 60,
      });

      if (Array.isArray(quizToEdit.questions) && quizToEdit.questions.length > 0) {
        setQuizQuestions(
          quizToEdit.questions.map((q) => ({
            text: q.text || q.question || "",
            points: q.points || 10,
            options: Array.isArray(q.options)
              ? q.options.map((opt) =>
                  typeof opt === "string"
                    ? { text: opt, isCorrect: opt === q.correctAnswer }
                    : { text: opt.text || "", isCorrect: Boolean(opt.isCorrect) }
                )
              : [
                  { text: "", isCorrect: true },
                  { text: "", isCorrect: false },
                ],
          }))
        );
      } else {
        setQuizQuestions([
          {
            text: "Question 1?",
            points: 10,
            options: [
              { text: "Option A", isCorrect: true },
              { text: "Option B", isCorrect: false },
            ],
          },
        ]);
      }
    } else {
      setEditingQuizId(null);
      const now = new Date();
      const inOneDay = new Date(now.getTime() + 86400000);
      setQuizForm({
        title: "",
        description: "",
        startTime: now.toISOString().slice(0, 16),
        endTime: inOneDay.toISOString().slice(0, 16),
        durationMinutes: 20,
        passingScore: 60,
      });
      setQuizQuestions([
        {
          text: "What is the amortized time complexity of inserting into a Dynamic Array (std::vector or ArrayList)?",
          points: 10,
          options: [
            { text: "O(1)", isCorrect: true },
            { text: "O(N)", isCorrect: false },
            { text: "O(log N)", isCorrect: false },
            { text: "O(N^2)", isCorrect: false },
          ],
        },
      ]);
    }
    setViewMode("studio");
  };

  useEffect(() => {
    if (triggerStudio > 0) {
      handleOpenStudio(null);
    }
  }, [triggerStudio]);

  // Questions manipulation
  const handleAddQuestion = () => {
    setQuizQuestions((prev) => [
      ...prev,
      {
        text: "",
        points: 10,
        options: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      },
    ]);
  };

  const handleRemoveQuestion = (idx) => {
    setQuizQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionTextChange = (idx, text) => {
    setQuizQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, text } : q))
    );
  };

  const handleOptionChange = (qIdx, optIdx, text) => {
    setQuizQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOptions = q.options.map((opt, oi) =>
          oi === optIdx ? { ...opt, text } : opt
        );
        return { ...q, options: newOptions };
      })
    );
  };

  const handleMarkCorrectOption = (qIdx, optIdx) => {
    setQuizQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOptions = q.options.map((opt, oi) => ({
          ...opt,
          isCorrect: oi === optIdx,
        }));
        return { ...q, options: newOptions };
      })
    );
  };

  // Save Quiz (Create or Update)
  const handleSaveQuiz = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!quizForm.title.trim()) {
      showNotification("Quiz title is required", true);
      return;
    }

    try {
      setSaving(true);
      const startTimeIso = quizForm.startTime
        ? new Date(quizForm.startTime).toISOString()
        : new Date().toISOString();
      const endTimeIso = quizForm.endTime
        ? new Date(quizForm.endTime).toISOString()
        : new Date(Date.now() + 86400000).toISOString();

      const formattedQuestions = quizQuestions
        .filter((q) => q.text.trim())
        .map((q) => ({
          text: q.text.trim(),
          points: Number(q.points) || 10,
          options: q.options.map((opt) => ({
            text: opt.text.trim(),
            isCorrect: Boolean(opt.isCorrect),
          })),
        }));

      const payload = {
        title: quizForm.title.trim(),
        description: quizForm.description.trim(),
        startTime: startTimeIso,
        endTime: endTimeIso,
        durationMinutes: Number(quizForm.durationMinutes) || 20,
        passingScore: Number(quizForm.passingScore) || 60,
        questions: formattedQuestions.length > 0 ? formattedQuestions : undefined,
      };

      if (editingQuizId) {
        await adminApi.updateQuiz(editingQuizId, payload);
        showNotification(`Assessment Quiz #${editingQuizId} updated successfully!`);
      } else {
        await adminApi.createQuiz(payload);
        showNotification("New assessment quiz created and published!");
      }

      setViewMode("list");
      setEditingQuizId(null);
      onRefresh();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to save quiz", true);
    } finally {
      setSaving(false);
    }
  };

  // 1-Click Make Live
  const handleMakeLive = async (quiz, durationMins = 60) => {
    try {
      setActionLoadingId(`live-${quiz.id}`);
      const now = new Date();
      const startTime = new Date(now.getTime() - 60000).toISOString();
      const endTime = new Date(now.getTime() + durationMins * 60000).toISOString();

      const payload = {
        title: quiz.title,
        description: quiz.description || "",
        startTime,
        endTime,
        durationMinutes: durationMins,
        passingScore: quiz.passingScore || 60,
      };

      await adminApi.updateQuiz(quiz.id, payload);
      showNotification(`⚡ Quiz #${quiz.id} ("${quiz.title}") is now LIVE for ${durationMins}m!`);
      onRefresh();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to make quiz live", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 1-Click Extend Duration
  const handleExtendDuration = async (quiz, additionalMinutes = 60) => {
    try {
      setActionLoadingId(`ext-${quiz.id}`);
      const currentEnd = quiz.endTime ? new Date(quiz.endTime) : new Date();
      const baseTime = currentEnd > new Date() ? currentEnd : new Date();
      const newEndTime = new Date(baseTime.getTime() + additionalMinutes * 60000).toISOString();
      const newDuration = (Number(quiz.durationMinutes) || 30) + additionalMinutes;

      const payload = {
        title: quiz.title,
        description: quiz.description || "",
        startTime: quiz.startTime || new Date().toISOString(),
        endTime: newEndTime,
        durationMinutes: newDuration,
        passingScore: quiz.passingScore || 60,
      };

      await adminApi.updateQuiz(quiz.id, payload);
      showNotification(`⚡ Quiz #${quiz.id} extended by +${additionalMinutes} mins!`);
      onRefresh();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to extend quiz", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Confirmation Target State
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Delete Quiz Trigger
  const handleDeleteQuiz = (id, title) => {
    setDeleteTarget({ id, title });
  };

  const confirmDeleteQuiz = async () => {
    if (!deleteTarget) return;
    try {
      setActionLoadingId(`del-${deleteTarget.id}`);
      await adminApi.deleteQuiz(deleteTarget.id);
      showNotification(`Quiz #${deleteTarget.id} ("${deleteTarget.title}") permanently removed.`);
      setDeleteTarget(null);
      onRefresh();
    } catch (err) {
      showNotification(err.response?.data?.message || "Could not delete quiz.", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered quizzes
  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch =
      (q.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(q.id).includes(searchQuery);
    const status = getStatus(q);
    const matchesStatus = statusFilter === "ALL" || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const liveCount = quizzes.filter((q) => getStatus(q) === "LIVE").length;
  const upcomingCount = quizzes.filter((q) => getStatus(q) === "UPCOMING").length;
  const completedCount = quizzes.filter((q) => getStatus(q) === "COMPLETED").length;

  // =========================================================================
  // VIEW 1: FULL-PAGE QUIZ STUDIO (CREATE & EDIT)
  // =========================================================================
  if (viewMode === "studio") {
    const isEditing = Boolean(editingQuizId);

    return (
      <div className="space-y-6">
        {/* Studio Top Control Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setViewMode("list");
                setEditingQuizId(null);
              }}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-[#aab1a1] hover:bg-white/10 hover:text-white transition"
            >
              <ArrowLeft size={14} /> Back to Quizzes
            </button>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-[#788874]">
                Enterprise Studio / Assessment Quiz Architect
              </div>
              <h2 className="text-xl font-black text-white">
                {isEditing ? `Edit Assessment Quiz #${editingQuizId}` : "Build New Assessment Quiz"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAddQuestion}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
            >
              <Plus size={14} className="text-[#c5ff55]" /> Add Question
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("list");
                setEditingQuizId(null);
              }}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-[#aab1a1] hover:text-white transition"
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={handleSaveQuiz}
              disabled={saving || !quizForm.title.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#c5ff55] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#0c0f0a] shadow-lg shadow-[#c5ff55]/20 hover:bg-[#d5ff83] disabled:opacity-50 transition"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {isEditing ? "Save Quiz Changes" : "Publish Quiz"}
            </button>
          </div>
        </div>

        {/* Studio Body: Metadata & Question Cards */}
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Metadata Card */}
          <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 sm:p-8 shadow-xl space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8f9d8a] mb-2">
                Quiz Assessment Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Masterclass: Advanced Graph Theory & Dynamic Programming"
                value={quizForm.title}
                onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                className="w-full rounded-2xl border border-white/15 bg-black/50 p-4 font-bold text-base text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8f9d8a] mb-2">
                Description & Topics Covered
              </label>
              <textarea
                rows={3}
                placeholder="Describe syllabus, passing score criteria, and preparation tips..."
                value={quizForm.description}
                onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                className="w-full rounded-2xl border border-white/15 bg-black/50 p-3.5 text-xs text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#8f9d8a] mb-1.5">Duration (min)</label>
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={quizForm.durationMinutes}
                  onChange={(e) => setQuizForm({ ...quizForm, durationMinutes: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs font-bold font-mono text-white focus:border-[#c5ff55] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#8f9d8a] mb-1.5">Passing Score (%)</label>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={quizForm.passingScore}
                  onChange={(e) => setQuizForm({ ...quizForm, passingScore: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs font-bold font-mono text-white focus:border-[#c5ff55] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#8f9d8a] mb-1.5">Start Time</label>
                <input
                  type="datetime-local"
                  value={quizForm.startTime}
                  onChange={(e) => setQuizForm({ ...quizForm, startTime: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs font-mono text-white focus:border-[#c5ff55] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#8f9d8a] mb-1.5">End Time</label>
                <input
                  type="datetime-local"
                  value={quizForm.endTime}
                  onChange={(e) => setQuizForm({ ...quizForm, endTime: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs font-mono text-white focus:border-[#c5ff55] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Questions Header & Add Button */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Quiz Questions ({quizQuestions.length})
              </h3>
              <p className="text-xs text-[#8f9d8a]">
                Radio button marks the correct answer for evaluation.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#c5ff55] px-4 py-2 text-xs font-black uppercase text-[#0c0f0a] hover:bg-[#d5ff83] transition"
            >
              <Plus size={14} /> Add Another Question
            </button>
          </div>

          {/* Questions Cards List */}
          {quizQuestions.map((q, qIdx) => (
            <div key={qIdx} className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[#c5ff55] bg-[#c5ff55]/10 px-3 py-1 rounded-xl">
                  Question #{qIdx + 1}
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-[#aab1a1]">
                    <span>Points:</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={q.points || 10}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setQuizQuestions((prev) =>
                          prev.map((item, i) => (i === qIdx ? { ...item, points: val } : item))
                        );
                      }}
                      className="w-16 rounded-xl border border-white/15 bg-black/50 px-2 py-1 text-xs font-mono font-bold text-white text-center focus:outline-none"
                    />
                  </div>
                  {quizQuestions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/5 transition"
                      title="Delete Question"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={3}
                placeholder="Write the question prompt here..."
                value={q.text}
                onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-black/50 p-4 text-xs text-white focus:border-[#c5ff55] focus:outline-none leading-relaxed"
              />

              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase text-[#788874] block">
                  Options (Radio marks the correct answer):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                        opt.isCorrect
                          ? "border-[#c5ff55] bg-[#c5ff55]/10"
                          : "border-white/10 bg-black/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`correct-opt-${qIdx}`}
                        checked={Boolean(opt.isCorrect)}
                        onChange={() => handleMarkCorrectOption(qIdx, optIdx)}
                        className="accent-[#c5ff55] h-4 w-4 cursor-pointer"
                      />
                      <input
                        type="text"
                        placeholder={`Option ${optIdx + 1}`}
                        value={opt.text}
                        onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                        className="w-full bg-transparent text-xs text-white placeholder-[#5a6b56] focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: FULL-PAGE QUIZZES LIST & CONTROLS
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <HelpCircle size={22} className="text-[#c5ff55]" /> Assessment Quizzes Architect
          </h2>
          <p className="text-xs text-[#aab1a1] mt-0.5">
            Author and schedule multiple-choice assessments, live question banks, and passing thresholds.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenStudio()}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#c5ff55] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#0c0f0a] shadow-lg shadow-[#c5ff55]/20 hover:bg-[#d5ff83] transition"
        >
          <Plus size={16} /> Build Quiz Studio
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`rounded-2xl border p-4 shadow-sm ${isNight ? "border-white/10 bg-[#161a14]" : "border-slate-200 bg-white"}`}>
          <div className={`text-[11px] font-bold ${isNight ? "text-[#788874]" : "text-slate-500"}`}>Total Quizzes</div>
          <div className={`text-2xl font-black mt-1 ${isNight ? "text-white" : "text-slate-900"}`}>{quizzes.length}</div>
        </div>
        <div className={`rounded-2xl border p-4 shadow-sm ${isNight ? "border-emerald-500/20 bg-emerald-500/5" : "border-emerald-200 bg-emerald-50"}`}>
          <div className={`text-[11px] font-bold ${isNight ? "text-emerald-400" : "text-emerald-700"}`}>Live Now</div>
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

      {/* Search & Filter */}
      <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border p-3 shadow-sm ${
        isNight ? "border-white/10 bg-[#161a14]" : "border-slate-200 bg-white"
      }`}>
        <div className="relative flex-1">
          <Search size={15} className={`absolute left-3.5 top-3 ${isNight ? "text-[#5a6b56]" : "text-slate-400"}`} />
          <input
            type="text"
            placeholder="Search quizzes by title or ID..."
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

      {/* Quizzes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredQuizzes.length === 0 ? (
          <div className={`col-span-full py-16 text-center text-xs rounded-3xl border ${
            isNight ? "border-white/10 bg-[#161a14] text-[#8f9d8a]" : "border-slate-200 bg-white text-slate-500"
          }`}>
            <HelpCircle size={32} className={`mx-auto mb-2 ${isNight ? "text-[#5a6b56]" : "text-slate-400"}`} />
            No assessment quizzes match the selected filters.
          </div>
        ) : (
          filteredQuizzes.map((quiz) => {
            const status = getStatus(quiz);
            const isLive = status === "LIVE";
            const isCompleted = status === "COMPLETED";

            return (
              <div
                key={quiz.id}
                className={`group flex flex-col justify-between rounded-3xl border p-6 transition shadow-xs hover:shadow-lg ${
                  isNight
                    ? "border-white/10 bg-[#161a14] hover:border-[#c5ff55]/40 hover:shadow-[#c5ff55]/5"
                    : "border-slate-200 bg-white hover:border-emerald-500 hover:shadow-emerald-500/10"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-lg border ${
                        isNight
                          ? "text-[#c5ff55] bg-black/40 border-white/10"
                          : "text-emerald-800 bg-emerald-50 border-emerald-200"
                      }`}>
                        #{quiz.id}
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
                      {quiz.durationMinutes || 20} MINS • Pass: {quiz.passingScore || 60}%
                    </span>
                  </div>

                  <h3 className={`text-base font-black transition mb-1.5 ${
                    isNight ? "text-white group-hover:text-[#c5ff55]" : "text-slate-900 group-hover:text-emerald-700"
                  }`}>
                    <Link to={`/quizzes/${quiz.id}`}>{quiz.title}</Link>
                  </h3>

                  <p className={`text-xs line-clamp-2 leading-relaxed mb-4 ${
                    isNight ? "text-[#aab1a1]" : "text-slate-600"
                  }`}>
                    {quiz.description || "No description provided."}
                  </p>

                  <div className={`border-t pt-3 grid grid-cols-2 gap-2 text-[10px] ${
                    isNight ? "border-white/10 text-[#788874]" : "border-slate-100 text-slate-500"
                  }`}>
                    <div>
                      <span className={`font-bold block ${isNight ? "text-[#8f9d8a]" : "text-slate-700"}`}>Questions:</span>
                      {Array.isArray(quiz.questions) ? quiz.questions.length : "0"} items
                    </div>
                    <div>
                      <span className={`font-bold block ${isNight ? "text-[#8f9d8a]" : "text-slate-700"}`}>
                        {isCompleted ? "Ended At:" : "End Date:"}
                      </span>
                      {quiz.endTime ? new Date(quiz.endTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "TBD"}
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className={`mt-5 pt-4 border-t flex flex-wrap items-center justify-between gap-2 ${
                  isNight ? "border-white/10" : "border-slate-100"
                }`}>
                  {/* EDIT BUTTON (Opens Full-Page Studio) */}
                  <button
                    type="button"
                    onClick={() => handleOpenStudio(quiz)}
                    className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                      isNight
                        ? "border-white/15 bg-white/5 text-white hover:border-[#c5ff55] hover:text-[#c5ff55]"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-600 hover:text-emerald-700"
                    }`}
                  >
                    <Edit3 size={12} /> Edit Studio
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Live Quick Extender */}
                    {isLive && (
                      <button
                        type="button"
                        onClick={() => handleExtendDuration(quiz, 60)}
                        disabled={actionLoadingId === `ext-${quiz.id}`}
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
                        onClick={() => handleMakeLive(quiz, 60)}
                        disabled={actionLoadingId === `live-${quiz.id}`}
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
                      onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                      disabled={actionLoadingId === `del-${quiz.id}`}
                      className={`rounded-xl border p-1.5 transition ${
                        isNight
                          ? "border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/20"
                          : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                      }`}
                      title="Delete Quiz"
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
        onConfirm={confirmDeleteQuiz}
        title="Permanently Remove Assessment Quiz?"
        itemType="Quiz"
        itemId={deleteTarget?.id}
        itemName={deleteTarget?.title}
        loading={Boolean(actionLoadingId)}
        warningMessage="This will permanently delete all questions, passing criteria, and student attempt history for this quiz."
      />
    </div>
  );
}
