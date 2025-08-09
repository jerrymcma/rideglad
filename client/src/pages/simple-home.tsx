import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, History, User, LogOut, MapPin } from "lucide-react";
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
        <div className="space-y-4">
          <Link href="/rider">
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-brand-green">
              <CardHeader className="text-center pb-3">
                <div className="flex justify-center mb-2">
                  <MapPin size={48} className="text-brand-green" />
                </div>
                <CardTitle className="text-xl text-brand-green">Book a ride</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">Find a driver and destination</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/driver">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="text-center pb-3">
                <div className="flex justify-center mb-2">
                  <Car size={48} className="text-blue-600" />
                </div>
                <CardTitle className="text-xl text-blue-600">Drive & Earn</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">Start driving and earning money</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/trips">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="text-center pb-3">
                <div className="flex justify-center mb-2">
                  <History size={48} className="text-gray-600" />
                </div>
                <CardTitle className="text-xl text-gray-600">Trip History</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">View your past trips and rides</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/account">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="text-center pb-3">
                <div className="flex justify-center mb-2">
                  <User size={48} className="text-blue-600" />
                </div>
                <CardTitle className="text-xl text-blue-600">My Account</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">Manage your profile and settings</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Profile Section */}
        <div className="space-y-4 pt-4 border-t">
        </div>
      </div>
    </div>
  );
}