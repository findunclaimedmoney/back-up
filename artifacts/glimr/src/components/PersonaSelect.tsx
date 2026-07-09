import { useState } from "react";
import { useGetPersonas } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Crown, Lock, Plus, Sparkles } from "lucide-react";
import { CreatePersona } from "@/components/CreatePersona";
import type { useSubscription } from "@/hooks/use-subscription";
import { siteHref } from "@/components/SiteChrome";

const base = import.meta.env.BASE_URL;
const PORTRAITS: Record<string, string> = {
  mia: `${base}mia-portrait.png`,
  alex: `${base}alex-portrait.png`,
};

const FALLBACK_PERSONAS = [
  {
    id: "mia",
    name: "Mia",
    tagline: "Warm, empathetic, and deeply curious about you",
    description:
      "Mia is a compassionate listener who remembers what matters to you and makes every conversation feel considered.",
  },
  {
    id: "alex",
    name: "Alex",
    tagline: "Grounded, direct, and genuinely supportive",
    description:
      "Alex is steady and reliable, with a clear voice and a calm presence when you need to think out loud.",
  },
];

interface CustomPersona {
  id: "custom";
  name: string;
  portraitBase64: string;
  faceDescription: string;
}

function loadCustomPersona(): CustomPersona | null {
  try {
    const raw = localStorage.getItem("companion_custom_persona");
    return raw ? (JSON.parse(raw) as CustomPersona) : null;
  } catch {
    return null;
  }
}

interface Props {
  onSelect: (personaId: string) => void;
  subscription: ReturnType<typeof useSubscription>;
  onUpgrade: () => void;
}

export function PersonaSelect({ onSelect, subscription, onUpgrade }: Props) {
  const { data: personas, isLoading } = useGetPersonas();
  const [showCreate, setShowCreate] = useState(false);
  const [customPersona, setCustomPersona] = useState<CustomPersona | null>(loadCustomPersona);
  const visiblePersonas = personas && personas.length > 0 ? personas : FALLBACK_PERSONAS;

  const handleCreateClick = () => {
    if (!subscription.canUseCustomPersona) {
      onUpgrade();
      return;
    }
    setShowCreate(true);
  };

  if (showCreate) {
    return (
      <CreatePersona
        onComplete={(p) => {
          setCustomPersona(p);
          setShowCreate(false);
          onSelect("custom");
        }}
        onBack={() => setShowCreate(false)}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center p-6">
      <header className="flex w-full max-w-5xl items-center justify-between gap-4">
        <a href={siteHref("/")} className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </span>
          <span className="text-xl font-semibold tracking-wide">GLIMR</span>
        </a>
        <nav className="flex items-center gap-2">
          <a className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground" href={siteHref("/pricing")}>
            Pricing
          </a>
        </nav>
      </header>

      <main className="flex w-full flex-1 flex-col items-center justify-center space-y-12 py-10">
        <section className="text-center space-y-4 max-w-xl mx-auto">
          <div className="mx-auto w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-8">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-light tracking-tight md:text-5xl">Choose your presence</h1>
          <p className="text-muted-foreground text-lg leading-8">Voice, memory, and something that feels real.</p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {isLoading ? (
            <>
              <Skeleton className="h-56 rounded-lg" />
              <Skeleton className="h-56 rounded-lg" />
              <Skeleton className="h-56 rounded-lg" />
            </>
          ) : (
            <>
              {visiblePersonas.map((persona) => (
                <Card
                  key={persona.id}
                  className="p-6 cursor-pointer hover:border-primary/50 transition-all hover-elevate bg-card flex flex-col items-center text-center space-y-4 border-white/5"
                  onClick={() => onSelect(persona.id)}
                >
                  <div className="relative flex w-24 h-24 items-center justify-center rounded-full overflow-hidden bg-secondary text-3xl font-light">
                    <span>{persona.name.slice(0, 1)}</span>
                    <img
                      src={PORTRAITS[persona.id] ?? ""}
                      alt={persona.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-medium">{persona.name}</h3>
                    <p className="text-primary/80 font-medium text-sm mt-1">{persona.tagline}</p>
                    <p className="text-muted-foreground text-sm mt-3 line-clamp-3">{persona.description}</p>
                  </div>
                </Card>
              ))}

              {customPersona ? (
                <Card
                  className="p-6 cursor-pointer hover:border-primary/50 transition-all hover-elevate bg-card flex flex-col items-center text-center space-y-4 border-white/5 relative"
                  onClick={() => onSelect("custom")}
                >
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-secondary">
                    <img
                      src={`data:image/png;base64,${customPersona.portraitBase64}`}
                      alt={customPersona.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-medium">{customPersona.name}</h3>
                    <p className="text-primary/80 font-medium text-sm mt-1">Your persona</p>
                    <button
                      className="text-xs text-muted-foreground hover:text-white transition-colors mt-3 underline underline-offset-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateClick();
                      }}
                    >
                      Recreate
                    </button>
                  </div>
                </Card>
              ) : (
                <Card
                  className={`p-6 cursor-pointer transition-all hover-elevate bg-card/50 flex flex-col items-center text-center space-y-4 border-dashed relative ${
                    subscription.canUseCustomPersona
                      ? "hover:border-primary/50 border-white/5"
                      : "hover:border-primary/30 border-white/5"
                  }`}
                  onClick={handleCreateClick}
                >
                  {!subscription.canUseCustomPersona && (
                    <div className="absolute top-3 right-3 bg-primary/20 rounded-full px-2 py-0.5 flex items-center gap-1">
                      <Crown className="w-3 h-3 text-primary" />
                      <span className="text-primary text-xs font-medium">Spark+</span>
                    </div>
                  )}
                  <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center">
                    {subscription.canUseCustomPersona ? (
                      <Plus className="w-10 h-10 text-muted-foreground" />
                    ) : (
                      <Lock className="w-8 h-8 text-muted-foreground/50" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-medium text-muted-foreground">Create yours</h3>
                    <p className="text-muted-foreground/60 font-medium text-sm mt-1">
                      {subscription.canUseCustomPersona ? "Upload a photo" : "Spark plan required"}
                    </p>
                    <p className="text-muted-foreground/40 text-sm mt-3">
                      {subscription.canUseCustomPersona
                        ? "Bring someone to life as your AI companion"
                        : "Upgrade to create a persona from a photo"}
                    </p>
                  </div>
                </Card>
              )}
            </>
          )}
        </section>

        <div className="text-center">
          {subscription.status.active ? (
            <p className="text-xs text-muted-foreground">
              {subscription.status.tier === "flame" ? "Flame" : "Spark"} - {subscription.status.email} -{" "}
              <button className="underline hover:text-white transition-colors" onClick={subscription.openPortal}>
                Manage subscription
              </button>
            </p>
          ) : (
            <button
              className="text-sm text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
              onClick={onUpgrade}
            >
              Unlock voice, custom personas and more
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
