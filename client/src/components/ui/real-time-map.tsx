import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from './button';
import { MapPin, Navigation, Clock, Zap, AlertTriangle, Phone, MessageCircle } from 'lucide-react';

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

  // Simulate traffic level updates
  useEffect(() => {
    const interval = setInterval(() => {
      const levels: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
      setTrafficLevel(levels[Math.floor(Math.random() * levels.length)]);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full relative bg-gradient-to-br from-blue-50 via-gray-50 to-green-50">
        
        {/* Detailed Street Network with Names */}
        <div className="absolute inset-0">
          {/* Major Highways with Names */}
          <div className="absolute w-full h-3 bg-gray-700 top-[28%] opacity-90 shadow-lg"></div>
          <div className="absolute top-[26%] left-[5%] bg-white border border-gray-400 px-2 py-0.5 rounded text-[8px] font-bold text-gray-800 shadow-sm">I-80 WEST</div>
          
          <div className="absolute w-full h-3 bg-gray-700 top-[68%] opacity-90 shadow-lg"></div>
          <div className="absolute top-[66%] left-[5%] bg-white border border-gray-400 px-2 py-0.5 rounded text-[8px] font-bold text-gray-800 shadow-sm">US-101 NORTH</div>
          
          <div className="absolute h-full w-3 bg-gray-700 left-[23%] opacity-90 shadow-lg"></div>
          <div className="absolute top-[5%] left-[21%] bg-white border border-gray-400 px-1 py-0.5 rounded text-[8px] font-bold text-gray-800 shadow-sm rotate-90 origin-center">I-280</div>
          
          <div className="absolute h-full w-3 bg-gray-700 left-[73%] opacity-90 shadow-lg"></div>
          <div className="absolute top-[5%] left-[71%] bg-white border border-gray-400 px-1 py-0.5 rounded text-[8px] font-bold text-gray-800 shadow-sm rotate-90 origin-center">CA-1</div>
          
          {/* Major Streets with Names */}
          <div className="absolute w-full h-1.5 bg-gray-500 top-[15%] opacity-85 shadow-sm"></div>
          <div className="absolute top-[13.5%] left-[2%] bg-yellow-100 border border-yellow-400 px-1 py-0.5 rounded text-[7px] font-semibold text-gray-700">Mission St</div>
          
          <div className="absolute w-full h-1.5 bg-gray-500 top-[45%] opacity-85 shadow-sm"></div>
          <div className="absolute top-[43.5%] left-[2%] bg-yellow-100 border border-yellow-400 px-1 py-0.5 rounded text-[7px] font-semibold text-gray-700">Market St</div>
          
          <div className="absolute w-full h-1.5 bg-gray-500 top-[55%] opacity-85 shadow-sm"></div>
          <div className="absolute top-[53.5%] left-[2%] bg-yellow-100 border border-yellow-400 px-1 py-0.5 rounded text-[7px] font-semibold text-gray-700">Geary Blvd</div>
          
          <div className="absolute w-full h-1.5 bg-gray-500 top-[85%] opacity-85 shadow-sm"></div>
          <div className="absolute top-[83.5%] left-[2%] bg-yellow-100 border border-yellow-400 px-1 py-0.5 rounded text-[7px] font-semibold text-gray-700">19th Ave</div>
          
          <div className="absolute h-full w-1.5 bg-gray-500 left-[10%] opacity-85 shadow-sm"></div>
          <div className="absolute top-[8%] left-[8.5%] bg-yellow-100 border border-yellow-400 px-1 py-0.5 rounded text-[7px] font-semibold text-gray-700 rotate-90 origin-center">Van Ness</div>
          
          <div className="absolute h-full w-1.5 bg-gray-500 left-[40%] opacity-85 shadow-sm"></div>
          <div className="absolute top-[8%] left-[38.5%] bg-yellow-100 border border-yellow-400 px-1 py-0.5 rounded text-[7px] font-semibold text-gray-700 rotate-90 origin-center">Powell St</div>
          
          <div className="absolute h-full w-1.5 bg-gray-500 left-[60%] opacity-85 shadow-sm"></div>
          <div className="absolute top-[8%] left-[58.5%] bg-yellow-100 border border-yellow-400 px-1 py-0.5 rounded text-[7px] font-semibold text-gray-700 rotate-90 origin-center">Grant Ave</div>
          
          <div className="absolute h-full w-1.5 bg-gray-500 left-[90%] opacity-85 shadow-sm"></div>
          <div className="absolute top-[8%] left-[88.5%] bg-yellow-100 border border-yellow-400 px-1 py-0.5 rounded text-[7px] font-semibold text-gray-700 rotate-90 origin-center">Embarcadero</div>
          
          {/* Local Streets with Names */}
          <div className="absolute w-full h-0.5 bg-gray-400 top-[35%] opacity-70"></div>
          <div className="absolute top-[34%] left-[1%] bg-blue-50 border border-blue-200 px-1 rounded text-[6px] text-gray-600">Hayes St</div>
          
          <div className="absolute w-full h-0.5 bg-gray-400 top-[65%] opacity-70"></div>
          <div className="absolute top-[64%] left-[1%] bg-blue-50 border border-blue-200 px-1 rounded text-[6px] text-gray-600">Irving St</div>
          
          <div className="absolute h-full w-0.5 bg-gray-400 left-[33%] opacity-70"></div>
          <div className="absolute top-[2%] left-[32%] bg-blue-50 border border-blue-200 px-1 rounded text-[6px] text-gray-600 rotate-90 origin-center">Fillmore</div>
          
          <div className="absolute h-full w-0.5 bg-gray-400 left-[67%] opacity-70"></div>
          <div className="absolute top-[2%] left-[66%] bg-blue-50 border border-blue-200 px-1 rounded text-[6px] text-gray-600 rotate-90 origin-center">Stockton</div>
          
          {/* Traffic Overlay with Street Context */}
          {showTraffic && (
            <>
              <div className={`absolute w-full h-1 top-[28.5%] left-0 ${
                trafficLevel === 'high' ? 'bg-red-500' : 
                trafficLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              } opacity-80`}></div>
              <div className={`absolute w-full h-1 top-[45.5%] left-0 ${
                trafficLevel === 'high' ? 'bg-red-500' : 
                trafficLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              } opacity-80`}></div>
            </>
          )}
          
          {/* Major Landmarks and Buildings */}
          <div className="absolute w-20 h-16 bg-red-100 border border-red-300 top-[18%] left-[12%] rounded-sm opacity-80 shadow-sm"></div>
          <div className="absolute top-[16%] left-[13%] text-[6px] font-bold text-red-700">City Hall</div>
          
          <div className="absolute w-24 h-20 bg-blue-100 border border-blue-300 top-[48%] left-[78%] rounded-sm opacity-80 shadow-sm"></div>
          <div className="absolute top-[46%] left-[79%] text-[6px] font-bold text-blue-700">Ferry Building</div>
          
          <div className="absolute w-16 h-12 bg-purple-100 border border-purple-300 top-[72%] left-[28%] rounded-sm opacity-80 shadow-sm"></div>
          <div className="absolute top-[70%] left-[29%] text-[6px] font-bold text-purple-700">UCSF</div>
          
          <div className="absolute w-18 h-14 bg-orange-100 border border-orange-300 top-[25%] left-[65%] rounded-sm opacity-80 shadow-sm"></div>
          <div className="absolute top-[23%] left-[66%] text-[6px] font-bold text-orange-700">Chinatown</div>
          
          <div className="absolute w-22 h-18 bg-yellow-100 border border-yellow-300 top-[40%] left-[35%] rounded-sm opacity-80 shadow-sm"></div>
          <div className="absolute top-[38%] left-[36%] text-[6px] font-bold text-yellow-700">Union Square</div>
          
          {/* Shopping Centers */}
          <div className="absolute w-16 h-10 bg-pink-100 border border-pink-300 top-[55%] left-[50%] rounded-sm opacity-80 shadow-sm"></div>
          <div className="absolute top-[53%] left-[51%] text-[6px] font-bold text-pink-700">Westfield Mall</div>
          
          <div className="absolute w-14 h-8 bg-indigo-100 border border-indigo-300 top-[80%] left-[75%] rounded-sm opacity-80 shadow-sm"></div>
          <div className="absolute top-[78%] left-[76%] text-[6px] font-bold text-indigo-700">Best Buy</div>
          
          {/* Parks and Recreation */}
          <div className="absolute w-28 h-22 bg-green-200 border border-green-400 top-[38%] left-[42%] rounded-lg opacity-85 shadow-sm"></div>
          <div className="absolute top-[36%] left-[44%] text-[7px] font-bold text-green-800">Golden Gate Park</div>
          
          <div className="absolute w-18 h-14 bg-green-200 border border-green-400 top-[8%] left-[68%] rounded-full opacity-85 shadow-sm"></div>
          <div className="absolute top-[6%] left-[70%] text-[6px] font-bold text-green-800">Washington Square</div>
          
          <div className="absolute w-16 h-12 bg-green-200 border border-green-400 top-[75%] left-[15%] rounded-lg opacity-85 shadow-sm"></div>
          <div className="absolute top-[73%] left-[16%] text-[6px] font-bold text-green-800">Dolores Park</div>
          
          {/* Transportation Hubs */}
          <div className="absolute w-12 h-8 bg-gray-200 border border-gray-400 top-[32%] left-[8%] rounded opacity-80 shadow-sm"></div>
          <div className="absolute top-[30%] left-[9%] text-[6px] font-bold text-gray-700">BART</div>
          
          <div className="absolute w-10 h-6 bg-blue-200 border border-blue-400 top-[60%] left-[85%] rounded opacity-80 shadow-sm"></div>
          <div className="absolute top-[58%] left-[86%] text-[6px] font-bold text-blue-700">Pier 39</div>
          
          {/* Restaurant Districts */}
          <div className="absolute w-14 h-10 bg-yellow-200 border border-yellow-400 top-[50%] left-[20%] rounded-sm opacity-80 shadow-sm"></div>
          <div className="absolute top-[48%] left-[21%] text-[6px] font-bold text-yellow-800">Little Italy</div>
          
          <div className="absolute w-12 h-8 bg-red-200 border border-red-400 top-[20%] left-[45%] rounded-sm opacity-80 shadow-sm"></div>
          <div className="absolute top-[18%] left-[46%] text-[6px] font-bold text-red-800">North Beach</div>
        </div>

        {/* User Location */}
        {userLocation && (
          <div className="absolute top-1/2 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="w-6 h-6 bg-blue-600 rounded-full border-3 border-white shadow-lg animate-pulse"></div>
              <div className="absolute -inset-2 border-2 border-blue-300 rounded-full animate-ping opacity-30"></div>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md font-medium whitespace-nowrap">
                You
              </div>
            </div>
          </div>
        )}

        {/* Driver Location */}
        {driverLocation && (
          <div className="absolute top-[25%] right-[20%] transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className={`w-8 h-8 rounded-full border-3 border-white shadow-lg flex items-center justify-center ${
                driverLocation.status === 'approaching' ? 'bg-green-500 animate-bounce' :
                driverLocation.status === 'arrived' ? 'bg-blue-500' :
                driverLocation.status === 'en_route' ? 'bg-orange-500' : 'bg-gray-500'
              }`}>
                <Navigation size={16} className="text-white" />
              </div>
              {driverLocation.status === 'approaching' && (
                <div className="absolute -inset-1 border-2 border-green-400 rounded-full animate-ping"></div>
              )}
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 px-2 py-1 rounded-md shadow-md">
                <div className="text-xs font-medium text-gray-900">Driver</div>
                {estimatedArrival && (
                  <div className="text-xs text-green-600 font-medium">{estimatedArrival} min</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Destination */}
        {destination && (
          <div className="absolute top-[20%] right-[10%] transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="w-6 h-6 bg-red-500 rounded-full border-3 border-white shadow-lg"></div>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded-md font-medium whitespace-nowrap">
                Destination
              </div>
            </div>
          </div>
        )}

        {/* Route Path */}
        {showRoute && userLocation && driverLocation && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <path
              d="M 33% 50% Q 60% 30% 80% 20%"
              stroke="url(#routeGradient)"
              strokeWidth="4"
              fill="none"
              strokeDasharray="8,4"
              className="animate-pulse"
            />
          </svg>
        )}

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button className="w-10 h-10 bg-white rounded-lg border shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold transition-colors">
            +
          </button>
          <button className="w-10 h-10 bg-white rounded-lg border shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold transition-colors">
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