import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Navigation, Clock, Star, CreditCard, User, Car } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Trip, Vehicle, User as UserType } from "@shared/schema";

type RideStep = 'booking' | 'searching' | 'matched' | 'pickup' | 'inprogress' | 'completed' | 'rating';

interface BookingForm {
  pickupAddress: string;
  destinationAddress: string;
  rideType: string;
}

interface MatchedDriver {
  driver: UserType;
  vehicle: Vehicle;
  estimatedArrival: number; // minutes
  rating: number;
}

export default function RiderApp() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<RideStep>('booking');
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [matchedDriver, setMatchedDriver] = useState<MatchedDriver | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    pickupAddress: '',
    destinationAddress: '',
    rideType: 'driver-1'
  });

  // Get current active trip
  const { data: activeTrip, refetch: refetchTrip } = useQuery({
    queryKey: ['/api/trips/active'],
    enabled: !!user,
    refetchInterval: currentStep !== 'booking' && currentStep !== 'completed' ? 3000 : false,
  });

  // Update current step based on active trip
  useEffect(() => {
    if (activeTrip && activeTrip.status) {
      setCurrentTrip(activeTrip);
      switch (activeTrip.status) {
        case 'requested':
          setCurrentStep('searching');
          break;
        case 'matched':
          setCurrentStep('matched');
          break;
        case 'pickup':
          setCurrentStep('pickup');
          break;
        case 'in_progress':
          setCurrentStep('inprogress');
          break;
        case 'completed':
          setCurrentStep('rating');
          break;
        default:
          setCurrentStep('booking');
      }
    } else if (currentStep !== 'rating') {
      setCurrentStep('booking');
    }
  }, [activeTrip]);

  // Request ride mutation
  const requestRideMutation = useMutation({
    mutationFn: async (data: BookingForm) => {
      // Mock coordinates for demo
      const mockCoords = { lat: 40.7128, lng: -74.0060 };
      
      return await apiRequest('/api/trips', 'POST', {
        pickupAddress: data.pickupAddress,
        pickupLat: mockCoords.lat,
        pickupLng: mockCoords.lng,
        destinationAddress: data.destinationAddress,
        destinationLat: mockCoords.lat + 0.01,
        destinationLng: mockCoords.lng + 0.01,
        rideType: data.rideType,
        estimatedPrice: data.rideType === 'driver-1' ? '12.50' : data.rideType === 'driver-2' ? '16.80' : '24.90'
      });
    },
    onSuccess: () => {
      setCurrentStep('searching');
      refetchTrip();
      toast({
        title: "ride Requested",
        description: "We're finding you a driver!",
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
        description: "Failed to request ride. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cancel ride mutation
  const cancelRideMutation = useMutation({
    mutationFn: async () => {
      if (!currentTrip) throw new Error('No active trip');
      return await apiRequest(`/api/trips/${currentTrip.id}/cancel`, 'POST');
    },
    onSuccess: () => {
      setCurrentTrip(null);
      setCurrentStep('booking');
      toast({
        title: "Ride Cancelled",
        description: "Your ride has been cancelled.",
      });
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
        description: "Failed to cancel ride.",
        variant: "destructive",
      });
    },
  });

  // Submit rating mutation
  const submitRatingMutation = useMutation({
    mutationFn: async () => {
      if (!currentTrip || !matchedDriver) throw new Error('No trip or driver data');
      return await apiRequest('/api/ratings', 'POST', {
        tripId: currentTrip.id,
        toUserId: matchedDriver.driver.id,
        rating: ratingValue,
        comment: ratingComment,
      });
    },
    onSuccess: () => {
      setCurrentStep('booking');
      setCurrentTrip(null);
      setMatchedDriver(null);
      setRatingValue(5);
      setRatingComment('');
      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback!",
      });
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
        description: "Failed to submit rating.",
        variant: "destructive",
      });
    },
  });

  // Mock driver matching simulation
  useEffect(() => {
    if (currentStep === 'searching') {
      const timer = setTimeout(() => {
        setMatchedDriver({
          driver: {
            id: 'driver-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            profileImageUrl: null,
            phone: '+1234567890',
            userType: 'driver',
            rating: 4.8,
            totalRatings: 120,
            isDriverActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          vehicle: {
            id: 'vehicle-1',
            driverId: 'driver-1',
            make: 'Honda',
            model: 'Civic',
            year: 2020,
            color: 'Blue',
            licensePlate: 'ABC-123',
            vehicleType: bookingForm.rideType,
            createdAt: new Date(),
          },
          estimatedArrival: 5,
          rating: 4.8,
        });
        setCurrentStep('matched');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [currentStep, bookingForm.rideType]);

  const handleRequestRide = () => {
    if (!bookingForm.pickupAddress || !bookingForm.destinationAddress) {
      toast({
        title: "Missing Information",
        description: "Please enter both pickup and destination addresses.",
        variant: "destructive",
      });
      return;
    }
    requestRideMutation.mutate(bookingForm);
  };

  const getRideTypePrice = (type: string) => {
    switch (type) {
      case 'economy': return '$12.50';
      case 'comfort': return '$18.75';
      case 'premium': return '$28.00';
      default: return '$12.50';
    }
  };

  const renderBookingStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-black">Book a ride</h1>
        <p className="text-gray-600">Where would you like to go?</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pickup" className="text-blue-600 font-medium text-lg flex items-center gap-2">
            <MapPin size={16} />
            Pickup Location
          </Label>
          <Input
            id="pickup"
            value={bookingForm.pickupAddress}
            onChange={(e) => setBookingForm(prev => ({ ...prev, pickupAddress: e.target.value }))}
            placeholder="Enter pickup address"
            className="border border-gray-300 rounded"
            data-testid="input-pickup"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="destination" className="text-blue-600 font-medium text-lg flex items-center gap-2">
            <Navigation size={16} />
            Destination
          </Label>
          <Input
            id="destination"
            value={bookingForm.destinationAddress}
            onChange={(e) => setBookingForm(prev => ({ ...prev, destinationAddress: e.target.value }))}
            placeholder="Enter destination address"
            className="border border-gray-300 rounded"
            data-testid="input-destination"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-blue-600 font-medium text-lg flex items-center gap-2">
            <Car size={20} />
            Available drivers nearby
          </Label>
          
          {/* Real-time Map */}
          <div className="relative">
            <div className="w-full h-48 bg-gray-100 rounded-lg border overflow-hidden">
              {/* Map Background */}
              <div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 relative">
                {/* Grid lines to simulate map */}
                <div className="absolute inset-0 opacity-20">
                  {[...Array(8)].map((_, i) => (
                    <div key={`h-${i}`} className="absolute border-t border-gray-300" style={{top: `${i * 12.5}%`, width: '100%'}} />
                  ))}
                  {[...Array(6)].map((_, i) => (
                    <div key={`v-${i}`} className="absolute border-l border-gray-300" style={{left: `${i * 16.67}%`, height: '100%'}} />
                  ))}
                </div>
                
                {/* Your Location */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg animate-pulse" />
                  <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-blue-600">You</span>
                </div>
                
                {/* Driver Locations */}
                <div className="absolute top-1/3 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-xs text-brand-green font-bold bg-white px-1 py-0.5 rounded shadow">$12.50</span>
                  <div className="bg-white rounded-full p-1 border border-white shadow-md">
                    <Car size={16} className="text-blue-600" />
                  </div>
                  <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-blue-600 font-medium">John</span>
                </div>
                
                <div className="absolute top-2/3 right-1/3 transform translate-x-1/2 -translate-y-1/2">
                  <span className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-xs text-brand-green font-bold bg-white px-1 py-0.5 rounded shadow">$16.80</span>
                  <div className="bg-white rounded-full p-1 border border-white shadow-md">
                    <Car size={16} className="text-blue-600" />
                  </div>
                  <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-blue-600 font-medium">Sarah</span>
                </div>
                
                <div className="absolute top-1/4 right-1/4 transform translate-x-1/2 -translate-y-1/2">
                  <span className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-xs text-brand-green font-bold bg-white px-1 py-0.5 rounded shadow">$24.90</span>
                  <div className="bg-white rounded-full p-1 border border-white shadow-md">
                    <Car size={16} className="text-blue-600" />
                  </div>
                  <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-blue-600 font-medium">Mike</span>
                </div>
              </div>
              
              {/* Map Controls */}
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                <button className="w-8 h-8 bg-white rounded border shadow flex items-center justify-center text-gray-600 hover:bg-gray-50">+</button>
                <button className="w-8 h-8 bg-white rounded border shadow flex items-center justify-center text-gray-600 hover:bg-gray-50">-</button>
              </div>
            </div>
          </div>

          {/* Nearby Drivers List */}
          <div className="space-y-2">
            <Label className="text-blue-600 font-medium text-lg flex items-center gap-2">
              <Car size={20} />
              Choose ride
            </Label>
            {[
              {
                id: 'driver-1',
                driverName: 'John Driver',
                vehicle: '2022 Toyota Camry',
                rating: 4.8,
                eta: '3 min',
                fare: '$12.50',
                distance: '0.4 mi'
              },
              {
                id: 'driver-2',
                driverName: 'Sarah Wilson',
                vehicle: '2023 Honda CR-V',
                rating: 4.9,
                eta: '5 min',
                fare: '$16.80',
                distance: '0.7 mi'
              },
              {
                id: 'driver-3',
                driverName: 'Michael Chen',
                vehicle: '2024 BMW 3 Series',
                rating: 5.0,
                eta: '7 min',
                fare: '$24.90',
                distance: '1.1 mi'
              }
            ].map((driver) => (
              <Card 
                key={driver.id}
                className={`cursor-pointer transition-colors ${
                  bookingForm.rideType === driver.id 
                    ? 'border-brand-green bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setBookingForm(prev => ({ ...prev, rideType: driver.id }))}
                data-testid={`card-driver-${driver.id}`}
              >
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-green rounded-full flex items-center justify-center text-white font-semibold">
                        {driver.driverName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{driver.driverName}</p>
                          <div className="flex items-center gap-1">
                            <Star size={12} className="text-yellow-400 fill-current" />
                            <span className="text-xs font-medium">{driver.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{driver.vehicle}</p>
                        <p className="text-xs text-gray-500">{driver.distance} • {driver.eta} away</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-brand-green">{driver.fare}</p>
                      <p className="text-xs text-gray-500">Estimated</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Button
          onClick={handleRequestRide}
          disabled={requestRideMutation.isPending}
          className="w-full bg-brand-green text-white text-2xl py-3 rounded font-semibold hover:bg-green-600"
          data-testid="button-request-ride"
        >
          {requestRideMutation.isPending ? 'Requesting...' : 'Request ride'}
        </Button>
      </div>
    </div>
  );

  const renderSearchingStep = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Finding Your Driver</h2>
        <p className="text-gray-600">We're matching you with the best available driver...</p>
      </div>
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-blue-600" />
              <span className="text-sm font-medium">From:</span>
              <span className="text-sm text-gray-600">{bookingForm.pickupAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Navigation size={16} className="text-brand-green" />
              <span className="text-sm font-medium">To:</span>
              <span className="text-sm text-gray-600">{bookingForm.destinationAddress}</span>
            </div>
          </CardContent>
        </Card>
        <Button
          variant="outline"
          onClick={() => cancelRideMutation.mutate()}
          disabled={cancelRideMutation.isPending}
          className="w-full"
          data-testid="button-cancel-ride"
        >
          Cancel Request
        </Button>
      </div>
    </div>
  );

  const renderMatchedStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-brand-green">Driver Found!</h2>
        <p className="text-gray-600">Your driver is on the way</p>
      </div>

      {matchedDriver && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={24} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{matchedDriver.driver.firstName} {matchedDriver.driver.lastName}</h3>
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-500 fill-current" />
                  <span className="text-sm">{matchedDriver.rating} ({matchedDriver.driver.totalRatings} rides)</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Vehicle:</span>
                <span className="text-sm font-medium">
                  {matchedDriver.vehicle.color} {matchedDriver.vehicle.make} {matchedDriver.vehicle.model}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">License Plate:</span>
                <span className="text-sm font-medium">{matchedDriver.vehicle.licensePlate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Estimated Arrival:</span>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span className="text-sm font-medium">{matchedDriver.estimatedArrival} min</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-blue-600" />
            <span className="text-sm font-medium">Pickup:</span>
            <span className="text-sm text-gray-600">{bookingForm.pickupAddress}</span>
          </div>
          <div className="flex items-center gap-2">
            <Navigation size={16} className="text-brand-green" />
            <span className="text-sm font-medium">Destination:</span>
            <span className="text-sm text-gray-600">{bookingForm.destinationAddress}</span>
          </div>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        onClick={() => cancelRideMutation.mutate()}
        disabled={cancelRideMutation.isPending}
        className="w-full"
        data-testid="button-cancel-matched"
      >
        Cancel Ride
      </Button>
    </div>
  );

  const renderPickupStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-blue-600">Driver Arriving</h2>
        <p className="text-gray-600">Your driver is almost here!</p>
      </div>

      <div className="text-center">
        <Badge variant="outline" className="text-lg py-2 px-4">
          <Clock size={16} className="mr-2" />
          2 minutes away
        </Badge>
      </div>

      {matchedDriver && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={24} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{matchedDriver.driver.firstName} {matchedDriver.driver.lastName}</h3>
                <p className="text-sm text-gray-600">
                  {matchedDriver.vehicle.color} {matchedDriver.vehicle.make} {matchedDriver.vehicle.model}
                </p>
                <p className="text-sm font-medium">{matchedDriver.vehicle.licensePlate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">Look for your driver at the pickup location</p>
        <p className="text-xs text-gray-500">You'll be notified when they arrive</p>
      </div>
    </div>
  );

  const renderInProgressStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-brand-green">On Your Way</h2>
        <p className="text-gray-600">Enjoy your ride!</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="text-center">
            <Badge className="bg-brand-green text-white text-lg py-2 px-4">
              <Navigation size={16} className="mr-2" />
              In Progress
            </Badge>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Navigation size={16} className="text-brand-green" />
              <span className="text-sm font-medium">Heading to:</span>
              <span className="text-sm text-gray-600">{bookingForm.destinationAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Estimated arrival:</span>
              <span className="text-sm font-medium">15 minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Distance remaining:</span>
              <span className="text-sm font-medium">3.2 km</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {matchedDriver && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={20} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{matchedDriver.driver.firstName} {matchedDriver.driver.lastName}</h4>
                <p className="text-sm text-gray-600">{matchedDriver.vehicle.licensePlate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderRatingStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-brand-green">Trip Completed!</h2>
        <p className="text-gray-600">How was your ride?</p>
      </div>

      {currentTrip && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Trip fare:</span>
              <span className="text-lg font-bold text-brand-green">${currentTrip.finalPrice || currentTrip.estimatedPrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Distance:</span>
              <span className="text-sm">{currentTrip.distance || '3.2'} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Duration:</span>
              <span className="text-sm">{currentTrip.duration || '18'} minutes</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="text-center space-y-3">
          <Label className="text-blue-600 font-medium">Rate Your Driver</Label>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRatingValue(star)}
                className="focus:outline-none"
                data-testid={`star-${star}`}
              >
                <Star
                  size={32}
                  className={`${
                    star <= ratingValue
                      ? 'text-yellow-500 fill-current'
                      : 'text-gray-300'
                  } hover:text-yellow-400 transition-colors`}
                />
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-600">
            {ratingValue === 5 && 'Excellent!'}
            {ratingValue === 4 && 'Good'}
            {ratingValue === 3 && 'Average'}
            {ratingValue === 2 && 'Poor'}
            {ratingValue === 1 && 'Very Poor'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="comment" className="text-blue-600 font-medium">
            Comment (Optional)
          </Label>
          <textarea
            id="comment"
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
            placeholder="Share your experience..."
            className="w-full p-3 border border-gray-300 rounded-md resize-none"
            rows={3}
            data-testid="textarea-comment"
          />
        </div>

        <div className="space-y-2">
          <Button
            onClick={() => submitRatingMutation.mutate()}
            disabled={submitRatingMutation.isPending}
            className="w-full bg-brand-green text-white py-3 rounded font-semibold hover:bg-green-600"
            data-testid="button-submit-rating"
          >
            {submitRatingMutation.isPending ? 'Submitting...' : 'Submit Rating'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              setCurrentStep('booking');
              setCurrentTrip(null);
              setMatchedDriver(null);
            }}
            className="w-full"
            data-testid="button-skip-rating"
          >
            Skip Rating
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Hello, {(user as any)?.firstName || 'Rider'}!</h1>
            <p className="text-sm text-gray-600">Ready for your next trip?</p>
          </div>
        </div>

        {/* Progress Indicator */}
        {currentStep !== 'booking' && (
          <div className="flex items-center justify-center gap-2 py-2">
            <div className={`w-2 h-2 rounded-full ${currentStep === 'searching' ? 'bg-brand-green' : 'bg-gray-300'}`}></div>
            <div className={`w-2 h-2 rounded-full ${currentStep === 'matched' ? 'bg-brand-green' : 'bg-gray-300'}`}></div>
            <div className={`w-2 h-2 rounded-full ${currentStep === 'pickup' ? 'bg-brand-green' : 'bg-gray-300'}`}></div>
            <div className={`w-2 h-2 rounded-full ${currentStep === 'inprogress' ? 'bg-brand-green' : 'bg-gray-300'}`}></div>
            <div className={`w-2 h-2 rounded-full ${currentStep === 'rating' ? 'bg-brand-green' : 'bg-gray-300'}`}></div>
          </div>
        )}

        {/* Main Content */}
        {currentStep === 'booking' && renderBookingStep()}
        {currentStep === 'searching' && renderSearchingStep()}
        {currentStep === 'matched' && renderMatchedStep()}
        {currentStep === 'pickup' && renderPickupStep()}
        {currentStep === 'inprogress' && renderInProgressStep()}
        {currentStep === 'rating' && renderRatingStep()}
      </div>
    </div>
  );
}