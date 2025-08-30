import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, ArrowLeft, Check, MapPin, Clock, DollarSign } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { PaymentMethod } from "@/../../shared/schema";
import { useLocation } from "wouter";

interface CheckoutProps {
  trip?: {
    id: string;
    pickupLocation: string;
    destination: string;
    distance: number;
    estimatedDuration: number;
    totalCost: number;
    baseFare: number;
    distanceCost: number;
  };
  onPaymentSuccess?: (paymentId: string) => void;
}

export default function Checkout({ trip, onPaymentSuccess }: CheckoutProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Fetch payment methods
  const { data: paymentMethods = [], isLoading } = useQuery({
    queryKey: ['/api/payment-methods'],
    enabled: true
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (data: { paymentMethodId: string; tripId: string; amount: number }) => {
      const response = await apiRequest('POST', '/api/process-payment', data);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully."
      });
      if (data && typeof data === 'object' && 'paymentId' in data) {
        onPaymentSuccess?.(data.paymentId as string);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive"
      });
      setIsProcessingPayment(false);
    }
  });

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      toast({
        title: "No payment method selected",
        description: "Please select a payment method to continue.",
        variant: "destructive"
      });
      return;
    }

    if (!trip) {
      toast({
        title: "No trip information",
        description: "Trip information is missing.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingPayment(true);
    processPaymentMutation.mutate({
      paymentMethodId: selectedPaymentMethod,
      tripId: trip.id,
      amount: trip.totalCost
    });
  };

  const getCardType = (number: string) => {
    const cleanNumber = number.replace(/\s/g, '');
    if (cleanNumber.match(/^4/)) return 'Visa';
    if (cleanNumber.match(/^5[1-5]/)) return 'Mastercard';
    if (cleanNumber.match(/^3[47]/)) return 'American Express';
    if (cleanNumber.match(/^6/)) return 'Discover';
    return 'Card';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Mock trip data if none provided (for testing)
  const displayTrip = trip || {
    id: 'mock-trip',
    pickupLocation: '123 Main St, City, State',
    destination: '456 Oak Ave, City, State',
    distance: 3.2,
    estimatedDuration: 12,
    totalCost: 4.28,
    baseFare: 2.00,
    distanceCost: 1.28
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-center">Checkout</h1>
        </div>

        {/* Trip Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin size={20} className="text-blue-600" />
              Trip Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">From</p>
              <p className="font-medium">{displayTrip.pickupLocation}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">To</p>
              <p className="font-medium">{displayTrip.destination}</p>
            </div>
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1">
                <MapPin size={14} className="text-gray-500" />
                <span>{displayTrip.distance} mi</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} className="text-gray-500" />
                <span>{displayTrip.estimatedDuration} min</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Breakdown */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign size={20} className="text-green-600" />
              Price Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Base fare</span>
              <span>${displayTrip.baseFare.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Distance ({displayTrip.distance} mi × $0.40)</span>
              <span>${displayTrip.distanceCost.toFixed(2)}</span>
            </div>
            <hr />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${displayTrip.totalCost.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard size={20} />
                Payment Method
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/payment-methods')}
                className="text-blue-600 text-sm"
                data-testid="button-manage-cards"
              >
                Manage Cards
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethods.length === 0 ? (
              <div className="text-center py-6">
                <CreditCard size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No payment methods found</p>
                <Button
                  onClick={() => setLocation('/payment-methods')}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-add-payment-method"
                >
                  Add Payment Method
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((method: PaymentMethod) => (
                  <div
                    key={method.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPaymentMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    data-testid={`payment-method-${method.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard size={20} className="text-gray-600" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {method.brand || 'Card'} •••• {method.lastFour}
                            </span>
                            {method.isDefault && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {method.expiryMonth && method.expiryYear ? 
                              `Expires ${method.expiryMonth.toString().padStart(2, '0')}/${method.expiryYear}` :
                              'Card on file'
                            }
                          </p>
                        </div>
                      </div>
                      {selectedPaymentMethod === method.id && (
                        <Check size={20} className="text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Button */}
        <Button
          onClick={handlePayment}
          className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-lg font-semibold"
          disabled={!selectedPaymentMethod || isProcessingPayment || processPaymentMutation.isPending}
          data-testid="button-confirm-payment"
        >
          {isProcessingPayment || processPaymentMutation.isPending ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              Processing Payment...
            </div>
          ) : (
            `Pay $${displayTrip.totalCost.toFixed(2)}`
          )}
        </Button>

        {/* Security Note */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <strong>🔒 Secure Payment:</strong> Your payment is processed securely using 
            industry-standard encryption. Your card details are never stored on our servers.
          </p>
        </div>
      </div>
      
      {/* Fixed Back Button - Bottom Left */}
      <Button
        onClick={() => setLocation('/ride')}
        variant="outline"
        className="fixed bottom-6 left-6 p-3 rounded-full bg-white border-2 border-gray-300 hover:bg-gray-50 shadow-lg"
        data-testid="button-back-fixed"
      >
        <ArrowLeft size={20} className="text-gray-600" />
      </Button>
    </div>
  );
}