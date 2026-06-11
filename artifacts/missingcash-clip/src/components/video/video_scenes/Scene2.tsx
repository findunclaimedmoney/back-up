import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 4000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      {...sceneTransitions.clipPolygon}
    >
      <div className="absolute inset-0 w-full h-full opacity-30 mix-blend-overlay">
        <motion.img 
          src={`${import.meta.env.BASE_URL}images/happy-person.jpg`}
          className="w-full h-full object-cover"
          initial={{ scale: 1.2, x: '-5%' }}
          animate={{ scale: 1, x: '0%' }}
          transition={{ duration: 6, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg-dark)] via-[var(--color-bg-dark)]/80 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-[80vw] px-[10vw]">
        <motion.h2 
          className="text-[6vw] font-display font-bold text-white leading-[1.1] tracking-tight"
          initial={{ opacity: 0, x: -50 }}
          animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Is some of it <br />
          <span className="text-[var(--color-primary)]">yours?</span>
        </motion.h2>

        <motion.div 
          className="mt-8 flex items-center gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="w-16 h-16 rounded-full bg-[var(--color-secondary)] flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-[2.5vw] text-white/90 font-medium">
            We'll help you find out.
          </p>
        </motion.div>
      </div>

      <motion.div 
        className="absolute right-[10vw] top-1/2 -translate-y-1/2 w-[30vw] h-[30vw]"
        initial={{ opacity: 0, scale: 0.5, rotate: 20 }}
        animate={phase >= 3 ? { opacity: 0.8, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.5, rotate: 20 }}
        transition={{ type: 'spring', stiffness: 150, damping: 20 }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/coins.png`}
          alt="Coins"
          className="w-full h-full object-contain drop-shadow-2xl"
        />
      </motion.div>
    </motion.div>
  );
}
