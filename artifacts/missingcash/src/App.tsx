import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/Layout";

// Pages
import Home from "@/pages/Home";
import Crypto from "@/pages/Crypto";
import Finance from "@/pages/Finance";
import Contact from "@/pages/Contact";
import Privacy from "@/pages/Privacy";
import Guides from "@/pages/Guides";
import ThankYou from "@/pages/ThankYou";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/crypto" component={Crypto} />
        <Route path="/finance" component={Finance} />
        <Route path="/contact" component={Contact} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/guides" component={Guides} />
        <Route path="/thank-you/:guide" component={ThankYou} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
