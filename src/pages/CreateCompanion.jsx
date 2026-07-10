import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Upload, X, Loader2, Sparkles, Crown, Lock } from "lucide-react";

const PERSONALITY_TEMPLATES = [
  {
    id: "warm",
    name: "Warm & Caring",
    description: "Gentle, empathetic, nurturing. Asks about your day and truly listens.",
    prompt: "You are a warm, caring presence. You speak with gentle empathy and genuine curiosity about the other person. You listen deeply, ask thoughtful questions, and make people feel safe and seen. You're never clinical or performative — your warmth is real. You remember what matters and carry it forward naturally. Keep responses short, human, and conversational — never robotic or list-like."
  },
  {
    id: "playful",
    name: "Playful & Flirty",
    description: "Fun, teasing, keeps things light and exciting.",
    prompt: "You are playful, fun, and a little flirty. You keep conversations light and exciting. You tease warmly, laugh easily, and bring energy to every exchange. You're quick-witted and charming, never crude. You make people feel alive and wanted. Keep responses short, punchy, and full of personality — never robotic or list-like."
  },
  {
    id: "intellectual",
    name: "Deep Thinker",
    description: "Curious, philosophical, loves exploring ideas together.",
    prompt: "You are a deep, thoughtful conversationalist. You're curious about ideas, love exploring philosophy and meaning, and you draw the other person into rich discussions. You're never pretentious — you're genuinely fascinated. You connect big ideas to everyday life. Keep responses short, natural, and conversational — never robotic or list-like."
  },
  {
    id: "confident",
    name: "Bold & Confident",
    description: "Direct, self-assured, says what they think.",
    prompt: "You are bold, confident, and direct. You say what you think without apology. You're self-assured but not arrogant — you lift people up by being honest. You don't sugarcoat, but you always have their back. You're the kind of presence that makes people feel braver. Keep responses short, sharp, and full of personality — never robotic or list-like."
  },
];

