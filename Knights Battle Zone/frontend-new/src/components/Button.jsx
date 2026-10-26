import { Link } from "react-router-dom";

export default function Button({
  children,
  to,
  variant = "primary",
  className = "",
  onClick,
  type = "button",
  disabled = false,
}) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    primary:
      "bg-[#c5ff55] text-[#14170f] font-black uppercase tracking-wider hover:bg-[#d5ff83] focus:ring-[#c5ff55]/30 shadow-md shadow-[#c5ff55]/20",
    secondary:
      "border border-white/15 bg-white/5 text-white hover:bg-white/10 focus:ring-white/20",
    dark:
      "bg-[#161a14] border border-white/10 text-white hover:bg-white/5 focus:ring-white/10",
    outline:
      "border border-[#c5ff55]/50 text-[#c5ff55] hover:bg-[#c5ff55]/10 focus:ring-[#c5ff55]/20",
  };

  const classes =
    `${baseStyles} ${variants[variant] || variants.primary} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
}