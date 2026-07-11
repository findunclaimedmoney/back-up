import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight, ArrowLeft, Check, Loader2, Upload, User,
  Brain, Mic, ImagePlus, Video, RefreshCw, Sparkles,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const STEPS = [
  { id: "profile", label: "Profile", icon: User, desc: "Set the companion's name, tagline, and bio" },
  { id: "brain", label: "Personality", icon: Brain, desc: "Generate the system prompt that defines how they think and speak" },
  { id: "image", label: "Image", icon: ImagePlus, desc: "Upload the companion's profile photo" },
  { id: "voice", label: "Voice", icon: Mic, desc: "Browse and select an ElevenLabs voice" },
  { id: "avatar", label: "Avatar", icon: Video, desc: "Submit the image to HeyGen for live video avatar creation" },
  { id: "review", label: "Review & Save", icon: Check, desc: "Review everything and make the companion live" },
];

const ACCENT_OPTIONS = [
  { label: "Amber / Rose", value: "from-amber-500/20 to-rose-500/10" },
  { label: "Emerald / Green", value: "from-emerald-500/20 to-green-500/10" },
  { label: "Teal / Blue", value: "from-teal-500/20 to-blue-500/10" },
  { label: "Purple / Pink", value: "from-purple-500/20 to-pink-500/10" },
  { label: "Sky / Slate", value: "from-sky-500/20 to-slate-500/10" },
  { label: "Rose / Amber", value: "from-rose-500/20 to-amber-500/10" },
];

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}

const EMPTY_DATA = {
  name: "", companion_id: "", tagline: "", subtitle: "", bio: "",
  accent: "from-amber-500/20 to-rose-500/10",
  personality_description: "", brain: "",
  image_url: "", voice_id: "", voice_name: "",
  avatar_id: "", avatar_status: "pending",
};

