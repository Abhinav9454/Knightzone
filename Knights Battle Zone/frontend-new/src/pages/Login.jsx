
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate("/dashboard");
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
    <main className="grid min-h-screen bg-[#f7f8f6] text-[#202722] lg:grid-cols-[1.05fr_0.95fr]">
      {/* Brand panel */}
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#183d34] p-10 text-white lg:flex xl:p-14">
        {/* Creative Knight Crest SVG Watermark */}
        <div className="pointer-events-none absolute -right-12 top-1/4 select-none opacity-25">
          <KnightCrest className="w-[420px] h-[420px]" glow={true} />
        </div>

        <Link to="/" className="relative z-10 flex w-fit items-center gap-3 group">
          <KnightLogo className="h-11 w-11 transition-transform duration-300 group-hover:scale-110" />
          <span className="text-lg font-black tracking-[0.15em]">
            KNIGHTZONE
          </span>
        </Link>

        <div className="relative z-10 max-w-xl py-14">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#c5ff55]">
            <Code2 size={16} />
            Built for problem solvers
          </p>

          <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-[-0.055em] xl:text-7xl">
            Your next
            <br />
            breakthrough
            <br />
            <span className="font-serif italic font-normal text-[#c5ff55]">
              starts here.
            </span>
          </h1>

          <p className="mt-6 max-w-md text-sm leading-7 text-[#d0e0d9]">
            Practise algorithms, prepare for competitions, and build the
            problem-solving habits that make you a stronger developer.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            {["Practice", "Compete", "Improve"].map((item, index) => (
              <span
                key={item}
                className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/80"
              >
                <span className="mr-2 text-[#c5ff55]">0{index + 1}</span>
                {item}
              </span>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/50">
          KNIGHTZONE · THINK. SOLVE. COMPETE.
        </p>
      </section>

      {/* Login form */}
      <section className="flex min-h-screen flex-col justify-between px-5 py-6 sm:px-10 lg:px-12 xl:px-20">
        <header className="flex items-center justify-between lg:justify-end">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <Swords size={23} className="text-[#183d34]" />
            <span className="text-sm font-black tracking-[0.12em]">
              KNIGHTZONE
            </span>
          </Link>

          <p className="text-xs text-[#737d75]">
            New to Knightzone?{" "}
            <Link
              to="/register"
              className="font-bold text-[#13836d] hover:underline"
            >
              Create account
            </Link>
          </p>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto w-full max-w-md py-12"
        >
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl border border-[#dfe4de] bg-white text-[#183d34]">
            <LockKeyhole size={22} />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#13836d]">
            Welcome back
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
            Sign in to your account
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#737d75]">
            Continue your practice and pick up where you left off.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-semibold text-[#38433a]"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929b93]"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-[#dfe4de] bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-[#a0a8a0] focus:border-[#13836d] focus:ring-2 focus:ring-[#13836d]/10"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-[#38433a]"
                >
                  Password
                </label>
                <span className="text-[10px] text-[#929b93]">
                  Backend auth required
                </span>
              </div>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929b93]"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-[#dfe4de] bg-white py-3.5 pl-11 pr-12 text-sm outline-none transition placeholder:text-[#a0a8a0] focus:border-[#13836d] focus:ring-2 focus:ring-[#13836d]/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#929b93] hover:text-[#183d34]"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#183d34] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#245747] disabled:opacity-70 disabled:cursor-not-allowed"
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
            <div className="h-px flex-1 bg-[#e4e7e1]" />
            <span className="text-[10px] uppercase tracking-wider text-[#9aa39b]">
              Get started
            </span>
            <div className="h-px flex-1 bg-[#e4e7e1]" />
          </div>

          <Link
            to="/register"
            className="flex w-full items-center justify-center rounded-lg border border-[#dfe4de] bg-white px-5 py-3.5 text-sm font-semibold transition hover:bg-[#f0f3ed]"
          >
            Create a new account
          </Link>
        </motion.div>

        <footer className="flex flex-wrap justify-between gap-2 text-[10px] text-[#929b93]">
          <span>© Knightzone</span>
          <Link to="/" className="hover:text-[#183d34]">
            Back to home
          </Link>
        </footer>
      </section>
    </main>
  );
};

export default Login;
