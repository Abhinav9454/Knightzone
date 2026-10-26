import { useState, useEffect, useRef } from "react";
import {
  Keyboard,
  Zap,
  RotateCcw,
  Trophy,
  Clock,
  Sparkles,
  Award,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { typingApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { KnightCrest, TrophyIllustration, RankBadge } from "../components/svg";

export default function TypingSpeed() {
  const { isAuthenticated } = useAuth();

  // Test setup
  const [duration, setDuration] = useState(30); // 15, 30, 60
  const [difficulty, setDifficulty] = useState("Medium");
  const [textData, setTextData] = useState(null);
  const [targetText, setTargetText] = useState("");
  const [loadingText, setLoadingText] = useState(true);

  // Live test state
  const [input, setInput] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [keyPresses, setKeyPresses] = useState(0);
  const [errors, setErrors] = useState(0);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchRandomText();
    fetchLeaderboard();
  }, [difficulty]);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  const fetchRandomText = async () => {
    try {
      setLoadingText(true);
      resetTest();
      const res = await typingApi.getRandomText({ difficulty });
      if (res && res.content) {
        setTextData(res);
        setTargetText(res.content.trim());
      } else {
        const fallback =
          "Algorithms are the foundation of computer science. A good knight writes code that is clean, optimal, and resilient to edge cases.";
        setTextData({ id: 1, content: fallback, category: "Tech" });
        setTargetText(fallback);
      }
    } catch (err) {
      console.warn("Typing text fallback:", err);
      const fallback =
        "The quick brown fox jumps over the lazy dog. Fast typists execute commands with precision and minimal latency.";
      setTextData({ id: 1, content: fallback, category: "Practice" });
      setTargetText(fallback);
    } finally {
      setLoadingText(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoadingLeaderboard(true);
      const list = await typingApi.getLeaderboard({ limit: 10 });
      setLeaderboard(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Typing leaderboard fetch issue:", err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const resetTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setIsFinished(false);
    setInput("");
    setTimeLeft(duration);
    setKeyPresses(0);
    setErrors(0);
    if (inputRef.current) inputRef.current.focus();
  };

  const startTest = () => {
    if (!isActive && !isFinished) {
      setIsActive(true);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            finishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleInputChange = (e) => {
    if (isFinished) return;
    if (!isActive) startTest();

    const val = e.target.value;
    setInput(val);
    setKeyPresses((prev) => prev + 1);

    // Calculate mistakes count
    let errCount = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] !== targetText[i]) {
        errCount++;
      }
    }
    setErrors(errCount);

    // If typed everything
    if (val.length >= targetText.length) {
      clearInterval(timerRef.current);
      finishTest(val);
    }
  };

  const finishTest = async (finalInput = input) => {
    setIsActive(false);
    setIsFinished(true);

    const elapsedSecs = Math.max(1, duration - timeLeft);
    const charsTyped = finalInput.length;
    const wordsTyped = charsTyped / 5;
    const minutes = elapsedSecs / 60;
    const rawWpm = Math.round(wordsTyped / minutes);

    let finalErrors = 0;
    for (let i = 0; i < finalInput.length; i++) {
      if (finalInput[i] !== targetText[i]) finalErrors++;
    }

    const accuracy =
      charsTyped > 0
        ? Math.max(0, Math.round(((charsTyped - finalErrors) / charsTyped) * 1000) / 10)
        : 100;
    const netWpm = Math.max(
      0,
      Math.round((charsTyped - finalErrors) / 5 / minutes)
    );

    // Submit score to backend
    if (isAuthenticated) {
      try {
        await typingApi.submitResult({
          wpm: netWpm,
          rawWpm: rawWpm,
          accuracy: accuracy,
          testDuration: elapsedSecs,
          category: textData?.category || "Tech",
          textId: textData?.id,
          errors: finalErrors,
          keyPresses: Math.max(charsTyped, keyPresses),
          mode: "TIMED",
        });
        fetchLeaderboard();
      } catch (err) {
        console.warn("Failed to record typing result:", err);
      }
    }
  };

  // Metrics calculations
  const elapsedSecs = Math.max(1, duration - timeLeft);
  const minutes = (isActive ? elapsedSecs : 1) / 60;
  const charsTyped = input.length;
  const currentWpm =
    isActive && minutes > 0
      ? Math.max(0, Math.round((charsTyped - errors) / 5 / minutes))
      : 0;
  const accuracyPercent =
    charsTyped > 0
      ? Math.max(0, Math.round(((charsTyped - errors) / charsTyped) * 100))
      : 100;

  return (
    <div className="min-h-screen bg-[#fbfcf9] text-[#252922] pb-16">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden border-b border-[#e4e5df] bg-gradient-to-b from-[#183d34]/5 via-transparent to-transparent py-10 px-6 sm:px-10">
        <div className="absolute -right-12 -top-12 opacity-10 pointer-events-none">
          <KnightCrest className="w-80 h-80" />
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#183d34]/20 bg-[#183d34]/10 px-3 py-1 text-xs font-bold text-[#183d34] mb-3">
                <Keyboard size={14} className="text-[#183d34]" />
                Speed & Accuracy Arena
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#183d34]">
                Speed Coding & Typing Test
              </h1>
              <p className="mt-2 text-sm text-[#555d53] max-w-xl">
                Test your typing velocity on authentic code snippets and engineering
                texts. Low-latency fingertips win programming duels.
              </p>
            </div>

            {/* Test Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Duration tabs */}
              <div className="flex items-center gap-1 rounded-xl border border-[#dfe4de] bg-white p-1">
                {[15, 30, 60].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => {
                      setDuration(sec);
                      resetTest();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      duration === sec
                        ? "bg-[#183d34] text-[#c5ff55]"
                        : "text-[#555d53] hover:text-[#252922]"
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>

              {/* Difficulty tabs */}
              <div className="flex items-center gap-1 rounded-xl border border-[#dfe4de] bg-white p-1">
                {["Easy", "Medium", "Hard"].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setDifficulty(lvl)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      difficulty === lvl
                        ? "bg-[#183d34] text-[#c5ff55]"
                        : "text-[#555d53] hover:text-[#252922]"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-10 mt-8">
        {/* LIVE METRICS BAR */}
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-[#dfe4de] bg-white p-4 shadow-sm text-center">
            <p className="text-3xl font-black text-[#183d34]">
              {isActive ? currentWpm : 0}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8b948a] mt-0.5">
              Live WPM
            </p>
          </div>

          <div className="rounded-2xl border border-[#dfe4de] bg-white p-4 shadow-sm text-center">
            <p className="text-3xl font-black text-emerald-600">
              {accuracyPercent}%
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8b948a] mt-0.5">
              Accuracy
            </p>
          </div>

          <div className="rounded-2xl border border-[#dfe4de] bg-white p-4 shadow-sm text-center">
            <p
              className={`text-3xl font-black ${
                timeLeft <= 5 ? "text-red-600 animate-pulse" : "text-[#183d34]"
              }`}
            >
              {timeLeft}s
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8b948a] mt-0.5">
              Time Remaining
            </p>
          </div>

          <div className="rounded-2xl border border-[#dfe4de] bg-white p-4 shadow-sm text-center">
            <p className="text-3xl font-black text-amber-600">{errors}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8b948a] mt-0.5">
              Mistakes
            </p>
          </div>
        </div>

        {/* TYPING BOX */}
        <div className="relative rounded-3xl border border-[#dfe4de] bg-white p-6 sm:p-8 shadow-sm">
          {loadingText ? (
            <div className="py-16 text-center text-sm font-semibold text-[#8b948a]">
              Fetching new typing passage...
            </div>
          ) : (
            <>
              {/* Target Text Display with character highlights */}
              <div
                onClick={() => inputRef.current?.focus()}
                className="font-mono text-base sm:text-lg leading-relaxed select-none tracking-wide min-h-[140px] cursor-text"
              >
                {targetText.split("").map((char, index) => {
                  let charClass = "text-[#8b948a]"; // unreached
                  const isCurrent = index === input.length;

                  if (index < input.length) {
                    if (input[index] === char) {
                      charClass = "text-emerald-600 font-bold bg-emerald-50";
                    } else {
                      charClass = "text-red-600 font-bold bg-red-100 rounded-sm";
                    }
                  }

                  return (
                    <span
                      key={index}
                      className={`${charClass} ${
                        isCurrent
                          ? "border-b-2 border-[#183d34] animate-pulse bg-[#183d34]/10"
                          : ""
                      }`}
                    >
                      {char}
                    </span>
                  );
                })}
              </div>

              {/* Real hidden/captured Input field */}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                disabled={isFinished}
                autoFocus
                className="absolute inset-0 opacity-0 cursor-default"
              />

              {/* ACTION TOOLBAR */}
              <div className="mt-8 pt-4 border-t border-[#f0f2ed] flex items-center justify-between">
                <span className="text-xs text-[#8b948a] font-medium">
                  {textData?.category && (
                    <span className="font-bold text-[#183d34]">
                      #{textData.category}{" "}
                    </span>
                  )}
                  Click text and start typing to begin timer
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={resetTest}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe4de] bg-white px-3.5 py-2 text-xs font-bold text-[#183d34] hover:bg-slate-50 transition"
                  >
                    <RotateCcw size={14} />
                    Reset
                  </button>

                  <button
                    onClick={fetchRandomText}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#183d34] px-4 py-2 text-xs font-bold text-[#c5ff55] hover:bg-[#122e27] transition"
                  >
                    New Passage
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* RESULTS MODAL */}
        {isFinished && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl border border-[#dfe4de] bg-white p-8 shadow-2xl text-center relative overflow-hidden">
              <TrophyIllustration className="mx-auto h-24 w-24 mb-3" />

              <h3 className="text-2xl font-black text-[#183d34]">
                Sprint Completed!
              </h3>
              <p className="text-xs text-[#555d53] mt-1 mb-6">
                {isAuthenticated
                  ? "Your performance score has been recorded to your Knight record."
                  : "Login to save your high scores to the global leaderboard."}
              </p>

              <div className="grid grid-cols-2 gap-4 my-6">
                <div className="rounded-2xl border border-[#dfe4de] bg-[#fbfcf9] p-4">
                  <p className="text-3xl font-black text-[#183d34]">
                    {Math.max(
                      0,
                      Math.round(
                        (input.length - errors) / 5 / ((duration - timeLeft || 1) / 60)
                      )
                    )}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8b948a] mt-0.5">
                    Net WPM
                  </p>
                </div>

                <div className="rounded-2xl border border-[#dfe4de] bg-[#fbfcf9] p-4">
                  <p className="text-3xl font-black text-emerald-600">
                    {accuracyPercent}%
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8b948a] mt-0.5">
                    Accuracy
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setIsFinished(false);
                    fetchRandomText();
                  }}
                  className="flex-1 rounded-xl bg-[#183d34] py-2.5 text-xs font-bold text-[#c5ff55] hover:bg-[#122e27]"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LEADERBOARD SECTION */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" />
              <h3 className="text-lg font-black text-[#183d34]">
                Speed Typing Leaderboard
              </h3>
            </div>
            <span className="text-xs font-bold text-[#8b948a]">
              Top Velocity Knights
            </span>
          </div>

          <div className="rounded-2xl border border-[#dfe4de] bg-white overflow-hidden shadow-sm">
            {loadingLeaderboard ? (
              <div className="p-8 text-center text-xs font-semibold text-[#8b948a]">
                Loading speed records...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="p-8 text-center text-xs font-semibold text-[#8b948a]">
                No speed runs recorded yet. Complete a test above to take the #1 spot!
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f0f2ed] border-b border-[#dfe4de] text-[#8b948a] font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Knight</th>
                    <th className="py-3 px-4 text-center">WPM</th>
                    <th className="py-3 px-4 text-center">Accuracy</th>
                    <th className="py-3 px-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dfe4de]">
                  {leaderboard.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-[#fbfcf9]">
                      <td className="py-3.5 px-4 font-black text-[#183d34]">
                        #{entry.rank || idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#252922]">
                        {entry.username || `Knight #${entry.userId || idx}`}
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-[#183d34]">
                        {entry.bestWpm || entry.wpm || 0} WPM
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                        {entry.bestAccuracy
                          ? `${Math.round(entry.bestAccuracy)}%`
                          : "100%"}
                      </td>
                      <td className="py-3.5 px-4 text-right text-[11px] text-[#8b948a]">
                        {entry.achievedAt
                          ? new Date(entry.achievedAt).toLocaleDateString()
                          : "Recently"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
