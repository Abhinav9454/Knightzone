import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  GitPullRequest,
  Sparkles,
  Trophy,
  Award,
  Plus,
  CheckCircle2,
  Clock,
  Code2,
  FileText,
  AlertCircle,
  HelpCircle,
  Star,
  ChevronRight,
  ShieldCheck,
  Send,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { contributionsApi } from "../services/api";

const CONTRIBUTION_TYPES = [
  {
    type: "PROBLEM_SUBMISSION",
    name: "Original Problem Authoring",
    points: "+100 pts",
    desc: "Craft an algorithmic problem with test cases, edge cases, and constraints.",
  },
  {
    type: "EDITORIAL_SOLUTION",
    name: "Official Editorial Write-up",
    points: "+50 pts",
    desc: "Write detailed mathematical proofs, intuition, and optimal code implementations.",
  },
  {
    type: "HINT_CONTRIBUTION",
    name: "Progressive Hint Creator",
    points: "+25 pts",
    desc: "Provide intuitive milestone hints that guide struggling coders without spoiling answers.",
  },
  {
    type: "TEST_CASE_REPORT",
    name: "Edge-case Bug Bounty",
    points: "+30 pts",
    desc: "Submit corner test cases that break accepted or sub-optimal O(N^2) submissions.",
  },
];

const SAMPLE_LEADERBOARD = [
  { rank: 1, name: "Harsh Vardhan", points: 2840, approvedCount: 24, badge: "Master Contributor" },
  { rank: 2, name: "Aman Singhal", points: 2190, approvedCount: 18, badge: "Problem Architect" },
  { rank: 3, name: "Divya Nambiar", points: 1950, approvedCount: 15, badge: "Editorial Master" },
  { rank: 4, name: "Tanmay Deshmukh", points: 1480, approvedCount: 11, badge: "Senior Contributor" },
  { rank: 5, name: "Shreya Ghoshal", points: 1120, approvedCount: 8, badge: "Contributor" },
];

