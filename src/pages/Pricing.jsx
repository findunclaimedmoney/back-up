import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, ArrowLeft, CheckCircle, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import TierCard from "@/components/pricing/TierCard";
import IntimacyAddOnCard from "@/components/pricing/IntimacyAddOnCard";
import TopUpCard from "@/components/pricing/TopUpCard";

const TIERS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Start your journey with GLIMR",
    ctaLabel: "Get Started",
    features: [
      "Text chat with all companions",
      "1 companion at a time",
      "Basic emotional memory",
      "Community support",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    price: 29,
    description: "See and hear your companion",
    ctaLabel: "Upgrade to Plus",
    features: [
      "Everything in Free",
      "80 min HD video per month",
      "Voice replies",
      "All companions unlocked",
      "Enhanced memory system",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 49,
    description: "Deep connection & romance",
    ctaLabel: "Upgrade to Pro",
    highlighted: true,
    badge: "popular",
    features: [
      "Everything in Plus",
      "160 min HD video per month",
      "Intimacy & Romantic layer",
      "Fantasy outfits & uniforms",
      "Companion's Diary",
      "Priority processing",
    ],
  },
  {
    id: "vip",
    name: "VIP",
    price: 299,
    description: "The full GLIMR experience",
    ctaLabel: "Request Invitation",
    badge: "vip",
    features: [
      "Everything in Pro",
      "500 min HD video per month",
      "Twin / Clone companion",
      "GLIMR Home holographic device",
      "Deepest intimacy & personalization",
      "Dedicated memory palace",
      "Early access to new companions",
    ],
  },
];

export default function Pricing() {
  const [currentTier, setCurrentTier] = useState("free");
  const [loading, setLoading] = useState(null);
  const [success, setSuccess] = useState(false);
  const [intimacyPackage, setIntimacyPackage] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [minutesUsed, setMinutesUsed] = useState(0);
  const [addonLoading, setAddonLoading] = useState(null);
  const [topupLoading, setTopupLoading] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (sessionId) {
      confirmSession(sessionId);
    } else {
      loadSubscription();
    }
  }, []);

  const loadSubscription = async () => {
    try {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) return;
      const res = await base44.functions.invoke("getSubscription", {});
      if (res.data?.tier) setCurrentTier(res.data.tier);
      setIntimacyPackage(res.data?.intimacy_package || false);
      setCreditBalance(res.data?.credit_balance || 0);
      setMinutesUsed(res.data?.video_minutes_used || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const confirmSession = async (sessionId) => {
    try {
      const res = await base44.functions.invoke("confirmSubscription", { session_id: sessionId });
      if (res.data?.tier) {
        setCurrentTier(res.data.tier);
      }
      if (res.data?.tier || res.data?.credit_added) {
        setSuccess(true);
      }
      if (res.data?.new_balance !== undefined) {
        setCreditBalance(res.data.new_balance);
      }
    } catch (err) {
      console.error(err);
      loadSubscription();
    }
  };

  const handlePurchaseAddon = async (duration) => {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) {
      window.location.href = "/login";
      return;
    }

    setAddonLoading(duration);
    try {
      const res = await base44.functions.invoke("createCheckout", {
        addon: "intimacy",
        duration,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error(err);
      setAddonLoading(null);
    }
  };

  const handlePurchaseTopUp = async (packId) => {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) {
      window.location.href = "/login";
      return;
    }

    setTopupLoading(packId);
    try {
      const res = await base44.functions.invoke("createCheckout", {
        addon: "topup",
        duration: packId,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error(err);
      setTopupLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setBillingLoading(true);
    try {
      const res = await base44.functions.invoke("manageBilling", {});
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error(err);
      setBillingLoading(false);
    }
  };

  const handleUpgrade = async (tierId) => {
    if (tierId === "free") {
      window.location.href = "/login";
      return;
    }

    const authed = await base44.auth.isAuthenticated();
    if (!authed) {
      window.location.href = "/login";
      return;
    }

    setLoading(tierId);
    try {
      const res = await base44.functions.invoke("createCheckout", { tier: tierId });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error(err);
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-heading text-lg font-semibold tracking-tight">GLIMR</span>
        </Link>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </header>

      {success ? (
        <div className="flex flex-col items-center justify-center py-24 px-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-semibold mb-2">You're all set</h1>
          <p className="text-muted-foreground mb-8 text-center">
            Your purchase is complete. Your companion is waiting.
          </p>
          <Link
            to="/"
            className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm"
          >
            Start chatting
          </Link>
        </div>
      ) : (
        <>
          <section className="px-6 pt-12 pb-8 text-center">
            <h1 className="font-heading text-4xl sm:text-5xl font-semibold tracking-tight mb-4">
              Choose your experience
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto leading-relaxed">
              From casual conversation to the deepest connection you've ever felt.
            </p>
            {currentTier !== "free" && (
              <button
                onClick={handleManageBilling}
                disabled={billingLoading}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors disabled:opacity-50"
              >
                <Settings className="w-4 h-4" />
                {billingLoading ? "Loading…" : "Manage or cancel subscription"}
              </button>
            )}
          </section>

          <section className="px-6 pb-24">
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
              {TIERS.map((tier) => (
                <TierCard
                  key={tier.id}
                  tier={tier}
                  current={currentTier === tier.id}
                  loading={loading === tier.id}
                  onUpgrade={() => handleUpgrade(tier.id)}
                />
              ))}
            </div>
          </section>

          <section className="px-6 pb-12">
            <div className="max-w-3xl mx-auto">
              <TopUpCard
                creditBalance={creditBalance}
                onPurchase={handlePurchaseTopUp}
                loading={topupLoading}
              />
            </div>
          </section>

          <section className="px-6 pb-24">
            <div className="max-w-3xl mx-auto">
              <IntimacyAddOnCard
                included={intimacyPackage}
                creditBalance={creditBalance}
                loading={addonLoading}
                onPurchase={handlePurchaseAddon}
                minutesUsed={minutesUsed}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}