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
      <div className="flex flex-col h-screen justify-center px-8 -mt-12">
        <div className="text-center space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <img 
              src={logoImage} 
              alt="ride - Get there"
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
                className="w-48 mx-auto border border-gray-300 rounded px-2 py-1 h-8"
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
                className="w-48 mx-auto border border-gray-300 rounded px-2 py-1 h-8"
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

            <div className="flex justify-center">
              <Button
                onClick={() => window.location.href = '/api/login'}
                variant="outline"
                className="w-24 h-8 border border-blue-600 text-blue-600 rounded font-medium hover:bg-blue-50 text-sm"
                data-testid="button-signup"
              >
                Sign up
              </Button>
            </div>

            <div className="flex justify-center mt-4">
              <Button
                onClick={() => window.location.href = '/api/login'}
                variant="outline"
                className="w-48 h-10 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 text-sm flex items-center justify-center gap-2"
                data-testid="button-google-login"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
