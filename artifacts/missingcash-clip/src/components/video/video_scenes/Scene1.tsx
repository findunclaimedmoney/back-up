import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 4500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      {...sceneTransitions.fadeBlur}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={`${import.meta.env.BASE_URL}images/bg-mc5.jpg`} className="w-full h-full object-cover blur-sm scale-105" alt="" />
        <div className="absolute inset-0 bg-[#050d1a]/82" />
      </div>

      {/* Background Map Element */}
      <motion.div 
        className="absolute w-[80vw] h-[80vh] opacity-40 mix-blend-screen"
        initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
        animate={{ opacity: 0.4, scale: 1, rotate: 0 }}
        transition={{ duration: 3, ease: 'easeOut' }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/australia.png`} 
          alt="Australia Map"
          className="w-full h-full object-contain"
        />
      </motion.div>

      <div className="relative z-10 text-center w-full max-w-[80vw]">
        <motion.div 
          className="overflow-hidden mb-6"
        >
          <motion.h2 
            className="text-[4vw] font-display font-bold text-[var(--color-secondary)] uppercase tracking-wider"
            initial={{ y: '100%' }}
            animate={phase >= 1 ? { y: '0%' } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            Right Now In Australia
          </motion.h2>
        </motion.div>

        <motion.div
          className="relative inline-block"
          initial={{ opacity: 0, scale: 0.8, y: 40 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 40 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <h1 className="text-[12vw] font-display font-black leading-none tracking-tighter text-[var(--color-primary)] drop-shadow-2xl">
            $2.6 BILLION
          </h1>
        </motion.div>

        <motion.div 
          className="overflow-hidden mt-8"
        >
          <motion.h2 
            className="text-[3.5vw] font-display font-semibold text-white uppercase tracking-widest"
            initial={{ y: '-100%', opacity: 0 }}
            animate={phase >= 3 ? { y: '0%', opacity: 1 } : { y: '-100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            Sits Unclaimed
          </motion.h2>
        </motion.div>
      </div>
    </motion.div>
  );
}
