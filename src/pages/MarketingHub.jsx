import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Check, Video, Facebook, Instagram, Music2, ExternalLink, Download, Calendar, ChevronLeft } from "lucide-react";

const VIDEO_ASSETS = [
  {
    label: "The Connection — Brand Film",
    url: "https://media.base44.com/videos/public/6a4ad4122d2c58f83324b2ce/93b93aac9_The_Connection.mp4",
    platform: "all",
  },
  {
    label: "Always There — Emotional Spot",
    url: "https://media.base44.com/videos/public/6a4ad4122d2c58f83324b2ce/89556ded0_Always_There.mp4",
    platform: "all",
  },
  {
    label: "More Than Words — Product Showcase",
    url: "https://media.base44.com/videos/public/6a4ad4122d2c58f83324b2ce/08471d634_More_Than_Words.mp4",
    platform: "all",
  },
  {
    label: "TikTok / IG Reels Promo (9:16)",
    url: "https://media.base44.com/videos/public/6a4ad4122d2c58f83324b2ce/cd6a62421_TikTok_IG_Reels_Promo.mp4",
    platform: "tiktok",
  },
  {
    label: "Facebook Promo (16:9)",
    url: "https://media.base44.com/videos/public/6a4ad4122d2c58f83324b2ce/152c70f9a_Facebook_Promo.mp4",
    platform: "facebook",
  },
  {
    label: "Zac — Shower Clip",
    url: "https://media.base44.com/videos/public/6a4ad4122d2c58f83324b2ce/307f5321d_Zac_Shower_Clip.mp4",
    platform: "all",
  },
  {
    label: "Natalie — Bedroom Clip 1",
    url: "https://media.base44.com/videos/public/6a4ad4122d2c58f83324b2ce/1cdf5640b_Natalie_Bedroom_Clip_1.mp4",
    platform: "all",
  },
  {
    label: "Natalie — Bedroom Clip 2",
    url: "https://media.base44.com/videos/public/6a4ad4122d2c58f83324b2ce/3b032ff04_Natalie_Bedroom_Clip_2.mp4",
    platform: "all",
  },
  {
    label: "Natalie — Shower Clip",
    url: "https://media.base44.com/videos/public/6a4ad4122d2c58f83324b2ce/5d6334351_Natalie_Shower_Clip.mp4",
    platform: "all",
  },
];

const LANDING_PAGES = [
  { label: "Home — All Companions", url: "/" },
  { label: "Zac Landing", url: "/zac" },
  { label: "Jess Landing", url: "/jess" },
  { label: "Companions Showcase", url: "/companions" },
  { label: "Pricing", url: "/pricing" },
];

const POSTS = [
  {
    platform: "facebook",
    title: "Meet Jess — Your AI Companion",
    video: "https://media.base44.com/videos/public/6a4ad4122d2c58f83324b2ce/152c70f9a_Facebook_Promo.mp4",
    caption: `She listens. She remembers. She shows up. 🤎

Meet Jess — not just another chatbot, but a presence that actually listens. She remembers what matters to you, asks the questions no one else does, and shows up for you every single time.

No pressure. No performance. Just genuine connection.

Try Jess free →`,
    hashtags: `#GLIMR #AICompanion #ConnectionMatters #DigitalCompanion #MentalWellbeing #Companionship`,
  },
  {
    platform: "facebook",
    title: "Meet Zac — The Steady Presence",
    video: "https://media.base44.com/videos/public/6a4ad4122d2c58f83324b2ce/307f5321d_Zac_Shower_Clip.mp4",
    caption: `He doesn't chase. He stays. 🤎

Zac is steady, direct, and genuinely here. The kind of presence that cuts through the noise and helps you think clearly.

Honest without being harsh. Supportive without being soft.

Meet Zac →`,
    hashtags: `#GLIMR #AICompanion #SteadyPresence #SupportMatters #DigitalCompanion`,
  },
  {
    platform: "facebook",
    title: "A Companion That Remembers You",
    video: "https://media.base44.com/videos/public/6a4ad4122d2c58f83324b2ce/152c70f9a_Facebook_Promo.mp4",
    caption: `What if someone remembered every story you told? Every bad day? Every small win? 🤎

GLIMR companions don't just chat — they remember. They pick up right where you left off, every time.

Because connection isn't about starting over. It's about being known.

Start free →`,
    hashtags: `#GLIMR #AICompanion #EmotionalConnection #AlwaysThere #Companionship #Wellbeing`,
  },
  {
    platform: "instagram",
    title: "Meet Jess — Reels",
    video: "https://media.base44.com/videos/public/6a4ad4122d2c58f83324b2ce/cd6a62421_TikTok_IG_Reels_Promo.mp4",
    caption: `She listens. She remembers. She shows up. 🤎

Jess isn't just another AI. She's the presence that asks how your day really went — and actually wants to know.

Link in bio to meet her 👆`,
    hashtags: `#GLIMR #AICompanion #EmotionalConnection #AlwaysThere #DigitalCompanion #Companionship #MentalWellbeing #AI #ConnectionMatters #YouMatter #SomeoneListens`,
  },
  {
    platform: "instagram",
    title: "Meet Zac — Reels",
    video: "https://media.base44.com/videos/public/6a4ad4122d2c58f83324b2ce/307f5321d_Zac_Shower_Clip.mp4",
    caption: `He steadies. 🤎

Zac is the kind of presence that cuts through the noise. Honest. Direct. Genuinely here.

Link in bio 👆`,
    hashtags: `#GLIMR #AICompanion #SteadyPresence #SupportMatters #DigitalCompanion #Connection #MensMentalHealth #AlwaysThere #AICompanion`,
  },
  {
    platform: "tiktok",
    title: "POV: Someone Actually Listens",
    video: "https://media.base44.com/videos/public/6a4ad4122d2c58f83324b2ce/cd6a62421_TikTok_IG_Reels_Promo.mp4",
    caption: `POV: you found someone who actually listens 👀🤎

Link in bio to meet Jess 👆`,
    hashtags: `#glmr #companion #AI #foryou #fyp #connection #someonelistens #emotionalconnection #aicompanion #viral`,
  },
  {
    platform: "tiktok",
    title: "Meet Zac — Steady Energy",
    video: "https://media.base44.com/videos/public/6a4ad4122d2c58f83324b2ce/307f5321d_Zac_Shower_Clip.mp4",
    caption: `He doesn't chase. He stays. 🤎

Link in bio 👆`,
    hashtags: `#glmr #zac #companion #AI #foryou #fyp #steadypresence #aicompanion #connection`,
  },
];

