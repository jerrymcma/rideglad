import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MapPin, Navigation, Clock, Star, CreditCard, User, Car, MessageCircle, Phone, Heart, Trophy, Award, X, Satellite, Route, Map, ArrowLeft } from "lucide-react";
import RealTimeMap from "@/components/ui/real-time-map";
import TurnByTurnNavigation from "@/components/ui/turn-by-turn-navigation";
import GPSTracker from "@/components/ui/gps-tracker";
import GoogleMap from "@/components/GoogleMap";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getPlacePredictions, getFallbackSuggestions, isGoogleMapsLoaded } from '@/utils/places-api';
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
  const [location, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<RideStep>('booking');
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [matchedDriver, setMatchedDriver] = useState<MatchedDriver | null>(null);
  
  // WebSocket connection for real-time driver updates
  const { isConnected } = useWebSocket({
    onMessage: (message) => {
      switch (message.type) {
        case 'driver_matched':
          toast({
            title: "Driver Found!",
            description: "Your driver is on the way",
          });
          // Refresh active trip to get updated status
          queryClient.invalidateQueries({ queryKey: ['/api/trips/active'] });
          break;
        case 'driver_location':
          // Update driver location on map
          if (message.location) {
            setDriverLocation(message.location);
          }
          break;
        case 'driver_availability_changed':
          // Refresh active drivers list when driver comes online/offline
          queryClient.invalidateQueries({ queryKey: ['/api/drivers/active'] });
          if (currentStep === 'booking') {
            toast({
              title: message.isActive ? "New driver available!" : "Driver went offline",
              description: message.isActive 
                ? `${message.driver?.firstName || 'A driver'} is now available in your area` 
                : `${message.driver?.firstName || 'A driver'} went offline`,
            });
          }
          break;
      }
    }
  });
  const [ratingValue, setRatingValue] = useState(5);
  const [showDriverOptions, setShowDriverOptions] = useState(false);
  const [showLiveTripMap, setShowLiveTripMap] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 31.3271, lng: -89.2903 }); // Default to Hattiesburg
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
    rideType: ''
  });

  // Debounce timer for API calls
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to determine map center based on location
  const determineMapCenter = (address: string) => {
    const lowerAddress = address.toLowerCase();
    
    // Check for Tennessee locations
    if (lowerAddress.includes('germantown') || lowerAddress.includes('memphis')) {
      return { lat: 35.0868, lng: -89.8101 }; // Germantown/Memphis area
    } else if (lowerAddress.includes('nashville')) {
      return { lat: 36.1627, lng: -86.7816 }; // Nashville area
    } else if (lowerAddress.includes('knoxville')) {
      return { lat: 35.9606, lng: -83.9207 }; // Knoxville area
    } else if (lowerAddress.includes('chattanooga')) {
      return { lat: 35.0456, lng: -85.3097 }; // Chattanooga area
    } else if (lowerAddress.includes('biloxi')) {
      return { lat: 30.3960, lng: -88.8853 }; // Biloxi area
    } else {
      return { lat: 31.3271, lng: -89.2903 }; // Default to Hattiesburg
    }
  };

  // Function to get coordinates for pickup location based on address
  const getPickupCoordinates = () => {
    const pickup = bookingForm.pickupAddress.toLowerCase();
    if (pickup.includes('germantown') || pickup.includes('memphis')) {
      return { latitude: 35.0868, longitude: -89.8101 }; // Germantown/Memphis area
    } else if (pickup.includes('nashville')) {
      return { latitude: 36.1627, longitude: -86.7816 }; // Nashville area
    } else if (pickup.includes('knoxville')) {
      return { latitude: 35.9606, longitude: -83.9207 }; // Knoxville area
    } else if (pickup.includes('chattanooga')) {
      return { latitude: 35.0456, longitude: -85.3097 }; // Chattanooga area
    } else if (pickup.includes('biloxi')) {
      return { latitude: 30.3960, longitude: -88.8853 }; // Biloxi area
    } else {
      return { latitude: 31.3271, longitude: -89.2903 }; // Default to Hattiesburg
    }
  };

  // Function to get coordinates for destination location based on address
  const getDestinationCoordinates = () => {
    const destination = bookingForm.destinationAddress.toLowerCase();
    if (destination.includes('germantown') || destination.includes('memphis')) {
      return { latitude: 35.0878, longitude: -89.8111 }; // Slightly offset from pickup
    } else if (destination.includes('nashville')) {
      return { latitude: 36.1637, longitude: -86.7826 }; // Nashville area
    } else if (destination.includes('knoxville')) {
      return { latitude: 35.9616, longitude: -83.9217 }; // Knoxville area
    } else if (destination.includes('chattanooga')) {
      return { latitude: 35.0466, longitude: -85.3107 }; // Chattanooga area
    } else if (destination.includes('biloxi')) {
      return { latitude: 30.3970, longitude: -88.8863 }; // Biloxi area
    } else {
      return { latitude: 31.3371, longitude: -89.2803 }; // Default to Hattiesburg
    }
  };

  // Function to get driver location relative to pickup
  const getDriverLocation = () => {
    const pickup = getPickupCoordinates();
    return {
      latitude: pickup.latitude + 0.008,
      longitude: pickup.longitude + 0.005,
      accuracy: 3,
      timestamp: Date.now(),
      driverId: 'john-driver',
      status: 'approaching' as const,
      speed: 25
    };
  };

  // Function to get nearby driver positions relative to map center
  const getNearbyDriverPositions = (center: { lat: number; lng: number }) => {
    return [
      {
        position: { lat: center.lat + 0.001, lng: center.lng + 0.001 },
        title: "Available Driver - John",
        icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg width="24" height="24" viewBox="0 0 24 24" fill="%233B82F6"%3E%3Cpath d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11C5.84 5 5.28 5.42 5.08 6.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-1.92-5.99z"/%3E%3C/svg%3E'
      },
      {
        position: { lat: center.lat + 0.008, lng: center.lng + 0.005 },
        title: "Available Driver - Sarah",
        icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg width="24" height="24" viewBox="0 0 24 24" fill="%233B82F6"%3E%3Cpath d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11C5.84 5 5.28 5.42 5.08 6.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-1.92-5.99z"/%3E%3C/svg%3E'
      },
      {
        position: { lat: center.lat - 0.007, lng: center.lng + 0.006 },
        title: "Available Driver - Mike",
        icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg width="24" height="24" viewBox="0 0 24 24" fill="%233B82F6"%3E%3Cpath d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11C5.84 5 5.28 5.42 5.08 6.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-1.92-5.99z"/%3E%3C/svg%3E'
      }
    ];
  };

  // Enhanced address suggestion function using Google Places API
  const getAddressSuggestions = async (input: string): Promise<string[]> => {
    if (!input.trim()) return [];
    
    try {
      // Use Google Places API if available, otherwise fallback to Hattiesburg locations
      if (isGoogleMapsLoaded()) {
        const suggestions = await getPlacePredictions(input);
        return suggestions.length > 0 ? suggestions : getFallbackSuggestions(input);
      } else {
        return getFallbackSuggestions(input);
      }
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return getFallbackSuggestions(input);
    }
  };

  const handlePickupChange = (value: string) => {
    setBookingForm(prev => ({ ...prev, pickupAddress: value }));
    
    // Update map center based on pickup location
    if (value.length > 3) {
      const newCenter = determineMapCenter(value);
      setMapCenter(newCenter);
    }
    
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Show suggestions immediately if there's input
    if (value.length > 0) {
      setShowPickupSuggestions(true);
      
      // Debounce API calls to avoid too many requests
      debounceTimerRef.current = setTimeout(async () => {
        const suggestions = await getAddressSuggestions(value);
        setPickupSuggestions(suggestions);
        setShowPickupSuggestions(suggestions.length > 0);
      }, 300);
    } else {
      setPickupSuggestions([]);
      setShowPickupSuggestions(false);
    }
  };

  const handleDestinationChange = (value: string) => {
    setBookingForm(prev => ({ ...prev, destinationAddress: value }));
    
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Show suggestions immediately if there's input
    if (value.length > 0) {
      setShowDestinationSuggestions(true);
      
      // Debounce API calls to avoid too many requests
      debounceTimerRef.current = setTimeout(async () => {
        const suggestions = await getAddressSuggestions(value);
        setDestinationSuggestions(suggestions);
        setShowDestinationSuggestions(suggestions.length > 0);
      }, 300);
    } else {
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
    }
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

  // Get active drivers for ride selection
  const { data: activeDrivers } = useQuery<UserType[]>({
    queryKey: ['/api/drivers/active'],
    refetchInterval: 10000, // Refresh every 10 seconds to show current active drivers
  });

  // Update default rideType when active drivers load
  useEffect(() => {
    if (activeDrivers && Array.isArray(activeDrivers) && activeDrivers.length > 0 && !bookingForm.rideType) {
      setBookingForm(prev => ({ ...prev, rideType: activeDrivers[0].id }));
    }
  }, [activeDrivers, bookingForm.rideType]);

  // Update current step based on active trip  
  useEffect(() => {
    console.log('useEffect running - activeTrip:', activeTrip as Trip | null, 'isManualSimulation:', isManualSimulation);
    
    if (activeTrip && typeof activeTrip === 'object' && 'status' in activeTrip && !isManualSimulation) {
      console.log('Setting step based on trip status:', (activeTrip as Trip).status);
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
            // Fetch actual driver data from database
            const fetchDriverData = async () => {
              try {
                if (trip.driverId) {
                  const driverResponse = await fetch(`/api/users/${trip.driverId}`);
                  const vehicleResponse = await fetch(`/api/vehicles/driver/${trip.driverId}`);
                  
                  if (driverResponse.ok && vehicleResponse.ok) {
                    const driverData = await driverResponse.json();
                    const vehicleData = await vehicleResponse.json();
                    const vehicle = vehicleData[0]; // Get first vehicle
                    
                    if (driverData && vehicle) {
                      setMatchedDriver({
                        driver: {
                          id: driverData.id,
                          firstName: driverData.firstName,
                          lastName: driverData.lastName,
                          email: driverData.email,
                          profileImageUrl: driverData.profileImageUrl,
                          phone: driverData.phone || '+1234567890',
                          userType: 'driver',
                          rating: driverData.rating || 4.8,
                          totalRatings: driverData.totalRatings || 120,
                          isDriverActive: true,
                          stripeCustomerId: driverData.stripeCustomerId,
                          createdAt: new Date(driverData.createdAt),
                          updatedAt: new Date(driverData.updatedAt),
                        },
                        vehicle: {
                          id: vehicle.id,
                          driverId: vehicle.driverId,
                          make: vehicle.make,
                          model: vehicle.model,
                          year: vehicle.year,
                          color: vehicle.color,
                          licensePlate: vehicle.licensePlate,
                          vehicleType: vehicle.vehicleType,
                          createdAt: new Date(vehicle.createdAt),
                        },
                        estimatedArrival: Math.floor(Math.random() * 5) + 3,
                        rating: driverData.rating || 4.8,
                      });
                      return;
                    }
                  }
                }
              } catch (error) {
                console.error('Error fetching driver data:', error);
              }
              
              // Fallback to mock data mapping for mock drivers
              const driverData = {
                'mock-driver-1': {
                  id: 'mock-driver-1',
                  firstName: 'John',
                  lastName: 'Driver',
                  email: 'driver@rideshare.com',
                  vehicle: { make: 'Toyota', model: 'Camry', year: 2022, color: 'Blue', licensePlate: '107' },
                  rating: 4.8,
                  estimatedArrival: 3
                },
                'mock-driver-2': {
                  id: 'mock-driver-2',
                  firstName: 'Sarah',
                  lastName: 'Wilson',
                  email: 'sarah@rideshare.com',
                  vehicle: { make: 'Honda', model: 'CR-V', year: 2023, color: 'White', licensePlate: '208' },
                  rating: 4.9,
                  estimatedArrival: 5
                },
                'mock-driver-3': {
                  id: 'mock-driver-3',
                  firstName: 'Michael',
                  lastName: 'Chen',
                  email: 'michael@rideshare.com',
                  vehicle: { make: 'BMW', model: '3 Series', year: 2024, color: 'Black', licensePlate: '309' },
                  rating: 5.0,
                  estimatedArrival: 7
                }
              };

              const selectedDriver = driverData[trip.driverId as keyof typeof driverData] || driverData['mock-driver-1'];
              
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
                  stripeCustomerId: null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
                vehicle: {
                  id: `vehicle-${selectedDriver.id}`,
                  driverId: selectedDriver.id,
                  make: selectedDriver.vehicle.make,
                  model: selectedDriver.vehicle.model,
                  year: selectedDriver.vehicle.year,
                  color: selectedDriver.vehicle.color,
                  licensePlate: selectedDriver.vehicle.licensePlate,
                  vehicleType: 'standard',
                  createdAt: new Date(),
                },
                estimatedArrival: selectedDriver.estimatedArrival,
                rating: selectedDriver.rating,
              });
            };
            
            fetchDriverData();
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
                stripeCustomerId: null,
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
                stripeCustomerId: null,
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
      if (currentStep === 'inprogress' || (currentTrip?.status === 'completed')) {
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
      const hattiesburgCoords = { lat: 31.3271, lng: -89.2903 };
      
      return await apiRequest('POST', '/api/trips', {
        pickupAddress: data.pickupAddress,
        pickupLat: hattiesburgCoords.lat,
        pickupLng: hattiesburgCoords.lng,
        destinationAddress: data.destinationAddress,
        destinationLat: hattiesburgCoords.lat + 0.01,
        destinationLng: hattiesburgCoords.lng + 0.01,
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
      const tripToCancel = (activeTrip as Trip) || currentTrip;
      if (!tripToCancel?.id) throw new Error('No active trip');
      return await apiRequest('POST', `/api/trips/${tripToCancel.id}/cancel`);
    },
    onSuccess: () => {
      // Clear all trip-related state immediately
      setCurrentTrip(null);
      setMatchedDriver(null);
      setShowDriverOptions(false);
      setCurrentStep('booking');
      
      // Clear the booking form completely
      setBookingForm({
        pickupAddress: '',
        destinationAddress: '',
        rideType: 'driver-1'
      });
      
      // Force clear the query cache completely
      queryClient.removeQueries({ queryKey: ['/api/trips/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      
      toast({
        title: "Ride Cancelled",
        description: "Your ride has been cancelled.",
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
      queryClient.invalidateQueries({ queryKey: ['/api/trips/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/drivers/active-trip'] });
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
            stripeCustomerId: null,
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
    if (!bookingForm.pickupAddress || !bookingForm.destinationAddress) return 5;
    
    // For now, estimate distance based on Hattiesburg area
    // Different locations within Hattiesburg area have approximate distances
    const isUSMTrip = bookingForm.pickupAddress.includes('University') || bookingForm.destinationAddress.includes('University');
    const isAirportTrip = bookingForm.pickupAddress.includes('Airport') || bookingForm.destinationAddress.includes('Airport');
    const isMallTrip = bookingForm.pickupAddress.includes('Mall') || bookingForm.destinationAddress.includes('Mall');
    
    if (isAirportTrip) return 8; // Airport is ~8 miles from downtown
    if (isUSMTrip && isMallTrip) return 6; // USM to Mall is ~6 miles
    if (isUSMTrip) return 4; // USM to downtown is ~4 miles
    
    // Default city trips within Hattiesburg
    return Math.max(2, Math.min(12, Math.random() * 8 + 2));
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
        <h1 className="text-[#285aeb] font-black text-[30px]">Book a ride</h1>
        <p className="text-gray-600 mt-[2px] mb-[2px]">Where would you like to go?</p>
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
            
            {/* Real Google Maps Integration */}
            <div className="relative">
              <GoogleMap 
                center={mapCenter}
                zoom={13}
                className="w-full h-48"
                markers={getNearbyDriverPositions(mapCenter)}
              />
              
              {/* Your Location Overlay */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg animate-pulse" />
                <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-blue-600">You</span>
              </div>
              
              {/* Driver Locations Overlay */}
              {activeDrivers && Array.isArray(activeDrivers) && activeDrivers.slice(0, 3).map((driver: UserType, index: number) => {
                const positions = [
                  { top: '50%', left: '35%', transform: 'translate(-50%, -50%)' },
                  { top: '25%', right: '25%', transform: 'translate(50%, -50%)' },
                  { top: '85%', left: '10%', transform: 'translate(-50%, -50%)' }
                ];
                const position = positions[index] || positions[0];
                
                return (
                  <div
                    key={driver.id}
                    className="absolute"
                    style={{
                      top: position.top,
                      left: position.left,
                      right: position.right,
                      transform: position.transform
                    }}
                  >
                    <span className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-xs text-brand-green font-bold bg-white px-1 py-0.5 rounded shadow">$16.80</span>
                    <div className="bg-white rounded-full p-1 border border-white shadow-md">
                      <Car size={16} className="text-blue-600" />
                    </div>
                    <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-blue-600 font-medium">{driver.firstName}</span>
                  </div>
                );
              })}
            </div>

            {/* Driver Selection */}
            <div className="space-y-2">
              <Label className="text-blue-600 font-medium text-base flex items-center gap-2 py-2">
                <User size={20} />
                Choose your ride {activeDrivers && Array.isArray(activeDrivers) && activeDrivers.length > 0 ? (
                  <Badge variant="secondary" className="ml-2">{activeDrivers.length} online</Badge>
                ) : null}
              </Label>
              
              {/* Show active drivers */}
              {activeDrivers && Array.isArray(activeDrivers) && activeDrivers.length > 0 ? (
                activeDrivers.map((driver: UserType, index: number) => (
                  <Card 
                    key={driver.id}
                    className={`cursor-pointer transition-all ${bookingForm.rideType === driver.id ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                    onClick={() => setBookingForm(prev => ({ ...prev, rideType: driver.id }))}
                    data-testid={`card-driver-${driver.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            index % 3 === 0 ? 'bg-blue-600' : 
                            index % 3 === 1 ? 'bg-purple-600' : 'bg-gray-800'
                          }`}>
                            <User size={20} className="text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <p className="font-medium text-sm">{driver.firstName}</p>
                              {user && driver.id === user.id ? (
                                <Badge variant="secondary" className="text-xs">You</Badge>
                              ) : null}
                            </div>
                            <p className="text-xs text-gray-600">Available Driver</p>
                            <div className="flex items-center mt-1">
                              <Star size={12} className="text-yellow-400 mr-1" />
                              <span className="text-xs text-gray-600">{driver.rating || '4.9'} • {(Math.random() * 3 + 1.5).toFixed(1)} mi away</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-brand-green">$16.80</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-gray-500">No drivers currently online</p>
                    <p className="text-xs text-gray-400 mt-1">Please try again in a few moments</p>
                  </CardContent>
                </Card>
              )}
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
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 w-48 bg-brand-green text-white py-3 rounded font-semibold hover:bg-green-600 text-[18px]"
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
    <div className="space-y-4">
      <div className="text-center space-y-1 -mt-4 mb-1">
        <h2 className="text-2xl font-bold text-brand-green">Driver Found!</h2>
        <p className="text-lg font-bold text-gray-600">Your driver is on the way</p>
      </div>

      {/* Live Tracking Map */}
      <Card>
        <CardContent className="px-4 pt-1 pb-6">
          <h3 className="text-lg font-bold mb-1 text-blue-600 text-center">Live Tracking</h3>
          <RealTimeMap 
            userLocation={{ ...getPickupCoordinates(), accuracy: 5, timestamp: Date.now() }}
            driverLocation={getDriverLocation()}
            destination={{ ...getDestinationCoordinates(), accuracy: 5, timestamp: Date.now() }}
            showTraffic={true}
            showRoute={true}
            mapStyle="streets"
            className="w-full h-[28rem]"
            onDriverContact={(type) => {
              if (type === 'call') {
                toast({ title: "Calling driver...", description: "Connecting you to John" });
              } else {
                toast({ title: "Message sent", description: "Your message was sent to the driver" });
              }
            }}
          />
        </CardContent>
      </Card>

      {matchedDriver && (
        <Card>
          <CardContent className="pb-6 pt-4 space-y-4">
            <div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center">
                  <User size={28} className="text-gray-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-blue-600 leading-tight text-base">{matchedDriver.driver.firstName} {matchedDriver.driver.lastName}</h3>
                    <div className="flex items-center gap-1">
                      <Trophy size={16} className="text-yellow-500 fill-current" />
                      <span className="text-sm text-yellow-600 font-medium">Gold Status</span>
                    </div>
                  </div>
                  <div className="flex items-center mt-1">
                    <div className="flex items-center gap-1 mr-3">
                      <Star size={16} className="text-yellow-500 fill-current" />
                      <span className="text-sm font-semibold">{matchedDriver.rating} ({matchedDriver.driver.totalRatings} rides)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award size={16} className="text-blue-500 fill-current" />
                      <span className="text-sm text-blue-600 font-medium">ride Certified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator className="my-2" />
            
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-gray-800 mr-2 font-medium">Vehicle:</span>
                <span className="text-sm font-medium">
                                  {matchedDriver.vehicle.color} {matchedDriver.vehicle.make} {matchedDriver.vehicle.model}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-800 mr-2 font-medium">License:</span>
                <span className="text-sm font-medium">{matchedDriver.vehicle.licensePlate}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2 font-bold">ETA:</span>
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  <span className="text-sm font-bold">{matchedDriver.estimatedArrival} minutes</span>
                </div>
              </div>
              
              <Separator className="my-3" />
              
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-blue-600" />
                <span className="text-sm text-gray-600 mr-2 font-bold">Pickup:</span>
                <span className="text-sm font-medium">{bookingForm.pickupAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <Navigation size={18} className="text-brand-green" />
                <span className="text-sm text-gray-600 mr-2 font-bold">Destination:</span>
                <span className="text-sm font-medium">{bookingForm.destinationAddress}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}



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

      {/* Cancel Ride Button with Confirmation */}
      <div className="mt-1 flex justify-center">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-28 flex items-center gap-2 text-gray-600 border-gray-200 hover:bg-gray-50 text-[13px]"
              data-testid="button-cancel-ride"
            >
              <X size={16} />
              Cancel Ride
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel your ride?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this ride? This action cannot be undone and your driver may have already started heading to your location.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep ride</AlertDialogCancel>
              <AlertDialogAction
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
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-confirm-cancel"
              >
                Yes, cancel ride
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
            setCurrentStep('rating');
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
      {/* Back button */}
      <div className="flex items-center">
        <Button
          onClick={() => {
            if (currentTrip) {
              // Cancel the trip and go back to booking
              cancelRideMutation.mutate();
            } else {
              setLocation('/');
            }
          }}
          variant="ghost"
          className="p-3 hover:bg-gray-100 rounded-full"
          data-testid="button-back-pickup"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </Button>
      </div>
      
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
    <div className="space-y-4 -mt-12">
      <div className="text-center space-y-2 mb-2">
        <h2 className="font-bold text-brand-green text-[26px]">On Your Way!</h2>
        <p className="text-black font-bold text-lg">Enjoy your ride!</p>
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
              <span className="text-sm font-bold">Address:</span>
              <span className="text-sm text-gray-800">{bookingForm.destinationAddress}</span>
            </div>
            <div className="flex">
              <span className="text-sm text-gray-800 ml-6">Estimated arrival:</span>
              <span className="text-sm font-bold ml-4">15 min</span>
            </div>
            <div className="flex">
              <span className="text-sm text-gray-800 ml-6">Distance remaining:</span>
              <span className="text-sm font-bold ml-4">2.0 mi</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mx-5">
        <CardContent className="pb-6 pt-4 space-y-4">
          <div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={28} className="text-gray-600" />
              </div>
              <div>
                <div className="flex items-center">
                  <h3 className="font-semibold mr-4 text-blue-600 leading-tight text-base">{matchedDriver?.driver.firstName || 'John'} {matchedDriver?.driver.lastName || 'Driver'}</h3>
                  <div className="flex items-center gap-1">
                    <Trophy size={16} className="text-yellow-500 fill-current" />
                    <span className="text-sm text-yellow-600 font-medium">Gold Status</span>
                  </div>
                </div>
                <div className="flex items-center mt-1">
                  <div className="flex items-center gap-1 mr-4">
                    <Star size={16} className="text-yellow-500 fill-current" />
                    <span className="text-sm whitespace-nowrap font-semibold">{matchedDriver?.rating || '4.8'} ({matchedDriver?.driver.totalRatings || '120'} rides)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award size={16} className="text-blue-500 fill-current" />
                    <span className="text-sm text-blue-600 font-medium">ride Certified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-sm text-gray-800 mr-2 font-medium">Vehicle:</span>
              <span className="text-sm font-medium">
                {matchedDriver?.vehicle.color || 'Silver'} {matchedDriver?.vehicle.make || 'Toyota'} {matchedDriver?.vehicle.model || 'Camry'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-800 mr-2 font-medium">License:</span>
              <span className="text-sm font-medium">{matchedDriver?.vehicle.licensePlate || 'ABC123'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Google Maps - Only show after clicking In Progress */}
      {showLiveTripMap && (
        <Card className="mx-5 -mt-4">
          <CardContent className="px-4 pt-2 pb-6">
            <h3 className="text-lg font-bold mb-1 text-blue-600 text-center">Live Trip Map</h3>
            <div className="w-full h-96 rounded-lg overflow-hidden relative">
              <RealTimeMap
                className="w-full h-full"
                userLocation={currentTrip ? { lat: currentTrip.pickupLat, lng: currentTrip.pickupLng } : undefined}
                destination={currentTrip ? { lat: currentTrip.destinationLat, lng: currentTrip.destinationLng } : undefined}
                driverLocation={matchedDriver ? {
                  lat: currentTrip?.pickupLat || 31.3271,
                  lng: currentTrip?.pickupLng || -89.2903,
                  speed: 25,
                  heading: 90
                } : undefined}
                showRoute={true}
                estimatedArrival={matchedDriver?.estimatedArrival}
                onDriverContact={(type) => {
                  if (type === 'call') {
                    console.log('Calling driver...');
                  } else if (type === 'message') {
                    console.log('Messaging driver...');
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderRatingStep = () => (
    <div className="space-y-4">
      <div className="text-center space-y-3">
        <h2 className="font-bold text-[26px] text-[#16c4a3]">Trip Completed!</h2>
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 space-y-2 mx-4">
          <p className="font-semibold text-[#214bd1]">Thank you for choosing ride.</p>
          <p className="text-blue-700 text-sm">We look forward to serving you soon.</p>
        </div>
      </div>

      {currentTrip && (
        <div className="flex justify-center">
          <Card className="max-w-xs">
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
                <span className="text-sm">{currentTrip.duration || '18'} min</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-4">
        <div className="text-center space-y-3">
          <Label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-blue-600 text-[16px] font-semibold">Rate Your Driver</Label>
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
          <p className="text-sm text-[#131317]">
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

        <div className="space-y-2 flex flex-col items-center">
          <Button
            onClick={() => submitRatingMutation.mutate()}
            disabled={submitRatingMutation.isPending}
            className="w-36 bg-brand-green text-white py-3 rounded font-semibold hover:bg-green-600"
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
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-36 text-[#4d4141] font-normal"
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
          <div className="space-y-4">
            {/* Back button */}
            <div className="flex items-center">
              <Button
                onClick={() => setLocation('/')}
                variant="ghost"
                className="p-3 hover:bg-gray-100 rounded-full"
                data-testid="button-back"
              >
                <ArrowLeft size={24} className="text-gray-600" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[19px] font-bold">Hello, {(user as any)?.firstName || 'Rider'}!</h1>
                <p className="text-gray-600 text-[15px] mt-[2px] mb-[2px]">Ready for your next trip</p>
              </div>
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
      
      {/* Fixed Back Button - Bottom Left */}
      <Button
        onClick={() => setLocation('/')}
        variant="outline"
        className="fixed bottom-6 left-6 p-3 rounded-full bg-white border-2 border-gray-300 hover:bg-gray-50 shadow-lg"
        data-testid="button-back-fixed"
      >
        <ArrowLeft size={20} className="text-gray-600" />
      </Button>
    </div>
  );
}