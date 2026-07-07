import { useState } from "react";
import { Wallet, Loader2, Plus, Check } from "lucide-react";

const PACKS = [
  { id: "pack_5", amount: 5, label: "$5" },
  { id: "pack_10", amount: 10, label: "$10", popular: true },
  { id: "pack_25", amount: 25, label: "$25" },
  { id: "pack_50", amount: 50, label: "$50" },
];

export default function TopUpCard({ creditBalance = 0, onPurchase, loading }) {
  const [selected, setSelected] = useState(null);

  return (
    <div id="topup" className="rounded-[2rem] border border-border bg-card overflow-hidden scroll-mt-20">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-heading text-xl font-semibold">Top Up Credit</h3>
            <p className="text-sm text-muted-foreground">Add credit for intimate video sessions</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
          <Wallet className="w-4 h-4 text-primary" />
          <p className="text-sm text-foreground">
            Current balance: <span className="font-semibold">${creditBalance.toFixed(2)}</span>
          </p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Credit is used when you start an intimate video session. Each session
          deducts from your balance based on duration — $4 for 15 min, $8 for
          30 min, $15 for 1 hour. Top up anytime; credit never expires.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => {
                setSelected(pack.id);
                onPurchase(pack.id);
              }}
              disabled={loading !== null}
              className={`relative flex flex-col items-center gap-2 p-5 rounded-2xl border transition-all text-center disabled:opacity-50 ${
                loading === pack.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/40"
              }`}
            >
              {pack.popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-medium uppercase tracking-wide bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  Popular
                </span>
              )}
              <Plus className="w-4 h-4 text-muted-foreground" />
              <span className="font-heading text-2xl font-semibold">{pack.label}</span>
              <span className="text-[11px] text-muted-foreground">credit</span>
              {loading === pack.id && (
                <Loader2 className="w-4 h-4 text-primary animate-spin mt-1" />
              )}
            </button>
          ))}
        </div>

        {creditBalance > 0 && (
          <div className="flex items-center gap-2 mt-6 text-xs text-muted-foreground">
            <Check className="w-3.5 h-3.5 text-primary" />
            You have enough credit for {Math.floor(creditBalance / 4)} more session{Math.floor(creditBalance / 4) === 1 ? "" : "s"}.
          </div>
        )}
      </div>
    </div>
  );
}