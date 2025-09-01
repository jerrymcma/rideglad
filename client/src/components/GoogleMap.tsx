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
    if (!apiKey || apiKey === 'undefined') {
      console.warn('Google Maps API key not found');
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
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
    
    markers.forEach((markerData, index) => {
      const isDriver = markerData.title?.toLowerCase().includes('driver');
      const isDestination = markerData.title?.toLowerCase().includes('destination');
      const isUser = markerData.title?.toLowerCase().includes('you') || markerData.title?.toLowerCase().includes('pickup');
      
      const marker = new (window as any).google.maps.Marker({
        position: markerData.position,
        map,
        title: markerData.title || 'Marker',
        icon: isDriver ? {
          url: 'data:image/svg+xml;charset=UTF-8,%3Csvg width="40" height="40" viewBox="0 0 24 24" fill="%2310B981"%3E%3Cpath d="M18.92,6.01C18.72,5.42 18.16,5 17.5,5H6.5C5.84,5 5.28,5.42 5.08,6.01L3,12V20C3,20.55 3.45,21 4,21H5C5.55,21 6,20.55 6,20V19H18V20C18,20.55 18.45,21 19,21H20C20.55,21 21,20.55 21,20V12L18.92,6.01M6.5,16C5.67,16 5,15.33 5,14.5C5,13.67 5.67,13 6.5,13C7.33,13 8,13.67 8,14.5C8,15.33 7.33,16 6.5,16M17.5,16C16.67,16 16,15.33 16,14.5C16,13.67 16.67,13 17.5,13C18.33,13 19,13.67 19,14.5C19,15.33 18.33,16 17.5,16M5,11L6.5,6.5H17.5L19,11H5Z"%3E%3C/svg%3E',
          scaledSize: new (window as any).google.maps.Size(40, 40),
          anchor: new (window as any).google.maps.Point(20, 20)
        } : (isDestination ? {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeWeight: 4,
          strokeColor: '#FFFFFF'
        } : {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeWeight: 4,
          strokeColor: '#FFFFFF'
        }),
        label: isDriver ? {
          text: 'JOHN',
          color: '#FFFFFF',
          fontSize: '10px',
          fontWeight: 'bold'
        } : (isDestination ? {
          text: 'END',
          color: '#FFFFFF',
          fontSize: '10px',
          fontWeight: 'bold'
        } : {
          text: 'YOU',
          color: '#FFFFFF',
          fontSize: '12px',
          fontWeight: 'bold'
        })
      });

      // Add professional info windows
      let infoContent = '';
      if (isDriver) {
        infoContent = `<div style="padding: 12px; font-family: system-ui; min-width: 200px;">
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
        </div>`;
      } else if (isDestination) {
        infoContent = '<div style="padding: 8px; font-family: system-ui;"><strong>🏁 Destination</strong><br/>Drop-off point</div>';
      } else {
        infoContent = '<div style="padding: 8px; font-family: system-ui;"><strong>📍 Your Location</strong><br/>Pickup point</div>';
      }
      
      const infoWindow = new (window as any).google.maps.InfoWindow({ content: infoContent });
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    });
  }, [map, markers]);

  // Update center when it changes
  useEffect(() => {
    if (map) {
      map.setCenter(center);
    }
  }, [map, center]);

  // Check for API key before rendering
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === 'undefined') {
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

// Global type declarations
declare global {
  interface Window {
    google: any;
  }
}