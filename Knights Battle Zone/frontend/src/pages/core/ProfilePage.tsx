import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { userApi } from "@/lib/api";
import type { User } from "@/lib/types";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { User as UserIcon, Camera, Save, Shield, Lock, Globe, Trash2, LogOut } from "lucide-react";

const splitSkills = (skills?: string[]) => (skills || []).join(", ");

export default function ProfilePage() {
  const { user, patchUser, logout } = useAuth();
  const navigate = useNavigate();
  const { username } = useParams();
  const isPublicRoute = Boolean(username);

  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { run, running } = useAsyncAction();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [timezone, setTimezone] = useState("");
  const [skillsCsv, setSkillsCsv] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [twitter, setTwitter] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [privacyEmail, setPrivacyEmail] = useState("private");
  const [privacyActivity, setPrivacyActivity] = useState("public");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (isPublicRoute && username) {
          const publicProfile = await userApi.getPublicProfileByUsername(username);
          setProfile(publicProfile);
          return;
        }

        const [myProfile, settings] = await Promise.all([userApi.getMyProfile(), userApi.getSettings()]);
        setProfile(myProfile);
        setDisplayName(myProfile.name || "");
        setBio(myProfile.bio || "");
        setCollege(myProfile.college || "");
        setDepartment(myProfile.department || "");
        setPhone(myProfile.phone || "");
        setLocation(myProfile.location || "");
        setTimezone(myProfile.timezone || "");
        setSkillsCsv(splitSkills(myProfile.skills));
        setGithub(myProfile.githubUrl || "");
        setLinkedin(myProfile.linkedinUrl || "");
        setTwitter(myProfile.twitterUrl || "");
        setPortfolio(myProfile.portfolioUrl || "");

        setPrivacyEmail(settings.privacyEmail || "private");
        setPrivacyActivity(settings.privacyActivity || "public");
        setEmailNotifications(settings.emailNotifications);
        setPushNotifications(settings.pushNotifications);
        setTwoFactorEnabled(settings.twoFactorEnabled);
      } catch {
        toast.error("Unable to load profile data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isPublicRoute, username]);

  const skillTags = useMemo(
    () =>
      skillsCsv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [skillsCsv],
  );

  const saveProfile = async () => {
    const updated = await run(
      () =>
        userApi.updateProfile({
        displayName,
        bio,
        college,
        department,
        phone,
        location,
        timezone,
        skills: skillTags,
        githubUrl: github,
        linkedinUrl: linkedin,
        twitterUrl: twitter,
        portfolioUrl: portfolio,
      }),
      { successMessage: "Profile updated.", errorMessage: "Failed to save profile." },
    );
    if (!updated) return;
    setProfile(updated.data);
    patchUser(updated.data);
  };

  const saveSettings = async () => {
    await run(
      () =>
        userApi.updateSettings({
        privacyEmail,
        privacyActivity,
        emailNotifications,
        pushNotifications,
        twoFactorEnabled,
      }),
      { successMessage: "Settings updated.", errorMessage: "Unable to update settings." },
    );
  };

  const uploadAvatar = async (file?: File | null) => {
    if (!file) return;
    const updated = await run(
      () => userApi.uploadAvatar(file),
      { successMessage: "Avatar updated.", errorMessage: "Avatar upload failed. Use JPG/PNG/GIF up to 2MB." },
    );
    if (!updated) return;
    setProfile(updated);
    patchUser(updated);
  };

  const removeAvatar = async () => {
    const updated = await run(
      () => userApi.removeAvatar(),
      { successMessage: "Avatar removed.", errorMessage: "Unable to remove avatar." },
    );
    if (!updated) return;
    setProfile(updated);
    patchUser(updated);
  };

  const changePassword = async () => {
    const ok = await run(
      () => userApi.changePassword(currentPassword, newPassword),
      { successMessage: "Password changed.", errorMessage: "Unable to change password." },
    );
    if (ok === null) return;
    setCurrentPassword("");
    setNewPassword("");
  };

  const deleteAccount = async () => {
    const ok = await run(
      () => userApi.deleteAccount("DELETE"),
      { errorMessage: "Delete account failed." },
    );
    if (ok === null) return;
    logout();
    navigate("/register");
  };

  if (!profile) return <p className="text-sm text-muted-foreground">Profile unavailable.</p>;

  return (
    <div className="space-y-6 max-w-5xl">
      <section className="glass-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-primary/30">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
              ) : (
                <UserIcon size={40} className="text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="section-title truncate">{profile.name}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">@{profile.username || "user"}</p>
              <p className="text-xs text-muted-foreground opacity-70">ID: {profile.publicUserId || "N/A"}</p>
              {profile.bio && <p className="text-xs sm:text-sm mt-2 line-clamp-2 text-foreground">{profile.bio}</p>}
            </div>
          </div>
          {!isPublicRoute && (
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <Label htmlFor="avatarUpload" className="cursor-pointer">
                <span className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted transition-colors">
                  <Camera size={16} /> Upload
                </span>
              </Label>
              <Input
                id="avatarUpload"
                type="file"
                accept=".jpg,.jpeg,.png,.gif"
                className="hidden"
                onChange={(e) => uploadAvatar(e.target.files?.[0] || null)}
              />
              <Button variant="outline" size="sm" onClick={removeAvatar} className="w-full sm:w-auto">Remove</Button>
            </div>
          )}
        </div>

        {profile.skills && profile.skills.length > 0 && (
          <div className="mt-5 pt-5 border-t border-border/70">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Skills</p>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="px-3 py-1">{skill}</Badge>
              ))}
            </div>
          </div>
        )}
      </section>

      {isPublicRoute ? (
        <section className="glass-card p-5 sm:p-6 space-y-4">
          <h2 className="card-title flex items-center gap-2"><Globe size={18} /> Public Profile</h2>
          <div className="grid gap-3 text-sm">
            <div className="rounded-lg bg-background/40 p-3">
              <p className="text-xs text-muted-foreground font-semibold mb-1">Location</p>
              <p className="text-foreground">{profile.location || <span className="text-muted-foreground">Not shared</span>}</p>
            </div>
            <div className="rounded-lg bg-background/40 p-3">
              <p className="text-xs text-muted-foreground font-semibold mb-1">College</p>
              <p className="text-foreground">{profile.college || <span className="text-muted-foreground">Not shared</span>}</p>
            </div>
            <div className="rounded-lg bg-background/40 p-3 space-y-2">
              <p className="text-xs text-muted-foreground font-semibold">Social Links</p>
              {profile.githubUrl && <p><a href={profile.githubUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm">GitHub</a></p>}
              {profile.linkedinUrl && <p><a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm">LinkedIn</a></p>}
              {profile.twitterUrl && <p><a href={profile.twitterUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm">Twitter</a></p>}
              {profile.portfolioUrl && <p><a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm">Portfolio</a></p>}
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="glass-card p-5 sm:p-6 space-y-5">
            <h2 className="card-title">Edit Profile</h2>
            <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2"><Label>Display Name</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Email</Label><Input value={profile.email || user?.email || ""} disabled /></div>
              <div className="space-y-2"><Label>College</Label><Input value={college} onChange={(e) => setCollege(e.target.value)} /></div>
              <div className="space-y-2"><Label>Department</Label><Input value={department} onChange={(e) => setDepartment(e.target.value)} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div className="space-y-2"><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
              <div className="space-y-2"><Label>Timezone</Label><Input value={timezone} onChange={(e) => setTimezone(e.target.value)} /></div>
              <div className="space-y-2"><Label>Skills (comma separated)</Label><Input value={skillsCsv} onChange={(e) => setSkillsCsv(e.target.value)} /></div>
              <div className="space-y-2"><Label>GitHub</Label><Input value={github} onChange={(e) => setGithub(e.target.value)} /></div>
              <div className="space-y-2"><Label>LinkedIn</Label><Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} /></div>
              <div className="space-y-2"><Label>Twitter</Label><Input value={twitter} onChange={(e) => setTwitter(e.target.value)} /></div>
              <div className="space-y-2"><Label>Portfolio</Label><Input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} /></div>
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
            </div>
            <Button onClick={saveProfile} disabled={running} className="gap-2 w-full sm:w-auto">
              <Save size={16} />
              {running ? "Saving..." : "Save Changes"}
            </Button>
          </section>

          <section className="glass-card p-5 sm:p-6 space-y-5">
            <h2 className="card-title flex items-center gap-2"><Shield size={18} /> Privacy & Notifications</h2>
            <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Who can see email?</Label>
                <Input value={privacyEmail} onChange={(e) => setPrivacyEmail(e.target.value)} placeholder="public / loggedin / private" />
              </div>
              <div className="space-y-2">
                <Label>Who can see activity?</Label>
                <Input value={privacyActivity} onChange={(e) => setPrivacyActivity(e.target.value)} placeholder="public / loggedin / private" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/40">
                <Label className="text-sm m-0">Email notifications</Label>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/40">
                <Label className="text-sm m-0">Push notifications</Label>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/40">
                <Label className="text-sm m-0">Two-factor authentication</Label>
                <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
              </div>
            </div>
            <Button variant="outline" onClick={saveSettings} className="w-full">Save Settings</Button>
          </section>

          <section className="glass-card p-5 sm:p-6 space-y-5">
            <h2 className="card-title">Session Controls</h2>
            <p className="text-sm text-muted-foreground">Theme toggle is available in the sidebar. Manage your active session here.</p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                className="gap-2"
                onClick={logout}
              >
                <LogOut size={16} />
                Logout
              </Button>
            </div>
          </section>

          <section className="glass-card p-5 sm:p-6 space-y-5 border-destructive/40 bg-destructive/5">
            <h2 className="card-title flex items-center gap-2"><Lock size={18} /> Security</h2>
            <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
            </div>
            <Button onClick={changePassword} className="w-full">Change Password</Button>
          </section>

          <section className="glass-card p-5 sm:p-6 space-y-4 border-destructive/40 bg-destructive/5">
            <h2 className="card-title flex items-center gap-2"><Trash2 size={18} /> Danger Zone</h2>
            <p className="text-sm text-destructive font-medium">⚠️ This action cannot be undone. Your account and all data will be permanently deleted.</p>
            <Button variant="destructive" onClick={deleteAccount} className="w-full">Permanently Delete Account</Button>
          </section>
        </>
      )}
    </div>
  );
}
