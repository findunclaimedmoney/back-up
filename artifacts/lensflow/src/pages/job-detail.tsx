import { useParams, useLocation } from "wouter";
import { useGetJob, useDeleteJob, useSimulateJob, useSendJobToCrm, useSetJobMatterportUrl, useApproveProLensUpgrade, useRejectProLensUpgrade, useApproveRoomRescue, useRejectRoomRescue, getGetJobQueryKey, getGetJobStatsQueryKey, getListJobsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { ArrowLeft, Trash2, ExternalLink, CheckCircle2, Loader2, Circle, XCircle, Play, RotateCcw, Volume2, Mic, Copy, Check, Download, Plus, Share2, Video, Camera, Send, ChevronDown, ChevronUp, Sparkles, Box, MapPin, ThumbsUp, ThumbsDown, ZoomIn, Wand2, Coins } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { JobStatusBadge } from "@/pages/dashboard";

const STEP_LABELS: Record<string, string> = {
  room_rescue: "AI Room Rescue",
  pro_lens_upgrade: "Pro Lens Upgrade",
  enhance_photos: "AI Photo Glow-up",
  analyse_photos: "Analyse Photos",
  scrape_listing: "Scrape Listing",
  generate_script: "Generate Script",
  create_voiceover: "Generate Voiceover",
  presenter_video: "Generate Presenter",
  compose_video: "Final Video Render",
};

const STEP_DESCRIPTIONS: Record<string, string> = {
  room_rescue: "Compliance-safe AI transformation: declutters messy rooms or virtually stages empty ones. Originals are always preserved. Structural defects (mould, cracks, damage) are never removed or hidden.",
  pro_lens_upgrade: "Professional photographic corrections: lens distortion, exposure, colour balance, noise reduction, sharpening and dynamic range — no creative changes, no structural alterations.",
  enhance_photos: "AI relights, colour-balances, declutters and sky-replaces your photos for a premium magazine-listing look.",
  analyse_photos: "Claude Vision analyses your uploaded photos to identify the property type, features, and selling points.",
  scrape_listing: "Extract property data and metadata from the listing URL.",
  generate_script: "Generate a compelling AI-written presenter script from listing data.",
  create_voiceover: "Synthesize professional voiceover audio from the script.",
  presenter_video: "Render a photoreal AI presenter avatar delivering the voiceover.",
  compose_video: "Composite all elements into a single shareable 1080p HD video file.",
};

function StepIcon({ status, name }: { status: string; name?: string }) {
  if (status === "complete") return <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />;
  if (status === "running") return <Loader2 className="w-5 h-5 text-blue-400 shrink-0 animate-spin" />;
  if (status === "failed") return <XCircle className="w-5 h-5 text-destructive shrink-0" />;
  if (status === "awaiting_approval") {
    if (name === "room_rescue") return <Wand2 className="w-5 h-5 text-violet-400 shrink-0 animate-pulse" />;
    return <ZoomIn className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />;
  }
  return <Circle className="w-5 h-5 text-muted-foreground/30 shrink-0" />;
}

function useCopyToClipboard(timeout = 1500) {
  const [copied, setCopied] = useState(false);
  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    });
  }
  return { copied, copy };
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteJob = useDeleteJob();
  const simulateJob = useSimulateJob();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pipelineOpen, setPipelineOpen] = useState(false);

  const { data: job, isLoading, isError } = useGetJob(id!, {
    query: {
      enabled: !!id,
      queryKey: getGetJobQueryKey(id!),
      refetchInterval: (query) => {
        const status = (query.state.data as any)?.status;
        return (status === "queued" || status === "processing" || status === "awaiting_approval") ? 1500 : false;
      },
    },
  });

  const isSimulating = job?.status === "processing" || job?.status === "queued" || job?.status === "awaiting_approval";
  const isAwaitingApproval = job?.status === "awaiting_approval";
  const canSimulate = !!id && job?.status !== "processing" && job?.status !== "queued" && job?.status !== "awaiting_approval";

  function handleSimulate() {
    if (!id) return;
    simulateJob.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(id) });
        toast({ title: "Pipeline Started", description: "All stages are now running." });
      },
      onError: () => {
        toast({ title: "Could not start pipeline", description: "The job may already be processing.", variant: "destructive" });
      },
    });
  }

  function handleDelete() {
    if (!id) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      setTimeout(() => setConfirmingDelete(false), 4000);
      return;
    }
    setConfirmingDelete(false);
    deleteJob.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetJobStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
        toast({ title: "Campaign Deleted" });
        setLocation("/");
      },
      onError: () => {
        toast({ title: "Delete Failed", variant: "destructive" });
      },
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="h-10 w-2/3 bg-muted rounded" />
        <div className="h-64 bg-muted rounded mt-6" />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
        <XCircle className="w-12 h-12 text-destructive opacity-50" />
        <h2 className="text-xl font-semibold">Campaign Not Found</h2>
        <p className="text-muted-foreground text-sm">This campaign may have been deleted or the ID is invalid.</p>
        <Link href="/" className="text-primary text-sm hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const completedSteps = job.steps?.filter(s => s.status === "complete").length ?? 0;
  const totalSteps = job.steps?.length ?? 5;
  const progressPct = Math.round((completedSteps / totalSteps) * 100);
  const isComplete = job.status === "complete" && !!job.videoUrl;
  const propertyName = job.listingTitle || job.propertyAddress || "Your Property Video";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Nav bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </Link>
        <div className="flex items-center gap-2">
          {!isComplete && (
            <Button
              size="sm"
              onClick={handleSimulate}
              disabled={!canSimulate || simulateJob.isPending}
              data-testid="button-simulate-pipeline"
            >
              {isSimulating ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Running…</> :
               job.status === "complete" || job.status === "failed" ? <><RotateCcw className="w-3.5 h-3.5 mr-1.5" />Re-run</> :
               <><Play className="w-3.5 h-3.5 mr-1.5" />Run Pipeline</>}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleteJob.isPending}
            className={`transition-all ${confirmingDelete ? "bg-destructive text-white border-destructive" : "text-destructive hover:text-destructive hover:border-destructive/50"}`}
            data-testid="button-delete-job"
          >
            {deleteJob.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            {confirmingDelete ? "Confirm?" : ""}
          </Button>
        </div>
      </div>

      {/* ── CAMPAIGN READY REVEAL ── shown when video is complete */}
      {isComplete && (
        <CampaignReveal job={job} onRerun={() => simulateJob.mutate({ id: job.id })} />
      )}

      {/* ── PROCESSING STATE — shown while pipeline runs */}
      {!isComplete && (
        <>
          <div>
            <h1 className="text-2xl font-bold tracking-tight truncate max-w-xl">{propertyName}</h1>
            <div className="flex items-center gap-3 flex-wrap mt-2">
              {job.listingUrl ? (
                <a href={job.listingUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 truncate max-w-xs"
                  data-testid="link-listing-url">
                  {job.listingUrl}<ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Camera className="w-3 h-3" />{job.propertyAddress || "From property photos"}
                </span>
              )}
              <JobStatusBadge status={job.status} />
              {(job as any).creditCost > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono border border-amber-500/20 bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">
                  <Coins className="w-3 h-3" /> {(job as any).creditCost}c
                </span>
              )}
              <span className="text-xs text-muted-foreground" data-testid="text-created-at">
                Started {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-card border border-border rounded-lg p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Production Progress</span>
              <span className="text-xs font-mono text-primary">{completedSteps}/{totalSteps} stages</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} data-testid="progress-bar" />
            </div>
            {isSimulating && <p className="text-[11px] font-mono text-muted-foreground animate-pulse">Producing your campaign — page refreshes automatically</p>}
          </div>
        </>
      )}

      {/* ── PIPELINE STEPS — collapsible when complete, always visible when processing ── */}
      {isComplete ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setPipelineOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm font-medium text-muted-foreground">Production details</span>
            {pipelineOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {pipelineOpen && <PipelineSteps job={job} />}
        </div>
      ) : (
        <PipelineStepsCard job={job} isSimulating={isSimulating} id={id!} />
      )}

      {/* ── AI Room Rescue approval gate ── */}
      {(job.roomRescueImages?.length ?? 0) > 0 && (
        <RoomRescuePanel
          jobId={id!}
          originals={job.propertyImages ?? []}
          rescued={job.roomRescueImages ?? []}
          rescuedCount={job.roomRescueCount ?? 0}
          mode={(job.roomRescueMode as "declutter" | "staging" | null) ?? "declutter"}
          approved={job.roomRescueApproved ?? null}
          isAwaitingApproval={isAwaitingApproval}
        />
      )}

      {/* ── Pro Lens Upgrade approval gate ── */}
      {(job.proLensImages?.length ?? 0) > 0 && (
        <ProLensUpgradePanel
          jobId={id!}
          originals={job.propertyImages ?? []}
          upgraded={job.proLensImages ?? []}
          upgradedCount={job.proLensUpgradedCount ?? 0}
          approved={job.proLensApproved ?? null}
          isAwaitingApproval={isAwaitingApproval}
        />
      )}

      {/* ── AI Photo Glow-up ── */}
      {job.inputMode === "photos" && (job.propertyImages?.length ?? 0) > 0 && (
        <PhotoGlowUp originals={job.propertyImages ?? []} enhanced={job.enhancedImages ?? []} />
      )}

      {/* ── Metadata (discrete) ── */}
      {!isComplete && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <MetaCard label="Campaign" value={job.id.slice(0, 8) + "…"} />
          <MetaCard label="Created" value={format(new Date(job.createdAt), "MMM d, yyyy")} />
          <MetaCard label="Updated" value={formatDistanceToNow(new Date(job.updatedAt), { addSuffix: true })} />
        </div>
      )}
    </div>
  );
}

