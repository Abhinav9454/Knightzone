import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { clubsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { KnightCrest, TrophyIllustration } from "../components/svg";

export default function ClubDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [club, setClub] = useState(null);
  const [posts, setPosts] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [activeTab, setActiveTab] = useState("posts"); // "posts" | "rankings"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New post form
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadClubData();
  }, [id]);

  const loadClubData = async () => {
    try {
      setLoading(true);
      setError(null);

      const clubRes = await clubsApi.getById(id);
      setClub(clubRes);

      // Load posts & rankings in parallel
      try {
        const [postsRes, rankingsRes] = await Promise.all([
          clubsApi.getPosts(id),
          clubsApi.getRankings(id),
        ]);
        setPosts(Array.isArray(postsRes) ? postsRes : []);
        setRankings(Array.isArray(rankingsRes) ? rankingsRes : []);
      } catch (subErr) {
        console.warn("Sub-resources load issue:", subErr);
      }
    } catch (err) {
      console.error("Failed to load club details:", err);
      setError("Failed to load club details. Club may not exist.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleJoin = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      setJoining(true);
      if (club.joined) {
        await clubsApi.leave(id);
        setClub((prev) => ({
          ...prev,
          joined: false,
          memberCount: Math.max(0, prev.memberCount - 1),
        }));
      } else {
        await clubsApi.join(id);
        setClub((prev) => ({
          ...prev,
          joined: true,
          memberCount: prev.memberCount + 1,
        }));
      }
    } catch (err) {
      console.error("Join/Leave error:", err);
      alert(err.response?.data?.message || "Failed to update membership.");
    } finally {
      setJoining(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;

    try {
      setPosting(true);
      const newPost = await clubsApi.createPost(id, {
        title: postTitle.trim(),
        content: postContent.trim(),
      });

      setPosts((prev) => [newPost, ...prev]);
      setPostTitle("");
      setPostContent("");
    } catch (err) {
      console.error("Failed to create post:", err);
      alert(err.response?.data?.message || "Failed to submit post.");
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfcf9] flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#183d34] border-t-transparent" />
        <p className="text-sm font-semibold text-[#8b948a]">
          Loading guild hall...
        </p>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="min-h-screen bg-[#fbfcf9] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
        <h2 className="text-xl font-bold text-[#183d34]">Club Not Found</h2>
        <p className="text-sm text-[#555d53] max-w-md mt-1 mb-6">{error}</p>
        <button
          onClick={() => navigate("/clubs")}
          className="px-5 py-2.5 rounded-xl bg-[#183d34] text-xs font-bold text-[#c5ff55]"
        >
          Return to Clubs
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfcf9] text-[#252922] pb-16">
      {/* CLUB BANNER */}
      <div className="relative overflow-hidden border-b border-[#e4e5df] bg-gradient-to-b from-[#183d34]/10 via-[#183d34]/5 to-transparent py-8 px-6 sm:px-10">
        <div className="absolute -right-8 -top-8 opacity-10 pointer-events-none">
          <KnightCrest className="w-72 h-72" />
        </div>

        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate("/clubs")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#555d53] hover:text-[#183d34] mb-4 transition"
          >
            <ArrowLeft size={14} />
            Back to Clubs
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-[#183d34]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#183d34]">
                  {club.visibility === "PRIVATE" ? (
                    <>
                      <Lock size={11} />
                      Private Club
                    </>
                  ) : (
                    <>
                      <Globe size={11} />
                      Public Guild
                    </>
                  )}
                </span>
                <span className="text-xs font-semibold text-[#8b948a]">
                  Created by {club.ownerName || "Knight Leader"}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-[#183d34]">
                {club.name}
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[#555d53] max-w-2xl leading-relaxed">
                {club.description ||
                  "A verified circle for competitive developers and problem solvers."}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center rounded-2xl border border-[#dfe4de] bg-white px-5 py-3 shadow-sm">
                <p className="text-2xl font-black text-[#183d34]">
                  {club.memberCount || 1}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8b948a]">
                  Members
                </p>
              </div>

              <button
                onClick={handleToggleJoin}
                disabled={joining}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition shadow-sm ${
                  club.joined
                    ? "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    : "bg-[#183d34] text-[#c5ff55] hover:bg-[#122e27]"
                }`}
              >
                {joining ? (
                  "Updating..."
                ) : club.joined ? (
                  <>
                    <Check size={15} />
                    Member (Leave)
                  </>
                ) : (
                  <>
                    <UserPlus size={15} />
                    Join Club
                  </>
                )}
              </button>
            </div>
          </div>

          {/* TABS */}
          <div className="mt-8 flex items-center gap-2 border-b border-[#dfe4de]">
            <button
              onClick={() => setActiveTab("posts")}
              className={`inline-flex items-center gap-2 pb-3 px-3 text-xs font-bold transition border-b-2 ${
                activeTab === "posts"
                  ? "border-[#183d34] text-[#183d34]"
                  : "border-transparent text-[#555d53] hover:text-[#252922]"
              }`}
            >
              <MessageSquare size={14} />
              Discussions & Wall ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab("rankings")}
              className={`inline-flex items-center gap-2 pb-3 px-3 text-xs font-bold transition border-b-2 ${
                activeTab === "rankings"
                  ? "border-[#183d34] text-[#183d34]"
                  : "border-transparent text-[#555d53] hover:text-[#252922]"
              }`}
            >
              <Trophy size={14} />
              Guild Leaderboard ({rankings.length})
            </button>
          </div>
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="max-w-5xl mx-auto px-6 sm:px-10 mt-8">
        {activeTab === "posts" ? (
          <div className="space-y-6">
            {/* POST COMPOSER */}
            {isAuthenticated && (
              <form
                onSubmit={handleCreatePost}
                className="rounded-3xl border border-[#dfe4de] bg-white p-5 sm:p-6 shadow-sm"
              >
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#183d34] mb-3">
                  Share an update or question with the guild
                </h4>

                <input
                  type="text"
                  placeholder="Subject / Topic title..."
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full mb-3 rounded-xl border border-[#dfe4de] px-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#183d34]"
                />

                <textarea
                  rows={3}
                  placeholder="Write your discussion content, code snippet, or challenge ideas..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full rounded-xl border border-[#dfe4de] px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#183d34]"
                />

                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={posting || !postTitle.trim() || !postContent.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#183d34] px-4 py-2 text-xs font-bold text-[#c5ff55] hover:bg-[#122e27] transition disabled:opacity-50"
                  >
                    <Send size={13} />
                    {posting ? "Posting..." : "Post to Guild"}
                  </button>
                </div>
              </form>
            )}

            {/* POSTS LIST */}
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#dfe4de] bg-white p-12 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-[#8b948a] mb-3" />
                <h4 className="text-sm font-bold text-[#252922]">
                  No Posts in this Guild Yet
                </h4>
                <p className="text-xs text-[#555d53] mt-1">
                  Start the conversation by sharing a thought or challenge above!
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-[#dfe4de] bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#183d34] text-xs font-black text-[#c5ff55]">
                        {(post.authorName || "K").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#183d34]">
                          {post.authorName || "Guild Knight"}
                        </p>
                        <p className="text-[10px] text-[#8b948a]">
                          {post.createdAt
                            ? new Date(post.createdAt).toLocaleDateString()
                            : "Recently"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-[#183d34] mt-2">
                    {post.title}
                  </h3>
                  <p className="text-xs text-[#555d53] mt-1.5 whitespace-pre-line leading-relaxed">
                    {post.content}
                  </p>
                </div>
              ))
            )}
          </div>
        ) : (
          /* RANKINGS TAB */
          <div>
            {rankings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#dfe4de] bg-white p-12 text-center">
                <TrophyIllustration className="mx-auto h-20 w-20 mb-3" />
                <h4 className="text-sm font-bold text-[#252922]">
                  No Club Rankings Recorded
                </h4>
                <p className="text-xs text-[#555d53] mt-1">
                  Participate in club challenges and squad duels to earn club points!
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#dfe4de] bg-white overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f0f2ed] border-b border-[#dfe4de] text-[#8b948a] font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Knight</th>
                      <th className="py-3 px-4 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dfe4de]">
                    {rankings.map((r, idx) => (
                      <tr key={idx} className="hover:bg-[#fbfcf9]">
                        <td className="py-3.5 px-4 font-black text-[#183d34]">
                          #{idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#252922]">
                          {r.username || r.userName || `Knight #${r.userId || idx}`}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-700">
                          {r.points || r.score || 0} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
