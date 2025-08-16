import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { Car, Clock, MapPin, Star, Calendar } from "lucide-react";

interface RideBookingProps {
  pickupLocation: string;
  setPickupLocation: (location: string) => void;
  destination: string;
  setDestination: (destination: string) => void;
  onBookRide: (rideType: string, estimatedPrice: string) => void;
  isLoading: boolean;
}

interface RideType {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: string;
  eta: string;
  multiplier: number;
}

const rideTypes: RideType[] = [
  {
    id: 'driver-1',
    name: 'John',
    description: 'Toyota Camry',
    icon: '🚗',
    price: '4.00',
    eta: '2',
    multiplier: 1
  },
  {
    id: 'driver-2',
    name: 'Sarah',
    description: 'Honda Accord',
    icon: '🚙',
    price: '4.00',
    eta: '4',
    multiplier: 1
  },
  {
    id: 'driver-3',
    name: 'Mike',
    description: 'BMW 3 Series',
    icon: '🚗',
    price: '4.00',
    eta: '3',
    multiplier: 1
  }
];

export default function RideBooking({ 
  pickupLocation, 
  setPickupLocation, 
  destination, 
  setDestination, 
  onBookRide, 
  isLoading 
}: RideBookingProps) {
  const [showRideTypes, setShowRideTypes] = useState(false);
  const [selectedRideType, setSelectedRideType] = useState<RideType | null>(null);
  const [estimatedPrices, setEstimatedPrices] = useState<Record<string, string>>({});

  const calculatePriceMutation = useMutation({
    mutationFn: async (data: { distance: number, rideType: string }) => {
      return await apiRequest('POST', '/api/trips/calculate-price', data);
    },
    onSuccess: async (response) => {
      const { estimatedPrice } = await response.json();
      // Update prices for all ride types based on the base calculation
      const newPrices: Record<string, string> = {};
      rideTypes.forEach(type => {
        newPrices[type.id] = (parseFloat(estimatedPrice) * type.multiplier).toFixed(2);
      });
      setEstimatedPrices(newPrices);
      setShowRideTypes(true);
    },
  });

  const handleLocationSubmit = () => {
    if (!destination.trim()) {
      return;
    }
    // Mock distance calculation - in real app, use geocoding service
    const mockDistance = 3.2;
    calculatePriceMutation.mutate({ distance: mockDistance, rideType: 'economy' });
  };

  const handleRideTypeSelect = (rideType: RideType) => {
    setSelectedRideType(rideType);
    const price = estimatedPrices[rideType.id] || rideType.price;
    onBookRide(rideType.id, price);
  };

  const recentDestinations = [
    {
      id: 1,
      name: "Downtown Plaza",
      address: "1234 Main Street, City Center",
      distance: "2.1 km",
      icon: "🏢"
    },
    {
      id: 2,
      name: "Work",
      address: "Tech Tower, 567 Innovation Ave",
      distance: "5.3 km",
      icon: "💼"
    }
  ];

  return (
    <>
      {!showRideTypes ? (
        // Location Input Sheet
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl slide-up">
          <div className="px-6 py-6">
            {/* Handle */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>

            {/* Quick Actions */}
            <div className="flex space-x-4 mb-6">
              <Button 
                onClick={handleLocationSubmit}
                className="flex-1 bg-brand-green text-white py-4 rounded-xl font-semibold"
                disabled={!destination.trim() || calculatePriceMutation.isPending}
                data-testid="button-book-ride"
              >
                <Car className="w-5 h-5 mr-2" />
                Book ride
              </Button>
              <Button 
                variant="outline"
                className="flex-1 border border-gray-200 text-brand-dark py-4 rounded-xl font-semibold"
                data-testid="button-schedule"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Schedule
              </Button>
            </div>

            {/* Location Inputs */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-brand-green rounded-full"></div>
                <Input
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="Pickup location"
                  className="flex-1 bg-gray-light border-none focus:ring-2 focus:ring-brand-green"
                  data-testid="input-pickup"
                />
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Star className="h-5 w-5 text-status-warning" />
                </Button>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 border-2 border-gray-400 rounded-full"></div>
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Where to?"
                  className="flex-1 bg-gray-light border-none focus:ring-2 focus:ring-brand-green"
                  data-testid="input-destination"
                />
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </Button>
              </div>
            </div>

            {/* Recent Destinations */}
            <div>
              <h3 className="font-semibold text-brand-dark mb-3">Recent</h3>
              <div className="space-y-2" data-testid="recent-destinations">
                {recentDestinations.map(dest => (
                  <div 
                    key={dest.id}
                    onClick={() => setDestination(dest.address)}
                    className="flex items-center space-x-4 py-3 cursor-pointer hover:bg-gray-50 rounded-xl px-2"
                    data-testid={`destination-${dest.id}`}
                  >
                    <div className="w-10 h-10 bg-gray-light rounded-full flex items-center justify-center">
                      <span className="text-xl">{dest.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-brand-dark">{dest.name}</p>
                      <p className="text-sm text-gray-medium">{dest.address}</p>
                    </div>
                    <p className="text-sm text-gray-medium">{dest.distance}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Ride Types Sheet
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl slide-up">
          <div className="px-6 py-6">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Choose a ride</h2>
              <Button 
                onClick={() => setShowRideTypes(false)}
                variant="ghost" 
                size="icon"
                className="rounded-full"
                data-testid="button-close-ride-types"
              >
                ✕
              </Button>
            </div>

            {/* Route Info */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-medium">Distance: 3.2 km</span>
                  <span className="text-gray-medium">Est. time: 12 min</span>
                </div>
              </CardContent>
            </Card>

            {/* Ride Options */}
            <div className="space-y-3 mb-6" data-testid="ride-types-list">
              {rideTypes.map(rideType => {
                const price = estimatedPrices[rideType.id] || rideType.price;
                return (
                  <div
                    key={rideType.id}
                    onClick={() => handleRideTypeSelect(rideType)}
                    className="border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-brand-green transition-colors"
                    data-testid={`ride-type-${rideType.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-light rounded-xl flex items-center justify-center text-2xl">
                          {rideType.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-brand-dark">{rideType.name}</p>
                          <p className="text-sm text-gray-medium">{rideType.description}</p>
                          <p className="text-xs text-gray-medium">⏱️ {rideType.eta} min away</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg" data-testid={`price-${rideType.id}`}>${price}</p>
                        <p className="text-xs text-gray-medium">Est. total</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedRideType && (
              <Button 
                className="w-full bg-brand-green text-white py-4 rounded-xl font-semibold text-lg"
                disabled={isLoading}
                data-testid="button-confirm-ride"
              >
                {isLoading ? 'Requesting...' : `Confirm ${selectedRideType.name}`}
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
