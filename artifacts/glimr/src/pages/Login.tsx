import { LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteNav, siteHref } from "@/components/SiteChrome";
import { useAuth } from "@workspace/replit-auth-web";

export default function Login() {
  const { login, isLoading } = useAuth();

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
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-light">Log in or create account</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                GLIMR uses secure Replit sign-in. New users are automatically set up with a free account.
              </p>
            </div>
            <Button className="w-full" disabled={isLoading} onClick={login}>
              <LogIn className="h-4 w-4" />
              Continue with Replit
            </Button>
            <div className="grid gap-2 text-center text-sm text-muted-foreground">
              <a className="hover:text-foreground" href={siteHref("/pricing")}>
                View plans before signing in
              </a>
              <a className="hover:text-foreground" href="mailto:hello@glimr.com.au">
                Need help accessing your account?
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
