import React, { useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, XCircle, ArrowRight, Crown, Sparkles, Video, Film, Clock, Zap, Camera, DollarSign, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);

  const tiers = [
    {
      name: "Starter",
      badge: null,
      price: isAnnual ? "79" : "89",
      videoLimit: "1 video / month",
      description: "You film. We write the script and run the teleprompter.",
      icon: Film,
      features: [
        "1 listing video per month",
        "AI-generated script from listing URL",
        "Scrolling teleprompter on your phone",
        "Self-record & upload from library",
        "720p video output",
        "REA & Domain compatible",
      ],
      notIncluded: [
        "AI presenter (no HeyGen / D-ID)",
        "ElevenLabs voiceover",
        "Voice + Photos slideshow",
        "Mia marketing campaign",
      ],
      cta: "Get Started",
      link: "/pipeline/billing?plan=starter",
      highlight: false,
    },
    {
      name: "Elite",
      badge: "Most Popular",
      price: isAnnual ? "199" : "219",
      videoLimit: "1 video / month",
      description: "The complete AI pipeline. Your listing, fully produced.",
      icon: Video,
      features: [
        "1 listing video per month",
        "AI presenter (Mia, Oliver, Sophie, James)",
        "ElevenLabs voice cloning & narration",
        "Voice + Photos slideshow option",
        "AI script from listing URL or photos",
        "Photo enhancement & Ken Burns",
        "4K rendering · REA & Domain export",
      ],
      notIncluded: [
        "Mia marketing campaign",
        "Digital twin avatar",
      ],
      cta: "Get Started",
      link: "/pipeline/billing?plan=elite",
      highlight: true,
    },
    {
      name: "Concierge",
      badge: null,
      price: isAnnual ? "399" : "449",
      videoLimit: "2 videos / month",
      description: "Full pipeline plus Mia runs your marketing.",
      icon: Sparkles,
      features: [
        "2 listing videos per month",
        "Everything in Elite",
        "Mia marketing campaign",
        "Social captions & email copy",
        "Content calendar scheduling",
        "Dedicated account manager",
        "White-glove onboarding · 24hr turnaround",
      ],
      notIncluded: [
        "Digital twin avatar",
      ],
      cta: "Get Started",
      link: "/pipeline/billing?plan=concierge",
      highlight: false,
    },
  ];

  const enterpriseTier = {
    name: "Enterprise",
    price: isAnnual ? "1,799" : "1,999",
    description: "Full-agency rollout with dedicated infrastructure, multi-seat access, and a bespoke AI pipeline built around your brand.",
    features: [
      "Unlimited videos across unlimited agents",
      "Up to 20 custom AI presenter avatars",
      "Full white-label platform (your brand, your domain)",
      "Dedicated rendering infrastructure",
      "API access for CRM & portal integrations",
      "Custom voice cloning for every agent",
      "Franchise & multi-office management dashboard",
      "SLA-backed 4hr turnaround guarantee",
      "Quarterly strategy sessions with LensFlow team",
      "Priority onboarding & migration support"
    ],
    cta: "Contact Sales",
    link: "mailto:sales@lensflow.com.au"
  };

  const faqs = [
    {
      q: "What's the difference between Starter and Elite?",
      a: "Starter is for agents who want to film themselves — you get the AI script, a scrolling teleprompter on your phone, and 1 finished video per month. Elite hands the whole thing to an AI presenter: the script writes itself, ElevenLabs narrates it, and HeyGen or D-ID renders the final video without you lifting a camera."
    },
    {
      q: "What does the Mia marketing campaign include?",
      a: "On Concierge, Mia (our Claude-powered AI) generates your social captions, property email copy, and an Instagram/Facebook content calendar from the same listing data used to build your video — so your whole marketing push goes out in one click."
    },
    {
      q: "Are the videos compatible with REA and Domain?",
      a: "Yes. Every plan exports in a format that meets the exact upload specs for realestate.com.au and Domain. Starter (720p) meets the minimum; Elite and Concierge output full 4K."
    },
    {
      q: "Can I upgrade my plan mid-month?",
      a: "Absolutely — upgrades take effect immediately and we'll prorate the difference. Downgrades take effect at the start of your next billing cycle."
    },
    {
      q: "What happens if I want my own digital twin?",
      a: "That's the Twin Avatar Solution ($599/mo). You submit a short selfie video, we train your personal AI clone, and it presents every listing exactly like you — voice, mannerisms, and all. It includes 3 videos per month plus Mia as your PA."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      <Navbar />

      <main className="pt-32 pb-24 lg:pt-48">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="font-serif text-4xl lg:text-6xl font-bold mb-6">
              Pricing that scales with your <span className="text-primary italic">listings</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Generate endless marketing collateral without the camera crew. Choose the plan that fits your agency.
            </p>

            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
              <Switch 
                checked={isAnnual} 
                onCheckedChange={setIsAnnual} 
                data-testid="switch-billing-cycle"
                className="data-[state=checked]:bg-primary"
              />
              <span className={`text-sm font-medium flex items-center gap-2 ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
                Annually
                <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">Save 10%</span>
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {tiers.map((tier, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={tier.name}
                className={`relative rounded-3xl p-8 border ${
                  tier.highlight 
                    ? "bg-primary/5 border-primary/50 shadow-2xl shadow-primary/10" 
                    : "bg-card border-white/5"
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm font-bold px-4 py-1 rounded-full">
                    {tier.badge}
                  </div>
                )}

                {/* Icon + name */}
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tier.highlight ? "bg-primary/20" : "bg-white/5"}`}>
                    <tier.icon className={`w-4.5 h-4.5 ${tier.highlight ? "text-primary" : "text-muted-foreground"}`} size={18} />
                  </div>
                  <h3 className="font-serif text-2xl font-bold">{tier.name}</h3>
                </div>

                {/* Video limit badge */}
                <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full mb-3">
                  <Video size={11} /> {tier.videoLimit}
                </div>

                <p className="text-sm text-muted-foreground mb-5">{tier.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold">${tier.price}</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
                
                <a href={tier.link} className="block mb-7">
                  <Button 
                    className={`w-full rounded-full h-12 text-base font-medium ${
                      tier.highlight ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-white/10 hover:bg-white/20 text-foreground"
                    }`}
                    data-testid={`btn-pricing-${tier.name.toLowerCase()}`}
                  >
                    {tier.cta}
                  </Button>
                </a>

                <div className="space-y-3">
                  {tier.features.map((feature, j) => (
                    <div key={j} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" size={17} />
                      <span className="text-foreground/90">{feature}</span>
                    </div>
                  ))}
                  {tier.notIncluded.length > 0 && (
                    <div className="pt-3 mt-1 border-t border-white/5 space-y-3">
                      {tier.notIncluded.map((item, j) => (
                        <div key={j} className="flex items-start gap-3 text-sm">
                          <XCircle className="w-4.5 h-4.5 text-muted-foreground/40 shrink-0 mt-0.5" size={17} />
                          <span className="text-muted-foreground/50">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            No credit card required · 7-day free trial · Cancel anytime
          </p>

          {/* Enterprise Tier */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-6xl mx-auto mt-8"
          >
            <div className="relative rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-8 md:p-12 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -top-4 left-8 bg-gradient-to-r from-primary to-primary/70 text-primary-foreground text-sm font-bold px-4 py-1 rounded-full">
                Enterprise
              </div>
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="font-serif text-3xl font-bold mb-3">Full Agency Rollout</h3>
                  <p className="text-muted-foreground mb-6">{enterpriseTier.description}</p>
                  <div className="mb-8">
                    <span className="text-5xl font-bold">${enterpriseTier.price}</span>
                    <span className="text-muted-foreground">/mo</span>
                    <span className="ml-3 text-sm text-muted-foreground">{isAnnual ? "billed annually" : "billed monthly"}</span>
                  </div>
                  <a href={enterpriseTier.link}>
                    <Button className="rounded-full h-12 px-8 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90" data-testid="btn-pricing-enterprise">
                      {enterpriseTier.cta} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {enterpriseTier.features.map((feature, j) => (
                    <div key={j} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground/90">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* ── PRESTIGE COMPARISON ─────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-background border-t border-white/5 overflow-hidden">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
              <AlertTriangle className="w-3 h-3" /> The Real Numbers
            </div>
            <h2 className="font-serif text-4xl lg:text-5xl font-bold mb-5">
              The time you waste, the money you bleed,<br />
              <span className="text-primary italic">and the listings you don't win</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Every listing your competitor presents with a grainy phone clip or a basic slide show
              is a deal you could be winning. Compare what it actually costs to do this the old way.
            </p>
          </motion.div>

          {/* Visual Quality Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="grid md:grid-cols-2 gap-4 mb-20"
          >
            {/* Before — old way */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] group">
              <img
                src="/quality-before.jpg"
                alt="Standard listing photo"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  filter: "contrast(0.68) brightness(0.78) saturate(0.35) blur(0.7px)",
                }}
              />
              {/* Noise / grain overlay */}
              <div className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E\")",
                  backgroundSize: "128px 128px",
                }}
              />
              {/* Dark vignette */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/40" />
              {/* Quality badge */}
              <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 text-xs font-bold px-2.5 py-1 rounded-lg">
                <Camera className="w-3 h-3" /> 720p · Shot on iPhone
              </div>
              {/* Timestamp watermark */}
              <div className="absolute top-4 right-4 text-white/50 text-xs font-mono bg-black/40 px-2 py-0.5 rounded">
                12:34 PM
              </div>
              {/* Bottom label */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-6 py-5">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-white font-bold text-base tracking-wide">Without LensFlow</span>
                </div>
                <p className="text-white/60 text-sm">Basic phone snapshot · No script · No voiceover · No presenter</p>
              </div>
            </div>

            {/* After — LensFlow quality */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] group">
              <img
                src="/quality-after.jpg"
                alt="LensFlow AI cinematic presentation"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: "contrast(1.05) brightness(1.02) saturate(1.1)" }}
              />
              {/* Cinematic top bar */}
              <div className="absolute top-0 left-0 right-0 h-7 bg-black/80" />
              <div className="absolute bottom-0 left-0 right-0 h-7 bg-black/80" />
              {/* Quality badge */}
              <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg shadow-primary/30">
                <Zap className="w-3 h-3" /> 4K · AI-Composed
              </div>
              {/* LensFlow watermark */}
              <div className="absolute top-4 right-4 text-white/80 text-xs font-bold bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-lg tracking-wider">
                LensFlow AI
              </div>
              {/* Presenter overlay badge */}
              <div className="absolute bottom-16 left-4 right-4 flex justify-end">
                <div className="bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2 text-xs text-white/90 font-medium flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/80 flex items-center justify-center">
                    <Video className="w-3 h-3 text-white" />
                  </div>
                  AI Presenter · ElevenLabs Voice · HeyGen Avatar
                </div>
              </div>
              {/* Bottom label */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-6 py-5">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-white font-bold text-base tracking-wide">With LensFlow</span>
                </div>
                <p className="text-white/60 text-sm">Cinematic 4K · AI script · Professional voiceover · Presenter video</p>
              </div>
            </div>
          </motion.div>

          {/* Time comparison */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 gap-6 mb-20"
          >
            {/* Old way */}
            <div className="rounded-2xl border border-white/5 bg-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium uppercase tracking-widest">The Old Way</div>
                  <div className="text-2xl font-bold text-red-400">4+ hours per listing</div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  ["45 min", "Find and brief a videographer"],
                  ["2–3 days", "Wait for availability + travel to property"],
                  ["60–90 min", "Filming on-site"],
                  ["1–2 days", "Wait for video edit to come back"],
                  ["30 min", "Write your own listing script or ad copy"],
                  ["45 min", "Film your own voiceover (multiple takes)"],
                  ["30 min", "Upload to REA, Domain, social media, email"],
                ].map(([time, task], i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-red-400/70 font-mono text-xs mt-0.5 w-16 shrink-0">{time}</span>
                    <span className="text-foreground/70">{task}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm font-semibold">Meanwhile, a faster agent already has the listing</span>
              </div>
            </div>

            {/* LensFlow */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium uppercase tracking-widest">With LensFlow</div>
                  <div className="text-2xl font-bold text-primary">90 seconds flat</div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  ["0:10", "Paste the listing URL (or upload 3 photos)"],
                  ["0:20", "AI reads the property and writes the script"],
                  ["0:30", "ElevenLabs narrates it in a professional voice"],
                  ["0:60", "HeyGen renders your AI presenter on screen"],
                  ["0:75", "Photos composed into a cinematic 4K video"],
                  ["0:90", "Ready to share to REA, Domain, socials, email"],
                  ["", "Mia drafts your marketing copy automatically"],
                ].map(([time, task], i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-primary/60 font-mono text-xs mt-0.5 w-16 shrink-0">{time}</span>
                    <span className="text-foreground/90">{task}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-primary/20 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-primary text-sm font-semibold">You're first to market. Every. Single. Time.</span>
              </div>
            </div>
          </motion.div>

          {/* Real cost table */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-primary" />
                <h3 className="font-serif text-2xl lg:text-3xl font-bold">What one listing video actually costs without us</h3>
              </div>
              <p className="text-muted-foreground">Per-listing breakdown, based on real Australian market rates.</p>
            </div>

            <div className="rounded-3xl border border-white/5 overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-3 bg-card border-b border-white/5 px-6 py-4">
                <div className="text-sm font-semibold text-muted-foreground">Cost Item</div>
                <div className="text-sm font-semibold text-center text-red-400">Without LensFlow</div>
                <div className="text-sm font-semibold text-center text-primary">With LensFlow</div>
              </div>

              {[
                ["Videographer hire", "$800 – $1,500", "✓ Included"],
                ["Video editing & colour grade", "$200 – $400", "✓ Included"],
                ["Voiceover recording", "$150 – $300", "✓ Included"],
                ["Listing script writing", "$100 – $200", "✓ Included"],
                ["Social media caption writing", "$200 – $300/mo", "✓ Mia writes it"],
                ["Email marketing copy", "$150 – $250/mo", "✓ Mia writes it"],
                ["Your time (5+ hrs @ ~$150/hr)", "$750+", "✓ 90 seconds of your time"],
                ["Waiting for deliverables", "3 – 7 business days", "✓ Ready instantly"],
                ["REA & Domain formatting", "$50 – $100", "✓ Auto-formatted"],
              ].map(([item, cost, lensflow], i) => (
                <div
                  key={i}
                  className={`grid grid-cols-3 px-6 py-4 border-b border-white/5 items-center text-sm ${
                    i % 2 === 0 ? "bg-background" : "bg-card"
                  }`}
                >
                  <div className="text-foreground/80 pr-4">{item}</div>
                  <div className="text-center text-red-400/80">{cost}</div>
                  <div className="text-center text-primary font-medium">{lensflow}</div>
                </div>
              ))}

              {/* Total row */}
              <div className="grid grid-cols-3 px-6 py-5 bg-primary/5 border-t border-primary/20 items-center">
                <div className="font-bold text-foreground">Total per listing</div>
                <div className="text-center">
                  <span className="text-red-400 font-bold text-lg line-through opacity-70">$2,400+</span>
                  <div className="text-red-400/60 text-xs">plus days of your life</div>
                </div>
                <div className="text-center">
                  <span className="text-primary font-bold text-lg">From $199/mo</span>
                  <div className="text-primary/60 text-xs">unlimited listings · cancel anytime</div>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              This is why LensFlow members don't just save money — they <span className="text-primary font-medium">present more, faster, and at a quality level that justifies higher commissions.</span>
            </p>
          </motion.div>

        </div>
      </section>

      <section className="py-24 bg-card border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="grid gap-6">
            {faqs.map((faq, i) => (
              <div key={i} className="p-6 rounded-2xl bg-background border border-white/5">
                <h3 className="text-lg font-semibold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Twin Avatar prestige teaser */}
      <section className="py-20 px-6 bg-background border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/8 via-card to-card p-8 md:p-12 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/6 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -top-3 left-8">
              <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full">
                <Crown className="w-3 h-3" /> Prestige Package
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-8 items-center pt-4">
              <div>
                <h3 className="font-serif text-3xl font-bold mb-3">
                  Twin Avatar Solution
                </h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Create your own human-like digital twin that presents every listing
                  exactly like you — in 90 seconds flat. Includes Mia as your
                  Personal Marketing Advisor PA.
                </p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">$599</span>
                  <span className="text-muted-foreground">/mo</span>
                  <span className="ml-3 text-sm text-muted-foreground">· 3 videos · extra $499 each</span>
                </div>
                <Link href="/twin-avatar">
                  <Button className="rounded-full h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
                    Explore Twin Avatar <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  "Your own digital twin avatar",
                  "Voice cloning — sounds like you",
                  "Mia PA for Marketing",
                  "90-second 4K listing videos",
                  "3 videos per month",
                  "REA & Domain-ready export",
                  "Concierge onboarding",
                  "Extra projects at $499 each",
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground/90">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
