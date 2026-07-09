import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useGoBack } from "@/hooks/useGoBack";
import { ArrowLeft, Loader2, LogOut, Trash2, CreditCard, Mail, User, Crown, Settings } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const TIER_LABELS = {
  free: "Free",
  plus: "Plus",
  pro: "Pro",
  vip: "VIP",
};

export default function Account() {
  const goBack = useGoBack();
  const [profile, setProfile] = useState(null);
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.auth.me(),
      base44.functions.invoke("getSubscription", {}),
    ])
      .then(([userRes, subRes]) => {
        setProfile(userRes);
        setSub(subRes?.data || null);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleManageBilling = async () => {
    setBillingLoading(true);
    try {
      const res = await base44.functions.invoke("manageBilling", {});
      if (res.data?.url) window.location.href = res.data.url;
    } catch (err) {
      console.error(err);
    } finally {
      setBillingLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await base44.auth.logout("/login");
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await base44.functions.invoke("deleteAccount", {});
      await base44.auth.logout("/login");
    } catch (err) {
      console.error(err);
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const tier = sub?.tier || "free";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header
        className="hidden md:flex px-6 py-5 items-center justify-between border-b border-border"
        style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}
      >
        <Link to="/" className="flex items-center gap-2">
          <img
            src="https://media.base44.com/images/public/6a4ad4122d2c58f83324b2ce/d15eaf582_glimr_logo.png"
            alt="GLIMR"
            className="h-8 w-auto rounded-md"
          />
        </Link>
        <button
          onClick={goBack}
          className="flex items-center gap-1.5 min-h-[44px] text-sm text-muted-foreground hover:text-foreground transition-colors select-none"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-8 pb-24">
        <h1 className="font-heading text-3xl font-semibold tracking-tight mb-1">Account</h1>
        <p className="text-sm text-muted-foreground mb-8">Manage your profile, subscription, and settings.</p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Profile */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                  <User className="w-4.5 h-4.5 text-muted-foreground" />
                </div>
                <h2 className="font-heading text-lg font-semibold">Profile</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    Name
                  </span>
                  <span className="text-sm font-medium">{profile?.full_name || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    Email
                  </span>
                  <span className="text-sm font-medium break-all">{profile?.email || "—"}</span>
                </div>
              </div>
            </section>

            {/* Subscription */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Crown className="w-4.5 h-4.5 text-primary" />
                </div>
                <h2 className="font-heading text-lg font-semibold">Subscription</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current plan</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {TIER_LABELS[tier] || tier}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Credit balance</span>
                  <span className="text-sm font-medium">${sub?.credit_balance ?? 0}</span>
                </div>
                {sub?.current_period_end && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Renews</span>
                    <span className="text-sm font-medium">
                      {new Date(sub.current_period_end).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {tier !== "free" && (
                  <button
                    onClick={handleManageBilling}
                    disabled={billingLoading}
                    className="inline-flex items-center gap-2 min-h-[44px] w-full justify-center mt-2 px-5 py-2.5 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    {billingLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    Manage subscription
                  </button>
                )}
                {tier === "free" && (
                  <Link
                    to="/pricing"
                    className="inline-flex items-center gap-2 min-h-[44px] w-full justify-center mt-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Upgrade plan
                  </Link>
                )}
              </div>
            </section>

            {/* Settings */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                  <Settings className="w-4.5 h-4.5 text-muted-foreground" />
                </div>
                <h2 className="font-heading text-lg font-semibold">Settings</h2>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="inline-flex items-center gap-2 min-h-[44px] w-full justify-start px-4 py-2.5 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  Log out
                </button>

                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <Trash2 className="w-4.5 h-4.5 text-destructive" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-semibold">Delete account</h3>
                      <p className="text-xs text-muted-foreground">Permanently remove your account and all data</p>
                    </div>
                  </div>
                  <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <AlertDialogTrigger asChild>
                      <button className="flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-full border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                        Delete account
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all your data, including:
                          <ul className="mt-3 space-y-1 text-sm">
                            <li>&bull; All conversations and messages</li>
                            <li>&bull; All memories your companions have of you</li>
                            <li>&bull; All personality notes</li>
                            <li>&bull; All custom companions</li>
                            <li>&bull; Subscription and billing data</li>
                          </ul>
                          <span className="block mt-3 font-medium text-destructive">This action cannot be undone.</span>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => { e.preventDefault(); handleDeleteAccount(); }}
                          disabled={deleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete everything"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}