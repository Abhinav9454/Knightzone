import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  Keyboard,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandIdentity } from "@/components/BrandIdentity";

type NavItem = {
  label: string;
  href: string;
};

type ShowcaseModule = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  route: string;
  category: "Compete" | "Practice" | "Career" | "Community" | "Tracking";
};

type Highlight = {
  title: string;
  value: string;
  description: string;
};

const navItems: NavItem[] = [
  { label: "Showcase", href: "#showcase" },
  { label: "Workflow", href: "#workflow" },
  { label: "Highlights", href: "#highlights" },
];

const liveModules: ShowcaseModule[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Single view for contests, submissions, rank, and activity insights.",
    icon: LayoutDashboard,
    route: "/dashboard",
    category: "Tracking",
  },
  {
    id: "contests",
    title: "Contests",
    description: "Browse contest events, details, and competition flow.",
    icon: Trophy,
    route: "/contests",
    category: "Compete",
  },
  {
    id: "duels",
    title: "Duels",
    description: "Head-to-head coding battles with match history.",
    icon: Swords,
    route: "/duels",
    category: "Compete",
  },
  {
    id: "typing",
    title: "Typing Pro Arena",
    description: "Code typing practice with speed and accuracy tracking.",
    icon: Keyboard,
    route: "/typing-speed",
    category: "Practice",
  },
  {
    id: "mock-interviews",
    title: "Mock Interviews",
    description: "Interview practice modes with progress tracking.",
    icon: MessageSquare,
    route: "/mock-interviews",
    category: "Practice",
  },
  {
    id: "tracker",
    title: "Student Performance Tracking",
    description: "Unified coding analytics and activity patterns.",
    icon: Activity,
    route: "/tracker",
    category: "Tracking",
  },
  {
    id: "leaderboard",
    title: "Leaderboard",
    description: "College and global rankings with filters and updates.",
    icon: BarChart3,
    route: "/leaderboard",
    category: "Tracking",
  },
  {
    id: "placement",
    title: "Placement Readiness",
    description: "Career prep dashboard with readiness insights.",
    icon: GraduationCap,
    route: "/placement",
    category: "Career",
  },
  {
    id: "jobs",
    title: "Placement Jobs",
    description: "Explore openings and placement-oriented opportunities.",
    icon: BriefcaseBusiness,
    route: "/placement/jobs",
    category: "Career",
  },
  {
    id: "clubs",
    title: "Clubs",
    description: "Join communities, track club stats, and collaborate.",
    icon: Users,
    route: "/clubs",
    category: "Community",
  },
  {
    id: "marketplace",
    title: "Marketplace",
    description: "Share and discover resources with community engagement.",
    icon: Sparkles,
    route: "/marketplace",
    category: "Community",
  },
  {
    id: "integrity",
    title: "Integrity Monitoring",
    description: "Admin-level fair play and suspicious activity monitoring.",
    icon: ShieldCheck,
    route: "/admin/integrity",
    category: "Tracking",
  },
];

const highlights: Highlight[] = [
  {
    title: "Live pages",
    value: "30+",
    description: "Production-style routes already integrated in the app.",
  },
  {
    title: "Theme system",
    value: "Dark / Light / Contrast",
    description: "User preference-based theme switching is already available.",
  },
  {
    title: "Core focus",
    value: "Practice + Placement",
    description: "Platform is aligned for coding growth and career outcomes.",
  },
  {
    title: "Realtime readiness",
    value: "WebSocket enabled",
    description: "Supports live updates in monitoring and collaboration areas.",
  },
];

const quickFlow = [
  "Login and open dashboard overview",
  "Choose module: contests, duels, typing, mock interviews, tracker",
  "Measure growth through leaderboard, consistency, and profile insights",
  "Use placement and jobs modules for career progression",
];

function toLoginRedirect(path: string): string {
  return `/login?redirect=${encodeURIComponent(path)}`;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground" style={{ background: "var(--gradient-hero)" }}>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 glow-border">
              <BrandIdentity showText={false} logoSize={24} />
            </div>
            <BrandIdentity logoSize={22} textClassName="text-2xl" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="font-semibold">
              <Link to="/login">Login</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-12 sm:px-6 md:pt-16 lg:px-8">
        <section className="grid gap-8 lg:gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6 md:space-y-8 animate-fade-in-left">
            <span className="hero-chip animate-scale-in">Project Showcase</span>
            <h1 className="text-balance text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl gradient-text">
              A unified coding platform that is already live with structured modules.
            </h1>
            <p className="max-w-3xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
              Knights Battle Zone showcases active modules for tracking, competition, practice, community, and career readiness in one connected experience.
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <Button asChild size="lg" className="font-semibold w-full sm:w-auto btn-glow">
                <Link to="/login" className="inline-flex items-center justify-center gap-2">
                  Open Platform
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-semibold w-full sm:w-auto transition-all hover:border-primary hover:shadow-lg">
                <a href="#showcase">View Live Modules</a>
              </Button>
            </div>
          </div>

          <Card className="content-panel card-hover-glow animate-fade-in-right" style={{animationDelay: '0.1s'}}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Current Product Positioning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="text-primary font-bold shrink-0">1.</span>
                <span>Dashboard-first user experience after login.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary font-bold shrink-0">2.</span>
                <span>Card-based module structure for quick navigation.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary font-bold shrink-0">3.</span>
                <span>Theme support and responsive layout for mobile and desktop.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary font-bold shrink-0">4.</span>
                <span>Focus on practical outcomes: consistency, skill growth, placement.</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="showcase" className="mt-12 sm:mt-16 md:mt-20 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-bold">Live Module Showcase</h2>
              <p className="text-sm text-muted-foreground">Each card opens the module through secure login redirect.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {liveModules.map((moduleItem, idx) => {
              const Icon = moduleItem.icon;
              return (
                <Link key={moduleItem.id} to={toLoginRedirect(moduleItem.route)} className="group block list-item-animate" style={{animationDelay: `${idx * 0.08}s`}}>
                  <Card className="card-interactive h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-start justify-between gap-2 text-base">
                        <span className="flex items-start gap-3 min-w-0 flex-1">
                          <span className="mt-0.5 rounded-lg bg-primary/15 p-2 text-primary shrink-0 group-hover:animate-float transition-all duration-300">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="truncate">{moduleItem.title}</span>
                        </span>
                        <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary shrink-0">
                          LIVE
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">{moduleItem.description}</p>
                      <div className="inline-flex rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                        {moduleItem.category}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="workflow" className="mt-12 sm:mt-16 md:mt-20 grid gap-6 lg:grid-cols-2">
          <Card className="content-panel animate-fade-in-left" style={{animationDelay: '0.2s'}}>
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-lg">User Journey (Current)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {quickFlow.map((item, idx) => (
                <div key={item} className="flex items-start gap-3 group list-item-animate" style={{animationDelay: `${idx * 0.1}s`}}>
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary group-hover:text-primary/80 group-hover:animate-bounce-gentle transition-colors" />
                  <span className="text-sm leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card id="highlights" className="content-panel animate-fade-in-right" style={{animationDelay: '0.2s'}}>
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-lg">Product Highlights</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 pt-5">
              {highlights.map((highlight, idx) => (
                <div key={highlight.title} className="rounded-lg border border-primary/20 bg-card/80 backdrop-blur-sm p-4 transition-all duration-300 hover:border-primary/40 hover:shadow-md hover:bg-card/90 list-item-animate" style={{animationDelay: `${idx * 0.1}s`}}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{highlight.title}</p>
                  <p className="mt-2.5 text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{highlight.value}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{highlight.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

