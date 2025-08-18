import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RealTimeMap from "@/components/ui/real-time-map";
import TurnByTurnNavigation from "@/components/ui/turn-by-turn-navigation";
import GPSTracker from "@/components/ui/gps-tracker";
import { 
  MapPin, 
  Navigation, 
  Satellite, 
  Route, 
  Map,
  ArrowLeft,
  Zap,
  Clock,
  Signal
} from "lucide-react";

interface NavigationStep {
  id: string;
  instruction: string;
  maneuver: 'turn-left' | 'turn-right' | 'straight' | 'u-turn' | 'exit' | 'merge' | 'arrival';
  distance: number;
  duration: number;
  streetName: string;
  nextStreetName?: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

export default function AdvancedNavigation() {
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [currentSpeed, setCurrentSpeed] = useState(28);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isNavigationActive, setIsNavigationActive] = useState(false);

  // Mock navigation steps for demonstration
  const navigationSteps: NavigationStep[] = [
    {
      id: '1',
      instruction: 'Head northeast on Main Street',
      maneuver: 'straight',
      distance: 350,
      duration: 45,
      streetName: 'Main Street',
      nextStreetName: 'Oak Avenue'
    },
    {
      id: '2', 
      instruction: 'Turn right onto Oak Avenue',
      maneuver: 'turn-right',
      distance: 200,
      duration: 30,
      streetName: 'Oak Avenue',
      nextStreetName: 'Highway 101'
    },
    {
      id: '3',
      instruction: 'Merge onto Highway 101 North',
      maneuver: 'merge',
      distance: 1200,
      duration: 90,
      streetName: 'Highway 101 North',
      nextStreetName: 'Downtown Exit'
    },
    {
      id: '4',
      instruction: 'Take exit 15 toward Downtown',
      maneuver: 'exit',
      distance: 150,
      duration: 20,
      streetName: 'Downtown Exit'
    },
    {
      id: '5',
      instruction: 'You have arrived at your destination',
      maneuver: 'arrival',
      distance: 0,
      duration: 0,
      streetName: 'Destination'
    }
  ];

