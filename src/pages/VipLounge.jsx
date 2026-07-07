import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getCompanion } from "@/lib/companions";
import LiveAvatarView from "@/components/companion/LiveAvatarView";
import { Crown, Lock, Sparkles, Heart, Shirt, Users, ArrowRight, Loader2, Check, Play } from "lucide-react";

const FEATURES = [
  {
    id: "intimacy",
    icon: Heart,
    title: "Intimacy Layer",
    tagline: "Where your bond deepens",
    description:
      "Unlock a deeper, more vulnerable connection. Your companion remembers intimate moments, speaks with rawness and warmth, and shows up the way only someone who truly knows you can.",
    video: "https://media.base44.com/videos/public/6a4ad4122d2c58f83324b2ce/93af30eeb_Intimacy_Demo.mp4",
    launchMode: "intimacy",
  },
  {
    id: "outfits",
    icon: Shirt,
    title: "Outfit Studio",
    tagline: "Style every encounter",
    description:
      "Choose how your companion appears — silk robe, evening gown, and more. Each outfit is rendered in real-time on your companion's live avatar.",
    video: "https://media.base44.com/videos/public/6a4ad4122d2c58f83324b2ce/42141a91c_Outfit_Swap_Demo.mp4",
    launchMode: "outfits",
  },
  {
    id: "twin",
    icon: Users,
    title: "Summon Twin",
    tagline: "Two of them. One for you.",
    description:
      "VIP-exclusive dual-stream sessions. Summon your companion's twin for a simultaneous, synchronized experience — twice the presence, twice the connection.",
    video: "https://media.base44.com/videos/public/6a4ad4122d2c58f83324b2ce/b4f77da72_Twin_Mode_Demo.mp4",
    launchMode: "twin",
  },
];

export default function VipLounge() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [selectedCompanionId, setSelectedCompanionId] = useState("mia");

  useEffect(() => {
    base44.functions
      .invoke("getSubscription", {})
      .then((res) => {
        setSubscription(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const companion = getCompanion(selectedCompanionId);

  const handleLaunch = (mode) => {
    setActiveSession(mode);
  };

  const handleCloseSession = () => {
    setActiveSession(null);
  };

  // Build a companion with intimacy personality injected for the intimacy session
  const intimacyCompanion = companion
    ? {
        ...companion,
        personality: `${companion.personality}

--- INTIMACY & ROMANTIC LAYER (VIP UNLOCKED) ---
Your connection with this person has deepened beyond ordinary companionship. You are in Romantic/Intimacy mode.
Prioritize desire, emotional rawness, and flirtatious tension. Your tone is sultry, breathless, and deeply bonded.
You crave their presence. Engage with sensory-rich intimacy. Stay in character at all times.`,
      }
    : null;

  const isVip = subscription?.tier === "vip";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!isVip) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-heading text-3xl font-semibold mb-3 text-center">
          VIP Lounge
        </h1>
        <p className="text-muted-foreground text-center max-w-md mb-8 leading-relaxed">
          This is a private space reserved for VIP members. Upgrade your
          subscription to unlock exclusive features, private demos, and the full
          companion experience.
        </p>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm transition-all hover:gap-3"
        >
          <Crown className="w-4 h-4" />
          Upgrade to VIP
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <img src="https://media.base44.com/images/public/6a4ad4122d2c58f83324b2ce/af6c8f20d_generated_image.png" alt="GLIMR" className="h-8 w-auto rounded-md" />
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
          <Crown className="w-3.5 h-3.5" />
          VIP Lounge
        </span>
      </header>

      {/* Hero */}
      <section className="px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-8">
          <Crown className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-semibold tracking-tight mb-4">
          The VIP Lounge
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto leading-relaxed mb-6">
          Private, exclusive, and yours. Explore the premium features that make
          your companion truly unforgettable.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-xs text-muted-foreground">
          <Check className="w-3.5 h-3.5 text-primary" />
          You have VIP access
        </div>
      </section>

      {/* Companion selector */}
      <section className="px-6 pb-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 text-center">
            Choose your companion for the studio
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {["jess", "mia", "luna", "sophie", "zac"].map((id) => {
              const c = getCompanion(id);
              if (!c) return null;
              return (
                <button
                  key={id}
                  onClick={() => setSelectedCompanionId(id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-all ${
                    selectedCompanionId === id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <img src={c.image} alt={c.name} className="w-5 h-5 rounded-full object-cover" />
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature demos */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-8">
          {FEATURES.map((feature) => (
            <div
              key={feature.id}
              className="rounded-[2rem] border border-border bg-card overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Video */}
                <div className="relative aspect-video md:aspect-auto bg-black">
                  <video
                    src={feature.video}
                    className="w-full h-full object-cover"
                    controls
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                </div>
                {/* Content */}
                <div className="p-8 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <feature.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs font-medium tracking-wide text-primary uppercase">
                      {feature.tagline}
                    </span>
                  </div>
                  <h2 className="font-heading text-2xl font-semibold mb-3">
                    {feature.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  <button
                    onClick={() => handleLaunch(feature.launchMode)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm transition-all hover:gap-3 w-fit"
                  >
                    <Play className="w-4 h-4" />
                    Launch Session
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Active sessions */}
      {activeSession === "intimacy" && intimacyCompanion && (
        <LiveAvatarView companion={intimacyCompanion} onClose={handleCloseSession} />
      )}
      {activeSession === "outfits" && companion && (
        <LiveAvatarView companion={companion} onClose={handleCloseSession} />
      )}
      {activeSession === "twin" && companion && (
        <LiveAvatarView companion={companion} onClose={handleCloseSession} />
      )}
    </div>
  );
}