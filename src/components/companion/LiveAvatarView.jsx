import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2 } from "lucide-react";

export default function LiveAvatarView({ companion, onClose }) {
  const [embedUrl, setEmbedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke("liveavatarEmbed", {
          companion_name: companion.name,
          personality: companion.personality,
        });
        if (cancelled) return;
        if (res.data?.error) throw new Error(res.data.error);
        setEmbedUrl(res.data?.url);
      } catch (err) {
        if (!cancelled) setError(err.message || "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companion.id]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="flex-shrink-0 border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={companion.image}
              alt={companion.name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <h1 className="font-heading text-base font-semibold">
              {companion.name} — face to face
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

      <div className="flex-1 flex items-center justify-center p-4">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              {companion.name} is getting ready…
            </p>
          </div>
        ) : error ? (
          <div className="text-center max-w-sm">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <p className="text-xs text-muted-foreground">
              Make sure your LiveAvatar API key is set and you have a ready avatar.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-2xl aspect-video rounded-2xl overflow-hidden border border-border shadow-lg">
            <iframe
              src={embedUrl}
              allow="microphone"
              title={`${companion.name} video`}
              className="w-full h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}