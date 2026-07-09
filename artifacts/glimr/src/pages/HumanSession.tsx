import { useMemo, useState } from "react";
import { CalendarClock, CreditCard, ScrollText, ShieldCheck, UserRoundCheck, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteNav, siteHref } from "@/components/SiteChrome";

const defaultScript = `Open warmly and introduce yourself.
Confirm the customer's name and what they need today.
Keep the conversation calm, respectful, and human.
Offer practical next steps without pretending to be medical, legal, or crisis support.
If they need urgent help, direct them to local emergency or crisis services.
Close by summarising what was agreed and where they can find account support.`;

const packages = [
  { name: "Human check-in", duration: "15 min", price: "$20", detail: "Quick help, reassurance, or account guidance." },
  { name: "Guided session", duration: "30 min", price: "$39", detail: "A longer live conversation with guided notes." },
  { name: "Deep support", duration: "60 min", price: "$75", detail: "Premium human time for higher-value customers." },
];

const humanSteps = [
  {
    title: "Customer pays",
    body: "Charge the same or higher rate than AI video credits for scarce human time.",
    icon: CreditCard,
  },
  {
    title: "Human answers",
    body: "A real person joins by video, audio, or chat depending on the offer.",
    icon: UserRoundCheck,
  },
  {
    title: "Prompted delivery",
    body: "The teleprompter guides the human through safe, consistent talking points.",
    icon: ScrollText,
  },
  {
    title: "Clear boundaries",
    body: "Disclose limits and escalate urgent situations to proper support.",
    icon: ShieldCheck,
  },
];

export default function HumanSession() {
  const [script, setScript] = useState(defaultScript);
  const [fontSize, setFontSize] = useState("28");
  const [speed, setSpeed] = useState("1.0x");

  const lines = useMemo(
    () => script.split(/\n+/).map((line) => line.trim()).filter(Boolean),
    [script],
  );

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <SiteNav />
      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary/70">
              Human sessions
            </p>
            <h1 className="text-4xl font-light leading-tight md:text-6xl">
              Offer a paid human conversation when AI is not enough.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              GLIMR can keep AI companions as the always-on product and add a premium human option for
              customers who want to speak with a real person. The human operator uses a Lensflow-style
              teleprompter to stay consistent, safe, and on brand.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <a href="mailto:hello@glimr.com.au?subject=GLIMR%20human%20session">Request human session</a>
              </Button>
              <Button asChild variant="outline">
                <a href={siteHref("/account")}>View account</a>
              </Button>
            </div>
          </div>

          <section className="rounded-lg border border-white/8 bg-card p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ScrollText className="h-4 w-4 text-primary" />
                Human operator teleprompter
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <select
                  value={fontSize}
                  onChange={(event) => setFontSize(event.target.value)}
                  className="rounded-lg border border-white/10 bg-secondary px-2 py-1"
                  aria-label="Teleprompter font size"
                >
                  <option value="22">Small</option>
                  <option value="28">Medium</option>
                  <option value="34">Large</option>
                  <option value="42">Extra large</option>
                </select>
                <select
                  value={speed}
                  onChange={(event) => setSpeed(event.target.value)}
                  className="rounded-lg border border-white/10 bg-secondary px-2 py-1"
                  aria-label="Teleprompter scroll speed"
                >
                  <option>0.5x</option>
                  <option>1.0x</option>
                  <option>1.5x</option>
                  <option>2.0x</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[0.85fr_1.15fr]">
              <textarea
                value={script}
                onChange={(event) => setScript(event.target.value)}
                className="min-h-72 resize-none rounded-lg border border-white/10 bg-secondary/50 p-4 text-sm leading-6 outline-none focus:border-primary/50"
                aria-label="Human session script"
              />
              <div className="relative min-h-72 overflow-hidden rounded-lg border border-primary/15 bg-black p-6">
                <div className="absolute left-0 right-0 top-0 h-14 bg-gradient-to-b from-black to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-black to-transparent" />
                <div className="space-y-5">
                  {lines.map((line, index) => (
                    <p
                      key={`${line}-${index}`}
                      className={index === 1 ? "text-primary" : index < 1 ? "text-white/35" : "text-white/70"}
                      style={{ fontSize: `${fontSize}px`, lineHeight: 1.45 }}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </section>

        <section className="border-y border-white/8 bg-secondary/20 px-5 py-12">
          <div className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-4">
            {humanSteps.map((step) => {
              const Icon = step.icon;
              return (
              <article key={step.title} className="rounded-lg border border-white/8 bg-card p-5">
                <Icon className="mb-4 h-5 w-5 text-primary" />
                <h2 className="mb-2 font-medium">{step.title}</h2>
                <p className="text-sm leading-6 text-muted-foreground">{step.body}</p>
              </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-14">
          <div className="mb-6 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            <h2 className="text-3xl font-light">Premium human pricing</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {packages.map((item) => (
              <article key={item.name} className="rounded-lg border border-white/8 bg-card p-6">
                <p className="text-sm text-muted-foreground">{item.duration}</p>
                <h3 className="mt-2 text-2xl font-light">{item.name}</h3>
                <p className="mt-3 text-4xl font-light">{item.price}</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                <Button asChild className="mt-5 w-full" variant="outline">
                  <a href="mailto:hello@glimr.com.au?subject=Book%20a%20GLIMR%20human%20session">
                    Book request
                  </a>
                </Button>
              </article>
            ))}
          </div>
          <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
            <Video className="mt-0.5 h-4 w-4 text-primary" />
            Next connection points: checkout, scheduling, operator assignment, and the live teleprompter room.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
