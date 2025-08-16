import { Switch, Route, useLocation } from "wouter";
import React from "react";
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
import PricingManagement from "@/pages/pricing-management";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  useActivityTimeout(); // Enable 10-minute inactivity timeout
  useSessionRestore(); // Restore last authenticated route after re-login
  
  console.log('Router rendering, location:', location, 'isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  // Scroll to top on route changes
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Explicit routing logic
  switch (location) {
    case '/ride':
      return <RiderApp />;
    case '/driver':
      return <DriverDashboard />;
    case '/trips':
      return <TripHistory />;
    case '/pricing':
      return <PricingManagement />;
    case '/landing':
      return <Landing />;
    default:
      return <SimpleHome />;
  }
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
