import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Plus,
  Shield,
  Sparkles,
  ArrowRight,
  Check,
  UserPlus,
  Globe,
  Lock,
  MessageSquare,
  AlertCircle,
  Hash,
  X,
  BookOpen,
  Target,
  Flame,
  Trophy,
  Award,
  Compass,
  Zap,
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  BarChart3,
  Star,
  Filter,
  HeartHandshake,
  FileText,
  Code2,
} from "lucide-react";
import { clubsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { KnightCrest, TrophyIllustration } from "../components/svg";

export const RICH_SAMPLE_CLUBS = [
  {
    id: 1,
    name: "SDE Placement & FAANG Sprint Squad",
    category: "Placement & SDE",
    level: "All Levels (Interview Focused)",
    targetRating: "1300+",
    description: "Daily curated problems for Amazon, Google, Microsoft, and top tier product startups. Resume reviews, mock coding interviews, and DSA pattern checklists.",
    visibility: "PUBLIC",
    memberCount: 86,
    activeRoadmap: "Striver SDE 60-Day Sprint (Day 18: Binary Trees & Traversals)",
    weeklyGoal: { solved: 72, target: 100 },
    streakDays: 24,
    lead: "Alex Chen (Incoming SDE @ Razorpay)",
    todayChallenge: { title: "Binary Tree Maximum Path Sum", difficulty: "HARD", problemId: 10 },
    joined: false,
    tags: ["Interview Prep", "Trees & Graphs", "Mock Interviews", "System Design"],
    perks: [
      "Weekly mock interview pairing with senior knights",
      "Company-wise past interview question vault",
      "Daily problem accountability check-in",
    ],
  },
  {
    id: 2,
    name: "Algorithms & Grandmaster Duelists",
    category: "Competitive Programming",
    level: "Intermediate to Advanced",
    targetRating: "1400+",
    description: "High-intensity contest training group. Deep dives into Dynamic Programming states, Segment Trees, Trie, Graph Shortest Paths, and 1v1 speed duels.",
    visibility: "PUBLIC",
    memberCount: 64,
    activeRoadmap: "Advanced DP on Trees & Bitmasking (Week 3)",
    weeklyGoal: { solved: 54, target: 75 },
    streakDays: 41,
    lead: "Sarah Jenkins (1850 Knight Master)",
    todayChallenge: { title: "Shortest Path in Weighted DAG", difficulty: "MEDIUM", problemId: 13 },
    joined: true,
    tags: ["DP", "Segment Trees", "1v1 Duels", "Codeforces"],
    perks: [
      "Live post-contest problem analysis & editorial breakdowns",
      "Weekly private guild speed battles with rating stakes",
      "Automated testcase stress-testing templates",
    ],
  },
  {
    id: 3,
    name: "Zero to Hero: DSA Beginners Guild",
    category: "Beginner Friendly",
    level: "Beginner (0 - 1200 Rating)",
    targetRating: "Beginner Friendly",
    description: "Safe, supportive circle for beginners starting their coding journey. We break down Big-O notation, Arrays, Strings, HashMaps, and Recursion with step-by-step guidance.",
    visibility: "PUBLIC",
    memberCount: 112,
    activeRoadmap: "DSA Fundamentals: Two Pointers & Sliding Window",
    weeklyGoal: { solved: 88, target: 120 },
    streakDays: 19,
    lead: "Vikram Malhotra (Peer Mentor)",
    todayChallenge: { title: "Two Sum & Two Pointers Invariants", difficulty: "EASY", problemId: 1 },
    joined: false,
    tags: ["Beginner", "Two Pointers", "Big-O", "HashMaps"],
    perks: [
      "No question is too basic - friendly peer doubt clearing",
      "Visual memory and algorithm animation walkthroughs",
      "Step-by-step daily practice challenges",
    ],
  },
  {
    id: 4,
    name: "Distributed Systems & Cloud Architecture",
    category: "System Design",
    level: "Intermediate to Pro",
    targetRating: "1350+",
    description: "Hands-on engineering circle exploring Raft consensus, consistent hashing rings, low-latency Redis caching, Kafka streaming, and scalable backend services.",
    visibility: "PUBLIC",
    memberCount: 48,
    activeRoadmap: "CAP Theorem & Consistent Hashing Partitioning",
    weeklyGoal: { solved: 32, target: 50 },
    streakDays: 15,
    lead: "Dmitri Volkov (Cloud Architect)",
    todayChallenge: { title: "Design a High-Throughput Rate Limiter", difficulty: "MEDIUM", problemId: 7 },
    joined: false,
    tags: ["Distributed Systems", "Kafka", "Redis", "Microservices"],
    perks: [
      "Real-world architecture design review sessions",
      "Low-level C++ & Go systems code breakdowns",
      "System design mock interview panels",
    ],
  },
  {
    id: 5,
    name: "Web Performance & Full-Stack Knights",
    category: "Full Stack",
    level: "All Levels",
    targetRating: "All Levels",
    description: "Optimizing React rendering lifecycles, Vite bundlers, Node.js event loops, and building high-polish web applications with state-of-the-art UX.",
    visibility: "PUBLIC",
    memberCount: 55,
    activeRoadmap: "Modern Micro-frontends & Virtualized Lists",
    weeklyGoal: { solved: 40, target: 60 },
    streakDays: 12,
    lead: "Aarav Patel (Full-Stack Engineer)",
    todayChallenge: { title: "LRU Cache Memory Implementation", difficulty: "MEDIUM", problemId: 9 },
    joined: false,
    tags: ["React", "Node.js", "Web Performance", "Architecture"],
    perks: [
      "Real-world open-source pull request collaboration",
      "Frontend system design & state persistence patterns",
      "UI review and accessibility optimization clinics",
    ],
  },
];

export default function Clubs() {
  const { isNight } = useTheme();
  const [clubs, setClubs] = useState(RICH_SAMPLE_CLUBS);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "my_clubs"
  const [selectedGoal, setSelectedGoal] = useState("ALL"); // "ALL" | "Placement" | "Beginner" | "Contest" | "System Design"
  const [searchQuery, setSearchQuery] = useState("");
  const [joiningId, setJoiningId] = useState(null);

  // New club modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClubName, setNewClubName] = useState("");
  const [newClubDesc, setNewClubDesc] = useState("");
  const [newClubCategory, setNewClubCategory] = useState("Placement & SDE");
  const [newClubRoadmap, setNewClubRoadmap] = useState("");
  const [newClubVisibility, setNewClubVisibility] = useState("PUBLIC");
  const [creating, setCreating] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      setLoading(true);
      const data = await clubsApi.getAll();
      if (Array.isArray(data) && data.length > 0) {
        // Merge rich sample properties with remote data
        const merged = [...data];
        RICH_SAMPLE_CLUBS.forEach((sc) => {
          if (!merged.some((m) => m.name?.toLowerCase() === sc.name.toLowerCase())) {
            merged.push(sc);
          }
        });
        setClubs(merged);
      } else {
        setClubs(RICH_SAMPLE_CLUBS);
      }
    } catch (err) {
      console.warn("Using rich verified clubs suite:", err);
      setClubs(RICH_SAMPLE_CLUBS);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleJoin = async (e, club) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/clubs" } });
      return;
    }

    try {
      setJoiningId(club.id);
      const willJoin = !club.joined;

      try {
        if (willJoin) {
          await clubsApi.join(club.id);
        } else {
          await clubsApi.leave(club.id);
        }
      } catch (apiErr) {
        console.warn("Clubs API join/leave local fallback:", apiErr);
      }

      setClubs((prev) =>
        prev.map((c) =>
          c.id === club.id
            ? {
                ...c,
                joined: willJoin,
                memberCount: willJoin
                  ? (c.memberCount || 0) + 1
                  : Math.max(0, (c.memberCount || 1) - 1),
              }
            : c
        )
      );
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreateClub = async (e) => {
    e.preventDefault();
    if (!newClubName.trim()) return;

    try {
      setCreating(true);
      const newClubObj = {
        id: Date.now(),
        name: newClubName.trim(),
        description: newClubDesc.trim(),
        category: newClubCategory,
        activeRoadmap: newClubRoadmap.trim() || "Active Problem Solving & Discussions",
        level: "All Levels Welcome",
        targetRating: "Open",
        visibility: newClubVisibility,
        memberCount: 1,
        weeklyGoal: { solved: 0, target: 50 },
        streakDays: 1,
        joined: true,
        lead: user?.name || "Knight Captain",
        tags: [newClubCategory, "Peer Learning"],
        perks: [
          "Curated problem playlists set by guild lead",
          "Dedicated squad chat and discussion room",
          "Weekly member leaderboard updates",
        ],
      };

      try {
        await clubsApi.createClub({
          name: newClubName.trim(),
          description: newClubDesc.trim(),
          visibility: newClubVisibility,
        });
      } catch (apiErr) {
        console.warn("Create club API fallback:", apiErr);
      }

      setClubs((prev) => [newClubObj, ...prev]);
      setShowCreateModal(false);
      setNewClubName("");
      setNewClubDesc("");
      setNewClubRoadmap("");
    } finally {
      setCreating(false);
    }
  };

  const myClubs = clubs.filter((c) => c.joined);

  const filteredClubs = (activeTab === "my_clubs" ? myClubs : clubs).filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      c.name?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      (c.tags && c.tags.some((t) => t.toLowerCase().includes(q)));

    if (!matchesSearch) return false;

    if (selectedGoal === "Placement") {
      return c.category?.toLowerCase().includes("placement");
    }
    if (selectedGoal === "Beginner") {
      return c.category?.toLowerCase().includes("beginner");
    }
    if (selectedGoal === "Contest") {
      return c.category?.toLowerCase().includes("competitive");
    }
    if (selectedGoal === "System Design") {
      return c.category?.toLowerCase().includes("system");
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0c0f0a] text-[#e0e4dc] pb-16">
      {/* HERO SECTION WITH REAL VALUE PROPOSITION */}
      <div className="relative overflow-hidden border-b border-white/10 bg-[#121610] py-12 px-6 sm:px-10">
        <div className="absolute -right-12 -top-12 opacity-5 pointer-events-none">
          <KnightCrest className="w-96 h-96" />
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c5ff55]/20 bg-[#c5ff55]/[0.06] px-3.5 py-1 text-xs font-bold text-[#c5ff55] mb-3">
                <HeartHandshake size={14} className="text-[#c5ff55]" />
                Collaborative Peer Learning & Squad Accountability
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Coding Clubs & Circles
              </h1>
              <p className="mt-2.5 text-sm text-[#aab1a1] leading-relaxed">
                Coding alone is slow and lonely. Join a dedicated squad to solve daily curated roadmaps,
                participate in peer code reviews, practice 1v1 duels, and crack placement drives together.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate("/login", { state: { from: "/clubs" } });
                  } else {
                    setShowCreateModal(true);
                  }
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#c5ff55] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#14170f] hover:bg-[#d5ff83] transition shadow-md shadow-[#c5ff55]/20"
              >
                <Plus size={16} />
                Create New Guild
              </button>
            </div>
          </div>

          {/* 4 VALUE PILLARS - WHY CLUBS ARE HELPFUL */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="rounded-2xl border border-white/10 bg-[#161a14] p-4 shadow-sm hover:border-[#c5ff55]/40 transition">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#c5ff55] mb-2.5 font-bold">
                <Target size={18} />
              </div>
              <h4 className="text-xs font-black text-white">Daily Problem Sprints</h4>
              <p className="text-[11px] text-[#aab1a1] mt-1 leading-normal">
                Curated problems with team streak accountability.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#161a14] p-4 shadow-sm hover:border-[#c5ff55]/40 transition">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#c5ff55] mb-2.5 font-bold">
                <HelpCircle size={18} />
              </div>
              <h4 className="text-xs font-black text-white">Peer Doubt Clearing</h4>
              <p className="text-[11px] text-[#aab1a1] mt-1 leading-normal">
                Get unstuck in minutes with answers from senior knights.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#161a14] p-4 shadow-sm hover:border-[#c5ff55]/40 transition">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#c5ff55] mb-2.5 font-bold">
                <Zap size={18} />
              </div>
              <h4 className="text-xs font-black text-white">Squad 1v1 Sparring</h4>
              <p className="text-[11px] text-[#aab1a1] mt-1 leading-normal">
                Friendly speed battles with club mates in your rating range.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#161a14] p-4 shadow-sm hover:border-[#c5ff55]/40 transition">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#c5ff55] mb-2.5 font-bold">
                <FileText size={18} />
              </div>
              <h4 className="text-xs font-black text-white">Placement Roadmaps</h4>
              <p className="text-[11px] text-[#aab1a1] mt-1 leading-normal">
                Structured sheets, mock interviews, and FAANG checklists.
              </p>
            </div>
          </div>

          {/* TABS & SEARCH BAR */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-[#161a14] border border-white/10 p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === "all"
                    ? "bg-[#c5ff55] text-[#14170f] shadow-sm font-black uppercase"
                    : "text-[#aab1a1] hover:text-white"
                }`}
              >
                Explore Guilds ({clubs.length})
              </button>
              <button
                onClick={() => setActiveTab("my_clubs")}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === "my_clubs"
                    ? "bg-[#c5ff55] text-[#14170f] shadow-sm font-black uppercase"
                    : "text-[#aab1a1] hover:text-white"
                }`}
              >
                My Joined Squads ({myClubs.length})
              </button>
            </div>

            <div className="relative w-full sm:w-80">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#788071]"
              />
              <input
                type="text"
                placeholder="Search by goal, company, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-white/15 bg-black/40 text-white placeholder:text-[#788071] focus:outline-none focus:border-[#c5ff55] transition"
              />
            </div>
          </div>

          {/* GOAL / LEVEL QUICK RECOMMENDER */}
          {activeTab === "all" && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-[#788071] uppercase tracking-wider mr-1">
                Your Goal:
              </span>
              {[
                { id: "ALL", label: "All Guilds" },
                { id: "Placement", label: "Placement & SDE Prep" },
                { id: "Beginner", label: "Beginner Friendly (0-1200)" },
                { id: "Contest", label: "Competitive Programming" },
                { id: "System Design", label: "Distributed Systems" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedGoal(filter.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    selectedGoal === filter.id
                      ? "bg-[#c5ff55] text-[#14170f] font-black"
                      : "bg-[#161a14] border border-white/10 text-[#aab1a1] hover:border-white/20 hover:text-white"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CLUBS DIRECTORY GRID */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#c5ff55] border-t-transparent" />
            <p className="text-sm font-semibold text-[#aab1a1]">
              Discovering active developer squads...
            </p>
          </div>
        ) : filteredClubs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#161a14] p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-[#788071] mb-3" />
            <h3 className="text-base font-bold text-white">
              {activeTab === "my_clubs"
                ? "You haven't joined any coding clubs yet"
                : "No clubs match your current criteria"}
            </h3>
            <p className="text-xs text-[#aab1a1] mt-1 mb-4">
              {activeTab === "my_clubs"
                ? "Explore public guilds to start learning and solving problems with peers."
                : "Try selecting 'All Guilds' or adjusting your search term."}
            </p>
            {activeTab === "my_clubs" && (
              <button
                onClick={() => setActiveTab("all")}
                className="px-4 py-2 text-xs font-black uppercase text-[#14170f] bg-[#c5ff55] rounded-xl hover:bg-[#d5ff83] transition shadow-md shadow-[#c5ff55]/20"
              >
                Browse All Guilds
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredClubs.map((club) => {
              const isJoined = club.joined;
              const isUpdating = joiningId === club.id;
              const goalProgress = club.weeklyGoal
                ? Math.round((club.weeklyGoal.solved / club.weeklyGoal.target) * 100)
                : 60;

              return (
                <div
                  key={club.id}
                  onClick={() => navigate(`/clubs/${club.id}`)}
                  className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-[#161a14] p-6 sm:p-7 shadow-sm transition hover:border-[#c5ff55]/40 hover:shadow-lg hover:shadow-[#c5ff55]/5 cursor-pointer"
                >
                  <div>
                    {/* Top Meta Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c5ff55] bg-[#c5ff55]/10 border border-[#c5ff55]/20 px-3 py-1 rounded-lg">
                        <Users size={13} />
                        {club.memberCount || 1} Members
                      </span>

                      <div className="flex items-center gap-2">
                        {club.streakDays && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                            <Flame size={12} className="text-amber-400" />
                            {club.streakDays}d Streak
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#aab1a1] bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                          {club.visibility === "PRIVATE" ? (
                            <>
                              <Lock size={10} /> Private
                            </>
                          ) : (
                            <>
                              <Globe size={10} /> Public
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Category & Title */}
                    {club.category && (
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#788071] mb-1">
                        {club.category} • <span className="text-[#c5ff55]">{club.level || "All Levels"}</span>
                      </p>
                    )}

                    <h3
                      className={`text-xl font-black transition ${
                        isNight
                          ? "text-white group-hover:text-[#c5ff55]"
                          : "text-slate-900 group-hover:text-emerald-700"
                      }`}
                    >
                      {club.name}
                    </h3>

                    <p className="mt-2 text-xs text-[#aab1a1] leading-relaxed line-clamp-2">
                      {club.description}
                    </p>

                    {/* ACTIVE ROADMAP BADGE */}
                    {club.activeRoadmap && (
                      <div className="mt-3.5 rounded-xl border border-[#c5ff55]/20 bg-[#c5ff55]/[0.05] p-3">
                        <div className="flex items-center justify-between text-xs font-bold text-[#c5ff55] mb-1">
                          <span className="flex items-center gap-1.5">
                            <Compass size={13} className="text-[#c5ff55]" />
                            Active Curriculum:
                          </span>
                          <span className="text-[10px] uppercase tracking-wider">Live Sprint</span>
                        </div>
                        <p className="text-xs text-white font-semibold">
                          {club.activeRoadmap}
                        </p>
                      </div>
                    )}

                    {/* WEEKLY SQUAD PROGRESS BAR */}
                    {club.weeklyGoal && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-[#788071]">Weekly Squad Target:</span>
                          <span className="text-[#c5ff55]">
                            {club.weeklyGoal.solved} / {club.weeklyGoal.target} Solved ({goalProgress}%)
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/40 border border-white/10">
                          <div
                            className="h-full rounded-full bg-[#c5ff55] transition-all duration-500"
                            style={{ width: `${Math.min(100, goalProgress)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* SQUAD PERKS LIST */}
                    {club.perks && club.perks.length > 0 && (
                      <div className="mt-3.5 space-y-1.5">
                        {club.perks.slice(0, 2).map((perk, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-[#aab1a1]">
                            <CheckCircle2 size={13} className="text-[#c5ff55] shrink-0" />
                            <span className="truncate">{perk}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* LEAD */}
                    {club.lead && (
                      <p className="mt-3 text-[11px] text-[#788071] font-semibold">
                        Lead: <strong className="text-white">{club.lead}</strong>
                      </p>
                    )}
                  </div>

                  {/* CARD FOOTER */}
                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c5ff55] group-hover:underline">
                      Enter Guild Portal <ArrowRight size={13} />
                    </span>

                    <button
                      disabled={isUpdating}
                      onClick={(e) => handleToggleJoin(e, club)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm ${
                        isJoined
                          ? "bg-[#c5ff55]/10 text-[#c5ff55] border border-[#c5ff55]/30 hover:bg-[#c5ff55]/20"
                          : "bg-[#c5ff55] text-[#14170f] font-black uppercase hover:bg-[#d5ff83]"
                      }`}
                    >
                      {isJoined ? (
                        <>
                          <Check size={13} />
                          Joined
                        </>
                      ) : (
                        <>
                          <UserPlus size={13} />
                          Join Guild
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE GUILD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#161a14] p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#c5ff55]">
                  Knight Community
                </span>
                <h3 className="text-lg font-black text-white">
                  Start a Developer Squad
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-[#aab1a1] hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateClub} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white mb-1.5">
                  Guild Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Graph Masters & DP Coders"
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs font-medium text-white placeholder:text-[#788071] focus:outline-none focus:border-[#c5ff55] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1.5">
                  Target Domain / Category *
                </label>
                <select
                  value={newClubCategory}
                  onChange={(e) => setNewClubCategory(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs font-medium text-white focus:outline-none focus:border-[#c5ff55] transition"
                >
                  <option value="Placement & SDE" className="bg-[#161a14] text-white">Placement & SDE Interview Prep</option>
                  <option value="Beginner Friendly" className="bg-[#161a14] text-white">Beginner Friendly (0 - 1200 Rating)</option>
                  <option value="Competitive Programming" className="bg-[#161a14] text-white">Competitive Programming & Duels</option>
                  <option value="System Design" className="bg-[#161a14] text-white">Distributed Systems & Backend</option>
                  <option value="Full Stack" className="bg-[#161a14] text-white">Full Stack & Production Web</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1.5">
                  Description & Mission *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="What will your squad practice, discuss, or compete in?"
                  value={newClubDesc}
                  onChange={(e) => setNewClubDesc(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs font-medium text-white placeholder:text-[#788071] focus:outline-none focus:border-[#c5ff55] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1.5">
                  Initial Curriculum / Roadmap
                </label>
                <input
                  type="text"
                  placeholder="e.g. 30 Days of Dynamic Programming & Trees"
                  value={newClubRoadmap}
                  onChange={(e) => setNewClubRoadmap(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs font-medium text-white placeholder:text-[#788071] focus:outline-none focus:border-[#c5ff55] transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newClubName.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#c5ff55] px-5 py-2 text-xs font-black uppercase tracking-wider text-[#14170f] hover:bg-[#d5ff83] disabled:opacity-50 transition shadow-md shadow-[#c5ff55]/20"
                >
                  <Plus size={14} />
                  {creating ? "Creating Guild..." : "Launch Guild"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
