const base = import.meta.env.BASE_URL;

export default function ClosingSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#060E1C" }}>
      {/* Centre radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 65% at 50% 50%, rgba(245,185,66,0.12) 0%, transparent 70%)",
        }}
      />
      {/* Top gold rule */}
      <div className="absolute top-0 left-0 w-full h-[0.5vh]" style={{ background: "#F5B942" }} />

      {/* Main centred content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ gap: "2.8vh" }}>
        {/* Gold rule top */}
        <div style={{ width: "8vw", height: "0.35vh", background: "#F5B942", opacity: 0.5 }} />

        {/* Headline */}
        <p
          className="font-display font-black uppercase tracking-tight text-center"
          style={{ fontSize: "5.5vw", color: "#FFFFFF", lineHeight: 1, letterSpacing: "-0.02em" }}
        >
          Get Started
        </p>

        {/* Gold rule */}
        <div style={{ width: "12vw", height: "0.3vh", background: "#F5B942", opacity: 0.4 }} />

        {/* Two columns: MissingCash | Stratton */}
        <div className="flex" style={{ gap: "8vw", marginTop: "0.5vh" }}>
          {/* MissingCash */}
          <div className="flex flex-col items-center" style={{ gap: "1.2vh" }}>
            <p
              className="font-display font-black uppercase tracking-tight"
              style={{ fontSize: "2vw", color: "#F5B942", letterSpacing: "0.04em" }}
            >
              MissingCash
            </p>
            <p
              className="font-body text-center"
              style={{ fontSize: "1.8vw", color: "#FFFFFF", lineHeight: 1.5 }}
            >
              missingcash.com.au
            </p>
            <p
              className="font-body text-center"
              style={{ fontSize: "1.6vw", color: "#6E8FA8", lineHeight: 1.5 }}
            >
              contact@missingcash.com.au
            </p>
            <p
              className="font-body text-center"
              style={{ fontSize: "1.55vw", color: "#6E8FA8" }}
            >
              ABN 52 347 989 391
            </p>
          </div>

          {/* Vertical divider */}
          <div style={{ width: "0.1vw", background: "rgba(245,185,66,0.25)", alignSelf: "stretch" }} />

          {/* Stratton */}
          <div className="flex flex-col items-center" style={{ gap: "1.2vh" }}>
            <img
              src={`${base}stratton-logo.png`}
              crossOrigin="anonymous"
              alt="Stratton Finance"
              style={{ height: "6vh", objectFit: "contain", background: "rgba(255,255,255,0.07)", padding: "0.8vh 1.6vw", borderRadius: "0.8vh" }}
            />
            <p
              className="font-body text-center"
              style={{ fontSize: "1.8vw", color: "#FFFFFF", lineHeight: 1.5 }}
            >
              Erin Crofton
            </p>
            <p
              className="font-body text-center"
              style={{ fontSize: "1.6vw", color: "#6E8FA8", lineHeight: 1.5 }}
            >
              (08) 9446 9893
            </p>
            <p
              className="font-body text-center"
              style={{ fontSize: "1.55vw", color: "#6E8FA8" }}
            >
              Wanneroo, Perth WA
            </p>
            <p
              className="font-body text-center"
              style={{ fontSize: "1.45vw", color: "#6E8FA8" }}
            >
              ACL 364340
            </p>
          </div>
        </div>

        {/* Tagline */}
        <div style={{ width: "12vw", height: "0.3vh", background: "#F5B942", opacity: 0.35, marginTop: "0.5vh" }} />
        <p
          className="font-display font-bold uppercase tracking-widest text-center"
          style={{ fontSize: "1.8vw", color: "#FFFFFF", letterSpacing: "0.22em", opacity: 0.85 }}
        >
          Find it.&nbsp;&nbsp;Claim it.&nbsp;&nbsp;Fund it.
        </p>
      </div>

      {/* Bottom teal accent bar */}
      <div className="absolute bottom-0 left-0 w-full h-[0.35vh]" style={{ background: "#00C1D5" }} />
    </div>
  );
}
