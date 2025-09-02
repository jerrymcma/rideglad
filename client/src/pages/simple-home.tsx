import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, User, LogOut, MapPin, Youtube, Facebook, Music, BadgeDollarSign, Settings, CreditCard, Satellite, ArrowLeft, UserCog } from "lucide-react";
import { SiTiktok, SiInstagram, SiGoogle } from "react-icons/si";
import { useAuth } from "@/hooks/useAuth";
import carVideo from "@assets/Screen_Recording_20250816_142532_Chrome_1755372514460.mp4";
import logoImage from "@assets/Screenshot_20250901_174911_Canva_1756776836813.jpg";
import rideLogoImage from "@assets/Screenshot_20250818_223935_Canva_1755574798589.jpg";
import rideSideLogoImage from "@assets/Screenshot_20250817_014843_Canva_1755414233355.jpg";
import driveIconImage from "@assets/Screenshot_20250818_213338_Canva_1755570832658.jpg";
import skyBackgroundImage from "@assets/generated_images/Light_blue_sky_with_clouds_3063d711.png";

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
    <div className="max-w-sm mx-auto min-h-screen relative overflow-hidden bg-white">
      {/* Content Overlay */}
      <div className="relative z-10 bg-white/60 backdrop-blur-sm min-h-screen">
        <div className="p-6 text-[15px] pb-20">
        {/* Header - positioned at very top */}
        <div className="text-center space-y-1 pt-[0px] pb-[0px] mt-[10px] mb-[10px]">
          <div className="flex justify-center mb-4">
            <img 
              src={logoImage} 
              alt="ride - Get there.™"
              className="w-48 h-auto mt-[0px] mb-[0px] pt-[0px] pb-[0px] pl-[18px] pr-[18px]"
            />
          </div>
          <p className="text-[18px] text-[#343e54] font-medium">Glad to see you {(user as any)?.firstName || 'User'}!</p>
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
                <h3 className="text-brand-green font-semibold text-[16px]">Book a ride</h3>
              </div>
              <div className="text-center py-1 pb-3 px-6">
                <p className="text-gray-700 text-[14px]">Get there.™</p>
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
              <div className="text-center px-6 pt-[5px] pb-[5px]">
                <div className="flex justify-center mb-1">
                  <Car size={40} className="text-blue-600" />
                </div>
                <h3 className="text-blue-600 text-[16px] font-semibold">Drive + Earn</h3>
              </div>
              <div className="text-center py-1 px-6 pt-[0px] pb-[0px]">
                <p className="text-gray-700 text-[14px]">Make money</p>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-2 gap-3">
            <div 
              className="cursor-pointer hover:shadow-md transition-shadow border-2 border-[#128a43] rounded-lg h-full bg-white"
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
                <div className="flex justify-center mb-1 text-[#128a43]">
                  <CreditCard size={32} className="text-[#128a43]" />
                </div>
                <h3 className="font-semibold text-[16px] text-[#128a43]">Wallet</h3>
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
                console.log('Account Management clicked, navigating to /profile');
                setLocation('/profile');
              }}
              data-testid="card-account-management"
            >
              <div className="text-center pb-0 pt-3 px-6">
                <div className="flex justify-center mb-1">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {(user as any)?.profileImageUrl ? (
                      <img 
                        src={(user as any).profileImageUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={28} className="text-gray-400" />
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-[16px] text-gray-400">Account</h3>
              </div>
              <div className="text-center py-1 pb-3 px-6">
                <p className="text-gray-700 text-[14px]">VIP Console</p>
              </div>
            </div>
          </div>

          {/* Advanced GPS Row */}
          <div className="flex justify-center">
            <div 
              className="cursor-pointer hover:shadow-md transition-shadow border-2 border-[#4da6ff] rounded-lg bg-white w-1/2"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Advanced GPS clicked, navigating to /advanced-navigation');
                setLocation('/advanced-navigation');
              }}
              data-testid="card-advanced-gps"
            >
              <div className="text-center pb-0 pt-3 px-6">
                <div className="flex justify-center mb-1">
                  <Satellite size={36} className="text-[#4da6ff]" />
                </div>
                <h3 className="text-[#4da6ff] text-[15px] font-semibold">Advanced GPS</h3>
              </div>
              <div className="text-center py-1 pb-3 px-6">
                <p className="text-gray-700 text-[14px]">Live Satellites </p>
              </div>
            </div>
          </div>
        </div>

        {/* Extra spacing after main actions */}
        <div className="pb-3"></div>

        {/* Video Section */}
        <div className="flex justify-center">
          <div className="relative w-2/5">
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
            <div className="absolute left-1/2 bottom-4 car-bob">
              <img 
                src={rideSideLogoImage} 
                alt="ride"
                className="h-3 w-auto opacity-80"
              />
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="space-y-4 pt-4">
        </div>
        </div>
      </div>
      {/* Back Button - positioned at very left edge, aligned with video bottom */}
      <div className="absolute bottom-16 left-0 z-20">
        <Button
          onClick={() => {
            console.log('Back button clicked - logging out');
            window.location.href = '/api/logout';
          }}
          variant="ghost"
          className="p-10 hover:bg-gray-100 rounded-full min-w-[100px] min-h-[100px] flex items-center justify-center"
          data-testid="button-back"
        >
          <ArrowLeft size={48} className="text-gray-600" />
        </Button>
      </div>
    </div>
  );
}