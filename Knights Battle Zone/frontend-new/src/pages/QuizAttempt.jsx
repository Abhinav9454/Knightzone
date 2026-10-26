import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Send,
  HelpCircle,
  Trophy,
  RotateCcw,
  ShieldCheck,
  Check,
  Sparkles,
  Lock,
  X,
  XCircle,
  Award,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { quizzesApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { KnightCrest, TrophyIllustration } from "../components/svg";
import { BENCHMARK_QUIZZES } from "../data/benchmarkQuizzes";

export default function QuizAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quiz state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: selectedOptionId }
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/quizzes/${id}` } });
      return;
    }
    loadQuiz();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id, isAuthenticated]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Check if ID matches a benchmark quiz
      const benchmarkMatch = BENCHMARK_QUIZZES.find(
        (b) => String(b.id) === String(id)
      );

      if (benchmarkMatch) {
        initializeQuizState(benchmarkMatch);
        return;
      }

      // 2. Fetch from backend
      try {
        const data = await quizzesApi.getById(id);
        if (data && data.questions && data.questions.length > 0) {
          initializeQuizState(data);
          return;
        }
      } catch (backendErr) {
        console.warn("Backend quiz fetch fallback to benchmark:", backendErr);
      }

      // 3. Fallback to first benchmark quiz if not found
      if (BENCHMARK_QUIZZES.length > 0) {
        initializeQuizState(BENCHMARK_QUIZZES[0]);
      } else {
        setError("Unable to find requested assessment.");
      }
    } finally {
      setLoading(false);
    }
  };

  const initializeQuizState = (quizObj) => {
    setQuiz(quizObj);
    const durationSecs = (quizObj.durationMinutes || 15) * 60;
    setTimeLeft(durationSecs);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSelectOption = (questionId, optionId) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleAutoSubmit = () => {
    submitQuiz();
  };

  const submitQuiz = async () => {
    if (isSubmitting || !quiz) return;
    try {
      setIsSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const questions = quiz.questions || [];
      const answersPayload = questions.map((q) => ({
        questionId: q.id,
        selectedOption: answers[q.id] || null,
      }));

      // Calculate score locally so that even if network or backend fails, evaluation is instant!
      let computedScore = 0;
      let totalMaxPoints = 0;
      const reviewDetails = questions.map((q) => {
        const userChoice = answers[q.id];
        const correctId = q.correctOptionId || q.options?.find((o) => o.isCorrect)?.id;
        const qPoints = q.points || 10;
        totalMaxPoints += qPoints;

        const isCorrect = correctId !== undefined ? userChoice === correctId : true;
        if (isCorrect) computedScore += qPoints;

        return {
          questionId: q.id,
          questionText: q.text,
          userChoice,
          correctOptionId: correctId,
          isCorrect,
          explanation: q.explanation || "Correct option identified based on core CS principles.",
          options: q.options,
        };
      });

      let submissionResult = {
        quizId: Number(quiz.id),
        quizTitle: quiz.title,
        score: computedScore,
        totalPoints: totalMaxPoints || 60,
        submittedAt: new Date().toISOString(),
        reviewDetails,
      };

      if (isAuthenticated) {
        try {
          const res = await quizzesApi.submitAttempt({
            quizId: Number(quiz.id),
            answers: answersPayload,
          });
          if (res) {
            submissionResult.score = res.score ?? computedScore;
            submissionResult.totalPoints = res.totalPoints ?? totalMaxPoints;
          }
        } catch (apiErr) {
          console.warn("Backend submit attempt fallback:", apiErr);
        }
      }

      // Persist to local attempts
      try {
        const stored = JSON.parse(
          localStorage.getItem("kbz_quiz_attempts") || "[]"
        );
        const newRecord = {
          id: Date.now(),
          quizId: quiz.id,
          quizTitle: quiz.title,
          score: submissionResult.score,
          totalPoints: submissionResult.totalPoints,
          submittedAt: submissionResult.submittedAt,
        };
        localStorage.setItem(
          "kbz_quiz_attempts",
          JSON.stringify([newRecord, ...stored])
        );
      } catch (localErr) {
        console.warn("LocalStorage save error:", localErr);
      }

      setResult(submissionResult);
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0f0a] flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#c5ff55] border-t-transparent" />
        <p className="text-sm font-bold text-[#aab1a1]">
          Loading assessment environment...
        </p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-[#0c0f0a] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#161a14] p-8 text-center shadow-2xl">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-400 mb-3" />
          <h3 className="text-lg font-bold text-white">
            Assessment Not Available
          </h3>
          <p className="text-xs text-[#aab1a1] mt-2 mb-6">
            {error || "The requested assessment could not be loaded."}
          </p>
          <button
            onClick={() => navigate("/quizzes")}
            className="w-full rounded-xl bg-[#c5ff55] px-4 py-2 text-xs font-black uppercase text-[#14170f] hover:bg-[#d5ff83] transition"
          >
            Back to All Quizzes
          </button>
        </div>
      </div>
    );
  }

  // ==================== RESULT / REVIEW SCREEN ====================
  if (result) {
    const score = result.score ?? 0;
    const totalPoints = result.totalPoints || 60;
    const percentage = Math.round((score / totalPoints) * 100);

    const isGrandmaster = percentage >= 80;
    const isKnight = percentage >= 60;

    return (
      <div className="min-h-screen bg-[#0c0f0a] text-[#e0e4dc] py-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Summary Card */}
          <div className="rounded-3xl border border-white/10 bg-[#161a14] p-8 shadow-sm text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#c5ff55]/10 border border-[#c5ff55]/20 text-[#c5ff55] shadow-md mb-4">
              <Trophy size={36} />
            </div>

            <span
              className={`inline-block rounded-full px-4 py-1 text-xs font-black uppercase tracking-wider mb-2 ${
                isGrandmaster
                  ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                  : isKnight
                  ? "bg-[#c5ff55]/15 text-[#c5ff55] border border-[#c5ff55]/30"
                  : "bg-amber-400/15 text-amber-300 border border-amber-400/30"
              }`}
            >
              {isGrandmaster
                ? "Grandmaster Knight"
                : isKnight
                ? "Battle Knight Tier"
                : "Apprentice Tier"}
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Assessment Completed!
            </h2>
            <p className="text-xs text-[#788071] mt-1">{quiz.title}</p>

            {/* Score Ring */}
            <div className="mt-6 flex items-center justify-center gap-6">
              <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#788071]">
                  Total Score
                </p>
                <p className="text-3xl font-black text-white">
                  {score}{" "}
                  <span className="text-base font-normal text-[#788071]">
                    / {totalPoints}
                  </span>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#788071]">
                  Accuracy
                </p>
                <p className="text-3xl font-black text-[#c5ff55]">
                  {percentage}%
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                  setCurrentIdx(0);
                  loadQuiz();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition"
              >
                <RotateCcw size={14} />
                Retake Assessment
              </button>

              <button
                onClick={() => navigate("/quizzes")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#c5ff55] px-6 py-2.5 text-xs font-black uppercase text-[#14170f] hover:bg-[#d5ff83] transition shadow-md shadow-[#c5ff55]/20"
              >
                All Quizzes
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Detailed Question Review */}
          {result.reviewDetails && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white">
                  Detailed Answer Key & Explanations
                </h3>
                <span className="text-xs font-semibold text-[#788071]">
                  {result.reviewDetails.filter((r) => r.isCorrect).length} of{" "}
                  {result.reviewDetails.length} Correct
                </span>
              </div>

              {result.reviewDetails.map((rev, qIdx) => {
                const isCorrect = rev.isCorrect;

                return (
                  <div
                    key={rev.questionId || qIdx}
                    className={`rounded-2xl border bg-[#161a14] p-6 shadow-sm transition ${
                      isCorrect ? "border-emerald-500/30" : "border-rose-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-[#c5ff55] bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-md">
                        Question {qIdx + 1}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold ${
                          isCorrect ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isCorrect ? (
                          <>
                            <CheckCircle2 size={14} /> Correct
                          </>
                        ) : (
                          <>
                            <XCircle size={14} /> Incorrect
                          </>
                        )}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-white leading-relaxed">
                      {rev.questionText}
                    </h4>

                    {/* Options list */}
                    <div className="mt-4 space-y-2">
                      {(rev.options || []).map((opt) => {
                        const wasChosen = rev.userChoice === opt.id;
                        const isActualCorrect = rev.correctOptionId === opt.id;

                        let style = "border-white/10 bg-black/40 text-[#aab1a1]";
                        if (isActualCorrect) {
                          style = "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-bold";
                        } else if (wasChosen && !isActualCorrect) {
                          style = "border-rose-500/40 bg-rose-500/10 text-rose-300 line-through";
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`flex items-center justify-between rounded-xl border p-3 text-xs ${style}`}
                          >
                            <span>{opt.text}</span>
                            {isActualCorrect && (
                              <span className="rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black uppercase">
                                Correct Answer
                              </span>
                            )}
                            {wasChosen && !isActualCorrect && (
                              <span className="rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 text-[10px] font-black uppercase">
                                Your Choice
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {rev.explanation && (
                      <div className="mt-3.5 rounded-xl bg-black/40 border border-white/10 p-3 text-xs text-[#aab1a1]">
                        <strong className="text-[#c5ff55]">Explanation: </strong>
                        {rev.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================== ACTIVE QUIZ VIEW ====================
  const questions = quiz.questions || [];
  const currentQ = questions[currentIdx];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-[#0c0f0a] text-[#e0e4dc] pb-16">
      {/* TOP STATUS BAR */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#121610]/95 backdrop-blur-md px-6 py-3.5 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (answeredCount > 0) {
                  if (confirm("Leave assessment? Your progress will be lost.")) {
                    navigate("/quizzes");
                  }
                } else {
                  navigate("/quizzes");
                }
              }}
              className="p-1.5 rounded-lg text-[#aab1a1] hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-sm font-black text-white truncate max-w-xs sm:max-w-md">
                {quiz.title}
              </h2>
              <p className="text-[10px] font-semibold text-[#788071]">
                Question {currentIdx + 1} of {totalQuestions} • {answeredCount}{" "}
                answered
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer Pill */}
            <div
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-black shadow-sm ${
                timeLeft < 120
                  ? "bg-rose-500/15 text-rose-300 border border-rose-500/30 animate-pulse"
                  : "bg-[#c5ff55]/10 text-[#c5ff55] border border-[#c5ff55]/20"
              }`}
            >
              <Clock size={15} />
              <span>{formatTime(timeLeft)}</span>
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#c5ff55] px-4 py-2 text-xs font-black uppercase text-[#14170f] hover:bg-[#d5ff83] transition shadow-md shadow-[#c5ff55]/20"
            >
              <Send size={13} />
              Submit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        {/* STEPPER / QUESTION MAP */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-[#161a14] p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#788071] mb-2.5">
            Question Navigation
          </p>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = idx === currentIdx;

              return (
                <button
                  key={q.id || idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-9 w-9 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                    isCurrent
                      ? "ring-2 ring-[#c5ff55] bg-[#c5ff55] text-[#14170f] font-black"
                      : isAnswered
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-white/5 text-[#aab1a1] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* ACTIVE QUESTION CARD */}
        {currentQ ? (
          <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#c5ff55] bg-white/5 border border-white/10 px-3 py-1 rounded-lg">
                Question {currentIdx + 1}
              </span>
              <span className="text-xs font-semibold text-[#788071]">
                {currentQ.points || 10} Point(s)
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
              {currentQ.text}
            </h3>

            {/* OPTIONS */}
            <div className="mt-6 space-y-3">
              {(currentQ.options || []).map((opt, optIdx) => {
                const isSelected = answers[currentQ.id] === opt.id;
                const optLetter = String.fromCharCode(65 + optIdx);

                return (
                  <button
                    key={opt.id || optIdx}
                    onClick={() => handleSelectOption(currentQ.id, opt.id)}
                    className={`w-full text-left flex items-center gap-4 rounded-2xl border p-4 transition ${
                      isSelected
                        ? "border-[#c5ff55] bg-[#c5ff55]/10 ring-1 ring-[#c5ff55] shadow-lg shadow-[#c5ff55]/5 text-white"
                        : "border-white/10 bg-white/[0.03] text-[#e0e4dc] hover:bg-white/[0.07] hover:border-white/20"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-black text-xs transition ${
                        isSelected
                          ? "bg-[#c5ff55] text-[#14170f]"
                          : "bg-white/5 text-[#aab1a1]"
                      }`}
                    >
                      {isSelected ? <Check size={16} /> : optLetter}
                    </div>

                    <span className="text-sm font-medium">
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* PREV / NEXT BUTTONS */}
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                className={`inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold transition ${
                  currentIdx === 0
                    ? "opacity-30 cursor-not-allowed bg-transparent text-[#788071]"
                    : "bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                <ArrowLeft size={14} />
                Previous
              </button>

              {currentIdx < totalQuestions - 1 ? (
                <button
                  onClick={() =>
                    setCurrentIdx((prev) => Math.min(totalQuestions - 1, prev + 1))
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#c5ff55] px-5 py-2 text-xs font-black uppercase text-[#14170f] hover:bg-[#d5ff83] transition shadow-md shadow-[#c5ff55]/20"
                >
                  Next
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#c5ff55] px-5 py-2 text-xs font-black uppercase text-[#14170f] hover:bg-[#d5ff83] transition shadow-md shadow-[#c5ff55]/20"
                >
                  Finish & Submit
                  <CheckCircle2 size={14} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-sm text-[#788071]">
            No questions available for this assessment.
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#161a14] p-6 text-center shadow-2xl">
            <HelpCircle className="mx-auto h-12 w-12 text-[#c5ff55] mb-3" />
            <h3 className="text-lg font-black text-white">
              Submit Assessment?
            </h3>
            <p className="text-xs text-[#aab1a1] mt-1 mb-4">
              You have answered{" "}
              <strong className="text-[#c5ff55]">{answeredCount}</strong> of{" "}
              <strong className="text-white">{totalQuestions}</strong> questions.
              {answeredCount < totalQuestions && (
                <span className="block text-amber-400 font-bold mt-1">
                  Note: Unanswered questions will receive 0 points.
                </span>
              )}
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
              >
                Review Answers
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={submitQuiz}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#c5ff55] px-5 py-2 text-xs font-black uppercase text-[#14170f] hover:bg-[#d5ff83] transition shadow-md shadow-[#c5ff55]/20"
              >
                <Check size={14} />
                {isSubmitting ? "Scoring..." : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
