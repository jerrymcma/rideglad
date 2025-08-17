import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, User, LogOut, MapPin, Youtube, Facebook, Music, BadgeDollarSign, Settings, CreditCard } from "lucide-react";
import { SiTiktok, SiInstagram, SiGoogle } from "react-icons/si";
import { useAuth } from "@/hooks/useAuth";
import carVideo from "@assets/Screen_Recording_20250816_142532_Chrome_1755372514460.mp4";
import logoImage from "@assets/Screenshot_20250817_013158_Canva_1755412353486.jpg";
import rideLogoImage from "@assets/Screenshot_20250817_014843_Canva_1755413475958.jpg";
import rideSideLogoImage from "@assets/Screenshot_20250817_014843_Canva_1755414233355.jpg";
import driveIconImage from "@assets/Screenshot_20250817_151959_Canva_1755465710669.jpg";

export default function SimpleHome() {
  console.log('SimpleHome component is rendering');
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Scroll to top when component mounts
  useEffect(() => {
    // Multiple approaches to ensure page opens at top
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    // Immediate scroll
    scrollToTop();

    // Additional scrolls with increasing delays to handle various loading scenarios
    const timeouts = [0, 50, 100, 200, 500];
    const clearTimeouts = timeouts.map(delay => 
      setTimeout(scrollToTop, delay)
    );

    // Cleanup function
    return () => {
      clearTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen">
      <div className="p-6 space-y-6 mt-60">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl text-center font-extrabold text-[#2a5aeb]">Welcome to ride!</h1>
          <p className="text-2xl font-bold text-[#464f6b]">Hello, {(user as any)?.firstName || 'User'}</p>
        </div>

        {/* Main Actions */}
        <div className="space-y-3">
          {/* Top Row */}
          <div className="grid grid-cols-2 gap-3">
            <div 
              className="cursor-pointer hover:shadow-md transition-shadow border-2 border-brand-green rounded-lg h-full bg-white"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Book a ride clicked, current location:', window.location.pathname);
                console.log('setLocation function:', typeof setLocation);
                try {
                  setLocation('/ride');
                  console.log('setLocation called successfully');
                } catch (error) {
                  console.error('Error calling setLocation:', error);
                }
                setTimeout(() => {
                  console.log('After setLocation, pathname:', window.location.pathname);
                  console.log('After setLocation, href:', window.location.href);
                }, 100);
              }}
              data-testid="card-book-ride"
            >
              <div className="text-center pb-0 pt-3 px-6">
                <div className="flex justify-center mb-1">
                  <MapPin size={32} className="text-brand-green" />
                </div>
                <h3 className="text-lg text-brand-green font-semibold">Book a ride</h3>
              </div>
              <div className="text-center py-1 pb-3 px-6">
                <p className="text-gray-700 text-[14px]">Get there.</p>
              </div>
            </div>

            <div 
              className="cursor-pointer hover:shadow-md transition-shadow border-2 border-blue-600 rounded-lg h-full bg-white"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Drive & Earn clicked, navigating to /driver');
                setLocation('/driver');
              }}
              data-testid="card-driver-dashboard"
            >
              <div className="text-center pb-0 pt-3 px-6">
                <div className="flex justify-center mb-1">
                  <img 
                    src={driveIconImage} 
                    alt="Drive & Earn"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </div>
                <h3 className="text-blue-600 text-lg font-semibold">Drive & Earn</h3>
              </div>
              <div className="text-center py-1 pb-3 px-6">
                <p className="text-gray-700 text-[14px]">Make money</p>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-2 gap-3">
            <div 
              className="cursor-pointer hover:shadow-md transition-shadow border-2 border-[#039637] rounded-lg h-full bg-white"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Payment button clicked, navigating to /payment-methods');
                console.log('setLocation function:', typeof setLocation);
                try {
                  setLocation('/payment-methods');
                  console.log('setLocation called successfully');
                } catch (error) {
                  console.error('Error calling setLocation:', error);
                }
                setTimeout(() => {
                  console.log('After setLocation, pathname:', window.location.pathname);
                  console.log('After setLocation, href:', window.location.href);
                }, 100);
              }}
              data-testid="card-payment-methods"
            >
              <div className="text-center pb-0 pt-3 px-6">
                <div className="flex justify-center mb-1">
                  <CreditCard size={32} className="text-green-800" />
                </div>
                <h3 className="text-lg font-semibold text-[#039637]">Payment</h3>
              </div>
              <div className="text-center py-1 pb-3 px-6">
                <p className="text-gray-700 text-[14px]">Manage money</p>
              </div>
            </div>

            <div 
              className="cursor-pointer hover:shadow-md transition-shadow border-2 border-gray-400 rounded-lg h-full bg-white"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // TODO: Navigate to settings page when created
                console.log('Settings clicked');
              }}
              data-testid="card-settings"
            >
              <div className="text-center pb-0 pt-3 px-6">
                <div className="flex justify-center mb-1">
                  <Settings size={32} className="text-gray-600" />
                </div>
                <h3 className="text-lg text-gray-600 font-semibold">Settings</h3>
              </div>
              <div className="text-center py-1 pb-3 px-6">
                <p className="text-gray-700 text-[14px]">Preferences</p>
              </div>
            </div>
          </div>
        </div>

        {/* Separation Line */}
        <div className="pt-4 border-t"></div>

        {/* Video Section */}
        <div className="flex justify-center">
          <div className="relative w-1/2">
            <video 
              className="w-full rounded-lg shadow-md"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src={carVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {/* Side Logo Overlay */}
            <div className="absolute left-1/2 transform -translate-x-1/2 bottom-6">
              <img 
                src={rideSideLogoImage} 
                alt="ride"
                className="h-4 w-auto opacity-80"
              />
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="space-y-4 pt-4">
        </div>
      </div>
    </div>
  );
}