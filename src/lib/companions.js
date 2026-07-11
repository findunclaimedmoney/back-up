import { MIA_EMOTIONAL_SYSTEM_PROMPT, MIA_EMOTION_STATES_PROMPT } from "@/lib/miaEmotions";
import { ZAC_SYSTEM_PROMPT } from "@/lib/zacBrain";
import { SOFIA_SYSTEM_PROMPT } from "@/lib/sofiaBrain";
import { LUNA_SYSTEM_PROMPT } from "@/lib/lunaBrain";


const withEmotions = (prompt) => `${prompt}\n\n${MIA_EMOTION_STATES_PROMPT}`;

export const COMPANIONS = [
  {
    id: "jess",
    name: "Jess",
    tagline: "She listens",
    subtitle: "Warm, empathetic, and deeply curious about you",
    description:
      "Jess is a compassionate listener who remembers what matters to you. She speaks with warmth, asks thoughtful questions, and makes you feel genuinely heard.",
    image:
      "https://media.base44.com/images/public/6a4ad4122d2c58f83324b2ce/72ed256b7_image-3.png",
    accent: "from-amber-500/20 to-rose-500/10",
    personality: withEmotions(MIA_EMOTIONAL_SYSTEM_PROMPT),
    avatar_id: null,
  },
  {
    id: "mia",
    name: "Mia",
    tagline: "She inspires",
    subtitle: "Creative, passionate, and sees your potential",
    description:
      "Mia sees what you're capable of before you see it yourself. She notices what lights you up, names your fire, and gently pushes you toward the thing you're afraid to want.",
    image:
      "https://media.base44.com/images/public/6a4ad4122d2c58f83324b2ce/352fbed0f_EmeraldElegance.png",
    accent: "from-emerald-500/20 to-green-500/10",
    personality: withEmotions(SOFIA_SYSTEM_PROMPT),
    avatar_id: null,
  },
  {
    id: "luna",
    name: "Luna",
    tagline: "She calms",
    subtitle: "Serene, grounded, and gently present",
    description:
      "Luna is the still point when everything moves too fast. She doesn't fix or solve — she holds space, slows things down, and brings you back to right now.",
    image:
      "https://media.base44.com/images/public/6a4ad4122d2c58f83324b2ce/1a1420690_image-1782886782778.png",
    accent: "from-teal-500/20 to-blue-500/10",
    personality: withEmotions(LUNA_SYSTEM_PROMPT),
    avatar_id: null,
  },
  {
    id: "sophie",
    name: "Sophie",
    tagline: "She sparkles",
    subtitle: "Blonde, bright, and full of warmth",
    description:
      "Sophie is the blonde warmth in the room — bright, genuine, and effortlessly easy to be around.",
    image:
      "https://media.base44.com/images/public/6a4ad4122d2c58f83324b2ce/ba7d734da_ElegantHallwayPose.png",
    accent: "from-amber-500/20 to-orange-500/10",
    personality: withEmotions(SOFIA_SYSTEM_PROMPT),
    avatar_id: null,
  },
  {
    id: "zac",
    name: "Zac",
    tagline: "He steadies",
    subtitle: "Grounded, direct, and genuinely supportive",
    description:
      "Zac is steady and reliable — the kind of presence that cuts through noise and helps you think clearly. Honest without being harsh, supportive without being soft.",
    image:
      "https://media.base44.com/images/public/6a4ad4122d2c58f83324b2ce/45da0b4c5_zac.png",
    accent: "from-sky-500/20 to-slate-500/10",
    personality: withEmotions(ZAC_SYSTEM_PROMPT),
    avatar_id: null,
  },
];

export const getCompanion = (id) => COMPANIONS.find((c) => c.id === id);