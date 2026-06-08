import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Film,
  Link2,
  PlayCircle,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Video,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SubmitForm } from "@/components/SubmitForm";
import { Link } from "wouter";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const steps = [
  { num: "01", icon: Link2, title: "Paste your listing URL", body: "LensFlow reads the suburb, bedrooms, style and price point from the URL. Claude AI writes a listing-specific script in under 10 seconds. No brief. No back-and-forth." },
  { num: "02", icon: Users, title: "Pick your AI presenter", body: "Mia, Oliver or Sophie deliver your script with a natural Australian voice and lip-sync. No videographer to book, no studio, no waiting days for an edit." },
  { num: "03", icon: Zap, title: "Get your full campaign", body: "Finished MP4 presenter video, social reels, caption pack and campaign copy — all ready inside the 48-hour traffic window when your listing has the most eyes." },
];

const valueItems = [
  { label: "Script creation", amount: "$50" },
  { label: "Professional voiceover", amount: "$75" },
  { label: "Video editing & render", amount: "$250" },
  { label: "Social media package", amount: "$150" },
];

const trustPoints = [
  { icon: Shield, title: "Brand safe", detail: "Property-first copy and professional presenter tone on every listing." },
  { icon: Clock, title: "Same-day delivery", detail: "From listing URL to finished campaign in minutes, not days." },
  { icon: Users, title: "Built for agents", detail: "Designed around how Australian real estate agents actually work." },
];

const propertyPhotos = [
  "/property-1.jpg",
  "/property-2.jpg",
  "/fronthouse-enhanced.jpg",
  "/property-4.jpg",
  "/property-5.jpg",
  "/property-6.jpg",
];

