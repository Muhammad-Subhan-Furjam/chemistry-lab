import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { FlaskConical, LayoutDashboard, Beaker, Wrench, History, Users, LogOut, UserPlus, ScrollText, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExpiryNotifications } from "@/lib/notifications";

const baseNav = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/chemicals", label: "Chemicals", icon: Beaker },
  { to: "/equipment", label: "Equipment", icon: Wrench },
  { to: "/usage", label: "Logs", icon: History },
];

const extraNav = [
  { to: "/notifications", label: "Alerts", icon: Bell },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, signOut, isAdmin } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [user, loading, nav]);

  useExpiryNotifications(user?.id);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const items = isAdmin
    ? [
        ...baseNav,
        { to: "/admin", label: "Admin", icon: Users },
        { to: "/invite", label: "Invite", icon: UserPlus },
        { to: "/audit", label: "Audit", icon: ScrollText },
        ...extraNav,
      ]
    : [...baseNav, ...extraNav];
  // Bottom nav: 5 core tabs on Android (Dashboard, Chemicals, Equipment, Usage, Admin or Alerts).
  const bottomItems = isAdmin
    ? [...baseNav, { to: "/admin", label: "Admin", icon: Users }]
    : [...baseNav, { to: "/notifications", label: "Alerts", icon: Bell }];
  const activeItem = items.find((it) => loc.pathname.startsWith(it.to));

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6 font-semibold">
          <FlaskConical className="h-5 w-5 text-sidebar-primary" />
          ChemTrack
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items.map((it) => {
            const active = loc.pathname.startsWith(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 px-2 text-xs text-sidebar-foreground/60 truncate">{user.email}</div>
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent" onClick={async () => { await signOut(); nav({ to: "/" }); }}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <main className="flex w-full flex-1 flex-col overflow-x-hidden">
        {/* Mobile top app bar */}
        <header
          className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-2 border-b bg-sidebar text-sidebar-foreground px-4 shadow-sm"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.625rem)", paddingBottom: "0.625rem" }}
        >
          <div className="flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-sidebar-primary" />
            <div>
              <div className="text-base font-semibold leading-tight">{activeItem?.label ?? "ChemTrack"}</div>
              <div className="text-[11px] leading-tight text-sidebar-foreground/60 truncate max-w-[180px]">{user.email}</div>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-11 w-11 text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={async () => { await signOut(); nav({ to: "/" }); }}
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        {/* Page content — bottom padding leaves room for the mobile bottom nav */}
        <div className="flex-1 p-4 pb-28 sm:p-6 md:p-8 md:pb-8">{children}</div>

        {/* Mobile bottom navigation */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${bottomItems.length}, minmax(0,1fr))` }}>
            {bottomItems.map((it) => {
              const active = loc.pathname.startsWith(it.to);
              return (
                <li key={it.to}>
                  <Link
                    to={it.to}
                    className={cn(
                      "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition active:scale-95",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <span className={cn(
                      "flex h-8 w-12 items-center justify-center rounded-full transition",
                      active && "bg-primary/15"
                    )}>
                      <it.icon className="h-5 w-5" />
                    </span>
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </main>
    </div>
  );
}
