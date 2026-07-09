import { useMemo, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import {
  BadgeDollarSign,
  CreditCard,
  Gift,
  KeyRound,
  LogOut,
  Mail,
  Settings,
  ShieldCheck,
  Sparkles,
  ScrollText,
  User,
  UserRoundCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteNav, siteHref } from "@/components/SiteChrome";
import { useSubscription } from "@/hooks/use-subscription";

type AccountProfile = {
  fullName: string;
  country: string;
  timezone: string;
  birthday: string;
};

const defaultProfile: AccountProfile = {
  fullName: "",
  country: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  birthday: "",
};

function loadProfile(email: string | null): AccountProfile {
  if (!email) return defaultProfile;
  try {
    const raw = localStorage.getItem(`glimr_account_profile_${email}`);
    return raw ? { ...defaultProfile, ...(JSON.parse(raw) as Partial<AccountProfile>) } : defaultProfile;
  } catch {
    return defaultProfile;
  }
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-lg border border-white/8 bg-card p-5">
      <Icon className="mb-4 h-5 w-5 text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-light">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </article>
  );
}

function ToggleRow({ title, body, defaultChecked }: { title: string; body: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked ?? false);
  return (
    <label className="flex items-start justify-between gap-4 rounded-lg border border-white/8 bg-secondary/30 p-4">
      <span>
        <span className="block font-medium">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-muted-foreground">{body}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => setChecked(event.target.checked)}
        className="mt-1 h-5 w-5 accent-primary"
      />
    </label>
  );
}

