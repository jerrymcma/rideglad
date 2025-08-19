import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Navigation, 
  Satellite, 
  ArrowLeft,
  Zap,
  Clock,
  Signal,
  Map
} from "lucide-react";

export default function AdvancedNavigation() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-center mb-2">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="absolute left-0">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold text-blue-600">Advanced GPS Navigation</h1>
        </div>
        <p className="text-[#272d33] text-center">     Real-time GPS tracking - 10m accuracy - innovative rideshare technology</p>
      </div>
      {/* Demo Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map size={28} className="text-green-600" />
              <span className="text-[#276de5] text-[24px] font-bold">Real-Time Map (Demo)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-gradient-to-br from-blue-50 via-gray-50 to-green-50 rounded-lg flex items-center justify-center border">
              <div className="text-center">
                <Satellite size={72} className="text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Revolutionary GPS Technology</h3>
                <p className="text-gray-600">First-of-its-kind rideshare navigation system</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live tracking active</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Satellite connection strong</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation size={20} className="text-green-600" />
              Navigation Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Signal size={16} className="text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Sub-10m GPS Accuracy</div>
                  <div className="text-sm text-green-600">Professional grade tracking</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Zap size={16} className="text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Real-time Updates</div>
                  <div className="text-sm text-blue-600">2-second refresh rate</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <Clock size={16} className="text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Voice Navigation</div>
                  <div className="text-sm text-orange-600">Turn-by-turn guidance</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Technology Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Advanced GPS Technology Overview</CardTitle>
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