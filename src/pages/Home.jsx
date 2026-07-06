import React from "react";
import { Link } from "react-router-dom";
import { COMPANIONS } from "@/lib/companions";
import { Sparkles, ArrowRight, MessageCircle, Mic, Video, Camera, Gamepad2, Plus, Loader2 } from "lucide-react";
import { useGreetings } from "@/hooks/useGreetings";

const FEATURES = [
  { icon: MessageCircle, label: "Text chat" },
  { icon: Mic, label: "Voice replies" },
  { icon: Video, label: "Live video" },
  { icon: Camera, label: "Selfie photos" },
  { icon: Gamepad2, label: "Games" },
  { icon: Plus, label: "Custom companion" },
];

export default function Home() {
  const { greetings, loading } = useGreetings();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-heading text-lg font-semibold tracking-tight">
            GLIMR
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-12 pb-16 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-8">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight mb-4">
          Choose your companion
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto leading-relaxed mb-8">
          A deeply personal presence that remembers you, and picks up right
          where you left off.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card/50 text-xs text-muted-foreground"
            >
              <f.icon className="w-3.5 h-3.5" />
              {f.label}
            </div>
          ))}
        </div>
      </section>

      {/* Companion cards */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {COMPANIONS.map((c) => (
            <Link
              key={c.id}
              to={`/chat/${c.id}`}
              className="block group relative overflow-hidden rounded-[2rem] border border-border bg-card transition-all hover:border-primary/40 hover:-translate-y-0.5"
            >
              {/* Image */}
              <div className="relative aspect-[4/5] sm:aspect-[16/10] overflow-hidden">
                <img
                  src={c.image}
                  alt={c.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* Tagline badge */}
                <div className="absolute top-5 left-5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-primary uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {c.tagline}
                  </span>
                </div>

                {/* Name + subtitle over image */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="font-heading text-3xl font-semibold text-white mb-1">
                    {c.name}
                  </h2>
                  <p className="text-white/70 text-sm">{c.subtitle}</p>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {c.description}
                </p>

                {/* Greeting preview */}
                {loading ? (
                  <div className="mb-5 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/40 border border-border">
                    <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                    <span className="text-xs text-muted-foreground">
                      {c.name} is thinking…
                    </span>
                  </div>
                ) : greetings[c.id] ? (
                  <div className="mb-5 px-3 py-2.5 rounded-xl bg-muted/40 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                      {c.name} says
                    </p>
                    <p className="text-sm text-foreground/80 italic line-clamp-2 leading-relaxed">
                      "{greetings[c.id]}"
                    </p>
                  </div>
                ) : null}

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {["Chat", "Voice", "Live video", "Selfies", "Games"].map(
                    (tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full border border-border text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    )
                  )}
                </div>

                {/* CTA */}
                <div className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm transition-all group-hover:gap-3">
                  Talk with {c.name}
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}

          {/* Create your own */}
          <div className="sm:col-span-2 lg:col-span-1 block group relative overflow-hidden rounded-[2rem] border border-dashed border-border bg-card/30 transition-all hover:border-primary/40">
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted border border-border mb-5">
                <Plus className="w-7 h-7 text-muted-foreground" />
              </div>
              <h2 className="font-heading text-2xl font-semibold mb-2">
                Create your own
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Upload a photo and bring them to life — ready in 24 hours
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}