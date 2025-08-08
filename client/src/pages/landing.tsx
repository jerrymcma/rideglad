import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen">
      <div className="flex flex-col h-screen justify-center px-8">
        <div className="text-center space-y-8">
          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-black">ride</h1>
            <p className="text-xl text-blue-600">Get there</p>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            <div className="text-left space-y-2">
              <Label htmlFor="email" className="text-blue-600 font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                data-testid="input-email"
              />
            </div>

            <div className="text-left space-y-2">
              <Label htmlFor="password" className="text-blue-600 font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                data-testid="input-password"
              />
            </div>

            <Button
              onClick={() => window.location.href = '/api/login'}
              className="w-full bg-brand-green text-white py-3 rounded font-semibold hover:bg-green-600"
              data-testid="button-login"
            >
              Log in
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
