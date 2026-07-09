import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  CheckCircle2, XCircle, ArrowRight, Coffee, Clock, Zap,
  Star, Crown, Shield, Users, Video, Mic, Sparkles,
  ChevronRight, BarChart3, TrendingDown,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" as const } },
};
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

/* ─── DIY vs LensFlow comparison data ─────────────────────────────────── */
const DIY_COSTS = [
  { item: "Professional videographer (half-day)", diy: "$800 – $1,500", lensflow: "Included" },
  { item: "Copywriter / script writer", diy: "$250 – $600", lensflow: "AI-generated in seconds" },
  { item: "Professional voiceover artist", diy: "$200 – $450", lensflow: "Included (your voice)" },
  { item: "Video editor", diy: "$400 – $900", lensflow: "Automated" },
  { item: "Presenter / on-screen talent", diy: "$300 – $800", lensflow: "Your digital twin" },
  { item: "Studio hire / lighting", diy: "$150 – $400", lensflow: "$0" },
  { item: "Revisions & re-shoots", diy: "$200 – $600+", lensflow: "Unlimited, instant" },
  { item: "Turnaround time", diy: "3 – 7 business days", lensflow: "90 seconds" },
  { item: "Cost per listing video", diy: "$2,100 – $5,250", lensflow: "~$200" },
  { item: "3 videos / month", diy: "$6,300 – $15,750", lensflow: "$599 flat" },
];

/* ─── Feature list ─────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Sparkles,
    title: "Your Own Human-Like Digital Twin",
    desc: "We build a photorealistic avatar that moves, speaks, and presents exactly like you. Trained on a 2-minute clip of yourself — it is you, just always available.",
  },
  {
    icon: Clock,
    title: "90-Second Listing Videos, Every Time",
    desc: "Paste the listing URL. LensFlow writes the script, records your voice, and renders the final video — start to finish before your coffee is ready.",
  },
  {
    icon: Shield,
    title: "Mia — Your Personal Marketing Advisor PA",
    desc: "Mia handles your property searches, drafts social captions, answers client briefs, and schedules your content calendar. A full-time PA without the salary.",
  },
  {
    icon: Video,
    title: "3 Polished Videos Per Month",
    desc: "Three complete, broadcast-quality listing videos included every month. Need more? Add extra projects for $499 each — still a fraction of agency rates.",
  },
  {
    icon: Mic,
    title: "Your Voice, Cloned to Perfection",
    desc: "ElevenLabs voice cloning captures your tone, cadence, and accent. Every video sounds exactly like you — naturally, not robotically.",
  },
  {
    icon: Users,
    title: "REA & Domain Ready",
    desc: "Every video exports in the exact format required by Australia's major property portals. One click to upload — done.",
  },
  {
    icon: Crown,
    title: "Dedicated Concierge Onboarding",
    desc: "A LensFlow specialist personally guides your avatar training, brand setup, and first three videos. White-glove from day one.",
  },
  {
    icon: Star,
    title: "Priority 4K Rendering",
    desc: "Your videos jump the queue. No waiting behind other jobs — 4K output, delivered in 90 seconds flat.",
  },
];

/* ─── Timeline items ───────────────────────────────────────────────────── */
const COFFEE_STEPS = [
  { time: "0:00", label: "You walk into the café", icon: Coffee },
  { time: "0:30", label: "Queue & order your regular", icon: Clock },
  { time: "1:30", label: "LensFlow reads your listing URL", icon: Zap },
  { time: "0:45", label: "AI writes your personalised script", icon: Sparkles },
  { time: "0:30", label: "Your digital twin records the voiceover", icon: Mic },
  { time: "0:30", label: "Video renders in 4K — done", icon: Video },
  { time: "9:00", label: "You're still waiting for your flat white", icon: Coffee },
];

const LENS_STEPS = [
  { time: "0:00", label: "Paste listing URL", done: true },
  { time: "0:30", label: "AI script generated", done: true },
  { time: "1:00", label: "Voice cloned & recorded", done: true },
  { time: "1:30", label: "4K video rendered & ready", done: true },
];

