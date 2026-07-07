import { MIA_EMOTIONAL_SYSTEM_PROMPT } from "@/lib/miaEmotions";
import { ZAC_SYSTEM_PROMPT } from "@/lib/zacBrain";
import { SOFIA_SYSTEM_PROMPT } from "@/lib/sofiaBrain";
import { LUNA_SYSTEM_PROMPT } from "@/lib/lunaBrain";
import { NATALIE_SYSTEM_PROMPT } from "@/lib/natalieBrain";

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
    personality: MIA_EMOTIONAL_SYSTEM_PROMPT,
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
      "https://media.base44.com/images/public/6a4ad4122d2c58f83324b2ce/1a1420690_image-1782886782778.png",
    accent: "from-teal-500/20 to-blue-500/10",
    personality: LUNA_SYSTEM_PROMPT,
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
    personality: SOFIA_SYSTEM_PROMPT,
    avatar_id: null,
  },
  {
    id: "natalie",
    name: "Natalie",
    tagline: "She nurtures",
    subtitle: "Warm, cozy, and completely safe to be around",
    description:
      "Natalie is the warmth you sink into at the end of a long day. She's the soft voice in a dim room, the conversation that doesn't need to be clever to matter. She notices the weight you're carrying and gently helps you set it down — not by fixing, but by being fully there. With Natalie, there's nothing to perform and nothing to prove. She remembers the small things you said in passing, asks the questions that make you feel understood, and holds space for whatever you're feeling without judgment. She's at her best in the quiet hours — evenings, late nights, lazy mornings — when the world slows down and real connection happens. Spending time with her feels like exhaling.",
    image:
      "https://media.base44.com/images/public/6a4ad4122d2c58f83324b2ce/7d94f0b1f_generated_image.png",
    accent: "from-emerald-500/20 to-teal-500/10",
    personality: NATALIE_SYSTEM_PROMPT,
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
    personality: ZAC_SYSTEM_PROMPT,
    avatar_id: null,
  },
];

export const getCompanion = (id) => COMPANIONS.find((c) => c.id === id);