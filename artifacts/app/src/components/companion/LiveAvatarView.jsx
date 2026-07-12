import React, { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  X, Loader2, Users, Crown, Lock, Sparkles, Clock,
  AlertCircle, DollarSign, Mic, MicOff, Send
} from "lucide-react";
import { Link } from "react-router-dom";

const DURATIONS = [
  { value: 15, label: "15 min", credits: 15, display: "15 credits" },
  { value: 30, label: "30 min", credits: 30, display: "30 credits" },
  { value: 60, label: "1 hour", credits: 60, display: "60 credits" },
];

// ─── WebRTC helpers ───────────────────────────────────────────────────────────

async function createHeyGenSession(companion) {
  const res = await fetch("/api/heygen/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      avatarId: companion.avatar_id || null,
      voiceId:  companion.voice_id  || null,
      quality:  "medium",
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Could not start video session");
  }
  return res.json(); // { sessionId, sdp, sdpType, iceServers }
}

async function sendSdpAnswer(sessionId, sdp) {
  await fetch(`/api/heygen/session/${sessionId}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ sdp }),
  });
}

async function relayIceCandidate(sessionId, candidate) {
  await fetch(`/api/heygen/session/${sessionId}/ice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ candidate }),
  });
}

async function stopHeyGenSession(sessionId) {
  await fetch(`/api/heygen/session/${sessionId}`, {
    method: "DELETE",
    credentials: "include",
  }).catch(() => {});
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LiveAvatarView({ companion, onClose }) {
  // Subscription
  const [subscription,  setSubscription]  = useState(null);
  const [subLoading,    setSubLoading]     = useState(true);

  // Session state
  const [loading,       setLoading]        = useState(false);
  const [error,         setError]          = useState(null);
  const [sessionActive, setSessionActive]  = useState(false);
  const [sessionId,     setSessionId]      = useState(null);
  const [duration,      setDuration]       = useState(null); // minutes chosen
  const [timeLeft,      setTimeLeft]       = useState(null); // seconds
  const [showWarning,   setShowWarning]    = useState(false);
  const [lowBalance,    setLowBalance]     = useState(null);

  // Speak
  const [speakText,     setSpeakText]      = useState("");
  const [speaking,      setSpeaking]       = useState(false);

  // Twin
  const [twinActive,    setTwinActive]     = useState(false);
  const [twinLoading,   setTwinLoading]    = useState(false);
  const [twinSessionId, setTwinSessionId]  = useState(null);

  const peerRef     = useRef(null);
  const twinPeerRef = useRef(null);
  const videoRef    = useRef(null);
  const twinVideoRef = useRef(null);

  // ── Load subscription on mount ─────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke("getSubscription", {});
        if (!cancelled) {
          setSubscription(res.data);
          setSubLoading(false);
          // Auto-start if intimacy_package is included
          if (res.data?.intimacy_package) setDuration("included");
        }
      } catch {
        if (!cancelled) setSubLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Auto-start when intimacy_package + duration resolved
  useEffect(() => {
    if (duration === "included" && subscription?.intimacy_package) {
      startSession(null); // null = no specific duration limit
    }
  }, [duration, subscription]);

  // ── Countdown timer ────────────────────────────────────────────────────────

  useEffect(() => {
    if (timeLeft === null || !sessionActive || error) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) { clearInterval(interval); handleEndSession(); return 0; }
        if (prev <= 30 && !showWarning) setShowWarning(true);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, sessionActive, error, showWarning]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (sessionId)     stopHeyGenSession(sessionId);
      if (twinSessionId) stopHeyGenSession(twinSessionId);
      peerRef.current?.close();
      twinPeerRef.current?.close();
    };
  }, [sessionId, twinSessionId]);

  // ── WebRTC session start ───────────────────────────────────────────────────

  const startSession = useCallback(async (durationMinutes, videoRef_ = videoRef, peerRef_ = peerRef) => {
    if (!companion.avatar_id) {
      setError("This companion doesn't have a live avatar configured yet.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // 1. Create HeyGen session via backend
      const { sessionId: sid, sdp: offerSdp, iceServers } = await createHeyGenSession(companion);

      // 2. Set up RTCPeerConnection
      const pc = new RTCPeerConnection({ iceServers: iceServers ?? [] });
      peerRef_.current = pc;

      // When remote track arrives → attach to video element
      pc.ontrack = (event) => {
        const stream = event.streams?.[0];
        if (stream && videoRef_.current) {
          videoRef_.current.srcObject = stream;
          videoRef_.current.onloadedmetadata = () => videoRef_.current?.play().catch(() => {});
        }
      };

      // Relay our ICE candidates to HeyGen via backend
      pc.onicecandidate = (event) => {
        if (event.candidate) relayIceCandidate(sid, event.candidate).catch(() => {});
      };

      // 3. Set remote description (HeyGen's offer)
      await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: offerSdp }));

      // 4. Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendSdpAnswer(sid, answer.sdp);

      setSessionId(sid);
      setSessionActive(true);
      if (durationMinutes && durationMinutes !== "included") {
        setTimeLeft(durationMinutes * 60);
      }
    } catch (err) {
      setError(err.message ?? "Could not connect");
    } finally {
      setLoading(false);
    }
  }, [companion]);

  // ── Duration selection ─────────────────────────────────────────────────────

  const handleDurationSelect = async (dur) => {
    setDuration(dur);
    await startSession(dur);
  };

  // ── Speak ──────────────────────────────────────────────────────────────────

  const handleSpeak = async (e) => {
    e?.preventDefault();
    if (!sessionId || !speakText.trim() || speaking) return;
    setSpeaking(true);
    try {
      await fetch(`/api/heygen/session/${sessionId}/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: speakText.trim() }),
      });
      setSpeakText("");
    } catch {
      // silent
    } finally {
      setSpeaking(false);
    }
  };

  // ── Twin ───────────────────────────────────────────────────────────────────

  const handleSummonTwin = async () => {
    setTwinLoading(true);
    try {
      await startSession(null, twinVideoRef, twinPeerRef);
      // startSession sets sessionId for the main one — we need the twin's id separately
      // Simpler: just start a second session
      const { sessionId: tid, sdp, iceServers } = await createHeyGenSession(companion);
      const pc = new RTCPeerConnection({ iceServers: iceServers ?? [] });
      twinPeerRef.current = pc;
      pc.ontrack = (ev) => {
        const stream = ev.streams?.[0];
        if (stream && twinVideoRef.current) {
          twinVideoRef.current.srcObject = stream;
          twinVideoRef.current.onloadedmetadata = () => twinVideoRef.current?.play().catch(() => {});
        }
      };
      pc.onicecandidate = (ev) => {
        if (ev.candidate) relayIceCandidate(tid, ev.candidate).catch(() => {});
      };
      await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp }));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendSdpAnswer(tid, answer.sdp);
      setTwinSessionId(tid);
      setTwinActive(true);
    } catch (err) {
      setError(err.message ?? "Could not start twin");
    } finally {
      setTwinLoading(false);
    }
  };

  const handleDismissTwin = () => {
    if (twinSessionId) stopHeyGenSession(twinSessionId);
    twinPeerRef.current?.close();
    twinPeerRef.current = null;
    setTwinSessionId(null);
    setTwinActive(false);
  };

  // ── End session ────────────────────────────────────────────────────────────

  const handleEndSession = () => {
    if (sessionId) stopHeyGenSession(sessionId);
    peerRef.current?.close();
    peerRef.current = null;
    setSessionId(null);
    setSessionActive(false);
    setTimeLeft(null);
    onClose();
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── Derived display state ──────────────────────────────────────────────────

  const hasIntimacy = subscription?.intimacy_package;
  const hasTwin     = subscription?.twin_enabled;
  const showPicker  = !subLoading && subscription && !subscription.intimacy_package && duration === null && !loading && !error;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">

      {/* Header */}
      <header className="flex-shrink-0 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={companion.image} alt={companion.name} className="w-8 h-8 rounded-full object-cover object-top" />
            <h1 className="font-heading text-base font-semibold">
              {companion.name} — face to face
              {twinActive && <span className="text-primary ml-2">+ Twin</span>}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {timeLeft !== null && sessionActive && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                showWarning ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"
              }`}>
                {showWarning ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {formatTime(timeLeft)}
              </div>
            )}
            <button
              onClick={handleEndSession}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Close video"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4 overflow-y-auto">

        {/* Duration picker (pay-per-session users) */}
        {showPicker && (
          <div className="flex flex-col items-center gap-6 max-w-sm w-full">
            <div className="text-center">
              <h2 className="font-heading text-2xl font-semibold mb-2">Choose your session</h2>
              <p className="text-sm text-muted-foreground">
                How long would you like to spend with {companion.name}?
              </p>
            </div>

            {(subscription.credit_balance ?? 0) > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary/10 border border-primary/20">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{subscription.credit_balance.toFixed(1)} credits</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 w-full">
              {DURATIONS.map((d) => {
                const affordable = (subscription.credit_balance ?? 0) >= d.credits;
                return (
                  <button
                    key={d.value}
                    onClick={() => affordable && handleDurationSelect(d.value)}
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
                    <span className="font-heading text-lg font-semibold">{d.display}</span>
                  </button>
                );
              })}
            </div>

            {(subscription.credit_balance ?? 0) < 15 && (
              <Link to="/pricing" className="text-sm text-primary hover:underline">Add credit →</Link>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">{companion.name} is getting ready…</p>
          </div>
        )}

        {/* Error / upgrade */}
        {!loading && error && (
          <div className="text-center max-w-sm">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <p className="text-sm text-foreground mb-2 font-medium">{error}</p>
            <p className="text-xs text-muted-foreground mb-5">
              Upgrade to unlock face-to-face video with {companion.name}.
            </p>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm"
            >
              <Sparkles className="w-4 h-4" />
              View plans
            </Link>
          </div>
        )}

        {/* Active session */}
        {!loading && !error && sessionActive && (
          <>
            {/* Video area */}
            <div className={`w-full ${twinActive ? "max-w-4xl grid grid-cols-2 gap-3" : "max-w-2xl"}`}>
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-border shadow-lg bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {lowBalance !== null && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 text-yellow-400 text-xs px-3 py-1.5 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {lowBalance.toFixed(1)} credits remaining
                  </div>
                )}
              </div>

              {twinActive && (
                <div className="aspect-video rounded-2xl overflow-hidden border border-primary/40 shadow-lg bg-black">
                  <video ref={twinVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                </div>
              )}

              {twinLoading && (
                <div className="aspect-video rounded-2xl overflow-hidden border border-primary/40 shadow-lg flex items-center justify-center bg-card">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              )}
            </div>

            {/* Speak input */}
            <form onSubmit={handleSpeak} className="w-full max-w-2xl flex gap-2">
              <input
                type="text"
                value={speakText}
                onChange={(e) => setSpeakText(e.target.value)}
                placeholder={`Tell ${companion.name} what to say…`}
                className="flex-1 bg-card border border-border rounded-full px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors"
              />
              <button
                type="submit"
                disabled={!speakText.trim() || speaking}
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {speaking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {hasTwin && !twinActive && !twinLoading && (
                <button
                  onClick={handleSummonTwin}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Summon Twin
                </button>
              )}
              {twinActive && (
                <button
                  onClick={handleDismissTwin}
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
                  Unlock outfits &amp; twin
                </Link>
              )}
            </div>
          </>
        )}

        {/* Sub-loading */}
        {subLoading && (
          <div className="flex items-center gap-3 text-muted-foreground text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading…
          </div>
        )}
      </div>
    </div>
  );
}
