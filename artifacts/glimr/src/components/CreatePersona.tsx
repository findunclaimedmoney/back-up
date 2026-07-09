import { useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateCompanionPersona } from "@workspace/api-client-react";

interface CustomPersona {
  id: "custom";
  name: string;
  portraitBase64: string;
  faceDescription: string;
}

interface Props {
  onComplete: (persona: CustomPersona) => void;
  onBack: () => void;
}

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [, base64 = ""] = result.split(",");
      resolve({ base64, mimeType: file.type || "image/jpeg" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CreatePersona({ onComplete, onBack }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [result, setResult] = useState<{ portraitBase64: string; faceDescription: string; suggestedName: string } | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const mutation = useCreateCompanionPersona();

  const handleFile = async (file: File) => {
    setError("");
    const { base64, mimeType: type } = await fileToBase64(file);
    setPreview(`data:${type};base64,${base64}`);
    setPhotoBase64(base64);
    setMimeType(type);
  };

  const handleGenerate = async () => {
    if (!photoBase64) return;
    setError("");
    try {
      const email = localStorage.getItem("companion_email") ?? undefined;
      const generated = await mutation.mutateAsync({ data: { photoBase64, mimeType, email } });
      setResult(generated);
      setName(generated.suggestedName);
    } catch {
      setError("Couldn't create a persona from that photo. Try a clear, well-lit photo of a face.");
    }
  };

  const handleSave = () => {
    if (!result) return;
    const persona: CustomPersona = {
      id: "custom",
      name: name.trim() || result.suggestedName,
      portraitBase64: result.portraitBase64,
      faceDescription: result.faceDescription,
    };
    localStorage.setItem("companion_custom_persona", JSON.stringify(persona));
    onComplete(persona);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center p-6">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-sm mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-light">Create your companion</h1>
          <p className="text-muted-foreground mt-2 text-sm">Upload a clear photo of a face and we'll bring it to life</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {!result ? (
          <div className="space-y-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-square rounded-2xl border-2 border-dashed border-white/15 hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-3 overflow-hidden bg-card/40"
            >
              {preview ? (
                <img src={preview} alt="Uploaded" className="w-full h-full object-cover" />
              ) : (
                <>
                  <ImagePlus className="w-10 h-10 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload a photo</span>
                </>
              )}
            </button>

            {error && <p className="text-destructive text-sm text-center">{error}</p>}

            <Button className="w-full" size="lg" onClick={handleGenerate} disabled={!photoBase64 || mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating your companion...
                </>
              ) : (
                "Generate companion"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-card/40 border border-white/8">
              <img src={`data:image/png;base64,${result.portraitBase64}`} alt={name} className="w-full h-full object-cover" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" placeholder="Give them a name" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setResult(null)}>
                Try another photo
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={!name.trim()}>
                Start chatting
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
