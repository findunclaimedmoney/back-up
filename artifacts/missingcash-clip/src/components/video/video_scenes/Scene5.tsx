import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      {...sceneTransitions.morphExpand}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={`${import.meta.env.BASE_URL}images/bg-mc5.jpg`} className="w-full h-full object-cover blur-sm scale-105" alt="" />
        <div className="absolute inset-0 bg-[#050d1a]/82" />
      </div>

      <div className="relative z-10 text-center flex flex-col items-center">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className="flex items-center justify-center gap-4">
            <div className="w-[4vw] h-[4vw] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-xl transform rotate-45" />
            <h1 className="text-[5vw] font-display font-black text-white tracking-tight">
              Missing<span className="text-[var(--color-primary)]">Cash</span>
            </h1>
          </div>
        </motion.div>

        <motion.div
          className="overflow-hidden"
        >
          <motion.h2 
            className="text-[3.5vw] font-medium text-white/90 uppercase tracking-widest"
            initial={{ y: '100%' }}
            animate={phase >= 2 ? { y: '0%' } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            Find your missing cash
          </motion.h2>
        </motion.div>

        <motion.div
          className="mt-[6vh] px-12 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="text-[2.5vw] font-mono text-[var(--color-secondary)] font-bold tracking-tight">
            missingcash.com.au
          </p>
        </motion.div>
      </div>

      {/* Decorative Final Particles */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 2 }}
      >
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-[var(--color-primary)]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100],
              opacity: [0, 1, 0],
              scale: [0, Math.random() * 2 + 1, 0],
            }}
            transition={{
              duration: Math.random() * 2 + 2,
              repeat: Infinity,
              ease: "easeOut",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
