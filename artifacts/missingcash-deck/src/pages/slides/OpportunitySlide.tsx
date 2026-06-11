export default function OpportunitySlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#060E1C" }}>
      {/* Subtle left glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 70% at 20% 50%, rgba(245,185,66,0.09) 0%, transparent 65%)",
        }}
      />
      {/* Top gold rule */}
      <div className="absolute top-0 left-0 w-full h-[0.5vh]" style={{ background: "#F5B942" }} />

      {/* Slide label */}
      <p
        className="absolute font-body font-bold uppercase tracking-widest"
        style={{ top: "4vh", left: "5vw", fontSize: "1.3vw", color: "#F5B942", letterSpacing: "0.22em" }}
      >
        The Opportunity
      </p>

      {/* Two-column layout */}
      <div
        className="absolute flex"
        style={{ top: "13vh", left: "5vw", right: "5vw", bottom: "10vh", gap: "4vw" }}
      >
        {/* Left — big stat */}
        <div className="flex flex-col justify-center" style={{ flex: "0 0 46%" }}>
          <p
            className="font-display font-black tracking-tighter"
            style={{ fontSize: "13vw", color: "#F5B942", lineHeight: 0.9, letterSpacing: "-0.04em" }}
          >
            $2.6B
          </p>
          <p
            className="font-display font-bold uppercase tracking-wide"
            style={{ fontSize: "2vw", color: "#FFFFFF", marginTop: "2vh", letterSpacing: "0.06em" }}
          >
            Unclaimed in Australia
          </p>
          <p
            className="font-body"
            style={{ fontSize: "1.8vw", color: "#6E8FA8", marginTop: "1.5vh", lineHeight: 1.5 }}
          >
            Lost super, forgotten bank accounts, and unclaimed shares held by the ATO, ASIC, and Australian banks.
          </p>
          <p
            className="font-display font-bold uppercase"
            style={{ fontSize: "1.6vw", color: "#00C1D5", marginTop: "2.5vh", letterSpacing: "0.1em" }}
          >
            100% free to search — no sign-up required
          </p>
        </div>

        {/* Vertical divider */}
        <div style={{ width: "0.1vw", background: "rgba(245,185,66,0.2)", alignSelf: "stretch" }} />

        {/* Right — why audience converts */}
        <div className="flex flex-col justify-center" style={{ flex: 1 }}>
          <p
            className="font-display font-black uppercase tracking-tight"
            style={{ fontSize: "2.6vw", color: "#FFFFFF", marginBottom: "3.5vh", textWrap: "balance" }}
          >
            Why this audience converts
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "3vh" }}>
            {/* Point 1 */}
            <div className="flex" style={{ gap: "1.8vw", alignItems: "flex-start" }}>
              <div
                className="font-display font-black flex-shrink-0"
                style={{ fontSize: "2.2vw", color: "#F5B942", lineHeight: 1, width: "2.8vw" }}
              >
                01
              </div>
              <div>
                <p className="font-display font-bold uppercase" style={{ fontSize: "1.9vw", color: "#FFFFFF", lineHeight: 1.1 }}>
                  Found money mindset
                </p>
                <p className="font-body" style={{ fontSize: "1.6vw", color: "#6E8FA8", marginTop: "0.8vh", lineHeight: 1.45 }}>
                  Discovering unclaimed funds creates a positive financial moment — visitors arrive in a confident, action-ready state.
                </p>
              </div>
            </div>
            {/* Point 2 */}
            <div className="flex" style={{ gap: "1.8vw", alignItems: "flex-start" }}>
              <div
                className="font-display font-black flex-shrink-0"
                style={{ fontSize: "2.2vw", color: "#F5B942", lineHeight: 1, width: "2.8vw" }}
              >
                02
              </div>
              <div>
                <p className="font-display font-bold uppercase" style={{ fontSize: "1.9vw", color: "#FFFFFF", lineHeight: 1.1 }}>
                  Higher intent than cold leads
                </p>
                <p className="font-body" style={{ fontSize: "1.6vw", color: "#6E8FA8", marginTop: "0.8vh", lineHeight: 1.45 }}>
                  A visitor who just found money is far more likely to act on a tailored finance offer than a cold prospect.
                </p>
              </div>
            </div>
            {/* Point 3 */}
            <div className="flex" style={{ gap: "1.8vw", alignItems: "flex-start" }}>
              <div
                className="font-display font-black flex-shrink-0"
                style={{ fontSize: "2.2vw", color: "#F5B942", lineHeight: 1, width: "2.8vw" }}
              >
                03
              </div>
              <div>
                <p className="font-display font-bold uppercase" style={{ fontSize: "1.9vw", color: "#FFFFFF", lineHeight: 1.1 }}>
                  Mia bridges the gap
                </p>
                <p className="font-body" style={{ fontSize: "1.6vw", color: "#6E8FA8", marginTop: "0.8vh", lineHeight: 1.45 }}>
                  Our AI assistant guides visitors from discovery to finance enquiry — Stratton receives warm, pre-qualified leads.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom teal accent bar */}
      <div className="absolute bottom-0 left-0 w-full h-[0.35vh]" style={{ background: "#00C1D5" }} />
    </div>
  );
}
