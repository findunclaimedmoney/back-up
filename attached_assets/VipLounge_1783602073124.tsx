import { Crown, Gem, Mail, ShieldCheck, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteNav, siteHref } from "@/components/SiteChrome";

const benefits = [
  {
    icon: Video,
    title: "Higher presence limits",
    body: "Designed for people who want more voice and video time without constantly thinking about usage.",
  },
  {
    icon: Gem,
    title: "Custom companion support",
    body: "VIP can be positioned as a concierge tier for custom companions, clone-style setup, and guided onboarding.",
  },
  {
    icon: ShieldCheck,
    title: "Priority help",
    body: "Give VIP members a clear support path for billing, privacy, custom setup, and product issues.",
  },
];

export default function VipLounge() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <SiteNav />
      <main>
        <section className="mx-auto w-full max-w-6xl px-5 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
              <Crown className="h-7 w-7 text-primary" />
            </div>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.25em] text-primary/70">
              Invitation only
            </p>
            <h1 className="text-4xl font-light leading-tight md:text-6xl">VIP Lounge</h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Premium access for customers who want the highest-touch GLIMR experience, deeper setup support,
              and early access to new companion features.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <a href="mailto:hello@glimr.com.au?subject=GLIMR%20VIP%20invitation">
                  <Mail className="mr-2 h-4 w-4" />
                  Request invitation
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={siteHref("/pricing")}>Compare plans</a>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-y border-white/8 bg-secondary/20 px-5 py-12">
          <div className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <article key={benefit.title} className="rounded-lg border border-white/8 bg-card p-6">
                  <Icon className="mb-5 h-6 w-6 text-primary" />
                  <h2 className="mb-3 text-xl font-medium">{benefit.title}</h2>
                  <p className="leading-7 text-muted-foreground">{benefit.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-16 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-light">What VIP includes</h2>
          </div>
          <div className="rounded-lg border border-white/8 bg-card p-6">
            <ul className="space-y-4 leading-7 text-muted-foreground">
              <li>Premium support and guided setup for higher-value customers.</li>
              <li>More room for video time, custom companion help, and early feature access.</li>
              <li>A clear invitation path with a direct support contact.</li>
              <li>Clear age, consent, and privacy expectations for custom likeness features.</li>
            </ul>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