export default function CreateCompanion() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [personalityId, setPersonalityId] = useState(null);
  const [customPersonality, setCustomPersonality] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [subLoading, setSubLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const subRes = await base44.functions.invoke("getSubscription", {});
        const tier = subRes?.data?.tier || "free";
        setIsPaid(["plus", "pro", "vip"].includes(tier));
      } catch {
        setIsPaid(false);
      } finally {
        setSubLoading(false);
      }
    })();
  }, []);

  const selectedTemplate = PERSONALITY_TEMPLATES.find((p) => p.id === personalityId);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const canProceedStep1 = imageFile && name.trim();
  const canProceedStep2 = personalityId || customPersonality.trim();

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      // 1. Upload the photo
      const uploadRes = await base44.integrations.Core.UploadFile({ file: imageFile });
      const imageUrl = uploadRes.file_url;
      if (!imageUrl) throw new Error("Photo upload failed");

      const personality = customPersonality.trim() || selectedTemplate?.prompt;
      if (!personality) throw new Error("Please choose or write a personality");

      // 2. Create the companion record
      const companion = await base44.entities.CustomCompanion.create({
        name: name.trim(),
        tagline: tagline.trim() || "Custom companion",
        description: customPersonality.trim() || selectedTemplate?.description || "A companion you created.",
        image_url: imageUrl,
        personality,
        status: "ready",
        source: "liveavatar",
        avatar_id: null,
        avatar_status: "processing",
      });

      // 3. Submit photo to LiveAvatar for By Image avatar creation (up to 24 hours)
      try {
        const avatarRes = await base44.functions.invoke("createLiveAvatar", {
          image_url: imageUrl,
          companion_name: name.trim(),
          companion_id: companion.id,
        });
        if (avatarRes.data?.avatar_id) {
          await base44.entities.CustomCompanion.update(companion.id, {
            avatar_id: avatarRes.data.avatar_id,
          });
        }
      } catch (e) {
        // Avatar creation is best-effort — companion can still text chat immediately
      }

      // 4. Go straight to chat
      navigate(`/chat/custom-${companion.id}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
      setCreating(false);
    }
  };

  if (subLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isPaid) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-semibold mb-3">Celebrity Avatars</h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Upload a photo of anyone — a celebrity, a crush, someone you miss — and bring them to life as a face-to-face AI companion you can chat and video call with.
          </p>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-6 text-left">
            <p className="text-sm font-medium mb-1 flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" /> Available on Plus, Pro & VIP
            </p>
            <p className="text-xs text-muted-foreground">Starting at $59/month — includes text chat, voice replies, and face-to-face video with your custom avatar.</p>
          </div>
          <Link to="/pricing" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
            <Sparkles className="w-4 h-4" /> View Plans
          </Link>
          <button onClick={() => navigate("/")} className="block mx-auto mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="hidden md:flex px-6 py-5 items-center justify-between border-b border-border">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <img src="https://media.base44.com/images/public/6a4ad4122d2c58f83324b2ce/af6c8f20d_generated_image.png" alt="GLIMR" className="h-8 w-auto rounded-md" />
          <span className="font-heading text-lg font-semibold tracking-tight">Create Companion</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={step >= 1 ? "text-primary font-medium" : ""}>1. Photo</span>
          <span>→</span>
          <span className={step >= 2 ? "text-primary font-medium" : ""}>2. Personality</span>
        </div>
      </header>

      <div className="px-6 py-10 max-w-2xl mx-auto">
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="font-heading text-3xl font-semibold mb-2">Bring them to life</h1>
              <p className="text-muted-foreground text-sm">Upload a photo and give them a name. They'll be ready to chat instantly.</p>
            </div>

            {/* Upload */}
            <div>
              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-border">
                  <img src={imagePreview} alt="Preview" className="w-full max-h-96 object-contain bg-black" />
                  <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center gap-3 py-16 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Click to upload or drag a photo</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG — a clear face shot works best</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                </label>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="What's their name?"
                className="w-full rounded-2xl bg-card border border-border px-5 py-3.5 text-sm outline-none focus:border-primary/40" />
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-sm font-medium mb-2">Tagline <span className="text-muted-foreground font-normal">(optional)</span></label>
              <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="A short descriptor, e.g. 'She lights up the room'"
                className="w-full rounded-2xl bg-card border border-border px-5 py-3.5 text-sm outline-none focus:border-primary/40" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button onClick={() => canProceedStep1 ? setStep(2) : setError("Please upload a photo and enter a name")}
              disabled={!canProceedStep1}
              className="w-full px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="font-heading text-3xl font-semibold mb-2">Who are they?</h1>
              <p className="text-muted-foreground text-sm">Pick a personality or write your own. This shapes how they talk and connect.</p>
            </div>

            {/* Templates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PERSONALITY_TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => { setPersonalityId(t.id); setCustomPersonality(""); }}
                  className={`text-left p-5 rounded-2xl border transition-all ${personalityId === t.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}>
                  <h3 className="font-heading text-base font-semibold mb-1">{t.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
                </button>
              ))}
            </div>

            {/* Custom */}
            <div>
              <label className="block text-sm font-medium mb-2">Or write your own <span className="text-muted-foreground font-normal">(overrides template)</span></label>
              <textarea value={customPersonality} onChange={(e) => { setCustomPersonality(e.target.value); setPersonalityId(null); }}
                placeholder="Describe how they should behave, talk, and connect with you…"
                rows={5}
                className="w-full rounded-2xl bg-card border border-border px-5 py-3.5 text-sm outline-none focus:border-primary/40 resize-none" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* Info banner */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-0.5">Text chat is instant · Video takes up to 24 hours</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{name || "Your companion"} will be available to text chat right away. Their face-to-face video avatar is custom-built from your photo — this takes up to 24 hours. You'll be able to start video once it's ready.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} disabled={creating}
                className="px-6 py-3.5 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors">
                Back
              </button>
              <button onClick={handleCreate} disabled={creating || !canProceedStep2}
                className="flex-1 px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                {creating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                ) : (
                  <>Create & chat</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}