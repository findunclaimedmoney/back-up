import { useState } from "react";
import { useListJobs } from "@workspace/api-client-react";
import type { Job } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles, Copy, Check, Instagram, Linkedin, Mail,
  Facebook, CalendarDays, RefreshCw, ChevronDown, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MarketingPack {
  instagram: { caption: string; hashtags: string[] };
  facebook: { post: string };
  linkedin: { post: string };
  email: { subject: string; body: string };
  schedule: { platform: string; time: string; note: string }[];
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded border transition-colors",
        copied
          ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
          : "border-border text-muted-foreground hover:text-foreground hover:border-border/80",
        className,
      )}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

const PLATFORM_META = [
  { key: "instagram" as const, label: "Instagram", icon: Instagram, color: "text-pink-400", border: "border-pink-500/20", bg: "bg-pink-500/5" },
  { key: "facebook" as const, label: "Facebook", icon: Facebook, color: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/5" },
  { key: "linkedin" as const, label: "LinkedIn", icon: Linkedin, color: "text-sky-400", border: "border-sky-500/20", bg: "bg-sky-500/5" },
  { key: "email" as const, label: "Email", icon: Mail, color: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/5" },
];

export default function MorganMarketing() {
  const { data: jobs } = useListJobs();
  const completedJobs = (jobs ?? []).filter((j: Job) => j.status === "complete");

  const [listingUrl, setListingUrl] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [showJobPicker, setShowJobPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pack, setPack] = useState<MarketingPack | null>(null);

  const selectJob = (job: Job) => {
    setListingUrl(job.listingUrl ?? "");
    setShowJobPicker(false);
  };

  const generate = async () => {
    if (!listingUrl.trim()) {
      toast.error("Paste a listing URL to continue");
      return;
    }
    setLoading(true);
    setPack(null);
    try {
      const res = await fetch("/api/morgan/marketing-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          listingUrl: listingUrl.trim(),
          agentName: agentName.trim() || undefined,
          agentPhone: agentPhone.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as MarketingPack;
      setPack(data);
    } catch {
      toast.error("Failed to generate — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0">
          <span className="text-xl text-violet-400">✦</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold">Morgan</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Marketing Advisor PA — generates your full social + email content pack in one click
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-mono">Always On</span>
        </div>
      </div>

      {/* Input card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="space-y-2">
          <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Listing URL</Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://www.realestate.com.au/property/..."
              value={listingUrl}
              onChange={(e) => setListingUrl(e.target.value)}
              className="font-mono text-sm"
            />
            {completedJobs.length > 0 && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowJobPicker((v) => !v)}
                  className="gap-1.5 text-xs font-mono whitespace-nowrap"
                >
                  My Jobs <ChevronDown className="w-3 h-3" />
                </Button>
                {showJobPicker && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-80 rounded-lg border border-border bg-card shadow-xl overflow-hidden">
                    <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border">
                      Recent completed jobs
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {completedJobs.slice(0, 10).map((job) => (
                        <button
                          key={job.id}
                          onClick={() => selectJob(job)}
                          className="w-full text-left px-3 py-2.5 text-sm hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0"
                        >
                          <div className="font-medium truncate">{job.listingTitle ?? job.listingUrl}</div>
                          <div className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">{job.listingUrl}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Your Name <span className="text-muted-foreground/50 normal-case">(optional)</span>
            </Label>
            <Input
              placeholder="e.g. Sarah Mitchell"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Phone <span className="text-muted-foreground/50 normal-case">(optional)</span>
            </Label>
            <Input
              placeholder="e.g. 0412 345 678"
              value={agentPhone}
              onChange={(e) => setAgentPhone(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        <Button
          onClick={generate}
          disabled={loading}
          className="w-full gap-2 font-mono uppercase tracking-wider"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Morgan is writing your pack…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Marketing Pack
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      {pack && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
              Your Content Pack
            </h2>
            <Button variant="ghost" size="sm" onClick={generate} className="gap-1.5 text-xs">
              <RefreshCw className="w-3 h-3" /> Regenerate
            </Button>
          </div>

          {/* Platform cards */}
          <div className="grid gap-4">
            {PLATFORM_META.map(({ key, label, icon: Icon, color, border, bg }) => {
              const isEmail = key === "email";
              const isInstagram = key === "instagram";
              const content = isEmail
                ? `Subject: ${pack.email.subject}\n\n${pack.email.body}`
                : isInstagram
                  ? `${pack.instagram.caption}\n\n${pack.instagram.hashtags.map((h) => `#${h}`).join(" ")}`
                  : pack[key].post;

              return (
                <div key={key} className={cn("rounded-xl border p-5 space-y-4", border, bg)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("w-4 h-4", color)} />
                      <span className={cn("text-sm font-semibold", color)}>{label}</span>
                    </div>
                    <CopyButton text={content} />
                  </div>

                  {isEmail ? (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-border/60 bg-background/50 px-4 py-2.5">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Subject</span>
                        <p className="text-sm font-medium mt-1">{pack.email.subject}</p>
                      </div>
                      <Textarea
                        readOnly
                        value={pack.email.body}
                        className="text-sm resize-none bg-background/50 min-h-[160px] font-sans leading-relaxed"
                      />
                    </div>
                  ) : isInstagram ? (
                    <div className="space-y-3">
                      <Textarea
                        readOnly
                        value={pack.instagram.caption}
                        className="text-sm resize-none bg-background/50 min-h-[120px] font-sans leading-relaxed"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {pack.instagram.hashtags.map((tag) => (
                          <span key={tag} className="text-[11px] font-mono text-pink-400/80 bg-pink-500/10 border border-pink-500/15 px-2 py-0.5 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Textarea
                      readOnly
                      value={pack[key as "facebook" | "linkedin"].post}
                      className="text-sm resize-none bg-background/50 min-h-[140px] font-sans leading-relaxed"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Posting schedule */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-semibold text-violet-400">Suggested Posting Schedule</span>
            </div>
            <div className="space-y-2">
              {pack.schedule.map((item, i) => (
                <div key={i} className="flex items-start gap-4 py-2 border-b border-border/40 last:border-0">
                  <span className="text-xs font-mono text-muted-foreground w-32 shrink-0 pt-0.5">{item.time}</span>
                  <span className="text-sm font-medium w-28 shrink-0">{item.platform}</span>
                  <span className="text-xs text-muted-foreground">{item.note}</span>
                </div>
              ))}
            </div>
            <div className="pt-1">
              <CopyButton
                text={pack.schedule.map((s) => `${s.time} — ${s.platform}: ${s.note}`).join("\n")}
                className="text-[11px]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
