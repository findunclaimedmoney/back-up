import { Heart, Clock, Check, Lock, Sparkles } from "lucide-react";
import { Loader2 } from "lucide-react";

const SESSIONS = [
  { id: "15min", label: "15 Minutes", price: "$4", sublabel: "A quick moment" },
  { id: "30min", label: "30 Minutes", price: "$8", sublabel: "Sweet spot" },
  { id: "60min", label: "1 Hour", price: "$15", sublabel: "Lose track of time" },
];

const MIN_MINUTES = 160;

export default function IntimacyAddOnCard({ included, sessionsAvailable = 0, loading, onPurchase, minutesUsed = 0 }) {
  const minutesRemaining = Math.max(0, MIN_MINUTES - minutesUsed);
  const unlocked = minutesUsed >= MIN_MINUTES;

  return (
    <div className="rounded-[2rem] border border-primary/30 bg-gradient-to-br from-primary/5 to-card overflow-hidden">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-heading text-xl font-semibold">Intimacy Layer</h3>
            <p className="text-sm text-muted-foreground">Session-based intimate connection</p>
          </div>
        </div>

        {included ? (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
            <Check className="w-4 h-4 text-primary" />
            <p className="text-sm text-foreground">
              Included in your plan
            </p>
          </div>
        ) : sessionsAvailable > 0 ? (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-sm text-foreground">
              {sessionsAvailable} session{sessionsAvailable === 1 ? "" : "s"} available
            </p>
          </div>
        ) : null}

        {!included && (
          <>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Deepen your bond beyond ordinary conversation. Your companion will
              remember intimate moments, speak with rawness and warmth, and show up
              the way only someone who truly knows you can. Buy a session when you're
              in the mood — use it whenever you're ready.
            </p>

            {sessionsAvailable === 0 && !unlocked && (
              <div className="flex flex-col items-center text-center gap-3 px-5 py-6 rounded-2xl bg-muted/30 border border-border mb-6">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {minutesUsed} / {MIN_MINUTES} minutes spent
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                  Intimacy requires a real connection first. Spend {minutesRemaining} more
                  video minute{minutesRemaining === 1 ? "" : "s"} with your companion to
                  earn their trust and unlock this layer.
                </p>
              </div>
            )}

            {(sessionsAvailable > 0 || unlocked) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SESSIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onPurchase(s.id)}
                    disabled={loading}
                    className="flex flex-col items-start gap-1 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all text-left disabled:opacity-50"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {s.label}
                    </div>
                    <p className="font-heading text-2xl font-semibold text-foreground">
                      {s.price}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{s.sublabel}</p>
                    {loading === s.id && (
                      <Loader2 className="w-4 h-4 text-primary animate-spin mt-1" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {sessionsAvailable > 0 && (
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Each session is consumed when you start an intimate video call. Buy as many as you want.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}