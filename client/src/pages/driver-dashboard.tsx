import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Car, DollarSign, Clock, Star, MapPin, Navigation, Phone, MessageCircle, User as UserIcon, Heart } from "lucide-react";
import { useLocation } from "wouter";
import type { Trip, User } from "@shared/schema";

export default function DriverDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isOnline, setIsOnline] = useState(false);
  const [realTimeRides, setRealTimeRides] = useState<Trip[]>([]);

  // WebSocket connection for real-time notifications
  const { isConnected, sendLocationUpdate } = useWebSocket({
    onMessage: (message) => {
      switch (message.type) {
        case 'ride_request':
          // Add new ride request to real-time list
          setRealTimeRides(prev => {
            const exists = prev.find(ride => ride.id === message.trip.id);
            if (!exists) {
              toast({
                title: "New Ride Request!",
                description: `From ${message.trip.pickupAddress} to ${message.trip.destinationAddress}`,
              });
              return [...prev, message.trip];
            }
            return prev;
          });
          break;
        case 'driver_matched':
          // Remove accepted ride from list
          setRealTimeRides(prev => prev.filter(ride => ride.id !== message.tripId));
          break;
      }
    }
  });

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
      <div className="px-6 pt-6 pb-2 border-b border-gray-100">
        <h1 className="font-extrabold text-blue-600 text-[25px] text-center">Driver Dashboard</h1>
      </div>
      <div className="p-6 space-y-6">
        {/* Driver Status */}
        <Card className={`transition-all duration-300 ${!isOnline ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}`}>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div>
                <h2 className="font-bold text-blue-600 text-[19px] mb-2">Driver Mode</h2>
                <p className={`text-[15px] font-medium ${isOnline ? 'text-green-700' : 'text-blue-700'}`}>
                  {isOnline ? 'You are available for rides' : <span className="font-bold">You are offline</span>}
                </p>
              </div>
              
              {/* Custom Driver Mode Toggle Button */}
              <div 
                className={`relative mx-auto cursor-pointer transition-all duration-500 flex items-center justify-center ${
                  isOnline 
                    ? '' 
                    : 'subtle-pulse'
                }`}
                onClick={handleToggleOnline}
                data-testid="button-driver-mode-toggle"
              >
                {toggleStatusMutation.isPending ? (
                  <div className="w-16 h-16 flex items-center justify-center">
                    <div className="w-6 h-6 border-3 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="relative flex items-center justify-center">
                    <Heart 
                      size={64} 
                      className={`${
                        isOnline 
                          ? 'text-green-500 fill-green-500 hover:text-green-600 hover:fill-green-600' 
                          : 'text-blue-500 fill-blue-500 hover:text-blue-600 hover:fill-blue-600'
                      } transition-colors duration-500 drop-shadow-md`}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Car size={28} className="text-white transform -translate-y-1" />
                    </div>
                  </div>
                )}
              </div>
              
              <p className={`text-sm font-medium ${isOnline ? 'text-green-700' : 'text-blue-700'}`}>
                {isOnline ? 'ONLINE' : 'TAP TO START EARNING'}
              </p>
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
              <CardTitle className="tracking-tight text-lg text-center text-gray-500 font-bold">
                Available rides
                {((availableRides && availableRides.length > 0) || realTimeRides.length > 0) && (
                  <Badge variant="secondary">
                    {(availableRides?.length || 0) + realTimeRides.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ridesLoading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Looking for ride requests...</div>
                </div>
              ) : (!availableRides || availableRides.length === 0) && realTimeRides.length === 0 ? (
                <div className="text-center py-2">
                  <Car size={48} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-[#16181c] text-[15px]">Requests would appear here</p>
                  <p className="text-[#272d2e] text-[14px]">{isConnected ? '(Real-time updates active)' : '(Connecting...)'} </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Real-time rides first (most recent) */}
                  {realTimeRides.map((ride: Trip) => (
                    <Card key={`realtime-${ride.id}`} className="border-green-200 bg-green-50">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <UserIcon size={16} className="text-green-600" />
                            <span className="font-medium">New Ride Request!</span>
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
                          <span className="text-green-600 font-medium">Just now</span>
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
                  
                  {/* API-fetched rides */}
                  {availableRides && availableRides.map((ride: Trip) => (
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
              <p className="text-gray-500 font-medium text-[17px] mb-3">Ride Requests</p>
              <Car size={48} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 font-medium">You're offline</p>
              <p className="text-xs text-gray-400">Turn on driver mode to receive ride requests</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <Card>
          <CardContent className="pt-4">
            <h3 className="text-lg font-semibold mb-3 text-center">Driver Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <DollarSign className="h-5 w-5 text-brand-green" />
                  <span className="text-sm font-medium">Total Earnings</span>
                </div>
                <p className="font-bold text-brand-dark text-[16px]" data-testid="text-earnings">
                  ${totalEarnings.toFixed(2)}
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Car className="h-5 w-5 text-brand-green" />
                  <span className="text-sm font-medium">Total Trips</span>
                </div>
                <p className="font-bold text-brand-dark text-[16px]" data-testid="text-trips">
                  {totalTrips}
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Star className="h-5 w-5 text-status-warning" />
                  <span className="text-sm font-medium">Rating</span>
                </div>
                <p className="font-bold text-brand-dark text-[16px]" data-testid="text-rating">
                  {avgRating.toFixed(1)}
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Clock className="h-5 w-5 text-brand-green" />
                  <span className="text-sm font-medium">Online Time</span>
                </div>
                <p className="font-bold text-brand-dark text-[16px]">
                  0h 0m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Button variant="outline" className="w-full font-bold" data-testid="button-earnings">
            Earnings Details
          </Button>
          <Button variant="outline" className="w-full font-bold" data-testid="button-vehicle-settings">
            Vehicle Settings
          </Button>
          <Button 
            onClick={() => setLocation('/trips')} 
            variant="outline" 
            className="w-full font-bold"
            data-testid="button-trip-history"
          >
            View Past Rides
          </Button>

          {/* Back Button - positioned below vehicle settings */}
          <div className="pt-4">
            <Button
              onClick={() => setLocation('/')}
              variant="ghost"
              className="p-3 hover:bg-gray-100 rounded-full"
              data-testid="button-back"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
