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
      "bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-100",
    secondary:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-100",
    dark:
      "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-200",
    outline:
      "border border-orange-500 text-orange-600 hover:bg-orange-50 focus:ring-orange-100",
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