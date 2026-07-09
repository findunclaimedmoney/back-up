import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CreditCard, Loader2, Sparkles, Film, Video, ExternalLink, AlertCircle, Wallet, Coins } from "lucide-react";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
  prices: Array<{ id: string; unit_amount: number; currency: string }>;
}

interface Subscription {
  status: string;
  current_period_end?: number;
}

const PLAN_META: Record<string, { icon: typeof Film; color: string; highlight: boolean }> = {
  Starter:   { icon: Film,     color: "text-muted-foreground", highlight: false },
  Elite:     { icon: Video,    color: "text-primary",          highlight: true  },
  Concierge: { icon: Sparkles, color: "text-amber-400",        highlight: false },
};

export default function Billing() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const selectedPlan = params.get("plan") ?? null; // 'starter' | 'elite' | 'concierge'
  const isSuccess = params.get("success") === "1";

  const [plans, setPlans]               = useState<Plan[]>([]);
  const [sub, setSub]                   = useState<Subscription | null>(null);
  const [currentPlan, setCurrentPlan]   = useState<string | null>(null);
  const [loading, setLoading]           = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading]     = useState(false);
  const [creditBalance, setCreditBalance]     = useState<number | null>(null);
  const [creditLoading, setCreditLoading]     = useState(true);
  const [creditCheckoutLoading, setCreditCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [plansRes, subRes, creditsRes] = await Promise.all([
          fetch("/api/stripe/plans"),
          fetch("/api/stripe/subscription", { credentials: "include" }),
          fetch("/api/credits/balance", { credentials: "include" }),
        ]);
        if (plansRes.ok) {
          const d = await plansRes.json();
          setPlans(d.plans ?? []);
        }
        if (subRes.ok) {
          const d = await subRes.json();
          setSub(d.subscription ?? null);
          setCurrentPlan(d.planName ?? null);
        }
        if (creditsRes.ok) {
          const d = await creditsRes.json();
          setCreditBalance(d.balance ?? 0);
        }
      } finally {
        setLoading(false);
        setCreditLoading(false);
      }
    }
    load();
  }, []);

  async function handleCreditCheckout(packId: string, packLabel: string) {
    setCreditCheckoutLoading(packLabel);
    try {
      const res = await fetch("/api/stripe/credit-checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to start checkout");
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
      setCreditCheckoutLoading(null);
    }
  }

  async function handleCheckout(priceId: string, planName: string) {
    setCheckoutLoading(planName);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to start checkout");
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
      setCheckoutLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to open billing portal");
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
      setPortalLoading(false);
    }
  }

  const activePlan = plans.find(
    (p) => p.metadata?.plan === currentPlan || p.name.toLowerCase() === currentPlan?.toLowerCase()
  );

  const preselected = selectedPlan
    ? plans.find(
        (p) =>
          p.metadata?.plan === selectedPlan ||
          p.name.toLowerCase() === selectedPlan.toLowerCase()
      )
    : null;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Success banner */}
        {isSuccess && (
          <div className="mb-8 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-6 py-4">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm font-medium text-foreground">
              Payment successful! Your plan has been activated. It may take a few seconds to reflect below.
            </p>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold font-serif mb-2">Billing</h1>
          <p className="text-muted-foreground">
            Manage your LensFlow subscription and payment details.
          </p>
        </div>

        {/* Current subscription */}
        {!loading && (sub || currentPlan) && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-card p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Current Plan</div>
                <div className="text-2xl font-bold font-serif">
                  {activePlan?.name ?? currentPlan ?? "Active"}
                </div>
                {sub?.status && (
                  <div className={`inline-flex items-center gap-1.5 text-xs font-medium mt-1 px-2 py-0.5 rounded-full
                    ${sub.status === "active" ? "bg-primary/15 text-primary" : "bg-amber-400/15 text-amber-400"}`}>
                    {sub.status === "active" ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                    {sub.status}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                onClick={handlePortal}
                disabled={portalLoading}
                className="rounded-full"
              >
                {portalLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Manage Billing
              </Button>
            </div>
          </div>
        )}

        {/* Plan cards */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Plans are loading — please try again in a moment.</p>
          </div>
        ) : (
          <>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
              {currentPlan ? "Change Plan" : "Choose a Plan"}
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {plans
                .filter((p) => p.prices.length > 0)
                .sort((a, b) => (a.prices[0]?.unit_amount ?? 0) - (b.prices[0]?.unit_amount ?? 0))
                .map((plan) => {
                  const price = plan.prices[0];
                  const meta = PLAN_META[plan.name] ?? PLAN_META["Starter"];
                  const Icon = meta.icon;
                  const isCurrent = plan.metadata?.plan === currentPlan || plan.name.toLowerCase() === currentPlan?.toLowerCase();
                  const isPreselected = plan.metadata?.plan === selectedPlan || plan.name.toLowerCase() === selectedPlan?.toLowerCase();
                  const isLoading = checkoutLoading === plan.name;

                  return (
                    <div
                      key={plan.id}
                      className={`rounded-2xl border p-6 flex flex-col transition-all ${
                        isCurrent
                          ? "border-primary/50 bg-primary/5"
                          : isPreselected
                          ? "border-primary/30 bg-primary/5 ring-1 ring-primary/30"
                          : "border-white/10 bg-card hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${meta.highlight ? "bg-primary/20" : "bg-white/5"}`}>
                          <Icon className={`w-4 h-4 ${meta.color}`} size={16} />
                        </div>
                        <span className="font-semibold font-serif text-lg">{plan.name}</span>
                      </div>

                      <div className="mb-3">
                        <span className="text-3xl font-bold">
                          ${price ? (price.unit_amount / 100).toFixed(0) : "—"}
                        </span>
                        <span className="text-muted-foreground text-sm">/mo {price?.currency?.toUpperCase()}</span>
                      </div>

                      <p className="text-xs text-muted-foreground mb-5 flex-1">{plan.description}</p>

                      {isCurrent ? (
                        <Button disabled variant="outline" className="rounded-full w-full">
                          <CheckCircle2 className="w-4 h-4 mr-2 text-primary" /> Current plan
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleCheckout(price.id, plan.name)}
                          disabled={!!checkoutLoading}
                          className={`rounded-full w-full ${
                            meta.highlight
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "bg-white/10 hover:bg-white/20 text-foreground"
                          }`}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>Subscribe</>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              Secured by Stripe · Cancel or change plans anytime · Prices in AUD
            </p>
          </>
        )}

        {/* Credit Packs */}
        <div className="mt-10">
          <div className="mb-4">
            <h2 className="text-xl font-bold font-serif mb-1">Credit Packs</h2>
            <p className="text-sm text-muted-foreground">
              Buy credits to use on AI features, extra renders, and premium exports.
              {creditBalance !== null && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-mono" style={{ color: "#f59e0b" }}>
                  <Wallet className="w-3 h-3" /> {creditBalance} credits available
                </span>
              )}
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { id: "starter", label: "Starter Pack", credits: 100, price: 29, desc: "Great for testing the pipeline" },
              { id: "pro", label: "Pro Pack", credits: 500, price: 99, desc: "Best value for regular agents" },
              { id: "agency", label: "Agency Pack", credits: 2000, price: 299, desc: "For teams with high volume" },
            ].map((pack) => {
              const isLoading = creditCheckoutLoading === pack.label;
              return (
                <div key={pack.id} className="rounded-2xl border border-white/10 bg-card p-5 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="font-semibold">{pack.label}</span>
                  </div>
                  <div className="mb-1">
                    <span className="text-2xl font-bold">${pack.price}</span>
                    <span className="text-muted-foreground text-sm"> AUD</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 flex-1">{pack.desc}</p>
                  <div className="text-xs font-mono text-amber-400 mb-3">{pack.credits.toLocaleString()} credits</div>
                  <Button
                    onClick={() => handleCreditCheckout(pack.id, pack.label)}
                    disabled={!!creditCheckoutLoading}
                    className="rounded-full w-full bg-white/10 hover:bg-white/20 text-foreground"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buy Credits"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
