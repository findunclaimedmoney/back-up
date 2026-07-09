import {
  Brain,
  Camera,
  Gamepad2,
  MessageCircle,
  Mic,
  ShieldCheck,
  UserRoundPlus,
  UserRoundCheck,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteNav, siteHref } from "@/components/SiteChrome";

const features = [
  {
    icon: MessageCircle,
    title: "Text chat",
    body: "Start with natural conversation that feels personal, warm, and grounded in the companion you choose.",
  },
  {
    icon: Brain,
    title: "Memory",
    body: "GLIMR keeps track of meaningful details so each session can build on what came before.",
  },
  {
    icon: Mic,
    title: "Voice replies",
    body: "Upgrade for spoken responses when you want your companion to feel closer than text.",
  },
  {
    icon: Video,
    title: "Video moments",
    body: "Generate short video replies and richer presence on higher tiers when the feature is configured.",
  },
  {
    icon: Camera,
    title: "Photo experiences",
    body: "Use custom companion photos, outfits, and photobooth-style moments where your plan allows it.",
  },
  {
    icon: Gamepad2,
    title: "Games and activities",
    body: "Play lightweight activities like chess, tic tac toe, photo booth, and conversation games together.",
  },
  {
    icon: UserRoundPlus,
    title: "Custom companion",
    body: "Create a companion from a photo with clear consent expectations and plan-based access.",
  },
  {
    icon: UserRoundCheck,
    title: "Human sessions",
    body: "Offer a premium paid path to speak with a real person guided by a Lensflow-style teleprompter.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy controls",
    body: "Find privacy, account deletion, support, and AI disclosure information before you sign up.",
  },
];

const steps = [
  "Choose Mia, Alex, or create a custom companion on an eligible plan.",
  "Chat naturally by text, then add voice, activities, outfits, or video when you want more presence.",
  "Let memory build over time, with clear privacy controls and support if you need to delete your data.",
];

export default function Features() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <SiteNav />
      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="space-y-6">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary/70">GLIMR features</p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-light leading-tight md:text-6xl">
                A companion that can talk, remember, and show up again.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                GLIMR combines emotionally aware chat, memory, voice, video, custom companions, and small
                shared activities into one private companion experience.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <a href={siteHref("/")}>Choose a companion</a>
              </Button>
              <Button asChild variant="outline">
                <a href={siteHref("/pricing")}>See pricing</a>
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-white/8 bg-card p-5">
            <div className="space-y-4 rounded-lg border border-primary/15 bg-primary/5 p-5">
              <p className="text-sm text-muted-foreground">Built around the customer</p>
              <p className="text-2xl font-light leading-snug">
                Know what happens before you sign in, upgrade, or start a conversation.
              </p>
              <p className="leading-7 text-muted-foreground">
                GLIMR explains what is included, what is plan-gated, and how memory, voice, video, human
                sessions, and safety fit together.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-white/8 bg-secondary/20 px-5 py-12">
          <div className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="rounded-lg border border-white/8 bg-card p-5">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  {index + 1}
                </div>
                <p className="leading-7 text-muted-foreground">{step}</p>
              </div>
            ))}
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-5">
              <p className="mb-2 font-medium">Trust note</p>
              <p className="leading-7 text-muted-foreground">
                Companions are AI. Support and safety information are available before checkout.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16">
          <div className="mb-8 max-w-2xl space-y-3">
            <h2 className="text-3xl font-light">Feature overview</h2>
            <p className="leading-7 text-muted-foreground">
              Explore the core GLIMR experience and the premium add-ons available from your account.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded-lg border border-white/8 bg-card p-5">
                  <Icon className="mb-4 h-5 w-5 text-primary" />
                  <h3 className="mb-2 text-lg font-medium">{feature.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{feature.body}</p>
                </article>
              );
            })}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
