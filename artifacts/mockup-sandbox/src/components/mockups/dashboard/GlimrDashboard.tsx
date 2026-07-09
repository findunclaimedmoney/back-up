import {
  User, Settings, CreditCard, Zap, Gift, Bell, Shield, LogOut,
  MessageCircle, Mic, Video, Camera, Gamepad2, Crown, Star,
  TrendingUp, Clock, ChevronRight, Wallet, Receipt, Heart,
  Sparkles, Lock, Eye, Trash2, Download, Moon, Sun,
  Globe, Mail, Phone, MapPin, Calendar, CheckCircle2
} from "lucide-react";

const user = {
  name: "Jordan",
  email: "jordan@email.com",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
  tier: "Premium",
  memberSince: "Jan 2026",
  credits: 247,
  creditsUsed: 53,
  nextBilling: "Aug 15, 2026",
};

const companions = [
  { name: "Mia", status: "active", lastChat: "2 mins ago", unread: 3, image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face" },
  { name: "Alex", status: "away", lastChat: "Yesterday", unread: 0, image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face" },
  { name: "Luna", status: "active", lastChat: "3 hrs ago", unread: 1, image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face" },
];

const stats = [
  { label: "Messages", value: "1,247", icon: MessageCircle, trend: "+12%" },
  { label: "Voice Minutes", value: "84", icon: Mic, trend: "+8%" },
  { label: "Video Calls", value: "23", icon: Video, trend: "+24%" },
  { label: "Selfies", value: "156", icon: Camera, trend: "+5%" },
];

const features = [
  { icon: MessageCircle, label: "Text Chat", enabled: true, tier: "Free" },
  { icon: Mic, label: "Voice Replies", enabled: true, tier: "Free" },
  { icon: Video, label: "Live Video", enabled: true, tier: "Premium" },
  { icon: Camera, label: "Selfie Photos", enabled: true, tier: "Premium" },
  { icon: Gamepad2, label: "Games", enabled: false, tier: "Elite" },
  { icon: Sparkles, label: "Custom Companion", enabled: false, tier: "Elite" },
  { icon: Heart, label: "Intimacy Mode", enabled: false, tier: "VIP" },
  { icon: Crown, label: "VIP Lounge", enabled: false, tier: "VIP" },
];

const transactions = [
  { date: "Jul 8", desc: "Premium Monthly", amount: -89.00, type: "subscription" },
  { date: "Jul 5", desc: "Credit Top-up", amount: 50.00, type: "credit" },
  { date: "Jul 2", desc: "Voice Pack (100 min)", amount: -15.00, type: "usage" },
  { date: "Jun 28", desc: "Referral Bonus", amount: 25.00, type: "bonus" },
];

const bonuses = [
  { label: "7-Day Streak", desc: "Chat 7 days in a row", progress: 5, total: 7, reward: "+10 credits" },
  { label: "Voice Explorer", desc: "Send 50 voice messages", progress: 34, total: 50, reward: "+20 credits" },
  { label: "Photo Fan", desc: "Receive 100 selfies", progress: 89, total: 100, reward: "+15 credits" },
];

export function GlimrDashboard() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">
      {/* Top Nav */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#0d0d14]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full border border-[#d4a853]/40 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-[#d4a853]" />
          </div>
          <span className="text-base font-semibold tracking-wide text-[#d4a853]">GLIMR</span>
        </div>
        <div className="flex items-center gap-6 text-[13px] text-white/50">
          <span className="text-white/80">Dashboard</span>
          <span>Companions</span>
          <span>Memory</span>
          <span>Notes</span>
          <span>Games</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg hover:bg-white/5 text-white/40">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-400" />
          </button>
          <div className="flex items-center gap-2 pl-3 border-l border-white/10">
            <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
            <span className="text-[13px] font-medium">{user.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#d4a853]/15 text-[#d4a853]">{user.tier}</span>
          </div>
        </div>
      </nav>

      <div className="p-6 max-w-[1400px] mx-auto space-y-5">
        {/* Hero greeting */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/30 font-mono mb-1">Good evening</p>
            <h1 className="text-2xl font-semibold">Welcome back, {user.name}</h1>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#d4a853]/20 bg-[#d4a853]/5">
            <Wallet className="w-4 h-4 text-[#d4a853]" />
            <span className="text-sm font-semibold text-[#d4a853]">{user.credits} credits</span>
            <span className="text-[10px] text-white/30 ml-1">{user.creditsUsed} used this month</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-[#111118] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#d4a853]/10 flex items-center justify-center">
                  <s.icon className="w-4 h-4 text-[#d4a853]" />
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">{s.trend}</span>
              </div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-[11px] text-white/30 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-12 gap-5">
          {/* Left: Companions */}
          <div className="col-span-3 space-y-4">
            <div className="rounded-xl border border-white/[0.06] bg-[#111118] p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                Your Companions
              </h3>
              <div className="space-y-2.5">
                {companions.map((c) => (
                  <div key={c.name} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                    <div className="relative">
                      <img src={c.image} alt={c.name} className="w-10 h-10 rounded-full object-cover" />
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#111118] ${c.status === "active" ? "bg-emerald-400" : "bg-white/20"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-[11px] text-white/30">{c.lastChat}</p>
                    </div>
                    {c.unread > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#d4a853] text-[#0a0a0f] text-[10px] font-bold min-w-[18px] text-center">
                        {c.unread}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 py-2 rounded-lg border border-dashed border-white/10 text-white/30 text-xs hover:border-[#d4a853]/30 hover:text-[#d4a853] transition-colors">
                + Add companion
              </button>
            </div>

            {/* Quick actions */}
            <div className="rounded-xl border border-white/[0.06] bg-[#111118] p-4">
              <h3 className="text-sm font-semibold mb-3">Quick Start</h3>
              <div className="space-y-1.5">
                {[
                  { icon: MessageCircle, label: "Continue with Mia" },
                  { icon: Mic, label: "Voice message to Alex" },
                  { icon: Video, label: "Video call Luna" },
                  { icon: Camera, label: "Request a selfie" },
                ].map((a) => (
                  <button key={a.label} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 text-left text-[13px] text-white/60 hover:text-white transition-colors">
                    <a.icon className="w-3.5 h-3.5 text-[#d4a853]" />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Features & Account */}
          <div className="col-span-6 space-y-4">
            {/* Features grid */}
            <div className="rounded-xl border border-white/[0.06] bg-[#111118] p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Features & Access
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {features.map((f) => (
                  <div
                    key={f.label}
                    className={`relative p-3 rounded-xl border text-center transition-all ${
                      f.enabled
                        ? "border-[#d4a853]/20 bg-[#d4a853]/5"
                        : "border-white/[0.04] bg-white/[0.02] opacity-50"
                    }`}
                  >
                    <f.icon className={`w-5 h-5 mx-auto mb-1.5 ${f.enabled ? "text-[#d4a853]" : "text-white/20"}`} />
                    <p className="text-[11px] font-medium">{f.label}</p>
                    <p className="text-[9px] text-white/20 mt-0.5">{f.tier}</p>
                    {f.enabled && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 absolute top-2 right-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Account overview */}
            <div className="rounded-xl border border-white/[0.06] bg-[#111118] p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-blue-400" />
                Account Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Mail, label: "Email", value: user.email },
                  { icon: Globe, label: "Region", value: "Australia (AUD)" },
                  { icon: Calendar, label: "Member Since", value: user.memberSince },
                  { icon: Crown, label: "Plan", value: `${user.tier} ($89/mo)` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                    <item.icon className="w-4 h-4 text-white/20" />
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">{item.label}</p>
                      <p className="text-[13px] font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Credit transactions */}
            <div className="rounded-xl border border-white/[0.06] bg-[#111118] p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Receipt className="w-3.5 h-3.5 text-purple-400" />
                Recent Transactions
              </h3>
              <div className="space-y-2">
                {transactions.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        t.amount > 0 ? "bg-emerald-400/10" : "bg-rose-400/10"
                      }`}>
                        {t.amount > 0 ? (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Receipt className="w-3.5 h-3.5 text-rose-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium">{t.desc}</p>
                        <p className="text-[10px] text-white/30">{t.date} · {t.type}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${t.amount > 0 ? "text-emerald-400" : "text-white/60"}`}>
                      {t.amount > 0 ? "+" : ""}${Math.abs(t.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Settings, bonuses, billing */}
          <div className="col-span-3 space-y-4">
            {/* Settings shortcuts */}
            <div className="rounded-xl border border-white/[0.06] bg-[#111118] p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-white/50" />
                Settings
              </h3>
              <div className="space-y-1">
                {[
                  { icon: User, label: "Profile" },
                  { icon: CreditCard, label: "Payment Methods" },
                  { icon: Shield, label: "Privacy & Security" },
                  { icon: Bell, label: "Notifications" },
                  { icon: Eye, label: "Data & Memory" },
                  { icon: Lock, label: "Change Password" },
                ].map((s) => (
                  <button key={s.label} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 text-left transition-colors group">
                    <span className="flex items-center gap-2.5 text-[13px] text-white/60 group-hover:text-white">
                      <s.icon className="w-3.5 h-3.5" />
                      {s.label}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-white/10 group-hover:text-white/30" />
                  </button>
                ))}
              </div>
            </div>

            {/* Billing card */}
            <div className="rounded-xl border border-[#d4a853]/15 bg-gradient-to-br from-[#1a1408] to-[#0f0d1a] p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-[#d4a853]">
                <Crown className="w-3.5 h-3.5" />
                Your Plan
              </h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-white/60">Premium Monthly</span>
                  <span className="text-sm font-semibold">$89/mo</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-white/60">Next billing</span>
                  <span className="text-[13px]">{user.nextBilling}</span>
                </div>
                <div className="h-px bg-white/5 my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-white/60">Payment method</span>
                  <span className="text-[12px] text-white/40 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> •••• 4242
                  </span>
                </div>
              </div>
              <button className="w-full mt-3 py-2 rounded-lg bg-[#d4a853]/10 text-[#d4a853] text-xs font-medium hover:bg-[#d4a853]/20 transition-colors">
                Manage Subscription
              </button>
            </div>

            {/* Bonus progress */}
            <div className="rounded-xl border border-white/[0.06] bg-[#111118] p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Gift className="w-3.5 h-3.5 text-pink-400" />
                Bonuses
              </h3>
              <div className="space-y-3">
                {bonuses.map((b) => (
                  <div key={b.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-medium">{b.label}</span>
                      <span className="text-[10px] text-[#d4a853]">{b.reward}</span>
                    </div>
                    <p className="text-[10px] text-white/30 mb-1.5">{b.desc}</p>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#d4a853] to-[#f0c96e]"
                        style={{ width: `${(b.progress / b.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-white/20 mt-1 text-right">{b.progress}/{b.total}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger zone */}
            <div className="rounded-xl border border-white/[0.06] bg-[#111118] p-4">
              <h3 className="text-sm font-semibold mb-2 text-white/30">Danger Zone</h3>
              <div className="space-y-1.5">
                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-left text-[12px] text-white/40 hover:text-white/60 transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  Export my data
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-400/10 text-left text-[12px] text-rose-400/60 hover:text-rose-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