export default function CompanionSetup() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [data, setData] = useState(EMPTY_DATA);

  const update = (field, value) => setData((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    base44.auth.me()
      .then((u) => { setUser(u); setAuthChecked(true); })
      .catch(() => setAuthChecked(true));
  }, []);

  // --- Brain generation ---
  const [generatingBrain, setGeneratingBrain] = useState(false);
  const generateBrain = async () => {
    if (!data.name || !data.personality_description) return;
    setGeneratingBrain(true);
    try {
      const res = await base44.functions.invoke("setupCompanion", {
        action: "generate_brain",
        name: data.name,
        personality_description: data.personality_description,
      });
      if (res.data?.brain) {
        update("brain", res.data.brain);
        toast({ title: "Brain generated", description: "Review and edit the system prompt below." });
      } else if (res.data?.error) {
        toast({ variant: "destructive", title: "Generation failed", description: res.data.error });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Generation failed", description: err.message });
    } finally {
      setGeneratingBrain(false);
    }
  };

  // --- Image upload ---
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      if (result?.file_url) update("image_url", result.file_url);
    } catch (err) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message });
    } finally {
      setUploading(false);
    }
  };

  // --- Voice listing ---
  const [voices, setVoices] = useState([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  useEffect(() => {
    if (step !== 3) return;
    setLoadingVoices(true);
    base44.functions.invoke("setupCompanion", { action: "list_voices" })
      .then((res) => { if (res.data?.voices) setVoices(res.data.voices); })
      .catch((err) => toast({ variant: "destructive", title: "Failed to load voices", description: err.message }))
      .finally(() => setLoadingVoices(false));
  }, [step]);

  // --- Voice preview ---
  const [previewingId, setPreviewingId] = useState(null);
  const previewVoice = async (voiceId) => {
    setPreviewingId(voiceId);
    try {
      const res = await base44.functions.invoke("generateVoice", {
        text: `Hi, I'm ${data.name || "your companion"}. I can't wait to get to know you.`,
        voice_id: voiceId,
      });
      if (res.data?.url) new Audio(res.data.url).play().catch(() => {});
    } catch (err) {
      toast({ variant: "destructive", title: "Preview failed", description: err.message });
    } finally {
      setPreviewingId(null);
    }
  };

  // --- Avatar creation ---
  const [creatingAvatar, setCreatingAvatar] = useState(false);
  const createAvatar = async () => {
    if (!data.image_url || !data.name) return;
    setCreatingAvatar(true);
    try {
      const res = await base44.functions.invoke("createLiveAvatar", {
        image_url: data.image_url,
        companion_name: data.name,
      });
      if (res.data?.avatar_id) {
        update("avatar_id", res.data.avatar_id);
        update("avatar_status", res.data.avatar_status || "processing");
        toast({ title: "Avatar submitted", description: "Processing takes up to 24 hours. You can save now and check status later." });
      } else if (res.data?.error) {
        toast({ variant: "destructive", title: "Avatar creation failed", description: res.data.error });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Avatar creation failed", description: err.message });
    } finally {
      setCreatingAvatar(false);
    }
  };

  const [checkingAvatar, setCheckingAvatar] = useState(false);
  const checkAvatar = async () => {
    if (!data.avatar_id) return;
    setCheckingAvatar(true);
    try {
      const res = await base44.functions.invoke("createLiveAvatar", {
        action: "check",
        avatar_id: data.avatar_id,
      });
      if (res.data?.avatar_status) {
        update("avatar_status", res.data.avatar_status);
        toast({
          title: res.data.avatar_status === "active" ? "Avatar ready!" : "Still processing",
          description: res.data.avatar_status === "active" ? "This companion can now do live video." : "Check back within 24 hours.",
        });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Status check failed", description: err.message });
    } finally {
      setCheckingAvatar(false);
    }
  };

  // --- Save ---
  const handleSave = async () => {
    setSaving(true);
    try {
      const slug = data.companion_id || slugify(data.name);
      await base44.entities.CompanionConfig.create({
        companion_id: slug,
        name: data.name,
        tagline: data.tagline,
        subtitle: data.subtitle,
        bio: data.bio,
        accent: data.accent,
        personality: data.brain,
        image_url: data.image_url,
        voice_id: data.voice_id,
        voice_name: data.voice_name,
        avatar_id: data.avatar_id,
        avatar_status: data.avatar_status,
        status: "active",
      });
      setSaved(true);
      toast({ title: "Companion created!", description: `${data.name} is now live and chat-ready.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Save failed", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const canAdvance = () => {
    switch (STEPS[step]?.id) {
      case "profile": return data.name && data.tagline && data.bio;
      case "brain": return data.brain && data.brain.length > 50;
      case "image": return !!data.image_url;
      case "voice": return !!data.voice_id;
      case "avatar": return !!data.avatar_id;
      case "review": return true;
      default: return false;
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-6">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Admin access required</p>
          <p className="text-sm text-muted-foreground">You need to be an admin to create companions.</p>
        </div>
      </div>
    );
  }

  if (saved) {
    const slug = data.companion_id || slugify(data.name);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-semibold mb-2">{data.name} is live!</h1>
          <p className="text-muted-foreground mb-8">
            The companion has been created and is now chat-ready. Users can chat at{" "}
            <code className="text-primary">/chat/{slug}</code>.
          </p>
          <div className="flex flex-col gap-3">
            <a href={`/chat/${slug}`} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm">
              Open chat <ArrowRight className="w-4 h-4" />
            </a>
            <button
              onClick={() => { setSaved(false); setStep(0); setData(EMPTY_DATA); }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Create another companion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="font-heading text-xl font-semibold">Companion Setup</h1>
          <span className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 pt-8">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => i <= step && setStep(i)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : isDone ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {s.label}
                </button>
                {i < STEPS.length - 1 && <div className={`h-px flex-1 ${isDone ? "bg-primary/30" : "bg-border"}`} />}
              </React.Fragment>
            );
          })}
        </div>

        <p className="text-sm text-muted-foreground mb-6">{STEPS[step]?.desc}</p>

        <div className="space-y-5">
          {/* Step 1: Profile */}
          {step === 0 && (
            <>
              <div>
                <Label htmlFor="name">Display name *</Label>
                <Input id="name" value={data.name} onChange={(e) => { update("name", e.target.value); update("companion_id", slugify(e.target.value)); }} placeholder="e.g. Monica" className="mt-1.5 h-12" />
                <p className="text-xs text-muted-foreground mt-1">URL slug: /chat/{data.companion_id || "..."}</p>
              </div>
              <div>
                <Label htmlFor="tagline">Tagline *</Label>
                <Input id="tagline" value={data.tagline} onChange={(e) => update("tagline", e.target.value)} placeholder="e.g. She captivates" className="mt-1.5 h-12" />
              </div>
              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input id="subtitle" value={data.subtitle} onChange={(e) => update("subtitle", e.target.value)} placeholder="e.g. Bold, magnetic, and impossible to ignore" className="mt-1.5 h-12" />
              </div>
              <div>
                <Label htmlFor="bio">Bio *</Label>
                <Textarea id="bio" value={data.bio} onChange={(e) => update("bio", e.target.value)} placeholder="Full description of personality and what they offer..." className="mt-1.5 min-h-[120px]" />
              </div>
              <div>
                <Label>Accent color</Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {ACCENT_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => update("accent", opt.value)} className={`px-3 py-2 rounded-full text-xs font-medium border transition-colors ${data.accent === opt.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 2: Brain */}
          {step === 1 && (
            <>
              <div>
                <Label htmlFor="pd">Personality description *</Label>
                <Textarea id="pd" value={data.personality_description} onChange={(e) => update("personality_description", e.target.value)} placeholder="Describe the companion's personality in detail. How do they speak? What makes them unique? What's their emotional depth? How do they connect with people?" className="mt-1.5 min-h-[150px]" />
              </div>
              <Button onClick={generateBrain} disabled={!data.name || !data.personality_description || generatingBrain} variant="outline" className="w-full h-12">
                {generatingBrain ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating brain...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate system prompt</>}
              </Button>
              {data.brain && (
                <div>
                  <Label htmlFor="brain">System prompt (editable)</Label>
                  <Textarea id="brain" value={data.brain} onChange={(e) => update("brain", e.target.value)} className="mt-1.5 min-h-[250px] font-mono text-xs" />
                </div>
              )}
            </>
          )}

          {/* Step 3: Image */}
          {step === 2 && (
            <div>
              <Label>Profile photo *</Label>
              <label className="mt-1.5 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-2xl p-8 cursor-pointer hover:border-primary/50 transition-colors">
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                ) : data.image_url ? (
                  <img src={data.image_url} alt="Preview" className="max-h-64 rounded-xl object-cover" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
              </label>
            </div>
          )}

          {/* Step 4: Voice */}
          {step === 3 && (
            <>
              {loadingVoices ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="space-y-2">
                  {voices.map((v) => (
                    <div key={v.id} className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${data.voice_id === v.id ? "border-primary bg-primary/5" : "border-border"}`}>
                      <button onClick={() => { update("voice_id", v.id); update("voice_name", v.name); }} className="flex-1 text-left">
                        <p className="text-sm font-medium">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{v.labels?.gender || ""} {v.labels?.accent || ""} {v.labels?.age || ""}</p>
                      </button>
                      <button onClick={() => previewVoice(v.id)} disabled={previewingId === v.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium hover:bg-muted/80 transition-colors">
                        {previewingId === v.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5" />}
                        Preview
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {data.voice_id && <p className="text-sm text-primary">Selected: {data.voice_name}</p>}
            </>
          )}

          {/* Step 5: Avatar */}
          {step === 4 && (
            <>
              {data.image_url && <img src={data.image_url} alt="Companion" className="w-full max-w-xs rounded-2xl mx-auto" />}
              {data.avatar_id ? (
                <div className="rounded-2xl border border-border p-5 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {data.avatar_status === "active" ? (
                      <><Check className="w-5 h-5 text-primary" /><span className="text-sm font-medium text-primary">Avatar ready</span></>
                    ) : data.avatar_status === "processing" ? (
                      <><Loader2 className="w-5 h-5 text-muted-foreground animate-spin" /><span className="text-sm font-medium">Processing (up to 24 hours)</span></>
                    ) : (
                      <span className="text-sm font-medium text-destructive">Avatar failed</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">Avatar ID: {data.avatar_id}</p>
                  <Button onClick={checkAvatar} disabled={checkingAvatar} variant="outline" className="h-10">
                    {checkingAvatar ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Check status
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button onClick={createAvatar} disabled={!data.image_url || !data.name || creatingAvatar} className="h-12 px-8">
                    {creatingAvatar ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating avatar...</> : <><Video className="w-4 h-4 mr-2" /> Create HeyGen avatar</>}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">Submits the photo to HeyGen for live video avatar processing. Takes up to 24 hours.</p>
                </div>
              )}
              <div className="rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Note</p>
                You can save now even while the avatar is processing. Video calls won't work until it's active, but text and voice chat will work immediately.
              </div>
            </>
          )}

          {/* Step 6: Review */}
          {step === 5 && (
            <>
              <div className="rounded-2xl border border-border overflow-hidden">
                {data.image_url && <img src={data.image_url} alt={data.name} className="w-full h-48 object-cover" />}
                <div className="p-5 space-y-3">
                  <div>
                    <h2 className="font-heading text-2xl font-semibold">{data.name}</h2>
                    <p className="text-sm text-primary">{data.tagline}</p>
                    {data.subtitle && <p className="text-sm text-muted-foreground">{data.subtitle}</p>}
                  </div>
                  <p className="text-sm text-muted-foreground">{data.bio}</p>
                  <div className="space-y-1 text-xs text-muted-foreground pt-3 border-t border-border">
                    <p><span className="text-foreground font-medium">Voice:</span> {data.voice_name || "Not selected"}</p>
                    <p><span className="text-foreground font-medium">Avatar:</span> {data.avatar_id ? data.avatar_status : "Not created"}</p>
                    <p><span className="text-foreground font-medium">URL:</span> /chat/{data.companion_id}</p>
                    <p><span className="text-foreground font-medium">Brain:</span> {data.brain ? `${data.brain.length} chars` : "Missing"}</p>
                  </div>
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full h-12">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Check className="w-4 h-4 mr-2" /> Create companion</>}
              </Button>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          {step < STEPS.length - 1 && (
            <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} disabled={!canAdvance()} className="gap-1.5">
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}