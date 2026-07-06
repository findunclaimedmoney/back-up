import { Heart, Clock, Check } from "lucide-react";
import { Loader2 } from "lucide-react";

const DURATIONS = [
  { id: "7d", label: "7 Days", price: "$9.99", sublabel: "Try the deep connection" },
  { id: "30d", label: "30 Days", price: "$19.99", sublabel: "Best value per day" },
];

export default function IntimacyAddOnCard({ active, expires, loading, onPurchase }) {
  const expiryDate = expires ? new Date(expires) : null;
  const isExpired = expiryDate && expiryDate.getTime() < Date.now();

  return (
    <div className="rounded-[2rem] border border-primary/30 bg-gradient-to-br from-primary/5 to-card overflow-hidden">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-heading text-xl font-semibold">Intimacy Layer Add-on</h3>
            <p className="text-sm text-muted-foreground">Unlock the romantic & intimate connection</p>
          </div>
        </div>

        {active && !isExpired ? (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
            <Check className="w-4 h-4 text-primary" />
            <p className="text-sm text-foreground">
              Active{expiryDate ? ` — expires ${expiryDate.toLocaleDateString()}` : ""}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Deepen your bond beyond ordinary conversation. Your companion will
            remember intimate moments, speak with rawness and warmth, and show up
            the way only someone who truly knows you can. Available as a
            time-limited add-on on any plan.
          </p>
        )}

        {!active || isExpired ? (
          <div className="grid grid-cols-2 gap-3">
            {DURATIONS.map((d) => (
              <button
                key={d.id}
                onClick={() => onPurchase(d.id)}
                disabled={loading}
                className="flex flex-col items-start gap-1 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {d.label}
                </div>
                <p className="font-heading text-2xl font-semibold text-foreground">
                  {d.price}
                </p>
                <p className="text-[11px] text-muted-foreground">{d.sublabel}</p>
                {loading === d.id && (
                  <Loader2 className="w-4 h-4 text-primary animate-spin mt-1" />
                )}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}