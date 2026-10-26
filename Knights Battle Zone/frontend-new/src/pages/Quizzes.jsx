import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HelpCircle,
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
} from "lucide-react";
import { quizzesApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { KnightCrest, TrophyIllustration } from "../components/svg";

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "attempts"
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const quizData = await quizzesApi.getAll(0, 50);
      const quizList = Array.isArray(quizData)
        ? quizData
        : quizData?.content || [];
      setQuizzes(quizList);

      if (isAuthenticated) {
        try {
          const myAttempts = await quizzesApi.getMyAttempts();
          setAttempts(Array.isArray(myAttempts) ? myAttempts : []);
        } catch (attErr) {
          console.warn("Attempts could not be loaded:", attErr);
        }
      }
    } catch (err) {
      console.error("Failed to load quizzes:", err);
      setError("Failed to fetch quizzes. Please check your backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch =
      q.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#fbfcf9] text-[#252922] pb-16">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden border-b border-[#e4e5df] bg-gradient-to-b from-[#183d34]/5 via-transparent to-transparent py-10 px-6 sm:px-10">
        <div className="absolute -right-12 -top-12 opacity-10 pointer-events-none">
          <KnightCrest className="w-80 h-80" />
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#183d34]/20 bg-[#183d34]/10 px-3 py-1 text-xs font-bold text-[#183d34] mb-3">
                <BrainCircuit size={14} className="text-[#183d34]" />
                Skill Verification & Assessments
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#183d34]">
                Coding & Concepts Quizzes
              </h1>
              <p className="mt-2 text-sm text-[#555d53] max-w-xl">
                Sharpen your core engineering fundamentals, algorithms, C/C++, Java,
                and system concepts with timed, competitive multiple-choice assessments.
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-4 rounded-2xl border border-[#dfe4de] bg-white p-4 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#183d34] text-[#c5ff55]">
                <BookOpen size={24} />
              </div>
              <div>
                <p className="text-2xl font-black text-[#183d34]">
                  {quizzes.length}
                </p>
                <p className="text-xs font-semibold text-[#8b948a] uppercase tracking-wider">
                  Active Quizzes
                </p>
              </div>
              {attempts.length > 0 && (
                <div className="border-l border-slate-200 pl-4 ml-2">
                  <p className="text-2xl font-black text-emerald-600">
                    {attempts.length}
                  </p>
                  <p className="text-xs font-semibold text-[#8b948a] uppercase tracking-wider">
                    Completed
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* TABS & SEARCH */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-[#f0f2ed] p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === "all"
                    ? "bg-white text-[#183d34] shadow-sm"
                    : "text-[#555d53] hover:text-[#252922]"
                }`}
              >
                All Quizzes ({quizzes.length})
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => setActiveTab("attempts")}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition ${
                    activeTab === "attempts"
                      ? "bg-white text-[#183d34] shadow-sm"
                      : "text-[#555d53] hover:text-[#252922]"
                  }`}
                >
                  My Attempts ({attempts.length})
                </button>
              )}
            </div>

            {activeTab === "all" && (
              <div className="relative w-full sm:w-72">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b948a]"
                />
                <input
                  type="text"
                  placeholder="Search quizzes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-[#dfe4de] bg-white focus:outline-none focus:ring-2 focus:ring-[#183d34]"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#183d34] border-t-transparent" />
            <p className="text-sm font-semibold text-[#8b948a]">
              Loading verified quizzes...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm font-bold text-red-800">{error}</p>
            <button
              onClick={loadData}
              className="mt-4 px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        ) : activeTab === "all" ? (
          filteredQuizzes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#dfe4de] bg-white p-12 text-center">
              <BrainCircuit className="mx-auto h-12 w-12 text-[#8b948a] mb-3" />
              <h3 className="text-base font-bold text-[#252922]">
                No Quizzes Found
              </h3>
              <p className="text-xs text-[#555d53] mt-1">
                {searchQuery
                  ? "Try adjusting your search query."
                  : "New quizzes are being prepared by knights administrators."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[#dfe4de] bg-white p-6 shadow-sm transition hover:shadow-md hover:border-[#183d34]/40"
                >
                  <div>
                    {/* Header tags */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#183d34] bg-[#183d34]/10 px-2.5 py-1 rounded-md">
                        <Clock size={12} />
                        {quiz.durationMinutes || 15} Mins
                      </span>
                      <span className="text-[11px] font-semibold text-[#8b948a]">
                        {quiz.questions?.length || 0} Questions
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#183d34] group-hover:text-emerald-700 transition">
                      {quiz.title}
                    </h3>
                    <p className="mt-2 text-xs text-[#555d53] line-clamp-2 leading-relaxed">
                      {quiz.description ||
                        "Test your conceptual mastery and code problem-solving speed under time pressure."}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#f0f2ed] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[#8b948a]">
                      <Sparkles size={14} className="text-amber-500" />
                      <span>MCQ Format</span>
                    </div>

                    <button
                      onClick={() => navigate(`/quizzes/${quiz.id}`)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#183d34] px-4 py-2 text-xs font-bold text-[#c5ff55] transition hover:bg-[#122e27] shadow-sm shadow-[#183d34]/20"
                    >
                      Start Quiz
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* ATTEMPTS TAB */
          attempts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#dfe4de] bg-white p-12 text-center">
              <TrophyIllustration className="mx-auto h-20 w-20 mb-3" />
              <h3 className="text-base font-bold text-[#252922]">
                No Attempts Recorded Yet
              </h3>
              <p className="text-xs text-[#555d53] mt-1 mb-4">
                You haven&apos;t taken any quizzes yet. Choose one from the list to test your skills!
              </p>
              <button
                onClick={() => setActiveTab("all")}
                className="px-4 py-2 text-xs font-bold text-[#c5ff55] bg-[#183d34] rounded-xl"
              >
                Browse Quizzes
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {attempts.map((att) => {
                const percentage = att.totalPoints
                  ? Math.round((att.score / att.totalPoints) * 100)
                  : 0;
                return (
                  <div
                    key={att.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#dfe4de] bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl font-black text-sm ${
                          percentage >= 70
                            ? "bg-emerald-100 text-emerald-800"
                            : percentage >= 40
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {percentage}%
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#183d34]">
                          Quiz Attempt #{att.id} (Quiz ID: {att.quizId})
                        </h4>
                        <p className="text-xs text-[#8b948a] mt-0.5">
                          Submitted on{" "}
                          {att.submittedAt
                            ? new Date(att.submittedAt).toLocaleDateString()
                            : "Recently"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-base font-black text-[#183d34]">
                          {att.score} / {att.totalPoints}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8b948a]">
                          Points Earned
                        </p>
                      </div>

                      <button
                        onClick={() => navigate(`/quizzes/${att.quizId}`)}
                        className="rounded-xl border border-[#dfe4de] bg-[#fbfcf9] px-3.5 py-2 text-xs font-bold text-[#183d34] hover:bg-slate-100"
                      >
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
