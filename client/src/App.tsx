import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useActivityTimeout } from "@/hooks/useActivityTimeout";
import { useSessionRestore } from "@/hooks/useSessionRestore";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import SimpleHome from "@/pages/simple-home";
import DriverDashboard from "@/pages/driver-dashboard";
import TripHistory from "@/pages/trip-history";
import RiderApp from "@/pages/rider-app";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  useActivityTimeout(); // Enable 10-minute inactivity timeout
  useSessionRestore(); // Restore last authenticated route after re-login

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={RiderApp} />
          <Route path="/home" component={SimpleHome} />
          <Route path="/driver" component={DriverDashboard} />
          <Route path="/trips" component={TripHistory} />
        </>
      )}
      <Route path="/landing" component={Landing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
