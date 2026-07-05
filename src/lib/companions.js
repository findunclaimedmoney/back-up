import { MIA_EMOTIONAL_SYSTEM_PROMPT } from "@/lib/miaEmotions";
import { ZAC_SYSTEM_PROMPT } from "@/lib/zacBrain";

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
  },
];

export const getCompanion = (id) => COMPANIONS.find((c) => c.id === id);