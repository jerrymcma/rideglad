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
      const pickupMarker = new (window as any).google.maps.Marker({
        position: pickupLocation,
        map,
        title: 'YOU - Pickup Location',
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 30,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeWeight: 4,
          strokeColor: '#FFFFFF'
        },
        label: {
          text: 'YOU',
          color: '#FFFFFF',
          fontSize: '12px',
          fontWeight: 'bold'
        }
      });

      // Add info window for pickup
      const pickupInfoWindow = new (window as any).google.maps.InfoWindow({
        content: '<div style="padding: 8px; font-family: system-ui;"><strong>📍 Pickup Location</strong><br/>Rider waiting here</div>'
      });
      pickupMarker.addListener('click', () => {
        pickupInfoWindow.open(map, pickupMarker);
      });
    }

    // Add destination marker
    if (destinationLocation) {
      const destMarker = new (window as any).google.maps.Marker({
        position: destinationLocation,
        map,
        title: 'Destination - Drop-off Point',
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 30,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeWeight: 4,
          strokeColor: '#FFFFFF'
        },
        label: {
          text: 'END',
          color: '#FFFFFF',
          fontSize: '10px',
          fontWeight: 'bold'
        }
      });

      // Add info window for destination
      const destInfoWindow = new (window as any).google.maps.InfoWindow({
        content: '<div style="padding: 8px; font-family: system-ui;"><strong>🏁 Destination</strong><br/>Drop-off point</div>'
      });
      destMarker.addListener('click', () => {
        destInfoWindow.open(map, destMarker);
      });
    }

    // Add driver marker
    if (driverLocation) {
      const driverMarker = new (window as any).google.maps.Marker({
        position: driverLocation,
        map,
        title: 'The Driver - On the way',
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 30,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeWeight: 4,
          strokeColor: '#FFFFFF'
        },
        label: {
          text: 'The Driver',
          color: '#3B82F6',
          fontSize: '8px',
          fontWeight: 'bold'
        }
      });

      // Add info window for driver
      const driverInfoWindow = new (window as any).google.maps.InfoWindow({
        content: `<div style="padding: 12px; font-family: system-ui; min-width: 200px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <div style="font-size: 24px; margin-right: 8px;">🚗</div>
            <div>
              <strong>John Driver</strong><br/>
              <span style="color: #10B981; font-weight: bold;">⭐ 4.9 (127 rides)</span>
            </div>
          </div>
          <div style="font-size: 12px; color: #666;">
            🚙 Silver Toyota Camry<br/>
            📱 Available for pickup<br/>
            💰 $0.40 per mile + $2 base
          </div>
        </div>`
      });
      driverMarker.addListener('click', () => {
        driverInfoWindow.open(map, driverMarker);
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