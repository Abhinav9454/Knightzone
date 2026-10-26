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
} from "lucide-react";
import { quizzesApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { KnightCrest, TrophyIllustration, KnightLogo } from "../components/svg";

export default function QuizAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

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
    loadQuiz();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await quizzesApi.getById(id);
      setQuiz(data);

      const durationSecs = (data.durationMinutes || 15) * 60;
      setTimeLeft(durationSecs);

      // Start countdown
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
    } catch (err) {
      console.error("Failed to load quiz details:", err);
      setError(
        err.response?.status === 401
          ? "Please login to access this quiz."
          : "Failed to load quiz. Please check that the quiz exists."
      );
    } finally {
      setLoading(false);
    }
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
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const questions = quiz?.questions || [];
      const answersPayload = questions.map((q) => ({
        questionId: q.id,
        selectedOption: answers[q.id] || null,
      }));

      const res = await quizzesApi.submitAttempt({
        quizId: Number(id),
        answers: answersPayload,
      });

      setResult(res);
      setShowConfirmModal(false);
    } catch (err) {
      console.error("Failed to submit quiz attempt:", err);
      alert(
        err.response?.data?.message ||
          "Failed to submit attempt. Please ensure you are logged in."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${rem
      .toString()
      .padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfcf9] flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#183d34] border-t-transparent" />
        <p className="text-sm font-semibold text-[#8b948a]">
          Preparing assessment arena...
        </p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-[#fbfcf9] flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-3" />
        <h2 className="text-xl font-bold text-[#183d34]">Quiz Unavailable</h2>
        <p className="text-sm text-[#555d53] max-w-md mt-1 mb-6">{error}</p>
        <button
          onClick={() => navigate("/quizzes")}
          className="px-5 py-2.5 rounded-xl bg-[#183d34] text-xs font-bold text-[#c5ff55]"
        >
          Return to Quizzes
        </button>
      </div>
    );
  }

  // RESULT SCREEN
  if (result) {
    const questions = quiz.questions || [];
    const score = result.score ?? 0;
    const totalPoints = result.totalPoints ?? questions.length;
    const percentage =
      totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

    return (
      <div className="min-h-screen bg-[#fbfcf9] text-[#252922] py-12 px-6">
        <div className="max-w-2xl mx-auto rounded-3xl border border-[#dfe4de] bg-white p-8 sm:p-10 shadow-lg text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 opacity-10 pointer-events-none">
            <KnightCrest className="w-64 h-64" />
          </div>

          <TrophyIllustration className="mx-auto h-28 w-28 mb-4 animate-bounce" />

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-3.5 py-1 text-xs font-bold">
            <CheckCircle2 size={14} />
            Assessment Completed
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-[#183d34] mt-3">
            {quiz.title}
          </h2>
          <p className="text-xs text-[#555d53] mt-1">
            Submitted successfully. Here is your official performance score.
          </p>

          {/* Score Circle Card */}
          <div className="my-8 rounded-2xl border border-[#dfe4de] bg-[#fbfcf9] p-6 flex flex-col sm:flex-row items-center justify-around gap-6">
            <div>
              <p className="text-4xl font-black text-[#183d34]">
                {score} <span className="text-xl text-[#8b948a]">/ {totalPoints}</span>
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-[#8b948a] mt-1">
                Points Scored
              </p>
            </div>

            <div className="h-10 w-px bg-slate-200 hidden sm:block" />

            <div>
              <p
                className={`text-4xl font-black ${
                  percentage >= 70
                    ? "text-emerald-600"
                    : percentage >= 40
                    ? "text-amber-600"
                    : "text-red-600"
                }`}
              >
                {percentage}%
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-[#8b948a] mt-1">
                Accuracy Rating
              </p>
            </div>
          </div>

          {/* Feedback message */}
          <p className="text-xs font-semibold text-[#555d53] mb-8">
            {percentage >= 80
              ? "Outstanding performance! You displayed exceptional mastery in this domain."
              : percentage >= 50
              ? "Good effort! Revise the tricky questions to reach Grandmaster tier."
              : "Keep practicing! Review fundamental concepts and try another attempt."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                setResult(null);
                setAnswers({});
                setCurrentIdx(0);
                loadQuiz();
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#dfe4de] bg-white px-5 py-2.5 text-xs font-bold text-[#183d34] hover:bg-slate-50 transition"
            >
              <RotateCcw size={14} />
              Retake Assessment
            </button>

            <button
              onClick={() => navigate("/quizzes")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#183d34] px-6 py-2.5 text-xs font-bold text-[#c5ff55] hover:bg-[#122e27] transition shadow-md shadow-[#183d34]/20"
            >
              All Quizzes
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const currentQ = questions[currentIdx];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-[#fbfcf9] text-[#252922] pb-16">
      {/* TOP STATUS BAR */}
      <div className="sticky top-0 z-40 border-b border-[#e4e5df] bg-white/95 backdrop-blur-md px-6 py-3.5 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/quizzes")}
              className="p-1.5 rounded-lg text-[#555d53] hover:bg-slate-100"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-sm font-black text-[#183d34] truncate max-w-xs sm:max-w-md">
                {quiz.title}
              </h2>
              <p className="text-[10px] font-semibold text-[#8b948a]">
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
                  ? "bg-red-50 text-red-600 border border-red-200 animate-pulse"
                  : "bg-[#183d34]/10 text-[#183d34] border border-[#183d34]/20"
              }`}
            >
              <Clock size={15} />
              <span>{formatTime(timeLeft)}</span>
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#183d34] px-4 py-2 text-xs font-bold text-[#c5ff55] hover:bg-[#122e27] transition shadow-sm"
            >
              <Send size={13} />
              Submit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        {/* STEPPER / QUESTION MAP */}
        <div className="mb-6 rounded-2xl border border-[#dfe4de] bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8b948a] mb-2.5">
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
                      ? "ring-2 ring-[#183d34] bg-[#183d34] text-[#c5ff55]"
                      : isAnswered
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-[#f0f2ed] text-[#555d53] hover:bg-slate-200"
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
          <div className="rounded-3xl border border-[#dfe4de] bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#183d34] bg-[#183d34]/10 px-3 py-1 rounded-lg">
                Question {currentIdx + 1}
              </span>
              <span className="text-xs font-semibold text-[#8b948a]">
                {currentQ.points || 1} Point(s)
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-[#183d34] leading-relaxed">
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
                        ? "border-[#183d34] bg-[#183d34]/5 ring-1 ring-[#183d34] shadow-sm"
                        : "border-[#dfe4de] bg-white hover:bg-[#fbfcf9] hover:border-slate-400"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-black text-xs transition ${
                        isSelected
                          ? "bg-[#183d34] text-[#c5ff55]"
                          : "bg-[#f0f2ed] text-[#555d53]"
                      }`}
                    >
                      {isSelected ? <Check size={16} /> : optLetter}
                    </div>

                    <span className="text-sm font-medium text-[#252922]">
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* PREV / NEXT BUTTONS */}
            <div className="mt-8 pt-6 border-t border-[#f0f2ed] flex items-center justify-between">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                className={`inline-flex items-center gap-1.5 rounded-xl border border-[#dfe4de] px-4 py-2 text-xs font-bold transition ${
                  currentIdx === 0
                    ? "opacity-40 cursor-not-allowed bg-slate-50 text-slate-400"
                    : "bg-white text-[#183d34] hover:bg-slate-50"
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
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#183d34] px-5 py-2 text-xs font-bold text-[#c5ff55] hover:bg-[#122e27] transition"
                >
                  Next
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                >
                  Finish & Submit
                  <CheckCircle2 size={14} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#dfe4de] bg-white p-8 text-center text-sm text-[#8b948a]">
            No questions found for this quiz.
          </div>
        )}
      </div>

      {/* SUBMISSION CONFIRM MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#dfe4de] bg-white p-6 shadow-xl text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-[#183d34] mb-3" />
            <h3 className="text-lg font-black text-[#183d34]">
              Submit Quiz Assessment?
            </h3>
            <p className="text-xs text-[#555d53] mt-2 mb-6">
              You have answered <span className="font-bold text-[#183d34]">{answeredCount}</span> of{" "}
              <span className="font-bold text-[#183d34]">{totalQuestions}</span> questions.
              Once submitted, your responses cannot be changed.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 rounded-xl border border-[#dfe4de] py-2.5 text-xs font-bold text-[#555d53] hover:bg-slate-50"
              >
                Continue Quiz
              </button>
              <button
                disabled={isSubmitting}
                onClick={submitQuiz}
                className="flex-1 rounded-xl bg-[#183d34] py-2.5 text-xs font-bold text-[#c5ff55] hover:bg-[#122e27]"
              >
                {isSubmitting ? "Submitting..." : "Yes, Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