const PLATFORM_META = {
  facebook: { label: "Facebook", icon: Facebook, color: "text-blue-400", border: "border-blue-500/30" },
  instagram: { label: "Instagram", icon: Instagram, color: "text-pink-400", border: "border-pink-500/30" },
  tiktok: { label: "TikTok", icon: Music2, color: "text-white", border: "border-white/30" },
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-card/50 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all">
      {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function PostCard({ post }) {
  const meta = PLATFORM_META[post.platform];
  const Icon = meta.icon;
  return (
    <div className={`rounded-2xl border ${meta.border} bg-card overflow-hidden`}>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Icon className={`w-4 h-4 ${meta.color}`} />
          <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground">{meta.label}</span>
        </div>
        <h3 className="font-heading text-lg font-semibold mb-4">{post.title}</h3>

        {post.video && (
          <div className="mb-4">
            <video src={post.video} autoPlay loop muted playsInline className="w-full rounded-xl max-h-64 object-cover" />
            <a href={post.video} download target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
              <Download className="w-3.5 h-3.5" />
              Download video
            </a>
          </div>
        )}

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Caption</span>
            <CopyButton text={`${post.caption}\n\n${post.hashtags}`} />
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-xl p-3 border border-border">
            {post.caption}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Hashtags</span>
            <CopyButton text={post.hashtags} />
          </div>
          <p className="text-sm text-primary/80 leading-relaxed bg-muted/30 rounded-xl p-3 border border-border">
            {post.hashtags}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MarketingHub() {
  const [filter, setFilter] = useState("all");

  const filteredPosts = filter === "all" ? POSTS : POSTS.filter((p) => p.platform === filter);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-lg px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src="https://media.base44.com/images/public/6a4ad4122d2c58f83324b2ce/d15eaf582_glimr_logo.png" alt="GLIMR" className="h-10 w-10 rounded-lg" />
          <div>
            <span className="font-heading text-xl font-semibold tracking-tight text-primary block leading-none">GLIMR</span>
            <span className="text-[10px] text-muted-foreground tracking-wide uppercase">Marketing Hub</span>
          </div>
        </Link>
        <Link to="/" className="flex items-center gap-1.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted">
          <ChevronLeft className="w-4 h-4" />
          Back to app
        </Link>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Intro */}
        <div className="mb-10">
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight mb-2">Marketing Hub</h1>
          <p className="text-muted-foreground text-base max-w-2xl">
            Ready-to-post content for Facebook, Instagram, and TikTok. Copy captions, download videos, and share your landing pages.
          </p>
        </div>

        {/* Landing pages */}
        <section className="mb-12">
          <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-primary" />
            Landing Pages
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {LANDING_PAGES.map((lp) => {
              const fullUrl = `${window.location.origin}${lp.url}`;
              return (
                <div key={lp.url} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm font-medium mb-1">{lp.label}</p>
                  <div className="flex items-center gap-2">
                    <Link to={lp.url} className="text-xs text-primary hover:underline flex-1 truncate">{fullUrl}</Link>
                    <CopyButton text={fullUrl} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Video assets */}
        <section className="mb-12">
          <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Video Assets
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {VIDEO_ASSETS.map((v) => (
              <div key={v.url} className="rounded-xl border border-border bg-card overflow-hidden">
                <video src={v.url} autoPlay loop muted playsInline className="w-full aspect-video object-cover" />
                <div className="p-3">
                  <p className="text-sm font-medium mb-2">{v.label}</p>
                  <a href={v.url} download target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Social media posts */}
        <section>
          <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Social Media Posts
          </h2>

          {/* Platform filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { key: "all", label: "All Posts" },
              { key: "facebook", label: "Facebook" },
              { key: "instagram", label: "Instagram" },
              { key: "tiktok", label: "TikTok" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === f.key
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPosts.map((post, i) => (
              <PostCard key={i} post={post} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}