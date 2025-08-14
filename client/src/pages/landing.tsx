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
                className="w-40 h-12 bg-brand-green text-white rounded font-semibold hover:bg-green-600"
                data-testid="button-login"
              >
                Log in
              </Button>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={() => window.location.href = '/api/login'}
                variant="outline"
                className="w-36 h-10 border border-blue-600 text-blue-600 rounded font-medium hover:bg-blue-50 text-sm"
                data-testid="button-signup"
              >
                Sign up
              </Button>
            </div>

            <div className="flex justify-center mt-4">
              <Button
                onClick={() => window.location.href = '/api/login'}
                variant="outline"
                className="w-36 h-10 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 text-xs flex items-center justify-center gap-1 px-2"
                data-testid="button-google-login"
              >
                <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-[10px] whitespace-nowrap">Continue with Google</span>
              </Button>
            </div>

            <div className="flex justify-center mt-2">
              <Button
                onClick={() => window.location.href = '/api/login'}
                variant="outline"
                className="w-36 h-10 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 text-xs flex items-center justify-center gap-1 px-2"
                data-testid="button-apple-login"
              >
                <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#000000" d="M12.017 0C8.396 0 8.025.015 6.624.072 5.22.128 4.297.333 3.488.63c-.83.319-1.53.745-2.218 1.433C.582 2.751.156 3.45-.163 4.281c-.297.809-.502 1.732-.558 3.136C-.678 8.817-.664 9.188-.664 12.808s-.014 3.99.072 5.392c.056 1.404.261 2.327.558 3.136.319.83.745 1.53 1.433 2.218.688.688 1.387 1.114 2.218 1.433.809.297 1.732.502 3.136.558 1.4.057 1.771.072 5.392.072s3.99-.015 5.392-.072c1.404-.056 2.327-.261 3.136-.558.83-.319 1.53-.745 2.218-1.433.688-.688 1.114-1.387 1.433-2.218.297-.809.502-1.732.558-3.136.057-1.4.072-1.771.072-5.392s-.015-3.99-.072-5.392c-.056-1.404-.261-2.327-.558-3.136-.319-.83-.745-1.53-1.433-2.218C19.376 1.414 18.677.988 17.846.669c-.809-.297-1.732-.502-3.136-.558C13.31-.678 12.939-.664 9.319-.664 5.699-.664 5.328-.649 3.927-.592 2.525-.536 1.602-.331.791-.034.344.154.02.478-.163.925-.297.809-.502 1.732-.558 3.136-.678 8.817-.664 9.188-.664 12.808s-.014 3.99.072 5.392c.056 1.404.261 2.327.558 3.136.319.83.745 1.53 1.433 2.218.688.688 1.387 1.114 2.218 1.433.809.297 1.732.502 3.136.558 1.4.057 1.771.072 5.392.072s3.99-.015 5.392-.072c1.404-.056 2.327-.261 3.136-.558.83-.319 1.53-.745 2.218-1.433.688-.688 1.114-1.387 1.433-2.218.297-.809.502-1.732.558-3.136.057-1.4.072-1.771.072-5.392zm-1.3 5.401c0 3.709-.017 4.15-.07 5.516-.053 1.243-.251 1.92-.42 2.366-.22.565-.482.965-.902 1.385-.42.42-.82.682-1.385.902-.446.169-1.123.367-2.366.42-1.366.053-1.807.07-5.516.07s-4.15-.017-5.516-.07c-1.243-.053-1.92-.251-2.366-.42-.565-.22-.965-.482-1.385-.902-.42-.42-.682-.82-.902-1.385-.169-.446-.367-1.123-.42-2.366-.053-1.366-.07-1.807-.07-5.516s.017-4.15.07-5.516c.053-1.243.251-1.92.42-2.366.22-.565.482-.965.902-1.385.42-.42.82-.682 1.385-.902.446-.169 1.123-.367 2.366-.42C7.66 1.317 8.101 1.3 11.81 1.3s4.15.017 5.516.07c1.243.053 1.92.251 2.366.42.565.22.965.482 1.385.902.42.42.682.82.902 1.385.169.446.367 1.123.42 2.366.053 1.366.07 1.807.07 5.516z"/>
                </svg>
                <span className="text-[10px] whitespace-nowrap">Continue with Apple</span>
              </Button>
            </div>

            <div className="flex justify-center mt-2">
              <Button
                onClick={() => window.location.href = '/api/login'}
                variant="outline"
                className="w-36 h-10 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 text-xs flex items-center justify-center gap-1 px-2"
                data-testid="button-github-login"
              >
                <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#333" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span className="text-[10px] whitespace-nowrap">Continue with GitHub</span>
              </Button>
            </div>

            <div className="flex justify-center mt-2">
              <Button
                onClick={() => window.location.href = '/api/login'}
                variant="outline"
                className="w-36 h-10 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 text-xs flex items-center justify-center gap-1 px-2"
                data-testid="button-facebook-login"
              >
                <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-[10px] whitespace-nowrap">Continue with Facebook</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
