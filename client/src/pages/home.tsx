import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Map from "@/components/ui/map";
import RideBooking from "@/components/ride-booking";
import DriverSearch from "@/components/driver-search";
import ActiveTrip from "@/components/active-trip";
import TripComplete from "@/components/trip-complete";
import Sidebar from "@/components/sidebar";
import { MapPin, Bell, Menu, Locate, Plus, Minus } from "lucide-react";
import type { Trip } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentView, setCurrentView] = useState<'booking' | 'searching' | 'active' | 'complete'>('booking');
  const [pickupLocation, setPickupLocation] = useState("Current Location");
  const [destination, setDestination] = useState("");
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);

  // Check for active trip on load
  const { data: activeTripData } = useQuery({
    queryKey: ['/api/trips/active'],
    enabled: !!user,
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  useEffect(() => {
    if (activeTripData) {
      setActiveTrip(activeTripData);
      if (activeTripData.status === 'requested') {
        setCurrentView('searching');
      } else if (activeTripData.status === 'matched' || activeTripData.status === 'in_progress') {
        setCurrentView('active');
      } else if (activeTripData.status === 'completed') {
        setCurrentView('complete');
      }
    }
  }, [activeTripData]);

  const createTripMutation = useMutation({
    mutationFn: async (tripData: any) => {
      return await apiRequest('POST', '/api/trips', tripData);
    },
    onSuccess: (response) => {
      const trip = response.json();
      setActiveTrip(trip);
      setCurrentView('searching');
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create trip request",
        variant: "destructive",
      });
    },
  });

  const handleBookRide = async (rideType: string, estimatedPrice: string) => {
    if (!destination.trim()) {
      toast({
        title: "Destination Required",
        description: "Please enter a destination",
        variant: "destructive",
      });
      return;
    }

    const tripData = {
      pickupAddress: pickupLocation,
      pickupLat: 40.7128, // Mock coordinates
      pickupLng: -74.0060,
      destinationAddress: destination,
      destinationLat: 40.7589, // Mock coordinates
      destinationLng: -73.9851,
      rideType,
      estimatedPrice,
      distance: 3.2, // Mock distance
      duration: 12, // Mock duration
    };

    createTripMutation.mutate(tripData);
  };

  const handleViewChange = (view: 'booking' | 'searching' | 'active' | 'complete') => {
    setCurrentView(view);
  };

  if (!user) return null;

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen relative overflow-hidden">
      {/* Map Section */}
      <div className="relative h-full map-pattern bg-gradient-to-br from-blue-50 to-green-50">
        <Map />

        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/20 to-transparent">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setShowSidebar(true)}
              size="icon"
              className="w-10 h-10 bg-white rounded-full shadow-lg"
              data-testid="button-menu"
            >
              <Menu className="h-5 w-5 text-brand-dark" />
            </Button>
            <div className="flex items-center space-x-2">
              <Button
                size="icon"
                className="w-10 h-10 bg-white rounded-full shadow-lg"
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5 text-brand-dark" />
              </Button>
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-white shadow-lg object-cover"
                  data-testid="img-profile"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center border-2 border-white shadow-lg">
                  <span className="text-white font-semibold text-sm">
                    {user.firstName?.[0] || user.email?.[0] || 'U'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location Controls */}
        <div className="absolute right-0 top-24 space-y-1">
          <Button
            size="icon"
            className="w-8 h-8 bg-white rounded-full shadow-lg"
            data-testid="button-locate"
          >
            <Locate className="h-4 w-4 text-brand-green" />
          </Button>
          <Button
            size="icon"
            className="w-8 h-8 bg-white rounded-full shadow-lg"
            data-testid="button-zoom-in"
          >
            <Plus className="h-4 w-4 text-brand-dark" />
          </Button>
          <Button
            size="icon"
            className="w-8 h-8 bg-white rounded-full shadow-lg"
            data-testid="button-zoom-out"
          >
            <Minus className="h-4 w-4 text-brand-dark" />
          </Button>
        </div>
      </div>

      {/* Bottom Sheets */}
      {currentView === 'booking' && (
        <RideBooking
          pickupLocation={pickupLocation}
          setPickupLocation={setPickupLocation}
          destination={destination}
          setDestination={setDestination}
          onBookRide={handleBookRide}
          isLoading={createTripMutation.isPending}
          data-testid="component-ride-booking"
        />
      )}

      {currentView === 'searching' && activeTrip && (
        <DriverSearch
          trip={activeTrip}
          onCancel={() => {
            setCurrentView('booking');
            setActiveTrip(null);
          }}
          onDriverMatched={() => setCurrentView('active')}
          data-testid="component-driver-search"
        />
      )}

      {currentView === 'active' && activeTrip && (
        <ActiveTrip
          trip={activeTrip}
          onTripComplete={() => setCurrentView('complete')}
          data-testid="component-active-trip"
        />
      )}

      {currentView === 'complete' && activeTrip && (
        <TripComplete
          trip={activeTrip}
          onNewRide={() => {
            setCurrentView('booking');
            setActiveTrip(null);
            setDestination("");
          }}
          data-testid="component-trip-complete"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        user={user}
        data-testid="component-sidebar"
      />
    </div>
  );
}
