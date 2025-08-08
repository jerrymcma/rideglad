import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Locate, Phone, MessageCircle, Share, AlertTriangle, Star } from "lucide-react";
import type { Trip } from "@shared/schema";

interface ActiveTripProps {
  trip: Trip;
  onTripComplete: () => void;
}

interface MockDriver {
  id: string;
  name: string;
  rating: number;
  vehicle: string;
  licensePlate: string;
  profileImage: string;
  phone: string;
}

export default function ActiveTrip({ trip, onTripComplete }: ActiveTripProps) {
  const [tripProgress, setTripProgress] = useState(20);
  const [eta, setEta] = useState(8);
  const [distance, setDistance] = useState(2.1);

  // Mock driver data - in real app, this would come from the matched driver
  const driver: MockDriver = {
    id: "driver-1",
    name: "Michael Chen",
    rating: 4.9,
    vehicle: "White Toyota Camry",
    licensePlate: "ABC 123",
    profileImage: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    phone: "+1234567890"
  };

  const completeTrip = useMutation({
    mutationFn: async () => {
      return await apiRequest('PATCH', `/api/trips/${trip.id}/status`, { 
        status: 'completed',
        finalPrice: trip.estimatedPrice 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      onTripComplete();
    },
  });

  useEffect(() => {
    // Simulate trip progress
    const progressInterval = setInterval(() => {
      setTripProgress(prev => {
        const newProgress = prev + Math.random() * 5;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            completeTrip.mutate();
          }, 2000);
          return 100;
        }
        return newProgress;
      });
    }, 3000);

    // Simulate ETA and distance updates
    const locationInterval = setInterval(() => {
      setEta(prev => Math.max(1, prev - 0.5));
      setDistance(prev => Math.max(0.1, prev - 0.1));
    }, 5000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(locationInterval);
    };
  }, []);

  return (
    <div className="absolute inset-0 bg-white z-40">
      {/* Map Background */}
      <div className="h-2/3 relative map-pattern bg-gradient-to-br from-blue-50 to-green-50">
        <img
          src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600"
          alt="Busy street traffic"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-blue-100/20"></div>

        {/* Trip Progress Line */}
        <div className="absolute top-1/4 left-1/4 right-1/4 h-1 bg-brand-green rounded-full opacity-60"></div>
        
        {/* Driver Location */}
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-8 h-8 bg-brand-green rounded-lg rotate-45 flex items-center justify-center shadow-lg">
            <div className="text-white text-sm -rotate-45">🚗</div>
          </div>
        </div>

        {/* ETA Banner */}
        <div className="absolute top-6 left-6 right-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-medium">Arriving in</p>
                  <p className="text-2xl font-bold text-brand-dark" data-testid="text-eta">{Math.ceil(eta)} min</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-medium">Distance</p>
                  <p className="text-lg font-semibold" data-testid="text-distance">{distance.toFixed(1)} km</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="absolute bottom-4 right-4">
          <Button size="icon" className="w-12 h-12 bg-white rounded-full shadow-lg" data-testid="button-locate">
            <Locate className="h-5 w-5 text-brand-green" />
          </Button>
        </div>
      </div>

      {/* Driver Info Panel */}
      <div className="h-1/3 bg-white">
        <div className="px-6 py-6">
          {/* Driver Details */}
          <div className="flex items-center space-x-4 mb-6">
            <img
              src={driver.profileImage}
              alt="Driver profile"
              className="w-16 h-16 rounded-xl object-cover"
              data-testid="img-driver"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-brand-dark" data-testid="text-driver-name">
                  {driver.name}
                </h3>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-status-warning fill-current" />
                  <span className="text-sm font-medium ml-1" data-testid="text-driver-rating">
                    {driver.rating}
                  </span>
                </div>
              </div>
              <p className="text-gray-medium text-sm" data-testid="text-vehicle">
                {driver.vehicle} • {driver.licensePlate}
              </p>
              <p className="text-brand-green text-sm font-medium">
                {tripProgress >= 100 ? 'Arrived' : 'On the way'}
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <Button 
                size="icon"
                className="w-12 h-12 bg-brand-green text-white rounded-xl"
                data-testid="button-call-driver"
              >
                <Phone className="h-5 w-5" />
              </Button>
              <Button 
                size="icon"
                variant="outline"
                className="w-12 h-12 border border-gray-200 text-brand-dark rounded-xl"
                data-testid="button-message-driver"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Trip Status */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Trip Progress</span>
                <span className="text-sm text-brand-green font-semibold" data-testid="text-progress">
                  {Math.round(tripProgress)}% complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-brand-green h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${tripProgress}%` }}
                  data-testid="progress-bar"
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              variant="secondary"
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium"
              data-testid="button-share-trip"
            >
              <Share className="h-4 w-4 mr-2" />
              Share Trip
            </Button>
            <Button 
              variant="outline"
              className="flex-1 border border-status-danger text-status-danger py-3 rounded-xl font-medium"
              data-testid="button-emergency"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Emergency
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
