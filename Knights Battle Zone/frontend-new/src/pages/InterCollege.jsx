import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Trophy,
  Swords,
  Medal,
  Users,
  Search,
  Sparkles,
  Building,
  ChevronRight,
  Flame,
  Award,
  Globe,
  ArrowUpRight,
  Shield,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { interCollegeApi } from "../services/api";

const TOP_COLLEGES = [
  {
    rank: 1,
    name: "IIT Roorkee",
    shortName: "IITR",
    location: "Uttarakhand",
    points: 14820,
    activeCoders: 412,
    solvedProblems: 3840,
    winRate: "78.4%",
    tier: "Diamond Division",
    badge: "Champion",
  },
  {
    rank: 2,
    name: "IIT Delhi",
    shortName: "IITD",
    location: "New Delhi",
    points: 14190,
    activeCoders: 385,
    solvedProblems: 3620,
    winRate: "76.1%",
    tier: "Diamond Division",
    badge: "Runner Up",
  },
  {
    rank: 3,
    name: "IIIT Hyderabad",
    shortName: "IIITH",
    location: "Telangana",
    points: 13950,
    activeCoders: 320,
    solvedProblems: 3510,
    winRate: "79.8%",
    tier: "Diamond Division",
    badge: "Top Algorithmic",
  },
  {
    rank: 4,
    name: "BITS Pilani",
    shortName: "BITS",
    location: "Rajasthan",
    points: 12840,
    activeCoders: 290,
    solvedProblems: 3120,
    winRate: "72.3%",
    tier: "Platinum Division",
    badge: "Elite",
  },
  {
    rank: 5,
    name: "IIT Bombay",
    shortName: "IITB",
    location: "Maharashtra",
    points: 12610,
    activeCoders: 275,
    solvedProblems: 2980,
    winRate: "74.5%",
    tier: "Platinum Division",
    badge: "Elite",
  },
  {
    rank: 6,
    name: "NIT Trichy",
    shortName: "NITT",
    location: "Tamil Nadu",
    points: 11400,
    activeCoders: 240,
    solvedProblems: 2650,
    winRate: "69.8%",
    tier: "Gold Division",
    badge: "Contender",
  },
  {
    rank: 7,
    name: "DTU Delhi",
    shortName: "DTU",
    location: "New Delhi",
    points: 10920,
    activeCoders: 260,
    solvedProblems: 2490,
    winRate: "68.2%",
    tier: "Gold Division",
    badge: "Contender",
  },
];

