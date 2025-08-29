import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Receipt, Calendar, CreditCard, DollarSign, MapPin, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";

interface PaymentHistoryItem {
  id: string;
  tripId: string;
  paymentMethodId: string;
  amount: string;
  status: string;
  createdAt: string;
  processedAt?: string;
  trip?: {
    pickupLocation: string;
    destination: string;
    distance: number;
    duration: number;
    requestedAt: string;
  };
  paymentMethod?: {
    brand: string;
    lastFour: string;
    type: string;
  };
}

export default function PaymentHistory() {
  const [, setLocation] = useLocation();

  const { data: payments = [], isLoading } = useQuery<PaymentHistoryItem[]>({
    queryKey: ['/api/payment-history'],
    enabled: true
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-sm mx-auto bg-white min-h-screen">
        <div className="border-b bg-white">
          <div className="text-center py-6">
            <h1 className="text-xl font-semibold">Payment History</h1>
          </div>
        </div>
        <div className="p-6">
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen">
      <div className="border-b bg-white">
        <div className="text-center py-6">
          <div className="flex items-center justify-center gap-2">
            <Receipt size={20} className="text-blue-600" />
            <h1 className="text-xl font-semibold">Payment History</h1>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign size={20} className="mx-auto text-green-600 mb-2" />
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(payments.reduce((sum: number, payment: PaymentHistoryItem) => 
                  payment.status === 'completed' ? sum + parseFloat(payment.amount) : sum, 0).toFixed(2))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Receipt size={20} className="mx-auto text-blue-600 mb-2" />
              <p className="text-sm text-gray-600">Total Rides</p>
              <p className="text-lg font-semibold text-blue-600">
                {payments.filter((p: PaymentHistoryItem) => p.status === 'completed').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payment History List */}
        <div className="space-y-4">
          {payments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Receipt size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Payment History</h3>
                <p className="text-gray-500 mb-6">
                  Your completed rides and payments will appear here
                </p>
                <Button 
                  onClick={() => setLocation('/ride')}
                  data-testid="button-book-ride"
                  className="bg-brand-green hover:bg-green-700"
                >
                  Book Your First Ride
                </Button>
              </CardContent>
            </Card>
          ) : (
            payments.map((payment: PaymentHistoryItem) => (
              <Card key={payment.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-gray-500" />
                      <div>
                        <p className="font-medium text-sm">
                          {payment.trip?.pickupLocation || 'Pickup Location'} → {payment.trip?.destination || 'Destination'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Calendar size={12} />
                          {payment.trip?.requestedAt ? 
                            format(new Date(payment.trip.requestedAt), 'MMM dd, yyyy • h:mm a') :
                            format(new Date(payment.createdAt), 'MMM dd, yyyy • h:mm a')
                          }
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(payment.status)} variant="secondary">
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      {payment.trip && (
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin size={12} />
                            {payment.trip.distance.toFixed(1)} mi
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            {payment.trip.duration} min
                          </div>
                        </div>
                      )}
                      {payment.paymentMethod && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <CreditCard size={12} />
                          {payment.paymentMethod.brand} •••• {payment.paymentMethod.lastFour}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(payment.amount)}
                      </p>
                      {payment.processedAt && (
                        <p className="text-xs text-gray-500">
                          Processed {format(new Date(payment.processedAt), 'MMM dd')}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        {/* Bottom Back Button */}
        <div className="fixed bottom-6 left-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/payment-methods')}
            className="p-3 hover:bg-gray-100 rounded-full shadow-lg bg-white border"
            data-testid="button-back"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Button>
        </div>
      </div>
    </div>
  );
}