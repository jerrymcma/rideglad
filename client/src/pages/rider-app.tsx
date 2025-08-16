import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Navigation, Clock, Star, CreditCard, User, Car, MessageCircle, Phone, Heart, Trophy, Award } from "lucide-react";
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
  const [showDriverOptions, setShowDriverOptions] = useState(false);
  const [showLiveTripMap, setShowLiveTripMap] = useState(false);
  
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
    if (activeTrip && typeof activeTrip === 'object' && 'status' in activeTrip) {
      const trip = activeTrip as Trip;
      setCurrentTrip(trip);
      
      // Update booking form with trip data
      setBookingForm({
        pickupAddress: trip.pickupAddress || '',
        destinationAddress: trip.destinationAddress || '',
        rideType: trip.rideType || 'driver-1'
      });
      
      switch (trip.status) {
        case 'requested':
          setCurrentStep('searching');
          break;
        case 'matched':
          setCurrentStep('matched');
          // Set matched driver data if not already set
          if (!matchedDriver) {
            const driverData = {
              'driver-1': {
                id: 'mock-driver-1',
                firstName: 'John',
                lastName: 'Driver',
                email: 'driver@rideshare.com',
                vehicle: { make: 'Toyota', model: 'Camry', year: 2022, color: 'Blue', licensePlate: '107' },
                rating: 4.8,
                estimatedArrival: 3
              },
              'driver-2': {
                id: 'mock-driver-2',
                firstName: 'Sarah',
                lastName: 'Wilson',
                email: 'sarah@rideshare.com',
                vehicle: { make: 'Honda', model: 'CR-V', year: 2023, color: 'White', licensePlate: '208' },
                rating: 4.9,
                estimatedArrival: 5
              },
              'driver-3': {
                id: 'mock-driver-3',
                firstName: 'Michael',
                lastName: 'Chen',
                email: 'michael@rideshare.com',
                vehicle: { make: 'BMW', model: '3 Series', year: 2024, color: 'Black', licensePlate: '309' },
                rating: 5.0,
                estimatedArrival: 7
              }
            };

            const selectedDriver = driverData[trip.rideType as keyof typeof driverData] || driverData['driver-1'];
            
            setMatchedDriver({
              driver: {
                id: selectedDriver.id,
                firstName: selectedDriver.firstName,
                lastName: selectedDriver.lastName,
                email: selectedDriver.email,
                profileImageUrl: null,
                phone: '+1234567890',
                userType: 'driver',
                rating: selectedDriver.rating,
                totalRatings: 120,
                isDriverActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              vehicle: {
                id: `vehicle-${trip.rideType}`,
                driverId: selectedDriver.id,
                make: selectedDriver.vehicle.make,
                model: selectedDriver.vehicle.model,
                year: selectedDriver.vehicle.year,
                color: selectedDriver.vehicle.color,
                licensePlate: selectedDriver.vehicle.licensePlate,
                vehicleType: trip.rideType,
                createdAt: new Date(),
              },
              estimatedArrival: selectedDriver.estimatedArrival,
              rating: selectedDriver.rating,
            });
          }
          break;
        case 'pickup':
          setCurrentStep('inprogress');
          // Set matched driver data for pickup step
          if (!matchedDriver) {
            const driverData = {
              'driver-1': {
                id: 'mock-driver-1',
                firstName: 'John',
                lastName: 'Driver',
                email: 'john@rideshare.com',
                vehicle: { make: 'Toyota', model: 'Camry', year: 2023, color: 'Silver', licensePlate: 'ABC123' },
                rating: 4.8,
                estimatedArrival: 3
              },
              'driver-2': {
                id: 'mock-driver-2',
                firstName: 'Sarah',
                lastName: 'Wilson',
                email: 'sarah@rideshare.com',
                vehicle: { make: 'Honda', model: 'Accord', year: 2023, color: 'Blue', licensePlate: '456' },
                rating: 4.9,
                estimatedArrival: 5
              },
              'driver-3': {
                id: 'mock-driver-3',
                firstName: 'Michael',
                lastName: 'Chen',
                email: 'michael@rideshare.com',
                vehicle: { make: 'BMW', model: '3 Series', year: 2024, color: 'Black', licensePlate: '309' },
                rating: 5.0,
                estimatedArrival: 7
              }
            };

            const selectedDriver = driverData[trip.rideType as keyof typeof driverData] || driverData['driver-1'];
            
            setMatchedDriver({
              driver: {
                id: selectedDriver.id,
                firstName: selectedDriver.firstName,
                lastName: selectedDriver.lastName,
                email: selectedDriver.email,
                profileImageUrl: null,
                phone: '+1234567890',
                userType: 'driver',
                rating: selectedDriver.rating,
                totalRatings: 120,
                isDriverActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              vehicle: {
                id: `vehicle-${trip.rideType}`,
                driverId: selectedDriver.id,
                make: selectedDriver.vehicle.make,
                model: selectedDriver.vehicle.model,
                year: selectedDriver.vehicle.year,
                color: selectedDriver.vehicle.color,
                licensePlate: selectedDriver.vehicle.licensePlate,
                vehicleType: trip.rideType,
                createdAt: new Date(),
              },
              estimatedArrival: selectedDriver.estimatedArrival,
              rating: selectedDriver.rating,
            });
          }
          break;
        case 'in_progress':
          setCurrentStep('inprogress');
          // Always ensure matchedDriver data is available for in-progress step
          {
            const driverData = {
              'driver-1': {
                id: 'mock-driver-1',
                firstName: 'John',
                lastName: 'Driver',
                email: 'john@rideshare.com',
                vehicle: { make: 'Toyota', model: 'Camry', year: 2023, color: 'Silver', licensePlate: 'ABC123' },
                rating: 4.8,
                estimatedArrival: 3
              },
              'driver-2': {
                id: 'mock-driver-2',
                firstName: 'Sarah',
                lastName: 'Wilson',
                email: 'sarah@rideshare.com',
                vehicle: { make: 'Honda', model: 'Accord', year: 2023, color: 'Blue', licensePlate: '456' },
                rating: 4.9,
                estimatedArrival: 5
              },
              'driver-3': {
                id: 'mock-driver-3',
                firstName: 'Michael',
                lastName: 'Chen',
                email: 'michael@rideshare.com',
                vehicle: { make: 'BMW', model: '3 Series', year: 2024, color: 'Black', licensePlate: '309' },
                rating: 5.0,
                estimatedArrival: 7
              }
            };

            const selectedDriver = driverData[trip.rideType as keyof typeof driverData] || driverData['driver-1'];
            
            setMatchedDriver({
              driver: {
                id: selectedDriver.id,
                firstName: selectedDriver.firstName,
                lastName: selectedDriver.lastName,
                email: selectedDriver.email,
                profileImageUrl: null,
                phone: '+1234567890',
                userType: 'driver',
                rating: selectedDriver.rating,
                totalRatings: 120,
                isDriverActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              vehicle: {
                id: `vehicle-${trip.rideType}`,
                driverId: selectedDriver.id,
                make: selectedDriver.vehicle.make,
                model: selectedDriver.vehicle.model,
                year: selectedDriver.vehicle.year,
                color: selectedDriver.vehicle.color,
                licensePlate: selectedDriver.vehicle.licensePlate,
                vehicleType: trip.rideType,
                createdAt: new Date(),
              },
              estimatedArrival: selectedDriver.estimatedArrival,
              rating: selectedDriver.rating,
            });
          }
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

  // Reset showDriverOptions when addresses change
  useEffect(() => {
    if (!bookingForm.pickupAddress || !bookingForm.destinationAddress) {
      setShowDriverOptions(false);
    }
  }, [bookingForm.pickupAddress, bookingForm.destinationAddress]);

  // Start new ride - cancel existing trip and reset to booking
  const startNewRideMutation = useMutation({
    mutationFn: async () => {
      if (currentTrip) {
        return await apiRequest('POST', `/api/trips/${currentTrip.id}/cancel`);
      }
    },
    onSuccess: () => {
      setCurrentTrip(null);
      setCurrentStep('booking');
      setShowDriverOptions(false);
      setBookingForm({
        pickupAddress: '',
        destinationAddress: '',
        rideType: 'driver-1'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trips/active'] });
      toast({
        title: "New ride started",
        description: "Enter your pickup and destination.",
      });
    },
  });

  // Request ride mutation
  const requestRideMutation = useMutation({
    mutationFn: async (data: BookingForm) => {
      // Mock coordinates for demo
      const mockCoords = { lat: 40.7128, lng: -74.0060 };
      
      return await apiRequest('POST', '/api/trips', {
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
        title: "Ride requested",
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
      return await apiRequest('POST', `/api/trips/${currentTrip.id}/cancel`);
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
      return await apiRequest('POST', '/api/ratings', {
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
      setShowDriverOptions(false);
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
        // Get selected driver data based on rideType
        const driverData = {
          'driver-1': {
            id: 'mock-driver-1',
            firstName: 'John',
            lastName: 'Driver',
            email: 'driver@rideshare.com',
            vehicle: { make: 'Toyota', model: 'Camry', year: 2022, color: 'Blue', licensePlate: '107' },
            rating: 4.8,
            estimatedArrival: 3
          },
          'driver-2': {
            id: 'mock-driver-2',
            firstName: 'Sarah',
            lastName: 'Wilson',
            email: 'sarah@rideshare.com',
            vehicle: { make: 'Honda', model: 'CR-V', year: 2023, color: 'White', licensePlate: '208' },
            rating: 4.9,
            estimatedArrival: 5
          },
          'driver-3': {
            id: 'mock-driver-3',
            firstName: 'Michael',
            lastName: 'Chen',
            email: 'michael@rideshare.com',
            vehicle: { make: 'BMW', model: '3 Series', year: 2024, color: 'Black', licensePlate: '309' },
            rating: 5.0,
            estimatedArrival: 7
          }
        };

        const selectedDriver = driverData[bookingForm.rideType as keyof typeof driverData];
        
        setMatchedDriver({
          driver: {
            id: selectedDriver.id,
            firstName: selectedDriver.firstName,
            lastName: selectedDriver.lastName,
            email: selectedDriver.email,
            profileImageUrl: null,
            phone: '+1234567890',
            userType: 'driver',
            rating: selectedDriver.rating,
            totalRatings: 120,
            isDriverActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          vehicle: {
            id: `vehicle-${bookingForm.rideType}`,
            driverId: selectedDriver.id,
            make: selectedDriver.vehicle.make,
            model: selectedDriver.vehicle.model,
            year: selectedDriver.vehicle.year,
            color: selectedDriver.vehicle.color,
            licensePlate: selectedDriver.vehicle.licensePlate,
            vehicleType: bookingForm.rideType,
            createdAt: new Date(),
          },
          estimatedArrival: selectedDriver.estimatedArrival,
          rating: selectedDriver.rating,
        });
        setCurrentStep('matched');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [currentStep, bookingForm.rideType]);

  const handleRequestRide = (e?: React.FormEvent) => {
    e?.preventDefault();
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

      <form onSubmit={handleRequestRide} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pickup" className="text-blue-600 font-medium text-base flex items-center gap-2">
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
          <Label htmlFor="destination" className="text-blue-600 font-medium text-base flex items-center gap-2">
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

        {/* Enter button to show driver options when both addresses are filled */}
        {bookingForm.pickupAddress && bookingForm.destinationAddress && !showDriverOptions && (
          <div className="flex justify-center pt-4">
            <Button
              type="button"
              onClick={() => setShowDriverOptions(true)}
              className="bg-blue-600 text-white px-8 py-2 rounded-lg font-semibold hover:bg-blue-700"
              data-testid="button-enter-addresses"
            >
              Enter
            </Button>
          </div>
        )}

        {/* Show driver selection only when Enter button is clicked */}
        {bookingForm.pickupAddress && bookingForm.destinationAddress && showDriverOptions && (
          <div className="space-y-2">
            <Label className="text-blue-600 font-medium text-base flex items-center gap-2">
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
                  <div className="absolute top-1/3 left-[14%] transform -translate-x-1/2 -translate-y-1/2">
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
              <Label className="text-blue-600 font-medium text-base flex items-center gap-2">
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
                            <p className="font-semibold text-gray-900 text-sm">{driver.driverName}</p>
                            <div className="flex items-center gap-1">
                              <Star size={10} className="text-yellow-400 fill-current" />
                              <span className="text-xs font-medium">{driver.rating}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600">{driver.vehicle}</p>
                          <p className="text-xs text-gray-500">{driver.distance} • {driver.eta} away</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-base text-brand-green">{driver.fare}</p>
                        <p className="text-xs text-gray-500">Estimated</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Show request button only when driver options are shown and driver is selected */}
        {showDriverOptions && bookingForm.rideType && (
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={handleRequestRide}
              disabled={requestRideMutation.isPending}
              className="w-48 bg-brand-green text-white text-base py-3 rounded font-semibold hover:bg-green-600"
              data-testid="button-request-ride"
            >
              {requestRideMutation.isPending ? 'Requesting...' : 'Request ride'}
            </Button>
          </div>
        )}
      </form>
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
      <div className="space-y-4 relative">
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
      </div>
    </div>
  );

  const renderMatchedStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2 -mt-4">
        <h2 className="text-2xl font-bold text-brand-green">Driver Found!</h2>
        <p className="text-lg font-bold text-gray-600">Your driver is on the way</p>
      </div>

      {matchedDriver && (
        <Card>
          <CardContent className="pb-4 pt-4 space-y-4">
            <div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <User size={24} className="text-gray-600" />
                </div>
                <div>
                  <div className="flex items-center">
                    <h3 className="font-semibold mr-14 text-blue-600 leading-tight">{matchedDriver.driver.firstName} {matchedDriver.driver.lastName}</h3>
                    <div className="flex items-center gap-1">
                      <Trophy size={14} className="text-yellow-500 fill-current" />
                      <span className="text-xs text-yellow-600 font-medium">Gold Status</span>
                    </div>
                  </div>
                  <div className="flex items-center mt-0.5">
                    <div className="flex items-center gap-1 mr-4">
                      <Star size={14} className="text-yellow-500 fill-current" />
                      <span className="text-sm">{matchedDriver.rating} ({matchedDriver.driver.totalRatings} rides)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award size={14} className="text-blue-500 fill-current" />
                      <span className="text-xs text-blue-600 font-medium">ride certified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">Vehicle:</span>
                <span className="text-sm font-medium">
                  {matchedDriver.vehicle.color} {matchedDriver.vehicle.make} {matchedDriver.vehicle.model}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">License:</span>
                <span className="text-sm font-medium">{matchedDriver.vehicle.licensePlate}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">ETA:</span>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span className="text-sm font-medium">{matchedDriver.estimatedArrival} min</span>
                </div>
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-blue-600" />
                <span className="text-sm text-gray-600 mr-2">Pickup:</span>
                <span className="text-sm font-medium">{bookingForm.pickupAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <Navigation size={16} className="text-brand-green" />
                <span className="text-sm text-gray-600 mr-2">Destination:</span>
                <span className="text-sm font-medium">{bookingForm.destinationAddress}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Driver Location Map */}
      <Card>
        <CardContent className="p-4">
          <div className="w-full h-64 bg-gray-100 rounded-lg border overflow-hidden relative">
            {/* Realistic Map Background */}
            <div className="w-full h-full relative bg-gray-50">
              {/* Street Network */}
              <div className="absolute inset-0">
                {/* Major Streets (Horizontal) */}
                <div className="absolute w-full h-1 bg-gray-300 top-[25%]" />
                <div className="absolute w-full h-1 bg-gray-300 top-[45%]" />
                <div className="absolute w-full h-1 bg-gray-300 top-[65%]" />
                <div className="absolute w-full h-1 bg-gray-300 top-[85%]" />
                
                {/* Major Streets (Vertical) */}
                <div className="absolute h-full w-1 bg-gray-300 left-[20%]" />
                <div className="absolute h-full w-1 bg-gray-300 left-[40%]" />
                <div className="absolute h-full w-1 bg-gray-300 left-[60%]" />
                <div className="absolute h-full w-1 bg-gray-300 left-[80%]" />
                
                {/* Secondary Streets */}
                <div className="absolute w-full h-px bg-gray-200 top-[15%]" />
                <div className="absolute w-full h-px bg-gray-200 top-[35%]" />
                <div className="absolute w-full h-px bg-gray-200 top-[55%]" />
                <div className="absolute w-full h-px bg-gray-200 top-[75%]" />
                <div className="absolute w-full h-px bg-gray-200 top-[95%]" />
                
                <div className="absolute h-full w-px bg-gray-200 left-[10%]" />
                <div className="absolute h-full w-px bg-gray-200 left-[30%]" />
                <div className="absolute h-full w-px bg-gray-200 left-[50%]" />
                <div className="absolute h-full w-px bg-gray-200 left-[70%]" />
                <div className="absolute h-full w-px bg-gray-200 left-[90%]" />
                
                {/* Block Buildings */}
                <div className="absolute w-16 h-10 bg-gray-100 border border-gray-200 top-[16%] left-[22%]" />
                <div className="absolute w-12 h-8 bg-gray-100 border border-gray-200 top-[26%] left-[42%]" />
                <div className="absolute w-20 h-12 bg-gray-100 border border-gray-200 top-[46%] left-[12%]" />
                <div className="absolute w-14 h-9 bg-gray-100 border border-gray-200 top-[66%] left-[62%]" />
                <div className="absolute w-18 h-11 bg-gray-100 border border-gray-200 top-[36%] left-[75%]" />
                
                {/* Parks/Green Spaces */}
                <div className="absolute w-24 h-16 bg-green-100 border border-green-200 rounded-sm top-[56%] left-[25%]" />
                <div className="absolute w-16 h-12 bg-green-100 border border-green-200 rounded-sm top-[10%] left-[65%]" />
              </div>

              {/* Dynamic Driver Position - moves closer over time */}
              {(() => {
                const now = new Date().getTime();
                const tripStart = currentTrip?.matchedAt ? new Date(currentTrip.matchedAt).getTime() : now;
                const elapsed = Math.max(0, now - tripStart);
                const totalETA = (matchedDriver?.estimatedArrival || 3) * 60 * 1000; // Convert to milliseconds
                const progress = Math.min(elapsed / totalETA, 0.95); // Cap at 95% to avoid reaching exactly
                
                // Start position (far) and end position (near rider)
                const startX = 85; // Start far right
                const startY = 20; // Start top
                const endX = 35;   // End near rider
                const endY = 48;   // End near rider
                
                const currentX = startX - (startX - endX) * progress;
                const currentY = startY + (endY - startY) * progress;
                
                return (
                  <div 
                    className="absolute transition-all duration-1000 ease-linear"
                    style={{
                      left: `${currentX}%`,
                      top: `${currentY}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className="bg-white rounded-full p-1.5 border-2 border-brand-green shadow-lg">
                      <Car size={18} className="text-brand-green" />
                    </div>
                    <span className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 text-xs font-medium text-brand-green bg-white px-2 py-1 rounded shadow">
                      {matchedDriver?.driver.firstName || 'Driver'}
                    </span>
                  </div>
                );
              })()}
              
              {/* Your Location (Rider) - Fixed at pickup address */}
              <div className="absolute top-[50%] left-[30%] transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-lg animate-pulse" />
                <span className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 text-xs font-medium text-blue-600 bg-white px-2 py-1 rounded shadow">You</span>
              </div>

              {/* Dynamic Route Line */}
              {(() => {
                const now = new Date().getTime();
                const tripStart = currentTrip?.matchedAt ? new Date(currentTrip.matchedAt).getTime() : now;
                const elapsed = Math.max(0, now - tripStart);
                const totalETA = (matchedDriver?.estimatedArrival || 3) * 60 * 1000;
                const progress = Math.min(elapsed / totalETA, 0.95);
                
                const startX = 85;
                const startY = 20;
                const endX = 30;
                const endY = 50;
                
                const currentX = startX - (startX - endX) * progress;
                const currentY = startY + (endY - startY) * progress;
                
                return (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                      <pattern id="dash" patternUnits="userSpaceOnUse" width="8" height="2">
                        <rect width="4" height="2" fill="#22c55e" />
                        <rect x="4" width="4" height="2" fill="transparent" />
                      </pattern>
                    </defs>
                    <line 
                      x1={`${currentX}%`}
                      y1={`${currentY}%`}
                      x2="30%" 
                      y2="50%" 
                      stroke="url(#dash)" 
                      strokeWidth="2"
                      strokeDasharray="8,4"
                    />
                  </svg>
                );
              })()}
              
              {/* Street Labels */}
              <div className="absolute top-[23%] left-2 text-xs text-gray-500 bg-white px-1 rounded">21st Ave</div>
              <div className="absolute top-[43%] left-2 text-xs text-gray-500 bg-white px-1 rounded">Main St</div>
              <div className="absolute top-[63%] left-2 text-xs text-gray-500 bg-white px-1 rounded">Oak St</div>
              
              {/* Distance Badge - Updates in real time */}
              {(() => {
                const now = new Date().getTime();
                const tripStart = currentTrip?.matchedAt ? new Date(currentTrip.matchedAt).getTime() : now;
                const elapsed = Math.max(0, now - tripStart);
                const totalETA = (matchedDriver?.estimatedArrival || 3) * 60 * 1000;
                const progress = Math.min(elapsed / totalETA, 0.95);
                
                // Start distance 1.2 miles, end distance 0.1 miles
                const startDistance = 1.2;
                const endDistance = 0.1;
                const currentDistance = startDistance - (startDistance - endDistance) * progress;
                const remainingTime = Math.max(1, Math.round((matchedDriver?.estimatedArrival || 3) * (1 - progress)));
                
                return (
                  <div className="absolute top-3 left-3">
                    <div className="bg-white rounded-full px-3 py-1.5 border shadow-sm">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-brand-green" />
                        <span className="text-sm font-medium text-brand-green">
                          {remainingTime} min
                        </span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">
                          {currentDistance.toFixed(1)} mi
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Map Controls */}
              <div className="absolute top-3 right-3 flex flex-col gap-1">
                <button className="w-8 h-8 bg-white rounded border shadow flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm">+</button>
                <button className="w-8 h-8 bg-white rounded border shadow flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm">-</button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Map */}
      <Card className="mx-5">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Live Trip Map</h3>
          <div className="w-full h-64 bg-blue-50 rounded-lg border-2 border-blue-200 overflow-hidden relative">
            {/* Map Background with Streets */}
            <div className="w-full h-full relative bg-gradient-to-br from-blue-50 to-blue-100">
              {/* Street Grid */}
              <div className="absolute inset-0">
                {/* Horizontal Streets */}
                <div className="absolute w-full h-1 bg-gray-400 top-[20%] opacity-60" />
                <div className="absolute w-full h-1 bg-gray-400 top-[40%] opacity-60" />
                <div className="absolute w-full h-1 bg-gray-400 top-[60%] opacity-60" />
                <div className="absolute w-full h-1 bg-gray-400 top-[80%] opacity-60" />
                
                {/* Vertical Streets */}
                <div className="absolute h-full w-1 bg-gray-400 left-[25%] opacity-60" />
                <div className="absolute h-full w-1 bg-gray-400 left-[50%] opacity-60" />
                <div className="absolute h-full w-1 bg-gray-400 left-[75%] opacity-60" />
              </div>

              {/* Pickup Location (Green) */}
              <div className="absolute left-[20%] top-[70%] transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                <div className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap font-medium">
                  Start
                </div>
              </div>

              {/* Destination (Red) */}
              <div className="absolute left-[80%] top-[30%] transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
                <div className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap font-medium">
                  Finish
                </div>
              </div>

              {/* Driver Position (Moving) */}
              {(() => {
                const now = new Date().getTime();
                const tripStart = currentTrip?.matchedAt ? new Date(currentTrip.matchedAt).getTime() : now;
                const elapsed = Math.max(0, now - tripStart);
                const totalETA = (matchedDriver?.estimatedArrival || 5) * 60 * 1000;
                const progress = Math.min(elapsed / totalETA, 0.9);
                
                // Movement from pickup to destination
                const startX = 20;
                const startY = 70;
                const endX = 80;
                const endY = 30;
                
                const currentX = startX + (endX - startX) * progress;
                const currentY = startY + (endY - startY) * progress;
                
                return (
                  <div 
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out"
                    style={{ left: `${currentX}%`, top: `${currentY}%` }}
                  >
                    <div className="relative">
                      <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                        <Car size={16} className="text-white" />
                      </div>
                      <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap font-medium">
                        {matchedDriver?.driver.firstName || 'John'}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Route Path */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <linearGradient id="routePath" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.7" />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#6b7280" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
                <path
                  d="M 20% 70% Q 40% 45% 80% 30%"
                  stroke="url(#routePath)"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="10,5"
                  className="animate-pulse"
                />
              </svg>

              {/* Live ETA Badge */}
              {(() => {
                const now = new Date().getTime();
                const tripStart = currentTrip?.matchedAt ? new Date(currentTrip.matchedAt).getTime() : now;
                const elapsed = Math.max(0, now - tripStart);
                const totalETA = (matchedDriver?.estimatedArrival || 5) * 60 * 1000;
                const progress = Math.min(elapsed / totalETA, 0.9);
                const remainingTime = Math.max(1, Math.round((matchedDriver?.estimatedArrival || 5) * (1 - progress)));
                
                return (
                  <div className="absolute top-4 left-4">
                    <div className="bg-white rounded-lg px-3 py-2 border shadow-md">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-green-600" />
                        <span className="text-sm font-bold text-green-600">
                          {remainingTime} min
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Zoom Controls */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button className="w-9 h-9 bg-white rounded-lg border shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold">+</button>
                <button className="w-9 h-9 bg-white rounded-lg border shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold">-</button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg py-2 px-2 mb-1 mx-20">
        <p className="text-sm text-blue-800 text-center font-medium">Contact your driver</p>
      </div>

      <div className="flex gap-2 -mt-2">
        <Button
          variant="outline"
          className="flex-1 flex items-center gap-1 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
          data-testid="button-message-driver"
        >
          <MessageCircle size={14} />
          Message
        </Button>
        <Button
          variant="outline"
          className="flex-1 flex items-center gap-1 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
          data-testid="button-call-driver"
        >
          <Phone size={14} />
          Call
        </Button>
        <Button
          variant="outline"
          className="flex-1 flex items-center gap-1 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
          data-testid="button-special-assistance"
        >
          <Heart size={14} />
          Assistance
        </Button>
      </div>

      <div className="text-center mt-6">
        <p className="text-sm text-red-800 font-medium">
          Remember: safety is foremost. Be a safe rider.
        </p>
      </div>
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
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{matchedDriver.driver.firstName} {matchedDriver.driver.lastName}</h3>
                  <div className="flex items-center gap-1 ml-3">
                    <Trophy size={14} className="text-yellow-500 fill-current" />
                    <span className="text-xs text-yellow-600 font-medium">Gold Status</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {matchedDriver.vehicle.color} {matchedDriver.vehicle.make} {matchedDriver.vehicle.model}
                </p>
                <p className="text-sm font-medium">{matchedDriver.vehicle.licensePlate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        variant="outline"
        className="w-full flex items-center gap-2"
        data-testid="button-message-driver-pickup"
      >
        <MessageCircle size={16} />
        Send Message
      </Button>

      {/* Test Map - Visible on pickup step */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Trip Map</h3>
          <div className="w-full h-48 bg-blue-50 rounded-lg border-2 border-blue-200 relative">
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
              <div className="text-center">
                <Car size={32} className="text-blue-600 mx-auto mb-2" />
                <p className="text-blue-600 font-medium">Driver on the way</p>
                <p className="text-sm text-gray-500">Map will show live tracking</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">Look for your driver at the pickup location</p>
        <p className="text-xs text-gray-500">You'll be notified when they arrive</p>
      </div>
    </div>
  );

  const renderInProgressStep = () => (
    <div className="space-y-6 -mt-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-brand-green">On Your Way</h2>
        <p className="text-gray-600">Enjoy your ride!</p>
      </div>

      <Card className="mx-5">
        <CardContent className="p-4 space-y-4">
          <div className="text-center">
            <Badge 
              className="bg-brand-green text-white text-lg py-2 px-4 cursor-pointer hover:bg-green-700 transition-colors"
              onClick={() => setShowLiveTripMap(true)}
            >
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
              <span className="text-sm text-gray-600 ml-6">Estimated arrival:</span>
              <span className="text-sm font-medium mr-4">15 minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 ml-6">Distance remaining:</span>
              <span className="text-sm font-medium mr-4">2.0 mi</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mx-5">
        <CardContent className="pb-4 pt-4 space-y-4">
          <div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={24} className="text-gray-600" />
              </div>
              <div>
                <div className="flex items-center">
                  <h3 className="font-semibold mr-4 text-blue-600 leading-tight">{matchedDriver?.driver.firstName || 'John'} {matchedDriver?.driver.lastName || 'Driver'}</h3>
                  <div className="flex items-center gap-1">
                    <Trophy size={14} className="text-yellow-500 fill-current" />
                    <span className="text-xs text-yellow-600 font-medium">Gold Status</span>
                  </div>
                </div>
                <div className="flex items-center mt-0.5">
                  <div className="flex items-center gap-1 mr-4">
                    <Star size={14} className="text-yellow-500 fill-current" />
                    <span className="text-xs whitespace-nowrap" style={{fontSize: '13px'}}><span className="font-bold">{matchedDriver?.rating || '4.8'}</span> ({matchedDriver?.driver.totalRatings || '120'} rides)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award size={16} className="text-blue-500 fill-current" />
                    <span className="text-xs text-blue-600 font-medium">ride Certified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-1 -mt-3">
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">Vehicle:</span>
              <span className="text-sm font-medium">
                {matchedDriver?.vehicle.color || 'Silver'} {matchedDriver?.vehicle.make || 'Toyota'} {matchedDriver?.vehicle.model || 'Camry'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">License:</span>
              <span className="text-sm font-medium">{matchedDriver?.vehicle.licensePlate || 'ABC123'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Map - Only show after clicking In Progress */}
      {showLiveTripMap && (
        <Card className="mx-5 -mt-2">
        <CardContent className="p-4">
          <h3 className="text-base font-semibold mb-3 text-gray-800 text-center">Live Trip Map</h3>
          <div className="w-full h-44 bg-blue-50 rounded-lg border-2 border-blue-200 overflow-hidden relative">
            {/* Map Background with Streets */}
            <div className="w-full h-full relative bg-gradient-to-br from-gray-100 to-gray-200">
              {/* Realistic Street Grid - North American City Pattern */}
              <div className="absolute inset-0">
                {/* Main Arterial Streets (wider, darker) */}
                <div className="absolute w-full h-1.5 bg-gray-500 top-[25%] opacity-80" />
                <div className="absolute w-full h-1.5 bg-gray-500 top-[75%] opacity-80" />
                <div className="absolute h-full w-1.5 bg-gray-500 left-[20%] opacity-80" />
                <div className="absolute h-full w-1.5 bg-gray-500 left-[80%] opacity-80" />
                
                {/* Secondary Streets */}
                <div className="absolute w-full h-0.5 bg-gray-400 top-[15%] opacity-70" />
                <div className="absolute w-full h-0.5 bg-gray-400 top-[35%] opacity-70" />
                <div className="absolute w-full h-0.5 bg-gray-400 top-[50%] opacity-70" />
                <div className="absolute w-full h-0.5 bg-gray-400 top-[65%] opacity-70" />
                <div className="absolute w-full h-0.5 bg-gray-400 top-[85%] opacity-70" />
                
                <div className="absolute h-full w-0.5 bg-gray-400 left-[10%] opacity-70" />
                <div className="absolute h-full w-0.5 bg-gray-400 left-[30%] opacity-70" />
                <div className="absolute h-full w-0.5 bg-gray-400 left-[50%] opacity-70" />
                <div className="absolute h-full w-0.5 bg-gray-400 left-[70%] opacity-70" />
                <div className="absolute h-full w-0.5 bg-gray-400 left-[90%] opacity-70" />
                
                {/* Local Residential Streets (thinner) */}
                <div className="absolute w-full h-px bg-gray-350 top-[42%] opacity-50" />
                <div className="absolute w-full h-px bg-gray-350 top-[58%] opacity-50" />
                <div className="absolute h-full w-px bg-gray-350 left-[40%] opacity-50" />
                <div className="absolute h-full w-px bg-gray-350 left-[60%] opacity-50" />
                
                {/* Diagonal Boulevard (adds realism) */}
                <div className="absolute w-full h-1 bg-gray-450 opacity-60 origin-bottom-left transform rotate-12" style={{top: '10%', left: '-10%', width: '120%'}} />
                
                {/* Small Park/Green Space */}
                <div className="absolute w-8 h-6 bg-green-200 rounded-sm top-[40%] left-[45%] opacity-80" />
                
                {/* Building Blocks (subtle background) */}
                <div className="absolute w-4 h-3 bg-gray-250 top-[28%] left-[15%] opacity-30" />
                <div className="absolute w-5 h-4 bg-gray-250 top-[52%] left-[25%] opacity-30" />
                <div className="absolute w-3 h-5 bg-gray-250 top-[68%] left-[75%] opacity-30" />
                <div className="absolute w-6 h-3 bg-gray-250 top-[78%] left-[55%] opacity-30" />
              </div>

              {/* Destination (Red) */}
              <div className="absolute left-[80%] top-[30%] transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
                <div className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap font-medium">
                  Finish
                </div>
              </div>

              {/* Driver Position (Moving) */}
              {(() => {
                const now = new Date().getTime();
                const tripStart = currentTrip?.matchedAt ? new Date(currentTrip.matchedAt).getTime() : now;
                const elapsed = Math.max(0, now - tripStart);
                const totalETA = (matchedDriver?.estimatedArrival || 5) * 60 * 1000;
                const progress = Math.min(elapsed / totalETA, 0.9);
                
                // Movement from pickup to destination
                const startX = 20;
                const startY = 70;
                const endX = 80;
                const endY = 30;
                
                const currentX = startX + (endX - startX) * progress;
                const currentY = startY + (endY - startY) * progress;
                
                return (
                  <div 
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out"
                    style={{ left: `${currentX}%`, top: `${currentY}%` }}
                  >
                    <div className="relative">
                      <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                        <Car size={16} className="text-white" />
                      </div>
                      <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap font-medium">
                        You
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Route Path */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <linearGradient id="routePath" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.7" />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#6b7280" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
                <path
                  d="M 20% 70% Q 40% 45% 80% 30%"
                  stroke="url(#routePath)"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="10,5"
                  className="animate-pulse"
                />
              </svg>

              {/* Live ETA Badge */}
              {(() => {
                const now = new Date().getTime();
                const tripStart = currentTrip?.matchedAt ? new Date(currentTrip.matchedAt).getTime() : now;
                const elapsed = Math.max(0, now - tripStart);
                const totalETA = (matchedDriver?.estimatedArrival || 5) * 60 * 1000;
                const progress = Math.min(elapsed / totalETA, 0.9);
                const remainingTime = Math.max(1, Math.round((matchedDriver?.estimatedArrival || 5) * (1 - progress)));
                
                return (
                  <div className="absolute top-4 left-4">
                    <div className="bg-white rounded-lg px-3 py-2 border shadow-md">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-green-600" />
                        <span className="text-sm font-bold text-green-600">
                          {remainingTime} min
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Zoom Controls */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button className="w-9 h-9 bg-white rounded-lg border shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold">+</button>
                <button className="w-9 h-9 bg-white rounded-lg border shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold">-</button>
              </div>
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
              <span className="text-sm">{currentTrip.distance ? (parseFloat(currentTrip.distance.toString()) * 0.621371).toFixed(1) : '2.0'} mi</span>
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
        {currentStep === 'booking' && (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">Hello, {(user as any)?.firstName || 'Rider'}!</h1>
              <p className="text-sm text-gray-600">Ready for your next trip?</p>
            </div>
          </div>
        )}

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