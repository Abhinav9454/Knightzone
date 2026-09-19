import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
  memo,
  type ButtonHTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import {
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { SIDEBAR_MENU_GROUPS, type SidebarMenuItem } from "@/config/sidebar-menu";

type QuickActionId = "new-challenge" | "create-club" | "post-job" | "start-duel";

interface QuickAction {
  id: QuickActionId;
  label: string;
}

interface SidebarProps {
  children?: ReactNode;
  activeItemId?: string;
  onMenuItemClick?: (item: SidebarMenuItem) => void;
  onQuickActionClick?: (action: QuickAction) => void;
  onProfileClick?: () => void;
  userName?: string;
  userRole?: string;
  avatarUrl?: string;
  brandName?: string;
  brandInitial?: string;
  footerSlot?: ReactNode;
  contentClassName?: string;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface RippleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const RIPPLE_TIMEOUT = 500;

const RippleButton = memo(
  forwardRef<HTMLButtonElement, RippleButtonProps>(function RippleButton(
    { className, children, onClick, ...props },
    ref,
  ) {
    const [ripples, setRipples] = useState<Ripple[]>([]);

    const createRipple = useCallback((event: ReactMouseEvent<HTMLButtonElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;
      const id = Date.now() + Math.random();

      setRipples((prev) => [...prev, { id, x, y, size }]);
      window.setTimeout(() => {
        setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
      }, RIPPLE_TIMEOUT);
    }, []);

    const handleClick = useCallback((event: ReactMouseEvent<HTMLButtonElement>) => {
      createRipple(event);
      onClick?.(event);
    }, [createRipple, onClick]);

    return (
      <button ref={ref} {...props} onClick={handleClick} className={cx("relative overflow-hidden", className)}>
        {children}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="pointer-events-none absolute rounded-full bg-primary/30 animate-ping"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
            }}
          />
        ))}
      </button>
    );
  })
);

const Sidebar = memo(function Sidebar({
  children,
  activeItemId = "dashboard",
  onMenuItemClick,
  onProfileClick,
  userName = "Aarav Singh",
  userRole = "Campus Ambassador",
  avatarUrl,
  brandName = "Knights Battle Zone",
  brandInitial = "U",
  footerSlot,
  contentClassName = "p-4 md:p-6",
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = useMemo(
    () =>
      userName
        .split(" ")
        .map((chunk) => chunk[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [userName],
  );

  const handleEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setMobileOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [handleEscape]);

  const revealTextClass = useMemo(() => cx(
    "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
    mobileOpen ? "max-w-[11rem] opacity-100" : "max-w-0 opacity-0",
    "md:max-w-[11rem] md:opacity-100",
  ), [mobileOpen]);

  const handleItemClick = useCallback((item: SidebarMenuItem) => {
    onMenuItemClick?.(item);
    setMobileOpen(false);
  }, [onMenuItemClick]);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-transparent text-foreground">
      <RippleButton
        type="button"
        data-variant="unstyled"
        className="fixed left-4 top-4 z-[70] grid h-10 w-10 place-items-center rounded-xl border border-border/80 bg-card/95 text-foreground shadow-lg shadow-black/10 backdrop-blur md:hidden"
        onClick={() => {
          setMobileOpen((prev) => !prev);
        }}
        aria-label={mobileOpen ? "Close sidebar" : "Open sidebar"}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </RippleButton>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-[1px] md:hidden"
          onClick={() => {
            setMobileOpen(false);
          }}
          aria-label="Close sidebar overlay"
        />
      )}

      <aside
        className={cx(
          "sidebar-shell group/sidebar peer fixed left-0 top-0 z-50 flex h-full w-72 flex-col overflow-visible border-r border-sidebar-border/80 bg-sidebar/92 text-sidebar-foreground shadow-[0_24px_60px_hsl(var(--foreground)/0.12)] backdrop-blur-xl transition-all duration-300 ease-out md:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="pointer-events-none absolute right-0 top-0 h-full w-[2px] bg-gradient-to-b from-primary/90 via-primary/45 to-accent/90 opacity-80" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,hsl(var(--primary)/0.12),transparent)]" />

        <div className="relative z-10 border-b border-sidebar-border/80 px-3 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
                <BrandLogo
                  size={40}
                  className="h-10 w-10 shrink-0 rounded-2xl shadow-md shadow-primary/25"
                />
              <div className={cx("min-w-0", revealTextClass)}>
                <span className="block text-base font-semibold tracking-tight text-sidebar-foreground">
                  {brandName}
                </span>
                <span className="block text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  Coding OS
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-xl text-sidebar-foreground/80 hover:bg-sidebar-accent md:hidden"
                onClick={() => setMobileOpen(false)}
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <nav
          className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden py-2 pl-2 pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Sidebar navigation"
        >
          <div className="space-y-3">
            {SIDEBAR_MENU_GROUPS.map((group) => (
              <section key={group.category} className="space-y-1.5">
                <p
                  className={cx(
                    "px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground",
                    revealTextClass,
                  )}
                >
                  {group.category}
                </p>
                <ul className="m-0 space-y-1 p-0">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = activeItemId === item.id;

                    return (
                      <li key={item.id} className="group/item relative min-w-0">
                        <RippleButton
                          type="button"
                          data-variant="unstyled"
                          title={item.label}
                          className={cx(
                            "sidebar-item flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-2xl border border-border/60 border-l-4 bg-card/70 p-2.5 text-left transition-all duration-200",
                            active
                              ? "sidebar-item-active border-l-primary border-primary/40 bg-primary/12 text-primary shadow-sm shadow-primary/15"
                              : "border-l-transparent text-sidebar-foreground/90 hover:translate-x-0.5 hover:border-border/80 hover:bg-muted/80 hover:text-foreground hover:shadow-sm",
                          )}
                          onClick={() => handleItemClick(item)}
                          aria-current={active ? "page" : undefined}
                        >
                          <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover/item:scale-110" />

                          <span className={cx(revealTextClass, "font-medium tracking-tight")}>
                            {item.label}
                          </span>

                          <ChevronRight
                            className={cx(
                              "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-all duration-300",
                              mobileOpen ? "opacity-100" : "opacity-0 md:group-hover/sidebar:opacity-100",
                            )}
                          />
                        </RippleButton>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </nav>

        <div className="relative z-10 border-t border-sidebar-border/80 p-3">
          {footerSlot && (
            <div className="mb-2 flex items-center justify-start gap-2 rounded-lg bg-sidebar-accent/80 p-1.5">
              {footerSlot}
            </div>
          )}
          <RippleButton
            type="button"
            data-variant="unstyled"
            onClick={onProfileClick}
            className="flex w-full items-center gap-3 rounded-2xl border border-transparent px-2 py-2 transition-colors hover:border-sidebar-border hover:bg-sidebar-accent"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="h-9 w-9 shrink-0 rounded-full border border-sidebar-border object-cover" />
            ) : (
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {initials}
              </div>
            )}
            <div className={cx("min-w-0", revealTextClass)}>
              <p className="truncate text-sm font-semibold text-sidebar-foreground">{userName}</p>
              <p className="truncate text-xs text-muted-foreground">{userRole}</p>
            </div>
          </RippleButton>
        </div>
      </aside>

      <main className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden transition-[margin,width] duration-300 ease-out md:ml-64 md:w-[calc(100%-16rem)]">
        <div className={cx("w-full min-w-0 max-w-full", contentClassName)}>
          {children ?? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-card p-6 text-sm text-muted-foreground shadow-sm">
              Main content area
            </div>
          )}
        </div>
      </main>
    </div>
  );
});

export default Sidebar;

