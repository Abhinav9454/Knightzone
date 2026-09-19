import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/BrandLogo";
import { BrandIdentity } from "@/components/BrandIdentity";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

const highlights: Array<{
  title: string;
  description: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Unified Performance Dashboard",
    description: "One place to view contests, submissions, streaks, and ranking movement.",
    Icon: Sparkles,
  },
  {
    title: "Verified Progress Signals",
    description: "Consistency metrics and activity trends designed for real student outcomes.",
    Icon: CheckCircle2,
  },
  {
    title: "Secure Academic Profile",
    description: "Role-based access, protected sessions, and reliable history tracking.",
    Icon: ShieldCheck,
  },
];

const toSimplePath = (path: string): string => {
  if (path === "/" || path === "/simple") {
    return "/simple/dashboard";
  }
  if (path.startsWith("/simple/")) {
    return path;
  }
  return `/simple${path}`;
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectPath = useMemo(() => {
    const requested = searchParams.get("redirect")?.trim();
    if (!requested) return "/simple/dashboard";
    if (!requested.startsWith("/") || requested.startsWith("//")) return "/simple/dashboard";
    return toSimplePath(requested);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      await login(email, password);
      navigate(redirectPath, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (idToken: string) => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      await googleLogin(idToken);
      navigate(redirectPath, { replace: true });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ background: "var(--gradient-hero)" }}>
      <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
        <section className="relative hidden overflow-hidden border-r border-border/70 lg:flex lg:items-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.2),transparent_35%),radial-gradient(circle_at_85%_82%,hsl(var(--accent)/0.18),transparent_33%)]" />
          <div className="relative mx-auto w-full max-w-2xl px-10 py-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <BrandIdentity logoSize={16} textClassName="text-sm font-black" />
            </div>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight">
              Sign in to continue your coding performance journey.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Access your personalized dashboard, challenge history, and progress intelligence built for practice and placement prep.
            </p>

            <div className="mt-8 space-y-4">
              {highlights.map(({ title, description, Icon }) => (
                <article key={title} className="rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center px-5 py-10 sm:px-8 lg:px-10">
          <div className="w-full max-w-[30rem] glass-card p-6 sm:p-8">
            <div className="mb-6 space-y-2">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary glow-border">
                <BrandLogo className="h-7 w-7 rounded-md" size={28} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account yet?{" "}
                <Link to="/register" className="font-semibold text-primary transition-colors hover:text-primary/80 hover:underline">
                  Create account
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-sm font-semibold">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 border-border bg-input"
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="password" className="text-sm font-semibold">
                    Password
                  </Label>
                  <Link to="/forgot-password" className="text-xs sm:text-sm font-medium text-primary transition-colors hover:text-primary/80 hover:underline">
                    Forgot?
                  </Link>
                </div>

                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 border-border bg-input"
                />
              </div>

              <Button type="submit" disabled={loading || googleLoading} className="h-11 w-full text-base font-semibold mt-2" onClick={() => {}}>
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </form>

            <div className="mt-5">
              <GoogleAuthButton
                onCredential={handleGoogleLogin}
                disabled={loading || googleLoading}
                text="signin_with"
              />
            </div>

            <div className="mt-7 space-y-4 border-t border-border/70 pt-6">
              <p className="text-center text-xs text-muted-foreground leading-relaxed">
                By signing in, you agree to our{" "}
                <Link to="/terms" className="text-primary font-medium hover:underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-primary font-medium hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
              <p className="text-center text-sm text-muted-foreground">
                New to Knights Battle Zone?{" "}
                <Link to="/register" className="text-primary font-semibold transition-colors hover:text-primary/80">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

