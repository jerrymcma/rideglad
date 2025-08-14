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
      <div className="flex flex-col h-screen justify-center px-8 -mt-36">
        <div className="text-center space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="flex items-center">
              {/* 'rid' part */}
              <img 
                src={logoImage} 
                alt=""
                className="w-80 h-auto"
                style={{
                  clipPath: 'polygon(0% 0%, 78% 0%, 78% 100%, 0% 100%)'
                }}
              />
              {/* 'e' part with negative margin to pull closer */}
              <img 
                src={logoImage} 
                alt="ride - Get there"
                className="w-80 h-auto -ml-4"
                data-testid="logo-image"
                style={{
                  clipPath: 'polygon(78% 0%, 100% 0%, 100% 100%, 78% 100%)'
                }}
              />
            </div>
          </div>

          {/* Login Form */}
          <div className="space-y-4">
            <div className="text-center space-y-1">
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

            <div className="text-center space-y-1">
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

            <div className="flex justify-center mt-6">
              <Button
                onClick={() => window.location.href = '/api/login'}
                className="w-40 h-12 bg-brand-green text-white rounded font-semibold hover:bg-green-600 text-xl"
                data-testid="button-login"
              >
                Log in
              </Button>
            </div>

            <div className="flex justify-center mt-3">
              <Button
                onClick={() => window.location.href = '/api/login'}
                variant="outline"
                className="w-36 h-10 border border-blue-600 text-blue-600 rounded font-medium hover:bg-blue-50 text-base"
                data-testid="button-signup"
              >
                Sign up
              </Button>
            </div>

            <div className="flex justify-center gap-3 mt-3">
              <Button
                onClick={() => window.location.href = '/api/login'}
                variant="outline"
                className="w-12 h-10 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 flex items-center justify-center px-2"
                data-testid="button-google-login"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </Button>
              <Button
                onClick={() => window.location.href = '/api/login'}
                variant="outline"
                className="w-12 h-10 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 flex items-center justify-center px-2"
                data-testid="button-apple-login"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#000000" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </Button>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}
