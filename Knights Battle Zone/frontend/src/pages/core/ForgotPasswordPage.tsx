import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, KeyRound, Mail, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { authApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/BrandLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [serverMessage, setServerMessage] = useState("");
  const navigate = useNavigate();

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setRequesting(true);
    try {
      const response = await authApi.forgotPassword(email);
      setServerMessage(response.message);
      if (response.resetToken) {
        setToken(response.resetToken);
        toast.success("Reset token generated. Use it below to set a new password.");
      } else {
        toast.success("Reset request accepted. Check your email (production mode).");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to process forgot-password request."));
    } finally {
      setRequesting(false);
    }
  };

  const submitReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token.trim()) {
      toast.error("Reset token is required.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setResetting(true);
    try {
      const response = await authApi.resetPassword(token.trim(), newPassword);
      toast.success(response.message || "Password reset successful.");
      navigate("/login");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to reset password."));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-xl bg-primary/10 glow-border">
              <BrandLogo className="h-10 w-10 rounded-lg" size={40} />
            </div>
          </div>
          <h1 className="text-3xl font-bold gradient-text">Reset Your Password</h1>
          <p className="mt-2 text-muted-foreground">Forgot password? Generate token and set a new password securely.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <form onSubmit={requestReset} className="glass-card p-6 space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Mail size={18} className="text-primary" />
              Step 1: Request Token
            </h2>
            <div className="space-y-2">
              <Label htmlFor="email">Account Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                required
                className="bg-muted border-border"
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={requesting}>
              <>
                Generate Reset Token
                <ArrowRight size={14} />
              </>
            </Button>
            {serverMessage && <p className="text-xs text-muted-foreground">{serverMessage}</p>}
          </form>

          <form onSubmit={submitReset} className="glass-card p-6 space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <KeyRound size={18} className="text-primary" />
              Step 2: Set New Password
            </h2>
            <div className="space-y-2">
              <Label htmlFor="token">Reset Token</Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste reset token"
                required
                className="bg-muted border-border font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                className="bg-muted border-border"
              />
            </div>
            <Button type="submit" className="w-full" disabled={resetting}>
              {resetting ? "Updating Password..." : "Reset Password"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Remembered your password?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
