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
  LoaderCircle,
  CircleAlert,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      return "Email address is required.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return "Enter a valid email address.";
    }

    if (formData.password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setStatus("loading");
    setError("");

    try {
      // Replace this with your real API call:
      // const response = await axiosClient.post("/auth/login", formData);
      // localStorage.setItem("kbz_token", response.data.token);

      await new Promise((resolve) => setTimeout(resolve, 1200));

      navigate("/dashboard");
    } catch {
      setError("Invalid email or password. Please try again.");
      setStatus("error");
    }
  };

  const isLoading = status === "loading";

  return (
    <main className="grid min-h-screen bg-slate-50 text-slate-900 lg:grid-cols-[1.05fr_0.95fr]">
      {/* Brand panel */}
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-slate-900 p-10 text-white lg:flex xl:p-14">
        <div className="pointer-events-none absolute -right-16 top-1/4 select-none text-[330px] font-black leading-none text-white/[0.04]">
          K
        </div>

        <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-indigo-600/25 blur-3xl" />

        <Link
          to="/"
          className="relative z-10 flex w-fit items-center gap-3"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Swords size={22} />
          </span>

          <span className="text-lg font-bold tracking-tight">
            Knight Battle Zone
          </span>
        </Link>

        <div className="relative z-10 max-w-xl py-14">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">
            <Code2 size={16} />
            Built for problem solvers
          </p>

          <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight xl:text-6xl">
            Your next
            <br />
            breakthrough
            <br />
            <span className="bg-gradient-to-r from-indigo-300 to-indigo-500 bg-clip-text text-transparent">
              starts here.
            </span>
          </h1>

          <p className="mt-6 max-w-md text-sm leading-7 text-slate-400">
            Practice algorithms, prepare for technical interviews, compete in
            live coding battles, and build skills that compound over time.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            {["Practice", "Compete", "Improve"].map((item, index) => (
              <span
                key={item}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-slate-300"
              >
                <span className="mr-2 font-semibold text-indigo-300">
                  0{index + 1}
                </span>
                {item}
              </span>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-500">
          Knight Battle Zone · Practice. Compete. Improve.
        </p>
      </section>

      {/* Login form */}
      <section className="flex min-h-screen flex-col justify-between px-5 py-6 sm:px-10 lg:px-12 xl:px-20">
        <header className="flex items-center justify-between lg:justify-end">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <Swords size={22} className="text-indigo-600" />
            <span className="text-sm font-bold text-slate-900">
              Knight Battle Zone
            </span>
          </Link>

          <p className="text-sm text-slate-600">
            New here?{" "}
            <Link
              to="/register"
              className="font-semibold text-indigo-600 hover:text-indigo-700"
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
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-indigo-600 shadow-sm">
            <LockKeyhole size={22} />
          </div>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            Sign in to continue your practice, join contests, and track your
            progress.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
            >
              <CircleAlert size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={17}
                  aria-hidden="true"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  aria-invalid={Boolean(error)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  aria-hidden="true"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  aria-invalid={Boolean(error)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs uppercase tracking-wider text-slate-400">
              New to KBZ
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <Link
            to="/register"
            className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Create a free account
          </Link>
        </motion.div>

        <footer className="flex flex-wrap justify-between gap-2 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} Knight Battle Zone</span>

          <Link to="/" className="hover:text-indigo-600">
            Back to home
          </Link>
        </footer>
      </section>
    </main>
  );
}