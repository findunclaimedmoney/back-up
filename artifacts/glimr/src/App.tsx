import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Features from "@/pages/Features";
import Legal from "@/pages/Legal";
import VipLounge from "@/pages/VipLounge";
import Login from "@/pages/Login";
import Account from "@/pages/Account";
import HumanSession from "@/pages/HumanSession";
import { Pricing } from "@/components/Pricing";

const queryClient = new QueryClient();

function PricingPage() {
  const [, setLocation] = useLocation();
  return <Pricing onBack={() => setLocation("/")} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/features" component={Features} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/vip-lounge" component={VipLounge} />
      <Route path="/human-session" component={HumanSession} />
      <Route path="/legal" component={Legal} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Login} />
      <Route path="/account" component={Account} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
