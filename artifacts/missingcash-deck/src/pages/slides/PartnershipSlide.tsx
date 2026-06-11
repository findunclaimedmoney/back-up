const base = import.meta.env.BASE_URL;

export default function PartnershipSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#060E1C" }}>
      {/* Subtle centre glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 55%, rgba(0,193,213,0.07) 0%, transparent 70%)",
        }}
      />
      {/* Top gold rule */}
      <div className="absolute top-0 left-0 w-full h-[0.5vh]" style={{ background: "#F5B942" }} />

      {/* Slide label */}
      <p
        className="absolute font-body font-bold uppercase tracking-widest"
        style={{ top: "4vh", left: "5vw", fontSize: "1.3vw", color: "#F5B942", letterSpacing: "0.22em" }}
      >
        How It Works
      </p>

      {/* Headline */}
      <p
        className="absolute font-display font-black uppercase tracking-tight text-center"
        style={{ top: "12.5vh", left: "5vw", right: "5vw", fontSize: "3.8vw", color: "#FFFFFF", lineHeight: 1, letterSpacing: "-0.01em" }}
      >
        How the Partnership Works
      </p>

      {/* 4 steps — horizontal row */}
      <div
        className="absolute flex"
        style={{ top: "27vh", left: "5vw", right: "5vw", bottom: "14vh", gap: "2.5vw" }}
      >
        {/* Step 1 */}
        <div
          className="flex flex-col"
          style={{ flex: 1, background: "rgba(245,185,66,0.06)", border: "0.15vh solid rgba(245,185,66,0.2)", borderRadius: "1.5vh", padding: "3.5vh 2.2vw" }}
        >
          <p
            className="font-display font-black"
            style={{ fontSize: "5.5vw", color: "#F5B942", lineHeight: 1, opacity: 0.35, letterSpacing: "-0.03em" }}
          >
            01
          </p>
          <p
            className="font-display font-bold uppercase"
            style={{ fontSize: "2vw", color: "#FFFFFF", marginTop: "2vh", lineHeight: 1.15, letterSpacing: "0.04em" }}
          >
            Visitor Searches
          </p>
          <p
            className="font-body"
            style={{ fontSize: "1.6vw", color: "#6E8FA8", marginTop: "1.5vh", lineHeight: 1.5 }}
          >
            Free search across ATO, ASIC, and major banks. No account needed.
          </p>
        </div>

        {/* Arrow 1 */}
        <div className="flex items-center justify-center flex-shrink-0" style={{ width: "2.5vw" }}>
          <div style={{ fontSize: "2.5vw", color: "#F5B942", opacity: 0.5, fontWeight: 900 }}>→</div>
        </div>

        {/* Step 2 */}
        <div
          className="flex flex-col"
          style={{ flex: 1, background: "rgba(245,185,66,0.06)", border: "0.15vh solid rgba(245,185,66,0.2)", borderRadius: "1.5vh", padding: "3.5vh 2.2vw" }}
        >
          <p
            className="font-display font-black"
            style={{ fontSize: "5.5vw", color: "#F5B942", lineHeight: 1, opacity: 0.35, letterSpacing: "-0.03em" }}
          >
            02
          </p>
          <div className="flex items-center" style={{ marginTop: "2vh", gap: "1vw" }}>
            <img
              src={`${base}mia-avatar.png`}
              crossOrigin="anonymous"
              alt="Mia"
              style={{ width: "4vh", height: "4vh", borderRadius: "50%", border: "0.2vh solid #F5B942", objectFit: "cover" }}
            />
            <p
              className="font-display font-bold uppercase"
              style={{ fontSize: "2vw", color: "#FFFFFF", lineHeight: 1.15, letterSpacing: "0.04em" }}
            >
              Mia Guides
            </p>
          </div>
          <p
            className="font-body"
            style={{ fontSize: "1.6vw", color: "#6E8FA8", marginTop: "1.5vh", lineHeight: 1.5 }}
          >
            Our AI assistant answers questions, explains claim steps, and introduces Stratton Finance at the right moment.
          </p>
        </div>

        {/* Arrow 2 */}
        <div className="flex items-center justify-center flex-shrink-0" style={{ width: "2.5vw" }}>
          <div style={{ fontSize: "2.5vw", color: "#F5B942", opacity: 0.5, fontWeight: 900 }}>→</div>
        </div>

        {/* Step 3 */}
        <div
          className="flex flex-col"
          style={{ flex: 1, background: "rgba(245,185,66,0.06)", border: "0.15vh solid rgba(245,185,66,0.2)", borderRadius: "1.5vh", padding: "3.5vh 2.2vw" }}
        >
          <p
            className="font-display font-black"
            style={{ fontSize: "5.5vw", color: "#F5B942", lineHeight: 1, opacity: 0.35, letterSpacing: "-0.03em" }}
          >
            03
          </p>
          <p
            className="font-display font-bold uppercase"
            style={{ fontSize: "2vw", color: "#FFFFFF", marginTop: "2vh", lineHeight: 1.15, letterSpacing: "0.04em" }}
          >
            Warm Handoff
          </p>
          <p
            className="font-body"
            style={{ fontSize: "1.6vw", color: "#6E8FA8", marginTop: "1.5vh", lineHeight: 1.5 }}
          >
            Interested visitors are connected directly to Erin Crofton — finance consultant, Wanneroo, Perth.
          </p>
        </div>

        {/* Arrow 3 */}
        <div className="flex items-center justify-center flex-shrink-0" style={{ width: "2.5vw" }}>
          <div style={{ fontSize: "2.5vw", color: "#00C1D5", opacity: 0.6, fontWeight: 900 }}>→</div>
        </div>

        {/* Step 4 */}
        <div
          className="flex flex-col"
          style={{ flex: 1, background: "rgba(0,193,213,0.07)", border: "0.15vh solid rgba(0,193,213,0.3)", borderRadius: "1.5vh", padding: "3.5vh 2.2vw" }}
        >
          <p
            className="font-display font-black"
            style={{ fontSize: "5.5vw", color: "#00C1D5", lineHeight: 1, opacity: 0.45, letterSpacing: "-0.03em" }}
          >
            04
          </p>
          <p
            className="font-display font-bold uppercase"
            style={{ fontSize: "2vw", color: "#FFFFFF", marginTop: "2vh", lineHeight: 1.15, letterSpacing: "0.04em" }}
          >
            Stratton Closes
          </p>
          <p
            className="font-body"
            style={{ fontSize: "1.6vw", color: "#6E8FA8", marginTop: "1.5vh", lineHeight: 1.5 }}
          >
            Stratton Finance delivers the tailored loan across 40+ lenders. Deal done.
          </p>
        </div>
      </div>

      {/* Closing line */}
      <p
        className="absolute text-center font-display font-bold uppercase tracking-widest"
        style={{ bottom: "4.5vh", left: "5vw", right: "5vw", fontSize: "1.6vw", color: "#F5B942", letterSpacing: "0.18em", opacity: 0.8 }}
      >
        MissingCash brings the lead — Stratton Finance closes the deal.
      </p>

      {/* Bottom teal accent bar */}
      <div className="absolute bottom-0 left-0 w-full h-[0.35vh]" style={{ background: "#00C1D5" }} />
    </div>
  );
}
