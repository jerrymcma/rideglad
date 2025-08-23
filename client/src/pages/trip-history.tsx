import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ArrowLeft, MapPin, Clock, DollarSign, Star } from "lucide-react";
import { useLocation } from "wouter";
import type { Trip } from "@shared/schema";

export default function TripHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: trips, isLoading } = useQuery({
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      case 'matched':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'in_progress':
        return 'In Progress';
      case 'matched':
        return 'Driver Assigned';
      case 'requested':
        return 'Requested';
      default:
        return status;
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <Button
          onClick={() => setLocation('/')}
          variant="ghost"
          className="p-3 hover:bg-gray-100 rounded-full"
          data-testid="button-back"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </Button>
        <h1 className="text-xl font-semibold">Trip History</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : !trips || trips.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No trips yet</h3>
            <p className="text-gray-500 mb-6">Your trip history will appear here once you start riding</p>
            <Button 
              onClick={() => setLocation('/')} 
              className="bg-brand-green text-white"
              data-testid="button-book-first-ride"
            >
              Book Your First Ride
            </Button>
          </div>
        ) : (
          <div className="space-y-4" data-testid="list-trip-history">
            {trips.map((trip: Trip) => (
              <Card key={trip.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`} data-testid={`status-${trip.id}`}>
                          {getStatusText(trip.status)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(trip.requestedAt || '').toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {trip.finalPrice && (
                      <div className="text-lg font-bold text-brand-green" data-testid={`price-${trip.id}`}>
                        ${trip.finalPrice}
                      </div>
                    )}
                  </div>

                  {/* Route */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-brand-green rounded-full mt-1 flex-shrink-0"></div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" data-testid={`pickup-${trip.id}`}>
                          {trip.pickupAddress}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 border-2 border-gray-400 rounded-full mt-1 flex-shrink-0"></div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" data-testid={`destination-${trip.id}`}>
                          {trip.destinationAddress}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      {trip.distance && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{trip.distance.toFixed(1)} km</span>
                        </div>
                      )}
                      {trip.duration && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{trip.duration} min</span>
                        </div>
                      )}
                    </div>
                    <div className="capitalize">
                      {trip.rideType}
                    </div>
                  </div>

                  {trip.status === 'completed' && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        data-testid={`button-rate-${trip.id}`}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Rate Driver
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
