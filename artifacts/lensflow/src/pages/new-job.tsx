import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreateJob, useSimulateJob, useListElevenLabsVoices, useGenerateScript, useCreateSelfRecordedJob, getGetJobStatsQueryKey, getListJobsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link2, ArrowRight, Mic, Loader2, Play, ChevronDown, CheckCircle2, ImagePlus, X, Upload, Camera, Music2, Film, Video, Square, User, Bot, Layers, Wand2, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect, useCallback } from "react";
import { useUpload } from "@workspace/object-storage-web";

const PRESENTER_PRESETS = [
  {
    id: "mia",
    name: "Mia",
    specialty: "Waterfront · Lifestyle",
    voiceId: "x3PfG9wL6FOEApZ1VJ9H",
    voiceName: "mia",
    photo: "/presenters/mia-poster.jpg",
  },
  {
    id: "oliver",
    name: "Oliver",
    specialty: "Inner-City · Investment",
    voiceId: "jfIS2w2yJi0grJZPyEsk",
    voiceName: "oliver",
    photo: "/presenters/oliver-poster.jpg",
  },
  {
    id: "sophie",
    name: "Sophie",
    specialty: "Family · Suburban",
    voiceId: "69h9o7wh5u0isWHzdogD",
    voiceName: "sophie",
    photo: "/presenters/sophie-poster.jpg",
  },
  {
    id: "james",
    name: "James",
    specialty: "Prestige · Coastal · Inner-City",
    voiceId: "yXFr3XVHzrViCIHi1yoc",
    voiceName: "james",
    photo: "/presenters/james-poster.jpg",
  },
];

const PRESENTER_VOICE_NEUTRAL: Record<string, string> = {
  "x3PfG9wL6FOEApZ1VJ9H": "Female — Warm",
  "jfIS2w2yJi0grJZPyEsk": "Male — Confident",
  "69h9o7wh5u0isWHzdogD": "Female — Energetic",
  "yXFr3XVHzrViCIHi1yoc": "Male — Authoritative",
  "g5fH9S068t9I3i8Y9u4": "Female — Friendly",
};

const MUSIC_PRESETS = [
  { id: "uplifting", label: "Uplifting", emoji: "✨", desc: "Bright & positive — lifestyle properties" },
  { id: "cinematic", label: "Cinematic", emoji: "🎬", desc: "Epic & dramatic — premium listings" },
  { id: "calm",      label: "Calm",      emoji: "🌿", desc: "Soft & ambient — family homes" },
  { id: "corporate", label: "Corporate", emoji: "💼", desc: "Clean & professional — investment" },
  { id: "luxury",   label: "Luxury",    emoji: "💎", desc: "Sophisticated & sleek — prestige listings" },
  { id: "summer",   label: "Summer",    emoji: "🌊", desc: "Coastal & breezy — beach properties" },
  { id: "country",  label: "Country",   emoji: "🌾", desc: "Warm & rustic — acreage & rural" },
  { id: "urban",    label: "Urban",     emoji: "🏙️", desc: "Modern & edgy — inner-city apartments" },
] as const;

const BACKGROUND_PRESETS = [
  {
    id: "studio",
    label: "Studio Dark",
    emoji: "🎙️",
    desc: "Clean dark studio",
    url: null,
    preview: "bg-gradient-to-br from-slate-900 to-slate-800",
  },
  {
    id: "reel-1",
    label: "LensFlow Reel A",
    emoji: "🎬",
    desc: "Branded property reel",
    url: "/backgrounds/bg-reel-1.mp4",
    preview: null,
    isVideo: true,
  },
  {
    id: "reel-2",
    label: "LensFlow Reel B",
    emoji: "🏠",
    desc: "Cinematic property reel",
    url: "/backgrounds/bg-reel-2.mp4",
    preview: null,
    isVideo: true,
  },
  {
    id: "city",
    label: "City Skyline",
    emoji: "🌆",
    desc: "Modern city backdrop",
    url: "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&q=80&w=1920&h=1080",
    preview: null,
  },
  {
    id: "coastal",
    label: "Coastal",
    emoji: "🌊",
    desc: "Sun & sea lifestyle",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1920&h=1080",
    preview: null,
  },
  {
    id: "interior",
    label: "Luxury Interior",
    emoji: "🛋️",
    desc: "Premium home interior",
    url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1920&h=1080",
    preview: null,
  },
];

const PLATFORM_LABELS: Record<string, string> = {
  "realestate.com.au": "REA",
  "domain.com.au": "Domain",
  "onthehouse.com.au": "OnTheHouse",
  "allhomes.com.au": "AllHomes",
  "raywhite.com": "Ray White",
  "ljhooker.com": "LJ Hooker",
  "harcourts.com.au": "Harcourts",
  "mcgrath.com.au": "McGrath",
  "barryproperty.com.au": "Barry Plant",
};

function detectPlatform(url: string): { label: string; domain: string } | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace("www.", "");
    for (const [domain, label] of Object.entries(PLATFORM_LABELS)) {
      if (host === domain || host.endsWith("." + domain)) {
        return { label, domain };
      }
    }
    if (host) return { label: host, domain: host };
  } catch {
    // not yet a valid URL
  }
  return null;
}

const formSchema = z
  .object({
    inputMode: z.enum(["url", "photos"]),
    listingUrl: z.string().optional(),
    propertyAddress: z.string().optional(),
    voiceId: z.string().optional(),
    voiceName: z.string().optional(),
    musicTrack: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.inputMode === "url") {
      const url = val.listingUrl?.trim() ?? "";
      let valid = false;
      try {
        const u = new URL(url);
        valid = u.protocol === "http:" || u.protocol === "https:";
      } catch {
        valid = false;
      }
      if (!valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid URL",
          path: ["listingUrl"],
        });
      }
    }
  });

