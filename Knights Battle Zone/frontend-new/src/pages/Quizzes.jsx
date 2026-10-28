import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Award,
  CheckCircle2,
  Search,
  Sparkles,
  ArrowRight,
  BookOpen,
  Calendar,
  AlertCircle,
  TrendingUp,
  BrainCircuit,
  Cpu,
  Layers,
  Code2,
  RotateCcw,
  Check,
  Zap,
} from "lucide-react";
import { quizzesApi, adminApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { KnightCrest, TrophyIllustration, RankBadge } from "../components/svg";
import { BENCHMARK_QUIZZES } from "../data/benchmarkQuizzes";

export default function Quizzes() {
  const { isNight } = useTheme();
  const [quizzes, setQuizzes] = useState(BENCHMARK_QUIZZES);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "attempts"
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  const { isAuthenticated, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Attempt to fetch from backend
      try {
        const quizData = await quizzesApi.getAll(0, 50);
        const remoteList = Array.isArray(quizData)
          ? quizData
          : quizData?.content || [];

        if (remoteList.length > 0) {
          // Merge unique quizzes by title or id
          const combined = [...remoteList];
          BENCHMARK_QUIZZES.forEach((b) => {
            if (!combined.some((q) => q.title?.toLowerCase() === b.title.toLowerCase())) {
              combined.push(b);
            }
          });
          setQuizzes(combined);
        } else {
          setQuizzes(BENCHMARK_QUIZZES);
        }
      } catch (backendErr) {
        console.warn("Backend quizzes endpoint fallback to benchmark suite:", backendErr);
        setQuizzes(BENCHMARK_QUIZZES);
      }

      // Load attempts
      if (isAuthenticated) {
        try {
          const myAttempts = await quizzesApi.getMyAttempts();
          const attemptsList = Array.isArray(myAttempts) ? myAttempts : [];

          // Also check localStorage for local offline attempts
          const localAttempts = JSON.parse(
            localStorage.getItem("kbz_quiz_attempts") || "[]"
          );
          const mergedAttempts = [...attemptsList];
          localAttempts.forEach((la) => {
            if (!mergedAttempts.some((a) => a.id === la.id)) {
              mergedAttempts.push(la);
            }
          });

          setAttempts(mergedAttempts);
        } catch (attErr) {
          console.warn("Attempts could not be loaded from remote:", attErr);
          const localAttempts = JSON.parse(
            localStorage.getItem("kbz_quiz_attempts") || "[]"
          );
          setAttempts(localAttempts);
        }
      } else {
        const localAttempts = JSON.parse(
          localStorage.getItem("kbz_quiz_attempts") || "[]"
        );
        setAttempts(localAttempts);
      }
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    "ALL",
    "Data Structures",
    "Algorithms",
    "Systems & C++",
    "System Design",
    "Java & Backend",
  ];

  const filteredQuizzes = quizzes.filter((q) => {
    const titleMatch =
      q.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!titleMatch) return false;

    if (selectedCategory !== "ALL") {
      const qCat = q.category || "";
      if (qCat.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0c0f0a] text-[#e0e4dc] pb-16">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden border-b border-white/10 bg-[#121610] py-10 px-6 sm:px-10">
        <div className="absolute -right-12 -top-12 opacity-10 pointer-events-none">
          <KnightCrest className="w-80 h-80" />
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c5ff55]/20 bg-[#c5ff55]/[0.06] px-3 py-1 text-xs font-bold text-[#c5ff55] mb-3">
                <BrainCircuit size={14} className="text-[#c5ff55]" />
                Skill Verification & Assessments
              </div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
                Coding & Concepts <span className="text-[#c5ff55]">Quizzes</span>
              </h1>
              <p className="mt-2 text-sm text-[#aab1a1] max-w-xl">
                Sharpen your core engineering fundamentals, algorithms, system design,
                C++, Java, and architecture concepts under timed competitive test conditions.
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#161a14] p-4 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c5ff55]/10 border border-[#c5ff55]/20 text-[#c5ff55]">
                <BookOpen size={24} />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{quizzes.length}</p>
                <p className="text-xs font-semibold text-[#788071] uppercase tracking-wider">
                  Assessments
                </p>
              </div>

              {attempts.length > 0 && (
                <div className="border-l border-white/10 pl-4 ml-2">
                  <p className="text-2xl font-black text-emerald-400">
                    {attempts.length}
                  </p>
                  <p className="text-xs font-semibold text-[#788071] uppercase tracking-wider">
                    Completed
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* TABS & SEARCH */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === "all"
                    ? "bg-[#c5ff55] text-[#14170f] font-black"
                    : "text-[#aab1a1] hover:text-white"
                }`}
              >
                All Assessments ({quizzes.length})
              </button>
              <button
                onClick={() => setActiveTab("attempts")}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === "attempts"
                    ? "bg-[#c5ff55] text-[#14170f] font-black"
                    : "text-[#aab1a1] hover:text-white"
                }`}
              >
                My Attempts ({attempts.length})
              </button>
            </div>

            {activeTab === "all" && (
              <div className="relative w-full sm:w-80">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#788071]"
                />
                <input
                  type="text"
                  placeholder="Search by topic, concept, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-white/10 bg-black/40 text-white placeholder:text-[#788071] focus:outline-none focus:border-[#c5ff55]"
                />
              </div>
            )}
          </div>

          {/* CATEGORY FILTER CHIPS */}
          {activeTab === "all" && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-[#788071] uppercase tracking-wider mr-1">
                Domain:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    selectedCategory === cat
                      ? "bg-[#c5ff55] text-[#14170f] font-black"
                      : "bg-white/5 border border-white/10 text-[#aab1a1] hover:bg-white/10"
                  }`}
                >
                  {cat === "ALL" ? "All Domains" : cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#c5ff55] border-t-transparent" />
            <p className="text-sm font-semibold text-[#aab1a1]">
              Loading verified engineering quizzes...
            </p>
          </div>
        ) : activeTab === "all" ? (
          filteredQuizzes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#161a14] p-12 text-center">
              <BrainCircuit className="mx-auto h-12 w-12 text-[#788071] mb-3" />
              <h3 className="text-base font-bold text-white">No Quizzes Found</h3>
              <p className="text-xs text-[#aab1a1] mt-1">
                {searchQuery || selectedCategory !== "ALL"
                  ? "Try adjusting your search criteria or domain filter."
                  : "New assessments are continuously added."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuizzes.map((quiz) => {
                const questionCount =
                  quiz.questions?.length || (quiz.category ? 6 : 10);
                const isHard = quiz.difficulty === "HARD";

                return (
                  <div
                    key={quiz.id}
                    className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-sm transition hover:shadow-lg hover:shadow-[#c5ff55]/5 hover:border-[#c5ff55]/40"
                  >
                    <div>
                      {/* Header tags */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#c5ff55] bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">
                            <Clock size={12} />
                            {quiz.durationMinutes || 15} Mins
                          </span>

                          {quiz.endTime && new Date(quiz.endTime) < new Date() ? (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              COMPLETED
                            </span>
                          ) : quiz.startTime && quiz.endTime && new Date(quiz.startTime) <= new Date() && new Date(quiz.endTime) >= new Date() ? (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 animate-pulse">
                              ● LIVE
                            </span>
                          ) : null}
                        </div>

                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                            isHard
                              ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                              : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {quiz.difficulty || "MEDIUM"}
                        </span>
                      </div>

                      {quiz.category && (
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#788071] mb-1">
                          {quiz.category}
                        </p>
                      )}

                      <h3
                        className={`text-lg font-black transition ${
                          isNight
                            ? "text-white group-hover:text-[#c5ff55]"
                            : "text-slate-900 group-hover:text-emerald-700"
                        }`}
                      >
                        {quiz.title}
                      </h3>

                      <p className="mt-2 text-xs text-[#aab1a1] line-clamp-2 leading-relaxed">
                        {quiz.description ||
                          "Test your conceptual mastery and algorithmic speed under timed competition constraints."}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-[#788071] font-semibold">
                        <Sparkles size={14} className="text-[#c5ff55]" />
                        <span>{questionCount} MCQs</span>
                      </div>

                      <button
                        onClick={() => {
                          if (!isAuthenticated) {
                            navigate("/login", { state: { from: `/quizzes/${quiz.id}` } });
                          } else {
                            navigate(`/quizzes/${quiz.id}`);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#c5ff55] px-4 py-2 text-xs font-black uppercase text-[#14170f] transition hover:bg-[#d5ff83] shadow-md shadow-[#c5ff55]/20"
                      >
                        Start Quiz
                        <ArrowRight size={14} />
                      </button>
                    </div>

                    {/* Admin 1-Click Revive for Completed Quizzes */}
                    {isAdmin && quiz.endTime && new Date(quiz.endTime) < new Date() && (
                      <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-white/10">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                          <Zap size={11} className="text-[#c5ff55]" /> Admin Revive:
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={async () => {
                              try {
                                const now = new Date();
                                await adminApi.updateQuiz(quiz.id, {
                                  title: quiz.title,
                                  description: quiz.description || "",
                                  startTime: new Date(now.getTime() - 60000).toISOString(),
                                  endTime: new Date(now.getTime() + 3600000).toISOString(),
                                  durationMinutes: 60,
                                });
                                alert("⚡ Quiz is now LIVE for 1 hour!");
                                loadData();
                              } catch (e) {
                                alert("Failed to revive quiz: " + (e.response?.data?.message || e.message));
                              }
                            }}
                            className="rounded-lg bg-[#c5ff55] px-2 py-0.5 text-[10px] font-black text-[#14170f] hover:bg-[#d5ff83] transition"
                            title="Make live for 1 hour"
                          >
                            ⚡ +1h
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const now = new Date();
                                await adminApi.updateQuiz(quiz.id, {
                                  title: quiz.title,
                                  description: quiz.description || "",
                                  startTime: new Date(now.getTime() - 60000).toISOString(),
                                  endTime: new Date(now.getTime() + 7200000).toISOString(),
                                  durationMinutes: 120,
                                });
                                alert("⚡ Quiz is now LIVE for 2 hours!");
                                loadData();
                              } catch (e) {
                                alert("Failed to revive quiz: " + (e.response?.data?.message || e.message));
                              }
                            }}
                            className="rounded-lg bg-[#c5ff55] px-2 py-0.5 text-[10px] font-black text-[#14170f] hover:bg-[#d5ff83] transition"
                            title="Make live for 2 hours"
                          >
                            ⚡ +2h
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* ==================== ATTEMPTS TAB ==================== */
          attempts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#161a14] p-12 text-center">
              <TrophyIllustration className="mx-auto h-20 w-20 mb-3" />
              <h3 className="text-base font-bold text-white">
                No Attempts Recorded Yet
              </h3>
              <p className="text-xs text-[#aab1a1] mt-1 mb-4">
                Take an assessment to earn Knight mastery badges and prove your core engineering skills.
              </p>
              <button
                onClick={() => setActiveTab("all")}
                className="px-4 py-2 text-xs font-black uppercase text-[#14170f] bg-[#c5ff55] rounded-xl hover:bg-[#d5ff83] transition shadow-md shadow-[#c5ff55]/20"
              >
                Browse Assessments
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {attempts.map((att) => {
                const quiz = quizzes.find((q) => q.id === att.quizId);
                const score = att.score ?? 0;
                const totalPoints = att.totalPoints || 60;
                const percent = Math.round((score / totalPoints) * 100);

                const isGrandmaster = percent >= 80;
                const isKnight = percent >= 60;

                return (
                  <div
                    key={att.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#161a14] p-5 shadow-sm transition hover:border-white/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c5ff55]/10 border border-[#c5ff55]/20 text-[#c5ff55] font-black text-sm">
                        <Award size={22} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {att.quizTitle || quiz?.title || `Assessment #${att.quizId}`}
                        </h4>
                        <p className="text-xs font-semibold text-[#788071] mt-0.5">
                          Submitted on{" "}
                          {att.submittedAt
                            ? new Date(att.submittedAt).toLocaleDateString()
                            : "Recently"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Score Pill */}
                      <div className="text-right">
                        <p className="text-sm font-black text-white">
                          {score} / {totalPoints}{" "}
                          <span className="text-xs text-[#788071]">({percent}%)</span>
                        </p>
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                            isGrandmaster
                              ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                              : isKnight
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                          }`}
                        >
                          {isGrandmaster ? "Grandmaster" : isKnight ? "Knight Tier" : "Apprentice"}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          if (!isAuthenticated) {
                            navigate("/login", { state: { from: `/quizzes/${att.quizId}` } });
                          } else {
                            navigate(`/quizzes/${att.quizId}`);
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10 transition"
                      >
                        <RotateCcw size={12} />
                        Retake
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
