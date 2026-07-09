import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useAuth } from "@workspace/replit-auth-web";

import { Layout } from "@/components/layout/layout";
import Dashboard from "@/pages/dashboard";
import NewJob from "@/pages/new-job";
import JobDetail from "@/pages/job-detail";
import Webhooks from "@/pages/webhooks";
import Settings from "@/pages/settings";
import JobsList from "@/pages/jobs";
import Recorder from "@/pages/recorder";
import MiaMarketing from "@/pages/mia";
import Billing from "@/pages/billing";
import MiaChat from "@/components/MiaChat";
import { PendingJobHandler } from "@/components/PendingJobHandler";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const PRESENTERS = [
  { name: "Mia", tag: "Waterfront & Lifestyle", src: "/presenters/mia.mp4", poster: "/presenters/mia-poster.jpg" },
  { name: "Sophie", tag: "Family & Suburban", src: "/presenters/sophie.mp4", poster: "/presenters/sophie-poster.jpg" },
  { name: "James", tag: "Commercial & Rural", src: "/presenters/james.mp4", poster: "/presenters/james-poster.jpg" },
];

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, login } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#C9962A]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col lg:flex-row overflow-hidden">

        {/* ── Left: cinematic presenter showcase ── */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden">
          {/* Presenter video tiles */}
          <div className="absolute inset-0 grid grid-cols-3 gap-0">
            {PRESENTERS.map((p) => (
              <div key={p.name} className="relative overflow-hidden">
                <video
                  src={p.src}
                  poster={p.poster}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover object-top"
                />
                {/* Name badge */}
                <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center z-10">
                  <span className="text-white font-semibold text-sm">{p.name}</span>
                  <span className="text-[#C9962A] text-xs mt-0.5">{p.tag}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Dark gradient over bottom third */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-transparent pointer-events-none" />
          {/* Right-side fade so it bleeds into the sign-in panel */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0f1e] pointer-events-none" />
          {/* Tagline overlay */}
          <div className="absolute bottom-10 left-10 z-10 max-w-xs">
            <p className="text-2xl font-bold leading-snug text-white">
              Your listing video,<br />
              <span className="text-[#C9962A]">done today.</span>
            </p>
            <p className="text-sm text-white/60 mt-2">
              Paste a URL. Pick a presenter. Publish.
            </p>
          </div>
        </div>

        {/* ── Right: sign-in panel ── */}
        <div className="flex flex-col items-center justify-center w-full lg:w-[420px] px-8 py-16 relative">

          {/* Logo */}
          <div className="mb-10 text-center">
            <div className="text-[#C9962A] font-bold text-3xl tracking-tight">LensFlow</div>
            <div className="text-white/40 text-sm mt-1">AI video for real estate</div>
          </div>

          {/* Headline */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Create your first video in minutes
            </h1>
            <p className="text-white/50 text-sm leading-relaxed">
              Paste a listing URL and LensFlow writes the script,<br />
              records the voiceover, and renders the video — automatically.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={login}
            className="w-full bg-[#C9962A] hover:bg-[#b8851f] text-[#0a0f1e] font-bold py-4 px-6 rounded-xl transition-all text-base shadow-lg shadow-[#C9962A]/20 hover:shadow-[#C9962A]/30 hover:-translate-y-0.5"
          >
            Get started free
          </button>
          <p className="text-white/30 text-xs mt-3 text-center">
            Already have an account? Same button — we'll sign you in.
          </p>

          {/* Trust signals */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-white/30 text-xs">
            {["7-day free trial", "No credit card", "Cancel anytime"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[#C9962A]" />
                {t}
              </span>
            ))}
          </div>

          {/* Social proof */}
          <div className="mt-10 border border-white/8 rounded-xl p-5 text-center max-w-xs">
            <p className="text-white/70 text-sm italic leading-relaxed">
              "Saved me hours every listing. The videos look like I hired a full production crew."
            </p>
            <p className="text-[#C9962A] text-xs mt-3 font-medium">— Sarah T., Principal, Ray White</p>
          </div>
        </div>

      </div>
    );
  }

  return <>{children}</>;
}

function Router() {
  return (
    <>
      <PendingJobHandler />
      <Switch>
        <Route path="/jobs/:id/record" component={Recorder} />
        <Route>
          <Layout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/jobs/new" component={NewJob} />
              <Route path="/jobs/:id" component={JobDetail} />
              <Route path="/jobs" component={JobsList} />
              <Route path="/mia" component={MiaMarketing} />
              <Route path="/billing" component={Billing} />
              <Route path="/webhooks" component={Webhooks} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </Route>
      </Switch>
      <MiaChat />
    </>
  );
}

function App() {
  useServiceWorker();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthGate>
            <Router />
          </AuthGate>
        </WouterRouter>
        <Toaster />
        <SonnerToaster theme="dark" position="bottom-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
