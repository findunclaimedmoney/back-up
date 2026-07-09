import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteNav, siteHref } from "@/components/SiteChrome";
import { useSubscription } from "@/hooks/use-subscription";

export default function Login() {
  const [, navigate] = useLocation();
  const { activate, loading } = useSubscription();
  const [email, setEmail] = useState(() => localStorage.getItem("companion_email") ?? "");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    await activate(nextEmail);
    navigate("/account");
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 md:grid-cols-[0.9fr_1.1fr] md:items-center">
        <section className="space-y-5">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary/70">Customer sign in</p>
          <h1 className="text-4xl font-light leading-tight md:text-6xl">Sign in to your GLIMR account.</h1>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">
            Your account area is where customers expect to see plan status, credits, balance, feature access,
            settings, support, and secure billing links.
          </p>
          <div className="rounded-lg border border-primary/20 bg-primary/10 p-5 text-sm leading-6 text-muted-foreground">
            <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
            Payment card details are managed by the secure billing provider, not stored or shown directly inside
            GLIMR.
          </div>
        </section>

        <section className="rounded-lg border border-white/8 bg-card p-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <h2 className="text-2xl font-light">Log in or create account</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Enter the email used for your GLIMR subscription. New users can continue as a free account.
              </p>
            </div>
            <label className="block space-y-2">
              <span className="text-sm text-muted-foreground">Email address</span>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-secondary/50 px-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" disabled={loading}>
              Continue to account
              <ArrowRight className="h-4 w-4" />
            </Button>
            <div className="grid gap-2 text-center text-sm text-muted-foreground">
              <a className="hover:text-foreground" href={siteHref("/pricing")}>
                View plans before signing in
              </a>
              <a className="hover:text-foreground" href="mailto:hello@glimr.com.au">
                Need help accessing your account?
              </a>
            </div>
          </form>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
