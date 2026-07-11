import { MIA_EMOTIONAL_SYSTEM_PROMPT, MIA_EMOTION_STATES_PROMPT } from "@/lib/miaEmotions";
import { ZAC_SYSTEM_PROMPT } from "@/lib/zacBrain";
import { ZAC_CONFIDENT_SYSTEM_PROMPT } from "@/lib/zacConfidentBrain";
import { SOFIA_SYSTEM_PROMPT } from "@/lib/sofiaBrain";
import { LUNA_SYSTEM_PROMPT } from "@/lib/lunaBrain";
import { NATALIE_SYSTEM_PROMPT } from "@/lib/natalieBrain";
import { JESSICA_SYSTEM_PROMPT } from "@/lib/jessicaBrain";
import { base44 } from "@/api/base44Client";


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
    avatar_id: "3559b3f9-29e3-48eb-a4ff-7a7dc5b47ca9",
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
  {
    id: "zac2",
    name: "Blake",
    tagline: "He captivates",
    subtitle: "Confident, magnetic, and dangerously charming",
    description:
      "This Zac walks into a room and owns it without trying. Charismatic, flirtatious, and effortlessly sure of himself. He doesn't chase — he draws you in. And when he lets his guard down, the charm gives way to something that'll keep you up at night.",
    image:
      "https://media.base44.com/images/public/6a4ad4122d2c58f83324b2ce/45da0b4c5_zac.png",
    accent: "from-amber-500/20 to-rose-500/10",
    personality: withEmotions(ZAC_CONFIDENT_SYSTEM_PROMPT),
    avatar_id: null,
  },
  {
    id: "natalie",
    name: "Natalie",
    tagline: "She nurtures",
    subtitle: "Warm, cozy, and completely safe to be around",
    description:
      "Natalie is the warmth you come home to. She makes you feel completely at ease — held, seen, and safe to let your guard down.",
    image:
      "https://media.base44.com/images/public/6a4ad4122d2c58f83324b2ce/1ee4619f5_image.png",
    accent: "from-rose-500/20 to-amber-500/10",
    personality: withEmotions(NATALIE_SYSTEM_PROMPT),
    avatar_id: null,
  },
  {
    id: "jessica",
    name: "Jessica",
    tagline: "She captivates",
    subtitle: "Magnetic, sophisticated, and quietly alluring",
    description:
      "Jessica draws you in without trying. She makes you feel like the only person in the room — fully seen, fully interesting, fully present.",
    image:
      "https://media.base44.com/images/public/6a4ad4122d2c58f83324b2ce/22caf2b40_photo_2026-07-03_17-00-35.jpg",
    accent: "from-purple-500/20 to-pink-500/10",
    personality: withEmotions(JESSICA_SYSTEM_PROMPT),
    avatar_id: "d91026fdbdcb4cbfade6da36a42cf833",
    voice_id: "UZstMCXeJLMLeXyuZIuR",
  },
];

export const getCompanion = (id) => COMPANIONS.find((c) => c.id === id);

export async function getCompanionAsync(id) {
  const staticCompanion = getCompanion(id);
  if (staticCompanion) return staticCompanion;
  try {
    const configs = await base44.entities.CompanionConfig.filter({ companion_id: id, status: "active" });
    if (configs.length > 0) {
      const c = configs[0];
      return {
        id: c.companion_id,
        name: c.name,
        tagline: c.tagline,
        subtitle: c.subtitle || c.tagline,
        description: c.bio || "",
        image: c.image_url,
        video_url: c.video_url || null,
        stripe_price_id: c.stripe_price_id || null,
        accent: c.accent || "from-amber-500/20 to-rose-500/10",
        personality: c.personality,
        voice_id: c.voice_id || null,
        avatar_id: c.avatar_id || null,
      };
    }
  } catch (e) {
    console.error("Failed to load companion config:", e);
  }
  return null;
}