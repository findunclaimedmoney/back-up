import { motion } from 'framer-motion';

const loanTypes = [
  { icon: '🏠', label: 'Home Loans' },
  { icon: '🚗', label: 'Car Finance' },
  { icon: '💼', label: 'Business Loans' },
  { icon: '💳', label: 'Personal Loans' },
];

export function SceneStratton() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={`${import.meta.env.BASE_URL}images/bg-mc1.jpg`} className="w-full h-full object-cover" alt="" />
        <div className="absolute inset-0 bg-[#050d1a]/68" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full">
      {/* Top eyebrow */}
      <motion.div
        className="flex items-center gap-3 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="h-px w-12 bg-[var(--color-primary)]/50" />
        <p className="text-[var(--color-secondary)] text-xs font-bold tracking-[0.25em] uppercase">
          Our Finance Partner
        </p>
        <div className="h-px w-12 bg-[var(--color-primary)]/50" />
      </motion.div>

      {/* Brand name */}
      <motion.h2
        className="text-6xl md:text-7xl font-heading font-black text-white tracking-wider mb-2 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.55, type: 'spring', stiffness: 120 }}
      >
        Stratton <span className="text-[var(--color-primary)]">Finance</span>
      </motion.h2>

      {/* Advisor name & location */}
      <motion.p
        className="text-white/60 text-lg mb-10 text-center tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        Erin Crofton · Wanneroo, Perth WA · ACL 364340
      </motion.p>

      {/* Loan type grid */}
      <div className="grid grid-cols-4 gap-4 mb-10 w-full max-w-3xl">
        {loanTypes.map((item, i) => (
          <motion.div
            key={item.label}
            className="flex flex-col items-center gap-2 bg-white/5 border border-white/10 rounded-2xl py-5 px-3 backdrop-blur-sm"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 + i * 0.15, duration: 0.4, ease: 'easeOut' }}
          >
            <span className="text-3xl">{item.icon}</span>
            <span className="text-white/80 text-sm font-semibold text-center leading-tight">
              {item.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Value prop */}
      <motion.div
        className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-2xl px-8 py-5 text-center max-w-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.0, duration: 0.5 }}
      >
        <p className="text-white/90 text-lg font-semibold leading-snug">
          Found your missing cash?{' '}
          <span className="text-[var(--color-primary)]">Put it to work.</span>
        </p>
        <p className="text-white/50 text-sm mt-1">
          Expert finance solutions for Western Australians
        </p>
      </motion.div>

      {/* Bottom website */}
      <motion.p
        className="mt-8 text-white/30 text-xs tracking-[0.25em] uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 0.5 }}
      >
        missingcash.com.au
      </motion.p>
      </div>
    </motion.div>
  );
}