// ── Campaign Reveal ────────────────────────────────────────────────────────────

function CampaignReveal({ job, onRerun }: { job: any; onRerun: () => void }) {
  const { toast } = useToast();
  const { copied: linkCopied, copy: copyLink } = useCopyToClipboard(2000);
  const propertyName = job.listingTitle || job.propertyAddress || "Your Property Video";

  return (
    <div className="space-y-6">
      {/* ── Hero reveal banner ── */}
      <div className="relative rounded-2xl overflow-hidden border border-primary/30 bg-gradient-to-br from-[#0d1117] to-[#1a1200] shadow-2xl shadow-primary/10">
        {/* Gold accent bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="px-6 pt-6 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="text-primary font-semibold text-sm tracking-wide">Your campaign is ready</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground leading-snug max-w-xl">{propertyName}</h1>
            {job.listingUrl && (
              <a href={job.listingUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mt-1.5 truncate max-w-sm"
                data-testid="link-listing-url">
                {job.listingUrl} <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            )}
          </div>
          <div className="text-xs text-muted-foreground text-right shrink-0">
            <div>1080p HD · AI Presenter</div>
            <div className="mt-0.5">Created {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</div>
          </div>
        </div>

        {/* Video player — full width, cinematic */}
        <div className="px-6 pb-2">
          <div className="rounded-xl overflow-hidden bg-black shadow-inner" style={{ aspectRatio: "16/9" }}>
            <video
              controls
              src={job.videoUrl}
              className="w-full h-full object-contain"
              data-testid="hero-video-player"
            />
          </div>
        </div>

        {/* Primary action row */}
        <div className="px-6 py-5 flex flex-wrap gap-3 border-t border-white/5 mt-2">
          <DownloadVideoButton url={job.videoUrl} large />
          <button
            type="button"
            onClick={() => copyLink(job.videoUrl)}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:border-primary/50 hover:text-primary transition-all"
          >
            {linkCopied ? <Check className="w-4 h-4 text-primary" /> : <Share2 className="w-4 h-4" />}
            {linkCopied ? "Link copied!" : "Copy share link"}
          </button>
          <Link
            href="/jobs/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
          >
            <Plus className="w-4 h-4" /> New campaign
          </Link>
          <button
            type="button"
            onClick={onRerun}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Regenerate
          </button>
        </div>
      </div>

      {/* ── Marketing value stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Sparkles, label: "AI Script", sub: "Bespoke for this listing" },
          { icon: Volume2, label: "Voiceover", sub: "Professional presenter" },
          { icon: Video, label: "1080p HD", sub: "Broadcast quality" },
          { icon: Share2, label: "Ready to send", sub: "Share to any platform" },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1.5">
            <Icon className="w-4 h-4 text-primary" />
            <div className="text-sm font-semibold text-foreground">{label}</div>
            <div className="text-xs text-muted-foreground">{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Share section ── */}
      <SocialSharePanel videoUrl={job.videoUrl} title={propertyName} />

      {/* ── Matterport Interactive Tour ── */}
      <MatterportTourSection job={job} />

      {/* ── Script panel ── */}
      {job.steps?.find((s: any) => s.name === "generate_script" && s.status === "complete" && s.outputData) && (
        <ScriptPanel
          script={job.steps.find((s: any) => s.name === "generate_script").outputData}
          jobTitle={job.listingTitle ?? undefined}
          jobId={job.id}
        />
      )}

      {/* ── Send to CRM ── */}
      <div className="flex items-center gap-3 flex-wrap pt-1">
        <SendToCrmButton jobId={job.id} />
      </div>
    </div>
  );
}

