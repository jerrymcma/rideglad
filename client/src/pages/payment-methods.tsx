import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Plus, Trash2, Check, ArrowLeft, Receipt } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { PaymentMethod } from "@/../../shared/schema";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function PaymentMethods() {
  console.log('PaymentMethods component is rendering');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  console.log('PaymentMethods auth state:', { isAuthenticated, authLoading });

  // Redirect if not authenticated - but with additional safety check
  useEffect(() => {
    console.log('PaymentMethods useEffect triggered:', { isAuthenticated, authLoading });
    // Only redirect if we're absolutely sure the user is not authenticated
    // and we're not in a loading state
    if (!authLoading && isAuthenticated === false) {
      console.log('PaymentMethods: Definitely not authenticated, redirecting to home');
      setLocation('/');
    }
  }, [isAuthenticated, authLoading, setLocation]);
  const queryClient = useQueryClient();
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  
  // Form state for adding new card
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    }
  });

  // Fetch payment methods
  const { data: paymentMethods = [], isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ['/api/payment-methods'],
    enabled: isAuthenticated
  });

  // Show loading while checking authentication
  if (authLoading) {
    console.log('PaymentMethods: Still loading auth, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect via useEffect)
  if (!isAuthenticated) {
    console.log('PaymentMethods: Not authenticated, returning null');
    return null;
  }

  console.log('PaymentMethods: About to render main component');

  // Add payment method mutation
  const addPaymentMethodMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/payment-methods', data),
    onSuccess: () => {
      toast({
        title: "Payment method added",
        description: "Your card has been added successfully."
      });
      setIsAddingCard(false);
      setCardForm({
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        cardholderName: '',
        billingAddress: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'US'
        }
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add payment method.",
        variant: "destructive"
      });
    }
  });

  // Delete payment method mutation
  const deletePaymentMethodMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/payment-methods/${id}`),
    onSuccess: () => {
      toast({
        title: "Payment method removed",
        description: "Your card has been removed successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove payment method.",
        variant: "destructive"
      });
    }
  });

  // Set default payment method mutation
  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => apiRequest('PUT', `/api/payment-methods/${id}/default`),
    onSuccess: () => {
      toast({
        title: "Default payment method updated",
        description: "Your default payment method has been updated."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update default payment method.",
        variant: "destructive"
      });
    }
  });

  const handleAddCard = () => {
    if (!cardForm.cardNumber || !cardForm.expiryMonth || !cardForm.expiryYear || 
        !cardForm.cvv || !cardForm.cardholderName) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const cleanCardNumber = cardForm.cardNumber.replace(/\s/g, '');
    addPaymentMethodMutation.mutate({
      type: 'card',
      lastFour: cleanCardNumber.slice(-4),
      brand: getCardType(cleanCardNumber).toLowerCase(),
      cardNumber: cleanCardNumber, // This would be encrypted/tokenized in real app
      expiryMonth: parseInt(cardForm.expiryMonth),
      expiryYear: parseInt(cardForm.expiryYear),
      cardholderName: cardForm.cardholderName,
      billingAddress: cardForm.billingAddress
    });
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold">Payment Methods</h1>
        </div>

        {/* Existing Payment Methods */}
        <div className="space-y-3 mb-6">
          {(paymentMethods as PaymentMethod[])?.map((method: PaymentMethod) => (
            <Card key={method.id} className="relative">
              <CardContent className="p-4">
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
                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDefaultMutation.mutate(method.id)}
                        className="text-xs"
                        data-testid={`button-set-default-${method.id}`}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePaymentMethodMutation.mutate(method.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      data-testid={`button-delete-${method.id}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!paymentMethods || (paymentMethods as PaymentMethod[]).length === 0) && !isAddingCard && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <CreditCard size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No payment methods added yet</p>
                <Button
                  onClick={() => setIsAddingCard(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-add-first-card"
                >
                  <Plus size={16} className="mr-2" />
                  Add Your First Card
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        {paymentMethods && (paymentMethods as PaymentMethod[]).length > 0 && !isAddingCard && (
          <div className="space-y-3">
            <Button
              onClick={() => setLocation('/payment-history')}
              variant="outline"
              className="w-full h-12 text-green-600 hover:bg-green-50 border-green-600"
              data-testid="button-payment-history"
            >
              <Receipt size={20} className="mr-2" />
              View Payment History
            </Button>
            <Button
              onClick={() => setIsAddingCard(true)}
              variant="outline"
              className="w-full border-dashed border-2 h-12 text-blue-600 hover:bg-blue-50"
              data-testid="button-add-card"
            >
              <Plus size={20} className="mr-2" />
              Add New Card
            </Button>
          </div>
        )}

        {/* Add Card Form */}
        {isAddingCard && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard size={20} />
                Add New Card
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  value={cardForm.cardNumber}
                  onChange={(e) => setCardForm(prev => ({
                    ...prev,
                    cardNumber: formatCardNumber(e.target.value)
                  }))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  data-testid="input-card-number"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="expiryMonth">Month</Label>
                  <Input
                    id="expiryMonth"
                    value={cardForm.expiryMonth}
                    onChange={(e) => setCardForm(prev => ({
                      ...prev,
                      expiryMonth: e.target.value
                    }))}
                    placeholder="MM"
                    maxLength={2}
                    data-testid="input-expiry-month"
                  />
                </div>
                <div>
                  <Label htmlFor="expiryYear">Year</Label>
                  <Input
                    id="expiryYear"
                    value={cardForm.expiryYear}
                    onChange={(e) => setCardForm(prev => ({
                      ...prev,
                      expiryYear: e.target.value
                    }))}
                    placeholder="YYYY"
                    maxLength={4}
                    data-testid="input-expiry-year"
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    value={cardForm.cvv}
                    onChange={(e) => setCardForm(prev => ({
                      ...prev,
                      cvv: e.target.value
                    }))}
                    placeholder="123"
                    maxLength={4}
                    type="password"
                    data-testid="input-cvv"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  value={cardForm.cardholderName}
                  onChange={(e) => setCardForm(prev => ({
                    ...prev,
                    cardholderName: e.target.value
                  }))}
                  placeholder="John Doe"
                  data-testid="input-cardholder-name"
                />
              </div>

              <div>
                <Label htmlFor="street">Billing Address</Label>
                <Input
                  id="street"
                  value={cardForm.billingAddress.street}
                  onChange={(e) => setCardForm(prev => ({
                    ...prev,
                    billingAddress: { ...prev.billingAddress, street: e.target.value }
                  }))}
                  placeholder="123 Main St"
                  className="mb-3"
                  data-testid="input-street"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    value={cardForm.billingAddress.city}
                    onChange={(e) => setCardForm(prev => ({
                      ...prev,
                      billingAddress: { ...prev.billingAddress, city: e.target.value }
                    }))}
                    placeholder="City"
                    data-testid="input-city"
                  />
                  <Input
                    value={cardForm.billingAddress.state}
                    onChange={(e) => setCardForm(prev => ({
                      ...prev,
                      billingAddress: { ...prev.billingAddress, state: e.target.value }
                    }))}
                    placeholder="State"
                    data-testid="input-state"
                  />
                </div>
                <Input
                  value={cardForm.billingAddress.zipCode}
                  onChange={(e) => setCardForm(prev => ({
                    ...prev,
                    billingAddress: { ...prev.billingAddress, zipCode: e.target.value }
                  }))}
                  placeholder="ZIP Code"
                  className="mt-3"
                  data-testid="input-zip"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setIsAddingCard(false)}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-cancel-add-card"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddCard}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={addPaymentMethodMutation.isPending}
                  data-testid="button-save-card"
                >
                  {addPaymentMethodMutation.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Check size={16} className="mr-2" />
                      Save Card
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>🔒 Secure:</strong> Your payment information is encrypted and secure. 
            We use industry-standard security measures to protect your data.
          </p>
        </div>
      </div>

      {/* Fixed Back Button */}
      <Button
        onClick={() => setLocation('/')}
        variant="outline"
        className="fixed bottom-6 left-6 p-3 rounded-full bg-white border-2 border-gray-300 hover:bg-gray-50 shadow-lg"
        data-testid="button-back-fixed"
      >
        <ArrowLeft size={20} className="text-gray-600" />
      </Button>
    </div>
  );
}