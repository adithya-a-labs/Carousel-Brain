import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AnimatePresence, motion } from "framer-motion";
import { pageVariants } from "@/lib/motion";
import { Atmosphere } from "@/components/Atmosphere";

import LandingPage from "@/pages/LandingPage";
import ExtractPage from "@/pages/ExtractPage";
import DashboardPage from "@/pages/DashboardPage";
import ResultPage from "@/pages/ResultPage";
import AdminAnalyticsPage from "@/pages/AdminAnalyticsPage";

const queryClient = new QueryClient();

function Router() {
  const [location] = useLocation();

  return (
    <>
      <Atmosphere />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative min-h-[100dvh] flex flex-col"
        >
          <Switch location={location}>
            <Route path="/" component={LandingPage} />
            <Route path="/extract" component={ExtractPage} />
            <Route path="/dashboard" component={DashboardPage} />
            <Route path="/result/:id" component={ResultPage} />
            <Route path="/admin/analytics" component={AdminAnalyticsPage} />
            <Route component={NotFound} />
          </Switch>
        </motion.div>
      </AnimatePresence>
    </>
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
