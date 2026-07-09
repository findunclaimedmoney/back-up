import { ArrowRight, CheckCircle2, FileText, Clock, Play, Sparkles, Link2, ImageIcon, Video, Mic, DollarSign, TrendingUp, BarChart2, MapPin, Zap, Camera, Globe, ChevronRight, RefreshCw } from "lucide-react";

export function V2PremiumSaaS() {
  return (
    <div className="min-h-screen bg-[#070710] text-white font-sans">

      {/* Top bar with greeting */}
      <div className="border-b border-white/5 px-6 py-3 flex items-center justify-between bg-[#09090f]">
        <div>
          <span className="text-xs text-[#6b7280] font-mono">Good morning, John</span>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b] text-black rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#f59e0b]/90 shadow-lg shadow-[#f59e0b]/30">
          <Sparkles className="w-3.5 h-3.5" />
          New Campaign
        </button>
      </div>

      <div className="p-6 space-y-5">

        {/* Hero banner */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a1408] via-[#0f0d1a] to-[#070710] border border-[#f59e0b]/15 p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#f59e0b]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl translate-y-1/2" />
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
              <span className="text-[11px] font-mono text-[#f59e0b] uppercase tracking-widest">Luxury Real Estate AI</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight leading-none mb-3">
              Your Property Marketing<br />
              <span className="text-[#f59e0b]">Operating System</span>
            </h1>
            <p className="text-[#9ca3af] leading-relaxed mb-6 max-w-lg">
              From listing URL to professional presenter video with AI script, ElevenLabs voiceover, and full social media pack — in under 5 minutes.
            </p>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-6 py-3 bg-[#f59e0b] text-black rounded-xl font-bold text-sm shadow-xl shadow-[#f59e0b]/25 hover:bg-[#f59e0b]/90">
                <Sparkles className="w-4 h-4" />
                Generate Property Campaign
              </button>
              <button className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-sm text-white/70 hover:border-white/20">
                <Play className="w-4 h-4" />
                Watch demo
              </button>
            </div>
          </div>

          {/* Quick actions row */}
          <div className="relative grid grid-cols-4 gap-3 mt-7">
            {[
              { icon: Link2, label: "Property URL", sub: "Paste listing" },
              { icon: ImageIcon, label: "Photo Campaign", sub: "Upload images" },
              { icon: Video, label: "Video Upload", sub: "Your footage" },
              { icon: Mic, label: "Teleprompter", sub: "Self-record mode" },
            ].map(({ icon: Icon, label, sub }) => (
              <button key={label} className="group flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 hover:border-[#f59e0b]/30 transition-all text-left">
                <div className="w-9 h-9 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center shrink-0 group-hover:bg-[#f59e0b]/20">
                  <Icon className="w-4 h-4 text-[#f59e0b]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{label}</p>
                  <p className="text-[10px] text-[#6b7280]">{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Stats — wider cards, cleaner */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { title: "Campaigns Created", value: "12", sub: "+3 this week", icon: CheckCircle2, accent: "#f59e0b" },
            { title: "Properties Processed", value: "38", sub: "Suburb data extracted", icon: Globe, accent: "#60a5fa" },
            { title: "Hours Saved", value: "48h", sub: "vs manual production", icon: Clock, accent: "#34d399" },
            { title: "Value Generated", value: "$6.3k", sub: "Estimated savings", icon: TrendingUp, accent: "#a78bfa" },
          ].map(({ title, value, sub, icon: Icon, accent }) => (
            <div key={title} className="bg-[#0d0d18] border border-white/6 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}15` }}>
                <Icon className="w-4 h-4" style={{ color: accent }} />
              </div>
              <p className="text-[11px] font-mono uppercase tracking-wider mb-2" style={{ color: accent }}>{title}</p>
              <p className="text-3xl font-black font-mono mb-1">{value}</p>
              <p className="text-[11px] text-[#6b7280]">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-5">

          {/* Presenter Studio — premium */}
          <div className="col-span-1 bg-[#0d0d18] border border-white/6 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#f59e0b]">AI Presenters</span>
              <span className="text-[10px] text-emerald-400 font-mono border border-emerald-500/20 bg-emerald-500/8 px-1.5 py-0.5 rounded">4 Ready</span>
            </div>
            <div className="p-3 space-y-2">
              {[
                { name: "Mia", spec: "Luxury listings", badge: "Top rated", accent: "#f43f5e" },
                { name: "Oliver", spec: "Corporate premium", badge: "Most used", accent: "#60a5fa" },
                { name: "Liam", spec: "Confident sales", badge: "New", accent: "#f59e0b" },
                { name: "Sophie", spec: "Lifestyle reels", badge: "Trending", accent: "#34d399" },
              ].map(p => (
                <div key={p.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/3 border border-white/5 hover:border-white/10 cursor-pointer group">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: `${p.accent}20`, color: p.accent, border: `1px solid ${p.accent}30` }}>
                    {p.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-[11px] text-[#6b7280] truncate">{p.spec}</p>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: p.accent, background: `${p.accent}15`, border: `1px solid ${p.accent}25` }}>
                    {p.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Campaigns */}
          <div className="col-span-2 bg-[#0d0d18] border border-white/6 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider">Recent Campaigns</span>
              <span className="text-xs text-[#f59e0b] font-mono cursor-pointer">View all →</span>
            </div>
            <div className="divide-y divide-white/4">
              {[
                { title: "14 Harbour View Dr, Mosman NSW", presenter: "Mia", type: "Luxury", status: "complete", time: "2h ago", views: "1.2k" },
                { title: "8/32 St Kilda Rd, Melbourne VIC", presenter: "Oliver", type: "Corporate", status: "processing", time: "5h ago", views: "—" },
                { title: "3 Bondi Beach Rd, Sydney NSW", presenter: "Sophie", type: "Lifestyle", status: "queued", time: "Yesterday", views: "—" },
                { title: "12 Chapel St, Prahran VIC", presenter: "Liam", type: "Sales", status: "complete", time: "2d ago", views: "847" },
              ].map((j, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-white/2 cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 flex items-center justify-center text-xs font-bold text-[#f59e0b] shrink-0">
                    {j.presenter[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{j.title}</p>
                    <p className="text-[11px] text-[#6b7280] font-mono">{j.presenter} · {j.type}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono border uppercase tracking-wider ${
                      j.status === "complete" ? "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20" :
                      j.status === "processing" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    }`}>{j.status}</span>
                    <p className="text-[10px] text-[#6b7280] font-mono mt-0.5">{j.time}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#374151] shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Market Intelligence */}
        <div className="bg-[#0d0d18] border border-white/6 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#f59e0b]" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider">AU Market Intelligence</span>
              <span className="text-[10px] font-mono text-[#6b7280] border border-white/8 px-1.5 py-0.5 rounded">Updated 3h ago</span>
            </div>
            <button className="p-1.5 rounded hover:bg-white/5"><RefreshCw className="w-3.5 h-3.5 text-[#6b7280]" /></button>
          </div>
          <div className="p-4">
            <p className="text-sm font-semibold mb-3">Sydney and Melbourne luxury property demand at 18-month high, driven by offshore buyer return</p>
            <div className="grid grid-cols-4 gap-3 mb-3">
              {[
                { label: "Median Price", val: "$1.24M", trend: "up" },
                { label: "Days on Market", val: "21d", trend: "down" },
                { label: "Clearance Rate", val: "74%", trend: "up" },
                { label: "New Listings", val: "+12%", trend: "up" },
              ].map(({ label, val, trend }) => (
                <div key={label} className="bg-[#070710] border border-white/5 rounded-lg p-3">
                  <p className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-xl font-black font-mono">{val}</p>
                  <span className={`text-[10px] font-mono ${trend === "up" ? "text-emerald-400" : "text-rose-400"}`}>
                    {trend === "up" ? "▲" : "▼"} trending
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["Mosman", "Toorak", "Bondi", "South Yarra", "Double Bay", "Brighton"].map(m => (
                <span key={m} className="px-2 py-0.5 bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 rounded-full text-[11px] font-mono">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

