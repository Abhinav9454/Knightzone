import { useCallback, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ClubChallengeCard } from "@/components/clubs/ClubChallengeCard";
import { ClubChatPanel } from "@/components/clubs/ClubChatPanel";
import { ClubLeaderboard } from "@/components/clubs/ClubLeaderboard";
import { useAuth } from "@/contexts/AuthContext";
import { clubApi } from "@/lib/api";
import { useRealtimeRefresh } from "@/lib/realtime";
import type { ClubChallenge, ClubDetail, ClubPost, ClubRankingEntry, ClubChallengeFrequency, ClubMessage } from "@/lib/types";

export default function ClubDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const clubId = Number(id);

  const [club, setClub] = useState<ClubDetail | null>(null);
  const [challenges, setChallenges] = useState<ClubChallenge[]>([]);
  const [rankings, setRankings] = useState<ClubRankingEntry[]>([]);
  const [posts, setPosts] = useState<ClubPost[]>([]);
  const [messages, setMessages] = useState<ClubMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengeFrequency, setChallengeFrequency] = useState<ClubChallengeFrequency>("WEEKLY");
  const [creatingChallenge, setCreatingChallenge] = useState(false);

  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [creatingPost, setCreatingPost] = useState(false);

  const load = useCallback(async () => {
    if (!clubId || Number.isNaN(clubId)) return;

    try {
      const [clubData, challengeData, rankingData, postData, messageData] = await Promise.all([
        clubApi.getClub(clubId),
        clubApi.getChallenges(clubId),
        clubApi.getRankings(clubId),
        clubApi.getPosts(clubId),
        clubApi.getMessages(clubId),
      ]);
      setClub(clubData);
      setChallenges(challengeData);
      setRankings(rankingData);
      setPosts(postData);
      setMessages(messageData);
    } catch {
      toast.error("Unable to load club details.");
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useRealtimeRefresh(load, { intervalMs: 6000, scope: "clubs" });

  const createChallenge = async () => {
    if (!challengeTitle.trim() || !club) return;
    setCreatingChallenge(true);
    try {
      const now = new Date();
      const startsAt = now.toISOString();
      const endsAt = new Date(now.getTime() + (challengeFrequency === "WEEKLY" ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString();
      await clubApi.createChallenge(club.id, {
        title: challengeTitle.trim(),
        description: challengeDescription.trim() || undefined,
        frequency: challengeFrequency,
        startsAt,
        endsAt,
      });
      setChallengeTitle("");
      setChallengeDescription("");
      await load();
      toast.success("Challenge created.");
    } catch {
      toast.error("You do not have permission to create challenge.");
    } finally {
      setCreatingChallenge(false);
    }
  };

  const createPost = async () => {
    if (!club || !postTitle.trim() || !postContent.trim()) return;
    setCreatingPost(true);
    try {
      await clubApi.createPost(club.id, { title: postTitle.trim(), content: postContent.trim() });
      setPostTitle("");
      setPostContent("");
      await load();
      toast.success("Post published.");
    } catch {
      toast.error("Unable to publish post.");
    } finally {
      setCreatingPost(false);
    }
  };

  const submitAttempt = async (challengeId: number, payload: { wpm: number; accuracy: number }) => {
    if (!club) return;
    await clubApi.submitChallengeAttempt(club.id, challengeId, payload);
    await load();
    toast.success("Attempt submitted.");
  };

  const sendMessage = async (message: string) => {
    if (!club) return;
    await clubApi.createMessage(club.id, { message });
    await load();
  };

  const joinLeaveLabel = useMemo(() => {
    if (!club) return "Join";
    return club.joined ? "Leave Club" : "Join Club";
  }, [club]);

  const toggleJoin = async () => {
    if (!club) return;
    try {
      if (club.joined) {
        await clubApi.leaveClub(club.id);
        toast.success("Left club.");
      } else {
        await clubApi.joinClub(club.id);
        toast.success("Joined club.");
      }
      await load();
    } catch {
      toast.error("Action failed.");
    }
  };

  const canModerate = club?.myRole === "OWNER" || club?.myRole === "MODERATOR";

  const deletePost = async (postId: number) => {
    if (!club) return;
    try {
      await clubApi.deletePost(club.id, postId);
      toast.success("Post deleted.");
      await load();
    } catch {
      toast.error("Unable to delete post.");
    }
  };

  const deleteMessage = async (messageId: number) => {
    if (!club) return;
    try {
      await clubApi.deleteMessage(club.id, messageId);
      toast.success("Message deleted.");
      await load();
    } catch {
      toast.error("Unable to delete message.");
    }
  };

  const muteMember = async (memberUserId: number, minutes: number) => {
    if (!club) return;
    try {
      await clubApi.muteMember(club.id, memberUserId, minutes);
      toast.success(`Member muted for ${minutes} minutes.`);
      await load();
    } catch {
      toast.error("Unable to mute member.");
    }
  };

  if (Number.isNaN(clubId)) {
    return <p className="text-sm text-muted-foreground">Invalid club id.</p>;
  }

  if (!club) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Club not found or inaccessible.</p>
        <Link className="text-primary underline" to="/clubs">Back to clubs</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{club.name}</h1>
          <p className="text-muted-foreground">{club.description || "No description provided."}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Owner: {club.ownerName} | Members: {club.memberCount} | Visibility: {club.visibility}
          </p>
        </div>
        <Button variant="secondary" onClick={() => void toggleJoin()}>{joinLeaveLabel}</Button>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-card/70 p-4">
            <h2 className="text-lg font-semibold">Club Challenges</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                Title
                <input className="mt-1 w-full rounded-md border bg-background px-3 py-2" value={challengeTitle} onChange={(e) => setChallengeTitle(e.target.value)} />
              </label>
              <label className="text-sm">
                Frequency
                <select className="mt-1 w-full rounded-md border bg-background px-3 py-2" value={challengeFrequency} onChange={(e) => setChallengeFrequency(e.target.value as ClubChallengeFrequency)}>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </label>
              <label className="text-sm md:col-span-2">
                Description
                <textarea className="mt-1 w-full rounded-md border bg-background px-3 py-2" rows={2} value={challengeDescription} onChange={(e) => setChallengeDescription(e.target.value)} />
              </label>
            </div>
            <Button className="mt-3" size="sm" disabled={creatingChallenge} onClick={() => void createChallenge()}>
              {creatingChallenge ? "Creating..." : "Create Challenge"}
            </Button>

            <div className="mt-4 grid gap-3">
              {challenges.map((challenge) => (
                <ClubChallengeCard key={challenge.id} challenge={challenge} onSubmitAttempt={submitAttempt} />
              ))}
              {challenges.length === 0 && <p className="text-sm text-muted-foreground">No challenges yet.</p>}
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-card/70 p-4">
            <h2 className="text-lg font-semibold">Club Forum</h2>
            <div className="mt-3 grid gap-3">
              <input
                className="rounded-md border bg-background px-3 py-2"
                placeholder="Post title"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
              />
              <textarea
                className="rounded-md border bg-background px-3 py-2"
                rows={3}
                placeholder="Share tips, resources, or event notes"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
              />
              <Button size="sm" disabled={creatingPost} onClick={() => void createPost()}>
                {creatingPost ? "Publishing..." : "Publish Post"}
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {posts.map((post) => (
                <article key={post.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{post.title}</h3>
                    {(canModerate || post.authorId === user?.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => void deletePost(post.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{post.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">By {post.authorName} | {new Date(post.createdAt).toLocaleString()}</p>
                </article>
              ))}
              {posts.length === 0 && <p className="text-sm text-muted-foreground">No forum posts yet.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <ClubLeaderboard rows={rankings} />
          <ClubChatPanel
            clubId={club.id}
            messages={messages}
            onSend={sendMessage}
            onRefresh={load}
            currentUserId={user?.id}
            canModerate={canModerate}
            onDeleteMessage={deleteMessage}
            onMuteMember={muteMember}
          />
        </div>
      </section>
    </div>
  );
}
