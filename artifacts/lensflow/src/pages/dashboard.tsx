import React, { useState, useEffect } from "react";
import { useGetJobStats, useGetMarketBrief, useRefreshMarketBrief, getGetMarketBriefQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ChevronDown, TrendingUp, TrendingDown, Minus, RefreshCw, MapPin, MessageSquare, BarChart2, ArrowRight, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import buildKitImage from "@assets/LensFlow-The-Build-Kit-every-tool-you-need_1780215479239.png";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";

// ── Cosmic palette ────────────────────────────────────────────────────────────
const C = {
  paper:     "#0a0d1a",
  panel:     "#0d1120",
  card:      "#10162a",
  deep:      "#151b31",
  line:      "#1a213a",
  ink:       "#f9f3ea",
  text:      "#f2ecdf",
  muted:     "#8f99b2",
  goldLight: "#dfb44d",
  gold:      "#c99a2e",
  goldDark:  "#8d6c20",
};

const PROPERTY_IMAGES = [
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=900&q=82",
];

type Presenter = "Mia" | "Oliver" | "Sophie" | "James";

const PRESENTER_GRADIENT: Record<Presenter, string> = {
  Mia:    "linear-gradient(135deg, #151b31 0%, #2a1535 55%, #c99a2e 100%)",
  Oliver: "linear-gradient(135deg, #151b31 0%, #132a2a 55%, #c99a2e 100%)",
  Sophie: "linear-gradient(135deg, #151b31 0%, #1f1535 55%, #8d6c20 100%)",
  James:  "linear-gradient(135deg, #151b31 0%, #152235 55%, #c99a2e 100%)",
};

const PRESENTER_DESC: Record<Presenter, string> = {
  Mia:    "Polished, warm and premium. Best for luxury homes and prestige brand campaigns.",
  Oliver: "Confident, refined, direct. Best for market updates and high-value appraisals.",
  Sophie: "Approachable and modern. Best for social-first residential campaigns.",
  James:  "Authoritative and sharp. Best for prestige, coastal and inner-city listings.",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ── Eyebrow label (gold bar + uppercase text) ─────────────────────────────────
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: C.goldDark, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>
      <div style={{ width: 24, height: 2, background: C.gold, flexShrink: 0 }} />
      {children}
    </div>
  );
}

