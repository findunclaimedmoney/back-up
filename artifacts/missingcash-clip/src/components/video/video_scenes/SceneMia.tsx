import { motion } from 'framer-motion';

const lines = [
  "Cost of living ↑",
  "Interest rates ↑",
  "Capital gains tax",
  "Stamp duty",
];

export function SceneMia() {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Left panel — talking head video */}
      <div className="relative flex items-center justify-center w-full h-full">

        {/* Mia video — centred portrait, fills vertical space */}
        <div className="relative h-full aspect-[9/16] max-h-full overflow-hidden">
          {/* Subtle vignette overlay */}
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-[var(--color-bg-dark)] via-transparent to-[var(--color-bg-dark)] opacity-60 pointer-events-none" />
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[var(--color-bg-dark)] via-transparent to-transparent opacity-70 pointer-events-none" />

          <video
            src={`${import.meta.env.BASE_URL}videos/mia-talk.mp4`}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted={false}
          />
        </div>

        {/* Right panel — bullet points stagger in */}
        <div className="absolute right-0 top-0 bottom-0 w-[42%] flex flex-col justify-center pr-12 pl-4 z-20">

          {/* Eyebrow */}
          <motion.p
            className="text-[var(--color-secondary)] text-sm font-bold tracking-[0.2em] uppercase mb-6"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            Sound familiar?
          </motion.p>

          {/* Pain-point bullets */}
          <div className="space-y-3 mb-8">
            {lines.map((line, i) => (
              <motion.div
                key={line}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2 + i * 0.55, duration: 0.45, ease: 'easeOut' }}
              >
                <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0" />
                <span className="text-white/90 text-xl font-semibold">{line}</span>
              </motion.div>
            ))}
          </div>

          {/* Big reveal */}
          <motion.div
            className="border-l-4 border-[var(--color-primary)] pl-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 5.8, duration: 0.6, ease: 'easeOut' }}
          >
            <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Yet right now</p>
            <p className="text-[var(--color-primary)] text-3xl font-heading font-black leading-tight">
              $2.6B
            </p>
            <p className="text-white/80 text-sm leading-snug mt-1">
              of your money sits<br />unclaimed in their vaults
            </p>
          </motion.div>

          {/* CTA badge */}
          <motion.div
            className="mt-8 inline-flex items-center gap-2 bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/40 rounded-full px-4 py-2 w-fit"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 14, duration: 0.5, type: 'spring' }}
          >
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
            <span className="text-[var(--color-primary)] text-sm font-bold tracking-wide">
              Let's find your money →
            </span>
          </motion.div>
        </div>

        {/* Bottom brand tag */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <p className="text-white/40 text-xs tracking-[0.25em] uppercase">missingcash.com.au</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
