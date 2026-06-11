import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { SceneMia } from './video_scenes/SceneMia';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { SceneStratton } from './video_scenes/SceneStratton';
import { Scene5 } from './video_scenes/Scene5';

export const SCENE_DURATIONS: Record<string, number> = {
  mia: 21000,
  opportunity: 6000,
  solution: 6000,
  services: 7500,
  stratton: 7000,
  cta: 6000,
};

const SCENE_START_SEC: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  let cumulativeMs = 0;
  for (const [key, ms] of Object.entries(SCENE_DURATIONS)) {
    out[key] = cumulativeMs / 1000;
    cumulativeMs += ms;
  }
  return out;
})();

const AUDIO_SEEK_EPSILON_SEC = 0.18;

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  muted = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  muted?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // Duck bg music during Mia's spoken scene so her voice comes through clearly
    audio.volume = baseSceneKey === 'mia' ? 0.08 : 0.45;
    const targetTime = SCENE_START_SEC[baseSceneKey] ?? 0;
    if (Math.abs(audio.currentTime - targetTime) > AUDIO_SEEK_EPSILON_SEC) {
      audio.currentTime = targetTime;
    }
    audio.play().catch(() => {});
  }, [currentSceneKey, baseSceneKey, muted]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--color-bg-dark)] font-body">
      {/* Persistent Background Video */}
      <div className="absolute inset-0 w-full h-full opacity-60">
        <video
          src={`${import.meta.env.BASE_URL}videos/bg-particles.mp4`}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-dark)] via-transparent to-[var(--color-bg-dark)] opacity-80" />
      </div>

      {/* Persistent Animated Gradient */}
      <div className="absolute inset-0 mix-blend-screen opacity-30">
        <motion.div
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px]"
          style={{ backgroundColor: 'var(--color-secondary)' }}
          animate={{
            x: sceneIndex % 2 === 0 ? '5vw' : '20vw',
            y: sceneIndex % 2 === 0 ? '5vh' : '15vh',
            scale: sceneIndex % 2 === 0 ? 1 : 1.2,
          }}
          transition={{ duration: 4, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[150px]"
          style={{ backgroundColor: 'var(--color-primary)' }}
          animate={{
            x: sceneIndex % 2 === 0 ? '-10vw' : '-25vw',
            y: sceneIndex % 2 === 0 ? '-5vh' : '-20vh',
            scale: sceneIndex % 2 === 0 ? 1.2 : 1,
          }}
          transition={{ duration: 5, ease: 'easeInOut' }}
        />
      </div>

      <AnimatePresence mode="popLayout">
        {baseSceneKey === 'mia' && (
          <SceneMia key={currentSceneKey} muted={muted} />
        )}
        {baseSceneKey === 'opportunity' && <Scene2 key={currentSceneKey} />}
        {baseSceneKey === 'solution' && <Scene3 key={currentSceneKey} />}
        {baseSceneKey === 'services' && <Scene4 key={currentSceneKey} />}
        {baseSceneKey === 'stratton' && <SceneStratton key={currentSceneKey} />}
        {baseSceneKey === 'cta' && <Scene5 key={currentSceneKey} />}
      </AnimatePresence>

      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}audio/bg_music.mp3`}
        preload="auto"
        autoPlay
        muted={muted}
      />
    </div>
  );
}
