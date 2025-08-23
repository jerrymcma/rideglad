import { useEffect, useRef, useState } from 'react';
import { HATTIESBURG_CENTER } from '@/utils/hattiesburg-locations';

interface TripMapProps {
  pickupLocation?: { lat: number; lng: number };
  destinationLocation?: { lat: number; lng: number };
  driverLocation?: { lat: number; lng: number };
  showRoute?: boolean;
  className?: string;
}

export default function TripMap({ 
  pickupLocation, 
  destinationLocation, 
  driverLocation, 
  showRoute = false,
  className = "w-full h-48"
}: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);

  // Initialize map when Google Maps loads
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !mapRef.current) return;

    // Check if Google Maps is loaded
    if (!(window as any).google || !(window as any).google.maps) return;

    const newMap = new (window as any).google.maps.Map(mapRef.current, {
      center: pickupLocation || HATTIESBURG_CENTER,
      zoom: 13,
      styles: [
        {
          featureType: "poi.business",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    const newDirectionsService = new (window as any).google.maps.DirectionsService();
    const newDirectionsRenderer = new (window as any).google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#3B82F6',
        strokeWeight: 4
      }
    });

    newDirectionsRenderer.setMap(newMap);

    setMap(newMap);
    setDirectionsService(newDirectionsService);
    setDirectionsRenderer(newDirectionsRenderer);
  }, [pickupLocation]);

  // Update markers and route
  useEffect(() => {
    if (!map || !(window as any).google) return;

    // Clear existing markers
    // Note: In production, you'd want to manage markers more efficiently

    // Add pickup marker
    if (pickupLocation) {
      new (window as any).google.maps.Marker({
        position: pickupLocation,
        map,
        title: 'Pickup Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,%3Csvg width="32" height="32" viewBox="0 0 24 24" fill="%2310B981"%3E%3Cpath d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/%3E%3C/svg%3E',
          scaledSize: new (window as any).google.maps.Size(32, 32)
        }
      });
    }

    // Add destination marker
    if (destinationLocation) {
      new (window as any).google.maps.Marker({
        position: destinationLocation,
        map,
        title: 'Destination',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,%3Csvg width="32" height="32" viewBox="0 0 24 24" fill="%23EF4444"%3E%3Cpath d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/%3E%3C/svg%3E',
          scaledSize: new (window as any).google.maps.Size(32, 32)
        }
      });
    }

    // Add driver marker
    if (driverLocation) {
      new (window as any).google.maps.Marker({
        position: driverLocation,
        map,
        title: 'Driver Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,%3Csvg width="32" height="32" viewBox="0 0 24 24" fill="%233B82F6"%3E%3Cpath d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11C5.84 5 5.28 5.42 5.08 6.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-1.92-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/%3E%3C/svg%3E',
          scaledSize: new (window as any).google.maps.Size(32, 32)
        }
      });
    }

    // Show route if requested
    if (showRoute && pickupLocation && destinationLocation && directionsService && directionsRenderer) {
      directionsService.route(
        {
          origin: pickupLocation,
          destination: destinationLocation,
          travelMode: (window as any).google.maps.TravelMode.DRIVING,
        },
        (result: any, status: any) => {
          if (status === 'OK' && result) {
            directionsRenderer.setDirections(result);
          }
        }
      );
    }

    // Fit map to show all markers
    if (pickupLocation || destinationLocation || driverLocation) {
      const bounds = new (window as any).google.maps.LatLngBounds();
      if (pickupLocation) bounds.extend(pickupLocation);
      if (destinationLocation) bounds.extend(destinationLocation);
      if (driverLocation) bounds.extend(driverLocation);
      map.fitBounds(bounds);
    }
  }, [map, pickupLocation, destinationLocation, driverLocation, showRoute, directionsService, directionsRenderer]);

  // Fallback UI when Google Maps API key is not available
  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center border rounded-lg`}>
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
    );
  }

  return (
    <div 
      ref={mapRef} 
      className={`${className} border rounded-lg`}
      style={{ minHeight: '200px' }}
    />
  );
}