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
    if (!apiKey) {
      console.warn('Google Maps API key not found');
      return;
    }

    // Check if Google Maps is already loaded
    if ((window as any).google && (window as any).google.maps) {
      setIsLoaded(true);
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
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
      mapTypeId: mapStyle === 'satellite' ? 'satellite' : 'roadmap'
    });

    // Initialize directions service and renderer
    const directionsService = new (window as any).google.maps.DirectionsService();
    const directionsRenderer = new (window as any).google.maps.DirectionsRenderer({
      suppressMarkers: false,
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

  // Simulate traffic level updates
  useEffect(() => {
    const interval = setInterval(() => {
      const levels: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
      setTrafficLevel(levels[Math.floor(Math.random() * levels.length)]);
    }, 10000);

    return () => clearInterval(interval);
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
      title: 'Your Location',
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
      title: 'Driver Location',
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
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button 
          onClick={() => map?.setZoom((map.getZoom() || 13) + 1)}
          className="w-10 h-10 bg-white rounded-lg border shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold transition-colors"
        >
          +
        </button>
        <button 
          onClick={() => map?.setZoom((map.getZoom() || 13) - 1)}
          className="w-10 h-10 bg-white rounded-lg border shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold transition-colors"
        >
          -
        </button>
        <button 
          onClick={isTracking ? stopLocationTracking : startLocationTracking}
          className={`w-10 h-10 rounded-lg border shadow-md flex items-center justify-center transition-colors ${
            isTracking ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <MapPin size={16} />
        </button>
      </div>


      {/* Real-time Info Panel */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg border shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-green-500" />
            <span className="text-sm font-medium text-gray-900">Live Tracking</span>
            <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          </div>
          {estimatedArrival && (
            <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-md">
              <Clock size={14} className="text-green-600" />
              <span className="text-sm font-medium text-green-700">{estimatedArrival} min</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <div className="text-gray-500 mb-1">GPS Accuracy</div>
            <div className="font-medium flex items-center gap-1">
              {accuracy ? `${accuracy.toFixed(0)}m` : 'Searching...'}
              {accuracy && accuracy < 10 && <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>}
            </div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Traffic</div>
            <div className={`font-medium capitalize ${
              trafficLevel === 'high' ? 'text-red-600' :
              trafficLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {trafficLevel}
            </div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Speed</div>
            <div className="font-medium">
              {driverLocation?.speed ? `${Math.round(driverLocation.speed)} km/h` : '-- km/h'}
            </div>
          </div>
        </div>

        {/* Driver Contact Actions */}
        {driverLocation && onDriverContact && (
          <div className="flex gap-2 mt-3 pt-3 border-t">
            <Button
              onClick={() => onDriverContact('call')}
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Phone size={14} className="mr-1" />
              Call
            </Button>
            <Button
              onClick={() => onDriverContact('message')}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              <MessageCircle size={14} className="mr-1" />
              Message
            </Button>
          </div>
        )}
      </div>

      {/* Traffic Alert */}
      {trafficLevel === 'high' && (
        <div className="absolute top-4 left-4 bg-red-100 border border-red-300 rounded-lg p-3 shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600" />
            <span className="text-sm font-medium text-red-800">Heavy Traffic</span>
          </div>
          <div className="text-xs text-red-700 mt-1">ETA may be delayed</div>
        </div>
      )}
    </div>
  );
}