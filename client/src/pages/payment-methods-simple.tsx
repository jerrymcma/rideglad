import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentMethodsSimple() {
  console.log('PaymentMethodsSimple component is rendering');
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  console.log('PaymentMethodsSimple auth state:', { isAuthenticated, authLoading });

  if (authLoading) {
    console.log('PaymentMethodsSimple: Still loading auth');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('PaymentMethodsSimple: Not authenticated, redirecting');
    setLocation('/');
    return null;
  }

  console.log('PaymentMethodsSimple: About to render main component');

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
            className="p-2"
            data-testid="button-back"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">Payment Methods</h1>
        </div>

        {/* Simple content */}
        <div className="bg-white p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">This is the Payment Methods page!</h2>
          <p className="text-gray-600">The page is working correctly. The issue was with the complex component logic.</p>
        </div>
      </div>
    </div>
  );
}