import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { createClient } from "@anam-ai/js-sdk";
import { X, Loader2 } from "lucide-react";

export default function AnamView({ companion, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const clientRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await base44.functions.invoke("anamSession", {
          companion_name: companion.name,
          personality: companion.personality,
          avatar_id: companion.avatar_id || null,
        });
        if (cancelled) return;
        if (res.data?.error) throw new Error(res.data.error);

        const sessionToken = res.data.sessionToken;
        if (!sessionToken) throw new Error("No session token returned");

        const anamClient = createClient(sessionToken);
        clientRef.current = anamClient;

        await anamClient.streamToVideoElement(videoRef.current);
        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) setError(err.message || "Something went wrong");
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      try {
        clientRef.current?.stopStreaming?.();
      } catch (e) {
        // ignore
      }
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
            <div>
              <h1 className="font-heading text-base font-semibold">
                {companion.name} — instant video
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Powered by Anam · ready now
              </p>
            </div>
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
              Make sure your Anam API key is set.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-2xl aspect-video rounded-2xl overflow-hidden border border-border shadow-lg bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}