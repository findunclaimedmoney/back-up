const base = import.meta.env.BASE_URL;

export default function StrattonSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#060E1C" }}>
      {/* Teal radial glow — right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 70% at 80% 50%, rgba(0,193,213,0.08) 0%, transparent 65%)",
        }}
      />
      {/* Top gold rule */}
      <div className="absolute top-0 left-0 w-full h-[0.5vh]" style={{ background: "#F5B942" }} />

      {/* Slide label */}
      <p
        className="absolute font-body font-bold uppercase tracking-widest"
        style={{ top: "4vh", left: "5vw", fontSize: "1.3vw", color: "#F5B942", letterSpacing: "0.22em" }}
      >
        Our Finance Partner
      </p>

      {/* Header row: logo + headline */}
      <div
        className="absolute flex items-center"
        style={{ top: "12.5vh", left: "5vw", right: "5vw", gap: "3vw" }}
      >
        <img
          src={`${base}stratton-logo.png`}
          crossOrigin="anonymous"
          alt="Stratton Finance"
          style={{ height: "7vh", objectFit: "contain", background: "rgba(255,255,255,0.07)", padding: "1vh 1.8vw", borderRadius: "1vh" }}
        />
        <div>
          <p
            className="font-display font-black uppercase tracking-tight"
            style={{ fontSize: "3.6vw", color: "#FFFFFF", lineHeight: 1, letterSpacing: "-0.01em" }}
          >
            Stratton Finance
          </p>
          <p
            className="font-body"
            style={{ fontSize: "1.7vw", color: "#6E8FA8", marginTop: "0.6vh" }}
          >
            Australia's leading independent car &amp; asset finance broker — since 1998.
          </p>
        </div>
      </div>

      {/* 4-stat grid */}
      <div
        className="absolute"
        style={{ top: "31vh", left: "5vw", right: "5vw", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "2.2vw" }}
      >
        {/* Stat 1 */}
        <div
          style={{ background: "rgba(245,185,66,0.08)", border: "0.15vh solid rgba(245,185,66,0.25)", borderRadius: "1.2vh", padding: "3vh 0", textAlign: "center" }}
        >
          <p
            className="font-display font-black"
            style={{ fontSize: "6vw", color: "#F5B942", lineHeight: 1, letterSpacing: "-0.03em" }}
          >
            150K+
          </p>
          <p
            className="font-display font-bold uppercase"
            style={{ fontSize: "1.55vw", color: "#FFFFFF", marginTop: "1.2vh", letterSpacing: "0.06em" }}
          >
            Customers
          </p>
        </div>
        {/* Stat 2 */}
        <div
          style={{ background: "rgba(245,185,66,0.08)", border: "0.15vh solid rgba(245,185,66,0.25)", borderRadius: "1.2vh", padding: "3vh 0", textAlign: "center" }}
        >
          <p
            className="font-display font-black"
            style={{ fontSize: "6vw", color: "#F5B942", lineHeight: 1, letterSpacing: "-0.03em" }}
          >
            $8B+
          </p>
          <p
            className="font-display font-bold uppercase"
            style={{ fontSize: "1.55vw", color: "#FFFFFF", marginTop: "1.2vh", letterSpacing: "0.06em" }}
          >
            Finance Funded
          </p>
        </div>
        {/* Stat 3 */}
        <div
          style={{ background: "rgba(245,185,66,0.08)", border: "0.15vh solid rgba(245,185,66,0.25)", borderRadius: "1.2vh", padding: "3vh 0", textAlign: "center" }}
        >
          <p
            className="font-display font-black"
            style={{ fontSize: "6vw", color: "#F5B942", lineHeight: 1, letterSpacing: "-0.03em" }}
          >
            40+
          </p>
          <p
            className="font-display font-bold uppercase"
            style={{ fontSize: "1.55vw", color: "#FFFFFF", marginTop: "1.2vh", letterSpacing: "0.06em" }}
          >
            Lenders
          </p>
        </div>
        {/* Stat 4 */}
        <div
          style={{ background: "rgba(0,193,213,0.08)", border: "0.15vh solid rgba(0,193,213,0.25)", borderRadius: "1.2vh", padding: "3vh 0", textAlign: "center" }}
        >
          <p
            className="font-display font-black"
            style={{ fontSize: "6vw", color: "#00C1D5", lineHeight: 1, letterSpacing: "-0.03em" }}
          >
            4.8★
          </p>
          <p
            className="font-display font-bold uppercase"
            style={{ fontSize: "1.55vw", color: "#FFFFFF", marginTop: "1.2vh", letterSpacing: "0.06em" }}
          >
            ProductReview
          </p>
        </div>
      </div>

      {/* Awards strip */}
      <div
        className="absolute flex items-center"
        style={{ bottom: "8vh", left: "5vw", right: "5vw", gap: "4vw" }}
      >
        <div style={{ flex: 1, height: "0.1vh", background: "rgba(245,185,66,0.2)" }} />
        <p
          className="font-display font-bold uppercase tracking-widest"
          style={{ fontSize: "1.45vw", color: "#F5B942", letterSpacing: "0.15em", whiteSpace: "nowrap" }}
        >
          Best Car Loans 2021–2026
        </p>
        <div style={{ width: "0.3vw", height: "2vh", background: "rgba(245,185,66,0.35)" }} />
        <p
          className="font-display font-bold uppercase tracking-widest"
          style={{ fontSize: "1.45vw", color: "#F5B942", letterSpacing: "0.15em", whiteSpace: "nowrap" }}
        >
          Best Large-Size Brokerage 2023–2024
        </p>
        <div style={{ flex: 1, height: "0.1vh", background: "rgba(245,185,66,0.2)" }} />
      </div>

      {/* Bottom teal accent bar */}
      <div className="absolute bottom-0 left-0 w-full h-[0.35vh]" style={{ background: "#00C1D5" }} />
    </div>
  );
}
