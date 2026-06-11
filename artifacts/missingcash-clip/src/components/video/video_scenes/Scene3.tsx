import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1300),
      setTimeout(() => setPhase(4), 1800),
      setTimeout(() => setPhase(5), 2300),
      setTimeout(() => setPhase(6), 4500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const sources = [
    { name: "ATO", delay: 2 },
    { name: "ASIC", delay: 3 },
    { name: "Banks", delay: 4 },
    { name: "State Govt", delay: 5 },
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      {...sceneTransitions.slideUp}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#050d1a] via-[#0a1a35] to-[#050d1a]" />

      <div className="relative z-10 w-full flex flex-col items-center">
        <motion.h2 
          className="text-[4vw] font-display font-bold text-white mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          We search across:
        </motion.h2>

        <div className="flex flex-wrap justify-center gap-[3vw] px-[10vw]">
          {sources.map((source, index) => (
            <motion.div 
              key={source.name}
              className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl px-[4vw] py-[3vw] flex items-center justify-center min-w-[20vw]"
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={phase >= source.delay ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <span className="text-[3vw] font-bold text-[var(--color-primary)]">
                {source.name}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="mt-16 w-full flex justify-center"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={phase >= 6 ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[var(--color-secondary)] to-transparent w-[60vw]" />
        </motion.div>
      </div>
    </motion.div>
  );
}
