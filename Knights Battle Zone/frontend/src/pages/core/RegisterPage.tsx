import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { BrandIdentity } from "@/components/BrandIdentity";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async (idToken: string) => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      await googleLogin(idToken);
      navigate("/");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-background p-4"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-xl bg-primary/10 glow-border">
              <BrandLogo className="h-10 w-10 rounded-lg" size={40} />
            </div>
          </div>
          <h1 className="text-3xl font-bold">
            Join <BrandIdentity className="align-middle" showLogo={false} textClassName="text-3xl font-black" />
          </h1>
          <p className="mt-2 text-muted-foreground">Create your competitive coding profile</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 space-y-5">
          <div className="space-y-2.5">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-11 bg-input border-border"
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 bg-input border-border"
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Choose a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 bg-input border-border"
            />
          </div>

          <Button type="submit" className="h-11 w-full text-base font-semibold mt-2" disabled={loading || googleLoading}>
            <span className="flex items-center justify-center gap-2">
              Create Account
              <ArrowRight size={16} />
            </span>
          </Button>

          <GoogleAuthButton
            onCredential={handleGoogleRegister}
            disabled={loading || googleLoading}
            text="signup_with"
          />

          <div className="space-y-3 border-t border-border/70 pt-5">
            <div className="text-center text-xs leading-relaxed text-muted-foreground">
              By creating an account, you agree to our{" "}
              <Link to="/terms" className="text-primary font-medium hover:underline">
                Terms
              </Link>
              {" "}and{" "}
              <Link to="/privacy" className="text-primary font-medium hover:underline">
                Privacy Policy
              </Link>
              .
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-semibold transition-colors hover:text-primary/80">
                Sign in instead
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
