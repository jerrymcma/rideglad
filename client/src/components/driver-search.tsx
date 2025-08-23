import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, X, Check, Car } from "lucide-react";
import type { Trip } from "@shared/schema";

interface DriverSearchProps {
  trip: Trip;
  onCancel: () => void;
  onDriverMatched: () => void;
}

export default function DriverSearch({ trip, onCancel, onDriverMatched }: DriverSearchProps) {
  const [searchProgress, setSearchProgress] = useState(1);

  const matchDriverMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/trips/${trip.id}/match`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips/active'] });
      onDriverMatched();
    },
  });

  useEffect(() => {
    // Simulate search progress
    const progressTimer = setInterval(() => {
      setSearchProgress(prev => {
        if (prev >= 3) {
          clearInterval(progressTimer);
          // Simulate finding a driver after search completes
          setTimeout(() => {
            matchDriverMutation.mutate();
          }, 1000);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(progressTimer);
  }, []);

  const cancelTripMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('PATCH', `/api/trips/${trip.id}/status`, { status: 'cancelled' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      onCancel();
    },
  });

  const searchSteps = [
    { id: 1, title: "Route confirmed", completed: true },
    { id: 2, title: "Finding nearby drivers", completed: searchProgress >= 2 },
    { id: 3, title: "Driver assignment", completed: searchProgress >= 3 },
  ];

  return (
    <div className="absolute inset-0 bg-white z-50">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <Button 
              onClick={onCancel}
              variant="ghost"
              className="p-3 hover:bg-gray-100 rounded-full"
              data-testid="button-back"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </Button>
            <h2 className="text-lg font-semibold">Finding your driver</h2>
            <Button 
              onClick={() => cancelTripMutation.mutate()}
              variant="ghost"
              size="icon"
              className="rounded-full"
              data-testid="button-cancel-search"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search Animation */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="relative mb-8">
            <div className="w-32 h-32 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Car className="h-8 w-8 text-brand-green" />
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-brand-dark mb-2">Searching for drivers</h3>
          <p className="text-gray-medium text-center mb-8">We're connecting you with nearby drivers in your area</p>

          {/* Search Progress */}
          <div className="w-full max-w-xs space-y-4" data-testid="search-progress">
            {searchSteps.map(step => (
              <div key={step.id} className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step.completed 
                    ? 'bg-brand-green' 
                    : step.id === searchProgress 
                      ? 'bg-brand-green animate-pulse' 
                      : 'border-2 border-gray-200'
                }`}>
                  {step.completed && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className={`text-sm ${step.completed ? 'text-brand-dark' : 'text-gray-medium'}`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Trip Details */}
        <div className="px-6 py-6 border-t border-gray-100">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Trip details</span>
                <span className="text-sm text-brand-green font-semibold">${trip.estimatedPrice}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full mt-2"></div>
                  <span className="text-gray-700" data-testid="text-pickup">{trip.pickupAddress}</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 border-2 border-gray-400 rounded-full mt-2"></div>
                  <span className="text-gray-700" data-testid="text-destination">{trip.destinationAddress}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cancel Button */}
        <div className="px-6 pb-6">
          <Button 
            onClick={() => cancelTripMutation.mutate()}
            variant="outline"
            className="w-full border border-gray-200 text-brand-dark py-4 rounded-xl font-semibold"
            disabled={cancelTripMutation.isPending}
            data-testid="button-cancel-request"
          >
            {cancelTripMutation.isPending ? 'Cancelling...' : 'Cancel Request'}
          </Button>
        </div>
      </div>
    </div>
  );
}
