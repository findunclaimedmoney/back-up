import { useState, useRef } from "react";
import { Volume2, Loader2, Pause } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Companions using custom ElevenLabs voices (via generateVoice backend function)
const ELEVENLABS_VOICES = ["zac"];

// Built-in preset voices for everyone else
const VOICE_MAP = {
  jess: "honey",
  mia: "sunny",
  luna: "river",
  sophie: "spark",
  natalie: "honey",
};

export default function VoicePlayer({ text, companionId }) {
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const handlePlay = async () => {
    if (audioUrl && audioRef.current) {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        setPlaying(true);
      }
      return;
    }

    setLoading(true);
    try {
      let url;
      if (ELEVENLABS_VOICES.includes(companionId)) {
        const res = await base44.functions.invoke("generateVoice", {
          text: text.slice(0, 5000),
          companion_id: companionId,
        });
        url = res.data?.url;
      } else {
        const result = await base44.integrations.Core.GenerateSpeech({
          text: text.slice(0, 5000),
          voice: VOICE_MAP[companionId] || "honey",
        });
        url = result?.url;
      }
      if (!url) return;
      setAudioUrl(url);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.play();
      setPlaying(true);
    } catch (err) {
      console.error("Voice generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePlay}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1.5 disabled:opacity-50"
      aria-label={playing ? "Pause voice" : "Play voice"}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : playing ? (
        <Pause className="w-3.5 h-3.5" />
      ) : (
        <Volume2 className="w-3.5 h-3.5" />
      )}
      {loading ? "Speaking…" : playing ? "Pause" : "Listen"}
    </button>
  );
}