import { Link, useRoute } from "wouter";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, Home } from "lucide-react";

type GuideConfig = {
  title: string;
  subtitle: string;
  note: string;
  downloads: { label: string; file: string; color: string }[];
  steps: string[];
};

const configs: Record<string, GuideConfig> = {
  missingcash: {
    title: "Your Guide is Ready to Download",
    subtitle: "Thank you for your purchase. Your MissingCash Premium Guide is waiting — click below to download it instantly.",
    note: "PDF · Instant download · No account needed",
    downloads: [
      { label: "Download Your Guide Now", file: "/MissingCash_Premium_Guide-2.pdf", color: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_8px_24px_rgba(245,185,66,0.35)]" },
    ],
    steps: [
      "Download and save your guide using the button above",
      "Open the PDF and follow the step-by-step instructions",
      "Lodge your claim directly with the relevant agency — it's free",
    ],
  },
  crypto: {
    title: "Your Crypto Recovery Guide is Ready",
    subtitle: "Thank you for your purchase. Download your MissingCrypto Recovery Guide now and start recovering lost digital assets.",
    note: "PDF · Instant download · Save a copy to a safe location",
    downloads: [
      { label: "Download Your Recovery Guide", file: "/MissingCrypto_Recovery_Guide-4.pdf", color: "bg-[#00C1D5] hover:bg-[#00C1D5]/90 text-white shadow-[0_8px_24px_rgba(0,193,213,0.35)]" },
    ],
    steps: [
      "Download and save your guide — keep a copy in a secure, offline location",
      "Start with your specific exchange chapter",
      "Follow the identity verification steps exactly as described",
    ],
  },
  cyber: {
    title: "Your Cyber Security Guide is Ready!",
    subtitle: "Download your guide now and start protecting your phone, accounts and digital life immediately.",
    note: "PDF · 12 chapters · Instant download · Save to a safe location",
    downloads: [
      { label: "Download Cyber Security Guide", file: "/Cyber_Security_Guide.pdf", color: "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_8px_24px_rgba(0,100,255,0.35)]" },
    ],
    steps: [
      "Download and save your guide",
      "Start with Chapter 1 — securing your phone and SIM",
      "Work through each chapter to lock down your digital life",
    ],
  },
  identity: {
    title: "Your Identity Recovery Guide is Ready!",
    subtitle: "Download your guide now. Follow Chapter 2 first — the 24-hour emergency response plan is the most important place to start.",
    note: "PDF · 10 chapters · Template letters included · Instant download",
    downloads: [
      { label: "Download Identity Recovery Guide", file: "/Identity_Theft_Recovery_Guide.pdf", color: "bg-red-600 hover:bg-red-500 text-white shadow-[0_8px_24px_rgba(200,0,0,0.35)]" },
    ],
    steps: [
      "Download your guide immediately",
      "Go straight to Chapter 2 — the 24-hour emergency response plan",
      "Use the included template letters to dispute fraudulent accounts",
    ],
  },
  bundle: {
    title: "All 4 Guides Ready to Download!",
    subtitle: "You now have the complete MissingCash library. Download each guide below — save them all to a safe location on your device.",
    note: "4 PDFs · Instant downloads · Save all to a secure location",
    downloads: [
      { label: "💰 Download MissingCash Premium Guide", file: "/MissingCash_Premium_Guide-2.pdf", color: "bg-primary hover:bg-primary/90 text-primary-foreground" },
      { label: "₿ Download Crypto Recovery Guide", file: "/MissingCrypto_Recovery_Guide-4.pdf", color: "bg-[#00C1D5] hover:bg-[#00C1D5]/90 text-white" },
      { label: "📱 Download Cyber Security Guide", file: "/Cyber_Security_Guide.pdf", color: "bg-blue-600 hover:bg-blue-500 text-white" },
      { label: "🪪 Download Identity Recovery Guide", file: "/Identity_Theft_Recovery_Guide.pdf", color: "bg-red-600 hover:bg-red-500 text-white" },
    ],
    steps: [
      "Download all 4 guides using the buttons above",
      "Save each PDF to a safe location on your device",
      "Start with whichever guide is most relevant to you right now",
    ],
  },
};

export default function ThankYou() {
  const [, params] = useRoute("/thank-you/:guide");
  const guide = params?.guide ?? "missingcash";
  const config = configs[guide] ?? configs.missingcash;

  usePageSEO({
    title: `${config.title} — MissingCash`,
    description: config.subtitle,
  });

  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center py-16">
      <div className="container mx-auto px-4 max-w-xl">
        {/* Success indicator */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-heading tracking-wider text-white mb-3">
            {config.title}
          </h1>
          <p className="text-muted-foreground leading-relaxed">{config.subtitle}</p>
        </div>

        {/* Download buttons */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 space-y-3">
          {config.downloads.map((dl) => (
            <a key={dl.file} href={dl.file} download>
              <Button className={`w-full h-14 text-base font-bold tracking-wider rounded-xl flex items-center gap-2 mb-2 ${dl.color}`}>
                <Download className="w-5 h-5" />
                {dl.label}
              </Button>
            </a>
          ))}
          <p className="text-center text-xs text-muted-foreground pt-1">{config.note}</p>
        </div>

        {/* Next steps */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-white mb-4">Your Next Steps</h3>
          <div className="space-y-3">
            {config.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Back home */}
        <div className="text-center">
          <Link href="/">
            <Button variant="ghost" className="text-muted-foreground hover:text-white gap-2">
              <Home className="w-4 h-4" /> Back to MissingCash
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
