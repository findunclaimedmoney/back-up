import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { createClient } from "@anam-ai/js-sdk";
import { X, Loader2, Clock, AlertCircle } from "lucide-react";

export default function AnamView({ companion, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
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
        if (res.data?.error) throw new Error(res.data.message || res.data.error);

        const sessionToken = res.data.sessionToken;
        if (!sessionToken) throw new Error("No session token returned");

        // If this is a timed intimacy session, start the countdown
        if (res.data.sessionDurationSeconds) {
          setTimeLeft(res.data.sessionDurationSeconds);
        }

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

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || loading || error) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          // Time's up — close the session
          try {
            clientRef.current?.stopStreaming?.();
          } catch (e) {
            // ignore
          }
          onClose();
          return 0;
        }
        if (prev <= 30 && !showWarning) {
          setShowWarning(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, loading, error, onClose]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

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
                {companion.name} — face to face
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Powered by Anam · live video
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {timeLeft !== null && !loading && !error && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                showWarning
                  ? "bg-destructive/15 text-destructive"
                  : "bg-muted text-muted-foreground"
              }`}>
                {showWarning ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {formatTime(timeLeft)}
              </div>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Close video"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
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
            <p className="text-sm text-muted-foreground mb-3">{error}</p>
            <a href="/pricing" className="text-sm text-primary hover:underline">
              View plans →
            </a>
          </div>
        ) : (
          <div className="w-full max-w-2xl aspect-video rounded-2xl overflow-hidden border border-border shadow-lg bg-black relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full"
            />
            {/* 30-second pre-warning overlay */}
            {showWarning && timeLeft > 0 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Session ending in {timeLeft}s
              </div>
            )}
            {/* Final overlay when time hits 0 */}
            {timeLeft === 0 && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-6">
                <p className="font-heading text-xl font-semibold text-foreground mb-2">
                  Time's up
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Your intimate session has ended. Come back anytime.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}