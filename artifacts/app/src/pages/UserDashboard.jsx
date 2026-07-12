import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { COMPANIONS, isCompanionVisible } from "@/lib/companions";
import { TIER_LABELS, TIER_CREDITS } from "@/lib/creditSystem";
import { MessageCircle, Zap, ArrowRight, Crown, Star, CreditCard } from "lucide-react";

const TIER_COLORS = {
  free:    "bg-muted text-muted-foreground",
  starter: "bg-sky-500/15 text-sky-400 border border-sky-500/20",
  plus:    "bg-violet-500/15 text-violet-400 border border-violet-500/20",
  pro:     "bg-primary/15 text-primary border border-primary/20",
  vip:     "bg-amber-500/15 text-amber-400 border border-amber-500/20",
};

const TIER_ICONS = {
  free:    null,
  starter: Star,
  plus:    Star,
  pro:     Crown,
  vip:     Crown,
};

export default function UserDashboard() {
  const { user } = useAuth();
  const firstName = (user?.full_name ?? user?.fullName ?? "").split(" ")[0] || "there";

  const [tier, setTier]               = useState("free");
  const [credits, setCredits]         = useState(0);
  const [monthlyCredits, setMonthly]  = useState(0);
  const [loadingSub, setLoadingSub]   = useState(true);

  useEffect(() => {
    base44.functions.invoke("getSubscription", {})
      .then((res) => {
        const d = res?.data ?? {};
        setTier(d.tier ?? "free");
        setCredits(d.credit_balance ?? 0);
        setMonthly(d.monthly_credits ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoadingSub(false));
  }, []);

  const readyCompanions = COMPANIONS.filter(isCompanionVisible);
  const TierIcon = TIER_ICONS[tier] ?? null;
  const isUpgradeable = ["free", "starter"].includes(tier);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">

      {/* Header */}
      <header
        className="flex px-5 py-4 items-center justify-between border-b border-border/50"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="https://media.base44.com/images/public/6a4ad4122d2c58f83324b2ce/d15eaf582_glimr_logo.png"
            alt="GLIMR"
            className="h-9 w-9 rounded-lg"
          />
          <span className="font-heading text-xl font-semibold tracking-tight text-primary">GLIMR</span>
        </Link>
        <Link
          to="/pricing"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <CreditCard className="w-4 h-4" />
          Account
        </Link>
      </header>

      <div className="px-5 max-w-2xl mx-auto">

        {/* Welcome + tier */}
        <div className="pt-7 pb-5">
          <h1 className="font-heading text-3xl font-semibold tracking-tight mb-1">
            Welcome back, {firstName}.
          </h1>
          <div className="flex items-center gap-3 mt-3">
            {!loadingSub && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${TIER_COLORS[tier]}`}>
                {TierIcon && <TierIcon className="w-3 h-3" />}
                {TIER_LABELS[tier] ?? tier}
              </span>
            )}
            {!loadingSub && tier !== "free" && (
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span>
                  <span className="text-foreground font-medium">{credits.toFixed(1)}</span>
                  {monthlyCredits > 0 && <span className="text-muted-foreground"> / {monthlyCredits} credits</span>}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Upgrade banner — only for free/starter */}
        {!loadingSub && isUpgradeable && (
          <Link
            to="/pricing"
            className="flex items-center justify-between p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-6 group hover:bg-primary/15 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">Unlock more with Pro</p>
              <p className="text-xs text-muted-foreground mt-0.5">Live video, voice replies, and the intimacy layer — from A$49/mo</p>
            </div>
            <ArrowRight className="w-4 h-4 text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link
            to="/chat/mia"
            className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Chat with Mia</p>
              <p className="text-xs text-muted-foreground">Always here</p>
            </div>
          </Link>
          <Link
            to="/pricing"
            className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Credits & Plans</p>
              <p className="text-xs text-muted-foreground">Manage subscription</p>
            </div>
          </Link>
        </div>

        {/* Companions grid */}
        <div className="mb-6">
          <h2 className="font-heading text-xl font-semibold tracking-tight mb-4">Your companions</h2>
          <div className="grid grid-cols-2 gap-3">
            {readyCompanions.map((c) => (
              <Link
                key={c.id}
                to={`/chat/${c.id}`}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/40 transition-all"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={c.image}
                    alt={c.name}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <span className="text-[9px] font-medium tracking-widest text-primary uppercase">{c.tagline}</span>
                    <h3 className="font-heading text-base font-semibold text-white leading-none mt-0.5">{c.name}</h3>
                  </div>
                  <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-[10px] font-medium">
                      <MessageCircle className="w-2.5 h-2.5" /> Chat
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
