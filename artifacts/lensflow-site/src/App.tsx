import { Switch, Route, Router as WouterRouter } from "wouter";
import Advantage from "@/pages/Advantage";
import Origin from "@/pages/Origin";
import Concierge from "@/pages/Concierge";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Pricing from "@/pages/Pricing";
import TwinAvatar from "@/pages/TwinAvatar";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Examples from "@/pages/Examples";
import Presenters from "@/pages/Presenters";
import MiaChat from "@/components/MiaChat";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/examples" component={Examples} />
      <Route path="/presenters" component={Presenters} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/twin-avatar" component={TwinAvatar} />
      <Route path="/advantage" component={Advantage} />
      <Route path="/origin" component={Origin} />
      <Route path="/concierge" component={Concierge} />
      <Route path="/privacy" component={PrivacyPolicy} />
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
        <MiaChat />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
