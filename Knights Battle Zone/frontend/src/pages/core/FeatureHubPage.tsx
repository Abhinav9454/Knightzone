import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, LayoutGrid, Lock, Search, Sidebar, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { APP_PAGE_REGISTRY, type AppPageCategory, type AppPageDefinition } from "@/config/page-registry";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminRole } from "@/lib/auth-role";

const CATEGORY_ORDER: AppPageCategory[] = ["Core", "Coding", "Career", "Community", "Placement", "Support", "Admin"];

const CATEGORY_DESCRIPTION: Record<AppPageCategory, string> = {
  Core: "Primary workspace pages used daily by every user.",
  Coding: "Competitive coding, analytics, and performance modules.",
  Career: "Placement and interview readiness workflows.",
  Community: "Collaboration, engagement, and peer ecosystem.",
  Placement: "Role-specific placement operations and dashboards.",
  Support: "Documentation, policy, and support channels.",
  Admin: "Governance, moderation, and system control pages.",
};

export default function FeatureHubPage() {
  const location = useLocation();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const isSimpleContext = location.pathname.startsWith("/simple");
  const canViewAdminPages = isAdminRole(user?.role);

  const toScopedPath = (href: string) => (isSimpleContext ? `/simple${href}` : href);

  const visiblePages = useMemo(
    () =>
      APP_PAGE_REGISTRY.filter((item) => {
        if (item.access === "admin" && !canViewAdminPages) return false;
        return true;
      }),
    [canViewAdminPages],
  );

  const query = search.trim().toLowerCase();
  const filteredPages = useMemo(
    () =>
      visiblePages.filter((item) => {
        if (!query) return true;
        return (
          item.label.toLowerCase().includes(query) ||
          item.summary.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      }),
    [query, visiblePages],
  );

  const quickLaunchIds = ["dashboard", "tracker", "resume-builder", "contests"];
  const quickLaunchPages = quickLaunchIds
    .map((id) => filteredPages.find((page) => page.id === id))
    .filter((page): page is AppPageDefinition => Boolean(page));

  const totalPages = visiblePages.length;
  const sidebarPages = visiblePages.filter((page) => page.inSidebar).length;
  const adminPages = visiblePages.filter((page) => page.access === "admin").length;
  const visibleCategories = new Set(visiblePages.map((page) => page.category)).size;

  return (
    <div className="space-y-6">
      <section className="dashboard-hero rounded-2xl border border-border/75 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <span className="hero-chip">
              <Sparkles className="h-3.5 w-3.5" />
              Full Version Navigation
            </span>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">Feature Hub</h1>
            <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
              All application modules are organized with professional categories, direct launch links, and filtered discovery.
            </p>
          </div>
          <div className="w-full max-w-sm">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search modules, pages, or categories"
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="metric-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Visible Modules</p>
            <p className="mt-1 text-2xl font-bold">{totalPages}</p>
          </article>
          <article className="metric-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Sidebar Routes</p>
            <p className="mt-1 text-2xl font-bold">{sidebarPages}</p>
          </article>
          <article className="metric-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Categories</p>
            <p className="mt-1 text-2xl font-bold">{visibleCategories}</p>
          </article>
          <article className="metric-card rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Admin-Only Pages</p>
            <p className="mt-1 text-2xl font-bold">{adminPages}</p>
          </article>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Quick Launch</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickLaunchPages.map((page) => {
            const Icon = page.icon;
            return (
              <Link
                key={page.id}
                to={toScopedPath(page.href)}
                className="group rounded-xl border border-border/75 bg-card/80 p-4 transition-all hover:border-primary/45 hover:bg-card"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <p className="text-sm font-semibold">{page.label}</p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{page.summary}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {CATEGORY_ORDER.map((category) => {
        const items = filteredPages.filter((item) => item.category === category);
        if (items.length === 0) return null;

        return (
          <section key={category} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">{category}</h2>
                <p className="text-xs text-muted-foreground">{CATEGORY_DESCRIPTION[category]}</p>
              </div>
              <Badge variant="outline">{items.length} pages</Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    to={toScopedPath(item.href)}
                    className="group rounded-xl border border-border/75 bg-card/80 p-4 transition-all hover:border-primary/50 hover:bg-card"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-primary/10 p-2 text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-semibold leading-tight">{item.label}</p>
                          <p className="font-mono text-[11px] text-primary">{toScopedPath(item.href)}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>

                    <p className="text-sm text-muted-foreground">{item.summary}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                      {item.inSidebar ? (
                        <Badge variant="secondary" className="text-[10px]">
                          <Sidebar className="mr-1 h-3 w-3" />
                          Sidebar
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Direct Route</Badge>
                      )}
                      {item.access === "admin" && (
                        <Badge variant="destructive" className="text-[10px]">
                          <Lock className="mr-1 h-3 w-3" />
                          Admin
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
