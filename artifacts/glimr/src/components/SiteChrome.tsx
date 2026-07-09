import { Bot, Sparkles } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function siteHref(path: string) {
  if (path === "/") return basePath || "/";
  return `${basePath}${path}`;
}

export function SiteHeader() {
  return (
    <header className="flex w-full max-w-5xl items-center justify-between gap-4">
      <a href={siteHref("/")} className="flex items-center gap-3" aria-label="GLIMR home">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </span>
        <span className="text-xl font-semibold tracking-wide">GLIMR</span>
      </a>
      <nav className="flex items-center gap-2">
        <a className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground" href={siteHref("/pricing")}>
          Pricing
        </a>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="w-full max-w-5xl px-2 py-8 text-center text-xs text-muted-foreground">
      <div className="flex items-center justify-center gap-2">
        <Bot className="h-3.5 w-3.5 text-primary" />
        <span>GLIMR is an AI companion experience, not a substitute for professional care.</span>
      </div>
      <a className="mt-2 inline-block hover:text-foreground" href="mailto:hello@glimr.com.au">
        hello@glimr.com.au
      </a>
    </footer>
  );
}
