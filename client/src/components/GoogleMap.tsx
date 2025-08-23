import { useEffect, useRef, useState } from 'react';

interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    title?: string;
    icon?: string;
  }>;
  onMapLoad?: (map: any) => void;
  className?: string;
}

export default function GoogleMap({ 
  center, 
  zoom = 13, 
  markers = [], 
  onMapLoad,
  className = "w-full h-64"
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not found');
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
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
    if (!isLoaded || !mapRef.current || map) return;

    const newMap = new (window as any).google.maps.Map(mapRef.current, {
      center,
      zoom,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    setMap(newMap);
    onMapLoad?.(newMap);
  }, [isLoaded, center, zoom, onMapLoad, map]);

  // Update markers
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    // Note: In production, you'd want to manage markers more efficiently
    
    markers.forEach(markerData => {
      new (window as any).google.maps.Marker({
        position: markerData.position,
        map,
        title: markerData.title,
        icon: markerData.icon
      });
    });
  }, [map, markers]);

  // Update center when it changes
  useEffect(() => {
    if (map) {
      map.setCenter(center);
    }
  }, [map, center]);

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center border rounded-lg`}>
        <div className="text-center text-gray-600">
          <p className="text-sm font-medium">Map Loading...</p>
          <p className="text-xs">Google Maps API key required</p>
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

// Global type declarations
declare global {
  interface Window {
    google: any;
  }
}