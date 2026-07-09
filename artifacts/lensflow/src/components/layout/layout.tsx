import { Link, useLocation } from "wouter";
import { LayoutDashboard, Webhook, Plus, LogOut, Settings, Video, ArrowUpLeft, Sparkles, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetJobStats } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: stats } = useGetJobStats();
  const runningCount = (stats?.processing ?? 0) + (stats?.queued ?? 0);

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, badge: null },
    { href: "/jobs", label: "My Videos", icon: Video, badge: runningCount > 0 ? runningCount : null },
    { href: "/mia", label: "Mia", icon: Sparkles, badge: null },
    { href: "/billing", label: "Billing", icon: CreditCard, badge: null },
    { href: "/webhooks", label: "Webhooks", icon: Webhook, badge: null },
    { href: "/settings", label: "Settings", icon: Settings, badge: null },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Sidebar */}
      <aside className="w-64 flex-col hidden md:flex border-r border-border bg-card/50">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <span className="text-sm font-semibold tracking-wide text-foreground/60 uppercase select-none">LensFlow</span>
        </div>

        <div className="flex-1 py-6 px-4 flex flex-col gap-2">
          <Link href="/jobs/new" className="mb-6 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-sm font-medium transition-colors font-mono text-sm uppercase">
            <Plus className="w-4 h-4" /> New Pipeline
          </Link>

          <nav className="flex flex-col gap-1">
            <div className="text-xs font-mono text-muted-foreground px-2 mb-2 uppercase tracking-wider">Menu</div>
            {navItems.map((item) => {
              const isActive = item.href === "/"
              ? location === "/"
              : location === item.href || location.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors relative",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full" />
                  )}
                  <item.icon className="w-4 h-4" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge !== null && (
                    <span className="text-[10px] font-mono bg-primary/15 text-primary border border-primary/25 px-1.5 py-0.5 rounded-full leading-none animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="px-4 pb-3">
          <a
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <ArrowUpLeft className="w-3.5 h-3.5" />
            <span>lensflow.com.au</span>
          </a>
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="" className="w-8 h-8 rounded border border-border object-cover" />
            ) : (
              <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-xs font-mono border border-border text-primary font-bold">
                {(user?.firstName?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
              </div>
            )}
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs font-medium truncate">{user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : (user?.email ?? "Agent")}</span>
              <span className="text-[10px] text-muted-foreground font-mono">System Active</span>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
          <span className="text-sm font-semibold tracking-wide text-foreground/60 uppercase select-none">LensFlow</span>
          <Link
            href="/jobs/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-mono font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New
          </Link>
        </header>
        <div className="flex-1 p-4 md:p-6 lg:p-10 overflow-auto pb-20 md:pb-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex">
            {[
              { href: "/", label: "Dashboard", icon: LayoutDashboard },
              { href: "/jobs", label: "Videos", icon: Video },
              { href: "/mia", label: "Mia", icon: Sparkles },
              { href: "/billing", label: "Billing", icon: CreditCard },
              { href: "/settings", label: "Settings", icon: Settings },
            ].map((item) => {
              const isActive = item.href === "/" ? location === "/" : location === item.href || location.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-mono uppercase tracking-wider transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
}
