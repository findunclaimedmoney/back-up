import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ChevronRight, Phone, Clock, Search, TrendingUp, Zap,
  Home, AlertTriangle, CheckCircle2, Users, Copy, Share2,
} from "lucide-react";
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import MiaPropertyDemo from "@/components/MiaPropertyDemo";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.12 } },
};

const BEFORE = [
  "Client calls. You grab a pen.",
  "Open browser, search Domain manually.",
  "Filter suburb… price… beds… land…",
  "Screenshot 3-4 listings and text them.",
  "5–8 minutes later. Client already called another agent.",
];

const AFTER = [
  "Client calls. You open Mia.",
  "Type what they told you — one sentence.",
  "Mia searches Domain in real-time.",
  "6 matched listings in under 10 seconds.",
  "You're the first agent with the answer.",
];

const HANDLES = [
  { icon: Home, label: "Any suburb in Australia", desc: "Mosman, South Yarra, New Farm — wherever your client wants" },
  { icon: TrendingUp, label: "Any price range & size", desc: "Budget, bedrooms, bathrooms, minimum land area" },
  { icon: AlertTriangle, label: "Bank seizure properties", desc: 'Mortgagee in possession — just say "distressed sales"' },
  { icon: Search, label: "Feature-specific searches", desc: "Pool, waterfront, granny flat, corner block, DA approved" },
  { icon: Users, label: "Investment briefs", desc: "Yield-focused, dual occupancy, development potential" },
  { icon: Zap, label: "Urgent buyer clients", desc: "Pre-approval expiring — Mia finds options fast" },
];

const POST_CAPTION = `🏠 My client called at 9am wanting a 4-bed home in Mosman under $2M.

Before they finished the sentence, Mia (our AI assistant) had already found 6 properties matching their brief — complete with prices, land sizes, and direct links.

I called them back in under 30 seconds with a shortlist.

That's the LensFlow edge. 🎯

#RealEstate #PropTech #LensFlow #AustralianRealEstate #PropertySearch`;

function SocialPostCard() {
  const [copied, setCopied] = useState(false);

  function copyCaption() {
    void navigator.clipboard.writeText(POST_CAPTION).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Post mockup */}
      <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d1a] shadow-2xl">
        {/* Post header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            JM
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">John Mia · Principal Agent</p>
            <p className="text-xs text-white/40">Sydney Real Estate · just now</p>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border border-blue-500/40 text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            LinkedIn
          </div>
        </div>

        {/* Post body */}
        <div className="px-4 py-4 text-sm text-white/80 leading-relaxed whitespace-pre-line">
          {POST_CAPTION}
        </div>

        {/* Post image — Mia demo preview */}
        <div className="mx-4 mb-4 rounded-xl overflow-hidden border border-white/8 bg-gradient-to-br from-violet-950 to-indigo-950 px-3 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-violet-300 tracking-wide">MORGAN AI · LIVE PROPERTY SEARCH</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-end">
              <div className="bg-violet-600 text-white rounded-xl rounded-tr-sm px-3 py-2 max-w-[85%] text-[11px]">
                My client has a $2M budget, 4-bed house in Mosman, 500m²+
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-violet-400">
              <Search size={10} />
              <span>Searching Domain & REA…</span>
            </div>
            {[
              { a: "14 Raglan St, Mosman", p: "$2,450,000", tag: null },
              { a: "7 Elgin St, Mosman", p: "$1,975,000", tag: "🔴 Mortgagee" },
              { a: "23 Awaba St, Mosman", p: "$2,100,000", tag: null },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px]">
                {item.tag && <span className="text-red-400 text-[9px] font-semibold">{item.tag} · </span>}
                <span className="text-white/80">{item.a}</span>
                <span className="text-violet-300 font-bold float-right">{item.p}</span>
              </div>
            ))}
            <div className="text-[10px] text-white/40 text-center pt-1">+ 3 more · direct links included</div>
          </div>
        </div>

        {/* Post actions */}
        <div className="px-4 pb-4 flex items-center justify-between text-xs text-white/30 border-t border-white/5 pt-3">
          <div className="flex items-center gap-4">
            <span>👍 347 reactions</span>
            <span>💬 89 comments</span>
          </div>
          <span>🔁 124 reposts</span>
        </div>
      </div>

      {/* Copy caption button */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={copyCaption}
          className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-violet-500/50 hover:bg-violet-500/10 transition-all"
        >
          {copied ? <CheckCircle2 size={15} className="text-green-400" /> : <Copy size={15} />}
          {copied ? "Copied!" : "Copy caption"}
        </button>
        <button className="flex items-center justify-center gap-2 px-4 text-sm font-medium py-2.5 rounded-xl border border-violet-500/40 text-violet-400 hover:bg-violet-500/10 transition-all">
          <Share2 size={15} />
          Share
        </button>
      </div>
    </div>
  );
}

