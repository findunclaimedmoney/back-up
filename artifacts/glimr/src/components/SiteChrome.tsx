import { Bot, Crown, Sparkles, UserCircle } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function siteHref(path: string) {
  if (path === "/") return basePath || "/";
  return `${basePath}${path}`;
}

export function SiteNav() {
  const { isAuthenticated } = useAuth();
  const signedIn = isAuthenticated;
  const navItems = [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Human", href: "/human-session" },
    { label: "VIP", href: "/vip-lounge" },
    { label: "Legal", href: "/legal" },
  ];

  return (
    <header className="w-full border-b border-white/8 bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <a href={siteHref("/")} className="flex items-center gap-3" aria-label="GLIMR home">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </span>
          <span className="text-xl font-semibold tracking-wide">GLIMR</span>
        </a>
        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm text-muted-foreground">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={siteHref(item.href)}
              className="rounded-lg px-3 py-2 transition-colors hover:bg-secondary hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
          <a
            href={siteHref(signedIn ? "/account" : "/login")}
            className="ml-1 inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-foreground transition-colors hover:bg-primary/20"
          >
            <UserCircle className="h-4 w-4 text-primary" />
            {signedIn ? "Account" : "Sign in"}
          </a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-white/8 px-5 py-10 text-sm text-muted-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-foreground">
            <Bot className="h-4 w-4 text-primary" />
            <span className="font-medium">GLIMR is an AI companion experience.</span>
          </div>
          <p className="max-w-xl leading-6">
            It is designed for conversation, memory, voice, video, and personal companionship. It is not
            emergency support, medical care, legal advice, or a replacement for professional help.
          </p>
        </div>
        <div className="space-y-2">
          <p className="font-medium text-foreground">Support</p>
          <a className="block hover:text-foreground" href="mailto:hello@glimr.com.au">
            hello@glimr.com.au
          </a>
          <a className="block hover:text-foreground" href={siteHref("/legal")}>
            Privacy and terms
          </a>
        </div>
        <div className="space-y-2">
          <p className="flex items-center gap-2 font-medium text-foreground">
            <Crown className="h-4 w-4 text-primary" />
            Launch note
          </p>
          <p className="leading-6">
            Mobile apps are coming soon. Use the web app or waitlist until live store listings are available.
          </p>
        </div>
      </div>
    </footer>
  );
}
