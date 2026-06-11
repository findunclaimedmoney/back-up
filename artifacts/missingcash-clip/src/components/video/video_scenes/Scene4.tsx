import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2400),
      setTimeout(() => setPhase(4), 5000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col justify-center px-[10vw] overflow-hidden bg-[var(--color-bg-dark)]"
      {...sceneTransitions.pushLeft}
    >
      <motion.div
        className="mb-[6vh]"
        initial={{ opacity: 0, x: -40 }}
        animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <span className="inline-block px-6 py-2 rounded-full bg-[var(--color-secondary)]/20 text-[var(--color-secondary)] font-bold text-[2vw] uppercase tracking-wider mb-4 border border-[var(--color-secondary)]/30">
          Always Free To Search
        </span>
        <h2 className="text-[5vw] font-display font-black text-white leading-tight">
          Recovery <br />
          <span className="text-[var(--color-primary)]">Made Simple.</span>
        </h2>
      </motion.div>

      <div className="flex gap-[4vw]">
        {/* Card 1 */}
        <motion.div 
          className="flex-1 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-[3vw] backdrop-blur-sm relative overflow-hidden"
          initial={{ opacity: 0, y: 50, rotateX: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 50, rotateX: 20 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="absolute top-0 right-0 w-[15vw] h-[15vw] bg-[var(--color-secondary)]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <h3 className="text-[3vw] font-bold text-white mb-2">Mia Speed Recovery</h3>
          <p className="text-[1.8vw] text-white/70 mb-4">AI-guided, fast and easy.</p>
          <div className="text-[var(--color-secondary)] font-bold text-[2.5vw]">$99</div>
        </motion.div>

        {/* Card 2 */}
        <motion.div 
          className="flex-1 bg-gradient-to-br from-[var(--color-primary)]/20 to-transparent border border-[var(--color-primary)]/30 rounded-3xl p-[3vw] backdrop-blur-sm relative overflow-hidden"
          initial={{ opacity: 0, y: 50, rotateX: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 50, rotateX: 20 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="absolute top-0 right-0 w-[15vw] h-[15vw] bg-[var(--color-primary)]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute -top-3 -right-3">
            <span className="bg-[var(--color-primary)] text-[var(--color-bg-dark)] text-[1.2vw] font-bold px-4 py-1 rounded-bl-xl rounded-tr-xl">POPULAR</span>
          </div>
          <h3 className="text-[3vw] font-bold text-white mb-2">Done For You</h3>
          <p className="text-[1.8vw] text-white/70 mb-4">We handle everything.</p>
          <div className="text-[var(--color-primary)] font-bold text-[2.5vw]">$149</div>
        </motion.div>
      </div>
    </motion.div>
  );
}