export default function InterCollege() {
  const { user, isAuthenticated } = useAuth();
  const { isNight } = useTheme();

  const [colleges, setColleges] = useState(TOP_COLLEGES);
  const [search, setSearch] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("All");

  useEffect(() => {
    interCollegeApi
      .getCurrentRankings()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // Merge with sample visual metrics
          const mapped = data.map((d, idx) => ({
            rank: idx + 1,
            name: d.collegeName || d.name || `University #${idx + 1}`,
            shortName: (d.collegeName || "UNI").slice(0, 5).toUpperCase(),
            location: "India",
            points: Math.round(d.totalScore || 10000 + (10 - idx) * 450),
            activeCoders: 150 + (10 - idx) * 20,
            solvedProblems: 1800 + (10 - idx) * 150,
            winRate: `${(70 + (10 - idx)).toFixed(1)}%`,
            tier: idx < 3 ? "Diamond Division" : idx < 6 ? "Platinum Division" : "Gold Division",
            badge: idx === 0 ? "Champion" : idx === 1 ? "Runner Up" : "Contender",
          }));
          setColleges(mapped);
        }
      })
      .catch(() => null);
  }, []);

  const filtered = colleges.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.location.toLowerCase().includes(search.toLowerCase());
    const matchesDiv = selectedDivision === "All" || c.tier.toLowerCase().includes(selectedDivision.toLowerCase());
    return matchesSearch && matchesDiv;
  });

  return (
    <div className={`min-h-screen px-4 py-8 sm:px-6 lg:px-10 ${isNight ? "bg-[#0c0f0a] text-white" : "bg-[#f8faf6] text-slate-900"}`}>
      <div className="mx-auto max-w-7xl">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#c5ff55]/10 border border-[#c5ff55]/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#c5ff55] mb-2">
              <GraduationCap size={14} />
              National Collegiate Coding Championship
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Inter-College <span className="text-[#c5ff55]">Battle Arena</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#8f9d8a]">
              Campus vs Campus leaderboard, monthly varsity grand prix tournaments, and collegiate rivalry standings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/arena"
              className="inline-flex items-center gap-2 rounded-xl bg-[#c5ff55] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#14170f] shadow-md shadow-[#c5ff55]/20 hover:bg-[#d5ff83] transition"
            >
              <Swords size={15} /> 1v1 Campus Duel
            </Link>
            <Link
              to="/contests"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition"
            >
              <Trophy size={14} className="text-[#c5ff55]" /> Weekend Grand Prix
            </Link>
          </div>
        </div>

        {/* Podium Top 3 Universities */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {colleges.slice(0, 3).map((podiumCollege, idx) => {
            const isFirst = idx === 0;
            return (
              <div
                key={podiumCollege.name}
                className={`relative rounded-3xl border p-6 flex flex-col justify-between overflow-hidden shadow-2xl transition ${
                  isFirst
                    ? "border-[#c5ff55]/40 bg-gradient-to-b from-[#182613] to-[#121a0f]"
                    : "border-white/10 bg-[#161a14]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-xl font-black text-xs ${
                        isFirst
                          ? "bg-[#c5ff55] text-[#14170f]"
                          : idx === 1
                          ? "bg-slate-300 text-slate-900"
                          : "bg-amber-600 text-white"
                      }`}
                    >
                      #{podiumCollege.rank}
                    </span>

                    <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#c5ff55]">
                      {podiumCollege.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white">{podiumCollege.name}</h3>
                  <p className="text-xs text-[#8f9d8a]">{podiumCollege.location} • {podiumCollege.tier}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-white/5 bg-black/30 p-2.5">
                      <span className="text-[10px] text-[#788874] uppercase block">Total Points</span>
                      <span className="font-mono font-black text-white text-sm">{podiumCollege.points.toLocaleString()}</span>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-black/30 p-2.5">
                      <span className="text-[10px] text-[#788874] uppercase block">Win Rate</span>
                      <span className="font-mono font-black text-[#c5ff55] text-sm">{podiumCollege.winRate}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-[#8f9d8a]">
                  <span>{podiumCollege.activeCoders} Active Knights</span>
                  <Link to="/arena" className="font-bold text-[#c5ff55] hover:underline flex items-center gap-1">
                    Challenge Campus <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            {["All", "Diamond", "Platinum", "Gold"].map((div) => (
              <button
                key={div}
                onClick={() => setSelectedDivision(div)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  selectedDivision === div
                    ? "bg-[#c5ff55] text-[#14170f]"
                    : "bg-white/5 text-[#aab1a1] hover:text-white"
                }`}
              >
                {div} {div !== "All" && "Division"}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#788874]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search college name or state..."
              className="w-full rounded-xl border border-white/10 bg-[#161a14] py-2 pl-9 pr-3 text-xs text-white placeholder-[#788874] focus:border-[#c5ff55] focus:outline-none"
            />
          </div>
        </div>

        {/* Full Collegiate Standings Table */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-[#161a14] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-black/40 text-[10px] font-black uppercase tracking-wider text-[#788874]">
                <tr>
                  <th className="py-3.5 pl-6 pr-3">Rank</th>
                  <th className="px-4 py-3.5">College / University</th>
                  <th className="px-4 py-3.5">Division Tier</th>
                  <th className="px-4 py-3.5">Total Points</th>
                  <th className="px-4 py-3.5">Active Duelists</th>
                  <th className="px-4 py-3.5">Problems Solved</th>
                  <th className="px-4 py-3.5">Win Rate</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-white">
                {filtered.map((c) => (
                  <tr key={c.name} className="hover:bg-white/[0.02] transition">
                    <td className="py-4 pl-6 pr-3 font-mono font-black text-sm">
                      <span className={c.rank <= 3 ? "text-[#c5ff55]" : "text-slate-400"}>
                        #{c.rank}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <span className="font-black text-white text-sm block">{c.name}</span>
                        <span className="text-[11px] text-[#8f9d8a]">{c.location}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-[#c5ff55]">
                        {c.tier}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono font-black text-[#c5ff55]">
                      {c.points.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-[#aab1a1]">
                      {c.activeCoders} coders
                    </td>
                    <td className="px-4 py-4 text-[#aab1a1]">
                      {c.solvedProblems.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-emerald-400">
                      {c.winRate}
                    </td>
                    <td className="py-4 pl-3 pr-6 text-right">
                      <Link
                        to="/arena"
                        className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10 hover:border-[#c5ff55]/40 transition"
                      >
                        Spar <Swords size={12} className="text-[#c5ff55]" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