export default function Contributions() {
  const { user, isAuthenticated } = useAuth();
  const { isNight } = useTheme();

  const [leaderboard, setLeaderboard] = useState(SAMPLE_LEADERBOARD);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "submit" | "history"

  // Problem Submission Form State
  const [problemTitle, setProblemTitle] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [category, setCategory] = useState("Dynamic Programming");
  const [description, setDescription] = useState("");
  const [constraints, setConstraints] = useState("1 <= N <= 10^5\n1 <= A[i] <= 10^9");
  const [sampleInput, setSampleInput] = useState("5\n1 2 3 4 5");
  const [sampleOutput, setSampleOutput] = useState("15");
  const [solutionCode, setSolutionCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // My Contributions State
  const [myContributions, setMyContributions] = useState([
    {
      id: 1,
      title: "Knight Tour Minimum Teleport Moves",
      type: "Problem Authoring",
      date: "3 days ago",
      status: "APPROVED",
      points: 100,
    },
    {
      id: 2,
      title: "Binary Tree Maximum Path Sum Hint #2",
      type: "Hint Contribution",
      date: "1 week ago",
      status: "APPROVED",
      points: 25,
    },
    {
      id: 3,
      title: "Bit Manipulation XOR Subarray Edge Case",
      type: "Test Case Bounty",
      date: "2 weeks ago",
      status: "PENDING_REVIEW",
      points: 30,
    },
  ]);

  useEffect(() => {
    contributionsApi
      .getLeaderboard(10)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLeaderboard(
            data.map((d, i) => ({
              rank: i + 1,
              name: d.userName || d.name || `Knight #${i + 1}`,
              points: d.points || (2500 - i * 200),
              approvedCount: d.approvedCount || (20 - i),
              badge: i < 3 ? "Master Contributor" : "Contributor",
            }))
          );
        }
      })
      .catch(() => null);
  }, []);

  const handleSubmitProblem = (e) => {
    e.preventDefault();
    if (!problemTitle.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);

      setMyContributions([
        {
          id: Date.now(),
          title: problemTitle,
          type: "Problem Authoring",
          date: "Just now",
          status: "PENDING_REVIEW",
          points: 100,
        },
        ...myContributions,
      ]);

      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab("history");
        setProblemTitle("");
        setDescription("");
        setSolutionCode("");
      }, 1500);
    }, 1000);
  };

  return (
    <div className={`min-h-screen px-4 py-8 sm:px-6 lg:px-10 ${isNight ? "bg-[#0c0f0a] text-white" : "bg-[#f8faf6] text-slate-900"}`}>
      <div className="mx-auto max-w-7xl">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#c5ff55]/10 border border-[#c5ff55]/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#c5ff55] mb-2">
              <GitPullRequest size={14} />
              Open Community Problem Creator & Bounty Studio
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Community <span className="text-[#c5ff55]">Contributions</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#8f9d8a]">
              Author new contest problems, write verified editorials, submit edge test cases, and earn official Knightzone Author Badges.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("submit")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#c5ff55] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#14170f] shadow-md shadow-[#c5ff55]/20 hover:bg-[#d5ff83] transition"
            >
              <Plus size={16} /> Author a Problem
            </button>
            <Link
              to="/problems"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition"
            >
              <Code2 size={14} className="text-[#c5ff55]" /> Browse Problem Set
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex items-center gap-2 border-b border-white/10 pb-4">
          {[
            { id: "overview", label: "Overview & Reputation" },
            { id: "submit", label: "Author New Challenge" },
            { id: "history", label: `My Submissions (${myContributions.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === tab.id
                  ? "bg-[#c5ff55] text-[#14170f] shadow-md shadow-[#c5ff55]/20"
                  : "bg-white/5 text-[#aab1a1] hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW & REPUTATION */}
        {activeTab === "overview" && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Contribution Tiers (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 sm:p-8 shadow-xl">
                <h3 className="text-base font-black text-white mb-2">Contribution Perks & Bounty Tiers</h3>
                <p className="text-xs text-[#8f9d8a] mb-6">
                  Every accepted contribution gives you verified author credits on the problem page, permanent reputation points, and campus badge tier boosts.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {CONTRIBUTION_TYPES.map((type) => (
                    <div
                      key={type.type}
                      className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-white">{type.name}</span>
                          <span className="text-[10px] font-black text-[#c5ff55] bg-[#c5ff55]/15 border border-[#c5ff55]/30 px-2 py-0.5 rounded">
                            {type.points}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8f9d8a] leading-relaxed">{type.desc}</p>
                      </div>

                      <button
                        onClick={() => setActiveTab("submit")}
                        className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-[#c5ff55] hover:underline"
                      >
                        Contribute <ChevronRight size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Top Contributors Leaderboard (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-[#c5ff55] mb-2">
                  <Trophy size={14} /> Top Authors & Architects
                </div>
                <h3 className="text-base font-black text-white mb-4">Community Honor Roll</h3>

                <div className="divide-y divide-white/5 space-y-2">
                  {leaderboard.map((author) => (
                    <div key={author.rank} className="pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black ${
                            author.rank === 1
                              ? "bg-[#c5ff55] text-[#14170f]"
                              : author.rank === 2
                              ? "bg-slate-300 text-slate-900"
                              : "bg-white/10 text-white"
                          }`}
                        >
                          #{author.rank}
                        </span>

                        <div>
                          <span className="text-xs font-black text-white block">{author.name}</span>
                          <span className="text-[10px] text-[#788874]">{author.approvedCount} approved challenges</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-xs font-black text-[#c5ff55]">{author.points} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUTHOR NEW PROBLEM */}
        {activeTab === "submit" && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-[#161a14] p-6 sm:p-8 shadow-xl max-w-4xl">
            <div className="border-b border-white/10 pb-4 mb-6">
              <h2 className="text-lg font-black text-white">Author a New Algorithmic Challenge</h2>
              <p className="text-xs text-[#8f9d8a]">Submit a complete problem with test cases for peer and moderator review.</p>
            </div>

            {submitSuccess ? (
              <div className="text-center py-12 space-y-3">
                <CheckCircle2 size={48} className="mx-auto text-[#c5ff55]" />
                <h3 className="text-xl font-black text-white">Problem Submitted Successfully!</h3>
                <p className="text-xs text-[#8f9d8a]">
                  Our editorial panel will review your challenge within 48 hours. You will receive +100 author points upon approval.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitProblem} className="space-y-4 text-xs">
                <div>
                  <label className="text-[#788874] font-bold block mb-1">Challenge Title</label>
                  <input
                    type="text"
                    required
                    value={problemTitle}
                    onChange={(e) => setProblemTitle(e.target.value)}
                    placeholder="e.g. Subarray XOR Minimum Operations"
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[#788874] font-bold block mb-1">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white focus:outline-none"
                    >
                      <option value="Easy">Easy (800 - 1200 ELO)</option>
                      <option value="Medium">Medium (1300 - 1800 ELO)</option>
                      <option value="Hard">Hard (1900 - 2400 ELO)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[#788874] font-bold block mb-1">Algorithmic Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white focus:outline-none"
                    >
                      <option value="Dynamic Programming">Dynamic Programming</option>
                      <option value="Graph Theory & Trees">Graph Theory & Trees</option>
                      <option value="Arrays & Two Pointers">Arrays & Two Pointers</option>
                      <option value="Bit Manipulation">Bit Manipulation</option>
                      <option value="Strings & Tries">Strings & Tries</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[#788874] font-bold block mb-1">Problem Statement (Markdown)</label>
                  <textarea
                    rows={5}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the problem, input format, output format, and story context..."
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#788874] font-bold block mb-1">Constraints</label>
                  <textarea
                    rows={2}
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-2 font-mono text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 font-mono">
                  <div>
                    <label className="text-[#788874] font-bold block mb-1 font-sans">Sample Input 0</label>
                    <textarea
                      rows={3}
                      value={sampleInput}
                      onChange={(e) => setSampleInput(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 p-2 text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[#788874] font-bold block mb-1 font-sans">Sample Output 0</label>
                    <textarea
                      rows={3}
                      value={sampleOutput}
                      onChange={(e) => setSampleOutput(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 p-2 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#788874] font-bold block mb-1">Official Reference Solution (C++ / Java / Python)</label>
                  <textarea
                    rows={6}
                    value={solutionCode}
                    onChange={(e) => setSolutionCode(e.target.value)}
                    placeholder="// Paste your optimal reference solution here..."
                    className="w-full rounded-xl border border-white/10 bg-black/50 p-3 font-mono text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#c5ff55] px-6 py-2.5 font-black uppercase text-[#14170f] hover:bg-[#d5ff83] disabled:opacity-50 transition"
                  >
                    <Send size={14} />
                    {isSubmitting ? "Submitting Challenge..." : "Submit to Review Queue"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: MY SUBMISSION LOGS */}
        {activeTab === "history" && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-[#161a14] p-6 sm:p-8 shadow-xl">
            <h2 className="text-lg font-black text-white mb-4">My Community Submissions & Status</h2>

            <div className="divide-y divide-white/5 space-y-3">
              {myContributions.map((item) => (
                <div key={item.id} className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">{item.title}</span>
                      <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-[#788874]">{item.type}</span>
                    </div>
                    <span className="text-[10px] text-[#8f9d8a]">Submitted {item.date}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#c5ff55]">+{item.points} pts</span>
                    <span
                      className={`rounded-xl px-2.5 py-1 text-[10px] font-black uppercase ${
                        item.status === "APPROVED"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
