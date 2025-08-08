import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { Car, User, MapPin } from "lucide-react";

export default function Landing() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [userType, setUserType] = useState("rider");

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen relative overflow-hidden">
      {!isRegistering ? (
        // Login Screen
        <div className="flex flex-col h-screen">
          <div className="flex-1 flex flex-col justify-center px-6 py-8">
            {/* Hero Image */}
            <div className="relative mb-8">
              <img
                src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"
                alt="Modern cityscape"
                className="w-full h-48 rounded-2xl object-cover shadow-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-brand-dark mb-2">Welcome to RideShare</h1>
              <p className="text-gray-medium text-lg">Your journey starts here</p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => window.location.href = '/api/login'}
                className="w-full bg-brand-green text-white py-4 rounded-xl font-semibold text-lg hover:bg-green-600"
                data-testid="button-login"
              >
                Sign In
              </Button>

              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-4 text-gray-medium text-sm">or</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              <Button
                onClick={() => setIsRegistering(true)}
                variant="outline"
                className="w-full border border-gray-200 text-brand-dark py-4 rounded-xl font-semibold text-lg"
                data-testid="button-register"
              >
                Create Account
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Registration Screen
        <div className="flex flex-col h-screen">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <Button
              onClick={() => setIsRegistering(false)}
              variant="ghost"
              size="icon"
              className="rounded-full"
              data-testid="button-back"
            >
              ←
            </Button>
            <h2 className="text-xl font-semibold">Create Account</h2>
            <div className="w-10"></div>
          </div>

          <div className="flex-1 px-6 py-8">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4 mb-6">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      className="mt-1"
                      data-testid="input-fullname"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      className="mt-1"
                      data-testid="input-phone"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <Label className="text-sm font-medium mb-3">I want to</Label>
                  <RadioGroup
                    value={userType}
                    onValueChange={setUserType}
                    className="space-y-3"
                    data-testid="radio-usertype"
                  >
                    <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:border-brand-green">
                      <RadioGroupItem value="rider" id="rider" />
                      <div className="flex-1">
                        <Label htmlFor="rider" className="font-medium cursor-pointer">
                          Request rides
                        </Label>
                        <p className="text-sm text-gray-medium">Book rides as a passenger</p>
                      </div>
                      <User className="w-5 h-5 text-brand-green" />
                    </div>
                    <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:border-brand-green">
                      <RadioGroupItem value="driver" id="driver" />
                      <div className="flex-1">
                        <Label htmlFor="driver" className="font-medium cursor-pointer">
                          Drive and earn
                        </Label>
                        <p className="text-sm text-gray-medium">Sign up as a driver</p>
                      </div>
                      <Car className="w-5 h-5 text-brand-green" />
                    </div>
                  </RadioGroup>
                </div>

                <Button
                  onClick={() => window.location.href = '/api/login'}
                  className="w-full bg-brand-green text-white py-4 rounded-xl font-semibold text-lg"
                  data-testid="button-create-account"
                >
                  Create Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
