import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Car, DollarSign, Clock, Star, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import type { Trip, User } from "@shared/schema";

export default function DriverDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isOnline, setIsOnline] = useState(false);

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
        <h1 className="text-xl font-semibold">Driver Dashboard</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-6 space-y-6">
        {/* Driver Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-brand-dark">Driver Mode</h2>
                <p className="text-sm text-gray-medium">
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
