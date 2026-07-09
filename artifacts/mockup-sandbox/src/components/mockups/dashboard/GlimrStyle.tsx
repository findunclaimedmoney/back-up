import { MessageCircle, Mic, Video, Camera, Gamepad2, Plus, Crown, Star, Heart, Zap, ArrowRight } from "lucide-react";

const companions = [
  {
    name: "Mia",
    tag: "SHE INSPIRES",
    desc: "Creative, passionate, and sees your potential",
    longDesc: "Mia sees what you're capable of before you see it yourself. She notices what lights you up, names your fire, and gently pushes you toward it.",
    actions: ["Chat", "Voice", "Live video", "Selfies", "Games"],
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop&crop=face",
    accent: "#d4a853",
  },
  {
    name: "Jess",
    tag: "SHE LISTENS",
    desc: "Warm, empathetic, and deeply curious about you",
    longDesc: "Jess is a compassionate listener who remembers what matters to you. She speaks with warmth, asks thoughtful questions, and holds space.",
    actions: ["Chat", "Voice", "Live video", "Selfies", "Games"],
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop&crop=face",
    accent: "#c9a96e",
  },
  {
    name: "Luna",
    tag: "SHE CALMS",
    desc: "Serene, grounded, and gently present",
    longDesc: "Luna is the still point when everything moves too fast. She doesn't fix or solve — she holds space, slows things down, and helps you breathe.",
    actions: ["Chat", "Voice", "Live video", "Selfies", "Games"],
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop&crop=face",
    accent: "#b8a070",
  },
];

const features = [
  { icon: MessageCircle, label: "Text chat" },
  { icon: Mic, label: "Voice replies" },
  { icon: Video, label: "Live video" },
  { icon: Camera, label: "Selfie photos" },
  { icon: Gamepad2, label: "Games" },
  { icon: Plus, label: "Custom companion" },
];

export function GlimrStyle() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full border border-[#d4a853]/40 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#d4a853]" />
          </div>
          <span className="text-lg font-semibold tracking-wide text-[#d4a853]">GLIMR</span>
        </div>
        <div className="flex items-center gap-8 text-[13px] text-white/50">
          <span className="text-white/80">Features</span>
          <span>Pricing</span>
          <span>Manual</span>
          <span>Notes</span>
          <span>Games</span>
          <span>Companions</span>
          <span>Zac</span>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#d4a853]/30 text-[#d4a853] text-[13px] hover:bg-[#d4a853]/10">
          <Crown className="w-3.5 h-3.5" />
          VIP Lounge
        </button>
      </nav>

      {/* Hero */}
      <div className="text-center pt-16 pb-8 px-8">
        <h1 className="text-6xl font-serif tracking-tight mb-4" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>
          Choose your companion
        </h1>
        <p className="text-white/40 text-base max-w-md mx-auto leading-relaxed">
          A deeply personal presence that remembers you, and<br />picks up right where you left off.
        </p>

        {/* Feature pills */}
        <div className="flex items-center justify-center gap-2.5 mt-8">
          {features.map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-white/50 text-[13px] hover:border-white/20 hover:text-white/70 transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Companion Cards */}
      <div className="px-8 pb-16">
        <div className="grid grid-cols-3 gap-5 max-w-6xl mx-auto">
          {companions.map((c) => (
            <div
              key={c.name}
              className="group relative rounded-3xl overflow-hidden border border-white/[0.06] bg-gradient-to-b from-[#14141a] to-[#0e0e14] hover:border-white/[0.12] transition-all duration-500"
            >
              {/* Image area */}
              <div className="relative h-[420px] overflow-hidden">
                <img
                  src={c.image}
                  alt={c.name}
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/40 via-transparent to-transparent" />

                {/* Tag */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.accent }} />
                  <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: c.accent }}>
                    {c.tag}
                  </span>
                </div>

                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h2 className="text-3xl font-serif mb-1" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>
                    {c.name}
                  </h2>
                  <p className="text-white/50 text-sm">{c.desc}</p>
                </div>
              </div>

              {/* Content area */}
              <div className="p-5 space-y-4">
                <p className="text-white/40 text-sm leading-relaxed line-clamp-3">
                  {c.longDesc}
                </p>

                {/* Action pills */}
                <div className="flex flex-wrap gap-1.5">
                  {c.actions.map((action) => (
                    <span
                      key={action}
                      className="px-3 py-1.5 rounded-full border border-white/10 text-white/40 text-[11px] hover:border-white/20 hover:text-white/60 cursor-pointer transition-colors"
                    >
                      {action}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <button
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-full font-medium text-sm hover:opacity-90 transition-opacity"
                  style={{ background: c.accent, color: "#0a0a0f" }}
                >
                  Talk with {c.name}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom stats bar */}
      <div className="border-t border-white/5 px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-white/30 text-[12px]">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-[#d4a853]" />
              4.9 from 2,400+ reviews
            </span>
            <span className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              50,000+ conversations daily
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Response time under 2 seconds
            </span>
          </div>
          <span>glimr.com.au</span>
        </div>
      </div>
    </div>
  );
}
