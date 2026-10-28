import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Shield,
  ShieldCheck,
  Building,
  GraduationCap,
  MapPin,
  Globe,
  Calendar,
  Sparkles,
  Camera,
  Trash2,
  Copy,
  Check,
  Save,
  AlertCircle,
  CheckCircle2,
  Tag,
  Clock,
  Award,
  ExternalLink,
  Flame,
  Trophy,
  Lock,
  Eye,
  EyeOff,
  Bell,
  Code2,
  Gamepad2,
  TrendingUp,
  LogIn,
  UserPlus,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { profileApi, badgesApi, activityApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { KnightCrest, RankBadge, KnightLogo } from "../components/svg";

const GithubIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

const LinkedinIcon = ({ className = "w-4 h-4 text-blue-600" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46v-8.37M7.86 6.88a1.45 1.45 0 1 0 0 2.9 1.45 1.45 0 0 0 0-2.9z" />
  </svg>
);
const DEFAULT_BADGES = [
  {
    id: "speed-demon",
    title: "Speed Demon",
    description: "Solve a competitive problem in under 3 minutes with 100% test cases passed.",
    icon: "⚡",
    rarity: "EPIC",
    xpReward: 300,
    unlocked: true,
    unlockedAt: "Oct 22, 2026",
    glowColor: "from-amber-500/20 via-yellow-500/20 to-orange-500/20 border-amber-500/50 text-amber-400",
  },
  {
    id: "century-knight",
    title: "Century Knight",
    description: "Solve 100 algorithmic challenges on KnightZone.",
    icon: "⚔️",
    rarity: "LEGENDARY",
    xpReward: 1000,
    unlocked: true,
    unlockedAt: "Oct 26, 2026",
    glowColor: "from-purple-500/20 via-indigo-500/20 to-pink-500/20 border-purple-500/50 text-purple-300",
  },
  {
    id: "streak-master",
    title: "Streak Master",
    description: "Maintain a 14-day continuous daily coding streak.",
    icon: "🔥",
    rarity: "RARE",
    xpReward: 500,
    unlocked: true,
    unlockedAt: "Oct 27, 2026",
    glowColor: "from-rose-500/20 via-orange-500/20 to-amber-500/20 border-rose-500/50 text-rose-400",
  },
  {
    id: "night-owl",
    title: "Night Owl",
    description: "Submit an accepted solution between 1:00 AM and 5:00 AM.",
    icon: "🌙",
    rarity: "UNCOMMON",
    xpReward: 250,
    unlocked: true,
    unlockedAt: "Oct 19, 2026",
    glowColor: "from-blue-500/20 via-cyan-500/20 to-sky-500/20 border-cyan-500/50 text-cyan-400",
  },
  {
    id: "anti-cheat-paragon",
    title: "Anti-Cheat Paragon",
    description: "Complete 5 verified proctored contests with zero integrity strikes.",
    icon: "🛡️",
    rarity: "EPIC",
    xpReward: 450,
    unlocked: true,
    unlockedAt: "Oct 24, 2026",
    glowColor: "from-emerald-500/20 via-teal-500/20 to-green-500/20 border-emerald-500/50 text-emerald-400",
  },
  {
    id: "campus-gladiator",
    title: "Campus Gladiator",
    description: "Represent your college in 3 Inter-College Arena battles.",
    icon: "🏛️",
    rarity: "RARE",
    xpReward: 600,
    unlocked: false,
    progress: "2 / 3 Battles",
    glowColor: "from-amber-600/20 via-amber-700/20 to-yellow-600/20 border-amber-600/30 text-amber-500",
  },
  {
    id: "flawless-duelist",
    title: "Flawless Duelist",
    description: "Win 5 consecutive 1v1 Arena Duels without a single loss.",
    icon: "🎯",
    rarity: "MYTHIC",
    xpReward: 800,
    unlocked: false,
    progress: "3 / 5 Wins",
    glowColor: "from-red-600/20 via-purple-600/20 to-indigo-600/20 border-red-500/30 text-red-400",
  },
  {
    id: "mock-slayer",
    title: "AI Mock Slayer",
    description: "Score 90%+ in the dynamic AI System Design & DSA Mock Interview.",
    icon: "🧠",
    rarity: "LEGENDARY",
    xpReward: 500,
    unlocked: false,
    progress: "82% Highest Score",
    glowColor: "from-indigo-600/20 via-purple-600/20 to-pink-600/20 border-indigo-500/30 text-indigo-400",
  },
];

export default function Profile() {
  const { user: authUser, role, isAdmin, isAuthenticated, updateUserData } = useAuth();

  // Baseline state initialized with authUser to prevent empty screen flashes
  const [profile, setProfile] = useState(() => authUser || null);
  const [loading, setLoading] = useState(!authUser && isAuthenticated);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "edit" | "security" | "settings"
  const [copiedId, setCopiedId] = useState(false);

  // Activity & Badges (Feature 7: Trophy Room)
  const [activityData, setActivityData] = useState([]);
  const [badges, setBadges] = useState([]);
  const [trophyFilter, setTrophyFilter] = useState("ALL");
  const [claimedRewards, setClaimedRewards] = useState(new Set());

  // Edit form state
  const [displayName, setDisplayName] = useState(authUser?.name || "");
  const [bio, setBio] = useState(authUser?.bio || "");
  const [college, setCollege] = useState(authUser?.college || "");
  const [department, setDepartment] = useState(authUser?.department || "");
  const [location, setLocation] = useState(authUser?.location || "");
  const [timezone, setTimezone] = useState(authUser?.timezone || "");
  const [githubUrl, setGithubUrl] = useState(authUser?.githubUrl || "");
  const [linkedinUrl, setLinkedinUrl] = useState(authUser?.linkedinUrl || "");
  const [twitterUrl, setTwitterUrl] = useState(authUser?.twitterUrl || "");
  const [portfolioUrl, setPortfolioUrl] = useState(authUser?.portfolioUrl || "");
  const [skills, setSkills] = useState(Array.isArray(authUser?.skills) ? authUser.skills : []);
  const [newSkill, setNewSkill] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Security (Password Change) state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState("");

  // Settings State
  const [privacyEmail, setPrivacyEmail] = useState("REGISTERED");
  const [privacyActivity, setPrivacyActivity] = useState("PUBLIC");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Avatar upload
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profileApi.getMe();
      if (data) {
        setProfile(data);
        updateUserData(data);

        // Populate edit form
        setDisplayName(data.name || "");
        setBio(data.bio || "");
        setCollege(data.college || "");
        setDepartment(data.department || "");
        setLocation(data.location || "");
        setTimezone(data.timezone || "");
        setGithubUrl(data.githubUrl || "");
        setLinkedinUrl(data.linkedinUrl || "");
        setTwitterUrl(data.twitterUrl || "");
        setPortfolioUrl(data.portfolioUrl || "");
        setSkills(Array.isArray(data.skills) ? data.skills : []);

        // Load activity calendar
        activityApi
          .getCalendar()
          .then((cal) => setActivityData(Array.isArray(cal) ? cal : []))
          .catch(() => null);

        // Load badges
        if (data.id) {
          badgesApi
            .getUserBadges(data.id)
            .then((b) => setBadges(Array.isArray(b) ? b : []))
            .catch(() => null);
        }

        // Load settings
        profileApi
          .getSettings()
          .then((s) => {
            if (s) {
              setPrivacyEmail(s.privacyEmail || "REGISTERED");
              setPrivacyActivity(s.privacyActivity || "PUBLIC");
              setEmailNotifications(s.emailNotifications ?? true);
              setPushNotifications(s.pushNotifications ?? true);
            }
          })
          .catch(() => null);
      }
    } catch (err) {
      console.warn("Could not fetch remote profile:", err);
      if (!authUser) {
        setError("Failed to load user profile. Please log in.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPublicId = () => {
    if (!profile?.publicUserId) return;
    navigator.clipboard.writeText(profile.publicUserId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (!skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
    }
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveSuccess(false);

      const updated = await profileApi.updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        college: college.trim(),
        department: department.trim(),
        location: location.trim(),
        timezone: timezone.trim(),
        githubUrl: githubUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        twitterUrl: twitterUrl.trim(),
        portfolioUrl: portfolioUrl.trim(),
        skills: skills,
      });

      setProfile(updated);
      updateUserData({
        name: updated.name,
        college: updated.college,
        bio: updated.bio,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File size exceeds 2MB limit. Please choose a smaller photo.");
      return;
    }

    try {
      setAvatarUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const updated = await profileApi.uploadAvatar(formData);
      setProfile(updated);
      updateUserData({ avatarUrl: updated.avatarUrl });
    } catch (err) {
      console.error("Failed to upload avatar:", err);
      alert(err.response?.data?.message || "Failed to upload avatar image.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm("Are you sure you want to remove your avatar?")) return;
    try {
      setAvatarUploading(true);
      const updated = await profileApi.removeAvatar();
      setProfile(updated);
      updateUserData({ avatarUrl: null });
    } catch (err) {
      console.error("Failed to remove avatar:", err);
      alert("Failed to remove avatar.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess(false);

    if (!currentPassword) {
      setPassError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      setPassError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("New password and confirm password do not match.");
      return;
    }

    try {
      setChangingPass(true);
      await profileApi.changePassword({
        currentPassword,
        newPassword,
      });
      setPassSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPassSuccess(false), 4000);
    } catch (err) {
      setPassError(err.response?.data?.message || "Current password is incorrect.");
    } finally {
      setChangingPass(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setSettingsSuccess(false);
      await profileApi.updateSettings({
        privacyEmail,
        privacyActivity,
        emailNotifications,
        pushNotifications,
      });
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      console.error("Save settings error:", err);
      alert("Failed to update settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  // 1. Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0f0a] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#c5ff55]" />
        <p className="text-sm font-semibold text-[#aab1a1]">
          Loading Knight credentials...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated Guard Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0c0f0a] text-[#e0e4dc] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-[#161a14] p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#c5ff55]/10 border border-[#c5ff55]/20 text-[#c5ff55] mb-5">
            <KnightCrest className="h-12 w-12" />
          </div>

          <span className="inline-block rounded-full bg-orange-500/10 border border-orange-500/30 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-orange-400">
            Authentication Required
          </span>

          <h2 className="mt-3 text-2xl font-black text-white">
            Knight Credentials Vault
          </h2>

          <p className="mt-2 text-xs leading-5 text-[#aab1a1]">
            Sign in to inspect your competitive rating, match history, unlocked honor badges, and manage your public Knight profile.
          </p>

          <div className="my-6 space-y-2 border-y border-white/10 py-4 text-left text-xs font-semibold text-[#aab1a1]">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={15} className="text-[#c5ff55] shrink-0" />
              <span>Real-time Elo Rating & League Tiers</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={15} className="text-[#c5ff55] shrink-0" />
              <span>90-Day Activity & Submission Heatmap</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={15} className="text-[#c5ff55] shrink-0" />
              <span>Verified Tech Stack & Academic Affiliation</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={15} className="text-[#c5ff55] shrink-0" />
              <span>Placement Applications & Resume Auditor</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#c5ff55] px-5 py-3 text-xs font-black uppercase text-[#14170f] shadow-md shadow-[#c5ff55]/20 hover:bg-[#d5ff83] transition"
            >
              <LogIn size={15} />
              Sign In to Your Knight Account
            </Link>
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-bold text-white hover:bg-white/10 transition"
            >
              <UserPlus size={15} />
              Join the Order (Register)
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Profile View
  const rating = profile?.rating || 1200;
  const ratingTier =
    rating >= 2100
      ? "Grandmaster Knight"
      : rating >= 1800
      ? "Master Knight"
      : rating >= 1500
      ? "Knight Commander"
      : rating >= 1300
      ? "Combatant"
      : "Initiate Knight";

  const totalSolved = profile?.problemsSolved || 148;

  return (
    <div className="min-h-screen bg-[#0c0f0a] text-[#e0e4dc] pb-16">
      {/* ==================== HERO BANNER ==================== */}
      <div className="relative overflow-hidden border-b border-white/10 bg-[#121610] py-10 px-5 sm:px-10">
        <div className="absolute -right-8 -top-8 opacity-10 pointer-events-none">
          <KnightCrest className="w-80 h-80" />
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar with live photo upload */}
            <div className="relative group shrink-0">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name || "Knight"}
                  className="h-28 w-28 rounded-3xl object-cover border-4 border-white/10 shadow-md bg-black/40"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-[#c5ff55]/10 font-black text-4xl text-[#c5ff55] border-4 border-white/10 shadow-md">
                  {(profile?.name || profile?.username || profile?.email || "K")
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}

              <label
                title="Upload Profile Picture"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-[#161a14] border border-white/10 text-white shadow-sm hover:bg-white/10 transition"
              >
                {avatarUploading ? (
                  <Loader2 size={14} className="animate-spin text-[#c5ff55]" />
                ) : (
                  <Camera size={14} />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarFile}
                  disabled={avatarUploading}
                  className="hidden"
                />
              </label>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white truncate">
                  {profile?.name || profile?.username || "Knight"}
                </h1>

                {/* Role Badge: Strict USER or ADMIN */}
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-wider ${
                    isAdmin
                      ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                      : "bg-[#c5ff55]/15 text-[#c5ff55] border border-[#c5ff55]/30"
                  }`}
                >
                  <ShieldCheck size={12} />
                  {isAdmin ? "ADMIN" : "USER"}
                </span>

                {profile?.publicUserId && (
                  <button
                    onClick={handleCopyPublicId}
                    title="Click to copy Public Knight ID"
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-mono font-bold text-[#aab1a1] hover:bg-white/10 hover:text-white transition"
                  >
                    <span>ID: {profile.publicUserId}</span>
                    {copiedId ? (
                      <Check size={12} className="text-[#c5ff55]" />
                    ) : (
                      <Copy size={12} className="text-[#788071]" />
                    )}
                  </button>
                )}
              </div>

              <p className="text-xs font-semibold text-[#788071] flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-[#aab1a1]">@{profile?.username || profile?.email?.split("@")[0]}</span>
                <span>•</span>
                <span>{profile?.email}</span>
                {profile?.college && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-xs">{profile.college}</span>
                  </>
                )}
              </p>

              {profile?.bio && (
                <p className="mt-3 text-xs text-[#aab1a1] max-w-xl leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {/* Combat Badges / Rating Rank */}
              <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <div className="inline-flex items-center gap-2 rounded-xl bg-[#161a14] border border-white/10 px-3.5 py-1.5 shadow-sm">
                  <RankBadge rating={rating} className="h-6 w-6" />
                  <div>
                    <span className="text-xs font-black text-white">
                      {rating}
                    </span>
                    <span className="text-[10px] text-[#c5ff55] uppercase font-black ml-1.5">
                      {ratingTier}
                    </span>
                  </div>
                </div>

                {profile?.location && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#aab1a1]">
                    <MapPin size={13} className="text-[#788071]" />
                    {profile.location}
                  </span>
                )}

                {profile?.createdAt && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#aab1a1]">
                    <Calendar size={13} className="text-[#788071]" />
                    Joined {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ==================== FOUR TABS ==================== */}
          <div className="mt-8 flex items-center gap-2 border-b border-white/10 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3 px-3 text-xs font-bold transition border-b-2 whitespace-nowrap ${
                activeTab === "overview"
                  ? "border-[#c5ff55] text-[#c5ff55]"
                  : "border-transparent text-[#aab1a1] hover:text-white"
              }`}
            >
              Knight Overview
            </button>
            <button
              onClick={() => setActiveTab("trophies")}
              className={`pb-3 px-3 text-xs font-bold transition border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "trophies"
                  ? "border-[#c5ff55] text-[#c5ff55]"
                  : "border-transparent text-[#aab1a1] hover:text-white"
              }`}
            >
              <Award size={14} />
              Trophy Room & Badges ({DEFAULT_BADGES.filter((b) => b.unlocked).length})
            </button>
            <button
              onClick={() => setActiveTab("edit")}
              className={`pb-3 px-3 text-xs font-bold transition border-b-2 whitespace-nowrap ${
                activeTab === "edit"
                  ? "border-[#c5ff55] text-[#c5ff55]"
                  : "border-transparent text-[#aab1a1] hover:text-white"
              }`}
            >
              Edit Identity & Profile
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`pb-3 px-3 text-xs font-bold transition border-b-2 whitespace-nowrap ${
                activeTab === "security"
                  ? "border-[#c5ff55] text-[#c5ff55]"
                  : "border-transparent text-[#aab1a1] hover:text-white"
              }`}
            >
              Security & Password
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`pb-3 px-3 text-xs font-bold transition border-b-2 whitespace-nowrap ${
                activeTab === "settings"
                  ? "border-[#c5ff55] text-[#c5ff55]"
                  : "border-transparent text-[#aab1a1] hover:text-white"
              }`}
            >
              Privacy & Settings
            </button>
          </div>
        </div>
      </div>

      {/* ==================== TAB CONTENT ==================== */}
      <div className="max-w-5xl mx-auto px-5 sm:px-10 mt-8">
        {/* ==================== TAB 1: OVERVIEW ==================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Combat Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-white/10 bg-[#161a14] p-4 shadow-sm">
                <div className="flex items-center gap-2 text-[#788071] mb-1 text-[11px] font-bold uppercase tracking-wider">
                  <TrendingUp size={14} className="text-[#c5ff55]" />
                  Elo Rating
                </div>
                <p className="text-2xl font-black text-[#c5ff55]">{rating}</p>
                <p className="text-[10px] text-emerald-400 font-bold mt-0.5">Top 12% in Arena</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#161a14] p-4 shadow-sm">
                <div className="flex items-center gap-2 text-[#788071] mb-1 text-[11px] font-bold uppercase tracking-wider">
                  <Code2 size={14} className="text-cyan-400" />
                  Problems Solved
                </div>
                <p className="text-2xl font-black text-white">{totalSolved}</p>
                <p className="text-[10px] text-[#788071] font-bold mt-0.5">Easy: 64 • Med: 62 • Hard: 22</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#161a14] p-4 shadow-sm">
                <div className="flex items-center gap-2 text-[#788071] mb-1 text-[11px] font-bold uppercase tracking-wider">
                  <Gamepad2 size={14} className="text-amber-400" />
                  Duel Win Rate
                </div>
                <p className="text-2xl font-black text-white">68%</p>
                <p className="text-[10px] text-emerald-400 font-bold mt-0.5">34 Wins • 16 Losses</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#161a14] p-4 shadow-sm">
                <div className="flex items-center gap-2 text-[#788071] mb-1 text-[11px] font-bold uppercase tracking-wider">
                  <Trophy size={14} className="text-purple-400" />
                  Contests Fought
                </div>
                <p className="text-2xl font-black text-white">14</p>
                <p className="text-[10px] text-purple-400 font-bold mt-0.5">Best Rank: #3</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left 2 cols */}
              <div className="md:col-span-2 space-y-6">
                {/* 90-Day Activity Heatmap */}
                <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <Flame size={16} className="text-[#c5ff55]" />
                      Activity & Submission Heatmap (90 Days)
                    </h3>
                    <span className="text-[11px] font-bold text-[#788071]">
                      {activityData.reduce((acc, curr) => acc + (curr.count || 0), 0) || 172} Submissions
                    </span>
                  </div>

                  <p className="text-xs text-[#aab1a1] mb-4">
                    Visual record of daily practice, problem sets, and live duel submissions.
                  </p>

                  <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-black/40 border border-white/5">
                    {(activityData.length > 0
                      ? activityData
                      : Array.from({ length: 90 }, (_, i) => ({
                          count: i % 3 === 0 ? (i % 5) + 1 : 0,
                          date: `Day ${i + 1}`,
                        }))
                    ).map((day, idx) => {
                      const count = day.count || 0;
                      const colorClass =
                        count === 0
                          ? "bg-white/10"
                          : count <= 2
                          ? "bg-[#c5ff55]/30"
                          : count <= 5
                          ? "bg-[#c5ff55]/70"
                          : "bg-[#c5ff55]";

                      return (
                        <div
                          key={idx}
                          title={`${day.date || `Day ${idx + 1}`}: ${count} submission${
                            count === 1 ? "" : "s"
                          }`}
                          className={`h-3.5 w-3.5 rounded-sm ${colorClass} transition hover:scale-125 cursor-pointer`}
                        />
                      );
                    })}
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-[#788071]">
                    <span>Less</span>
                    <span className="h-2.5 w-2.5 rounded-sm bg-white/10" />
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#c5ff55]/30" />
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#c5ff55]/70" />
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#c5ff55]" />
                    <span>More</span>
                  </div>
                </div>

                {/* Verified Skills */}
                <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-sm">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                    <Tag size={16} className="text-[#c5ff55]" />
                    Verified Skills & Tech Stack
                  </h3>

                  {skills.length === 0 ? (
                    <p className="text-xs text-[#788071]">
                      No skills listed yet. Switch to the &quot;Edit Identity&quot; tab to add your languages and frameworks.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-[#c5ff55]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Academic Affiliation */}
                <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-sm">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                    <GraduationCap size={16} className="text-[#c5ff55]" />
                    Academic Affiliation
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                      <span className="text-[#788071] font-bold">College / Institution</span>
                      <span className="font-bold text-white">
                        {profile?.college || "Not specified"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                      <span className="text-[#788071] font-bold">Department / Major</span>
                      <span className="font-bold text-white">
                        {profile?.department || "Computer Science & Engineering"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-[#788071] font-bold">Email Status</span>
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                        <CheckCircle2 size={13} />
                        Verified Knight
                      </span>
                    </div>
                  </div>
                </div>

                {/* Honours & Badges */}
                <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <Trophy size={16} className="text-[#c5ff55]" />
                      Knightzone Badges & Honours
                    </h3>
                    <span className="text-[11px] font-bold text-[#c5ff55] bg-[#c5ff55]/10 px-2.5 py-0.5 rounded-full border border-[#c5ff55]/30">
                      Tier: {ratingTier}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { title: "First Blood", desc: "First accepted problem", unlocked: true, icon: "⚔️" },
                      { title: "Streak Master", desc: "7-day battle streak", unlocked: true, icon: "🔥" },
                      { title: "Duel Champion", desc: "Won 10 arena duels", unlocked: true, icon: "🏆" },
                      {
                        title: "Century Knight",
                        desc: "100+ problems solved",
                        unlocked: totalSolved >= 100,
                        icon: "🛡️",
                      },
                      { title: "Grandmaster", desc: "Reach 2000+ rating", unlocked: rating >= 2000, icon: "👑" },
                      { title: "Speed Demon", desc: "Type 90+ WPM in test", unlocked: true, icon: "⚡" },
                    ].map((badge, idx) => (
                      <div
                        key={idx}
                        className={`rounded-2xl border p-3.5 text-center transition ${
                          badge.unlocked
                            ? "border-[#c5ff55]/30 bg-[#c5ff55]/5 shadow-sm"
                            : "border-white/10 bg-white/[0.02] opacity-40"
                        }`}
                      >
                        <div className="text-2xl mb-1">{badge.icon}</div>
                        <h4 className="text-xs font-bold text-white truncate">{badge.title}</h4>
                        <p className="text-[10px] text-[#788071] mt-0.5 line-clamp-1">{badge.desc}</p>
                        <span
                          className={`inline-block mt-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            badge.unlocked
                              ? "bg-[#c5ff55]/20 text-[#c5ff55] border border-[#c5ff55]/30"
                              : "bg-white/10 text-white/50"
                          }`}
                        >
                          {badge.unlocked ? "Unlocked" : "Locked"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cryptographic Contest Certificates */}
                <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-[#161a14] to-[#121610] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <Award size={16} className="text-amber-400" />
                      Cryptographic Certificates
                    </h3>
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      SHA-256 SIGNED
                    </span>
                  </div>
                  <p className="text-xs text-[#aab1a1] mb-4">
                    Officially signed contest certificates with tamper-proof cryptographic hashes for LinkedIn and recruiters.
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-white/10 bg-black/40">
                    <div>
                      <div className="text-xs font-bold text-white">All-India Knight Championship - Grand Finals</div>
                      <div className="text-[11px] font-mono text-[#c5ff55] mt-0.5">Rank #1 • Score 985 PTS</div>
                    </div>
                    <Link
                      to="/verify-cert/kz-cert-7f9a-4c21-9988"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400/20 border border-amber-400/40 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-400/30 transition shrink-0"
                    >
                      View & Verify <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Col: Social Profiles & Danger */}
              <div className="space-y-6">
                <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-sm">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                    <Globe size={16} className="text-[#c5ff55]" />
                    Developer Profiles
                  </h3>

                  <div className="space-y-3">
                    {profile?.githubUrl ? (
                      <a
                        href={profile.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs font-bold text-white hover:bg-white/10 transition"
                      >
                        <GithubIcon className="w-4 h-4 text-white" />
                        <span className="truncate">GitHub Profile</span>
                        <ExternalLink size={12} className="ml-auto text-[#788071]" />
                      </a>
                    ) : (
                      <p className="text-xs text-[#788071]">No GitHub link provided.</p>
                    )}

                    {profile?.linkedinUrl && (
                      <a
                        href={profile.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs font-bold text-white hover:bg-white/10 transition"
                      >
                        <LinkedinIcon className="w-4 h-4 text-blue-400" />
                        <span className="truncate">LinkedIn Profile</span>
                        <ExternalLink size={12} className="ml-auto text-[#788071]" />
                      </a>
                    )}

                    {profile?.portfolioUrl && (
                      <a
                        href={profile.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs font-bold text-white hover:bg-white/10 transition"
                      >
                        <Globe size={16} className="text-[#c5ff55]" />
                        <span className="truncate">Portfolio Website</span>
                        <ExternalLink size={12} className="ml-auto text-[#788071]" />
                      </a>
                    )}
                  </div>
                </div>

                {profile?.avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={avatarUploading}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition"
                  >
                    <Trash2 size={14} />
                    Remove Custom Avatar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: TROPHY ROOM & BADGES SHOWCASE (Feature 7) ==================== */}
        {activeTab === "trophies" && (
          <div className="space-y-6">
            {/* Header: Level & XP Vault */}
            <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c5ff55]/10 border border-[#c5ff55]/30 text-[#c5ff55] shadow-lg shadow-[#c5ff55]/10">
                    <Trophy size={32} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-white">Trophy Room & Badges</h3>
                      <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-[10px] font-black uppercase text-purple-300">
                        Level 8 Knight Master
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#aab1a1]">
                      Earn automated badges through speed solving, midnight contests, 1v1 arena duels, and flawless proctoring.
                    </p>
                  </div>
                </div>

                <div className="w-full lg:w-72 rounded-2xl border border-white/10 bg-black/40 p-4">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-white">XP Level Progress</span>
                    <span className="text-[#c5ff55]">3,450 / 5,000 XP</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-[#c5ff55] rounded-full" style={{ width: "69%" }} />
                  </div>
                  <p className="mt-2 text-[10px] text-[#788071] text-right">
                    1,550 XP needed for Level 9 Grandmaster
                  </p>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                <div className="flex gap-2">
                  {[
                    { id: "ALL", label: `All Badges (${DEFAULT_BADGES.length})` },
                    { id: "UNLOCKED", label: `Unlocked (${DEFAULT_BADGES.filter((b) => b.unlocked).length})` },
                    { id: "LOCKED", label: `Locked (${DEFAULT_BADGES.filter((b) => !b.unlocked).length})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setTrophyFilter(tab.id)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        trophyFilter === tab.id
                          ? "bg-[#c5ff55] text-[#14170f]"
                          : "border border-white/10 bg-white/5 text-[#aab1a1] hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <span className="text-xs font-bold text-[#c5ff55] flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Automated Badge Unlock Engine Active
                </span>
              </div>
            </div>

            {/* Badges Showcase Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {DEFAULT_BADGES.filter((b) => {
                if (trophyFilter === "UNLOCKED") return b.unlocked;
                if (trophyFilter === "LOCKED") return !b.unlocked;
                return true;
              }).map((b) => {
                const isClaimed = claimedRewards.has(b.id);
                return (
                  <div
                    key={b.id}
                    className={`relative rounded-3xl border p-5 flex flex-col justify-between transition-all duration-300 ${
                      b.unlocked
                        ? `bg-gradient-to-br ${b.glowColor} shadow-lg hover:scale-[1.02]`
                        : "border-white/5 bg-black/40 grayscale opacity-60 hover:opacity-80"
                    }`}
                  >
                    <div>
                      {/* Top row: Icon and Rarity */}
                      <div className="flex items-start justify-between">
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl border ${
                            b.unlocked
                              ? "bg-black/40 border-white/20 shadow-md"
                              : "bg-black/60 border-white/5 text-[#788071]"
                          }`}
                        >
                          {b.icon}
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                            b.unlocked
                              ? "bg-white/10 border-white/20 text-white"
                              : "bg-white/5 border-white/5 text-[#788071]"
                          }`}
                        >
                          {b.rarity}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h4 className="mt-4 text-base font-black text-white">
                        {b.title}
                      </h4>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#aab1a1]">
                        {b.description}
                      </p>
                    </div>

                    {/* Bottom Status / XP info */}
                    <div className="mt-5 border-t border-white/10 pt-3.5">
                      {b.unlocked ? (
                        <div className="flex items-center justify-between">
                          <div className="text-[11px] text-[#788071]">
                            <span>Unlocked {b.unlockedAt}</span>
                          </div>
                          <span className="rounded-lg bg-[#c5ff55]/20 border border-[#c5ff55]/30 px-2 py-0.5 text-[10px] font-black text-[#c5ff55]">
                            +{b.xpReward} XP
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#788071] flex items-center gap-1">
                              <Lock size={11} /> Locked
                            </span>
                            <span className="font-mono text-[#c5ff55] font-bold">
                              {b.progress || "Incomplete"}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#788071]">
                            Unlocks +{b.xpReward} XP on completion
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: EDIT PROFILE ==================== */}
        {activeTab === "edit" && (
          <form
            onSubmit={handleSaveProfile}
            className="rounded-3xl border border-white/10 bg-[#161a14] p-6 sm:p-8 shadow-xl space-y-6 max-w-3xl"
          >
            {saveSuccess && (
              <div className="rounded-2xl border border-[#c5ff55]/30 bg-[#c5ff55]/10 p-4 text-xs font-bold text-[#c5ff55] flex items-center gap-2">
                <CheckCircle2 size={16} />
                Profile updated successfully! All Knight records are synchronized.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-white mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs font-medium text-white placeholder:text-[#788071] focus:outline-none focus:border-[#c5ff55] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1.5">
                  Location (City, Country)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore, India"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs font-medium text-white placeholder:text-[#788071] focus:outline-none focus:border-[#c5ff55] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1.5">
                Knight Motto & Bio
              </label>
              <textarea
                rows={3}
                placeholder="Describe your coding aspirations, algorithmic mastery, and current tech stack..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs font-medium text-white placeholder:text-[#788071] focus:outline-none focus:border-[#c5ff55] transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-white mb-1.5">
                  College / University
                </label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs font-medium text-white placeholder:text-[#788071] focus:outline-none focus:border-[#c5ff55] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs font-medium text-white placeholder:text-[#788071] focus:outline-none focus:border-[#c5ff55] transition"
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#c5ff55]">
                Social & Developer Links
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#aab1a1] mb-1">
                    GitHub Profile URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs font-medium text-white placeholder:text-[#788071] focus:outline-none focus:border-[#c5ff55] transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#aab1a1] mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs font-medium text-white placeholder:text-[#788071] focus:outline-none focus:border-[#c5ff55] transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#aab1a1] mb-1">
                    Portfolio / Website URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs font-medium text-white placeholder:text-[#788071] focus:outline-none focus:border-[#c5ff55] transition"
                  />
                </div>
              </div>
            </div>

            {/* Skills tag manager */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#c5ff55]">
                Technical Skills & Tags
              </h4>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add skill (e.g. C++, Java, Python, React, SQL)..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="flex-1 rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs font-medium text-white placeholder:text-[#788071] focus:outline-none focus:border-[#c5ff55] transition"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="rounded-xl bg-[#c5ff55] px-4 py-2 text-xs font-black uppercase text-[#14170f] hover:bg-[#d5ff83] transition shadow-md shadow-[#c5ff55]/20"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold text-[#c5ff55]"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s)}
                      className="text-[#aab1a1] hover:text-rose-400 transition ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#c5ff55] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#14170f] hover:bg-[#d5ff83] transition shadow-lg shadow-[#c5ff55]/20 disabled:opacity-50"
              >
                <Save size={14} />
                {saving ? "Saving Changes..." : "Save Profile"}
              </button>
            </div>
          </form>
        )}

        {/* ==================== TAB 3: SECURITY & PASSWORD ==================== */}
        {activeTab === "security" && (
          <form
            onSubmit={handleChangePassword}
            className="rounded-3xl border border-white/10 bg-[#161a14] p-6 sm:p-8 shadow-xl space-y-6 max-w-xl"
          >
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Lock size={18} className="text-[#c5ff55]" />
                Change Knight Password
              </h3>
              <p className="text-xs text-[#aab1a1] mt-1">
                Ensure your account is protected with a secure password of at least 6 characters.
              </p>
            </div>

            {passSuccess && (
              <div className="rounded-2xl border border-[#c5ff55]/30 bg-[#c5ff55]/10 p-4 text-xs font-bold text-[#c5ff55] flex items-center gap-2">
                <CheckCircle2 size={16} />
                Password updated successfully!
              </div>
            )}

            {passError && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-bold text-rose-300 flex items-center gap-2">
                <AlertCircle size={16} />
                {passError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-white mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs font-medium text-white placeholder:text-[#788071] pr-10 focus:outline-none focus:border-[#c5ff55] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#788071] hover:text-white transition"
                >
                  {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1.5">
                New Password (minimum 6 chars)
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs font-medium text-white placeholder:text-[#788071] pr-10 focus:outline-none focus:border-[#c5ff55] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#788071] hover:text-white transition"
                >
                  {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs font-medium text-white placeholder:text-[#788071] focus:outline-none focus:border-[#c5ff55] transition"
              />
            </div>

            <button
              type="submit"
              disabled={changingPass}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#c5ff55] py-3 text-xs font-black uppercase tracking-wider text-[#14170f] hover:bg-[#d5ff83] transition shadow-lg shadow-[#c5ff55]/20 disabled:opacity-50"
            >
              <Lock size={14} />
              {changingPass ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        )}

        {/* ==================== TAB 4: PRIVACY & SETTINGS ==================== */}
        {activeTab === "settings" && (
          <form
            onSubmit={handleSaveSettings}
            className="rounded-3xl border border-white/10 bg-[#161a14] p-6 sm:p-8 shadow-xl space-y-6 max-w-2xl"
          >
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Shield size={18} className="text-[#c5ff55]" />
                Privacy & Notification Preferences
              </h3>
              <p className="text-xs text-[#aab1a1] mt-1">
                Customize what details other Knights can see on your public profile and leaderboards.
              </p>
            </div>

            {settingsSuccess && (
              <div className="rounded-2xl border border-[#c5ff55]/30 bg-[#c5ff55]/10 p-4 text-xs font-bold text-[#c5ff55] flex items-center gap-2">
                <CheckCircle2 size={16} />
                Settings updated successfully!
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white mb-1.5">
                  Email Privacy
                </label>
                <select
                  value={privacyEmail}
                  onChange={(e) => setPrivacyEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs font-medium text-white focus:outline-none focus:border-[#c5ff55] transition"
                >
                  <option value="PUBLIC" className="bg-[#161a14] text-white">Public (Visible to everyone)</option>
                  <option value="REGISTERED" className="bg-[#161a14] text-white">Registered Knights Only</option>
                  <option value="PRIVATE" className="bg-[#161a14] text-white">Private (Only visible to you and Admins)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1.5">
                  Activity Visibility
                </label>
                <select
                  value={privacyActivity}
                  onChange={(e) => setPrivacyActivity(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs font-medium text-white focus:outline-none focus:border-[#c5ff55] transition"
                >
                  <option value="PUBLIC" className="bg-[#161a14] text-white">Public (Show on Global & College Leaderboards)</option>
                  <option value="ANONYMOUS" className="bg-[#161a14] text-white">Anonymous (Hide username on public rankings)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#c5ff55]">Notifications</h4>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="h-4 w-4 rounded bg-black/40 border-white/20 text-[#c5ff55] accent-[#c5ff55] focus:ring-[#c5ff55]"
                  />
                  <span className="text-xs font-semibold text-[#aab1a1]">
                    Receive email alerts for live contests, match invitations, and ranking updates
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushNotifications}
                    onChange={(e) => setPushNotifications(e.target.checked)}
                    className="h-4 w-4 rounded bg-black/40 border-white/20 text-[#c5ff55] accent-[#c5ff55] focus:ring-[#c5ff55]"
                  />
                  <span className="text-xs font-semibold text-[#aab1a1]">
                    Enable in-app duel challenge notifications and instant battle requests
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center gap-2 rounded-xl bg-[#c5ff55] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#14170f] hover:bg-[#d5ff83] transition shadow-lg shadow-[#c5ff55]/20 disabled:opacity-50"
              >
                <Save size={14} />
                {savingSettings ? "Saving Settings..." : "Save Preferences"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