// ── Pipeline steps (used both inline and in collapsible) ──────────────────────

function PipelineSteps({ job }: { job: any }) {
  return (
    <div className="divide-y divide-border">
      {(job.steps ?? []).map((step: any, idx: number) => {
        const isLast = idx === (job.steps?.length ?? 0) - 1;
        return (
          <div
            key={step.id}
            className={`flex items-start gap-4 p-5 transition-colors duration-300 ${step.status === "running" ? "bg-blue-500/5" : ""}`}
            data-testid={`step-${step.name}`}
          >
            <div className="flex flex-col items-center shrink-0 pt-0.5">
              <StepIcon status={step.status} name={step.name} />
              {!isLast && (
                <div className={`w-px flex-1 mt-2 min-h-[28px] transition-colors duration-700 ${step.status === "complete" ? "bg-primary/40" : "bg-border"}`} />
              )}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground/50">0{step.order}</span>
                  <span className={`font-medium text-sm ${step.status === "pending" ? "text-muted-foreground" : "text-foreground"}`}>
                    {STEP_LABELS[step.name] ?? step.label}
                  </span>
                </div>
                {step.status !== "pending" && (
                  <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    step.status === "complete" ? "text-primary bg-primary/10 border-primary/20" :
                    step.status === "running" ? "text-blue-400 bg-blue-400/10 border-blue-400/20 animate-pulse" :
                    "text-destructive bg-destructive/10 border-destructive/20"
                  }`}>
                    {step.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {STEP_DESCRIPTIONS[step.name]}
              </p>
              {step.errorMessage && <StepError message={step.errorMessage} />}
              {step.name === "analyse_photos" && step.outputData && step.status === "complete" && (
                <MetadataBlock label="Vision Analysis" data={step.outputData} icon={Camera} />
              )}
              {step.name === "scrape_listing" && step.outputData && step.status === "complete" && (
                <MetadataBlock label="Extracted Data" data={step.outputData} />
              )}
              {step.name === "create_voiceover" && step.outputUrl && step.status === "complete" && (
                <div className="mt-3 p-3 bg-primary/5 border border-primary/15 rounded-lg">
                  <audio controls src={step.outputUrl} className="w-full" style={{ height: "32px" }} />
                </div>
              )}
              {step.name === "presenter_video" && step.outputUrl && step.status === "complete" && (
                <div className="mt-3 p-3 bg-primary/5 border border-primary/15 rounded-lg">
                  <video controls src={step.outputUrl} className="w-full rounded" style={{ maxHeight: "240px" }} />
                </div>
              )}
              {(step.startedAt || step.completedAt) && (
                <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-muted-foreground/60">
                  {step.startedAt && <span>Started: {format(new Date(step.startedAt), "HH:mm:ss")}</span>}
                  {step.completedAt && <span>Done: {format(new Date(step.completedAt), "HH:mm:ss")}</span>}
                  {step.startedAt && step.completedAt && (
                    <span className="text-primary/60">
                      {((new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime()) / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PipelineStepsCard({ job, isSimulating, id }: { job: any; isSimulating: boolean; id: string }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Production stages</span>
        {isSimulating && (
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />Live
          </span>
        )}
      </div>
      <PipelineSteps job={job} />
    </div>
  );
}

function StepError({ message }: { message: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <p className="text-xs text-destructive">Something went wrong at this stage.{" "}
        <button type="button" onClick={() => setOpen(o => !o)} className="underline text-destructive/70 hover:text-destructive">
          {open ? "Hide details" : "Support details"}
        </button>
      </p>
      {open && <p className="text-[10px] text-destructive/60 mt-1 font-mono bg-destructive/5 p-2 rounded border border-destructive/20 break-all">{message}</p>}
    </div>
  );
}

function MetadataBlock({ label, data, icon: Icon }: { label: string; data: string; icon?: any }) {
  return (
    <div className="mt-3 p-3 bg-card border border-border rounded-lg space-y-1.5">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
        {Icon && <Icon className="w-3 h-3" />}{label}
      </div>
      {data.split("\n").filter(Boolean).map((line, i) => (
        <div key={i} className="flex items-start gap-2 text-xs">
          <span className="text-primary mt-0.5">▸</span>
          <span className="text-foreground/80">{line}</span>
        </div>
      ))}
    </div>
  );
}

// ── Social Share Panel ─────────────────────────────────────────────────────────

function SocialSharePanel({ videoUrl, title }: { videoUrl: string; title: string }) {
  const { toast } = useToast();
  const { copied, copy } = useCopyToClipboard(2000);
  const caption = `Just listed! ${title} — watch this professional property video 🏠\n\n#realestate #propertymarketing`;

  function openWithCopy(href: string, platform: string) {
    try { navigator.clipboard.writeText(videoUrl); } catch { /* ok */ }
    toast({ title: "Link copied!", description: `Paste your video link when ${platform} opens.` });
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Share your campaign</p>
        <p className="text-xs text-muted-foreground mt-0.5">Send to your vendor, or post to social media — it's ready to publish.</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <button type="button"
          onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}&quote=${encodeURIComponent(caption)}`, "_blank", "noopener,noreferrer")}
          className="flex flex-col items-center gap-2 py-4 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-85"
          style={{ background: "#1877F2" }}>
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
          Facebook
        </button>
        <button type="button"
          onClick={() => openWithCopy("https://www.tiktok.com/upload", "TikTok")}
          className="flex flex-col items-center gap-2 py-4 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-85"
          style={{ background: "#010101" }}>
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
          TikTok
        </button>
        <button type="button"
          onClick={() => openWithCopy("https://www.instagram.com", "Instagram")}
          className="flex flex-col items-center gap-2 py-4 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-85"
          style={{ background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }}>
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          Instagram
        </button>
      </div>
      <div className="flex gap-2 flex-wrap border-t border-border pt-3">
        <button type="button"
          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${caption}\n\n${videoUrl}`)}`, "_blank", "noopener,noreferrer")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white hover:opacity-85 transition-opacity"
          style={{ background: "#25D366" }}>WhatsApp</button>
        <button type="button"
          onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(videoUrl)}`, "_blank", "noopener,noreferrer")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white hover:opacity-85 transition-opacity"
          style={{ background: "#0A66C2" }}>LinkedIn</button>
        <button type="button"
          onClick={() => copy(videoUrl)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded text-xs font-medium hover:border-primary/40 hover:text-primary text-muted-foreground transition-colors">
          {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy video link"}
        </button>
      </div>
    </div>
  );
}

// ── Helper components ──────────────────────────────────────────────────────────

function DownloadVideoButton({ url, large }: { url: string; large?: boolean }) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Network error");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "lensflow-campaign.mp4";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast({ title: "Download failed", description: "Right-click the video player and choose Save.", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  }, [url, downloading, toast]);

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className={`inline-flex items-center gap-2 font-semibold rounded-xl transition-all disabled:opacity-50 ${
        large
          ? "px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 text-sm shadow-lg shadow-primary/20"
          : "px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 text-xs border border-primary/20"
      }`}
    >
      {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {downloading ? "Downloading…" : "Download video"}
    </button>
  );
}

function ScriptPanel({ script, jobTitle, jobId }: { script: string; jobTitle?: string; jobId: string }) {
  const { copied, copy } = useCopyToClipboard();

  function downloadScript() {
    const blob = new Blob([script], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(jobTitle ?? "listing-script").replace(/[^a-z0-9-_ ]/gi, "").toLowerCase().replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">AI-Generated Script</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/jobs/${jobId}/record`}>
            <button type="button"
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 border border-primary/40 hover:border-primary px-3 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all">
              <Video className="w-3.5 h-3.5" /> Record yourself
            </button>
          </Link>
          <button type="button" onClick={downloadScript}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary border border-border/50 hover:border-primary/40 px-3 py-1.5 rounded-lg transition-all">
            <Download className="w-3.5 h-3.5" /> Download
          </button>
          <button type="button" onClick={() => copy(script)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary border border-border/50 hover:border-primary/40 px-3 py-1.5 rounded-lg transition-all">
            {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap italic">{script}</p>
    </div>
  );
}

function ShareButton({ jobId }: { jobId: string }) {
  const { copied, copy } = useCopyToClipboard();
  const shareUrl = `${window.location.origin}/pipeline/jobs/${jobId}`;
  return (
    <button type="button" onClick={() => copy(shareUrl)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border hover:border-primary/40 hover:text-primary text-muted-foreground rounded text-xs transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Share2 className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}

function SendToCrmButton({ jobId }: { jobId: string }) {
  const { toast } = useToast();
  const sendToCrm = useSendJobToCrm();
  const [sent, setSent] = useState(false);

  function handleSend() {
    sendToCrm.mutate({ id: jobId, data: {} }, {
      onSuccess: (result) => {
        setSent(true);
        toast({ title: "Sent to CRM", description: result.message });
      },
      onError: () => {
        toast({ title: "CRM delivery failed", description: "Please try again.", variant: "destructive" });
      },
    });
  }

  return (
    <button type="button" onClick={handleSend} disabled={sendToCrm.isPending || sent}
      className="inline-flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg text-sm hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-60">
      {sendToCrm.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> :
       sent ? <Check className="w-4 h-4 text-primary" /> : <Send className="w-4 h-4" />}
      {sent ? "Sent to CRM" : "Send to HubSpot"}
    </button>
  );
}

// ── Matterport Interactive Tour Section ───────────────────────────────────────

function MatterportTourSection({ job }: { job: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const setMatterport = useSetJobMatterportUrl();
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  const spaceId = job.matterportUrl
    ? (() => { try { return new URL(job.matterportUrl).searchParams.get("m") ?? ""; } catch { return ""; } })()
    : null;
  const embedUrl = spaceId
    ? `https://my.matterport.com/show/?m=${spaceId}&play=1&qs=1&brand=0`
    : null;

  function handleSave() {
    if (!input.trim()) return;
    setSaving(true);
    setMatterport.mutate(
      { id: job.id, data: { matterportUrl: input.trim() } },
      {
        onSuccess: () => {
          toast({ title: "Interactive tour added!", description: "The 3D tour is now embedded in your campaign." });
          queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(job.id) });
          setInput("");
        },
        onError: (err: any) => {
          toast({
            title: "Couldn't add tour",
            description: err?.response?.data?.error ?? "Check the URL and try again.",
            variant: "destructive",
          });
        },
        onSettled: () => setSaving(false),
      }
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Box className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Interactive 3D Tour</span>
          {embedUrl && (
            <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
              Matterport
            </span>
          )}
        </div>
        {embedUrl && (
          <a
            href={job.matterportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            Open full screen <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {embedUrl ? (
        /* ── Embed ── */
        <div className="space-y-0">
          <div style={{ aspectRatio: "16/9" }} className="relative bg-black">
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              allow="xr-spatial-tracking; gyroscope; accelerometer"
              title="Matterport 3D Tour"
            />
          </div>
          <div className="px-5 py-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground border-t border-border bg-muted/20">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-primary" /> Floor plan accessible inside the tour
            </span>
            <span className="flex items-center gap-1.5">
              <Box className="w-3 h-3 text-primary" /> Walk-through mode available
            </span>
            <button
              type="button"
              onClick={() => setInput(job.matterportUrl ?? "")}
              className="ml-auto text-muted-foreground/60 hover:text-primary transition-colors underline text-[11px]"
            >
              Replace URL
            </button>
          </div>
          {input && (
            <div className="px-5 py-3 border-t border-border flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Paste new Matterport link or Space ID…"
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !input.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── No tour yet — prompt ── */
        <div className="px-5 py-6 space-y-4">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Box className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Add a Matterport 3D tour</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Paste your Matterport share link or Space ID and it will be embedded directly in this campaign — your vendor can walk through the property in 3D before the inspection.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder="https://my.matterport.com/show/?m=… or Space ID"
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !input.trim()}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/10"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Tour"}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground/60">
            Agent captures the walk-through using the Matterport mobile app → copies the share link → pastes here. Floor plan is accessible within the tour.
          </p>
        </div>
      )}
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-1">{label}</div>
      <div className="text-sm text-foreground truncate">{value}</div>
    </div>
  );
}

// ── AI Room Rescue Panel ───────────────────────────────────────────────────────

function RoomRescuePanel({
  jobId,
  originals,
  rescued,
  rescuedCount,
  mode,
  approved,
  isAwaitingApproval,
}: {
  jobId: string;
  originals: string[];
  rescued: string[];
  rescuedCount: number;
  mode: "declutter" | "staging";
  approved: string | null;
  isAwaitingApproval: boolean;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const approveRescue = useApproveRoomRescue();
  const rejectRescue = useRejectRoomRescue();

  function handleApprove() {
    approveRescue.mutate({ id: jobId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(jobId) });
        toast({ title: "Room Rescue approved", description: "Pipeline will continue with transformed photos." });
      },
      onError: () => toast({ title: "Could not approve", variant: "destructive" }),
    });
  }

  function handleReject() {
    rejectRescue.mutate({ id: jobId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(jobId) });
        toast({ title: "Room Rescue rejected", description: "Pipeline will continue with original photos." });
      },
      onError: () => toast({ title: "Could not reject", variant: "destructive" }),
    });
  }

  const isPending = approveRescue.isPending || rejectRescue.isPending;
  const hasDecision = approved === "approved" || approved === "rejected";
  const modeLabel = mode === "staging" ? "Virtually Staged" : "Decluttered";
  const modeDescription = mode === "staging"
    ? "Contemporary furniture and styling have been added to empty rooms."
    : "Clutter, personal items and mess have been removed to show a clean, market-ready space.";

  return (
    <div className={`bg-card border rounded-xl p-5 space-y-4 ${
      isAwaitingApproval && !hasDecision
        ? "border-violet-500/40 ring-1 ring-violet-500/20"
        : "border-border"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-foreground">AI Room Rescue</span>
          <span className="text-[10px] font-mono text-violet-400 bg-violet-400/10 border border-violet-400/20 rounded-full px-2 py-0.5 capitalize">
            {mode}
          </span>
          {rescuedCount > 0 && (
            <span className="text-[10px] font-mono text-violet-400 bg-violet-400/10 border border-violet-400/20 rounded-full px-2 py-0.5">
              {rescuedCount} transformed
            </span>
          )}
          {approved === "approved" && (
            <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
              Approved ✓
            </span>
          )}
          {approved === "rejected" && (
            <span className="text-[10px] font-mono text-muted-foreground bg-muted/30 border border-border rounded-full px-2 py-0.5">
              Rejected — originals used
            </span>
          )}
        </div>

        {/* Approve / Reject buttons — only shown when awaiting */}
        {isAwaitingApproval && !hasDecision && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={isPending}
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive/60"
            >
              {rejectRescue.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <ThumbsDown className="w-3.5 h-3.5 mr-1" />}
              Use originals
            </Button>
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isPending}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {approveRescue.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <ThumbsUp className="w-3.5 h-3.5 mr-1" />}
              Use {mode === "staging" ? "staged" : "decluttered"}
            </Button>
          </div>
        )}
      </div>

      {/* Compliance + instruction notice */}
      {isAwaitingApproval && !hasDecision && (
        <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-lg space-y-2">
          <p className="text-xs text-violet-300/90 leading-relaxed">
            <strong>{modeLabel}.</strong> {modeDescription} Review the before/after below and approve to use these images in your video, or reject to keep the originals.
          </p>
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
            ⚠️ <strong>Compliance:</strong> original photos are preserved separately. Structural defects (mould, cracks, water damage) have not been removed or obscured — the property is represented truthfully.
          </p>
        </div>
      )}

      {/* Compliance label when decided */}
      {hasDecision && (
        <p className="text-[11px] text-muted-foreground/60">
          AI-{mode === "staging" ? "staged" : "decluttered"} images — originals preserved for compliance.
          {approved === "approved" ? " Transformed versions used in this campaign." : " Original photos used in this campaign."}
        </p>
      )}

      {/* Before / after grid */}
      {rescuedCount > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {originals.slice(0, Math.min(rescuedCount, 4)).map((orig, i) => {
            const after = rescued[i];
            return (
              <div key={i} className="grid grid-cols-2 gap-2">
                <figure className="space-y-1">
                  <img
                    src={orig}
                    alt={`Original photo ${i + 1}`}
                    loading="lazy"
                    className="w-full aspect-[4/3] object-cover rounded border border-border"
                  />
                  <figcaption className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70 text-center">Original</figcaption>
                </figure>
                <figure className="space-y-1">
                  {after ? (
                    <img
                      src={after}
                      alt={`${modeLabel} photo ${i + 1}`}
                      loading="lazy"
                      className={`w-full aspect-[4/3] object-cover rounded border ${
                        approved === "approved"
                          ? "border-primary/40 ring-1 ring-primary/20"
                          : "border-violet-400/40 ring-1 ring-violet-400/20"
                      }`}
                    />
                  ) : (
                    <div className="w-full aspect-[4/3] rounded border border-dashed border-border flex items-center justify-center bg-muted/30">
                      <Loader2 className="w-4 h-4 text-muted-foreground/50 animate-spin" />
                    </div>
                  )}
                  <figcaption className="text-[9px] font-mono uppercase tracking-wider text-violet-400 text-center">
                    {modeLabel}
                  </figcaption>
                </figure>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Pro Lens Upgrade Panel ─────────────────────────────────────────────────────

function ProLensUpgradePanel({
  jobId,
  originals,
  upgraded,
  upgradedCount,
  approved,
  isAwaitingApproval,
}: {
  jobId: string;
  originals: string[];
  upgraded: string[];
  upgradedCount: number;
  approved: string | null;
  isAwaitingApproval: boolean;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const approveUpgrade = useApproveProLensUpgrade();
  const rejectUpgrade = useRejectProLensUpgrade();

  function handleApprove() {
    approveUpgrade.mutate({ id: jobId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(jobId) });
        toast({ title: "Upgrade approved", description: "Pipeline will continue with corrected photos." });
      },
      onError: () => toast({ title: "Could not approve", variant: "destructive" }),
    });
  }

  function handleReject() {
    rejectUpgrade.mutate({ id: jobId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(jobId) });
        toast({ title: "Upgrade rejected", description: "Pipeline will continue with original photos." });
      },
      onError: () => toast({ title: "Could not reject", variant: "destructive" }),
    });
  }

  const isPending = approveUpgrade.isPending || rejectUpgrade.isPending;
  const hasDecision = approved === "approved" || approved === "rejected";

  return (
    <div className={`bg-card border rounded-xl p-5 space-y-4 ${
      isAwaitingApproval && !hasDecision
        ? "border-amber-500/40 ring-1 ring-amber-500/20"
        : "border-border"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ZoomIn className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-foreground">Pro Lens Upgrade</span>
          {upgradedCount > 0 && (
            <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5">
              {upgradedCount} corrected
            </span>
          )}
          {approved === "approved" && (
            <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
              Approved ✓
            </span>
          )}
          {approved === "rejected" && (
            <span className="text-[10px] font-mono text-muted-foreground bg-muted/30 border border-border rounded-full px-2 py-0.5">
              Rejected — originals used
            </span>
          )}
        </div>

        {/* Approve / Reject buttons — only shown when awaiting */}
        {isAwaitingApproval && !hasDecision && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={isPending}
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive/60"
            >
              {rejectUpgrade.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <ThumbsDown className="w-3.5 h-3.5 mr-1" />}
              Use originals
            </Button>
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isPending}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {approveUpgrade.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <ThumbsUp className="w-3.5 h-3.5 mr-1" />}
              Use corrected
            </Button>
          </div>
        )}
      </div>

      {/* Instruction copy */}
      {isAwaitingApproval && !hasDecision && (
        <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
          <p className="text-xs text-amber-300/90 leading-relaxed">
            Review the before/after below. Professional corrections have been applied: lens distortion, exposure, colour balance, noise reduction and sharpening. <strong>No creative changes</strong> were made — the property is represented truthfully. Approve to use the corrected photos in your video, or reject to keep the originals.
          </p>
        </div>
      )}

      {/* Before / after grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {originals.slice(0, Math.min(upgradedCount, 4)).map((orig, i) => {
          const after = upgraded[i];
          return (
            <div key={i} className="grid grid-cols-2 gap-2">
              <figure className="space-y-1">
                <img
                  src={orig}
                  alt={`Original photo ${i + 1}`}
                  loading="lazy"
                  className="w-full aspect-[4/3] object-cover rounded border border-border"
                />
                <figcaption className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70 text-center">Original</figcaption>
              </figure>
              <figure className="space-y-1">
                {after ? (
                  <img
                    src={after}
                    alt={`Corrected photo ${i + 1}`}
                    loading="lazy"
                    className={`w-full aspect-[4/3] object-cover rounded border ${
                      approved === "approved"
                        ? "border-primary/40 ring-1 ring-primary/20"
                        : "border-amber-400/40 ring-1 ring-amber-400/20"
                    }`}
                  />
                ) : (
                  <div className="w-full aspect-[4/3] rounded border border-dashed border-border flex items-center justify-center bg-muted/30">
                    <Loader2 className="w-4 h-4 text-muted-foreground/50 animate-spin" />
                  </div>
                )}
                <figcaption className="text-[9px] font-mono uppercase tracking-wider text-amber-400 text-center">Corrected</figcaption>
              </figure>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhotoGlowUp({ originals, enhanced }: { originals: string[]; enhanced: string[] }) {
  const hasEnhanced = enhanced.length > 0;
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Camera className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">AI Photo Glow-up</span>
        {hasEnhanced && (
          <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
            {enhanced.length} enhanced
          </span>
        )}
      </div>
      {!hasEnhanced && (
        <p className="text-xs text-muted-foreground">Enhancing your photos… AI-improved versions will appear here shortly.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {originals.map((orig, i) => {
          const after = enhanced[i];
          return (
            <div key={i} className="grid grid-cols-2 gap-2">
              <figure className="space-y-1">
                <img src={orig} alt={`Original photo ${i + 1}`} loading="lazy"
                  className="w-full aspect-[4/3] object-cover rounded border border-border" />
                <figcaption className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70 text-center">Before</figcaption>
              </figure>
              <figure className="space-y-1">
                {after ? (
                  <img src={after} alt={`Enhanced photo ${i + 1}`} loading="lazy"
                    className="w-full aspect-[4/3] object-cover rounded border border-primary/30 ring-1 ring-primary/20" />
                ) : (
                  <div className="w-full aspect-[4/3] rounded border border-dashed border-border flex items-center justify-center bg-muted/30">
                    <Loader2 className="w-4 h-4 text-muted-foreground/50 animate-spin" />
                  </div>
                )}
                <figcaption className="text-[9px] font-mono uppercase tracking-wider text-primary text-center">After</figcaption>
              </figure>
            </div>
          );
        })}
      </div>
    </div>
  );
}
