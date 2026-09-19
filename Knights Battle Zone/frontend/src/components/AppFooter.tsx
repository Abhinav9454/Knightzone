import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { SeoJsonLd } from "@/components/SeoJsonLd";

export function AppFooter() {
  const location = useLocation();
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const routePrefix =
    location.pathname === "/simple" || location.pathname.startsWith("/simple/")
      ? "/simple"
      : "";

  const quickLinks = [
    { label: "Help Center", to: "/help" },
    { label: "Jobs", to: "/jobs" },
    { label: "Bug Bounty", to: "/bug-bounty" },
    { label: "Assessment", to: "/assessment" },
    { label: "Students", to: "/students" },
    { label: "Terms", to: "/terms" },
    { label: "Privacy Policy", to: "/privacy" },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Knights Battle Zone",
    url: "https://knightsbattlezone.local",
    sameAs: [
      "https://www.linkedin.com",
      "https://x.com",
      "https://www.instagram.com",
    ],
  };

  return (
    <footer className="footer-shell relative mt-8 overflow-hidden border-t border-border/70 bg-card/95" aria-label="Site footer">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 right-16 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
      </div>

      <SeoJsonLd data={schema} />

      <div className="relative z-10 mx-auto flex w-full max-w-[1920px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-3 py-3 text-xs sm:px-4 sm:text-sm md:px-6">
        <p className="text-muted-foreground">Copyright &copy; {currentYear} Knights Battle Zone</p>

        <nav aria-label="Footer links" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
          {quickLinks.map((item) => (
            <Link
              key={item.label}
              to={`${routePrefix}${item.to}`}
              className="transition-colors hover:text-foreground hover:underline hover:underline-offset-4"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

