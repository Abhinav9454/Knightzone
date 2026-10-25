
import { useState } from "react";
import { Link } from "react-router-dom";
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
} from "lucide-react";

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

  const handleSubmit = (event) => {
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

    // UI preview only. No registration API is connected yet.
    setSuccessMessage(
      "Your form is valid. Account creation will be available after backend integration."
    );
  };

  const inputClass =
    "w-full rounded-xl border border-[#dfe4de] bg-white py-3 pl-11 pr-4 text-sm text-[#202722] outline-none transition placeholder:text-[#a0a8a0] focus:border-[#13836d] focus:ring-4 focus:ring-[#13836d]/[0.08]";

  return (
    <main className="min-h-screen bg-[#f7f8f6] text-[#202722] lg:grid lg:grid-cols-[0.88fr_1.12fr]">
      {/* Brand panel */}
      <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#183d34] p-10 text-white lg:flex xl:p-14">
        <div className="pointer-events-none absolute -right-20 top-1/4 select-none text-[360px] font-black leading-none text-white/[0.035]">
          K
        </div>

        <Link to="/" className="relative z-10 flex w-fit items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c5ff55] text-[#183d34]">
            <Swords size={23} />
          </span>
          <span className="text-lg font-black tracking-[0.15em]">
            KNIGHTZONE
          </span>
        </Link>

        <div className="relative z-10 max-w-lg py-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.17em] text-[#c5ff55]">
            <Code2 size={14} />
            Competitive coding platform
          </div>

          <h1 className="mt-7 text-5xl font-semibold leading-[1.04] tracking-[-0.06em] xl:text-7xl">
            Make your
            <br />
            next move
            <br />
            <span className="font-serif italic font-normal text-[#c5ff55]">
              count.
            </span>
          </h1>

          <p className="mt-6 max-w-md text-sm leading-7 text-[#d0e0d9]">
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
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#c5ff55]/10 text-[#c5ff55]">
                  <Check size={14} />
                </span>
                <span className="text-sm text-white/85">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-3 border-t border-white/15 pt-5 text-[10px] text-white/50">
          <span>THINK. SOLVE. COMPETE.</span>
          <span>KBZ · ACCOUNT REGISTRATION</span>
        </div>
      </aside>

      {/* Registration section */}
      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-12 xl:px-20">
        <header className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <Swords size={23} className="text-[#183d34]" />
            <span className="text-sm font-black tracking-[0.12em]">
              KNIGHTZONE
            </span>
          </Link>

          <div className="ml-auto text-xs text-[#737d75]">
            Already a member?{" "}
            <Link
              to="/login"
              className="font-bold text-[#13836d] hover:underline"
            >
              Sign in
            </Link>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto my-auto w-full max-w-[540px] py-10"
        >
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-[#dfe4de] bg-white text-[#183d34]">
            <UserRound size={22} />
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#13836d]">
            Create your profile
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
            Join the competition.
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#737d75]">
            Tell us a little about yourself to get started.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            {/* Account type */}
            <fieldset>
              <legend className="mb-3 text-xs font-semibold text-[#38433a]">
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
                          ? "border-[#13836d] bg-[#eaf4ee] ring-2 ring-[#13836d]/10"
                          : "border-[#dfe4de] bg-white hover:border-[#aebdb0]"
                      }`}
                    >
                      <Icon
                        size={19}
                        className={
                          selected ? "text-[#13836d]" : "text-[#879087]"
                        }
                      />

                      <span className="mt-3 text-xs font-bold sm:text-sm">
                        {item.title}
                      </span>

                      <span className="mt-1 text-[10px] leading-4 text-[#7c857d]">
                        {item.description}
                      </span>

                      {selected && (
                        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#13836d] text-white">
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
                className="mb-2 block text-xs font-semibold text-[#38433a]"
              >
                Full name
              </label>

              <div className="relative">
                <UserRound
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929b93]"
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
                  className="mb-2 block text-xs font-semibold text-[#38433a]"
                >
                  {accountType === "Student"
                    ? "College or university"
                    : "Organization name"}
                </label>

                <div className="relative">
                  <Building2
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929b93]"
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
                  <p className="mt-2 text-[11px] leading-5 text-[#7c857d]">
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
                className="mb-2 block text-xs font-semibold text-[#38433a]"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929b93]"
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#929b93] hover:text-[#183d34]"
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
                              ? "bg-lime-600"
                              : "bg-emerald-600"
                            : "bg-[#e4e8e1]"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-[10px] text-[#7c857d]">
                    Password strength: {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-xs font-semibold text-[#38433a]"
              >
                Confirm password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929b93]"
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#929b93] hover:text-[#183d34]"
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
                  className={`mt-2 text-[11px] ${
                    formData.password === formData.confirmPassword
                      ? "text-[#13836d]"
                      : "text-rose-600"
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
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#13836d]"
              />
              <span className="text-xs leading-5 text-[#737d75]">
                I agree to the platform's competition rules and community
                guidelines.
              </span>
            </label>

            {/* Feedback */}
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700"
              >
                {error}
              </p>
            )}

            {successMessage && (
              <p
                role="status"
                className="rounded-xl border border-[#b9deca] bg-[#eaf6ee] p-3 text-xs leading-5 text-[#246a48]"
              >
                {successMessage}
              </p>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#183d34] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#245747] focus:outline-none focus:ring-4 focus:ring-[#13836d]/20"
            >
              Create account <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#e4e4d7] bg-[#f3f2e9] p-3">
            <ShieldCheck
              size={16}
              className="mt-0.5 shrink-0 text-[#6c765c]"
            />
            <p className="text-[11px] leading-5 text-[#77766e]">
              Preview mode: this form validates your entries locally. It does
              not create an account or send your details to a server.
            </p>
          </div>
        </motion.div>

        <footer className="flex flex-wrap justify-between gap-2 border-t border-[#e4e7e1] pt-4 text-[10px] text-[#929b93]">
          <span>© Knight Battle Zone</span>
          <Link to="/" className="hover:text-[#183d34]">
            Back to home
          </Link>
        </footer>
      </section>
    </main>
  );
};

export default Register;