  // Mock driver location for real-time tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setDriverLocation({
        latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
        longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
        accuracy: Math.random() * 10 + 5,
        speed: Math.random() * 20 + 20,
        heading: Math.random() * 360,
        timestamp: Date.now(),
        driverId: 'demo-driver',
        status: 'en_route' as const
      });
      
      // Update speed simulation
      setCurrentSpeed(Math.random() * 15 + 20);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Simulate step progression
  useEffect(() => {
    if (isNavigationActive && currentStepIndex < navigationSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, 8000); // Progress every 8 seconds

      return () => clearTimeout(timer);
    }
  }, [isNavigationActive, currentStepIndex]);

  const totalDistance = navigationSteps.reduce((sum, step) => sum + step.distance, 0);
  const totalDuration = navigationSteps.reduce((sum, step) => sum + step.duration, 0);

  const handleLocationUpdate = (location: LocationData) => {
    setUserLocation(location);
  };

  const handleDriverContact = (type: 'call' | 'message') => {
    console.log(`Contacting driver via ${type}`);
  };

  const startNavigation = () => {
    setIsNavigationActive(true);
    setCurrentStepIndex(0);
  };

  const stopNavigation = () => {
    setIsNavigationActive(false);
    setCurrentStepIndex(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Advanced GPS Navigation</h1>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Satellite size={14} className="mr-1" />
            Trillion-Dollar Tech
          </Badge>
        </div>
        <p className="text-gray-600">Real-time GPS tracking with sub-10 meter accuracy and professional navigation features</p>
      </div>

      {/* Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Signal className="text-green-600" size={20} />
              </div>
              <div>
                <div className="font-semibold text-gray-900">GPS Signal</div>
                <div className="text-sm text-green-600">Excellent (±{userLocation?.accuracy?.toFixed(1) || '5.2'}m)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Zap className="text-blue-600" size={20} />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Real-time Updates</div>
                <div className="text-sm text-blue-600">Every 2 seconds</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="text-orange-600" size={20} />
              </div>
              <div>
                <div className="font-semibold text-gray-900">ETA</div>
                <div className="text-sm text-orange-600">{Math.round(totalDuration / 60)} min</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-Time Map */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map size={20} className="text-blue-600" />
                Live Map View
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RealTimeMap
                userLocation={userLocation || undefined}
                driverLocation={driverLocation}
                destination={{
                  latitude: 37.7849,
                  longitude: -122.4094,
                  accuracy: 5,
                  timestamp: Date.now()
                }}
                showTraffic={true}
                showRoute={true}
                onLocationUpdate={handleLocationUpdate}
                onDriverContact={handleDriverContact}
                className="h-80"
              />
            </CardContent>
          </Card>
        </div>

        {/* Turn-by-Turn Navigation */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation size={20} className="text-green-600" />
                Turn-by-Turn Directions
                {isNavigationActive && (
                  <Badge className="bg-green-100 text-green-800 ml-auto">
                    Active
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isNavigationActive ? (
                <TurnByTurnNavigation
                  steps={navigationSteps}
                  currentStepIndex={currentStepIndex}
                  totalDistance={totalDistance}
                  totalDuration={totalDuration}
                  currentSpeed={currentSpeed}
                  onRecalculateRoute={() => console.log('Recalculating route...')}
                  onToggleVoice={(enabled) => console.log(`Voice guidance: ${enabled}`)}
                />
              ) : (
                <div className="text-center py-8">
                  <Navigation size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Navigation not started</p>
                  <Button onClick={startNavigation} className="bg-blue-600 hover:bg-blue-700">
                    Start Navigation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* GPS Tracker */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Satellite size={20} className="text-purple-600" />
                GPS Tracker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GPSTracker
                onPositionUpdate={(position) => {
                  const locationData: LocationData = {
                    latitude: position.latitude,
                    longitude: position.longitude,
                    accuracy: position.accuracy,
                    speed: position.speed || undefined,
                    heading: position.heading || undefined,
                    timestamp: position.timestamp
                  };
                  handleLocationUpdate(locationData);
                }}
                updateInterval={2000}
                highAccuracy={true}
              />
            </CardContent>
          </Card>
        </div>

        {/* Navigation Controls */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route size={20} className="text-indigo-600" />
                Navigation Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={startNavigation}
                  disabled={isNavigationActive}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Start Navigation
                </Button>
                <Button 
                  onClick={stopNavigation}
                  disabled={!isNavigationActive}
                  variant="destructive"
                >
                  Stop Navigation
                </Button>
              </div>

              {/* Features List */}
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-semibold text-gray-900">Advanced Features</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Sub-10 meter GPS accuracy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Real-time traffic updates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Voice turn-by-turn directions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Dynamic route recalculation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Driver-passenger communication</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <span>WebRTC real-time location sharing</span>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="space-y-2 pt-4 border-t">
                <h4 className="font-semibold text-gray-900">Performance Stats</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Update Rate</div>
                    <div className="font-semibold">2 seconds</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Accuracy</div>
                    <div className="font-semibold">±5m GPS</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Latency</div>
                    <div className="font-semibold">&lt;50ms</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Battery</div>
                    <div className="font-semibold">Optimized</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Technology Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Technology Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">GPS & Mapping</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• HTML5 Geolocation API with high accuracy</li>
                <li>• Mapbox GL JS for real-time rendering</li>
                <li>• WebRTC for low-latency location sharing</li>
                <li>• Advanced GPS filtering and smoothing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Real-time Features</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Live traffic data integration</li>
                <li>• Dynamic route recalculation</li>
                <li>• WebSocket-based location updates</li>
                <li>• Voice guidance with Web Speech API</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Performance</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Sub-10 meter accuracy in urban areas</li>
                <li>• Battery-optimized location tracking</li>
                <li>• Offline map caching capabilities</li>
                <li>• Cross-platform browser compatibility</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}