const base = import.meta.env.BASE_URL;

export default function TitleSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#060E1C" }}>
      {/* Radial gold glow, centre */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(245,185,66,0.13) 0%, transparent 70%)",
        }}
      />
      {/* Top gold rule */}
      <div className="absolute top-0 left-0 w-full h-[0.5vh]" style={{ background: "#F5B942" }} />

      {/* Main content — centred column */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ gap: "3.5vh" }}>
        {/* Logo row */}
        <div className="flex items-center justify-center" style={{ gap: "4vw" }}>
          <img
            src={`${base}mia-avatar.png`}
            crossOrigin="anonymous"
            alt="Mia — AI assistant"
            style={{ width: "11vh", height: "11vh", borderRadius: "50%", border: "0.4vh solid #F5B942", objectFit: "cover" }}
          />
          {/* × divider */}
          <span
            className="font-display font-black tracking-tighter"
            style={{ fontSize: "4vw", color: "#F5B942", lineHeight: 1 }}
          >
            ×
          </span>
          <img
            src={`${base}stratton-logo.png`}
            crossOrigin="anonymous"
            alt="Stratton Finance"
            style={{ height: "8vh", objectFit: "contain", background: "rgba(255,255,255,0.07)", padding: "1.2vh 2vw", borderRadius: "1vh" }}
          />
        </div>

        {/* Headline */}
        <div className="text-center" style={{ lineHeight: 1 }}>
          <p
            className="font-display font-black tracking-tight uppercase"
            style={{ fontSize: "5.8vw", color: "#FFFFFF", letterSpacing: "-0.02em", textWrap: "balance" }}
          >
            MissingCash
          </p>
          <p
            className="font-display font-black tracking-tight uppercase"
            style={{ fontSize: "5.8vw", color: "#F5B942", letterSpacing: "-0.02em", textWrap: "balance" }}
          >
            Stratton Finance
          </p>
        </div>

        {/* Gold rule */}
        <div style={{ width: "16vw", height: "0.3vh", background: "#F5B942", opacity: 0.6 }} />

        {/* Tagline */}
        <p
          className="font-display font-bold uppercase tracking-widest text-center"
          style={{ fontSize: "2.2vw", color: "#FFFFFF", letterSpacing: "0.25em" }}
        >
          Find it.&nbsp;&nbsp;Claim it.&nbsp;&nbsp;Fund it.
        </p>

        {/* Subline */}
        <p
          className="font-body text-center"
          style={{ fontSize: "1.7vw", color: "#6E8FA8", maxWidth: "42vw", textWrap: "balance" }}
        >
          Australia's free unclaimed money search, paired with award-winning finance.
        </p>
      </div>

      {/* Bottom teal accent bar */}
      <div className="absolute bottom-0 left-0 w-full h-[0.35vh]" style={{ background: "#00C1D5" }} />
    </div>
  );
}
