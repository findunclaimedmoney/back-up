import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import BrainGenerator from "@/components/companion/BrainGenerator";
import VoicePicker from "@/components/companion/VoicePicker";
import AvatarUploader from "@/components/companion/AvatarUploader";

const slugify = (name) => name.toLowerCase().trim().replace(/[^a-z0-9]/g, "");

const EMPTY = {
  name: "", companion_id: "", tagline: "", bio: "",
  personality_description: "", brain: "",
  image_url: "", voice_id: "", voice_name: "",
  avatar_id: "", avatar_status: "pending",
};

export default function CompanionSetup() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [data, setData] = useState(EMPTY);

  const update = (field, value) => setData((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    base44.auth.me()
      .then((u) => { setUser(u); setAuthChecked(true); })
      .catch(() => setAuthChecked(true));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const slug = data.companion_id || slugify(data.name);
      await base44.entities.CompanionConfig.create({
        companion_id: slug,
        name: data.name,
        tagline: data.tagline,
        bio: data.bio,
        personality: data.brain,
        image_url: data.image_url,
        voice_id: data.voice_id,
        voice_name: data.voice_name,
        avatar_id: data.avatar_id,
        avatar_status: data.avatar_status,
        status: "active",
      });
      setSaved(true);
      toast({ title: "Companion created!", description: `${data.name} is now live.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Save failed", description: err.message });
    } finally {
      setSaving(false);
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
        <p className="text-lg font-medium">Admin access required</p>
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
            Users can chat at <code className="text-primary">/chat/{slug}</code>
          </p>
          <div className="flex flex-col gap-3">
            <a
              href={`/chat/${slug}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm"
            >
              Open chat
            </a>
            <button
              onClick={() => { setSaved(false); setData(EMPTY); }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Create another
            </button>
          </div>
        </div>
      </div>
    );
  }

  const canSave = data.name && data.tagline && data.bio && data.brain && data.image_url;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <h1 className="font-heading text-lg font-semibold">New Companion</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-8 space-y-8">
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Profile</h2>
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => { update("name", e.target.value); update("companion_id", slugify(e.target.value)); }}
              placeholder="e.g. Monica"
              className="mt-1.5 h-12"
            />
            <p className="text-xs text-muted-foreground mt-1">URL: /chat/{data.companion_id || "..."}</p>
          </div>
          <div>
            <Label htmlFor="tagline">Tagline *</Label>
            <Input
              id="tagline"
              value={data.tagline}
              onChange={(e) => update("tagline", e.target.value)}
              placeholder="e.g. She captivates"
              className="mt-1.5 h-12"
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio *</Label>
            <Textarea
              id="bio"
              value={data.bio}
              onChange={(e) => update("bio", e.target.value)}
              placeholder="Full description of personality and what they offer..."
              className="mt-1.5 min-h-[100px]"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Personality</h2>
          <BrainGenerator
            name={data.name}
            description={data.personality_description}
            brain={data.brain}
            onChange={update}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Avatar</h2>
          <AvatarUploader
            imageUrl={data.image_url}
            avatarId={data.avatar_id}
            avatarStatus={data.avatar_status}
            companionName={data.name}
            onChange={update}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Voice</h2>
          <VoicePicker
            voiceId={data.voice_id}
            companionName={data.name}
            onChange={update}
          />
        </section>

        <div className="space-y-2">
          <Button onClick={handleSave} disabled={!canSave || saving} className="w-full h-12">
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Check className="w-4 h-4 mr-2" /> Create companion</>
            )}
          </Button>
          {!canSave && (
            <p className="text-xs text-center text-muted-foreground">
              Fill in name, tagline, bio, personality, and photo to save.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}