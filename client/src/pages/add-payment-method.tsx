import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AddPaymentMethod() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiry: '',
    cvc: '',
    name: '',
    zipCode: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const [expMonth, expYear] = formData.expiry.split('/');
      
      await apiRequest('POST', '/api/wallet/add-card', {
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
        expiryMonth: expMonth,
        expiryYear: `20${expYear}`,
        cvc: formData.cvc,
        name: formData.name,
        zipCode: formData.zipCode
      });
      
      toast({
        title: "Card Added Successfully",
        description: "Your payment method has been added to your wallet.",
      });
      
      setLocation('/payment-methods');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add payment method. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setLocation('/payment-methods')}
              className="p-3 hover:bg-gray-100 rounded-full"
              data-testid="button-back"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Add Card</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Card Preview */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white mb-6">
            <div className="flex justify-between items-start mb-8">
              <CreditCard size={32} />
              <span className="text-sm opacity-80">VISA</span>
            </div>
            <div className="space-y-4">
              <div className="text-lg font-mono tracking-wider">
                {formData.cardNumber || '•••• •••• •••• ••••'}
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs opacity-70 uppercase">Card Holder</div>
                  <div className="font-medium">{formData.name || 'Your Name'}</div>
                </div>
                <div>
                  <div className="text-xs opacity-70 uppercase">Expires</div>
                  <div className="font-medium">{formData.expiry || 'MM/YY'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Number */}
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={formData.cardNumber}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                cardNumber: formatCardNumber(e.target.value)
              }))}
              maxLength={19}
              className="text-lg"
              data-testid="input-card-number"
            />
          </div>

          {/* Expiry and CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input
                id="expiry"
                type="text"
                placeholder="MM/YY"
                value={formData.expiry}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  expiry: formatExpiry(e.target.value)
                }))}
                maxLength={5}
                data-testid="input-expiry"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                type="text"
                placeholder="123"
                value={formData.cvc}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  cvc: e.target.value.replace(/[^0-9]/g, '')
                }))}
                maxLength={4}
                data-testid="input-cvc"
              />
            </div>
          </div>

          {/* Cardholder Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Cardholder Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                name: e.target.value.toUpperCase()
              }))}
              data-testid="input-name"
            />
          </div>

          {/* ZIP Code */}
          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              type="text"
              placeholder="12345"
              value={formData.zipCode}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                zipCode: e.target.value.replace(/[^0-9]/g, '')
              }))}
              maxLength={5}
              data-testid="input-zip"
            />
          </div>

          {/* Security Notice */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-gray-600 text-sm font-medium">🔒</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Secure Processing</h3>
                <p className="text-sm text-gray-600">
                  Your card information is processed securely through Stripe and never stored on our servers.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
            disabled={loading || !formData.cardNumber || !formData.expiry || !formData.cvc || !formData.name}
            data-testid="button-add-card"
          >
            {loading ? "Adding Card..." : "Add Card"}
          </Button>
        </form>
      </div>
    </div>
  );
}