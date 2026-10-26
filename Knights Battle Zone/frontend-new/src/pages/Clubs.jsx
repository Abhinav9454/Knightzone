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
} from "lucide-react";
import { clubsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { KnightCrest, KnightLogo } from "../components/svg";

export default function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joiningId, setJoiningId] = useState(null);

  // New club form
  const [newClubName, setNewClubName] = useState("");
  const [newClubDesc, setNewClubDesc] = useState("");
  const [newClubVisibility, setNewClubVisibility] = useState("PUBLIC");
  const [creating, setCreating] = useState(false);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clubsApi.getAll();
      setClubs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load clubs:", err);
      setError("Failed to load clubs. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleJoin = async (e, club) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      setJoiningId(club.id);
      if (club.joined) {
        await clubsApi.leave(club.id);
        setClubs((prev) =>
          prev.map((c) =>
            c.id === club.id
              ? { ...c, joined: false, memberCount: Math.max(0, c.memberCount - 1) }
              : c
          )
        );
      } else {
        await clubsApi.join(club.id);
        setClubs((prev) =>
          prev.map((c) =>
            c.id === club.id
              ? { ...c, joined: true, memberCount: c.memberCount + 1 }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Join/Leave error:", err);
      alert(err.response?.data?.message || "Failed to update club membership.");
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreateClub = async (e) => {
    e.preventDefault();
    if (!newClubName.trim()) return;

    try {
      setCreating(true);
      await clubsApi.createClub({
        name: newClubName.trim(),
        description: newClubDesc.trim(),
        visibility: newClubVisibility,
      });

      setShowCreateModal(false);
      setNewClubName("");
      setNewClubDesc("");
      loadClubs();
    } catch (err) {
      console.error("Create club failed:", err);
      alert(err.response?.data?.message || "Failed to create club.");
    } finally {
      setCreating(false);
    }
  };

  const filteredClubs = clubs.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase());
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
                <Users size={14} className="text-[#183d34]" />
                Knights Guilds & Developer Squads
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#183d34]">
                Coding Clubs & Circles
              </h1>
              <p className="mt-2 text-sm text-[#555d53] max-w-xl">
                Collaborate with fellow engineers, participate in private squad battles,
                discuss system architectures, and level up your rating together.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#183d34] px-5 py-2.5 text-xs font-bold text-[#c5ff55] hover:bg-[#122e27] transition shadow-md shadow-[#183d34]/20"
                >
                  <Plus size={16} />
                  Start a Club
                </button>
              )}
            </div>
          </div>

          {/* SEARCH & FILTERS */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b948a]"
              />
              <input
                type="text"
                placeholder="Search clubs by name, tag, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-[#dfe4de] bg-white focus:outline-none focus:ring-2 focus:ring-[#183d34]"
              />
            </div>

            <div className="text-xs font-bold text-[#8b948a]">
              Showing <span className="text-[#183d34]">{filteredClubs.length}</span> guilds
            </div>
          </div>
        </div>
      </div>

      {/* CLUBS GRID */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#183d34] border-t-transparent" />
            <p className="text-sm font-semibold text-[#8b948a]">
              Discovering active clubs...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm font-bold text-red-800">{error}</p>
            <button
              onClick={loadClubs}
              className="mt-4 px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        ) : filteredClubs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#dfe4de] bg-white p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-[#8b948a] mb-3" />
            <h3 className="text-base font-bold text-[#252922]">No Clubs Found</h3>
            <p className="text-xs text-[#555d53] mt-1">
              {searchQuery
                ? "Try searching for a different keyword."
                : "Be the first Knight to start a club for your peers!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club) => {
              const isJoined = club.joined;
              const isUpdating = joiningId === club.id;

              return (
                <div
                  key={club.id}
                  onClick={() => navigate(`/clubs/${club.id}`)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[#dfe4de] bg-white p-6 shadow-sm transition hover:shadow-md hover:border-[#183d34]/40 cursor-pointer"
                >
                  <div>
                    {/* Top row badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#183d34] bg-[#183d34]/10 px-2.5 py-1 rounded-md">
                        <Users size={12} />
                        {club.memberCount || 1} Member{club.memberCount !== 1 ? "s" : ""}
                      </span>

                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#8b948a] bg-[#f0f2ed] px-2 py-0.5 rounded">
                        {club.visibility === "PRIVATE" ? (
                          <>
                            <Lock size={10} />
                            Private
                          </>
                        ) : (
                          <>
                            <Globe size={10} />
                            Public
                          </>
                        )}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#183d34] group-hover:text-emerald-700 transition">
                      {club.name}
                    </h3>
                    <p className="mt-2 text-xs text-[#555d53] line-clamp-3 leading-relaxed">
                      {club.description ||
                        "A collaborative club of knights tackling algorithm challenges and system architecture."}
                    </p>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-6 pt-4 border-t border-[#f0f2ed] flex items-center justify-between">
                    <button
                      onClick={(e) => handleToggleJoin(e, club)}
                      disabled={isUpdating}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                        isJoined
                          ? "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          : "bg-[#183d34] text-[#c5ff55] hover:bg-[#122e27]"
                      }`}
                    >
                      {isUpdating ? (
                        "Updating..."
                      ) : isJoined ? (
                        <>
                          <Check size={13} />
                          Joined
                        </>
                      ) : (
                        <>
                          <UserPlus size={13} />
                          Join Club
                        </>
                      )}
                    </button>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#183d34] group-hover:translate-x-0.5 transition-transform">
                      View Guild
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE CLUB MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#dfe4de] bg-white p-6 shadow-xl">
            <h3 className="text-xl font-black text-[#183d34]">Start a New Club</h3>
            <p className="text-xs text-[#555d53] mt-1 mb-5">
              Gather your friends and colleagues under a shared developer guild banner.
            </p>

            <form onSubmit={handleCreateClub} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#252922] mb-1">
                  Club Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems Knights"
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  className="w-full rounded-xl border border-[#dfe4de] px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#183d34]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#252922] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="What is this club about? What are your goals?"
                  value={newClubDesc}
                  onChange={(e) => setNewClubDesc(e.target.value)}
                  className="w-full rounded-xl border border-[#dfe4de] px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#183d34]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#252922] mb-1">
                  Visibility
                </label>
                <select
                  value={newClubVisibility}
                  onChange={(e) => setNewClubVisibility(e.target.value)}
                  className="w-full rounded-xl border border-[#dfe4de] px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#183d34]"
                >
                  <option value="PUBLIC">Public (Anyone can join)</option>
                  <option value="PRIVATE">Private (Invite only)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-[#dfe4de] px-4 py-2 text-xs font-bold text-[#555d53] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-[#183d34] px-5 py-2 text-xs font-bold text-[#c5ff55] hover:bg-[#122e27]"
                >
                  {creating ? "Creating..." : "Create Club"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