export default function Advantage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-36 pb-20 lg:pt-52 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/30 via-background to-background pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={stagger} initial="hidden" animate="show">
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-violet-400 uppercase mb-6 border border-violet-500/30 rounded-full px-4 py-1.5 bg-violet-500/10">
                <Zap size={11} /> The Competitive Edge
              </motion.div>

              <motion.h1 variants={fadeUp} className="font-serif text-4xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
                Your client is still{" "}
                <span className="text-muted-foreground line-through decoration-red-500">searching</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                  Mia already found 6.
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                While your client is still on the phone describing what they want, Mia searches Domain and realestate.com.au in real-time and hands you a shortlist. You call back in under 30 seconds. Your competitor hasn't even opened a browser.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
                <a href="#hero-form">
                  <Button className="rounded-full px-7 py-3 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base h-auto">
                    Get the Edge <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </a>
                <Link href="/pricing">
                  <Button variant="outline" className="rounded-full px-7 py-3 border-white/10 text-foreground hover:bg-white/5 font-medium text-base h-auto">
                    See Pricing
                  </Button>
                </Link>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-violet-400" />
                  <span>Results in &lt;10 seconds</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-violet-400" />
                  <span>Works while on the call</span>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <MiaPropertyDemo autoPlay={true} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Before / After */}
      <section className="py-24 border-y border-white/5 bg-card/30">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.p variants={fadeUp} className="text-xs font-semibold tracking-widest text-violet-400 uppercase mb-3">The Reality Check</motion.p>
            <motion.h2 variants={fadeUp} className="font-serif text-3xl lg:text-5xl font-bold">
              Every minute you spend searching<br />is a minute your client calls someone else.
            </motion.h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Before */}
            <motion.div
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm font-semibold text-red-400">Before LensFlow</span>
              </div>
              <div className="space-y-4">
                {BEFORE.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-white/70">
                    <span className="text-red-500/60 font-mono text-xs mt-0.5 w-4 shrink-0">{i + 1}.</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-red-500/20 text-xs text-red-400 font-medium flex items-center gap-2">
                <Clock size={12} /> Average: 6–8 minutes of manual work
              </div>
            </motion.div>

            {/* After */}
            <motion.div
              initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="rounded-2xl border border-violet-500/30 bg-violet-500/8 p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-sm font-semibold text-violet-400">With Mia</span>
              </div>
              <div className="space-y-4">
                {AFTER.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-white/80">
                    <CheckCircle2 size={14} className="text-violet-400 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-violet-500/20 text-xs text-violet-400 font-medium flex items-center gap-2">
                <Zap size={12} /> Under 10 seconds — you're first every time
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What Mia handles */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.p variants={fadeUp} className="text-xs font-semibold tracking-widest text-violet-400 uppercase mb-3">Full Scope</motion.p>
            <motion.h2 variants={fadeUp} className="font-serif text-3xl lg:text-5xl font-bold mb-4">
              Every client brief. Every criteria. Handled.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground text-lg max-w-xl mx-auto">
              Just describe what your client said on the phone. Mia translates it into a live property search.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {HANDLES.map(({ icon: Icon, label, desc }) => (
              <motion.div
                key={label}
                variants={fadeUp}
                className="group rounded-2xl border border-white/8 bg-card/60 p-6 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center mb-4 group-hover:bg-violet-500/25 transition-colors">
                  <Icon size={18} className="text-violet-400" />
                </div>
                <p className="font-semibold text-foreground mb-1.5">{label}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* The post / social proof */}
      <section className="py-24 border-y border-white/5 bg-card/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true }}
              variants={stagger}
            >
              <motion.p variants={fadeUp} className="text-xs font-semibold tracking-widest text-violet-400 uppercase mb-3">Your New Narrative</motion.p>
              <motion.h2 variants={fadeUp} className="font-serif text-3xl lg:text-5xl font-bold mb-6">
                This is the post that<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                  gets you 300+ leads.
                </span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground text-lg leading-relaxed mb-6">
                Agents using Mia are posting about their 30-second turnaround times on LinkedIn and Instagram — and their phones don't stop ringing.
              </motion.p>
              <motion.p variants={fadeUp} className="text-muted-foreground leading-relaxed mb-8">
                The post writes itself: client called, Mia found 6 matching properties before they finished the sentence, you called back in 30 seconds. That story, told once, positions you as the most tech-forward agent in your market.
              </motion.p>
              <motion.div variants={fadeUp} className="flex items-center gap-3 p-4 rounded-xl border border-violet-500/20 bg-violet-500/8">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                  <Share2 size={14} className="text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Copy the caption below and post it</p>
                  <p className="text-xs text-white/40">Modify the details. Make it yours. It's ready to go.</p>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6 }}
            >
              <SocialPostCard />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: "<10s", label: "To return a full property shortlist" },
              { value: "2 platforms", label: "Domain + REA searched simultaneously" },
              { value: "24/7", label: "Mia never sleeps, never stops searching" },
              { value: "0 clicks", label: "No manual filtering. Just describe it." },
            ].map(({ value, label }) => (
              <motion.div
                key={value}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <p className="font-serif text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400 mb-2">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 to-background pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp} className="font-serif text-4xl lg:text-6xl font-bold mb-6">
              The first agent to call back<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">with a shortlist wins.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground text-xl mb-10 max-w-xl mx-auto">
              Be that agent. 7-day free trial. No credit card.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/pipeline/">
                <Button className="rounded-full px-10 py-4 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-lg h-auto shadow-2xl shadow-primary/30">
                  Start Free Trial <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
