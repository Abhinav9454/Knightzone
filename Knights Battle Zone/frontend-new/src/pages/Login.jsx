
import { useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Swords,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  Code2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { KnightLogo, KnightCrest } from "../components/svg";
import ThemeToggle from "../components/ThemeToggle";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const destination =
    location.state?.from || searchParams.get("redirect") || "/dashboard";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate(destination);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Invalid email or password. Please check your credentials.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-[#0c0f0a] text-[#e0e4dc] lg:grid-cols-[1.05fr_0.95fr]">
      {/* Brand panel */}
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden border-r border-white/10 bg-[#121610] p-10 text-white lg:flex xl:p-14">
        {/* Creative Knight Crest SVG Watermark */}
        <div className="pointer-events-none absolute -right-12 top-1/4 select-none opacity-15">
          <KnightCrest className="w-[420px] h-[420px]" glow={true} />
        </div>

        <Link to="/" className="relative z-10 flex w-fit items-center gap-3 group">
          <KnightLogo className="h-11 w-11 transition-transform duration-300 group-hover:scale-110" />
          <span className="text-lg font-black tracking-[0.15em] text-white">
            KNIGHT<span className="text-[#c5ff55]">ZONE</span>
          </span>
        </Link>

        <div className="relative z-10 max-w-xl py-14">
          <p className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#c5ff55]">
            <Code2 size={16} />
            Built for problem solvers
          </p>

          <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight xl:text-7xl">
            Your next
            <br />
            breakthrough
            <br />
            <span className="text-[#c5ff55]">
              starts here.
            </span>
          </h1>

          <p className="mt-6 max-w-md text-sm leading-7 text-[#aab1a1]">
            Practise algorithms, prepare for competitions, and build the
            problem-solving habits that make you a stronger developer.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            {["Practice", "Compete", "Improve"].map((item, index) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-mono text-white/90"
              >
                <span className="mr-2 text-[#c5ff55]">0{index + 1}</span>
                {item}
              </span>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs font-mono text-[#788874]">
          KNIGHTZONE · THINK. SOLVE. COMPETE.
        </p>
      </section>

      {/* Login form */}
      <section className="flex min-h-screen flex-col justify-between bg-[#0c0f0a] px-5 py-6 sm:px-10 lg:px-12 xl:px-20">
        <header className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <Swords size={23} className="text-[#c5ff55]" />
            <span className="text-sm font-black tracking-[0.12em] text-white">
              KNIGHT<span className="text-[#c5ff55]">ZONE</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 ml-auto">
            <ThemeToggle className="h-8 w-8 sm:h-9 sm:w-9" />
            <p className="text-xs text-[#788874]">
              New to Knightzone?{" "}
              <Link
                to="/register"
                className="font-bold text-[#c5ff55] hover:underline"
              >
                Create account
              </Link>
            </p>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto w-full max-w-md py-12"
        >
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#161a14] text-[#c5ff55] shadow-lg">
            <LockKeyhole size={22} />
          </div>

          <p className="text-xs font-mono font-bold uppercase tracking-[0.17em] text-[#c5ff55]">
            Welcome back
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Sign in to your account
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#aab1a1]">
            Continue your practice and pick up where you left off.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-semibold text-[#aab1a1]"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#788874]"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/15 bg-black/40 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-[#5a6b56] focus:border-[#c5ff55] focus:ring-2 focus:ring-[#c5ff55]/20"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-[#aab1a1]"
                >
                  Password
                </label>
                <span className="text-[10px] font-mono text-[#788874]">
                  Backend auth required
                </span>
              </div>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#788874]"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/15 bg-black/40 py-3.5 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-[#5a6b56] focus:border-[#c5ff55] focus:ring-2 focus:ring-[#c5ff55]/20"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#788874] hover:text-[#c5ff55]"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c5ff55] px-5 py-3.5 text-sm font-black uppercase tracking-wider text-[#14170f] shadow-md shadow-[#c5ff55]/20 transition hover:bg-[#d5ff83] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#788874]">
              Get started
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <Link
            to="/register"
            className="flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/10 hover:border-white/25"
          >
            Create a new account
          </Link>
        </motion.div>

        <footer className="flex flex-wrap justify-between gap-2 text-[10px] font-mono text-[#788874]">
          <span>© Knightzone</span>
          <Link to="/" className="hover:text-[#c5ff55]">
            Back to home
          </Link>
        </footer>
      </section>
    </main>
  );
};

export default Login;
