import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const pressures = [
  "Cost of living ↑",
  "Interest rates ↑",
  "Capital gains tax",
  "Stamp duty",
];

const ITEM_DURATION = 2200; // ms each item stays visible
const INTRO_DELAY  = 1400; // ms before first item appears

interface SceneMiaProps {
  muted?: boolean;
}

export function SceneMia({ muted = false }: SceneMiaProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    // Start cycling after intro delay
    const start = setTimeout(() => {
      setActiveIndex(0);
    }, INTRO_DELAY);

    // Advance through each item
    const timers = pressures.map((_, i) =>
      setTimeout(() => {
        setActiveIndex(i + 1 < pressures.length ? i + 1 : null);
      }, INTRO_DELAY + ITEM_DURATION * (i + 1))
    );

    return () => {
      clearTimeout(start);
      timers.forEach(clearTimeout);
    };
  }, []);

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
        className="absolute inset-0 w-full h-full object-cover object-top"
        autoPlay
        playsInline
        muted={muted}
      />

      {/* ── Cinematic overlays ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050d1a] via-[#050d1a]/40 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050d1a]/80 via-transparent to-[#050d1a]/30 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050d1a]/60 via-transparent to-transparent pointer-events-none" />

      {/* ── Gold ambient glow ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.18 }}
        transition={{ delay: 0.5, duration: 2 }}
        style={{
          background: 'radial-gradient(ellipse 55% 70% at 55% 45%, rgba(245,185,66,0.35) 0%, transparent 70%)',
        }}
      />

      {/* ── Cycling lower-third pressure point ── */}
      <div className="absolute bottom-[18vh] left-[3vw] z-20 h-[6vh] flex items-center">
        <AnimatePresence mode="wait">
          {activeIndex !== null && (
            <motion.div
              key={activeIndex}
              className="flex items-center gap-[0.8vw]"
              initial={{ opacity: 0, x: -50, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.92 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <div className="w-[0.25vw] h-[3.5vh] bg-[var(--color-primary)] rounded-full shrink-0" />
              <span className="text-white text-[2.2vw] font-bold tracking-wide leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                {pressures[activeIndex]}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── $2.6B stat ── */}
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
