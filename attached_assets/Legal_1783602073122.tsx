import { FileText, LockKeyhole, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteNav } from "@/components/SiteChrome";

const privacyItems = [
  "Account details such as email address and subscription status.",
  "Conversation messages, companion memories, usage activity, and feature settings.",
  "Uploaded images used to create custom companions or photo experiences.",
  "Payment status from payment providers. Full card details are handled by the secure billing provider.",
];

const useItems = [
  "Provide chat, voice, video, memory, custom companion, and activity features.",
  "Operate subscriptions, credits, support, safety systems, and abuse prevention.",
  "Improve reliability and companion quality, subject to the privacy commitments made at launch.",
  "Respond to deletion, export, privacy, billing, and support requests.",
];

export default function Legal() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto w-full max-w-5xl px-5 py-12">
        <div className="mb-10 space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary/70">Privacy and terms</p>
          <h1 className="text-4xl font-light leading-tight md:text-5xl">Clear rules for a personal product.</h1>
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            GLIMR handles personal conversations, memories, images, and payments. This page explains the
            core policies to understand before signing up.
          </p>
          <p className="text-sm text-muted-foreground">Last updated: July 9, 2026</p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <article className="rounded-lg border border-white/8 bg-card p-5">
            <ShieldCheck className="mb-4 h-5 w-5 text-primary" />
            <h2 className="mb-2 text-lg font-medium">AI disclosure</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Companions are AI-generated experiences. They can feel personal, but they are not human,
              emergency support, therapy, or professional advice.
            </p>
          </article>
          <article className="rounded-lg border border-white/8 bg-card p-5">
            <LockKeyhole className="mb-4 h-5 w-5 text-primary" />
            <h2 className="mb-2 text-lg font-medium">Privacy requests</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Request deletion or export of account data by contacting hello@glimr.com.au.
            </p>
          </article>
          <article className="rounded-lg border border-white/8 bg-card p-5">
            <FileText className="mb-4 h-5 w-5 text-primary" />
            <h2 className="mb-2 text-lg font-medium">Billing clarity</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Subscription pages explain renewal, cancellation, refunds, credits, and plan limits before checkout.
            </p>
          </article>
        </div>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-white/8 bg-card p-6">
            <h2 className="mb-4 text-2xl font-light">Information GLIMR may collect</h2>
            <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
              {privacyItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-white/8 bg-card p-6">
            <h2 className="mb-4 text-2xl font-light">How GLIMR may use it</h2>
            <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
              {useItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-10 rounded-lg border border-primary/20 bg-primary/10 p-6">
          <h2 className="mb-3 text-2xl font-light">Safety boundaries</h2>
          <div className="grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-2">
            <p>
              GLIMR is not for emergencies, crisis response, medical diagnosis, legal advice,
              or decisions where professional support is required.
            </p>
            <p>
              Custom companion and photo-upload features require images the user has the right and consent to
              use. Age and intimacy rules are stated before paid access.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
