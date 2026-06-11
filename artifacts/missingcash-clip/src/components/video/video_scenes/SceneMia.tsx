import { motion } from 'framer-motion';

const pressures = [
  "Cost of living ↑",
  "Interest rates ↑",
  "Capital gains tax",
  "Stamp duty",
];

interface SceneMiaProps {
  muted?: boolean;
}

export function SceneMia({ muted = false }: SceneMiaProps) {
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* ── Full-bleed Mia video ── */}
      <video
        src={`${import.meta.env.BASE_URL}videos/mia-talk.mp4`}
        className="absolute inset-0 w-full h-full object-cover object-center"
        autoPlay
        playsInline
        muted={muted}
      />

      {/* ── Cinematic overlays ── */}
      {/* bottom-to-top dark gradient — grounds her feet */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050d1a] via-[#050d1a]/40 to-transparent pointer-events-none" />
      {/* left dark vignette — space for lower thirds */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#050d1a]/80 via-transparent to-[#050d1a]/30 pointer-events-none" />
      {/* top vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050d1a]/60 via-transparent to-transparent pointer-events-none" />

      {/* ── Gold ambient glow behind Mia ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.18 }}
        transition={{ delay: 0.5, duration: 2 }}
        style={{
          background: 'radial-gradient(ellipse 55% 70% at 55% 45%, rgba(245,185,66,0.35) 0%, transparent 70%)',
        }}
      />

      {/* ── AI Avatar badge — top left ── */}
      <motion.div
        className="absolute top-[5vh] left-[3vw] z-20"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <span className="inline-flex items-center gap-2 bg-black/50 backdrop-blur-sm border border-[var(--color-primary)]/50 rounded-full px-[1.2vw] py-[0.5vh]">
          <span className="w-[0.5vw] h-[0.5vw] rounded-full bg-[var(--color-primary)] animate-pulse" />
          <span className="text-[var(--color-primary)] text-[0.7vw] font-bold tracking-widest uppercase">
            Australia's First AI Avatar
          </span>
        </span>
      </motion.div>

      {/* ── Lower-third pressure cards ── */}
      <div className="absolute bottom-[18vh] left-[3vw] z-20 flex flex-col gap-[1vh]">
        {pressures.map((line, i) => (
          <motion.div
            key={line}
            className="flex items-center gap-[0.8vw]"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4 + i * 0.5, duration: 0.4, ease: 'easeOut' }}
          >
            <div className="w-[0.25vw] h-[3vh] bg-[var(--color-primary)] rounded-full shrink-0" />
            <span className="text-white text-[1.4vw] font-semibold tracking-wide leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {line}
            </span>
          </motion.div>
        ))}
      </div>

      {/* ── $2.6B stat — bottom centre, dramatic ── */}
      <motion.div
        className="absolute bottom-[5vh] left-1/2 -translate-x-1/2 z-20 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 5.2, duration: 0.8, ease: 'easeOut' }}
      >
        <p className="text-white/50 text-[0.65vw] tracking-[0.3em] uppercase mb-[0.4vh]">
          Yet right now — sitting unclaimed
        </p>
        <p
          className="font-heading font-black text-[var(--color-primary)] leading-none"
          style={{ fontSize: '4.5vw', textShadow: '0 0 40px rgba(245,185,66,0.5)' }}
        >
          $2.6 BILLION
        </p>
        <p className="text-white/60 text-[0.75vw] tracking-widest uppercase mt-[0.4vh]">
          of YOUR money · government &amp; bank vaults
        </p>
      </motion.div>

      {/* ── Site URL watermark ── */}
      <motion.div
        className="absolute top-[5vh] right-[3vw] z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <p className="text-white/30 text-[0.65vw] tracking-[0.25em] uppercase">
          missingcash.com.au
        </p>
      </motion.div>
    </motion.div>
  );
}
