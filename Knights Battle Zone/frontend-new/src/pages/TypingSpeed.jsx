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
  Code2,
  Terminal,
} from "lucide-react";
import { typingApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { KnightCrest, TrophyIllustration, RankBadge } from "../components/svg";

const CODE_SNIPPETS = {
  JavaScript: [
    {
      id: "js-easy",
      category: "JavaScript",
      difficulty: "Easy",
      title: "Array Filter & Map",
      content: "const evens = numbers.filter(n => n % 2 === 0).map(n => n * 2);",
    },
    {
      id: "js-med",
      category: "JavaScript",
      difficulty: "Medium",
      title: "Async Data Fetcher",
      content: "async function fetchUser(id) { const res = await fetch(`/api/users/${id}`); return await res.json(); }",
    },
    {
      id: "js-hard",
      category: "JavaScript",
      difficulty: "Hard",
      title: "Memoized Fibonacci",
      content: "const memo = new Map(); function fib(n) { if (n <= 1) return n; if (memo.has(n)) return memo.get(n); const res = fib(n - 1) + fib(n - 2); memo.set(n, res); return res; }",
    },
  ],
  Python: [
    {
      id: "py-easy",
      category: "Python",
      difficulty: "Easy",
      title: "List Comprehension",
      content: "squared = [x**2 for x in nums if x > 0 and x % 2 == 0]",
    },
    {
      id: "py-med",
      category: "Python",
      difficulty: "Medium",
      title: "Binary Tree BFS Queue",
      content: "queue = collections.deque([root]); while queue: node = queue.popleft(); if node.left: queue.append(node.left)",
    },
    {
      id: "py-hard",
      category: "Python",
      difficulty: "Hard",
      title: "Dijkstra Priority Queue",
      content: "dist = {i: float('inf') for i in graph}; heap = [(0, start)]; while heap: d, u = heapq.heappop(heap); if d > dist[u]: continue",
    },
  ],
  "C++": [
    {
      id: "cpp-easy",
      category: "C++",
      difficulty: "Easy",
      title: "Vector Two Pointers",
      content: "while (left < right) { if (nums[left] + nums[right] == target) return {left, right}; }",
    },
    {
      id: "cpp-med",
      category: "C++",
      difficulty: "Medium",
      title: "Fast I/O & Lambda Sort",
      content: "ios_base::sync_with_stdio(false); cin.tie(NULL); sort(v.begin(), v.end(), [](const auto &a, const auto &b) { return a.val > b.val; });",
    },
    {
      id: "cpp-hard",
      category: "C++",
      difficulty: "Hard",
      title: "Binary Search Lower Bound",
      content: "int low = 0, high = n - 1, ans = -1; while (low <= high) { int mid = low + (high - low) / 2; if (check(mid)) { ans = mid; high = mid - 1; } else { low = mid + 1; } } return ans;",
    },
  ],
  Prose: [
    {
      id: "prose-easy",
      category: "Practice",
      difficulty: "Easy",
      title: "Clean Code",
      content: "Clean code always looks like it was written by someone who cares deeply about software engineering craft.",
    },
    {
      id: "prose-med",
      category: "Practice",
      difficulty: "Medium",
      title: "Algorithmic Precision",
      content: "Algorithms are the foundation of computer science. A good knight writes code that is clean, optimal, and resilient to edge cases under high load.",
    },
    {
      id: "prose-hard",
      category: "Practice",
      difficulty: "Hard",
      title: "Distributed Consensus",
      content: "In distributed architectures, achieving consensus across asynchronous partitions requires adhering to Paxos or Raft state machine replication protocols.",
    },
  ],
};

export default function TypingSpeed() {
  const { isAuthenticated } = useAuth();

  // Test setup
  const [duration, setDuration] = useState(30); // 15, 30, 60
  const [difficulty, setDifficulty] = useState("Medium");
  const [languageMode, setLanguageMode] = useState("JavaScript"); // JavaScript, Python, C++, Prose
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
  }, [difficulty, languageMode]);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  const fetchRandomText = async () => {
    try {
      setLoadingText(true);
      resetTest();

      if (languageMode === "Prose") {
        try {
          const res = await typingApi.getRandomText({ difficulty });
          if (res && res.content) {
            setTextData(res);
            setTargetText(res.content.trim());
            return;
          }
        } catch (e) {
          // fall through to local dataset
        }
      }

      // Pick from rich code snippet dataset
      const snippetGroup = CODE_SNIPPETS[languageMode] || CODE_SNIPPETS.JavaScript;
      const matched =
        snippetGroup.find((s) => s.difficulty.toLowerCase() === difficulty.toLowerCase()) ||
        snippetGroup[0];

      setTextData(matched);
      setTargetText(matched.content.trim());
    } catch (err) {
      console.warn("Typing text fallback:", err);
      const fallback = CODE_SNIPPETS.JavaScript[0];
      setTextData(fallback);
      setTargetText(fallback.content.trim());
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
    <div className="min-h-screen bg-[#0c0f0a] text-[#e0e4dc] pb-16">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden border-b border-white/10 bg-[#121610] py-10 px-6 sm:px-10">
        <div className="absolute -right-12 -top-12 opacity-10 pointer-events-none">
          <KnightCrest className="w-80 h-80" />
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c5ff55]/20 bg-[#c5ff55]/[0.06] px-3 py-1 text-xs font-bold text-[#c5ff55] mb-3">
                <Keyboard size={14} className="text-[#c5ff55]" />
                Speed & Accuracy Arena
              </div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
                Speed Coding & <span className="text-[#c5ff55]">Typing Test</span>
              </h1>
              <p className="mt-2 text-sm text-[#aab1a1] max-w-xl">
                Test your typing velocity on authentic code snippets and engineering
                texts. Low-latency fingertips win programming duels.
              </p>
            </div>

            {/* Test Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Language / Mode selector */}
              <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
                {["JavaScript", "Python", "C++", "Prose"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguageMode(lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      languageMode === lang
                        ? "bg-[#c5ff55] text-[#14170f] font-black"
                        : "text-[#aab1a1] hover:text-white"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              {/* Duration tabs */}
              <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
                {[15, 30, 60].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => {
                      setDuration(sec);
                      resetTest();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      duration === sec
                        ? "bg-[#c5ff55] text-[#14170f] font-black"
                        : "text-[#aab1a1] hover:text-white"
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>

              {/* Difficulty tabs */}
              <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
                {["Easy", "Medium", "Hard"].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setDifficulty(lvl)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      difficulty === lvl
                        ? "bg-[#c5ff55] text-[#14170f] font-black"
                        : "text-[#aab1a1] hover:text-white"
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
          <div className="rounded-2xl border border-white/10 bg-[#161a14] p-4 shadow-sm text-center">
            <p className="text-3xl font-black text-[#c5ff55]">
              {isActive ? currentWpm : 0}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#788071] mt-0.5">
              Live WPM
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#161a14] p-4 shadow-sm text-center">
            <p className="text-3xl font-black text-emerald-400">
              {accuracyPercent}%
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#788071] mt-0.5">
              Accuracy
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#161a14] p-4 shadow-sm text-center">
            <p
              className={`text-3xl font-black ${
                timeLeft <= 5 ? "text-rose-400 animate-pulse" : "text-white"
              }`}
            >
              {timeLeft}s
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#788071] mt-0.5">
              Time Remaining
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#161a14] p-4 shadow-sm text-center">
            <p className="text-3xl font-black text-amber-400">{errors}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#788071] mt-0.5">
              Mistakes
            </p>
          </div>
        </div>

        {/* TYPING BOX */}
        <div className="relative rounded-3xl border border-white/10 bg-[#161a14] p-6 sm:p-8 shadow-sm">
          {loadingText ? (
            <div className="py-16 text-center text-sm font-semibold text-[#788071]">
              Fetching new typing passage...
            </div>
          ) : (
            <>
              {/* Snippet Header Badge */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-md bg-[#c5ff55]/10 border border-[#c5ff55]/20 px-2.5 py-1 text-xs font-bold text-[#c5ff55]">
                    <Code2 size={13} />
                    {languageMode}
                  </span>
                  <span className="text-xs font-semibold text-[#aab1a1]">
                    {textData?.title || "Algorithmic Syntax"}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#788071] uppercase tracking-wider">
                  Difficulty: {difficulty}
                </span>
              </div>

              {/* Target Text Display with character highlights */}
              <div
                onClick={() => inputRef.current?.focus()}
                className="font-mono text-base sm:text-lg leading-relaxed select-none tracking-wide min-h-[140px] cursor-text rounded-2xl bg-black/40 p-5 border border-white/5"
              >
                {targetText.split("").map((char, index) => {
                  let charClass = "text-[#626a5e]"; // unreached
                  const isCurrent = index === input.length;

                  if (index < input.length) {
                    if (input[index] === char) {
                      charClass = "text-[#c5ff55] font-bold bg-[#c5ff55]/15";
                    } else {
                      charClass = "text-rose-400 font-bold bg-rose-500/25 rounded-sm";
                    }
                  }

                  return (
                    <span
                      key={index}
                      className={`${charClass} ${
                        isCurrent
                          ? "border-b-2 border-[#c5ff55] animate-pulse bg-[#c5ff55]/20 text-white"
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
              <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-[#788071] font-medium">
                  {textData?.category && (
                    <span className="font-bold text-[#c5ff55]">
                      #{textData.category}{" "}
                    </span>
                  )}
                  Click text and start typing to begin timer
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={resetTest}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
                  >
                    <RotateCcw size={14} />
                    Reset
                  </button>

                  <button
                    onClick={fetchRandomText}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#c5ff55] px-4 py-2 text-xs font-black uppercase text-[#14170f] hover:bg-[#d5ff83] transition shadow-md shadow-[#c5ff55]/20"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#161a14] p-8 shadow-2xl text-center relative overflow-hidden">
              <TrophyIllustration className="mx-auto h-24 w-24 mb-3" />

              <h3 className="text-2xl font-black text-white">
                Sprint Completed!
              </h3>
              <p className="text-xs text-[#aab1a1] mt-1 mb-6">
                {isAuthenticated
                  ? "Your performance score has been recorded to your Knight record."
                  : "Login to save your high scores to the global leaderboard."}
              </p>

              <div className="grid grid-cols-2 gap-4 my-6">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-3xl font-black text-[#c5ff55]">
                    {Math.max(
                      0,
                      Math.round(
                        (input.length - errors) / 5 / ((duration - timeLeft || 1) / 60)
                      )
                    )}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#788071] mt-0.5">
                    Net WPM
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-3xl font-black text-emerald-400">
                    {accuracyPercent}%
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#788071] mt-0.5">
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
                  className="flex-1 rounded-xl bg-[#c5ff55] py-2.5 text-xs font-black uppercase text-[#14170f] hover:bg-[#d5ff83] transition shadow-md shadow-[#c5ff55]/20"
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
              <Trophy size={18} className="text-[#c5ff55]" />
              <h3 className="text-lg font-black text-white">
                Speed Typing Leaderboard
              </h3>
            </div>
            <span className="text-xs font-bold text-[#788071]">
              Top Velocity Knights
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#161a14] overflow-hidden shadow-sm">
            {loadingLeaderboard ? (
              <div className="p-8 text-center text-xs font-semibold text-[#788071]">
                Loading speed records...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="p-8 text-center text-xs font-semibold text-[#788071]">
                No speed runs recorded yet. Complete a test above to take the #1 spot!
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 border-b border-white/10 text-[#788071] font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Knight</th>
                    <th className="py-3 px-4 text-center">WPM</th>
                    <th className="py-3 px-4 text-center">Accuracy</th>
                    <th className="py-3 px-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {leaderboard.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.03] transition">
                      <td className="py-3.5 px-4 font-black text-[#c5ff55]">
                        #{entry.rank || idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {entry.username || `Knight #${entry.userId || idx}`}
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-[#c5ff55]">
                        {entry.bestWpm || entry.wpm || 0} WPM
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-400">
                        {entry.bestAccuracy
                          ? `${Math.round(entry.bestAccuracy)}%`
                          : "100%"}
                      </td>
                      <td className="py-3.5 px-4 text-right text-[11px] text-[#788071]">
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
