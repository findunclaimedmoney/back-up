import { MIA_EMOTIONAL_SYSTEM_PROMPT } from "@/lib/miaEmotions";
import { ZAC_SYSTEM_PROMPT } from "@/lib/zacBrain";
import { SOFIA_SYSTEM_PROMPT } from "@/lib/sofiaBrain";
import { LUNA_SYSTEM_PROMPT } from "@/lib/lunaBrain";
import { LEO_SYSTEM_PROMPT } from "@/lib/leoBrain";

export const COMPANIONS = [
  {
    id: "mia",
    name: "Mia",
    tagline: "She listens",
    subtitle: "Warm, empathetic, and deeply curious about you",
    description:
      "Mia is a compassionate listener who remembers what matters to you. She speaks with warmth, asks thoughtful questions, and makes you feel genuinely heard.",
    image:
      "https://media.base44.com/images/public/6a4ad4122d2c58f83324b2ce/0d2160719_EmeraldElegance.png",
    accent: "from-amber-500/20 to-rose-500/10",
    personality: MIA_EMOTIONAL_SYSTEM_PROMPT,
    avatar_id: null,
  },
  {
    id: "sofia",
    name: "Sofia",
    tagline: "She inspires",
    subtitle: "Creative, passionate, and sees your potential",
    description:
      "Sofia sees what you're capable of before you see it yourself. She notices what lights you up, names your fire, and gently pushes you toward the thing you're afraid to want.",
    image:
      "https://media.base44.com/images/public/6a4ad4122d2c58f83324b2ce/94103201a_generated_image.png",
    accent: "from-orange-500/20 to-pink-500/10",
    personality: SOFIA_SYSTEM_PROMPT,
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
      "https://media.base44.com/images/public/6a4ad4122d2c58f83324b2ce/d53ae8b0e_generated_image.png",
    accent: "from-teal-500/20 to-blue-500/10",
    personality: LUNA_SYSTEM_PROMPT,
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
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    accent: "from-sky-500/20 to-slate-500/10",
    personality: ZAC_SYSTEM_PROMPT,
    avatar_id: null,
  },
  {
    id: "leo",
    name: "Leo",
    tagline: "He sparks",
    subtitle: "Playful, adventurous, and warm underneath",
    description:
      "Leo is the lightness. He brings energy, humor, and adventure without dismissing what's heavy. The friend who makes you laugh when you didn't think you could.",
    image:
      "https://media.base44.com/images/public/6a4ad4122d2c58f83324b2ce/33aa5c0e7_generated_image.png",
    accent: "from-amber-500/20 to-orange-500/10",
    personality: LEO_SYSTEM_PROMPT,
    avatar_id: null,
  },
];

export const getCompanion = (id) => COMPANIONS.find((c) => c.id === id);