export default function Home() {
  useEffect(() => {
    const existing = document.querySelector("script[data-agentic-video-id]");
    if (existing) return;
    const s = document.createElement("script");
    s.type = "module";
    s.src = "https://agentic-videos.d-id.com/v1/index.js";
    s.setAttribute("data-client-key", "ck_IdXj3Fa0HEI3MMrrUrQqU");
    s.setAttribute("data-agentic-video-id", "agv_42jSHqnwyMKZxz7EFmM0M");
    s.setAttribute("data-target-id", "did-agentic-video");
    document.body.appendChild(s);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative pt-20 lg:pt-0 border-b border-white/5 overflow-hidden min-h-[92vh] flex items-center">
        {/* Full-bleed property photo background */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/hero-villa.jpg"
            alt="Luxury property"
            className="h-full w-full object-cover"
            style={{ objectPosition: "center 30%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c16] via-[#0a0c16]/80 to-[#0a0c16]/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c16] via-transparent to-[#0a0c16]/40" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl w-full px-5 py-24 lg:py-0">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — copy */}
            <motion.div
              initial="hidden" animate="visible" variants={staggerContainer}
              className="max-w-2xl"
            >
              <motion.div variants={fadeInUp} className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Australia's AI real estate video platform
              </motion.div>

              <motion.h1 variants={fadeInUp} className="font-serif text-4xl font-bold leading-[1.06] sm:text-5xl md:text-6xl lg:text-[4.25rem]">
                Your listing goes live.<br />
                <span className="text-primary">Your video should too.</span>
              </motion.h1>

              <motion.p variants={fadeInUp} className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                Real estate agents lose their listing's peak 48-hour traffic window waiting on a videographer. LensFlow turns your listing URL into a professional AI presenter video, social reels and full campaign kit — same day.
              </motion.p>

              <motion.div variants={fadeInUp} className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a href="#hero-form">
                  <Button className="w-full sm:w-auto h-13 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground">
                    Generate Campaign Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
                <a href="/examples">
                  <Button variant="outline" className="w-full sm:w-auto h-12 rounded-full border-white/20 bg-white/5 px-7 text-base text-foreground backdrop-blur">
                    <PlayCircle className="mr-2 h-4 w-4" /> Watch Examples
                  </Button>
                </a>
              </motion.div>

              {/* Stat strip */}
              <motion.div variants={fadeInUp} className="mt-10 grid grid-cols-3 gap-4">
                {[
                  { value: "< 10 min", label: "Turnaround" },
                  { value: "$525", label: "Value created" },
                  { value: "3 formats", label: "Per campaign" },
                ].map((m) => (
                  <div key={m.label} className="rounded-2xl border border-white/10 bg-background/70 px-4 py-4 backdrop-blur">
                    <div className="text-xl font-bold text-primary">{m.value}</div>
                    <div className="mt-0.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">{m.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — hero form (desktop) */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              id="hero-form"
              className="hidden lg:block"
            >
              <div className="rounded-[2rem] border border-white/15 bg-card/90 p-7 shadow-2xl shadow-black/50 backdrop-blur-xl">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-primary">Start New Campaign</p>
                    <h2 className="mt-2 font-serif text-2xl font-semibold">Generate Property Campaign</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Paste a listing URL · pick a presenter · done.</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">AI Ready</span>
                </div>
                <SubmitForm />
              </div>
            </motion.div>
          </div>

          {/* Mobile form */}
          <div id="hero-form-mobile" className="mt-10 block lg:hidden">
            <div className="rounded-[1.75rem] border border-white/10 bg-card/90 p-5 backdrop-blur-xl">
              <p className="mb-4 text-sm font-medium text-primary uppercase tracking-wider">Start New Campaign</p>
              <SubmitForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── PROOF STRIP ────────────────────────────────────────── */}
      <section className="border-b border-white/5 bg-card/20 py-6">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {[
              "Campaign ready in minutes, not days",
              "Mia · Oliver · Sophie — Australian AI presenters",
              "Script by Claude AI · Voice by ElevenLabs",
              "No videographer · No studio · No waiting",
            ].map((p) => (
              <div key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROPERTY PHOTO STRIP ─────────────────────────────── */}
      <section className="bg-background py-12 overflow-hidden">
        <div className="mx-auto max-w-7xl px-5">
          <p className="mb-6 text-center text-xs uppercase tracking-[0.24em] text-muted-foreground">Properties listed and marketed with LensFlow</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {propertyPhotos.map((src, i) => (
              <div key={i} className="overflow-hidden rounded-2xl aspect-[4/3] group">
                <img
                  src={src}
                  alt={`Listed property ${i + 1}`}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BEFORE / AFTER ──────────────────────────────────────── */}
      <section className="border-t border-white/5 bg-card/30 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm uppercase tracking-[0.24em] text-primary">The LensFlow Difference</p>
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl lg:text-5xl">
              From raw listing to campaign-ready — instantly.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Paste a listing URL. LensFlow turns it into polished video, presenter narration and social content — no photographer, no editor, no wait.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-card">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src="/property-1.jpg" alt="Raw listing photo" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute bottom-4 left-4 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">Before — raw listing</span>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-foreground">Standard listing photo</h3>
                <p className="mt-2 text-sm text-muted-foreground">What every agent has. Decent photo, zero engagement when posted to socials.</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-primary/30 bg-card shadow-[0_0_32px_rgba(201,154,46,0.12)]">
              <div className="relative aspect-[4/3] overflow-hidden bg-black">
                <video
                  src="/videos/mia-presenter.mp4"
                  poster="/presenters/mia-poster.jpg"
                  autoPlay muted loop playsInline
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute bottom-4 left-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">LensFlow output</span>
              </div>
              <div className="p-5">
                <div className="mb-2 inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">AI Presenter Video</div>
                <h3 className="font-semibold text-foreground">Professional presenter video</h3>
                <p className="mt-2 text-sm text-muted-foreground">Mia narrates your listing with property-specific copy, natural lipsync and broadcast-quality render.</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-primary/20 bg-card shadow-[0_0_24px_rgba(201,154,46,0.08)]">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src="/fronthouse-enhanced.jpg" alt="LensFlow enhanced property photo" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute bottom-4 left-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">After — LensFlow enhanced</span>
              </div>
              <div className="p-5">
                <div className="mb-2 inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">1080p · Enhanced lighting</div>
                <h3 className="font-semibold text-foreground">Twilight-quality result</h3>
                <p className="mt-2 text-sm text-muted-foreground">Golden-hour lighting, crisp 1080p render and campaign-ready framing — from a standard phone photo.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-background py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm uppercase tracking-[0.24em] text-primary">How It Works</p>
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl lg:text-5xl">
              Three steps. Full campaign.
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.num} className="rounded-[1.75rem] border border-white/10 bg-card p-7">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="font-serif text-5xl text-white/8">{step.num}</span>
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BRAND VIDEO ─────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-card/30 py-14 lg:py-20">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mb-8 text-center">
            <p className="mb-3 text-sm uppercase tracking-[0.24em] text-primary">See It In Action</p>
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
              From listing URL to live campaign — in minutes.
            </h2>
          </div>
          <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-black shadow-2xl">
            <video controls playsInline poster="/presenters/mia-poster.jpg" className="w-full" style={{ aspectRatio: "16/9" }}>
              <source src="/videos/lensflow-brand.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      {/* ── MOBILE TELEPROMPTER ─────────────────────────────────── */}
      <section id="mobile-app" className="bg-background py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            {/* Left — phone mockups */}
            <div className="order-2 lg:order-1">
              <div className="relative mx-auto max-w-sm lg:max-w-none">
                {/* Main phone — create campaign screen */}
                <div className="overflow-hidden rounded-[2.5rem] border-4 border-white/15 bg-black shadow-2xl shadow-black/60">
                  <img
                    src="/mobile-4.jpg"
                    alt="LensFlow mobile app — create campaign"
                    className="w-full"
                  />
                </div>
                {/* Floating mini phone — features screen */}
                <div className="absolute -bottom-4 -right-4 w-36 overflow-hidden rounded-[1.5rem] border-4 border-white/15 bg-black shadow-xl sm:w-44 lg:w-40">
                  <img
                    src="/mobile-2.jpg"
                    alt="LensFlow mobile — features"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Right — copy */}
            <div className="order-1 lg:order-2">
              <p className="mb-4 text-sm uppercase tracking-[0.24em] text-primary">Mobile App</p>
              <h2 className="font-serif text-3xl font-semibold sm:text-4xl lg:text-5xl">
                Film yourself. LensFlow writes the script.
              </h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground">
                The LensFlow mobile app lets you record yourself presenting a property — with a scrolling teleprompter reading the AI-generated script directly on your camera screen. No memorising, no retakes, no crew.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { title: "AI script from your listing URL", detail: "Claude AI reads the listing and writes a property-specific script delivered to your phone before you hit record." },
                  { title: "Scrolling teleprompter on camera", detail: "Read naturally while filming. Slow, normal or fast scroll speed — controlled live during your take." },
                  { title: "Enhance with AI voice & background", detail: "Add an AI presenter voice narration, background music and property image slideshow to your selfie video." },
                ].map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <div className="mt-1 h-6 w-6 shrink-0 flex items-center justify-center rounded-full bg-primary/20 text-primary">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{f.title}</div>
                      <div className="mt-1 text-sm leading-6 text-muted-foreground">{f.detail}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a href="/mobile/">
                  <Button className="h-12 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground">
                    Download the App <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
                <a href="/pipeline/">
                  <Button variant="outline" className="h-12 rounded-full border-white/15 bg-white/5 px-7 text-base text-foreground">
                    Use Web Version
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRESENTERS TEASER ──────────────────────────────────── */}
      <section id="presenters" className="bg-background py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10 lg:flex lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-sm uppercase tracking-[0.24em] text-primary">AI Presenters</p>
              <h2 className="font-serif text-3xl font-semibold sm:text-4xl lg:text-5xl">
                Meet our AI presenters.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                Three Australian AI presenters, each matched to a different property type and buyer audience. LensFlow writes them a property-specific script from your listing URL.
              </p>
            </div>
            <a href="/presenters" className="mt-5 inline-block lg:mt-0">
              <Button variant="outline" className="h-11 rounded-full border-white/15 bg-white/5 px-6 text-sm">
                Meet the full team <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Left — D-ID Agentic Video + Mia poster below */}
            <div className="flex flex-col gap-5">
              {/* Agentic video widget */}
              <div
                id="did-agentic-video"
                className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-card"
                style={{ minHeight: 360 }}
              />
              {/* Mia poster */}
              <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-card">
                <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-b from-amber-900/40 to-black">
                  <img
                    src="/presenters/mia-poster.jpg"
                    alt="Mia — AI Presenter"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-2xl font-bold text-white">Mia</div>
                    <div className="mt-0.5 text-sm text-primary">Waterfront / Lifestyle</div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm leading-6 text-muted-foreground">Warm, polished and ideal for coastal, prestige and family listings.</p>
                  <a href="/pipeline/?presenter=mia" className="mt-4 inline-flex items-center text-xs font-semibold text-primary hover:underline">
                    Use Mia for my listing <ArrowRight className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right — Sophie card */}
            <motion.article
              whileHover={{ y: -4 }}
              className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-card"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-b from-rose-900/40 to-black">
                <video
                  src="/videos/sophie-presenter.mp4"
                  poster="/presenters/sophie-poster.jpg"
                  autoPlay muted loop playsInline
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-2xl font-bold text-white">Sophie</div>
                  <div className="mt-0.5 text-sm text-primary">Family / Suburban</div>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm leading-6 text-muted-foreground">Friendly and relatable — perfect for family homes and suburban lifestyle.</p>
                <a href="/pipeline/?presenter=sophie" className="mt-4 inline-flex items-center text-xs font-semibold text-primary hover:underline">
                  Use Sophie for my listing <ArrowRight className="ml-1 h-3 w-3" />
                </a>
              </div>
            </motion.article>
          </div>
        </div>
      </section>

      {/* ── VALUE / COMPARE ─────────────────────────────────────── */}
      <section id="compare" className="border-y border-white/5 bg-card/40 py-16 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.24em] text-primary">Marketing Value</p>
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl lg:text-5xl">
              $525 of marketing. Created in one flow.
            </h2>
            <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-white/10 bg-background">
              {valueItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between border-b border-white/5 px-6 py-4 last:border-b-0">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold">{item.amount}</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-primary/10 px-6 py-5">
                <span className="font-semibold text-primary">Total created today</span>
                <span className="text-3xl font-bold text-primary">$525</span>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-primary/25 bg-primary/10 p-7">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-2xl font-semibold sm:text-3xl">
              From admin software to AI marketing team.
            </h3>
            <p className="mt-4 leading-7 text-muted-foreground">
              Most platforms show you job logs. LensFlow shows you finished marketing assets. Every screen answers the agent's real question: what did this create for me today?
            </p>
            <div className="mt-7 space-y-3">
              {["Campaign created first — listing URL in, assets out", "AI presenter video, not just a script", "Social reels packaged and ready to post", "Marketing value shown in dollars, not credits"].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8">
              <a href="/pipeline/">
                <Button className="w-full sm:w-auto h-12 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground">
                  Start Free — No Credit Card <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST ───────────────────────────────────────────────── */}
      <section className="bg-background py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm uppercase tracking-[0.24em] text-primary">Built for Agents</p>
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
              A calm, premium system agents can rely on.
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {trustPoints.map((item) => (
              <div key={item.title} className="rounded-[1.75rem] border border-white/10 bg-card p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-card py-20">
        <div className="absolute inset-0 pointer-events-none">
          <img src="/property-luxury.jpg" alt="" className="h-full w-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-background/85" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-5 text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.24em] text-primary">Ready to Start</p>
          <h2 className="font-serif text-3xl font-bold sm:text-4xl lg:text-5xl">
            The marketing department agents wish they had.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Start with the campaign, show the presenter, prove the output and make the value obvious — same day, every listing.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a href="/pipeline/">
              <Button className="w-full sm:w-auto h-14 rounded-2xl bg-primary px-8 text-base font-semibold text-primary-foreground sm:h-12 sm:rounded-full">
                Start Free — No Credit Card <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <Link href="/pricing">
              <Button variant="outline" className="w-full sm:w-auto h-12 rounded-2xl border-white/15 bg-white/5 px-8 text-base text-foreground sm:rounded-full">
                Compare Packages
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
