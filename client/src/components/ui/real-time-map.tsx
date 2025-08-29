import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from './button';
import { MapPin, Navigation, Clock, Zap, AlertTriangle, Phone, MessageCircle } from 'lucide-react';
import { HATTIESBURG_CENTER } from '@/utils/hattiesburg-locations';

// Google Maps type declarations are handled by @types/google.maps

// Define interfaces for type safety
interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

interface DriverLocation extends LocationData {
  driverId: string;
  status: 'approaching' | 'arrived' | 'en_route' | 'offline';
}

interface RealTimeMapProps {
  userLocation?: LocationData;
  driverLocation?: DriverLocation;
  destination?: LocationData;
  currentRideLocation?: LocationData;
  mapStyle?: 'streets' | 'satellite' | 'dark' | 'light';
  showTraffic?: boolean;
  showRoute?: boolean;
  onLocationUpdate?: (location: LocationData) => void;
  onDriverContact?: (type: 'call' | 'message') => void;
  className?: string;
}

export default function RealTimeMap({
  userLocation,
  driverLocation,
  destination,
  currentRideLocation,
  mapStyle = 'streets',
  showTraffic = true,
  showRoute = true,
  onLocationUpdate,
  onDriverContact,
  className = ''
}: RealTimeMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<number | null>(null);
  const [trafficLevel, setTrafficLevel] = useState<'low' | 'medium' | 'high'>('low');
  const watchIdRef = useRef<number | null>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const userMarkerRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const rideLocationMarkerRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);

  // High-accuracy GPS tracking
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    const onSuccess = (position: GeolocationPosition) => {
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed || undefined,
        heading: position.coords.heading || undefined,
        timestamp: position.timestamp
      };

      setAccuracy(position.coords.accuracy);
      onLocationUpdate?.(locationData);
    };

    const onError = (error: GeolocationPositionError) => {
      console.error('Location error:', error.message);
      setIsTracking(false);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, options);
    setIsTracking(true);
  }, [onLocationUpdate]);

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Calculate ETA based on driver location and destination
  useEffect(() => {
    if (driverLocation && destination) {
      // Simplified ETA calculation - in production, use routing API
      const distance = calculateDistance(
        driverLocation.latitude,
        driverLocation.longitude,
        destination.latitude,
        destination.longitude
      );
      
      // Estimate based on speed and traffic
      const avgSpeed = driverLocation.speed || 30; // km/h fallback
      const trafficMultiplier = { low: 1, medium: 1.3, high: 1.6 }[trafficLevel];
      const etaMinutes = Math.round((distance / avgSpeed) * 60 * trafficMultiplier);
      setEstimatedArrival(etaMinutes);
    }
  }, [driverLocation, destination, trafficLevel]);

  // Haversine formula for distance calculation
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Load Google Maps script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'undefined') {
      console.warn('Google Maps API key not found');
      return;
    }

    // Check if Google Maps is already loaded
    if ((window as any).google && (window as any).google.maps) {
      setIsLoaded(true);
      return;
    }

    // Prevent duplicate script loading
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = (error) => {
      console.error('Failed to load Google Maps script:', error);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Initialize map when loaded
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || map) return;

    const mapInstance = new (window as any).google.maps.Map(mapContainerRef.current, {
      center: { lat: HATTIESBURG_CENTER.lat, lng: HATTIESBURG_CENTER.lng },
      zoom: 13,
      styles: mapStyle === 'satellite' ? [] : [
        {
          featureType: "poi.business",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ],
      mapTypeId: mapStyle === 'satellite' ? 'satellite' : 'roadmap',
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false
    });

    // Initialize directions service and renderer
    const directionsService = new (window as any).google.maps.DirectionsService();
    const directionsRenderer = new (window as any).google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#3B82F6',
        strokeWeight: 4
      }
    });

    directionsRenderer.setMap(mapInstance);
    directionsServiceRef.current = directionsService;
    directionsRendererRef.current = directionsRenderer;

    // Add traffic layer if enabled
    if (showTraffic) {
      const trafficLayer = new (window as any).google.maps.TrafficLayer();
      trafficLayer.setMap(mapInstance);
    }

    setMap(mapInstance);
  }, [isLoaded, mapStyle, showTraffic]);

  // Set traffic level to low by default (no random simulation)
  useEffect(() => {
    setTrafficLevel('low');
  }, []);

  // Update user location marker
  useEffect(() => {
    if (!map || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }

    const marker = new (window as any).google.maps.Marker({
      position: { lat: userLocation.latitude, lng: userLocation.longitude },
      map,
      title: 'You',
      icon: {
        path: (window as any).google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeWeight: 3,
        strokeColor: '#FFFFFF'
      }
    });

    userMarkerRef.current = marker;
    map.setCenter({ lat: userLocation.latitude, lng: userLocation.longitude });
  }, [map, userLocation]);

  // Update driver location marker
  useEffect(() => {
    if (!map || !driverLocation) return;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setMap(null);
    }

    const marker = new (window as any).google.maps.Marker({
      position: { lat: driverLocation.latitude, lng: driverLocation.longitude },
      map,
      title: 'John',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,%3Csvg width="32" height="32" viewBox="0 0 24 24" fill="%2310B981"%3E%3Cpath d="M13,20L11,20V18L13,18M19,10V12A2,2 0 0,1 17,14H15V22H9V14H7A2,2 0 0,1 5,12V10A2,2 0 0,1 7,8H17A2,2 0 0,1 19,10Z"/%3E%3C/svg%3E',
        scaledSize: new (window as any).google.maps.Size(32, 32)
      }
    });

    driverMarkerRef.current = marker;
  }, [map, driverLocation]);

  // Update destination marker
  useEffect(() => {
    if (!map || !destination) return;

    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setMap(null);
    }

    const marker = new (window as any).google.maps.Marker({
      position: { lat: destination.latitude, lng: destination.longitude },
      map,
      title: 'Destination',
      icon: {
        path: (window as any).google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#EF4444',
        fillOpacity: 1,
        strokeWeight: 3,
        strokeColor: '#FFFFFF'
      }
    });

    destinationMarkerRef.current = marker;
  }, [map, destination]);

  // Update current ride location marker
  useEffect(() => {
    if (!map || !currentRideLocation) return;

    if (rideLocationMarkerRef.current) {
      rideLocationMarkerRef.current.setMap(null);
    }

    const marker = new (window as any).google.maps.Marker({
      position: { lat: currentRideLocation.latitude, lng: currentRideLocation.longitude },
      map,
      title: 'Your Ride',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,%3Csvg width="32" height="32" viewBox="0 0 24 24" fill="%23F59E0B"%3E%3Cpath d="M13,20L11,20V18L13,18M19,10V12A2,2 0 0,1 17,14H15V22H9V14H7A2,2 0 0,1 5,12V10A2,2 0 0,1 7,8H17A2,2 0 0,1 19,10Z"/%3E%3C/svg%3E',
        scaledSize: new (window as any).google.maps.Size(32, 32)
      }
    });

    rideLocationMarkerRef.current = marker;
  }, [map, currentRideLocation]);

  // Update route when locations change
  useEffect(() => {
    if (!map || !showRoute || !userLocation || !destination || !directionsServiceRef.current || !directionsRendererRef.current) {
      return;
    }

    const request = {
      origin: { lat: userLocation.latitude, lng: userLocation.longitude },
      destination: { lat: destination.latitude, lng: destination.longitude },
      travelMode: (window as any).google.maps.TravelMode.DRIVING
    };

    directionsServiceRef.current.route(request, (result: any, status: any) => {
      if (status === 'OK' && directionsRendererRef.current) {
        directionsRendererRef.current.setDirections(result);
      }
    });
  }, [map, showRoute, userLocation, destination]);

  // Check for API key before rendering
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === 'undefined') {
    return (
      <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-gray-600">
            <div className="w-8 h-8 mx-auto mb-2 bg-blue-200 rounded-full flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              </svg>
            </div>
            <p className="text-sm font-medium">Interactive Map</p>
            <p className="text-xs">Ready for Google Maps integration</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full relative">
        {!isLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-gray-50 to-green-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading Google Maps...</p>
            </div>
          </div>
        )}
      </div>

      {/* Map Controls */}
      <div className="absolute top-0 right-0 flex flex-col gap-1">
        <button 
          onClick={() => map?.setZoom((map.getZoom() || 13) + 1)}
          className="w-8 h-8 bg-white rounded border shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold transition-colors text-sm"
        >
          +
        </button>
        <button 
          onClick={() => map?.setZoom((map.getZoom() || 13) - 1)}
          className="w-8 h-8 bg-white rounded border shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold transition-colors text-sm"
        >
          -
        </button>
        <button 
          onClick={isTracking ? stopLocationTracking : startLocationTracking}
          className={`w-8 h-8 rounded border shadow-md flex items-center justify-center transition-colors ${
            isTracking ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <MapPin size={14} />
        </button>
      </div>

      {/* Info Panel - Top Left */}
      <div className="absolute top-0 left-0 bg-white/90 backdrop-blur-sm rounded-br-md border shadow-md p-3 max-w-[160px]">
        <div className="flex items-center gap-1 mb-1">
          <Zap size={8} className="text-green-500" />
          <span className="text-xs font-medium text-gray-900">Live</span>
          <div className={`w-1 h-1 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          {estimatedArrival && (
            <div className="ml-auto bg-green-100 px-1 py-0.5 rounded text-xs">
              <span className="font-medium text-green-700">{estimatedArrival}m</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1 text-xs">
          <div className="text-center">
            <div className="text-gray-500" style={{fontSize: '9px'}}>GPS</div>
            <div className="font-medium" style={{fontSize: '9px'}}>
              {accuracy !== null && accuracy !== undefined ? `${accuracy.toFixed(0)}m` : '...'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500" style={{fontSize: '9px'}}>Traffic</div>
            <div className={`font-medium capitalize ${
              trafficLevel === 'high' ? 'text-red-600' :
              trafficLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
            }`} style={{fontSize: '9px'}}>
              {trafficLevel}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500" style={{fontSize: '9px'}}>Speed</div>
            <div className="font-medium" style={{fontSize: '9px'}}>
              {driverLocation && driverLocation.speed !== undefined ? `${Math.round(driverLocation.speed)}` : '--'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}