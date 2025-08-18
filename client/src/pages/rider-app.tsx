import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Navigation, Clock, Star, CreditCard, User, Car, MessageCircle, Phone, Heart, Trophy, Award, X, Satellite, Route, Map } from "lucide-react";
import RealTimeMap from "@/components/ui/real-time-map";
import TurnByTurnNavigation from "@/components/ui/turn-by-turn-navigation";
import GPSTracker from "@/components/ui/gps-tracker";
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
  const [showDriverOptions, setShowDriverOptions] = useState(false);
  const [showLiveTripMap, setShowLiveTripMap] = useState(false);
  const [showGPSTracker, setShowGPSTracker] = useState(false);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [currentSpeed, setCurrentSpeed] = useState(25);
  const [navigationSteps, setNavigationSteps] = useState<any[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState<string[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<string[]>([]);
  const [isManualSimulation, setIsManualSimulation] = useState(false);

  console.log('RiderApp component is rendering');
  console.log('Current step:', currentStep);
  console.log('Is manual simulation:', isManualSimulation);
  
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    pickupAddress: '',
    destinationAddress: '',
    rideType: 'driver-1'
  });

  // Common location suggestions
  const commonLocations = [
    "123 Main Street, San Francisco, CA",
    "456 Market Street, San Francisco, CA", 
    "789 Union Square, San Francisco, CA",
    "321 Mission Bay Blvd, San Francisco, CA",
    "654 Valencia Street, San Francisco, CA",
    "987 Castro Street, San Francisco, CA",
    "147 Lombard Street, San Francisco, CA",
    "258 Chinatown, San Francisco, CA",
    "369 Fisherman's Wharf, San Francisco, CA",
    "741 Golden Gate Park, San Francisco, CA",
    "852 Nob Hill, San Francisco, CA",
    "963 SOMA District, San Francisco, CA",
    "159 Financial District, San Francisco, CA",
    "357 Hayes Valley, San Francisco, CA",
    "468 Pacific Heights, San Francisco, CA"
  ];

  const filterSuggestions = (input: string) => {
    if (!input.trim()) return [];
    return commonLocations.filter(location => 
      location.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 5);
  };

  const handlePickupChange = (value: string) => {
    setBookingForm(prev => ({ ...prev, pickupAddress: value }));
    const suggestions = filterSuggestions(value);
    setPickupSuggestions(suggestions);
    setShowPickupSuggestions(value.length > 0 && suggestions.length > 0);
  };

  const handleDestinationChange = (value: string) => {
    setBookingForm(prev => ({ ...prev, destinationAddress: value }));
    const suggestions = filterSuggestions(value);
    setDestinationSuggestions(suggestions);
    setShowDestinationSuggestions(value.length > 0 && suggestions.length > 0);
  };

  const selectSuggestion = (field: keyof BookingForm, suggestion: string) => {
    setBookingForm(prev => ({ ...prev, [field]: suggestion }));
    if (field === 'pickupAddress') {
      setShowPickupSuggestions(false);
    } else if (field === 'destinationAddress') {
      setShowDestinationSuggestions(false);
    }
  };

  // Get current active trip
  const { data: activeTrip, refetch: refetchTrip } = useQuery({
    queryKey: ['/api/trips/active'],
    enabled: !!user,
    refetchInterval: currentStep !== 'booking' && currentStep !== 'completed' && currentStep !== 'rating' ? 3000 : false,
  });

  // Get last completed trip for rating
  const { data: lastCompletedTrip } = useQuery({
    queryKey: ['/api/trips'],
    enabled: !!user && currentStep === 'rating',
    select: (trips: Trip[]) => trips.find(trip => trip.status === 'completed'),
  });

  // Update current step based on active trip  
  useEffect(() => {
    console.log('useEffect running - activeTrip:', activeTrip, 'isManualSimulation:', isManualSimulation);
    // COMPLETELY DISABLE automatic step updates for now
    return;
    if (activeTrip && typeof activeTrip === 'object' && 'status' in activeTrip && !isManualSimulation) {
      console.log('Setting step based on trip status:', activeTrip.status);
      const trip = activeTrip as Trip;
      setCurrentTrip(trip);
      
      // Reset live map state for all step changes
      setShowLiveTripMap(false);
      
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
          setCurrentStep('pickup');
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
        case 'rating_pending':
          setCurrentStep('rating');
          break;
        default:
          setCurrentStep('booking');
      }
    } else {
      // Check if we should be in rating state (recently completed trip)
      // This happens when active trip API returns null but we just completed a trip
      if (currentStep === 'inprogress' || (currentTrip && currentTrip.status === 'completed')) {
        setCurrentStep('rating');
      } else if (currentStep !== 'rating' && currentStep !== 'completed') {
        // Only reset to booking if we're not in rating or completed state
        setCurrentStep('booking');
      }
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
      });
    },
    onSuccess: () => {
      setCurrentStep('booking');
      setCurrentTrip(null);
      setMatchedDriver(null);
      setRatingValue(5);
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

  // Calculate real trip price based on pickup and destination
  const calculateTripDistance = () => {
    // Simple distance calculation for demo - in real app would use Google Maps API
    if (!bookingForm.pickupAddress || !bookingForm.destinationAddress) return 5;
    
    // Mock calculation based on address length as approximation
    const pickup = bookingForm.pickupAddress.length;
    const destination = bookingForm.destinationAddress.length;
    return Math.max(2, Math.min(15, Math.abs(pickup - destination) / 5 + 3));
  };

  const getRideTypePrice = (type: string) => {
    const tripDistance = calculateTripDistance();
    const baseFare = 2.00;
    const perMileRate = 0.40;
    
    // Add driver distance premium based on how far driver is from pickup
    let driverDistancePremium = 0;
    switch (type) {
      case 'driver-1': // John - 2 min away (closest)
        driverDistancePremium = 0; // No premium for closest driver
        break;
      case 'driver-2': // Sarah - 4 min away 
        driverDistancePremium = 0.50; // Small premium for moderate distance
        break;
      case 'driver-3': // Mike - 3 min away
        driverDistancePremium = 0.25; // Small premium for medium distance
        break;
      default:
        driverDistancePremium = 0;
    }
    
    const totalPrice = baseFare + (tripDistance * perMileRate) + driverDistancePremium;
    return `$${totalPrice.toFixed(2)}`;
  };

  const renderBookingStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-bold text-[#285aeb] text-[32px]">Book a ride</h1>
        <p className="text-gray-600 mt-[2px] mb-[2px]">Where would you like to go</p>
      </div>

      <form onSubmit={handleRequestRide} className="space-y-4">
        <div className="space-y-2 relative">
          <Label htmlFor="pickup" className="text-blue-600 font-medium text-base flex items-center gap-2">
            <MapPin size={16} />
            Pickup Location
          </Label>
          <Input
            id="pickup"
            value={bookingForm.pickupAddress}
            onChange={(e) => handlePickupChange(e.target.value)}
            placeholder="Enter pickup address"
            className="border border-gray-300 rounded"
            data-testid="input-pickup"
          />
          {showPickupSuggestions && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-b-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              {pickupSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => selectSuggestion('pickupAddress', suggestion)}
                  data-testid={`suggestion-pickup-${index}`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="text-sm">{suggestion}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 relative">
          <Label htmlFor="destination" className="text-blue-600 font-medium text-base flex items-center gap-2">
            <Navigation size={16} />
            Destination
          </Label>
          <Input
            id="destination"
            value={bookingForm.destinationAddress}
            onChange={(e) => handleDestinationChange(e.target.value)}
            placeholder="Enter destination address"
            className="border border-gray-300 rounded"
            data-testid="input-destination"
          />
          {showDestinationSuggestions && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-b-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              {destinationSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => selectSuggestion('destinationAddress', suggestion)}
                  data-testid={`suggestion-destination-${index}`}
                >
                  <div className="flex items-center gap-2">
                    <Navigation size={14} className="text-gray-400" />
                    <span className="text-sm">{suggestion}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                <div className="w-full h-full bg-gradient-to-br from-blue-50 via-gray-50 to-green-50 relative">
                  {/* Realistic City Map Elements */}
                  <div className="absolute inset-0">
                    {/* Main Highway - Horizontal */}
                    <div className="absolute top-[40%] left-0 w-full h-2 bg-gray-500 opacity-70"></div>
                    <div className="absolute top-[40%] left-0 w-full h-0.5 bg-yellow-300 opacity-80"></div>
                    
                    {/* Main Avenue - Vertical */}
                    <div className="absolute left-[50%] top-0 w-2 h-full bg-gray-500 opacity-70"></div>
                    <div className="absolute left-[50%] top-0 w-0.5 h-full bg-yellow-300 opacity-80"></div>
                    
                    {/* Secondary Streets */}
                    <div className="absolute top-[20%] left-0 w-full h-1 bg-gray-400 opacity-50"></div>
                    <div className="absolute top-[60%] left-0 w-full h-1 bg-gray-400 opacity-50"></div>
                    <div className="absolute top-[80%] left-0 w-full h-1 bg-gray-400 opacity-50"></div>
                    
                    <div className="absolute left-[25%] top-0 w-1 h-full bg-gray-400 opacity-50"></div>
                    <div className="absolute left-[75%] top-0 w-1 h-full bg-gray-400 opacity-50"></div>
                    
                    {/* City Blocks - Buildings */}
                    <div className="absolute top-[5%] left-[5%] w-16 h-12 bg-blue-200 opacity-60 rounded-sm"></div>
                    <div className="absolute top-[5%] left-[55%] w-20 h-16 bg-blue-200 opacity-60 rounded-sm"></div>
                    <div className="absolute top-[45%] left-[5%] w-18 h-10 bg-blue-200 opacity-60 rounded-sm"></div>
                    <div className="absolute top-[45%] left-[55%] w-16 h-14 bg-blue-200 opacity-60 rounded-sm"></div>
                    <div className="absolute top-[65%] left-[25%] w-14 h-8 bg-blue-200 opacity-60 rounded-sm"></div>
                    <div className="absolute top-[65%] left-[60%] w-18 h-12 bg-blue-200 opacity-60 rounded-sm"></div>
                    
                    {/* Parks and Green Spaces */}
                    <div className="absolute top-[25%] left-[55%] w-16 h-12 bg-green-300 opacity-60 rounded-lg"></div>
                    <div className="absolute top-[5%] right-[5%] w-12 h-12 bg-green-300 opacity-60 rounded-full"></div>
                    
                    {/* River/Water Feature */}
                    <div className="absolute bottom-[5%] left-0 w-full h-6 bg-blue-300 opacity-50 rounded-lg"></div>
                  </div>
                  
                  {/* Your Location */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg animate-pulse" />
                    <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-blue-600">You</span>
                  </div>
                  
                  {/* Driver Locations */}
                  {/* John - Closest (2 min away) */}
                  <div className="absolute top-1/2 left-[35%] transform -translate-x-1/2 -translate-y-1/2">
                    <span className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-xs text-brand-green font-bold bg-white px-1 py-0.5 rounded shadow">{getRideTypePrice('driver-1')}</span>
                    <div className="bg-white rounded-full p-1 border border-white shadow-md">
                      <Car size={16} className="text-blue-600" />
                    </div>
                    <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-blue-600 font-medium">John</span>
                  </div>
                  
                  {/* Mike - Medium distance (3 min away) */}
                  <div className="absolute top-[25%] right-[25%] transform translate-x-1/2 -translate-y-1/2">
                    <span className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-xs text-brand-green font-bold bg-white px-1 py-0.5 rounded shadow">{getRideTypePrice('driver-3')}</span>
                    <div className="bg-white rounded-full p-1 border border-white shadow-md">
                      <Car size={16} className="text-blue-600" />
                    </div>
                    <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-blue-600 font-medium">Mike</span>
                  </div>
                  
                  {/* Sarah - Farthest (4 min away) */}
                  <div className="absolute top-[85%] left-[10%] transform -translate-x-1/2 -translate-y-1/2">
                    <span className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-xs text-brand-green font-bold bg-white px-1 py-0.5 rounded shadow">{getRideTypePrice('driver-2')}</span>
                    <div className="bg-white rounded-full p-1 border border-white shadow-md">
                      <Car size={16} className="text-blue-600" />
                    </div>
                    <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-blue-600 font-medium">Sarah</span>
                  </div>
                </div>
                
                {/* Map Controls */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  <button className="w-8 h-8 bg-white rounded border shadow flex items-center justify-center text-gray-600 hover:bg-gray-50">+</button>
                  <button className="w-8 h-8 bg-white rounded border shadow flex items-center justify-center text-gray-600 hover:bg-gray-50">-</button>
                </div>
              </div>
            </div>

            {/* Driver Selection */}
            <div className="space-y-2">
              <Label className="text-blue-600 font-medium text-base flex items-center gap-2 py-2">
                <User size={20} />
                Choose your ride
              </Label>
              
              {/* John */}
              <Card 
                className={`cursor-pointer transition-all ${bookingForm.rideType === 'driver-1' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                onClick={() => setBookingForm(prev => ({ ...prev, rideType: 'driver-1' }))}
                data-testid="card-driver-john"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <User size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">John</p>
                        <p className="text-xs text-gray-600">White Toyota Camry</p>
                        <div className="flex items-center mt-1">
                          <Star size={12} className="text-yellow-400 mr-1" />
                          <span className="text-xs text-gray-600">4.8 • 2 min away</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-brand-green">{getRideTypePrice('driver-1')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sarah */}
              <Card 
                className={`cursor-pointer transition-all ${bookingForm.rideType === 'driver-2' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                onClick={() => setBookingForm(prev => ({ ...prev, rideType: 'driver-2' }))}
                data-testid="card-driver-sarah"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                        <User size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Sarah</p>
                        <p className="text-xs text-gray-600">Silver Honda Accord</p>
                        <div className="flex items-center mt-1">
                          <Star size={12} className="text-yellow-400 mr-1" />
                          <span className="text-xs text-gray-600">4.9 • 4 min away</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-brand-green">{getRideTypePrice('driver-2')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mike */}
              <Card 
                className={`cursor-pointer transition-all ${bookingForm.rideType === 'driver-3' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                onClick={() => setBookingForm(prev => ({ ...prev, rideType: 'driver-3' }))}
                data-testid="card-driver-mike"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                        <User size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Mike</p>
                        <p className="text-xs text-gray-600">Black BMW 3 Series</p>
                        <div className="flex items-center mt-1">
                          <Star size={12} className="text-yellow-400 mr-1" />
                          <span className="text-xs text-gray-600">5.0 • 3 min away</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-brand-green">{getRideTypePrice('driver-3')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        )}

        {/* Show request button only when driver options are shown */}
        {showDriverOptions && (
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
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-blue-600 leading-tight">{matchedDriver.driver.firstName} {matchedDriver.driver.lastName}</h3>
                    <div className="flex items-center gap-1">
                      <Trophy size={14} className="text-yellow-500 fill-current" />
                      <span className="text-xs text-yellow-600 font-medium">Gold Status</span>
                    </div>
                  </div>
                  <div className="flex items-center mt-0.5">
                    <div className="flex items-center gap-1 mr-2">
                      <Star size={14} className="text-yellow-500 fill-current" />
                      <span className="text-[13px] font-semibold">{matchedDriver.rating} ({matchedDriver.driver.totalRatings} rides)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award size={14} className="text-blue-500 fill-current" />
                      <span className="text-xs text-blue-600 font-medium">ride Certified</span>
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



      <div className="bg-blue-50 border border-blue-200 rounded-lg py-2 px-2 mb-1 mx-20">
        <p className="text-sm text-blue-800 text-center font-medium">Contact your driver</p>
      </div>

      <div className="flex gap-2 -mt-8">
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

      {/* Cancel Ride Button */}
      <div className="mt-1 flex justify-center">
        <Button
          variant="outline"
          className="w-28 flex items-center gap-2 text-gray-600 border-gray-200 hover:bg-gray-50 text-[13px]"
          onClick={async () => {
            try {
              await apiRequest('POST', `/api/trips/${currentTrip?.id}/cancel`);
              setCurrentStep('booking');
              setCurrentTrip(null);
              setMatchedDriver(null);
              toast({
                title: "Ride cancelled",
                description: "Your ride has been cancelled successfully."
              });
              queryClient.invalidateQueries({ queryKey: ['/api/trips/active'] });
            } catch (error: any) {
              if (isUnauthorizedError(error)) {
                toast({
                  title: "Session expired",
                  description: "Please log in again.",
                  variant: "destructive"
                });
                return;
              }
              toast({
                title: "Error",
                description: "Failed to cancel ride. Please try again.",
                variant: "destructive"
              });
            }
          }}
          data-testid="button-cancel-ride"
        >
          <X size={16} />
          Cancel Ride
        </Button>
      </div>
      
      {/* Simulation controls */}
      <div className="mt-3 flex justify-center gap-2">
        <Button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 text-sm"
          onClick={() => {
            setIsManualSimulation(true);
            setCurrentStep('inprogress');
            setCurrentTrip(prev => prev ? {...prev, status: 'inprogress'} : null);
          }}
        >
          → Trip Started
        </Button>
        <Button
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 text-sm"
          onClick={() => {
            setIsManualSimulation(true);
            setCurrentStep('completed');
          }}
        >
          → Trip Complete
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
        <h2 className="text-2xl font-bold text-blue-600">Driver Arriving</h2>
        <p className="text-gray-600">Your driver is almost here!</p>
      </div>

      <div className="text-center">
        <Badge variant="outline" className="text-base py-2 px-4">
          <Clock size={14} className="mr-2" />
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
        <p className="text-base text-gray-800 font-medium">Look for your driver at the pickup location</p>
        <p className="text-sm text-gray-700">You'll be notified when they arrive</p>
      </div>

      <Button
        variant="outline"
        className="w-3/4 mx-auto flex items-center gap-2 border-gray-400"
        data-testid="button-message-driver-pickup"
      >
        <MessageCircle size={16} />
        Send Message
      </Button>
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
      <div className="text-center space-y-4">
        <h2 className="text-xl font-bold text-brand-green">Trip Completed!</h2>
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 space-y-2 mx-4">
          <p className="text-blue-800 font-semibold">Thank you for choosing Ride!</p>
          <p className="text-blue-700 text-sm">We appreciate your trust in us and look forward to serving you again soon.</p>
        </div>
      </div>

      {currentTrip && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Trip fare:</span>
              <span className="text-sm font-bold text-brand-green">${currentTrip.finalPrice || currentTrip.estimatedPrice}</span>
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

        {/* Add Comment Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => console.log('Navigate to comment page')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 transition-colors"
            data-testid="button-add-comment"
          >
            + Add a comment about your trip
          </button>
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
              <h1 className="text-[19px] font-bold">Hello, {(user as any)?.firstName || 'Rider'}!</h1>
              <p className="text-gray-600 text-[15px]">Ready for your next trip</p>
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