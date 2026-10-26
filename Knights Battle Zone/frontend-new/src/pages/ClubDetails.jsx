import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Users,
  MessageSquare,
  Trophy,
  ArrowLeft,
  Send,
  Calendar,
  Lock,
  Globe,
  Check,
  UserPlus,
  AlertCircle,
  Sparkles,
  Zap,
  Sword,
  Target,
  Code2,
  CheckCircle2,
  Plus,
  Flame,
  Compass,
  FileText,
  ExternalLink,
  BookOpen,
  HelpCircle,
  CheckSquare,
  Square,
  Filter,
} from "lucide-react";
import { clubsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { KnightCrest, TrophyIllustration } from "../components/svg";
import { RICH_SAMPLE_CLUBS } from "./Clubs";

const SAMPLE_POSTS = [
  {
    id: 1,
    category: "Editorial & Proof",
    title: "Intuition behind Fenwick Tree (Binary Indexed Tree) point updates",
    content: "When updating index i, adding (i & -i) propagates changes to all responsible range ancestors in O(log N). This allows point-update and range-sum queries with minimal constant-factor overhead.",
    authorName: "Alex Chen",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    likesCount: 14,
  },
  {
    id: 2,
    category: "Doubt / Help Needed",
    title: "Need help optimizing DP state on Tree Knapsack problem",
    content: "My solution gives TLE on testcase 48. Currently dp[node][weight] takes O(N · W²). How do I apply the subtree size upper bound optimization?",
    authorName: "Sarah Jenkins",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    likesCount: 8,
  },
  {
    id: 3,
    category: "Interview Experience",
    title: "Recent SDE 1 Interview Experience: Graph BFS & Distributed Caching",
    content: "Interview round consisted of 1 medium BFS problem on a grid followed by deep discussion on Redis cache eviction policies (LRU vs LFU under high concurrency). Pinned key takeaways in our resources vault.",
    authorName: "Vikram Malhotra",
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    likesCount: 29,
  },
];

const SAMPLE_MESSAGES = [
  {
    id: 1,
    senderName: "Alex Chen",
    content: "Welcome to the guild! Check out our weekly challenge before the Saturday contest.",
    sentAt: new Date(Date.now() - 3600000 * 2).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  },
  {
    id: 2,
    senderName: "Sarah Jenkins",
    content: "Working on optimizing the segment tree memory layout. Anyone tried 1-based indexing for cache alignment?",
    sentAt: new Date(Date.now() - 3600000 * 1).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  },
  {
    id: 3,
    senderName: "Vikram Malhotra",
    content: "Count me in for tonight's sparring practice in the battle arena!",
    sentAt: new Date(Date.now() - 1800000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  },
];

const SAMPLE_CURRICULUM = [
  {
    week: "Week 1",
    title: "Core Two Pointers, Sliding Window & Frequency Maps",
    topics: [
      { id: "w1-1", title: "Two Sum & 3-Sum Invariants", completed: true },
      { id: "w1-2", title: "Longest Substring Without Repeating Characters", completed: true },
      { id: "w1-3", title: "Minimum Window Substring & Character Counting", completed: false },
    ],
  },
  {
    week: "Week 2",
    title: "Recursion, Backtracking & Tree Traversals",
    topics: [
      { id: "w2-1", title: "Binary Tree Diameter & Maximum Path Sum", completed: true },
      { id: "w2-2", title: "Lowest Common Ancestor (LCA) via Binary Lifting", completed: false },
      { id: "w2-3", title: "Subsets & Permutations with Pruning", completed: false },
    ],
  },
  {
    week: "Week 3",
    title: "Dynamic Programming States & Optimization",
    topics: [
      { id: "w3-1", title: "0/1 Knapsack & Unbounded Space Reduction", completed: false },
      { id: "w3-2", title: "Longest Increasing Subsequence in O(N log N)", completed: false },
      { id: "w3-3", title: "DP on Trees & Re-rooting Technique", completed: false },
    ],
  },
  {
    week: "Week 4",
    title: "Graph Shortest Paths & System Architecture",
    topics: [
      { id: "w4-1", title: "Dijkstra with Priority Queue & Negative Cycle Checks", completed: false },
      { id: "w4-2", title: "Tarjan's Bridges and Strongly Connected Components", completed: false },
      { id: "w4-3", title: "High-Throughput Rate Limiting & Redis Token Bucket", completed: false },
    ],
  },
];

const SAMPLE_RESOURCES = [
  {
    id: 1,
    title: "Knight SDE 75 Patterns Master Checklist",
    category: "Interview Sheet",
    description: "The 75 most frequently repeated problem archetypes across FAANG and top product companies.",
    format: "Interactive Guide",
    tag: "Essential",
  },
  {
    id: 2,
    title: "Dynamic Programming 14 Standard Patterns & Recurrences",
    category: "Cheat Sheet",
    description: "Formulas and state definitions for 0/1 Knapsack, LIS, LCS, Matrix Chain, Interval DP, and Tree DP.",
    format: "PDF & Code Snippets",
    tag: "Algorithms",
  },
  {
    id: 3,
    title: "System Design Primer & Distributed Latency Numbers",
    category: "Architecture",
    description: "L1/L2 cache speeds, network roundtrip latencies, CAP theorem tradeoffs, and consistent hashing rings.",
    format: "Architecture Vault",
    tag: "System Design",
  },
  {
    id: 4,
    title: "C++ STL High-Performance Complexity Guide",
    category: "Systems",
    description: "Memory layout, cache locality, move semantics, and iterator invalidation rules.",
    format: "Reference Guide",
    tag: "Systems",
  },
];

const SAMPLE_RANKINGS = [
  { userId: 1, username: "Alex Chen", rating: 2150, problemsSolved: 312, rank: 1, streak: 34 },
  { userId: 2, username: "Sarah Jenkins", rating: 1980, problemsSolved: 274, rank: 2, streak: 28 },
  { userId: 3, username: "Vikram Malhotra", rating: 1820, problemsSolved: 215, rank: 3, streak: 19 },
  { userId: 4, username: "Dmitri Volkov", rating: 1740, problemsSolved: 189, rank: 4, streak: 15 },
  { userId: 5, username: "Aarav Patel", rating: 1680, problemsSolved: 164, rank: 5, streak: 12 },
];

export default function ClubDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [club, setClub] = useState(null);
  const [posts, setPosts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [curriculum, setCurriculum] = useState(SAMPLE_CURRICULUM);
  const [activeTab, setActiveTab] = useState("roadmap"); // "roadmap" | "discussions" | "chat" | "resources" | "rankings"
  const [discussionCategory, setDiscussionCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New post form
  const [postTitle, setPostTitle] = useState("");
  const [postCategory, setPostCategory] = useState("Doubt / Help Needed");
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [joining, setJoining] = useState(false);

  // New chat message
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    loadClubData();
  }, [id]);

  useEffect(() => {
    if (activeTab === "chat" && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const loadClubData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check rich sample clubs first
      const sampleMatch = RICH_SAMPLE_CLUBS.find((c) => String(c.id) === String(id));
      let clubData = sampleMatch;

      try {
        const clubRes = await clubsApi.getById(id);
        if (clubRes && clubRes.name) {
          clubData = { ...sampleMatch, ...clubRes };
        }
      } catch (backendErr) {
        console.warn("Backend club getById fallback:", backendErr);
      }

      if (!clubData) {
        clubData = {
          id: Number(id),
          name: "Knight Developers Guild",
          description: "An active collective of competitive coders, students, and system designers leveling up together.",
          visibility: "PUBLIC",
          memberCount: 30,
          joined: false,
          lead: "Knightzone Captain",
          category: "Placement & SDE",
          level: "All Levels Welcome",
          activeRoadmap: "Daily Problem Sprints & Peer Doubts",
          streakDays: 14,
          todayChallenge: { title: "Two Sum & Two Pointers", difficulty: "EASY", problemId: 1 },
        };
      }

      setClub(clubData);

      // Load sub-resources
      try {
        const [postsRes, rankingsRes, msgsRes] = await Promise.all([
          clubsApi.getPosts(id),
          clubsApi.getRankings(id),
          clubsApi.getMessages(id),
        ]);
        setPosts(Array.isArray(postsRes) && postsRes.length > 0 ? postsRes : SAMPLE_POSTS);
        setRankings(Array.isArray(rankingsRes) && rankingsRes.length > 0 ? rankingsRes : SAMPLE_RANKINGS);
        setMessages(Array.isArray(msgsRes) && msgsRes.length > 0 ? msgsRes : SAMPLE_MESSAGES);
      } catch (subErr) {
        setPosts(SAMPLE_POSTS);
        setRankings(SAMPLE_RANKINGS);
        setMessages(SAMPLE_MESSAGES);
      }

      // Load user completed roadmap items from localStorage
      try {
        const storedCurriculum = JSON.parse(
          localStorage.getItem(`kbz_curriculum_${id}`) || "null"
        );
        if (storedCurriculum) {
          setCurriculum(storedCurriculum);
        }
      } catch (e) {
        console.warn("Curriculum storage read error:", e);
      }
    } catch (err) {
      console.error("Failed to load club details:", err);
      setError("Failed to load club details.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTopic = (weekIndex, topicId) => {
    setCurriculum((prev) => {
      const updated = prev.map((w, wIdx) => {
        if (wIdx !== weekIndex) return w;
        return {
          ...w,
          topics: w.topics.map((t) =>
            t.id === topicId ? { ...t, completed: !t.completed } : t
          ),
        };
      });

      try {
        localStorage.setItem(`kbz_curriculum_${id}`, JSON.stringify(updated));
      } catch (e) {
        console.warn("Curriculum storage write error:", e);
      }
      return updated;
    });
  };

  const handleToggleJoin = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/clubs/${id}` } });
      return;
    }

    try {
      setJoining(true);
      const willJoin = !club.joined;

      try {
        if (willJoin) {
          await clubsApi.join(id);
        } else {
          await clubsApi.leave(id);
        }
      } catch (apiErr) {
        console.warn("Join/Leave API fallback:", apiErr);
      }

      setClub((prev) => ({
        ...prev,
        joined: willJoin,
        memberCount: willJoin
          ? (prev.memberCount || 0) + 1
          : Math.max(0, (prev.memberCount || 1) - 1),
      }));
    } finally {
      setJoining(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/clubs/${id}` } });
      return;
    }
    if (!postTitle.trim() || !postContent.trim()) return;

    try {
      setPosting(true);
      const newPostObj = {
        id: Date.now(),
        category: postCategory,
        title: postTitle.trim(),
        content: postContent.trim(),
        authorName: user?.name || "Knight User",
        createdAt: new Date().toISOString(),
        likesCount: 0,
      };

      try {
        await clubsApi.createPost(id, {
          title: postTitle.trim(),
          content: postContent.trim(),
        });
      } catch (apiErr) {
        console.warn("Create post API fallback:", apiErr);
      }

      setPosts((prev) => [newPostObj, ...prev]);
      setPostTitle("");
      setPostContent("");
    } finally {
      setPosting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/clubs/${id}` } });
      return;
    }

    try {
      setSendingMsg(true);
      const newMsg = {
        id: Date.now(),
        senderName: user?.name || "Knight Member",
        content: chatInput.trim(),
        sentAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      try {
        await clubsApi.createMessage(id, {
          content: chatInput.trim(),
        });
      } catch (msgErr) {
        console.warn("Chat message fallback:", msgErr);
      }

      setMessages((prev) => [...prev, newMsg]);
      setChatInput("");
    } finally {
      setSendingMsg(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0f0a] flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#c5ff55] border-t-transparent" />
        <p className="text-sm font-semibold text-[#aab1a1]">Loading guild hub...</p>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="min-h-screen bg-[#0c0f0a] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#161a14] p-8 text-center shadow-lg">
          <AlertCircle className="mx-auto h-12 w-12 text-rose-500 mb-3" />
          <h3 className="text-lg font-bold text-white">Guild Not Found</h3>
          <p className="text-xs text-[#aab1a1] mt-2 mb-6">
            The club you are looking for does not exist or has been moved.
          </p>
          <button
            onClick={() => navigate("/clubs")}
            className="w-full rounded-xl bg-[#c5ff55] px-4 py-2.5 text-xs font-black uppercase text-[#14170f] hover:bg-[#d5ff83] transition shadow-md shadow-[#c5ff55]/20"
          >
            Back to All Clubs
          </button>
        </div>
      </div>
    );
  }

  const todayProb = club.todayChallenge || {
    title: "Binary Tree Maximum Path Sum",
    difficulty: "HARD",
    problemId: 10,
  };

  const filteredPosts = posts.filter((p) => {
    if (discussionCategory === "ALL") return true;
    return p.category === discussionCategory;
  });

  return (
    <div className="min-h-screen bg-[#0c0f0a] text-[#e0e4dc] pb-16">
      {/* GUILD BANNER HEADER */}
      <div className="relative overflow-hidden border-b border-white/10 bg-[#121610] py-10 px-6 sm:px-10">
        <div className="absolute -right-12 -top-12 opacity-5 pointer-events-none">
          <KnightCrest className="w-80 h-80" />
        </div>

        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate("/clubs")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c5ff55] hover:text-[#d5ff83] mb-4 transition"
          >
            <ArrowLeft size={14} /> Back to Clubs
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#c5ff55] bg-[#c5ff55]/10 border border-[#c5ff55]/20 px-2.5 py-0.5 rounded-md">
                  {club.category || "Placement & SDE"}
                </span>

                <span className="text-xs font-semibold text-[#aab1a1]">
                  {club.memberCount || 1} Active Knights
                </span>

                {club.streakDays && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                    <Flame size={12} className="text-amber-400" />
                    {club.streakDays}d Streak
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-black text-white">{club.name}</h1>
              <p className="mt-2 text-xs text-[#aab1a1] max-w-xl leading-relaxed">
                {club.description}
              </p>

              {club.lead && (
                <p className="mt-2 text-[11px] font-bold text-[#788071]">
                  Guild Mentor / Lead: <span className="text-white">{club.lead}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => navigate("/arena")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition shadow-sm"
              >
                <Sword size={14} className="text-[#c5ff55]" />
                Spar With Squad Mates
              </button>

              <button
                disabled={joining}
                onClick={handleToggleJoin}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold transition shadow-sm ${
                  club.joined
                    ? "bg-[#c5ff55]/10 text-[#c5ff55] border border-[#c5ff55]/30 hover:bg-[#c5ff55]/20"
                    : "bg-[#c5ff55] text-[#14170f] font-black uppercase hover:bg-[#d5ff83]"
                }`}
              >
                {club.joined ? (
                  <>
                    <Check size={14} /> Member of Guild
                  </>
                ) : (
                  <>
                    <UserPlus size={14} /> Join Guild
                  </>
                )}
              </button>
            </div>
          </div>

          {/* TABS HEADER */}
          <div className="mt-8 flex flex-wrap items-center gap-2 bg-[#161a14] border border-white/10 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("roadmap")}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === "roadmap"
                  ? "bg-[#c5ff55] text-[#14170f] shadow-sm font-black"
                  : "text-[#aab1a1] hover:text-white"
              }`}
            >
              <Compass size={14} />
              Curriculum & Daily Challenge
            </button>

            <button
              onClick={() => setActiveTab("discussions")}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === "discussions"
                  ? "bg-[#c5ff55] text-[#14170f] shadow-sm font-black"
                  : "text-[#aab1a1] hover:text-white"
              }`}
            >
              <MessageSquare size={14} />
              Peer Doubts & Reviews ({posts.length})
            </button>

            <button
              onClick={() => setActiveTab("chat")}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === "chat"
                  ? "bg-[#c5ff55] text-[#14170f] shadow-sm font-black"
                  : "text-[#aab1a1] hover:text-white"
              }`}
            >
              <Zap size={14} className="text-[#c5ff55]" />
              Live Squad Stream ({messages.length})
            </button>

            <button
              onClick={() => setActiveTab("resources")}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === "resources"
                  ? "bg-[#c5ff55] text-[#14170f] shadow-sm font-black"
                  : "text-[#aab1a1] hover:text-white"
              }`}
            >
              <FileText size={14} />
              Resource Vault (4)
            </button>

            <button
              onClick={() => setActiveTab("rankings")}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === "rankings"
                  ? "bg-[#c5ff55] text-[#14170f] shadow-sm font-black"
                  : "text-[#aab1a1] hover:text-white"
              }`}
            >
              <Trophy size={14} />
              Guild Leaderboard
            </button>
          </div>
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="max-w-5xl mx-auto px-6 mt-8">
        {/* ==================== TAB 1: CURRICULUM & DAILY CHALLENGE ==================== */}
        {activeTab === "roadmap" && (
          <div className="space-y-6">
            {/* PINNED DAILY SQUAD PROBLEM */}
            <div className="rounded-3xl border border-[#c5ff55]/30 bg-[#161a14] p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#c5ff55] bg-[#c5ff55]/10 border border-[#c5ff55]/20 px-3 py-1 rounded-full mb-2">
                    <Target size={13} />
                    Today's Curated Squad Problem
                  </span>
                  <h3 className="text-xl font-black text-white">
                    {todayProb.title}
                  </h3>
                  <p className="text-xs text-[#aab1a1] mt-1">
                    Assigned by guild mentor • Complete today to advance the squad's 24-day accountability streak.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-xs font-black text-amber-400">
                    {todayProb.difficulty}
                  </span>
                  <button
                    onClick={() => navigate(`/problems/${todayProb.problemId || 1}`)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#c5ff55] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#14170f] hover:bg-[#d5ff83] transition shadow-md shadow-[#c5ff55]/20"
                  >
                    Solve Problem Now <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* 4-WEEK STRUCTURED ROADMAP TRACKER */}
            <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-black text-white">
                    Guild Learning Roadmap & Progress
                  </h3>
                  <p className="text-xs text-[#aab1a1] mt-0.5">
                    Interactive checklist: mark topics completed as you practice them.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#c5ff55] bg-[#c5ff55]/10 px-3 py-1 rounded-full border border-[#c5ff55]/20">
                  4-Week Track
                </span>
              </div>

              <div className="space-y-6">
                {curriculum.map((week, wIdx) => (
                  <div key={week.week} className="rounded-2xl border border-white/10 bg-[#121610] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black uppercase text-[#c5ff55]">
                        {week.week}: {week.title}
                      </span>
                      <span className="text-[11px] font-bold text-[#788071]">
                        {week.topics.filter((t) => t.completed).length} / {week.topics.length} done
                      </span>
                    </div>

                    <div className="space-y-2">
                      {week.topics.map((top) => (
                        <div
                          key={top.id}
                          onClick={() => handleToggleTopic(wIdx, top.id)}
                          className="flex items-center justify-between rounded-xl bg-black/40 p-3 border border-white/10 text-xs cursor-pointer hover:border-[#c5ff55]/40 transition"
                        >
                          <span
                            className={`font-semibold ${
                              top.completed
                                ? "line-through text-[#788071]"
                                : "text-white"
                            }`}
                          >
                            {top.title}
                          </span>

                          <button className="text-[#c5ff55]">
                            {top.completed ? (
                              <CheckSquare size={16} className="text-[#c5ff55]" />
                            ) : (
                              <Square size={16} className="text-white/20" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: PEER DOUBTS & CODE REVIEWS ==================== */}
        {activeTab === "discussions" && (
          <div className="space-y-6">
            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-[#788071] uppercase tracking-wider mr-1">
                Filter:
              </span>
              {["ALL", "Doubt / Help Needed", "Editorial & Proof", "Interview Experience"].map((f) => (
                <button
                  key={f}
                  onClick={() => setDiscussionCategory(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    discussionCategory === f
                      ? "bg-[#c5ff55] text-[#14170f] font-black"
                      : "bg-[#161a14] border border-white/10 text-[#aab1a1] hover:border-white/20 hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Post Doubt Form */}
            {isAuthenticated ? (
              <form
                onSubmit={handleCreatePost}
                className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-sm"
              >
                <h3 className="text-sm font-bold text-white mb-3">
                  Ask a Doubt or Share an Editorial
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <input
                    type="text"
                    required
                    placeholder="Question title (e.g. Invariant in Tree DP...)"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className="sm:col-span-2 rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs font-medium text-white placeholder:text-[#788071] focus:outline-none focus:border-[#c5ff55] transition"
                  />

                  <select
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value)}
                    className="rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs font-medium text-white focus:outline-none focus:border-[#c5ff55] transition"
                  >
                    <option value="Doubt / Help Needed" className="bg-[#161a14] text-white">Doubt / Help Needed</option>
                    <option value="Editorial & Proof" className="bg-[#161a14] text-white">Editorial & Proof</option>
                    <option value="Interview Experience" className="bg-[#161a14] text-white">Interview Experience</option>
                  </select>
                </div>

                <textarea
                  required
                  rows={3}
                  placeholder="Paste your approach, code snippet, or where you are stuck..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full mb-3 rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs font-medium text-white placeholder:text-[#788071] focus:outline-none focus:border-[#c5ff55] transition"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={posting || !postTitle.trim() || !postContent.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#c5ff55] px-5 py-2 text-xs font-black uppercase tracking-wider text-[#14170f] hover:bg-[#d5ff83] disabled:opacity-50 transition shadow-md shadow-[#c5ff55]/20"
                  >
                    <Send size={13} />
                    {posting ? "Publishing..." : "Publish to Guild"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-[#161a14] p-4 text-center text-xs text-[#aab1a1]">
                <Link to="/login" className="text-[#c5ff55] font-bold underline">
                  Login
                </Link>{" "}
                to ask doubts and participate in peer code reviews.
              </div>
            )}

            {/* Posts List */}
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-white/10 bg-[#161a14] p-5 shadow-sm transition hover:border-[#c5ff55]/40"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-[#c5ff55]/10 border border-[#c5ff55]/20 px-2.5 py-0.5 text-[10px] font-black text-[#c5ff55] uppercase">
                        {post.category || "General"}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {post.authorName || "Guild Member"}
                      </span>
                    </div>

                    <span className="text-[11px] text-[#788071]">
                      {post.createdAt
                        ? new Date(post.createdAt).toLocaleDateString()
                        : "Recently"}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white">
                    {post.title}
                  </h4>

                  <p className="mt-2 text-xs text-[#aab1a1] leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: LIVE SQUAD CHAT ==================== */}
        {activeTab === "chat" && (
          <div className="rounded-3xl border border-white/10 bg-[#161a14] shadow-sm overflow-hidden flex flex-col h-[520px]">
            <div className="p-4 border-b border-white/10 bg-[#121610] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#c5ff55] animate-pulse" />
                <span className="text-xs font-bold text-white">
                  {club.name} • Live Squad Stream
                </span>
              </div>
              <span className="text-[11px] text-[#788071]">
                {club.memberCount || 1} members active
              </span>
            </div>

            {/* Chat Messages */}
            <div
              ref={chatScrollRef}
              className="flex-1 p-5 overflow-y-auto space-y-3 bg-[#0c0f0a]"
            >
              {messages.map((msg) => (
                <div key={msg.id} className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-[#c5ff55]">
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] text-[#788071]">{msg.sentAt}</span>
                  </div>
                  <div className="inline-block max-w-lg rounded-2xl border border-white/10 bg-[#161a14] p-3 text-xs text-[#e0e4dc] shadow-sm leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-white/10 bg-[#121610] flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={
                  isAuthenticated
                    ? "Ask a quick question or chat with squad..."
                    : "Login to participate in squad chat..."
                }
                disabled={!isAuthenticated || sendingMsg}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs font-medium text-white placeholder:text-[#788071] focus:outline-none focus:border-[#c5ff55] disabled:opacity-50 transition"
              />
              <button
                type="submit"
                disabled={!isAuthenticated || sendingMsg || !chatInput.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#c5ff55] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#14170f] hover:bg-[#d5ff83] disabled:opacity-50 transition shadow-md shadow-[#c5ff55]/20"
              >
                <Send size={13} />
                Send
              </button>
            </form>
          </div>
        )}

        {/* ==================== TAB 4: RESOURCE VAULT ==================== */}
        {activeTab === "resources" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-base font-black text-white">
                  Guild Resource Vault & Cheatsheets
                </h3>
                <p className="text-xs text-[#aab1a1] mt-0.5">
                  Curated sheets, interview pattern checklists, and reference guides.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SAMPLE_RESOURCES.map((res) => (
                <div
                  key={res.id}
                  className="rounded-2xl border border-white/10 bg-[#161a14] p-5 shadow-sm transition hover:border-[#c5ff55]/40 hover:shadow-lg hover:shadow-[#c5ff55]/5"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">
                      {res.category}
                    </span>
                    <span className="text-xs font-semibold text-[#c5ff55]">
                      {res.format}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">
                    {res.title}
                  </h4>
                  <p className="text-xs text-[#aab1a1] mt-1.5 leading-relaxed">
                    {res.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#788071]">
                      Verified by Guild Lead
                    </span>
                    <button
                      onClick={() => alert(`Accessing "${res.title}". Document unlocked for guild members.`)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#c5ff55] hover:text-[#d5ff83] transition"
                    >
                      Open Sheet <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 5: GUILD LEADERBOARD ==================== */}
        {activeTab === "rankings" && (
          <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-sm">
            <h3 className="text-base font-black text-white mb-4">
              Guild Member Rankings & Solved Sprints
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[#788071] uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-bold">Rank</th>
                    <th className="pb-3 font-bold">Knight Member</th>
                    <th className="pb-3 font-bold text-center">Contest Rating</th>
                    <th className="pb-3 font-bold text-center">Streak</th>
                    <th className="pb-3 font-bold text-right">Problems Solved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rankings.map((r, i) => (
                    <tr key={r.userId || i} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 font-black text-[#c5ff55]">
                        #{r.rank || i + 1}
                      </td>
                      <td className="py-3.5 font-bold text-white">
                        {r.username || `Knight_${r.userId}`}
                      </td>
                      <td className="py-3.5 text-center font-mono font-bold text-emerald-400">
                        {r.rating || 1200}
                      </td>
                      <td className="py-3.5 text-center font-mono font-bold text-amber-400">
                        {r.streak || 14}d
                      </td>
                      <td className="py-3.5 text-right font-mono font-bold text-white">
                        {r.problemsSolved || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
