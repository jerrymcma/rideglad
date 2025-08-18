import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Car, DollarSign, Clock, Star, MapPin, Navigation, Phone, MessageCircle, User as UserIcon } from "lucide-react";
import { useLocation } from "wouter";
import type { Trip, User } from "@shared/schema";

export default function DriverDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isOnline, setIsOnline] = useState(false);

  // Available ride requests for drivers to accept
  const { data: availableRides, isLoading: ridesLoading } = useQuery({
    queryKey: ['/api/drivers/available-rides'],
    enabled: !!user && user.userType === 'driver' && isOnline,
    refetchInterval: isOnline ? 5000 : false, // Poll every 5 seconds when online
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

  // Current active trip for the driver
  const { data: activeTrip } = useQuery({
    queryKey: ['/api/drivers/active-trip'],
    enabled: !!user && user.userType === 'driver',
    refetchInterval: 3000,
  });

  // Driver's completed trips history
  const { data: driverTrips, isLoading: tripsLoading } = useQuery({
    queryKey: ['/api/trips'],
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

  const toggleStatusMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      return await apiRequest('PATCH', '/api/drivers/status', { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/drivers/available-rides'] });
      toast({
        title: "Status Updated",
        description: `Driver mode ${isOnline ? 'activated' : 'deactivated'}`,
      });
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
        description: "Failed to update driver status",
        variant: "destructive",
      });
    },
  });

  const acceptRideMutation = useMutation({
    mutationFn: async (tripId: string) => {
      return await apiRequest('POST', `/api/drivers/accept-ride/${tripId}`, {});
    },
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ['/api/drivers/available-rides'] });
      queryClient.invalidateQueries({ queryKey: ['/api/drivers/active-trip'] });
      toast({
        title: "Ride Accepted!",
        description: "You have successfully accepted the ride request",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to accept ride. It may have been taken by another driver.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (user) {
      setIsOnline(user.isDriverActive || false);
    }
  }, [user]);

  const handleToggleOnline = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    toggleStatusMutation.mutate(newStatus);
  };

  const completedTrips = driverTrips?.filter(trip => trip.status === 'completed') || [];
  const totalEarnings = completedTrips.reduce((sum, trip) => sum + parseFloat(trip.finalPrice || '0'), 0);
  const totalTrips = completedTrips.length;
  const avgRating = user?.rating || 0;

  if (!user) return null;

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <Button
          onClick={() => setLocation('/')}
          variant="ghost"
          size="icon"
          className="rounded-full"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-extrabold text-[22px]">Driver Dashboard</h1>
        <div className="w-10"></div>
      </div>
      <div className="p-6 space-y-6">
        {/* Driver Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-brand-dark font-bold text-[19px]">Driver Mode</h2>
                <p className="text-[#101919] text-[15px] font-medium">
                  {isOnline ? 'You are online and available' : 'You are offline'}
                </p>
              </div>
              <Switch
                checked={isOnline}
                onCheckedChange={handleToggleOnline}
                disabled={toggleStatusMutation.isPending}
                data-testid="switch-driver-status"
              />
            </div>
          </CardContent>
        </Card>

        {/* Active Trip */}
        {activeTrip && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-green-800 flex items-center gap-2">
                <Navigation size={20} />
                Current Trip
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge variant="default" className="bg-green-600">
                  {activeTrip.status.charAt(0).toUpperCase() + activeTrip.status.slice(1)}
                </Badge>
                <span className="text-lg font-bold text-green-700">
                  ${activeTrip.estimatedPrice}
                </span>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Pickup</p>
                    <p className="text-xs text-gray-600">{activeTrip.pickupAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Navigation size={16} className="text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Destination</p>
                    <p className="text-xs text-gray-600">{activeTrip.destinationAddress}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <Phone size={16} className="mr-1" />
                  Call Rider
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <MessageCircle size={16} className="mr-1" />
                  Message
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Ride Requests */}
        {isOnline && !activeTrip && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="tracking-tight text-lg flex items-center gap-2 font-bold">
                <Car size={20} />
                Available Rides
                {availableRides && availableRides.length > 0 && (
                  <Badge variant="secondary">{availableRides.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ridesLoading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Looking for ride requests...</div>
                </div>
              ) : !availableRides || availableRides.length === 0 ? (
                <div className="text-center py-8">
                  <Car size={48} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-[#16181c]">No ride requests available</p>
                  <p className="text-[14px] text-[#272d2e]">New requests will appear here automatically</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableRides.map((ride: Trip) => (
                    <Card key={ride.id} className="border-blue-200">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <UserIcon size={16} className="text-blue-600" />
                            <span className="font-medium">Ride Request</span>
                          </div>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            ${ride.estimatedPrice}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <MapPin size={14} className="text-green-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-green-700">Pickup</p>
                              <p className="text-gray-600">{ride.pickupAddress}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Navigation size={14} className="text-red-500 mt-0.5" />
                            <div>
                              <p className="font-medium text-red-700">Destination</p>
                              <p className="text-gray-600">{ride.destinationAddress}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>{ride.distance ? `${(parseFloat(ride.distance.toString()) * 0.621371).toFixed(1)} mi` : 'Distance calculating'}</span>
                          <span>{new Date(ride.requestedAt!).toLocaleTimeString()}</span>
                        </div>

                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => acceptRideMutation.mutate(ride.id)}
                          disabled={acceptRideMutation.isPending}
                        >
                          {acceptRideMutation.isPending ? 'Accepting...' : 'Accept Ride'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Offline Message */}
        {!isOnline && (
          <Card className="border-gray-200">
            <CardContent className="pt-6 text-center">
              <Car size={48} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 font-medium">You're offline</p>
              <p className="text-xs text-gray-400">Turn on driver mode to start receiving ride requests</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-5 w-5 text-brand-green" />
                <span className="text-sm font-medium">Total Earnings</span>
              </div>
              <p className="text-2xl font-bold text-brand-dark" data-testid="text-earnings">
                ${totalEarnings.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 mb-2">
                <Car className="h-5 w-5 text-brand-green" />
                <span className="text-sm font-medium">Total Trips</span>
              </div>
              <p className="text-2xl font-bold text-brand-dark" data-testid="text-trips">
                {totalTrips}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="h-5 w-5 text-status-warning" />
                <span className="text-sm font-medium">Rating</span>
              </div>
              <p className="text-2xl font-bold text-brand-dark" data-testid="text-rating">
                {avgRating.toFixed(1)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-brand-green" />
                <span className="text-sm font-medium">Online Time</span>
              </div>
              <p className="text-2xl font-bold text-brand-dark">
                0h 0m
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Trips */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Recent Trips</h3>
            {tripsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : completedTrips.length === 0 ? (
              <div className="text-center py-8 text-gray-medium">
                <Car className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No trips completed yet</p>
                <p className="text-sm">Turn on driver mode to start earning</p>
              </div>
            ) : (
              <div className="space-y-3" data-testid="list-recent-trips">
                {completedTrips.slice(0, 5).map(trip => (
                  <div key={trip.id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-xl">
                    <div className="w-10 h-10 bg-gray-light rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-gray-medium" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" data-testid={`text-destination-${trip.id}`}>
                        {trip.destinationAddress}
                      </p>
                      <p className="text-xs text-gray-medium">
                        {new Date(trip.completedAt || '').toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-brand-green" data-testid={`text-price-${trip.id}`}>
                        ${trip.finalPrice}
                      </p>
                      <p className="text-xs text-gray-medium">
                        {trip.distance?.toFixed(1)}km
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Button 
            onClick={() => setLocation('/trips')} 
            variant="outline" 
            className="w-full"
            data-testid="button-trip-history"
          >
            View All Trips
          </Button>
          <Button variant="outline" className="w-full" data-testid="button-earnings">
            Earnings Details
          </Button>
          <Button variant="outline" className="w-full" data-testid="button-vehicle-settings">
            Vehicle Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
