import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, Shirt, Users, Crown, Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const OUTFITS = [
  { id: null, label: "Default" },
  { id: "silk_robe", label: "Silk Robe" },
  { id: "nurse", label: "Nurse" },
  { id: "gown", label: "Evening Gown" },
];

export default function LiveAvatarView({ companion, onClose }) {
  const [embedUrl, setEmbedUrl] = useState(null);
  const [twinUrl, setTwinUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [twinLoading, setTwinLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [selectedOutfit, setSelectedOutfit] = useState(null);

  const fetchEmbed = useCallback(async (outfit, twin = false) => {
    const res = await base44.functions.invoke("liveavatarEmbed", {
      companion_name: companion.name,
      personality: companion.personality,
      avatar_id: outfit || companion.avatar_id || null,
      twin,
    });
    if (res.data?.upgrade_required) {
      return { upgradeRequired: true, message: res.data.message };
    }
    if (res.data?.error) throw new Error(res.data.error);
    return { url: res.data?.url };
  }, [companion]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const subRes = await base44.functions.invoke("getSubscription", {});
        if (!cancelled) setSubscription(subRes.data);

        const result = await fetchEmbed(null);
        if (cancelled) return;
        if (result.upgradeRequired) {
          setError(result.message || "Upgrade required");
        } else {
          setEmbedUrl(result.url);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [companion.id]);

  const handleOutfitChange = async (outfitId) => {
    setSelectedOutfit(outfitId);
    setLoading(true);
    setError(null);
    try {
      const result = await fetchEmbed(outfitId);
      if (result.upgradeRequired) {
        setError(result.message);
      } else {
        setEmbedUrl(result.url);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSummonTwin = async () => {
    setTwinLoading(true);
    try {
      const result = await fetchEmbed(selectedOutfit, true);
      if (result.upgradeRequired) {
        setError(result.message);
      } else {
        setTwinUrl(result.url);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setTwinLoading(false);
    }
  };

  const hasIntimacy = subscription?.intimacy_package;
  const hasTwin = subscription?.twin_enabled;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="flex-shrink-0 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={companion.image} alt={companion.name} className="w-8 h-8 rounded-full object-cover" />
            <h1 className="font-heading text-base font-semibold">
              {companion.name} — face to face
              {twinUrl && <span className="text-primary ml-2">+ Twin</span>}
            </h1>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Close video"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">{companion.name} is getting ready…</p>
          </div>
        ) : error ? (
          <div className="text-center max-w-sm">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <p className="text-sm text-foreground mb-2 font-medium">{error}</p>
            <p className="text-xs text-muted-foreground mb-5">
              Upgrade to unlock face-to-face video with your companion.
            </p>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm"
            >
              <Sparkles className="w-4 h-4" />
              View Plans
            </Link>
          </div>
        ) : (
          <>
            <div className={`w-full ${twinUrl ? "max-w-4xl grid grid-cols-2 gap-3" : "max-w-2xl"}`}>
              <div className="aspect-video rounded-2xl overflow-hidden border border-border shadow-lg">
                <iframe
                  src={embedUrl}
                  allow="microphone"
                  title={`${companion.name} video`}
                  className="w-full h-full"
                />
              </div>
              {twinUrl && (
                <div className="aspect-video rounded-2xl overflow-hidden border border-primary/40 shadow-lg">
                  <iframe
                    src={twinUrl}
                    allow="microphone"
                    title={`${companion.name} twin video`}
                    className="w-full h-full"
                  />
                </div>
              )}
              {twinLoading && (
                <div className="aspect-video rounded-2xl overflow-hidden border border-primary/40 shadow-lg flex items-center justify-center bg-card">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {hasIntimacy && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-card border border-border">
                  <Shirt className="w-3.5 h-3.5 text-primary" />
                  {OUTFITS.map((o) => (
                    <button
                      key={o.label}
                      onClick={() => handleOutfitChange(o.id)}
                      className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                        selectedOutfit === o.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}

              {hasTwin && !twinUrl && !twinLoading && (
                <button
                  onClick={handleSummonTwin}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Summon Twin
                </button>
              )}

              {twinUrl && (
                <button
                  onClick={() => setTwinUrl(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-muted-foreground text-sm hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                  Dismiss Twin
                </button>
              )}

              {!hasIntimacy && !hasTwin && (
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-muted-foreground text-sm hover:text-foreground transition-colors"
                >
                  <Crown className="w-4 h-4 text-primary" />
                  Unlock outfits & twin
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}