// ── Ghost button ──────────────────────────────────────────────────────────────
function Ghost({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 14px", background: C.card, color: C.text, fontWeight: 700, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}
    >
      {children}
    </button>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useGetJobStats();
  const { user } = useAuth();
  const firstName = user?.firstName ?? user?.email?.split("@")[0] ?? null;
  const [selectedPresenter, setSelectedPresenter] = useState<"Mia" | "Oliver" | "Sophie" | "James">("Mia");

  const completed = stats?.complete ?? 0;
  const estimatedReach = completed * 5400;

  if (isLoading) {
    return (
      <div style={{ padding: 24, display: "grid", gap: 16 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: i === 1 ? 310 : 96, background: C.panel, borderRadius: 8, animation: "pulse 2s infinite" }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ color: C.text, fontFamily: "inherit" }}>

      {/* ── Topbar ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, padding: "14px 0 20px" }}>
        <div>
          {firstName && <div style={{ color: C.muted, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>{getGreeting()}, {firstName}</div>}
          <div style={{ color: C.ink, fontSize: 22, fontWeight: 800 }}>Create Campaign is the main event</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", border: `1px solid ${C.line}`, borderRadius: 8, background: "rgba(13,17,32,0.9)", flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg, ${C.panel}, ${C.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "white" }}>
            {selectedPresenter[0]}
          </div>
          <div>
            <div style={{ color: C.ink, fontSize: 13, fontWeight: 700 }}>AI Presenter Ready</div>
            <div style={{ color: C.gold, fontSize: 12, fontWeight: 700 }}>{selectedPresenter} selected</div>
          </div>
        </div>
      </div>

      {/* ── Hero ── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 360px", gap: 22, marginBottom: 20 }}>

        {/* Property photo + headline */}
        <div style={{
          minHeight: 300,
          padding: 34,
          borderRadius: 8,
          color: "white",
          background: `linear-gradient(90deg, rgba(10,13,26,0.92), rgba(10,13,26,0.48)), url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=82') center / cover`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
        }}>
          <h1 style={{ margin: "0 0 12px", fontSize: "clamp(30px,4vw,52px)", lineHeight: 1, letterSpacing: 0, fontWeight: 900 }}>
            Create Luxury Property Campaigns in Minutes
          </h1>
          <p style={{ maxWidth: 620, margin: 0, color: "rgba(255,255,255,0.82)", fontSize: 16, lineHeight: 1.5 }}>
            Turn listings, photos and videos into AI-powered marketing campaigns, social reels and property presentations.
          </p>
        </div>

        {/* Launcher panel */}
        <div style={{ padding: 22, borderRadius: 8, background: C.panel, border: `1px solid ${C.line}`, boxShadow: "0 18px 45px rgba(0,0,0,0.18)" }}>
          <Eyebrow>Start New Campaign</Eyebrow>
          <h2 style={{ margin: "10px 0 14px", color: C.ink, fontSize: 22, lineHeight: 1.12, fontWeight: 800 }}>Generate Property Campaign</h2>
          <div style={{ display: "grid", gap: 8, margin: "16px 0" }}>
            <label style={{ color: C.muted, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>Property URL</label>
            <Link href="/jobs/new">
              <div style={{ width: "100%", border: `1px solid ${C.line}`, borderRadius: 8, padding: "12px 14px", background: C.card, color: C.muted, fontSize: 14, cursor: "pointer" }}>
                https://domain.com.au/your-listing
              </div>
            </Link>
          </div>
          <Link href="/jobs/new">
            <button
              style={{
                width: "100%", border: 0, borderRadius: 8, padding: "14px 18px", color: "white",
                background: `linear-gradient(135deg, ${C.goldLight}, ${C.gold} 48%, ${C.goldDark})`,
                fontWeight: 800, cursor: "pointer", fontSize: 15,
                boxShadow: "0 14px 28px rgba(143,103,29,0.28)",
              }}
            >
              Generate Property Campaign
            </button>
          </Link>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
            {[
              { tag: "URL", label: "Property URL", href: "/jobs/new" },
              { tag: "IMG", label: "Upload Photos", href: "/jobs/new" },
              { tag: "VID", label: "Upload Video", href: "/jobs/new" },
              { tag: "REC", label: "Record with Teleprompter", href: "/teleprompter" },
            ].map(({ tag, label, href }) => (
              <Link key={tag} href={href}>
                <div style={{ minHeight: 70, border: `1px solid ${C.line}`, borderRadius: 8, background: C.card, padding: 12, display: "flex", flexDirection: "column", justifyContent: "space-between", cursor: "pointer" }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: C.deep, color: C.goldDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900 }}>{tag}</div>
                  <strong style={{ color: C.ink, fontSize: 13 }}>{label}</strong>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Advantage strip ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 20, padding: "0 4px", flexWrap: "wrap" as const }}>
        {[
          "AI Script Writer",
          "AI Presenters",
          "Teleprompter",
          "Social Reels",
          "Property Videos",
          "Listing Campaigns",
        ].map((feat, i, arr) => (
          <React.Fragment key={feat}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: i % 2 === 0 ? C.panel : "transparent", borderRadius: 8, border: i % 2 === 0 ? `1px solid ${C.line}` : "none" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="7" fill={C.gold} fillOpacity="0.18" />
                <path d="M4 7l2 2 4-4" stroke={C.gold} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ color: C.ink, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" as const }}>{feat}</span>
            </div>
            {i < arr.length - 1 && <div style={{ width: 1, height: 20, background: C.line, margin: "0 2px", flexShrink: 0 }} />}
          </React.Fragment>
        ))}
      </div>

      {/* ── Metrics ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { val: completed.toString(), label: "Campaigns Created" },
          { val: (stats?.scriptsGenerated ?? 0).toString(), label: "Listings Processed" },
          { val: `${stats?.timeSavedHours ?? 0}h`, label: "Time Saved" },
          { val: estimatedReach > 0 ? `${Math.round(estimatedReach / 1000)}k` : "—", label: "Estimated Reach" },
        ].map(({ val, label }) => (
          <div key={label} style={{ padding: 18, border: `1px solid ${C.line}`, borderRadius: 8, background: "rgba(13,17,32,0.92)" }}>
            <strong style={{ display: "block", color: C.ink, fontSize: 30, lineHeight: 1, marginBottom: 8 }}>{val}</strong>
            <span style={{ color: C.muted, fontSize: 13, fontWeight: 700 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(280px,0.6fr)", gap: 20, alignItems: "start" }}>

        {/* Left: campaigns + market intelligence */}
        <div>

          {/* Recent Campaigns heading */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 14 }}>
            <div>
              <h2 style={{ color: C.ink, margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>Recent Campaigns</h2>
              <p style={{ margin: 0, color: C.muted, fontSize: 13, lineHeight: 1.45 }}>Your latest property marketing campaigns.</p>
            </div>
            <Link href="/jobs">
              <Ghost>View All</Ghost>
            </Link>
          </div>

          {/* Campaign cards or empty state */}
          {(stats?.recentJobs?.length ?? 0) === 0 ? (
            <div style={{ padding: "48px 24px", border: `1px solid ${C.line}`, borderRadius: 8, background: C.panel, textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${C.gold}18`, border: `1px solid ${C.gold}30`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Play style={{ width: 20, height: 20, color: C.gold, marginLeft: 2 }} />
              </div>
              <p style={{ color: C.ink, fontWeight: 700, margin: "0 0 6px" }}>No campaigns yet</p>
              <p style={{ color: C.muted, fontSize: 13, margin: "0 0 18px", maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
                Paste a property listing URL and LensFlow will write the script, record the voiceover, and render a presenter video.
              </p>
              <Link href="/jobs/new">
                <button style={{ border: 0, borderRadius: 8, padding: "12px 22px", color: "white", background: `linear-gradient(135deg, ${C.goldLight}, ${C.gold} 48%, ${C.goldDark})`, fontWeight: 800, cursor: "pointer", fontSize: 14 }}>
                  Generate Your First Campaign
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 14, marginBottom: 24 }}>
              {(stats?.recentJobs ?? []).slice(0, 3).map((job, i) => {
                const statusColors: Record<string, string> = {
                  complete: C.gold,
                  processing: "#1269cf",
                  queued: "#a78bfa",
                  failed: "#ef4444",
                };
                const statusLabels: Record<string, string> = {
                  complete: "Ready",
                  processing: "Exporting",
                  queued: "Queued",
                  failed: "Failed",
                };
                const color = statusColors[job.status] ?? C.muted;
                const fallbackImg = PROPERTY_IMAGES[i % PROPERTY_IMAGES.length];
                const videoUrl = (job as unknown as { videoUrl?: string }).videoUrl;
                const hasVideo = job.status === "complete" && videoUrl;
                const tags = job.status === "complete"
                  ? ["Reel", "Script", "Voiceover"]
                  : job.status === "processing"
                  ? ["Script", "Voiceover"]
                  : ["Script"];
                return (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <article style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden", background: C.panel, cursor: "pointer", transition: "border-color 0.2s" }}>
                      <div style={{ aspectRatio: "16/10", position: "relative", background: "black" }}>
                        {hasVideo ? (
                          <video
                            src={videoUrl}
                            muted
                            loop
                            playsInline
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
                            onMouseLeave={e => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", backgroundImage: `url('${fallbackImg}')`, backgroundSize: "cover", backgroundPosition: "center" }} />
                        )}
                        {hasVideo && (
                          <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.7)", borderRadius: 4, padding: "3px 7px", display: "flex", alignItems: "center", gap: 4 }}>
                            <svg width="8" height="8" viewBox="0 0 8 8" fill={C.gold}><polygon points="1,0 7,4 1,8" /></svg>
                            <span style={{ color: "white", fontSize: 10, fontWeight: 700 }}>Preview</span>
                          </div>
                        )}
                      </div>
                      <div style={{ padding: 14 }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, color, fontSize: 12, fontWeight: 850, textTransform: "uppercase", marginBottom: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                          {statusLabels[job.status] ?? job.status}
                        </div>
                        <h3 style={{ color: C.ink, margin: "0 0 10px", fontSize: 15, lineHeight: 1.2, fontWeight: 700 }}>
                          {job.listingTitle || job.listingUrl || `Campaign ${job.id.slice(0, 8)}`}
                        </h3>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                          {tags.map(t => (
                            <span key={t} style={{ display: "inline-flex", border: `1px solid ${C.line}`, borderRadius: 999, padding: "4px 9px", background: C.card, color: C.muted, fontSize: 12, fontWeight: 700 }}>{t}</span>
                          ))}
                          <span style={{ display: "inline-flex", border: `1px solid ${C.line}`, borderRadius: 999, padding: "4px 9px", background: C.card, color: C.muted, fontSize: 12, fontWeight: 700 }}>
                            {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <div style={{ flex: 1, border: `1px solid ${C.line}`, background: C.card, borderRadius: 8, padding: "8px 6px", color: C.text, fontWeight: 800, cursor: "pointer", fontSize: 12, textAlign: "center" }}>View Campaign</div>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Market Intelligence */}
          <MarketBriefCard />

          {/* Sample videos & roadmap — collapsed */}
          <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
            <SampleVideos />
            <RoadmapCard />
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: "grid", gap: 20 }}>

          {/* Presenter panel */}
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, background: C.panel, padding: 18 }}>
            <Eyebrow>AI Presenter Ready</Eyebrow>

            {/* Selected presenter hero */}
            <div style={{ display: "grid", gridTemplateColumns: "72px minmax(0,1fr)", gap: 12, alignItems: "center", marginTop: 14 }}>
              <div style={{
                width: 72, height: 80, borderRadius: 8, flexShrink: 0,
                background: PRESENTER_GRADIENT[selectedPresenter],
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, fontWeight: 900, color: C.goldLight,
              }}>
                {selectedPresenter[0]}
              </div>
              <div>
                <h3 style={{ color: C.ink, margin: "0 0 4px", fontSize: 17, fontWeight: 800 }}>{selectedPresenter}</h3>
                <p style={{ margin: 0, color: C.muted, lineHeight: 1.4, fontSize: 12 }}>
                  {PRESENTER_DESC[selectedPresenter]}
                </p>
              </div>
            </div>

            {/* 2×2 picker grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
              {(["Mia", "Oliver", "Sophie", "James"] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPresenter(p)}
                  style={{
                    border: selectedPresenter === p ? `1px solid ${C.gold}` : `1px solid ${C.line}`,
                    borderRadius: 8, padding: "9px 6px",
                    background: selectedPresenter === p ? `${C.gold}18` : C.card,
                    color: selectedPresenter === p ? C.goldLight : C.muted,
                    fontWeight: 800, cursor: "pointer", fontSize: 13,
                    transition: "all 0.15s",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            <Link href="/jobs/new">
              <button
                type="button"
                style={{
                  width: "100%", border: 0, borderRadius: 8, padding: "12px 18px", color: "white", marginTop: 10,
                  background: `linear-gradient(135deg, ${C.goldLight}, ${C.gold} 48%, ${C.goldDark})`,
                  fontWeight: 800, cursor: "pointer", fontSize: 14,
                  boxShadow: "0 8px 20px rgba(143,103,29,0.22)",
                }}
              >
                Generate with {selectedPresenter}
              </button>
            </Link>
          </div>

          {/* Marketing value panel */}
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, background: C.panel, padding: 18 }}>
            <Eyebrow>Marketing Value Generated</Eyebrow>
            <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
              {[
                { label: "Script Creation", val: 50 },
                { label: "Voiceover", val: 75 },
                { label: "Video Editing", val: 250 },
                { label: "Social Media Package", val: 150 },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", color: C.muted, paddingBottom: 9, borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ fontSize: 14 }}>{label}</span>
                  <strong style={{ color: C.ink, fontWeight: 800 }}>${completed > 0 ? (val * completed).toLocaleString() : val}</strong>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 14 }}>
              <span style={{ fontSize: 13, color: C.muted }}>{completed > 0 ? `${completed} campaign${completed !== 1 ? "s" : ""}` : "Per campaign"}</span>
              <strong style={{ fontSize: 32, fontWeight: 900, color: C.ink }}>
                ${(completed > 0 ? completed * 525 : 525).toLocaleString()}
              </strong>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Market Brief (reskinned, logic untouched) ─────────────────────────────────
function TrendIcon({ trend }: { trend: string }) {
  const s = { width: 14, height: 14 };
  if (trend === "up") return <TrendingUp style={{ ...s, color: "#34d399" }} />;
  if (trend === "down") return <TrendingDown style={{ ...s, color: "#f87171" }} />;
  return <Minus style={{ ...s, color: C.muted }} />;
}

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
    <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, background: C.panel, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BarChart2 style={{ width: 14, height: 14, color: C.gold }} />
          <Eyebrow>AU Market Intelligence</Eyebrow>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing || isLoading}
          style={{ padding: "6px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", opacity: (refreshing || isLoading) ? 0.4 : 1 }}
          title="Refresh"
        >
          <RefreshCw style={{ width: 14, height: 14, color: C.muted, animation: refreshing ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: 16, display: "grid", gap: 8 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 14, background: C.card, borderRadius: 4 }} />)}
        </div>
      ) : isError ? (
        <div style={{ padding: 16, color: C.muted, fontSize: 13, textAlign: "center" }}>
          Could not load.{" "}
          <button type="button" onClick={handleRefresh} style={{ color: C.gold, background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>
            Try again
          </button>
        </div>
      ) : brief ? (
        <div style={{ padding: 16, display: "grid", gap: 14 }}>
          <p style={{ margin: 0, color: C.ink, fontWeight: 700, fontSize: 14, lineHeight: 1.4 }}>{brief.headline}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
            {brief.keyStats.slice(0, 3).map(stat => (
              <div key={stat.label} style={{ padding: 12, background: C.card, border: `1px solid ${C.line}`, borderRadius: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: C.muted, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>{stat.label}</span>
                  <TrendIcon trend={stat.trend} />
                </div>
                <p style={{ margin: 0, color: C.ink, fontWeight: 900, fontSize: 18 }}>{stat.value}</p>
              </div>
            ))}
          </div>

          <p style={{ margin: 0, color: C.muted, fontSize: 13, lineHeight: 1.5 }}>{brief.snapshot}</p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.muted, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, width: "100%", marginBottom: 2 }}>
              <MapPin style={{ width: 10, height: 10 }} /> Hot Markets
            </div>
            {brief.hotMarkets.map(market => (
              <span key={market} style={{ padding: "4px 10px", background: `${C.gold}14`, color: C.gold, border: `1px solid ${C.gold}28`, borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                {market}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Sample Videos (unchanged logic, reskinned header) ─────────────────────────
const SAMPLE_VIDEOS = [
  { src: "/videos/oliver-featured.mp4", label: "Oliver · Williamstown, VIC", featured: true },
  { src: "/videos/sample-v1.mp4", label: "Mia · Mosman, NSW", featured: false },
  { src: "/videos/sample-v2.mp4", label: "Oliver · South Yarra, VIC", featured: false },
  { src: "/videos/sample-v3.mp4", label: "Sophie · Brighton, VIC", featured: false },
  { src: "/videos/sample-v4.mp4", label: "Mia · Bondi, NSW", featured: false },
  { src: "/videos/sample-v5.mp4", label: "Sophie · Toorak, VIC", featured: false },
];

function SampleVideos() {
  const [expanded, setExpanded] = useState(false);
  const featured = SAMPLE_VIDEOS[0];
  const grid = SAMPLE_VIDEOS.slice(1);

  return (
    <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, background: C.panel, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setExpanded(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "transparent", border: "none", cursor: "pointer", color: C.text }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold }} />
          <span style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.ink }}>Example Output Videos</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, border: `1px solid ${C.line}`, padding: "2px 8px", borderRadius: 4 }}>{SAMPLE_VIDEOS.length} reels</span>
        </div>
        <ChevronDown style={{ width: 16, height: 16, color: C.muted, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.line}`, padding: 16, display: "grid", gap: 10 }}>
          <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "16/9", background: "black" }}>
            <video src={featured.src} autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: 10, left: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 2 }}>{featured.label}</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 8 }}>
            {grid.map((v, i) => (
              <div key={i} style={{ position: "relative", borderRadius: 6, overflow: "hidden", aspectRatio: "16/9", background: "black", cursor: "pointer" }}>
                <video
                  src={v.src}
                  muted
                  loop
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
                  onMouseLeave={e => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: 4, left: 6, right: 6 }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 1 }}>{v.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RoadmapCard() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, background: C.panel, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "transparent", border: "none", cursor: "pointer", color: C.text }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold, animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: C.ink }}>Production Roadmap</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, border: `1px solid ${C.line}`, padding: "2px 8px", borderRadius: 4 }}>URL → VIDEO ENGINE</span>
        </div>
        <ChevronDown style={{ width: 16, height: 16, color: C.muted, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${C.line}` }}>
          <img src={buildKitImage} alt="LensFlow pipeline architecture" style={{ width: "100%", display: "block" }} />
          <div style={{ padding: 14, borderTop: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.muted }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, display: "inline-block" }} />
            Build window 4–8 weeks · ~$2.54 cost/video · $3.95/vid margin at 20 vids/mo
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
    <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
      {status}
    </span>
  );
}
