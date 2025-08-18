import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Satellite, Wifi, Signal, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';

interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

interface GPSStatus {
  isEnabled: boolean;
  isTracking: boolean;
  lastUpdate: number | null;
  signalStrength: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
  source: 'gps' | 'network' | 'passive';
}

interface GPSTrackerProps {
  onPositionUpdate?: (position: GPSPosition) => void;
  onStatusChange?: (status: GPSStatus) => void;
  updateInterval?: number; // milliseconds
  highAccuracy?: boolean;
  className?: string;
}

export default function GPSTracker({
  onPositionUpdate,
  onStatusChange,
  updateInterval = 5000,
  highAccuracy = true,
  className = ''
}: GPSTrackerProps) {
  const [position, setPosition] = useState<GPSPosition | null>(null);
  const [status, setStatus] = useState<GPSStatus>({
    isEnabled: false,
    isTracking: false,
    lastUpdate: null,
    signalStrength: 'none',
    source: 'gps'
  });
  const [error, setError] = useState<string | null>(null);
  
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Determine signal strength based on accuracy
  const getSignalStrength = (accuracy: number): GPSStatus['signalStrength'] => {
    if (accuracy <= 5) return 'excellent';
    if (accuracy <= 10) return 'good';
    if (accuracy <= 20) return 'fair';
    if (accuracy <= 50) return 'poor';
    return 'none';
  };

  // Determine GPS source based on accuracy and speed
  const getGPSSource = (accuracy: number, speed: number | null): GPSStatus['source'] => {
    if (accuracy <= 10 && speed !== null) return 'gps';
    if (accuracy <= 50) return 'network';
    return 'passive';
  };

  const updateStatus = useCallback((newStatus: Partial<GPSStatus>) => {
    setStatus(prev => {
      const updated = { ...prev, ...newStatus };
      onStatusChange?.(updated);
      return updated;
    });
  }, [onStatusChange]);

  const handlePositionSuccess = useCallback((geoPosition: GeolocationPosition) => {
    const coords = geoPosition.coords;
    const newPosition: GPSPosition = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      altitude: coords.altitude,
      altitudeAccuracy: coords.altitudeAccuracy,
      heading: coords.heading,
      speed: coords.speed,
      timestamp: geoPosition.timestamp
    };

    setPosition(newPosition);
    setError(null);
    
    const signalStrength = getSignalStrength(coords.accuracy);
    const source = getGPSSource(coords.accuracy, coords.speed);
    
    updateStatus({
      lastUpdate: Date.now(),
      signalStrength,
      source
    });

    onPositionUpdate?.(newPosition);
  }, [onPositionUpdate, updateStatus]);

  const handlePositionError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = '';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied by user';
        updateStatus({ isEnabled: false, isTracking: false });
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable';
        updateStatus({ signalStrength: 'none' });
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out';
        break;
      default:
        errorMessage = 'Unknown location error';
        break;
    }
    
    setError(errorMessage);
  }, [updateStatus]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: highAccuracy,
      timeout: 10000,
      maximumAge: 2000
    };

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      options
    );

    updateStatus({ isTracking: true, isEnabled: true });

    // Set up periodic updates for continuous tracking
    if (updateInterval > 0) {
      intervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          handlePositionSuccess,
          handlePositionError,
          options
        );
      }, updateInterval);
    }
  }, [highAccuracy, updateInterval, handlePositionSuccess, handlePositionError, updateStatus]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    updateStatus({ isTracking: false });
  }, [updateStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  const getSignalIcon = () => {
    switch (status.signalStrength) {
      case 'excellent':
        return <Signal className="text-green-500" size={20} />;
      case 'good':
        return <Signal className="text-blue-500" size={20} />;
      case 'fair':
        return <Signal className="text-yellow-500" size={20} />;
      case 'poor':
        return <Signal className="text-orange-500" size={20} />;
      default:
        return <Signal className="text-red-500" size={20} />;
    }
  };

  const getSourceIcon = () => {
    switch (status.source) {
      case 'gps':
        return <Satellite className="text-green-500" size={16} />;
      case 'network':
        return <Wifi className="text-blue-500" size={16} />;
      default:
        return <MapPin className="text-gray-500" size={16} />;
    }
  };

  const formatCoordinate = (coord: number, isLongitude: boolean = false): string => {
    const direction = isLongitude ? (coord >= 0 ? 'E' : 'W') : (coord >= 0 ? 'N' : 'S');
    const absolute = Math.abs(coord);
    const degrees = Math.floor(absolute);
    const minutes = (absolute - degrees) * 60;
    return `${degrees}°${minutes.toFixed(4)}' ${direction}`;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin size={20} className="text-blue-600" />
            <span>GPS Tracker</span>
          </div>
          <div className="flex items-center gap-2">
            {getSignalIcon()}
            {status.isTracking && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              {status.isEnabled ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <AlertCircle size={16} className="text-red-500" />
              )}
              <span className="text-sm font-medium">
                {status.isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="text-xs text-gray-600">GPS Status</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              {getSourceIcon()}
              <span className="text-sm font-medium capitalize">
                {status.source}
              </span>
            </div>
            <div className="text-xs text-gray-600">Source</div>
          </div>
        </div>

        {/* Position Information */}
        {position && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-sm font-medium text-blue-900 mb-1">Coordinates</div>
                <div className="text-xs text-blue-700 font-mono">
                  Lat: {formatCoordinate(position.latitude)}
                </div>
                <div className="text-xs text-blue-700 font-mono">
                  Lng: {formatCoordinate(position.longitude, true)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-gray-500 mb-1">Accuracy</div>
                <div className="font-medium">±{position.accuracy.toFixed(1)}m</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Speed</div>
                <div className="font-medium">
                  {position.speed ? `${(position.speed * 3.6).toFixed(1)} km/h` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Altitude</div>
                <div className="font-medium">
                  {position.altitude ? `${position.altitude.toFixed(1)}m` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Heading</div>
                <div className="font-medium">
                  {position.heading ? `${position.heading.toFixed(0)}°` : 'N/A'}
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 pt-2 border-t">
              Last update: {new Date(position.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Control Button */}
        <Button
          onClick={status.isTracking ? stopTracking : startTracking}
          className="w-full"
          variant={status.isTracking ? "destructive" : "default"}
        >
          {status.isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </Button>

        {/* Technical Details */}
        <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
          <div>High Accuracy: {highAccuracy ? 'Enabled' : 'Disabled'}</div>
          <div>Update Interval: {updateInterval / 1000}s</div>
          <div>Signal Quality: {status.signalStrength}</div>
        </div>
      </CardContent>
    </Card>
  );
}