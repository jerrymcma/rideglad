import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarFront, User, LogOut, MapPin, Youtube, Facebook, Music } from "lucide-react";
import { SiTiktok, SiInstagram } from "react-icons/si";
import { useAuth } from "@/hooks/useAuth";

export default function SimpleHome() {
  const { user } = useAuth();

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-black">Welcome!</h1>
          <p className="text-gray-600">Hello, {(user as any)?.firstName || 'User'}!</p>
        </div>

        {/* Main Actions */}
        <div className="space-y-3">
          <Link href="/rider">
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-brand-green">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-1">
                  <MapPin size={36} className="text-brand-green" />
                </div>
                <CardTitle className="text-lg text-brand-green">Book a ride</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-2">
                <p className="text-sm text-gray-600">Find a driver and destination</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/driver">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-1">
                  <CarFront size={36} className="text-blue-600" />
                </div>
                <CardTitle className="text-lg text-blue-600">Drive & Earn</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-2">
                <p className="text-sm text-gray-600">Start driving and earning money</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/account">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-1">
                  <User size={36} className="text-blue-600" />
                </div>
                <CardTitle className="text-lg text-blue-600">My Account</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-2">
                <p className="text-sm text-gray-600">Manage rides, money, and settings</p>
              </CardContent>
            </Card>
          </Link>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-1">
                <Music size={36} className="text-purple-600" />
              </div>
              <CardTitle className="text-lg text-purple-600">While you ride</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-2">
              <p className="text-sm text-gray-600 mb-3">Enjoy your trip. ride thanks you!</p>
              <div className="flex justify-center space-x-4">
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-700">
                  <Youtube size={24} />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                  <Facebook size={24} />
                </a>
                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-700">
                  <SiTiktok size={24} />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700">
                  <SiInstagram size={24} />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Section */}
        <div className="space-y-4 pt-4 border-t">
        </div>
      </div>
    </div>
  );
}