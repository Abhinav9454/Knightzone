
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
  UserRound,
  Building2,
  GraduationCap,
  Check,
  ShieldCheck,
  Code2,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { KnightLogo, KnightCrest } from "../components/svg";
import ThemeToggle from "../components/ThemeToggle";

const accountTypes = [
  {
    id: "Individual",
    title: "Individual",
    description: "Compete on your own",
    icon: UserRound,
  },
  {
    id: "Student",
    title: "Student",
    description: "Join through your college",
    icon: GraduationCap,
  },
  {
    id: "Organization",
    title: "Organization",
    description: "Host coding tournaments",
    icon: Building2,
  },
];

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "Not entered" };

  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password) && /\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ["Weak", "Fair", "Good", "Strong"];

  return {
    score,
    label: labels[Math.max(0, score - 1)],
  };
};

const Register = () => {
  const [accountType, setAccountType] = useState("Individual");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const destination =
    location.state?.from || searchParams.get("redirect") || "/dashboard";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });

  const strength = getPasswordStrength(formData.password);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (formData.password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    if (strength.score < 3) {
      setError(
        "Choose a stronger password with uppercase/lowercase letters and numbers."
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    if (accountType !== "Individual" && !formData.organization.trim()) {
      setError(
        accountType === "Student"
          ? "Enter your college or university name."
          : "Enter your organization name."
      );
      return;
    }

    if (!formData.acceptedTerms) {
      setError("Please accept the competition rules to continue.");
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      setSuccessMessage("Account created successfully! Taking you there...");
      setTimeout(() => navigate(destination), 800);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Registration failed. Please verify your details or use another email.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/15 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-[#5a6b56] focus:border-[#c5ff55] focus:ring-2 focus:ring-[#c5ff55]/20";

  return (
    <main className="min-h-screen bg-[#0c0f0a] text-[#e0e4dc] lg:grid lg:grid-cols-[0.88fr_1.12fr]">
      {/* Brand panel */}
      <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden border-r border-white/10 bg-[#121610] p-10 text-white lg:flex xl:p-14">
        {/* Creative Knight Crest SVG Watermark */}
        <div className="pointer-events-none absolute -right-16 top-1/4 select-none opacity-15">
          <KnightCrest className="w-[450px] h-[450px]" glow={true} />
        </div>

        <Link to="/" className="relative z-10 flex w-fit items-center gap-3 group">
          <KnightLogo className="h-11 w-11 transition-transform duration-300 group-hover:scale-110" />
          <span className="text-lg font-black tracking-[0.15em] text-white">
            KNIGHT<span className="text-[#c5ff55]">ZONE</span>
          </span>
        </Link>

        <div className="relative z-10 max-w-lg py-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#c5ff55]/30 bg-[#c5ff55]/10 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.17em] text-[#c5ff55]">
            <Code2 size={14} />
            Competitive coding platform
          </div>

          <h1 className="mt-7 text-5xl font-black leading-[1.04] tracking-tight text-white xl:text-7xl">
            Make your
            <br />
            next move
            <br />
            <span className="text-[#c5ff55]">
              count.
            </span>
          </h1>

          <p className="mt-6 max-w-md text-sm leading-7 text-[#aab1a1]">
            Train your skills, challenge other developers, and work your way
            toward the top of the Knight Ranking System.
          </p>

          <div className="mt-10 space-y-4">
            {[
              "Practice algorithmic challenges",
              "Prepare for competitive tournaments",
              "Build your coding reputation",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#c5ff55]/15 text-[#c5ff55] border border-[#c5ff55]/30">
                  <Check size={14} />
                </span>
                <span className="text-sm text-[#e0e4dc]">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-3 border-t border-white/10 pt-5 text-[10px] font-mono text-[#788874]">
          <span>THINK. SOLVE. COMPETE.</span>
          <span>KBZ · ACCOUNT REGISTRATION</span>
        </div>
      </aside>

      {/* Registration section */}
      <section className="flex min-h-screen flex-col bg-[#0c0f0a] px-5 py-6 sm:px-10 lg:px-12 xl:px-20">
        <header className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <Swords size={23} className="text-[#c5ff55]" />
            <span className="text-sm font-black tracking-[0.12em] text-white">
              KNIGHT<span className="text-[#c5ff55]">ZONE</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle className="h-8 w-8 sm:h-9 sm:w-9" />
            <div className="text-xs text-[#788874]">
              Already a member?{" "}
              <Link
                to="/login"
                className="font-bold text-[#c5ff55] hover:underline"
              >
                Sign in
              </Link>
            </div>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto my-auto w-full max-w-[540px] py-10"
        >
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#161a14] text-[#c5ff55] shadow-lg">
            <UserRound size={22} />
          </div>

          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#c5ff55]">
            Create your profile
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Join the competition.
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#aab1a1]">
            Tell us a little about yourself to get started.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            {/* Account type */}
            <fieldset>
              <legend className="mb-3 text-xs font-semibold text-[#aab1a1]">
                Choose account type
              </legend>

              <div className="grid grid-cols-3 gap-2">
                {accountTypes.map((item) => {
                  const Icon = item.icon;
                  const selected = accountType === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setAccountType(item.id);
                        setError("");
                        setSuccessMessage("");
                      }}
                      aria-pressed={selected}
                      className={`relative flex min-w-0 flex-col items-start rounded-xl border p-3 text-left transition sm:p-4 ${
                        selected
                          ? "border-[#c5ff55] bg-[#c5ff55]/10 ring-2 ring-[#c5ff55]/20 text-white"
                          : "border-white/10 bg-[#161a14] text-[#aab1a1] hover:border-white/25"
                      }`}
                    >
                      <Icon
                        size={19}
                        className={
                          selected ? "text-[#c5ff55]" : "text-[#788874]"
                        }
                      />

                      <span className="mt-3 text-xs font-bold text-white sm:text-sm">
                        {item.title}
                      </span>

                      <span className="mt-1 text-[10px] leading-4 text-[#788874]">
                        {item.description}
                      </span>

                      {selected && (
                        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#c5ff55] text-[#0c0f0a]">
                          <Check size={10} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-xs font-semibold text-[#aab1a1]"
              >
                Full name
              </label>

              <div className="relative">
                <UserRound
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#788874]"
                />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Email */}
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
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Conditional organization field */}
            {accountType !== "Individual" && (
              <div>
                <label
                  htmlFor="organization"
                  className="mb-2 block text-xs font-semibold text-[#aab1a1]"
                >
                  {accountType === "Student"
                    ? "College or university"
                    : "Organization name"}
                </label>

                <div className="relative">
                  <Building2
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#788874]"
                  />
                  <input
                    id="organization"
                    name="organization"
                    type="text"
                    autoComplete="organization"
                    required
                    value={formData.organization}
                    onChange={handleChange}
                    placeholder={
                      accountType === "Student"
                        ? "Enter your college name"
                        : "Enter your organization name"
                    }
                    className={inputClass}
                  />
                </div>

                {accountType === "Organization" && (
                  <p className="mt-2 text-[11px] leading-5 text-[#788874]">
                    Organization ID creation and invitations will be handled
                    through the organization onboarding workflow.
                  </p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-semibold text-[#aab1a1]"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#788874]"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className={`${inputClass} pr-12`}
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

              {formData.password && (
                <div className="mt-3">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full ${
                          strength.score >= level
                            ? strength.score <= 1
                              ? "bg-rose-500"
                              : strength.score === 2
                              ? "bg-amber-500"
                              : strength.score === 3
                              ? "bg-lime-500"
                              : "bg-[#c5ff55]"
                            : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-[10px] font-mono text-[#788874]">
                    Password strength: {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-xs font-semibold text-[#aab1a1]"
              >
                Confirm password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#788874]"
                />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((visible) => !visible)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirmation password"
                      : "Show confirmation password"
                  }
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#788874] hover:text-[#c5ff55]"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>

              {formData.confirmPassword && (
                <p
                  className={`mt-2 text-[11px] font-mono ${
                    formData.password === formData.confirmPassword
                      ? "text-[#c5ff55]"
                      : "text-rose-400"
                  }`}
                >
                  {formData.password === formData.confirmPassword
                    ? "Passwords match"
                    : "Passwords do not match"}
                </p>
              )}
            </div>

            {/* Terms */}
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="acceptedTerms"
                checked={formData.acceptedTerms}
                onChange={handleChange}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#c5ff55]"
              />
              <span className="text-xs leading-5 text-[#aab1a1]">
                I agree to the platform's competition rules and community
                guidelines.
              </span>
            </label>

            {/* Feedback */}
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs leading-5 text-rose-400"
              >
                {error}
              </p>
            )}

            {successMessage && (
              <p
                role="status"
                className="rounded-xl border border-[#c5ff55]/30 bg-[#c5ff55]/10 p-3 text-xs leading-5 text-[#c5ff55]"
              >
                {successMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c5ff55] px-5 py-3.5 text-sm font-black uppercase tracking-wider text-[#14170f] shadow-md shadow-[#c5ff55]/20 transition hover:bg-[#d5ff83] focus:outline-none focus:ring-4 focus:ring-[#c5ff55]/30 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </motion.div>

        <footer className="flex flex-wrap justify-between gap-2 border-t border-white/10 pt-4 text-[10px] font-mono text-[#788874]">
          <span>© Knight Battle Zone</span>
          <Link to="/" className="hover:text-[#c5ff55]">
            Back to home
          </Link>
        </footer>
      </section>
    </main>
  );
};

export default Register;