export default function Account() {
  const [, navigate] = useLocation();
  const subscription = useSubscription();
  const email = subscription.status.email ?? localStorage.getItem("companion_email");
  const [profile, setProfile] = useState<AccountProfile>(() => loadProfile(email));
  const [saved, setSaved] = useState(false);

  const planName = subscription.status.active
    ? subscription.status.tier === "flame"
      ? "Flame"
      : "Spark"
    : "Free";

  const voiceDetail = useMemo(() => {
    if (!subscription.status.active) return "Upgrade to unlock voice replies.";
    if (subscription.status.voiceRemaining === null) return "Unlimited voice replies on this plan.";
    return `${subscription.status.voiceRemaining} of ${subscription.status.voiceLimit ?? 0} voice replies remaining.`;
  }, [subscription.status.active, subscription.status.voiceLimit, subscription.status.voiceRemaining]);

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (email) localStorage.setItem(`glimr_account_profile_${email}`, JSON.stringify(profile));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const handleSignOut = () => {
    subscription.signOut();
    navigate("/");
  };

  if (!email) {
    return (
      <div className="min-h-[100dvh] bg-background text-foreground">
        <SiteNav />
        <main className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col items-center justify-center px-5 text-center">
          <KeyRound className="mb-5 h-10 w-10 text-primary" />
          <h1 className="text-4xl font-light">Sign in to view your account.</h1>
          <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
            Customers need one place to manage plan status, credits, billing, settings, and account details.
          </p>
          <Button asChild className="mt-6">
            <a href={siteHref("/login")}>Sign in</a>
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.25em] text-primary/70">
              Account dashboard
            </p>
            <h1 className="text-4xl font-light leading-tight md:text-5xl">Welcome back.</h1>
            <p className="mt-3 flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              {email}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <a href={siteHref("/")}>Open companions</a>
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard
            icon={Sparkles}
            label="Current plan"
            value={planName}
            detail={subscription.status.active ? "Subscription active." : "Free account active."}
          />
          <StatCard icon={Wallet} label="Balance" value="$0.00" detail="Available account balance." />
          <StatCard icon={BadgeDollarSign} label="Credits" value="$0.00" detail="Top-up credit for paid sessions." />
          <StatCard icon={Gift} label="Bonus" value="$0.00" detail="Promos and referral bonuses appear here." />
        </section>

        <section className="mt-6 rounded-lg border border-primary/20 bg-primary/10 p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <UserRoundCheck className="mt-1 h-6 w-6 text-primary" />
              <div>
                <h2 className="text-2xl font-light">Speak to a human</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Offer paid human sessions at a premium rate. The human operator can use the Lensflow-style
                  teleprompter to keep the conversation structured, safe, and consistent.
                </p>
              </div>
            </div>
            <Button asChild>
              <a href={siteHref("/human-session")}>
                <ScrollText className="h-4 w-4" />
                Human sessions
              </a>
            </Button>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-white/8 bg-card p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-light">Feature access</h2>
                <p className="mt-1 text-sm text-muted-foreground">What this customer can use right now.</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <a href={siteHref("/pricing")}>Change plan</a>
              </Button>
            </div>
            <div className="grid gap-3">
              {[
                ["Text chat", "Included on every plan"],
                ["Voice replies", voiceDetail],
                ["Custom companion", subscription.canUseCustomPersona ? "Unlocked" : "Spark or Flame required"],
                ["Video calls", subscription.canUseVideoCall ? "Unlocked" : "Flame required"],
                ["Human sessions", "Premium paid add-on with teleprompter-guided operators"],
                ["Activities and games", "Available in the companion experience"],
              ].map(([title, body]) => (
                <div key={title} className="flex items-start justify-between gap-4 rounded-lg bg-secondary/30 p-4">
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
                  </div>
                  <ShieldCheck className="mt-1 h-4 w-4 text-primary" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/8 bg-card p-6">
            <CreditCard className="mb-4 h-5 w-5 text-primary" />
            <h2 className="text-2xl font-light">Billing and card details</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Card details are edited through the secure billing portal. GLIMR shows plan, balance, credits,
              and receipts without exposing full card numbers.
            </p>
            <div className="mt-5 grid gap-3">
              <Button onClick={subscription.openPortal} disabled={!email}>
                Manage payment method
              </Button>
              <Button asChild variant="outline">
                <a href={siteHref("/pricing")}>Add credit or upgrade</a>
              </Button>
              <a className="text-center text-sm text-muted-foreground hover:text-foreground" href="mailto:hello@glimr.com.au">
                Billing support
              </a>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleSave} className="rounded-lg border border-white/8 bg-card p-6">
            <User className="mb-4 h-5 w-5 text-primary" />
            <h2 className="text-2xl font-light">Account details</h2>
            <div className="mt-5 grid gap-4">
              {[
                ["Full name", "fullName", "Your name"],
                ["Country", "country", "Australia"],
                ["Timezone", "timezone", "Australia/Perth"],
                ["Birthday", "birthday", "MM-DD"],
              ].map(([label, key, placeholder]) => (
                <label key={key} className="block space-y-2">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <input
                    value={profile[key as keyof AccountProfile]}
                    onChange={(event) => setProfile({ ...profile, [key]: event.target.value })}
                    placeholder={placeholder}
                    className="h-11 w-full rounded-lg border border-white/10 bg-secondary/50 px-3 text-sm outline-none focus:border-primary/50"
                  />
                </label>
              ))}
            </div>
            <Button className="mt-5 w-full">Save account details</Button>
            {saved && <p className="mt-3 text-center text-sm text-primary">Saved.</p>}
          </form>

          <div className="rounded-lg border border-white/8 bg-card p-6">
            <Settings className="mb-4 h-5 w-5 text-primary" />
            <h2 className="text-2xl font-light">Settings</h2>
            <div className="mt-5 grid gap-3">
              <ToggleRow
                title="Memory"
                body="Let companions use saved memories and personal details in future conversations."
                defaultChecked
              />
              <ToggleRow
                title="Voice replies"
                body="Use voice when your plan includes it and monthly limits allow it."
                defaultChecked={subscription.canUseVoice}
              />
              <ToggleRow
                title="Product updates"
                body="Receive important launch, billing, bonus, and feature emails."
              />
              <ToggleRow
                title="VIP invitations"
                body="Allow GLIMR to contact you about VIP access or custom companion setup."
              />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
