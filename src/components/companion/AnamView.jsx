import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { createClient } from "@anam-ai/js-sdk";
import { X, Loader2, Clock, AlertCircle, DollarSign } from "lucide-react";

const DURATIONS = [
  { value: 15, label: "15 min", price: 4 },
  { value: 30, label: "30 min", price: 8 },
  { value: 60, label: "1 hour", price: 15 },
];

export default function AnamView({ companion, onClose }) {
  const [subscription, setSubscription] = useState(null);
  const [subLoading, setSubLoading] = useState(true);
  const [duration, setDuration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const videoRef = useRef(null);
  const clientRef = useRef(null);

  // Fetch subscription to determine if duration picker is needed
  useEffect(() => {
    base44.functions
      .invoke("getSubscription", {})
      .then((res) => {
        setSubscription(res.data);
        // If intimacy is included (pro/vip), skip duration picker
        if (res.data?.intimacy_package) {
          setDuration("included");
        }
      })
      .catch(() => setError("Could not load subscription"))
      .finally(() => setSubLoading(false));
  }, []);

  // Start session when duration is selected
  useEffect(() => {
    if (!duration || duration === "picker") return;
    if (duration === "included") {
      startSession(null);
    } else {
      startSession(duration);
    }
  }, [duration]);

  const startSession = async (dur) => {
    setLoading(true);
    try {
      const payload = {
        companion_name: companion.name,
        personality: companion.personality,
        avatar_id: companion.avatar_id || null,
      };
      if (dur) payload.duration = dur;

      const res = await base44.functions.invoke("anamSession", payload);
      if (res.data?.error) throw new Error(res.data.message || res.data.error);

      const sessionToken = res.data.sessionToken;
      if (!sessionToken) throw new Error("No session token returned");

      if (res.data.sessionDurationSeconds) {
        setTimeLeft(res.data.sessionDurationSeconds);
      }

      const anamClient = createClient(sessionToken);
      clientRef.current = anamClient;
      await anamClient.streamToVideoElement(videoRef.current);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      try {
        clientRef.current?.stopStreaming?.();
      } catch (e) {}
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || loading || error) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          try {
            clientRef.current?.stopStreaming?.();
          } catch (e) {}
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

  const showPicker = subLoading === false && subscription && !subscription.intimacy_package && duration === null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="flex-shrink-0 border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={companion.image} alt={companion.name} className="w-8 h-8 rounded-full object-cover object-top" />
            <div>
              <h1 className="font-heading text-base font-semibold">{companion.name} — face to face</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Powered by Anam · live video</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {timeLeft !== null && !loading && !error && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                showWarning ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"
              }`}>
                {showWarning ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {formatTime(timeLeft)}
              </div>
            )}
            <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors" aria-label="Close video">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        {/* Duration picker */}
        {showPicker && (
          <div className="flex flex-col items-center gap-6 max-w-sm w-full">
            <div className="text-center">
              <h2 className="font-heading text-2xl font-semibold mb-2">Choose your session</h2>
              <p className="text-sm text-muted-foreground">How long would you like to spend with {companion.name}?</p>
            </div>

            {subscription.credit_balance > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary/10 border border-primary/20">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">${subscription.credit_balance.toFixed(2)} credit</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 w-full">
              {DURATIONS.map((d) => {
                const affordable = subscription.credit_balance >= d.price;
                return (
                  <button
                    key={d.value}
                    onClick={() => affordable && setDuration(d.value)}
                    disabled={!affordable}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                      affordable
                        ? "border-border bg-card hover:border-primary/40"
                        : "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{d.label}</span>
                    </div>
                    <span className="font-heading text-lg font-semibold">${d.price}</span>
                  </button>
                );
              })}
            </div>

            {subscription.credit_balance < 4 && (
              <a href="/pricing" className="text-sm text-primary hover:underline">
                Add credit →
              </a>
            )}
          </div>
        )}

        {/* Loading */}
        {(subLoading || loading) && !error && !showPicker && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">{companion.name} is getting ready…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center max-w-sm">
            <p className="text-sm text-muted-foreground mb-3">{error}</p>
            <a href="/pricing" className="text-sm text-primary hover:underline">View plans →</a>
          </div>
        )}

        {/* Video */}
        {!showPicker && !subLoading && !loading && !error && (
          <div className="w-full max-w-2xl aspect-video rounded-2xl overflow-hidden border border-border shadow-lg bg-black relative">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full" />
            {showWarning && timeLeft > 0 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Session ending in {timeLeft}s
              </div>
            )}
            {timeLeft === 0 && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-6">
                <p className="font-heading text-xl font-semibold text-foreground mb-2">Time's up</p>
                <p className="text-sm text-muted-foreground mb-4">Your intimate session has ended. Come back anytime.</p>
                <button onClick={onClose} className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
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