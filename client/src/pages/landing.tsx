import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import logoImage from "@assets/Take a look at my Canva design!_1754653520248.png";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen">
      <div className="flex flex-col h-screen justify-center px-8">
        <div className="text-center space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <img 
              src={logoImage} 
              alt="Ride - Get there"
              className="w-80 h-auto"
              data-testid="logo-image"
            />
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Label htmlFor="email" className="text-blue-600 font-medium block">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-64 mx-auto border border-gray-300 rounded px-3 py-1 h-8"
                data-testid="input-email"
              />
            </div>

            <div className="text-center space-y-2">
              <Label htmlFor="password" className="text-blue-600 font-medium block">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-64 mx-auto border border-gray-300 rounded px-3 py-1 h-8"
                data-testid="input-password"
              />
            </div>

            <div className="flex justify-center">
              <Button
                onClick={() => window.location.href = '/api/login'}
                className="w-32 h-12 bg-brand-green text-white rounded font-semibold hover:bg-green-600"
                data-testid="button-login"
              >
                Log in
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