interface UploadedPhoto {
  publicUrl: string;   // empty string while uploading
  previewSrc: string;
  name: string;
  uploading?: boolean;
  failed?: boolean;
}

export default function NewJob() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createJob = useCreateJob();
  const simulateJob = useSimulateJob();
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dragPhotoIndex = useRef<number | null>(null);

  // Presenter look picker
  const [selectedLookId, setSelectedLookId] = useState<string | null>(null);
  const [presenterLooks, setPresenterLooks] = useState<Array<{ id: string; name: string; previewImageUrl?: string }>>([]);
  const [looksLoading, setLooksLoading] = useState(false);

  const fetchPresenterLooks = async (presenterName: string) => {
    setLooksLoading(true);
    setSelectedLookId(null);
    setPresenterLooks([]);
    try {
      const res = await fetch(`/api/heygen/presenter-looks?presenter=${encodeURIComponent(presenterName)}`);
      if (res.ok) {
        const data = await res.json() as Array<{ id: string; name: string; previewImageUrl?: string }>;
        setPresenterLooks(Array.isArray(data) ? data : []);
      }
    } catch {
      setPresenterLooks([]);
    } finally {
      setLooksLoading(false);
    }
  };

  // Property photo uploads
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [enhancePhotos, setEnhancePhotos] = useState(true);
  const [roomRescue, setRoomRescue] = useState(false);
  const [roomRescueMode, setRoomRescueMode] = useState<"declutter" | "staging">("declutter");
  const [outputType, setOutputType] = useState<"presenter" | "voice_photos" | "film_myself">("presenter");
  const [selectedBackground, setSelectedBackground] = useState<string>("studio");
  const [filmStep, setFilmStep] = useState<"configure" | "script-ready" | "recording" | "uploading">("configure");
  const [filmScript, setFilmScript] = useState<string>("");
  const [filmWebcamStream, setFilmWebcamStream] = useState<MediaStream | null>(null);
  const [_filmRecordedBlob, setFilmRecordedBlob] = useState<Blob | null>(null);
  const filmVideoRef = useRef<HTMLVideoElement>(null);
  const filmMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const filmChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile } = useUpload({
    onError: (err) => {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    },
  });

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length === 0) return;

      // Add all photos immediately with local blob previews so they appear right away.
      // publicUrl is empty until the upload completes.
      const pending: UploadedPhoto[] = imageFiles.map((file) => ({
        publicUrl: "",
        previewSrc: URL.createObjectURL(file),
        name: file.name,
        uploading: true,
      }));
      setUploadedPhotos((prev) => [...prev, ...pending]);
      setUploadingCount((n) => n + imageFiles.length);

      await Promise.all(
        imageFiles.map(async (file, idx) => {
          const preview = pending[idx].previewSrc;
          const result = await uploadFile(file);
          if (result) {
            // Swap out the pending entry with the completed one
            setUploadedPhotos((prev) =>
              prev.map((p) =>
                p.previewSrc === preview
                  ? { publicUrl: result.publicUrl, previewSrc: preview, name: file.name }
                  : p
              )
            );
          } else {
            // Mark failed so the user can see which ones didn't make it
            setUploadedPhotos((prev) =>
              prev.map((p) =>
                p.previewSrc === preview ? { ...p, uploading: false, failed: true } : p
              )
            );
          }
          setUploadingCount((n) => n - 1);
        })
      );
    },
    [uploadFile]
  );

  const { data: voices = [], isLoading: voicesLoading } = useListElevenLabsVoices();
  const generateScriptMutation = useGenerateScript();
  const createSelfRecordedJob = useCreateSelfRecordedJob();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema as any),
    defaultValues: { inputMode: "url", listingUrl: "", propertyAddress: "", voiceId: "", voiceName: "", musicTrack: "" },
  });

  const selectedVoiceName = form.watch("voiceName");
  const selectedVoiceId = form.watch("voiceId");
  const selectedMusicTrack = form.watch("musicTrack");
  const watchedUrl = form.watch("listingUrl");
  const inputMode = form.watch("inputMode");
  const detectedPlatform = detectPlatform(watchedUrl ?? "");

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setVoiceOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Webcam helpers for Film Myself path
  async function startFilmWebcam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true });
      setFilmWebcamStream(stream);
      if (filmVideoRef.current) filmVideoRef.current.srcObject = stream;
    } catch (err: any) {
      toast({ title: "Camera Error", description: err.message ?? "Could not access camera", variant: "destructive" });
    }
  }

  function startFilmRecording() {
    if (!filmWebcamStream) return;
    filmChunksRef.current = [];
    const recorder = new MediaRecorder(filmWebcamStream, { mimeType: "video/webm" });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) filmChunksRef.current.push(e.data); };
    recorder.onstop = async () => {
      const blob = new Blob(filmChunksRef.current, { type: "video/webm" });
      setFilmRecordedBlob(blob);
      filmWebcamStream.getTracks().forEach((t) => t.stop());
      setFilmWebcamStream(null);
      setFilmStep("uploading");
      const file = new File([blob], `recording-${Date.now()}.webm`, { type: "video/webm" });
      const result = await uploadFile(file);
      if (!result) {
        toast({ title: "Upload Failed", description: "Could not upload your recording.", variant: "destructive" });
        setFilmStep("script-ready");
        return;
      }
      const bg = BACKGROUND_PRESETS.find((b) => b.id === selectedBackground);
      createSelfRecordedJob.mutate(
        {
          data: {
            videoUrl: result.publicUrl,
            script: filmScript,
            musicTrack: form.getValues("musicTrack") || undefined,
            backgroundImageUrl: bg?.url ?? undefined,
          },
        },
        {
          onSuccess: (job) => {
            queryClient.invalidateQueries({ queryKey: getGetJobStatsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
            toast({ title: "Video Submitted!", description: "Your self-recorded video is being composed." });
            setLocation(`/jobs/${job.id}`);
          },
          onError: () => {
            toast({ title: "Submission Failed", description: "Could not save your recording.", variant: "destructive" });
            setFilmStep("script-ready");
          },
        }
      );
    };
    filmMediaRecorderRef.current = recorder;
    recorder.start();
    setFilmStep("recording");
  }

  function stopFilmRecording() {
    filmMediaRecorderRef.current?.stop();
  }

  function playPreview(url: string, e: React.MouseEvent) {
    e.stopPropagation();
    setPreviewSrc(url);
    setTimeout(() => audioRef.current?.play(), 50);
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    const readyPhotos = uploadedPhotos.filter((p) => !p.uploading && !p.failed && p.publicUrl);
    if (values.inputMode === "photos" && readyPhotos.length === 0) {
      toast({
        title: "Add Photos",
        description: "Upload at least one property photo to generate a video from photos.",
        variant: "destructive",
      });
      return;
    }

    // Film Myself path — generate script then enter recording flow
    if (outputType === "film_myself") {
      generateScriptMutation.mutate(
        {
          data: {
            listingUrl: values.inputMode === "url" ? values.listingUrl : undefined,
            propertyAddress: values.propertyAddress?.trim() || undefined,
          },
        },
        {
          onSuccess: (result) => {
            setFilmScript((result as any).script ?? "");
            setFilmStep("script-ready");
            setTimeout(() => startFilmWebcam(), 300);
          },
          onError: () => {
            toast({ title: "Script Failed", description: "Could not generate your script. Try again.", variant: "destructive" });
          },
        }
      );
      return;
    }

    // AI Presenter / Voice+Photos pipeline paths
    createJob.mutate(
      {
        data: {
          inputMode: values.inputMode,
          listingUrl: values.inputMode === "url" ? values.listingUrl : undefined,
          propertyAddress: values.propertyAddress?.trim() || undefined,
          voiceId: values.voiceId || undefined,
          voiceName: values.voiceName || undefined,
          propertyImages: readyPhotos.map((p) => p.publicUrl),
          musicTrack: values.musicTrack || undefined,
          enhancePhotos: enhancePhotos ? true : undefined,
          roomRescue: roomRescue ? true : undefined,
          roomRescueMode: roomRescue ? roomRescueMode : undefined,
          outputType: outputType as "presenter" | "voice_photos",
          lookId: selectedLookId ?? undefined,
        },
      },
      {
        onSuccess: (job) => {
          queryClient.invalidateQueries({ queryKey: getGetJobStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
          simulateJob.mutate({ id: job.id }, {
            onSuccess: () => {
              toast({ title: "Pipeline Running", description: "All 5 stages are now processing automatically." });
            },
            onError: () => {
              toast({
                title: "Pipeline Didn't Start",
                description: "Your listing was saved but processing failed to start. Open the job and click Run Pipeline.",
                variant: "destructive",
              });
            },
          });
          setLocation(`/jobs/${job.id}`);
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? err?.message ?? "";
          if (msg.includes("Insufficient credits")) {
            toast({ title: "Not enough credits", description: "Top up your balance to generate this campaign.", variant: "destructive" });
          } else {
            toast({ title: "Submission Failed", description: "Could not start the pipeline. Please try again.", variant: "destructive" });
          }
        },
      }
    );
  }

  // Group voices: cloned first, then premade
  const clonedVoices = voices.filter((v) => v.category === "cloned");
  const otherVoices = voices.filter((v) => v.category !== "cloned");

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Build Your Video</h1>
        <p className="text-muted-foreground">Choose your video style, add voice and music, then generate a professional property video in one click.</p>
      </div>

      <div className="bg-card border border-border p-6 rounded-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Input mode toggle */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground">Source</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-background border border-border rounded-lg">
                <button
                  type="button"
                  onClick={() => form.setValue("inputMode", "url")}
                  className={`flex items-center justify-center gap-2 h-10 rounded-md text-sm font-mono transition-all ${
                    inputMode === "url"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Link2 className="w-4 h-4" />
                  Listing URL
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue("inputMode", "photos")}
                  className={`flex items-center justify-center gap-2 h-10 rounded-md text-sm font-mono transition-all ${
                    inputMode === "photos"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ImagePlus className="w-4 h-4" />
                  Property Photos
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                {inputMode === "url"
                  ? "Paste a listing link — we'll scrape the details automatically."
                  : "Upload 5–10 photos — Claude Vision analyses them to write your script."}
              </p>
            </div>

            {/* Property Address (photo mode) */}
            {inputMode === "photos" && (
              <FormField
                control={form.control}
                name="propertyAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
                      Property Address <span className="normal-case tracking-normal text-muted-foreground/50">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="12 Ocean View Rd, Mosman NSW 2088"
                        className="h-12 bg-background border-border text-sm"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Listing URL */}
            {inputMode === "url" && (
            <FormField
              control={form.control}
              name="listingUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider font-mono text-muted-foreground">Target URL</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="https://realestate.com.au/property/..."
                        className="pl-10 h-12 bg-background border-border font-mono text-sm"
                        {...field}
                      />
                      {detectedPlatform && (
                        <div className="absolute right-3 top-0 bottom-0 flex items-center pointer-events-none">
                          <span className="flex items-center gap-1.5 text-[10px] font-mono text-primary border border-primary/30 bg-primary/5 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" />
                            {detectedPlatform.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        form.setValue("listingUrl", "https://www.realestate.com.au/property/4-bed-house-in-mosman-nsw-2088-145832674");
                        form.trigger("listingUrl");
                      }}
                      className="text-[10px] font-mono text-primary border border-primary/30 bg-primary/5 px-2 py-0.5 rounded hover:bg-primary/10 transition-colors"
                    >
                      ✦ Try sample listing
                    </button>
                    <span className="text-muted-foreground/30 text-[10px]">or quick-fill:</span>
                    {["realestate.com.au", "domain.com.au", "allhomes.com.au"].map((site) => (
                      <button
                        key={site}
                        type="button"
                        onClick={() => form.setValue("listingUrl", `https://${site}/property/`)}
                        className="text-[10px] font-mono text-muted-foreground border border-border/50 px-2 py-0.5 rounded hover:border-primary/50 hover:text-primary transition-colors"
                      >
                        {site}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            )}

            {/* ── VIDEO STYLE ─────────────────────────────────────── */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" />
                Choose Your Video Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: "presenter", icon: Bot, title: "AI Presenter", desc: "HeyGen avatar presents your listing" },
                  { id: "film_myself", icon: User, title: "Film Myself", desc: "Record yourself with a virtual background" },
                  { id: "voice_photos", icon: Film, title: "Voice + Photos", desc: "AI narration over a photo slideshow" },
                ] as const).map(({ id, icon: Icon, title, desc }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { setOutputType(id); setFilmStep("configure"); }}
                    className={`flex flex-col items-start gap-2 p-4 rounded-lg border text-left transition-all ${
                      outputType === id
                        ? "border-primary bg-primary/5 text-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]"
                        : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${outputType === id ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <div className="text-[11px] font-mono font-semibold uppercase tracking-wider leading-none mb-1">{title}</div>
                      <div className="text-[10px] leading-tight opacity-70">{desc}</div>
                    </div>
                    {outputType === id && (
                      <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── ADD-ON: AI PRESENTER choice ─────────────────────── */}
            {outputType === "presenter" && (
              <div className="space-y-2 pl-3 border-l-2 border-primary/30">
                <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground flex items-center gap-2">
                  <Bot className="w-3.5 h-3.5" />
                  Choose Presenter
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESENTER_PRESETS.map((p) => {
                    const isSelected = selectedVoiceId === p.voiceId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          form.setValue("voiceId", p.voiceId);
                          form.setValue("voiceName", p.voiceName);
                          fetchPresenterLooks(p.id);
                        }}
                        className={`relative rounded-lg overflow-hidden aspect-[3/4] group border-2 transition-all ${
                          isSelected ? "border-primary shadow-[0_0_12px_rgba(var(--primary),0.4)]" : "border-border hover:border-primary/40"
                        }`}
                      >
                        <img src={p.photo} alt={p.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="text-xs font-semibold">{p.name}</div>
                          <div className="text-[9px] text-primary font-mono leading-tight mt-0.5">{p.specialty}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* ── Outfit / look picker (shown while loading or when presenter has >1 looks) ── */}
                {(looksLoading || presenterLooks.length > 1) && (
                  <div className="mt-3 space-y-2">
                    <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5" />
                      Choose Outfit
                      {looksLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {looksLoading && presenterLooks.length === 0 && (
                        [1,2,3,4].map(n => (
                          <div key={n} className="rounded-lg border-2 border-border bg-muted animate-pulse flex-shrink-0" style={{ width: "72px", aspectRatio: "3/4" }} />
                        ))
                      )}
                      {presenterLooks.map((look, i) => {
                        const isSelected = selectedLookId === look.id || (selectedLookId === null && i === 0);
                        return (
                          <button
                            key={look.id}
                            type="button"
                            onClick={() => setSelectedLookId(i === 0 ? null : look.id)}
                            className={`relative rounded-lg overflow-hidden border-2 transition-all group flex-shrink-0 ${
                              isSelected
                                ? "border-primary shadow-[0_0_10px_rgba(var(--primary),0.35)]"
                                : "border-border hover:border-primary/40"
                            }`}
                            style={{ width: "72px" }}
                          >
                            {look.previewImageUrl ? (
                              <img
                                src={look.previewImageUrl}
                                alt={look.name}
                                className="w-full aspect-[3/4] object-cover object-top"
                              />
                            ) : (
                              <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center">
                                <User className="w-5 h-5 text-muted-foreground/40" />
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm px-1 py-0.5">
                              <div className="text-[8px] font-mono font-semibold truncate text-center leading-tight">
                                {look.name}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ADD-ON: FILM MYSELF background picker ───────────── */}
            {outputType === "film_myself" && filmStep === "configure" && (
              <div className="space-y-2 pl-3 border-l-2 border-primary/30">
                <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground flex items-center gap-2">
                  <Video className="w-3.5 h-3.5" />
                  Virtual Background
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {BACKGROUND_PRESETS.map((bg) => {
                    const isSelected = selectedBackground === bg.id;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => setSelectedBackground(bg.id)}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all group ${
                          isSelected ? "border-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]" : "border-border hover:border-primary/40"
                        }`}
                      >
                        {bg.url && !bg.url.endsWith(".mp4") ? (
                          <img src={bg.url} alt={bg.label} className="w-full aspect-video object-cover" />
                        ) : bg.url?.endsWith(".mp4") ? (
                          <div className="w-full aspect-video bg-slate-900 flex items-center justify-center">
                            <Video className="w-6 h-6 text-primary/60" />
                          </div>
                        ) : (
                          <div className={`w-full aspect-video ${bg.preview ?? "bg-slate-900"}`} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <CheckCircle2 className="w-2.5 h-2.5 text-primary-foreground" />
                          </div>
                        )}
                        {bg.isVideo && (
                          <div className="absolute top-1.5 left-1.5">
                            <span className="text-[8px] font-mono uppercase tracking-wider bg-primary/80 text-primary-foreground px-1 py-0.5 rounded">VIDEO</span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-1.5">
                          <div className="text-[10px] font-mono font-semibold text-white leading-none">{bg.emoji} {bg.label}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {BACKGROUND_PRESETS.find(b => b.id === selectedBackground)?.isVideo
                    ? "✓ Animated video background — Shotstack will composite your recording over this clip"
                    : selectedBackground === "studio"
                    ? "✓ Clean studio look — your recording will appear on a dark backdrop"
                    : "✓ Image background — your recording will be placed over this scene"}
                </p>
              </div>
            )}

            {/* ── ADD-ON: VOICE ──────────────────────────────────────── */}
            {outputType !== "film_myself" && (
              <div className="space-y-2 pl-3 border-l-2 border-border">
                <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5" />
                  {outputType === "presenter" ? "Voice" : "Add Voice"}
                  {outputType !== "presenter" && <span className="text-[9px] text-muted-foreground/50 normal-case tracking-normal font-sans">(optional)</span>}
                  {voicesLoading && outputType !== "presenter" && <Loader2 className="w-3 h-3 animate-spin" />}
                </label>

                {/* Presenter mode: voice is locked to the selected presenter */}
                {outputType === "presenter" ? (
                  <div className="h-11 flex items-center gap-3 px-4 bg-background border border-primary/30 rounded-md">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="font-mono text-sm text-foreground">
                      {PRESENTER_PRESETS.find(p => p.voiceId === selectedVoiceId)?.name
                        ? `${PRESENTER_PRESETS.find(p => p.voiceId === selectedVoiceId)!.name}'s voice — auto-selected`
                        : "Select a presenter above to lock voice"}
                    </span>
                  </div>
                ) : (
                  /* Voice+Photos mode: open voice picker */
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setVoiceOpen((o) => !o)}
                      className="w-full h-11 flex items-center justify-between px-4 bg-background border border-border rounded-md font-mono text-sm hover:border-primary/50 transition-colors"
                    >
                      <span className={selectedVoiceName ? "text-foreground" : "text-muted-foreground"}>
                        {selectedVoiceId && PRESENTER_VOICE_NEUTRAL[selectedVoiceId]
                          ? PRESENTER_VOICE_NEUTRAL[selectedVoiceId]
                          : selectedVoiceName || (voicesLoading ? "Loading voices…" : "Select a narration voice")}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${voiceOpen ? "rotate-180" : ""}`} />
                    </button>
                    {voiceOpen && (
                      <div className="absolute z-50 top-full mt-1 w-full max-h-72 overflow-y-auto bg-card border border-border rounded-md shadow-xl">
                        <button
                          type="button"
                          onClick={() => { form.setValue("voiceId", ""); form.setValue("voiceName", ""); setVoiceOpen(false); }}
                          className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border"
                        >
                          <span className="text-sm text-muted-foreground font-mono">— No voice (simulation only)</span>
                        </button>
                        {clonedVoices.length > 0 && (
                          <>
                            <div className="px-4 py-2 text-[10px] uppercase tracking-widest font-mono text-primary/70 bg-primary/5">Your Cloned Voices</div>
                            {clonedVoices.map((v) => (
                              <VoiceOption key={v.voice_id} voice={v} selected={selectedVoiceId === v.voice_id}
                                displayName={PRESENTER_VOICE_NEUTRAL[v.voice_id]}
                                onSelect={() => { form.setValue("voiceId", v.voice_id); form.setValue("voiceName", PRESENTER_VOICE_NEUTRAL[v.voice_id] ?? v.name); setVoiceOpen(false); }}
                                onPreview={v.preview_url ? (e) => playPreview(v.preview_url!, e) : undefined} />
                            ))}
                          </>
                        )}
                        {otherVoices.length > 0 && (
                          <>
                            <div className="px-4 py-2 text-[10px] uppercase tracking-widest font-mono text-muted-foreground bg-muted/30">Narration Voices</div>
                            {otherVoices.map((v) => (
                              <VoiceOption key={v.voice_id} voice={v} selected={selectedVoiceId === v.voice_id}
                                displayName={PRESENTER_VOICE_NEUTRAL[v.voice_id]}
                                onSelect={() => { form.setValue("voiceId", v.voice_id); form.setValue("voiceName", PRESENTER_VOICE_NEUTRAL[v.voice_id] ?? v.name); setVoiceOpen(false); }}
                                onPreview={v.preview_url ? (e) => playPreview(v.preview_url!, e) : undefined} />
                            ))}
                          </>
                        )}
                        {!voicesLoading && voices.length === 0 && (
                          <div className="px-4 py-6 text-center text-sm text-muted-foreground font-mono">No voices found in your ElevenLabs account.</div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {selectedVoiceId
                  ? <p className="text-[11px] text-primary font-mono">✓ ElevenLabs TTS active — live voiceover generation</p>
                  : <p className="text-[11px] text-muted-foreground font-mono">No voice selected — voiceover step will be simulated</p>
                }
              </div>
            )}

            {/* ── ADD-ON: MUSIC ────────────────────────────────────── */}
            <div className="space-y-2 pl-3 border-l-2 border-border">
              <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground flex items-center gap-2">
                <Music2 className="w-3.5 h-3.5" />
                Add Music
                <span className="text-[9px] text-muted-foreground/50 normal-case tracking-normal font-sans">(optional)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MUSIC_PRESETS.map((m) => {
                  const selected = selectedMusicTrack === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => form.setValue("musicTrack", selected ? "" : m.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <span className="text-lg leading-none">{m.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className={`text-[11px] font-mono font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`}>{m.label}</div>
                        <div className="text-[9px] text-muted-foreground/60 leading-tight mt-0.5 truncate">{m.desc}</div>
                      </div>
                      {selected && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {selectedMusicTrack && (
                <button type="button" onClick={() => form.setValue("musicTrack", "")}
                  className="text-[11px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                  × No music
                </button>
              )}
              {selectedMusicTrack
                ? <p className="text-[11px] text-primary font-mono">✓ {MUSIC_PRESETS.find(m => m.id === selectedMusicTrack)?.label} track will be mixed into the final video</p>
                : <p className="text-[11px] text-muted-foreground font-mono">No music — voiceover or ambient audio only</p>
              }
            </div>

            {/* Property Photos Upload */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground flex items-center gap-2">
                <ImagePlus className="w-3.5 h-3.5" />
                Property Photos
                <span className="text-[9px] text-muted-foreground/50 normal-case tracking-normal font-sans">
                  {inputMode === "photos" ? "(required — analysed by Claude Vision)" : "(optional — used as background slideshow)"}
                </span>
              </label>

              {/* Mobile camera capture */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="sm:hidden w-full h-11 flex items-center justify-center gap-2 mb-1 bg-background border border-border rounded-md font-mono text-sm hover:border-primary/50 transition-colors"
              >
                <Camera className="w-4 h-4" />
                Take a Photo
              </button>

              {/* Drop zone */}
              <div
                className={`relative border-2 border-dashed rounded-lg transition-all cursor-pointer ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border/60 hover:border-primary/40 hover:bg-muted/30"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFiles(e.dataTransfer.files);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />

                {uploadedPhotos.length === 0 && uploadingCount === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                    <Upload className="w-7 h-7 opacity-40" />
                    <span className="text-sm font-mono">Drop photos here or click to browse</span>
                    <span className="text-[10px] opacity-60">JPG, PNG, WEBP · Up to 10 photos</span>
                  </div>
                ) : (
                  <div className="p-3 grid grid-cols-5 gap-2">
                    {uploadedPhotos.map((photo, i) => (
                      <div
                        key={photo.previewSrc}
                        draggable={!photo.uploading && !photo.failed}
                        onDragStart={() => { dragPhotoIndex.current = i; }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          const src = dragPhotoIndex.current;
                          if (src === null || src === i) return;
                          setUploadedPhotos((prev) => {
                            const next = [...prev];
                            const [moved] = next.splice(src, 1);
                            next.splice(i, 0, moved);
                            return next;
                          });
                          dragPhotoIndex.current = i;
                        }}
                        onDragEnd={() => { dragPhotoIndex.current = null; }}
                        className="relative aspect-square rounded overflow-hidden group cursor-grab active:cursor-grabbing"
                      >
                        <img
                          src={photo.previewSrc}
                          alt={photo.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Position badge */}
                        {!photo.uploading && !photo.failed && (
                          <div className={`absolute top-1 left-1 rounded px-1 py-0.5 text-[9px] font-bold font-mono leading-none ${
                            i === 0 ? "bg-primary text-primary-foreground" : "bg-black/60 text-white"
                          }`}>
                            {i === 0 ? "LEAD" : `#${i + 1}`}
                          </div>
                        )}
                        {/* Uploading spinner overlay */}
                        {photo.uploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                          </div>
                        )}
                        {/* Failed overlay */}
                        {photo.failed && (
                          <div className="absolute inset-0 bg-destructive/70 flex flex-col items-center justify-center gap-1">
                            <X className="w-4 h-4 text-white" />
                            <span className="text-[8px] text-white font-mono">failed</span>
                          </div>
                        )}
                        {/* Hover remove */}
                        {!photo.uploading && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadedPhotos((prev) => prev.filter((_, j) => j !== i));
                                URL.revokeObjectURL(photo.previewSrc);
                              }}
                              className="w-6 h-6 rounded-full bg-destructive flex items-center justify-center"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        )}
                        {/* Ready indicator */}
                        {!photo.uploading && !photo.failed && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                      </div>
                    ))}
                    {(uploadedPhotos.length + uploadingCount) < 10 && (
                      <div className="aspect-square rounded border-2 border-dashed border-border/40 flex items-center justify-center text-muted-foreground/40 hover:border-primary/40 hover:text-primary/40 transition-colors">
                        <ImagePlus className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {uploadedPhotos.length > 0 && (() => {
                const ready = uploadedPhotos.filter((p) => !p.uploading && !p.failed && p.publicUrl).length;
                const failed = uploadedPhotos.filter((p) => p.failed).length;
                return (
                  <>
                    {ready > 0 && (
                      <p className="text-[11px] text-primary font-mono">
                        ✓ {ready} photo{ready !== 1 ? "s" : ""} ready — will be composed as a slideshow background
                      </p>
                    )}
                    {failed > 0 && (
                      <p className="text-[11px] text-destructive font-mono">
                        ✗ {failed} photo{failed !== 1 ? "s" : ""} failed to upload — hover to remove and retry
                      </p>
                    )}
                  </>
                );
              })()}

              {/* AI Photo Enhancement toggle — available for both URL and photo modes */}
              {(
                <button
                  type="button"
                  onClick={() => setEnhancePhotos((v) => !v)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                    enhancePhotos
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <span className="text-xl leading-none">✨</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-mono font-medium ${enhancePhotos ? "text-foreground" : "text-muted-foreground"}`}>
                      AI Photo Enhancement
                    </div>
                    <div className="text-[10px] text-muted-foreground/60 leading-tight mt-0.5">
                      Gemini relights, colour-balances &amp; declutters each photo for a premium look
                    </div>
                  </div>
                  <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${enhancePhotos ? "bg-primary" : "bg-muted"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${enhancePhotos ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                </button>
              )}

              {/* AI Room Rescue toggle */}
              <button
                type="button"
                onClick={() => setRoomRescue((v) => !v)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                  roomRescue
                    ? "border-violet-500/50 bg-violet-500/5"
                    : "border-border hover:border-violet-500/30"
                }`}
              >
                <Wand2 className={`w-5 h-5 shrink-0 ${roomRescue ? "text-violet-400" : "text-muted-foreground/50"}`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-mono font-medium ${roomRescue ? "text-foreground" : "text-muted-foreground"}`}>
                    AI Room Rescue
                  </div>
                  <div className="text-[10px] text-muted-foreground/60 leading-tight mt-0.5">
                    Declutter messy rooms or virtually stage empty ones — requires your approval before use
                  </div>
                </div>
                <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${roomRescue ? "bg-violet-600" : "bg-muted"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${roomRescue ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </button>

              {/* Mode picker — shown when Room Rescue is enabled */}
              {roomRescue && (
                <div className="flex gap-2 pl-1">
                  {([
                    { id: "declutter" as const, label: "Declutter", desc: "Remove clutter, tidy the space" },
                    { id: "staging" as const, label: "Virtual Staging", desc: "Add furniture to empty rooms" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRoomRescueMode(opt.id)}
                      className={`flex-1 px-3 py-2 rounded-lg border text-left transition-all ${
                        roomRescueMode === opt.id
                          ? "border-violet-500/50 bg-violet-500/8"
                          : "border-border hover:border-violet-500/30"
                      }`}
                    >
                      <div className={`text-xs font-mono font-medium ${roomRescueMode === opt.id ? "text-violet-300" : "text-muted-foreground"}`}>
                        {opt.label}
                      </div>
                      <div className="text-[9px] text-muted-foreground/50 leading-tight mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              )}

              {roomRescue && (
                <p className="text-[10px] text-violet-400/70 font-mono pl-1">
                  ⚠ Compliance: structural defects are never removed. You'll review before &amp; after photos before they're used in the campaign.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <CreditCostPreview
                outputType={outputType}
                enhancePhotos={enhancePhotos}
                roomRescue={roomRescue}
              />
              <Button
                type="submit"
                disabled={createJob.isPending || generateScriptMutation.isPending || uploadingCount > 0}
                className="font-mono uppercase tracking-wider h-12 px-8"
              >
                {generateScriptMutation.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Script...</>
                  : createJob.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting pipeline...</>
                  : uploadingCount > 0
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading {uploadingCount} photo{uploadingCount !== 1 ? "s" : ""}...</>
                  : outputType === "film_myself"
                  ? <>Generate Script <ArrowRight className="w-4 h-4 ml-2" /></>
                  : <>Generate Video <ArrowRight className="w-4 h-4 ml-2" /></>
                }
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* ── FILM MYSELF: Script Ready + Recording Studio ── */}
      {outputType === "film_myself" && filmStep !== "configure" && (
        <div className="bg-card border border-primary/30 rounded-lg overflow-hidden">
          <div className="bg-primary/5 border-b border-primary/20 px-6 py-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-primary">Script Ready — Start Recording</div>
              <div className="text-sm text-muted-foreground mt-0.5">Read the script below while looking at the camera</div>
            </div>
            <button
              type="button"
              onClick={() => {
                filmWebcamStream?.getTracks().forEach((t) => t.stop());
                setFilmWebcamStream(null);
                setFilmStep("configure");
                setFilmScript("");
                setFilmRecordedBlob(null);
              }}
              className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Start over
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Webcam + background preview side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Your Camera</div>
                <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                  {filmStep === "uploading" || filmStep === "recording" ? (
                    <video ref={filmVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                  ) : filmWebcamStream ? (
                    <video ref={filmVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      <Camera className="w-8 h-8 opacity-40" />
                      <span className="text-xs font-mono">Camera not started</span>
                      <button
                        type="button"
                        onClick={startFilmWebcam}
                        className="text-xs font-mono text-primary border border-primary/40 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded transition-colors"
                      >
                        Enable Camera
                      </button>
                    </div>
                  )}
                  {filmStep === "recording" && (
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] font-mono text-white">REC</span>
                    </div>
                  )}
                  {(filmStep === "uploading") && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <span className="text-xs font-mono text-white">Uploading & compositing...</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {filmStep === "script-ready" && filmWebcamStream && (
                    <button
                      type="button"
                      onClick={startFilmRecording}
                      className="flex-1 flex items-center justify-center gap-2 h-10 bg-primary text-primary-foreground rounded-lg font-mono text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <Video className="w-4 h-4" />
                      Record
                    </button>
                  )}
                  {filmStep === "recording" && (
                    <button
                      type="button"
                      onClick={stopFilmRecording}
                      className="flex-1 flex items-center justify-center gap-2 h-10 bg-destructive text-destructive-foreground rounded-lg font-mono text-sm font-semibold hover:bg-destructive/90 transition-colors"
                    >
                      <Square className="w-4 h-4" />
                      Stop & Submit
                    </button>
                  )}
                  {filmStep === "script-ready" && !filmWebcamStream && (
                    <button
                      type="button"
                      onClick={startFilmWebcam}
                      className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg font-mono text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Enable Camera to Record
                    </button>
                  )}
                </div>
              </div>

              {/* Background preview */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Your Background (final output)</div>
                {(() => {
                  const bg = BACKGROUND_PRESETS.find(b => b.id === selectedBackground);
                  if (!bg) return null;
                  return (
                    <div className="rounded-lg overflow-hidden aspect-video">
                      {bg.url && !bg.url.endsWith(".mp4") ? (
                        <img src={bg.url} alt={bg.label} className="w-full h-full object-cover" />
                      ) : bg.url?.endsWith(".mp4") ? (
                        <video src={bg.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full ${bg.preview ?? "bg-slate-900"} flex items-center justify-center`}>
                          <span className="text-muted-foreground/40 font-mono text-xs">Studio Dark</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
                <p className="text-[10px] text-muted-foreground font-mono">
                  Shotstack will composite your recording over this background
                </p>
              </div>
            </div>

            {/* Script teleprompter */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Your Script — read this to camera</div>
              <div className="bg-background border border-border rounded-lg p-4 max-h-64 overflow-y-auto">
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono text-foreground">
                  {filmScript || "Script will appear here after generation…"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio player for previews */}
      {previewSrc && <audio ref={audioRef} src={previewSrc} className="hidden" />}

      {/* What happens next */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">What happens next</div>
        <div className="space-y-3">
          {[
            { n: "01", label: "Scrape Listing Data", desc: "LensFlow reads your listing URL to extract property details.", live: false },
            { n: "02", label: "Generate AI Script", desc: "Claude AI writes a professional 45-second presenter script.", live: true, badge: "LIVE · Claude AI" },
            { n: "03", label: "Synthesize Voiceover", desc: "Your chosen presenter's voice records the script.", live: !!selectedVoiceId, badge: selectedVoiceId ? "LIVE · ElevenLabs" : "Simulated" },
            { n: "04", label: "Render Presenter Avatar", desc: "A photoreal AI avatar presents your listing on camera.", live: false },
            { n: "05", label: "Final Video Composition", desc: "All elements are composited into a single shareable video file.", live: false },
          ].map((step) => (
            <div key={step.n} className="flex items-start gap-3">
              <span className="text-primary font-mono text-xs w-5 shrink-0 pt-0.5">{step.n}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{step.label}</span>
                  {step.badge && (
                    <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${step.live ? "text-primary border-primary/30 bg-primary/5" : "text-muted-foreground border-border"}`}>
                      {step.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CreditCostPreview({ outputType, enhancePhotos, roomRescue }: { outputType: string; enhancePhotos: boolean; roomRescue: boolean }) {
  const costs: Record<string, number> = { base: 10, voice_photos: 5, presenter_video: 15, enhance_photos: 8, room_rescue: 12 };
  let total = costs.base;
  const items = [{ label: "Base", cost: costs.base }];
  if (outputType === "voice_photos") { total += costs.voice_photos; items.push({ label: "Voice+Photos", cost: costs.voice_photos }); }
  else { total += costs.presenter_video; items.push({ label: "Presenter", cost: costs.presenter_video }); }
  if (enhancePhotos) { total += costs.enhance_photos; items.push({ label: "Glow-up", cost: costs.enhance_photos }); }
  if (roomRescue) { total += costs.room_rescue; items.push({ label: "Room Rescue", cost: costs.room_rescue }); }
  return (
    <div className="flex items-center gap-1.5">
      <Coins className="w-3.5 h-3.5 text-primary/70" />
      <span className="text-[11px] font-mono text-muted-foreground">
        {items.map((it, i) => (
          <span key={it.label}>
            {i > 0 && <span className="text-border mx-0.5">+</span>}
            <span className="text-foreground/60">{it.cost}c</span>
          </span>
        ))}
        <span className="text-border mx-0.5">=</span>
        <span className="text-primary font-bold">{total}c</span>
      </span>
    </div>
  );
}

function VoiceOption({
  voice,
  selected,
  onSelect,
  onPreview,
  displayName,
}: {
  voice: { voice_id: string; name: string; category: string; labels?: Record<string, string> | null };
  selected: boolean;
  onSelect: () => void;
  onPreview?: (e: React.MouseEvent) => void;
  displayName?: string;
}) {
  const accent = voice.labels?.accent ?? null;
  const gender = voice.labels?.gender ?? null;
  const label = displayName ?? voice.name;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors ${selected ? "bg-primary/10" : ""}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${selected ? "bg-primary" : "bg-muted-foreground/30"}`} />
        <div className="min-w-0">
          <span className={`text-sm font-mono block truncate ${selected ? "text-primary" : "text-foreground"}`}>{label}</span>
          {!displayName && (accent || gender) && (
            <span className="text-[10px] text-muted-foreground font-mono">{[gender, accent].filter(Boolean).join(" · ")}</span>
          )}
        </div>
      </div>
      {onPreview && (
        <button
          type="button"
          onClick={onPreview}
          className="shrink-0 ml-2 p-1 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
          title="Preview voice"
        >
          <Play className="w-3.5 h-3.5" />
        </button>
      )}
    </button>
  );
}
