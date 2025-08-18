import { useLocation } from "wouter";
import { ArrowLeft, CreditCard, Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function PaymentMethodsSimple() {
  const [, setLocation] = useLocation();
  const [paymentMethods] = useState([
    {
      id: 1,
      type: 'Visa',
      last4: '4242',
      expiry: '12/26',
      isDefault: true
    },
    {
      id: 2,
      type: 'Mastercard',
      last4: '8888',
      expiry: '08/25',
      isDefault: false
    }
  ]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="p-2 hover:bg-gray-100"
              data-testid="button-back"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Payment Methods</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Add Payment Method Button */}
          <div 
            className="flex items-center justify-between p-4 bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
            onClick={() => setLocation('/add-payment-method')}
            data-testid="button-add-payment"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Plus size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Add Payment Method</h3>
                <p className="text-sm text-blue-700">Credit or debit card</p>
              </div>
            </div>
          </div>

          {/* Existing Payment Methods */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Cards</h2>
            
            {paymentMethods.map((method) => (
              <div key={method.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center">
                      <CreditCard size={16} className="text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{method.type} •••• {method.last4}</span>
                        {method.isDefault && (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">Expires {method.expiry}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-gray-100"
                    onClick={() => console.log('Card options', method.id)}
                    data-testid={`button-card-options-${method.id}`}
                  >
                    <MoreVertical size={16} className="text-gray-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Security Notice */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-gray-600 text-sm font-medium">🔒</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Secure Payments</h3>
                <p className="text-sm text-gray-600">
                  Your payment information is encrypted and secure. We never store your full card details.
                </p>
              </div>
            </div>
          </div>

          {/* Payment History Link */}
          <div 
            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setLocation('/payment-history')}
            data-testid="button-payment-history"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm">📊</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Payment History</h3>
                <p className="text-sm text-gray-600">View all transactions</p>
              </div>
            </div>
            <ArrowLeft size={16} className="text-gray-400 rotate-180" />
          </div>
        </div>
      </div>
    </div>
  );
}