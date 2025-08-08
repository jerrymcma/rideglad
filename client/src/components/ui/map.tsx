import { useState, useEffect } from "react";

export default function Map() {
  const [userLocation, setUserLocation] = useState({ lat: 40.7128, lng: -74.0060 });

  useEffect(() => {
    // Mock location update
    const interval = setInterval(() => {
      setUserLocation(prev => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.001,
        lng: prev.lng + (Math.random() - 0.5) * 0.001,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Background Map Image */}
      <img
        src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600"
        alt="Urban street view"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-blue-100/30"></div>

      {/* User Location Dot */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg pulse-dot" data-testid="user-location-dot"></div>
      </div>

      {/* Mock Driver Markers */}
      <div className="absolute top-1/3 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
        <div className="bg-brand-green text-white p-2 rounded-lg shadow-lg text-xs font-medium" data-testid="driver-marker-1">
          🚗 3 min
        </div>
      </div>
      <div className="absolute top-2/3 right-1/4 transform -translate-x-1/2 -translate-y-1/2">
        <div className="bg-brand-green text-white p-2 rounded-lg shadow-lg text-xs font-medium" data-testid="driver-marker-2">
          🚗 5 min
        </div>
      </div>
      <div className="absolute top-1/4 right-1/3 transform -translate-x-1/2 -translate-y-1/2">
        <div className="bg-brand-green text-white p-2 rounded-lg shadow-lg text-xs font-medium" data-testid="driver-marker-3">
          🚗 7 min
        </div>
      </div>
    </div>
  );
}
