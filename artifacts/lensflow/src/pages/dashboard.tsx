import React, { useState, useEffect } from "react";
import { useGetJobStats, useGetMarketBrief, useRefreshMarketBrief, getGetMarketBriefQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  ChevronDown, TrendingUp, TrendingDown, Minus, RefreshCw, MapPin,
  MessageSquare, BarChart2, Play, Sparkles, Link2, ImageIcon, Video,
  Mic, ArrowRight, Clock, Globe, CheckCircle2, DollarSign, Zap,
  ChevronRight, Wallet, History,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";

// ── V2 Premium palette ────────────────────────────────────────────────────────────────
const C = {
  bg:        "#070710",
  panel:     "#0d0d18",
  card:      "#10162a",
  line:      "#1a1a2e",
  gold:      "#f59e0b",
  goldDark:  "#d97706",
  goldLight: "#fbbf24",
  ink:       "#f9f3ea",
  text:      "#e5e7eb",
  muted:     "#6b7280",
  blue:      "#60a5fa",
  green:     "#34d399",
  purple:    "#a78bfa",
};

type Presenter = "Mia" | "Oliver" | "Sophie" | "James";

const PRESENTER_GRADIENT: Record<Presenter, string> = {
  Mia:    "linear-gradient(135deg, #151b31 0%, #2a1535 55%, #f59e0b 100%)",
  Oliver: "linear-gradient(135deg, #151b31 0%, #132a2a 55%, #f59e0b 100%)",
  Sophie: "linear-gradient(135deg, #151b31 0%, #1f1535 55%, #d97706 100%)",
  James:  "linear-gradient(135deg, #151b31 0%, #152235 55%, #f59e0b 100%)",
};

const PRESENTER_DESC: Record<Presenter, string> = {
  Mia:    "Polished, warm and premium. Best for luxury homes and prestige brand campaigns.",
  Oliver: "Confident, refined, direct. Best for market updates and high-value appraisals.",
  Sophie: "Approachable and modern. Best for social-first residential campaigns.",
  James:  "Authoritative and sharp. Best for prestige, coastal and inner-city listings.",
};

const PROPERTY_IMAGES = [
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=82",
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ── Credit hooks (manual fetch until codegen) ────────────────────────────────────────────
function useCreditBalance() {
  const [balance, setBalance] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  useEffect(() => {
    fetch("/api/credits/balance", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setBalance(d.balance); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return { balance, loading };
}

interface CreditTx {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
}

function useCreditTransactions() {
  const [txs, setTxs] = React.useState<CreditTx[]>([]);
  const [loading, setLoading] = React.useState(true);
  useEffect(() => {
    fetch("/api/credits/transactions", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.transactions) setTxs(d.transactions); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return { txs, loading };
}

// ── Trend icon helper ────────────────────────────────────────────────────────────────────────────
function TrendIcon({ trend }: { trend: string }) {
  const cls = "w-3.5 h-3.5";
  if (trend === "up") return <TrendingUp className={cls} style={{ color: C.green }} />;
  if (trend === "down") return <TrendingDown className={cls} style={{ color: "#f87171" }} />;
  return <Minus className={cls} style={{ color: C.muted }} />;
}

// ── Main Dashboard ───────────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: stats, isLoading } = useGetJobStats();
  const { user } = useAuth();
  const { balance: creditBalance } = useCreditBalance();
  const firstName = user?.firstName ?? user?.email?.split("@")[0] ?? null;
  const [selectedPresenter, setSelectedPresenter] = useState<Presenter>("Mia");

  const completed = stats?.complete ?? 0;

  if (isLoading) {
    return (
      <div className="p-6 space-y-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl animate-pulse" style={{ height: i === 1 ? 260 : 96, background: C.panel }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-mono" style={{ color: C.muted }}>
            {getGreeting()}{firstName ? `, ${firstName}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {creditBalance !== null && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono border" style={{ borderColor: C.line, background: C.panel, color: C.gold }}>
              <Wallet className="w-3.5 h-3.5" />
              {creditBalance} credits
            </div>
          )}
          <Link href="/jobs/new">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:scale-105" style={{ background: C.gold, color: "#000" }}>
              <Sparkles className="w-3.5 h-3.5" />
              New Campaign
            </button>
          </Link>
        </div>
      </div>

      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden border p-6 sm:p-8" style={{ borderColor: `${C.gold}25`, background: `linear-gradient(135deg, #0f0d1a 0%, #070710 50%, #0a0a14 100%)` }}>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" style={{ background: `${C.gold}08` }} />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full blur-3xl translate-y-1/2" style={{ background: `${C.purple}06` }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-[11px] font-mono uppercase tracking-widest" style={{ background: `${C.gold}10`, border: `1px solid ${C.gold}25`, color: C.gold }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.gold }} />
            AI Property Marketing
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none mb-3" style={{ color: C.ink }}>
            Your Property Marketing<br />
            <span style={{ color: C.gold }}>Operating System</span>
          </h1>
          <p className="text-sm leading-relaxed mb-5 max-w-lg" style={{ color: C.muted }}>
            From listing URL to professional presenter video with AI script, ElevenLabs voiceover, and full social media pack — in under 5 minutes.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/jobs/new">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all hover:scale-105" style={{ background: C.gold, color: "#000", boxShadow: `0 10px 30px ${C.gold}30` }}>
                <Sparkles className="w-4 h-4" />
                Generate Property Campaign
              </button>
            </Link>
            <Link href="/jobs">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors hover:border-white/20" style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                <Play className="w-4 h-4" />
                Watch Examples
              </button>
            </Link>
          </div>
        </div>

        {/* Quick actions row */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { icon: Link2, label: "Property URL", sub: "Paste listing" },
            { icon: ImageIcon, label: "Photo Campaign", sub: "Upload images" },
            { icon: Video, label: "Video Upload", sub: "Your footage" },
            { icon: Mic, label: "Teleprompter", sub: "Self-record mode" },
          ].map(({ icon: Icon, label, sub }) => (
            <Link key={label} href="/jobs/new">
              <div className="group flex items-center gap-3 p-3 rounded-xl border transition-all text-left cursor-pointer hover:border-opacity-30" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors" style={{ background: `${C.gold}10` }}>
                  <Icon className="w-4 h-4" style={{ color: C.gold }} />
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "#fff" }}>{label}</p>
                  <p className="text-[10px]" style={{ color: C.muted }}>{sub}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { title: "Campaigns Created", value: completed.toString(), sub: `${stats?.processing ?? 0} active`, icon: CheckCircle2, accent: C.gold },
          { title: "Scripts Generated", value: (stats?.scriptsGenerated ?? 0).toString(), sub: "AI written", icon: Zap, accent: C.blue },
          { title: "Hours Saved", value: `${stats?.timeSavedHours ?? 0}h`, sub: "vs manual", icon: Clock, accent: C.green },
          { title: "Credit Balance", value: creditBalance !== null ? `${creditBalance}` : "—", sub: "available", icon: DollarSign, accent: C.purple },
        ].map(({ title, value, sub, icon: Icon, accent }) => (
          <div key={title} className="rounded-xl p-4 relative overflow-hidden border" style={{ background: C.panel, borderColor: "rgba(255,255,255,0.04)" }}>
            <div className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}15` }}>
              <Icon className="w-4 h-4" style={{ color: accent }} />
            </div>
            <p className="text-[11px] font-mono uppercase tracking-wider mb-2" style={{ color: accent }}>{title}</p>
            <p className="text-2xl sm:text-3xl font-black font-mono mb-1" style={{ color: C.ink }}>{value}</p>
            <p className="text-[11px] font-mono" style={{ color: C.muted }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Main grid: campaigns + presenter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent Campaigns */}
        <div className="lg:col-span-2 rounded-xl border overflow-hidden" style={{ background: C.panel, borderColor: "rgba(255,255,255,0.04)" }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider" style={{ color: C.text }}>Recent Campaigns</span>
            <Link href="/jobs">
              <span className="text-xs font-mono cursor-pointer" style={{ color: C.gold }}>View all →</span>
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
            {(stats?.recentJobs?.length ?? 0) === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: `${C.gold}15`, border: `1px solid ${C.gold}25` }}>
                  <Play className="w-5 h-5" style={{ color: C.gold, marginLeft: 2 }} />
                </div>
                <p className="font-semibold mb-1" style={{ color: C.ink }}>No campaigns yet</p>
                <p className="text-sm mb-4" style={{ color: C.muted }}>Paste a property listing URL to get started.</p>
                <Link href="/jobs/new">
                  <button className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: C.gold, color: "#000" }}>Generate Your First Campaign</button>
                </Link>
              </div>
            ) : (
              (stats?.recentJobs ?? []).slice(0, 4).map((job) => {
                const statusColors: Record<string, string> = {
                  complete: C.gold,
                  processing: "#60a5fa",
                  queued: "#a78bfa",
                  failed: "#f87171",
                };
                const statusLabels: Record<string, string> = {
                  complete: "Ready",
                  processing: "Exporting",
                  queued: "Queued",
                  failed: "Failed",
                };
                const color = statusColors[job.status] ?? C.muted;
                const videoUrl = (job as unknown as { videoUrl?: string }).videoUrl;
                const hasVideo = job.status === "complete" && videoUrl;
                return (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <div className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] cursor-pointer transition-colors">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
                        {hasVideo ? <Play className="w-3 h-3" /> : (job.listingTitle?.[0] ?? "C")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: C.ink }}>{job.listingTitle || job.listingUrl || `Campaign ${job.id.slice(0, 8)}`}</p>
                        <p className="text-[11px] font-mono" style={{ color: C.muted }}>{job.status} · {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono border uppercase tracking-wider" style={{ background: `${color}10`, color, borderColor: `${color}25` }}>
                          {statusLabels[job.status] ?? job.status}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#374151" }} />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Presenter panel */}
          <div className="rounded-xl border p-4" style={{ background: C.panel, borderColor: "rgba(255,255,255,0.04)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider" style={{ color: C.gold }}>AI Presenters</span>
              <span className="text-[10px] font-mono border px-1.5 py-0.5 rounded" style={{ color: "#34d399", borderColor: "rgba(52,211,153,0.2)", background: "rgba(52,211,153,0.06)" }}>4 Ready</span>
            </div>
            <div className="space-y-2">
              {(["Mia", "Oliver", "Sophie", "James"] as Presenter[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPresenter(p)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left cursor-pointer"
                  style={{
                    background: selectedPresenter === p ? `${C.gold}10` : "rgba(255,255,255,0.02)",
                    borderColor: selectedPresenter === p ? `${C.gold}30` : "rgba(255,255,255,0.04)",
                  }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: PRESENTER_GRADIENT[p], border: `1px solid ${selectedPresenter === p ? C.gold : "rgba(255,255,255,0.1)"}` }}>
                    {p[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: selectedPresenter === p ? C.ink : C.text }}>{p}</p>
                    <p className="text-[11px] truncate" style={{ color: C.muted }}>{PRESENTER_DESC[p].split(". ")[0]}</p>
                  </div>
                  {selectedPresenter === p && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: C.gold }} />}
                </button>
              ))}
            </div>
            <Link href="/jobs/new">
              <button className="w-full mt-3 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-[1.02]" style={{ background: `linear-gradient(135deg, ${C.goldLight}, ${C.gold} 48%, ${C.goldDark})`, color: "#000", boxShadow: `0 8px 20px ${C.gold}22` }}>
                Generate with {selectedPresenter}
              </button>
            </Link>
          </div>

          {/* Marketing value */}
          <div className="rounded-xl border p-4" style={{ background: C.panel, borderColor: "rgba(255,255,255,0.04)" }}>
            <p className="text-xs font-mono font-semibold uppercase tracking-wider mb-3" style={{ color: C.gold }}>Marketing Value</p>
            <div className="space-y-3">
              {[
                { label: "Script Creation", val: 50 },
                { label: "Voiceover", val: 75 },
                { label: "Video Editing", val: 250 },
                { label: "Social Package", val: 150 },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between items-center pb-2 border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  <span className="text-sm" style={{ color: C.muted }}>{label}</span>
                  <strong className="font-extrabold" style={{ color: C.ink }}>${completed > 0 ? (val * completed).toLocaleString() : val}</strong>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-baseline mt-3 pt-2" style={{ borderTop: `1px solid rgba(255,255,255,0.04)` }}>
              <span className="text-xs" style={{ color: C.muted }}>{completed > 0 ? `${completed} campaign${completed !== 1 ? "s" : ""}` : "Per campaign"}</span>
              <strong className="text-2xl font-black" style={{ color: C.ink }}>${(completed > 0 ? completed * 525 : 525).toLocaleString()}</strong>
            </div>
          </div>

        </div>
      </div>

      {/* Credit History */}
      <CreditHistoryPanel />

      {/* Market Intelligence */}
      <MarketBriefCard />

      {/* Sample videos */}
      <SampleVideos />

    </div>
  );
}

// ── Market Brief Card ────────────────────────────────────────────────────────────────────────────────────────
function MarketBriefCard() {
  const queryClient = useQueryClient();
  const { data: brief, isLoading, isError } = useGetMarketBrief();
  const refresh = useRefreshMarketBrief();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await refresh.mutateAsync();
    queryClient.invalidateQueries({ queryKey: getGetMarketBriefQueryKey() });
    setRefreshing(false);
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: C.panel, borderColor: "rgba(255,255,255,0.04)" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4" style={{ color: C.gold }} />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider" style={{ color: C.text }}>AU Market Intelligence</span>
        </div>
        <button onClick={handleRefresh} disabled={refreshing || isLoading} className="p-1.5 rounded hover:bg-white/5 transition-opacity" style={{ opacity: refreshing || isLoading ? 0.4 : 1 }}>
          <RefreshCw className="w-3.5 h-3.5" style={{ color: C.muted, animation: refreshing ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-3 rounded" style={{ background: C.card }} />)}
        </div>
      ) : isError ? (
        <div className="p-4 text-sm text-center" style={{ color: C.muted }}>
          Could not load.{" "}
          <button onClick={handleRefresh} className="font-bold underline" style={{ color: C.gold, background: "none", border: "none", cursor: "pointer" }}>Try again</button>
        </div>
      ) : brief ? (
        <div className="p-4 space-y-4">
          <p className="text-sm font-semibold leading-snug" style={{ color: C.ink }}>{brief.headline}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {brief.keyStats.slice(0, 3).map((stat: any) => (
              <div key={stat.label} className="rounded-lg p-3 border" style={{ background: "#070710", borderColor: "rgba(255,255,255,0.04)" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wide" style={{ color: C.muted }}>{stat.label}</span>
                  <TrendIcon trend={stat.trend} />
                </div>
                <p className="text-lg font-black font-mono" style={{ color: C.ink }}>{stat.value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs leading-relaxed" style={{ color: C.muted }}>{brief.snapshot}</p>
          <div className="flex flex-wrap gap-1.5">
            {brief.hotMarkets.map((market: string) => (
              <span key={market} className="px-2 py-0.5 rounded-full text-[11px] font-mono border" style={{ background: `${C.gold}10`, color: C.gold, borderColor: `${C.gold}25` }}>
                {market}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Sample Videos ────────────────────────────────────────────────────────────────────────────────────────────────
const SAMPLE_VIDEOS = [
  { src: "/videos/oliver-featured.mp4", label: "Oliver · Williamstown, VIC", featured: true },
  { src: "/videos/sample-v1.mp4", label: "Mia · Mosman, NSW", featured: false },
  { src: "/videos/sample-v2.mp4", label: "Oliver · South Yarra, VIC", featured: false },
  { src: "/videos/sample-v3.mp4", label: "Sophie · Brighton, VIC", featured: false },
  { src: "/videos/sample-v4.mp4", label: "Mia · Bondi, NSW", featured: false },
  { src: "/videos/sample-v5.mp4", label: "Sophie · Toorak, VIC", featured: false },
];

function CreditHistoryPanel() {
  const { txs, loading } = useCreditTransactions();
  // color constants already in scope as `C`
  const spendTotal = txs.filter((t) => t.type === "spend").reduce((s, t) => s + t.amount, 0);
  const purchaseTotal = txs.filter((t) => t.type === "purchase").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: C.panel, borderColor: "rgba(255,255,255,0.04)" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        <div className="flex items-center gap-2">
          <History className="w-4 h-4" style={{ color: C.muted }} />
          <h2 className="text-sm font-bold" style={{ color: C.ink }}>Credit History</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono" style={{ color: C.muted }}>
            <span style={{ color: "#60a5fa" }}>+{purchaseTotal}c</span>
            <span className="mx-1">purchased</span>
            ·
            <span className="mx-1" style={{ color: "#f87171" }}>-{spendTotal}c</span>
            spent
          </span>
        </div>
      </div>
      {loading ? (
        <div className="p-6 text-center text-xs font-mono" style={{ color: C.muted }}>Loading transactions...</div>
      ) : txs.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm" style={{ color: C.muted }}>No transactions yet.</p>
          <p className="text-xs mt-1" style={{ color: C.muted }}>Credits spent on campaigns will appear here.</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
          {txs.slice(0, 6).map((tx) => {
            const isSpend = tx.type === "spend";
            return (
              <div key={tx.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.02] transition-colors">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: isSpend ? "rgba(248,113,113,0.08)" : "rgba(96,165,250,0.08)", border: `1px solid ${isSpend ? "rgba(248,113,113,0.2)" : "rgba(96,165,250,0.2)"}` }}>
                  {isSpend ? (
                    <ArrowRight className="w-3 h-3" style={{ color: "#f87171" }} />
                  ) : (
                    <Wallet className="w-3 h-3" style={{ color: "#60a5fa" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{ color: C.ink }}>{tx.description || (isSpend ? "Campaign spend" : "Credit purchase")}</p>
                  <p className="text-[10px] font-mono" style={{ color: C.muted }}>{formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}</p>
                </div>
                <span className="text-xs font-mono font-bold" style={{ color: isSpend ? "#f87171" : "#60a5fa" }}>
                  {isSpend ? "-" : "+"}{tx.amount}c
                </span>
              </div>
            );
          })}
        </div>
      )}
      {txs.length > 6 && (
        <div className="px-5 py-2 text-center border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          <span className="text-[10px] font-mono" style={{ color: C.muted }}>+ {txs.length - 6} older transactions</span>
        </div>
      )}
    </div>
  );
}

function SampleVideos() {
  const [expanded, setExpanded] = useState(false);
  const featured = SAMPLE_VIDEOS[0];
  const grid = SAMPLE_VIDEOS.slice(1);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: C.panel, borderColor: "rgba(255,255,255,0.04)" }}>
      <button
        onClick={() => setExpanded((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-transparent border-0 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: C.gold }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: C.ink }}>Example Output Videos</span>
          <span className="text-[10px] font-bold border px-1.5 py-0.5 rounded" style={{ color: C.muted, borderColor: C.line }}>{SAMPLE_VIDEOS.length} reels</span>
        </div>
        <ChevronDown className="w-4 h-4 transition-transform" style={{ color: C.muted, transform: expanded ? "rotate(180deg)" : "none" }} />
      </button>
      {expanded && (
        <div className="border-t p-4 space-y-3" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          <div className="relative rounded-xl overflow-hidden aspect-video bg-black">
            <video src={featured.src} autoPlay muted loop playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.gold }} />
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{featured.label}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {grid.map((v, i) => (
              <div key={i} className="relative rounded-lg overflow-hidden aspect-video bg-black cursor-pointer">
                <video src={v.src} muted loop playsInline className="w-full h-full object-cover"
                  onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                <div className="absolute bottom-1.5 left-1.5 right-1.5">
                  <span className="text-[8px] font-bold text-white/60 uppercase tracking-wider">{v.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function JobStatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    queued:     { bg: `${C.gold}12`,    text: C.gold,    border: `${C.gold}30` },
    processing: { bg: "#1269cf18",      text: "#60a5fa", border: "#1269cf30" },
    complete:   { bg: `${C.gold}18`,    text: C.gold,    border: `${C.gold}38` },
    failed:     { bg: "#ef444418",      text: "#f87171", border: "#ef444430" },
  };
  const s = colors[status] ?? colors.queued;
  return (
    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border" style={{ background: s.bg, color: s.text, borderColor: s.border }}>
      {status}
    </span>
  );
}
