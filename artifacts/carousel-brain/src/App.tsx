import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AnimatePresence } from "framer-motion";

// Pages
import LandingPage from "@/pages/LandingPage";
import ExtractPage from "@/pages/ExtractPage";
import DashboardPage from "@/pages/DashboardPage";
import ResultPage from "@/pages/ResultPage";

const queryClient = new QueryClient();

function Router() {
  return (
    <AnimatePresence mode="wait">
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/extract" component={ExtractPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/result/:id" component={ResultPage} />
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