export default function TwinAvatar() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-32 px-6 text-center overflow-hidden">
        {/* ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/8 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px]" />
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative max-w-5xl mx-auto"
        >
          {/* prestige badge */}
          <motion.div variants={fadeUp} className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold tracking-widest uppercase px-5 py-2 rounded-full">
              <Crown className="w-3.5 h-3.5" /> Prestige Package
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-serif text-5xl lg:text-7xl font-bold leading-tight mb-6"
          >
            Meet Your{" "}
            <span className="text-primary italic">Digital Twin.</span>
            <br />
            <span className="text-foreground/80">The Agent Who Never Sleeps.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-4 leading-relaxed"
          >
            Train once. Then let your AI self present every listing — in{" "}
            <span className="text-foreground font-semibold">90 seconds</span>, looking and sounding
            exactly like you, 24 hours a day.
          </motion.p>

          <motion.p variants={fadeUp} className="text-base text-muted-foreground mb-12">
            By the time you pay <span className="text-foreground font-semibold">$6 for a coffee</span> and
            wait 10 minutes — your listing video is already live.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="mailto:prestige@lensflow.com.au?subject=Twin+Avatar+Solution+Enquiry">
              <Button className="rounded-full h-14 px-10 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xl shadow-primary/30">
                Claim Your Twin Avatar <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <Link href="/pricing">
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4">
                Compare all plans
              </button>
            </Link>
          </motion.div>

          {/* price anchor */}
          <motion.div variants={fadeUp} className="mt-12 inline-flex items-baseline gap-1">
            <span className="text-6xl font-bold text-foreground">$599</span>
            <span className="text-2xl text-muted-foreground">/mo</span>
            <span className="ml-4 text-sm text-muted-foreground">
              · 3 videos included · extra projects $499 each
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* ── COFFEE MOMENT ────────────────────────────────────────────────── */}
      <section className="py-24 bg-card border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} className="flex justify-center mb-4">
              <Coffee className="w-10 h-10 text-primary/70" />
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-serif text-4xl lg:text-5xl font-bold mb-4">
              Faster than your morning coffee.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The time it takes to order, pay $6, and wait for a flat white — your listing video
              has already been written, voiced, rendered, and is ready to upload.
            </motion.p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Coffee side */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="rounded-3xl border border-white/5 bg-background p-8"
            >
              <div className="flex items-center gap-3 mb-8">
                <Coffee className="w-6 h-6 text-muted-foreground" />
                <h3 className="font-semibold text-lg text-muted-foreground">Getting a $6 coffee</h3>
              </div>
              <div className="space-y-5">
                {[
                  { t: "0:00", l: "Walk into café, join the queue" },
                  { t: "2:00", l: "Reach the counter, order your flat white" },
                  { t: "2:30", l: "Tap to pay — $6 gone" },
                  { t: "5:00", l: "Stand around waiting, check phone" },
                  { t: "10:00", l: "Flat white for you? — you finally collect it" },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <span className="text-xs font-mono text-muted-foreground/60 pt-0.5 w-10 shrink-0">{s.t}</span>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/30 mt-2 shrink-0" />
                      <span className="text-sm text-muted-foreground">{s.l}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total time</span>
                <span className="font-bold text-foreground">~10 minutes · $6</span>
              </div>
            </motion.div>

            {/* LensFlow side */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="rounded-3xl border border-primary/30 bg-primary/5 p-8"
            >
              <div className="flex items-center gap-3 mb-8">
                <Zap className="w-6 h-6 text-primary" />
                <h3 className="font-semibold text-lg text-primary">LensFlow Twin Avatar</h3>
              </div>
              <div className="space-y-5">
                {LENS_STEPS.map((s, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <span className="text-xs font-mono text-primary/60 pt-0.5 w-10 shrink-0">{s.time}</span>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground font-medium">{s.label}</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-4 opacity-40">
                  <span className="text-xs font-mono text-muted-foreground pt-0.5 w-10 shrink-0">10:00</span>
                  <div className="flex items-start gap-3">
                    <Coffee className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground italic">Coffee still not ready…</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-primary/20 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total time</span>
                <span className="font-bold text-primary">90 seconds flat</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="font-serif text-4xl lg:text-5xl font-bold mb-4">
              Everything in the <span className="text-primary italic">Twin Avatar Solution</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-muted-foreground max-w-2xl mx-auto">
              One prestige package. Your face, your voice, your brand — automated.
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="rounded-2xl border border-white/5 bg-card p-6 flex flex-col gap-4 hover:border-primary/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-base leading-snug">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── MORGAN PA SECTION ─────────────────────────────────────────────── */}
      <section className="py-24 bg-card border-y border-white/5 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              <motion.div variants={fadeUp} className="mb-4">
                <span className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full">
                  <Star className="w-3 h-3" /> Exclusive to Twin Avatar
                </span>
              </motion.div>
              <motion.h2 variants={fadeUp} className="font-serif text-4xl lg:text-5xl font-bold mb-6">
                Mia — Your Personal{" "}
                <span className="text-violet-400">Marketing Advisor PA</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Twin Avatar members get Mia as a full-time Personal Assistant for marketing strategy.
                She doesn't just answer questions — she <em>runs</em> your marketing operation.
              </motion.p>
              <motion.div variants={stagger} className="space-y-4">
                {[
                  "Searches Domain & REA for client briefs in real-time",
                  "Writes listing descriptions, social captions & email copy",
                  "Schedules and plans your content calendar",
                  "Advises on pricing strategy using local sales data",
                  "Answers buyer & vendor calls with property-specific context",
                  "Generates weekly performance reports for your listings",
                ].map((point, i) => (
                  <motion.div key={i} variants={fadeUp} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/90">{point}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Mia card */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="relative"
            >
              <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-card to-card p-8">
                <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                    <span className="text-2xl">✦</span>
                  </div>
                  <div>
                    <div className="font-bold text-lg">Mia</div>
                    <div className="text-sm text-violet-400">Marketing Advisor PA</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-400 font-medium">Always On</span>
                  </div>
                </div>

                {/* Mock conversation */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-end">
                    <div className="bg-primary/20 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                      <p className="text-foreground">New listing — 4 bed Mosman. Need a script and 3 social posts.</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">
                      <p className="text-foreground/90">
                        Done! Script is generating now (90 sec). Here are your 3 social posts — Instagram,
                        Facebook &amp; LinkedIn — scheduled for 7am, 12pm and 5pm. Hashtags optimised
                        for Mosman buyers. Shall I also draft the email to your database?
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-primary/20 rounded-2xl rounded-tr-sm px-4 py-2.5">
                      <p className="text-foreground">Yes please.</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">
                      <p className="text-foreground/90">Email draft ready. Subject: 'Just Listed: Your Dream Home in Mosman' — opens with your name and the listing highlight reel. Sending now?</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ──────────────────────────────────────────────── */}
      <section className="py-28 px-6" id="compare">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} className="flex justify-center mb-4">
              <BarChart3 className="w-10 h-10 text-primary/70" />
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-serif text-4xl lg:text-5xl font-bold mb-4">
              DIY vs LensFlow — the real numbers
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-muted-foreground max-w-2xl mx-auto">
              What it actually costs to produce one professional listing video without us.
              Spoiler: it's not pretty.
            </motion.p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="rounded-3xl border border-white/5 overflow-hidden"
          >
            {/* Header */}
            <div className="grid grid-cols-3 bg-card border-b border-white/5 px-6 py-4">
              <div className="text-sm font-semibold text-muted-foreground">Cost Item</div>
              <div className="text-sm font-semibold text-center text-muted-foreground">Going it alone</div>
              <div className="text-sm font-semibold text-center text-primary">LensFlow Twin Avatar</div>
            </div>

            {DIY_COSTS.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 px-6 py-4 border-b border-white/5 items-center ${
                  i % 2 === 0 ? "bg-background" : "bg-card"
                }`}
              >
                <div className="text-sm text-foreground/90 pr-4">{row.item}</div>
                <div className="text-sm text-center text-muted-foreground">{row.diy}</div>
                <div className="text-sm text-center text-primary font-medium">{row.lensflow}</div>
              </div>
            ))}

            {/* Savings row */}
            <div className="grid grid-cols-3 px-6 py-5 bg-primary/10 border-t border-primary/20 items-center">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <TrendingDown className="w-5 h-5 text-emerald-400" />
                Your monthly saving
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground line-through opacity-40">$6,300+</div>
                <div className="text-xs text-muted-foreground">3 videos / month</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400">$599</div>
                <div className="text-xs text-emerald-400/70 font-semibold mt-1">≈ 91% saved</div>
              </div>
            </div>
          </motion.div>

          {/* Callout */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center text-sm text-muted-foreground mt-6"
          >
            Costs based on average Australian freelance market rates, May 2025. Individual results vary.
          </motion.p>
        </div>
      </section>

      {/* ── LENSFLOW vs DESCRIPT ─────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-14">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-muted-foreground text-xs font-semibold tracking-widest uppercase mb-6">
              Comparison
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-serif text-4xl lg:text-5xl font-bold mb-4">
              LensFlow vs Descript
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground text-lg max-w-xl mx-auto">
              Descript is great for editing existing footage. LensFlow means you never need footage in the first place.
            </motion.p>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="rounded-2xl border border-white/8 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 px-6 py-4 bg-card border-b border-white/8">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</div>
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">Descript</div>
              <div className="text-xs font-bold uppercase tracking-widest text-primary text-center">LensFlow</div>
            </div>

            {[
              { cat: "Primary purpose", descript: "Edit existing footage using text", lensflow: "Create videos — no footage needed" },
              { cat: "Speed for real estate", descript: "Requires raw footage first, then edit", lensflow: "Photos → finished video in minutes" },
              { cat: "AI avatars & presenters", descript: "Basic voice cloning only, no visuals", lensflow: "Photoreal avatars — Mia, Oliver, Sophie, James" },
              { cat: "No camera required", descript: "You must film yourself first", lensflow: "100% AI-generated, zero filming" },
              { cat: "Real estate scripts", descript: "General purpose — you write it", lensflow: "Claude AI writes property-specific scripts" },
              { cat: "Daily content volume", descript: "Slow — still needs raw footage", lensflow: "5+ finished videos per day, easily" },
              { cat: "Agent burnout", descript: "Still requires filming & lighting setup", lensflow: "No filming. No editing. No stress." },
              { cat: "Consistent branding", descript: "Varies with filming conditions", lensflow: "Same presenter look across every video" },
              { cat: "REA / Domain export", descript: "Manual export & reformatting", lensflow: "Platform-ready specs, automatic" },
              { cat: "Best for", descript: "Podcasters, YouTubers with footage", lensflow: "Busy agents who want daily content" },
            ].map((row, i) => (
              <div key={i} className={`grid grid-cols-3 px-6 py-4 border-b border-white/5 items-start ${i % 2 === 0 ? "bg-background" : "bg-card"}`}>
                <div className="text-sm text-foreground/90 pr-4 font-medium">{row.cat}</div>
                <div className="text-sm text-center text-muted-foreground px-2">{row.descript}</div>
                <div className="text-sm text-center text-primary font-medium px-2">{row.lensflow}</div>
              </div>
            ))}

            <div className="grid grid-cols-3 px-6 py-5 bg-primary/10 border-t border-primary/20 items-center">
              <div className="font-bold text-foreground text-sm">Verdict</div>
              <div className="text-center text-sm text-muted-foreground">Good for editing what you already have</div>
              <div className="text-center text-sm text-primary font-bold">Wins for agents who want to create fast</div>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-center text-sm text-muted-foreground mt-6"
          >
            Many top agents use both: LensFlow to create, Descript to add captions and repurpose clips.
          </motion.p>
        </div>
      </section>

      {/* ── PRICING CTA ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-card border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="relative rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-10 md:p-16 overflow-hidden text-center"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/8 rounded-full blur-[120px] pointer-events-none" />

            <motion.div variants={fadeUp} className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold tracking-widest uppercase px-5 py-2 rounded-full">
                <Crown className="w-3.5 h-3.5" /> Twin Avatar Solution
              </span>
            </motion.div>

            <motion.h2 variants={fadeUp} className="font-serif text-4xl lg:text-5xl font-bold mb-4">
              Your digital twin is ready<br />
              <span className="text-primary italic">when you are.</span>
            </motion.h2>

            <motion.p variants={fadeUp} className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
              3 listing videos per month. Your face, your voice, your brand.{" "}
              <strong className="text-foreground">$599 / month.</strong> Additional projects just $499 each.
            </motion.p>

            {/* What's included summary */}
            <motion.div
              variants={stagger}
              className="grid sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto mb-10"
            >
              {[
                "Custom human-like digital twin avatar",
                "Voice cloning — sounds exactly like you",
                "Mia PA for Marketing Advisor",
                "90-second 4K listing videos",
                "3 videos / month included",
                "REA & Domain-ready export",
                "Concierge onboarding & support",
                "Additional projects at $499 each",
              ].map((f, i) => (
                <motion.div key={i} variants={fadeUp} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-foreground/90">{f}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:prestige@lensflow.com.au?subject=Twin+Avatar+Solution+Enquiry">
                <Button className="rounded-full h-14 px-10 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xl shadow-primary/25">
                  Claim Your Twin Avatar <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
              <Link href="/pricing">
                <Button variant="outline" className="rounded-full h-14 px-8 text-base border-white/10 hover:bg-white/5">
                  See all plans <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </motion.div>

            <motion.p variants={fadeUp} className="text-xs text-muted-foreground mt-6">
              Spaces limited · personal onboarding included · cancel anytime
            </motion.p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
