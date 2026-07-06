import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { base44 } from "@/api/base44Client";
import { Room, RoomEvent, Track } from "livekit-client";
import { X, Loader2, Send } from "lucide-react";

const HeygenView = forwardRef(({ companion, onClose, onSend }, ref) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inputText, setInputText] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const sessionInfoRef = useRef(null);
  const roomRef = useRef(null);
  const videoRef = useRef(null);

  const speak = async (text) => {
    const info = sessionInfoRef.current;
    if (!info || !text) return;
    setSpeaking(true);
    try {
      await base44.functions.invoke("heygenSession", {
        action: "talk",
        session_id: info.session_id,
        session_token: info.session_token,
        text,
      });
    } catch (err) {
      console.error("HeyGen talk failed:", err);
    } finally {
      setSpeaking(false);
    }
  };

  useImperativeHandle(ref, () => ({ speak }));

  const handleSend = async () => {
    if (!inputText.trim() || waiting || speaking) return;
    const text = inputText.trim();
    setInputText("");
    setWaiting(true);
    try {
      const replyText = await onSend(text);
      if (replyText) await speak(replyText);
    } catch (err) {
      console.error(err);
    } finally {
      setWaiting(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await base44.functions.invoke("heygenSession", {
          action: "start",
          avatar_name: companion.avatar_name || "",
          voice_id: companion.voice_id || "",
        });
        if (cancelled) return;
        if (res.data?.error) throw new Error(res.data.error);

        const info = res.data;
        sessionInfoRef.current = info;

        const room = new Room();
        roomRef.current = room;
        await room.connect(info.url, info.access_token);
        if (cancelled) {
          room.disconnect();
          return;
        }

        room.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind === Track.Kind.Video && videoRef.current) {
            track.attach(videoRef.current);
          }
        });

        room.remoteParticipants.forEach((p) => {
          p.trackPublications.forEach((pub) => {
            if (pub.track && pub.track.kind === Track.Kind.Video && videoRef.current) {
              pub.track.attach(videoRef.current);
            }
          });
        });

        setLoading(false);
      } catch (err) {
        if (!cancelled) setError(err.message || "Something went wrong");
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      const info = sessionInfoRef.current;
      if (info) {
        base44.functions.invoke("heygenSession", {
          action: "stop",
          session_id: info.session_id,
          session_token: info.session_token,
        }).catch(() => {});
      }
      try {
        roomRef.current?.disconnect();
      } catch (e) {}
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
                {companion.name} — HeyGen video
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {speaking ? "Speaking…" : waiting ? "Thinking…" : "Powered by HeyGen · public avatars"}
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

      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
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
              Make sure your HeyGen API key is set.
            </p>
          </div>
        ) : (
          <>
            <div className="w-full max-w-2xl aspect-video rounded-2xl overflow-hidden border border-border shadow-lg bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full"
              />
            </div>
            <div className="w-full max-w-2xl flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder={`Say something to ${companion.name}…`}
                disabled={waiting || speaking}
                className="flex-1 px-4 py-3 rounded-full bg-card border border-border text-sm focus:outline-none focus:border-primary/40 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || waiting || speaking}
                className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity"
              >
                {waiting || speaking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

export default HeygenView;