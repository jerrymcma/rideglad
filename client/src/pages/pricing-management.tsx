import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  Crown, 
  Car, 
  Star, 
  Clock, 
  MapPin, 
  Percent, 
  DollarSign, 
  Tag,
  Zap,
  TrendingUp,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PricingPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  vehicleType: string;
  baseFare: string;
  perKmRate: string;
  perMinuteRate: string;
  minimumFare: string;
  cancellationFee: string;
  bookingFee: string;
  surgeMultiplier: number;
  features: string[];
  icon: string;
  color: string;
  maxPassengers: number;
  isActive: boolean;
}

interface PriceBreakdown {
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  surgeFee?: number;
  bookingFee?: number;
  discount?: number;
}

interface PriceCalculation {
  estimatedPrice: string;
  estimatedDuration: number;
  breakdown: PriceBreakdown;
  adjustments: Array<{
    type: string;
    amount: number;
    description: string;
  }>;
}

export default function PricingManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Pricing calculator states
  const [distance, setDistance] = useState("5");
  const [selectedPlan, setSelectedPlan] = useState("driver-1");
  const [promoCode, setPromoCode] = useState("");
  const [calculation, setCalculation] = useState<PriceCalculation | null>(null);

  // Fetch pricing plans
  const { data: pricingPlans = [], isLoading: plansLoading } = useQuery<PricingPlan[]>({
    queryKey: ['/api/pricing/plans'],
  });

  // Calculate price mutation
  const calculatePriceMutation = useMutation({
    mutationFn: async (params: { distance: number; rideType: string; promoCode?: string }) => {
      const response = await fetch('/api/trips/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Failed to calculate price');
      return response.json();
    },
    onSuccess: (data) => {
      setCalculation(data);
    },
    onError: (error) => {
      toast({
        title: "Calculation Error",
        description: "Failed to calculate trip price",
        variant: "destructive",
      });
    },
  });

  // Validate promo code mutation
  const validatePromoMutation = useMutation({
    mutationFn: async ({ code, tripValue }: { code: string; tripValue: number }) => {
      const response = await fetch('/api/pricing/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, tripValue }),
      });
      if (!response.ok) throw new Error('Failed to validate promo code');
      return response.json();
    },
  });

  const handleCalculatePrice = () => {
    const distanceNum = parseFloat(distance);
    if (isNaN(distanceNum) || distanceNum <= 0) {
      toast({
        title: "Invalid Distance",
        description: "Please enter a valid distance",
        variant: "destructive",
      });
      return;
    }

    calculatePriceMutation.mutate({
      distance: distanceNum,
      rideType: selectedPlan,
      promoCode: promoCode || undefined,
    });
  };

  const handleValidatePromo = () => {
    if (!promoCode.trim()) return;
    
    const tripValue = calculation ? parseFloat(calculation.estimatedPrice) : 20;
    validatePromoMutation.mutate({ code: promoCode, tripValue });
  };

  // Get icon component
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Crown': return Crown;
      case 'Car': return Car;
      default: return Car;
    }
  };

  const formatPrice = (price: string | number) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return `$${num.toFixed(2)}`;
  };

  const getPlanColor = (color: string) => {
    switch (color) {
      case '#3B82F6': return 'bg-blue-50 border-blue-200 text-blue-800';
      case '#10B981': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case '#8B5CF6': return 'bg-purple-50 border-purple-200 text-purple-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (plansLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading pricing plans...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Custom Pricing System
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Advanced dynamic pricing with surge management, promotional codes, and tier-based adjustments
          </p>
        </div>

        {/* Pricing Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingPlans.map((plan: PricingPlan) => {
            const IconComponent = getIconComponent(plan.icon);
            const isSelected = selectedPlan === plan.name;
            
            return (
              <Card 
                key={plan.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-lg",
                  isSelected ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"
                )}
                onClick={() => setSelectedPlan(plan.name)}
                data-testid={`card-pricing-plan-${plan.name}`}
              >
                <CardHeader className="text-center pb-4">
                  <div className={cn(
                    "w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3",
                    getPlanColor(plan.color)
                  )}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-xl">{plan.displayName}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Pricing Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Base Fare:</span>
                      <span className="font-medium">{formatPrice(plan.baseFare)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Per KM:</span>
                      <span className="font-medium">{formatPrice(plan.perKmRate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Per Min:</span>
                      <span className="font-medium">{formatPrice(plan.perMinuteRate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Min Fare:</span>
                      <span className="font-medium">{formatPrice(plan.minimumFare)}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">Features:</h4>
                    <div className="flex flex-wrap gap-1">
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Surge Info */}
                  {plan.surgeMultiplier > 1 && (
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <TrendingUp className="w-4 h-4" />
                      <span>Surge: {plan.surgeMultiplier}x</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pricing Calculator */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Price Calculator
            </CardTitle>
            <CardDescription>
              Calculate trip prices with dynamic pricing, surge rates, and promo codes
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Input Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Distance (km)</label>
                <Input
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="Enter distance"
                  min="0.1"
                  step="0.1"
                  data-testid="input-distance"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Promo Code (Optional)</label>
                <div className="flex gap-2">
                  <Input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    data-testid="input-promo-code"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleValidatePromo}
                    disabled={!promoCode.trim() || validatePromoMutation.isPending}
                    data-testid="button-validate-promo"
                  >
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Calculate</label>
                <Button
                  onClick={handleCalculatePrice}
                  disabled={calculatePriceMutation.isPending}
                  className="w-full"
                  data-testid="button-calculate-price"
                >
                  {calculatePriceMutation.isPending ? (
                    "Calculating..."
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Calculate Price
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Promo Validation Result */}
            {validatePromoMutation.data && (
              <div className={cn(
                "p-3 rounded-lg border",
                validatePromoMutation.data.valid 
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              )}>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  <span className="font-medium">
                    {validatePromoMutation.data.valid ? "Valid Promo Code" : "Invalid Promo Code"}
                  </span>
                </div>
                {validatePromoMutation.data.valid && validatePromoMutation.data.discount && (
                  <p className="text-sm mt-1">
                    Discount: {formatPrice(validatePromoMutation.data.discount)}
                  </p>
                )}
                {!validatePromoMutation.data.valid && (
                  <p className="text-sm mt-1">{validatePromoMutation.data.reason}</p>
                )}
              </div>
            )}

            {/* Price Calculation Result */}
            {calculation && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Price Breakdown
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Price Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Base Fare</span>
                      <span>{formatPrice(calculation.breakdown.baseFare)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Distance Charge</span>
                      <span>{formatPrice(calculation.breakdown.distanceCharge)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Time Charge</span>
                      <span>{formatPrice(calculation.breakdown.timeCharge)}</span>
                    </div>
                    {calculation.breakdown.bookingFee && (
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-600">Booking Fee</span>
                        <span>{formatPrice(calculation.breakdown.bookingFee)}</span>
                      </div>
                    )}
                    {calculation.breakdown.surgeFee && (
                      <div className="flex justify-between items-center py-2 border-b text-orange-600">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          Surge Fee
                        </span>
                        <span>+{formatPrice(calculation.breakdown.surgeFee)}</span>
                      </div>
                    )}
                    {calculation.breakdown.discount && (
                      <div className="flex justify-between items-center py-2 border-b text-green-600">
                        <span className="flex items-center gap-1">
                          <Percent className="w-4 h-4" />
                          Discount
                        </span>
                        <span>-{formatPrice(calculation.breakdown.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-3 border-t-2 font-bold text-lg">
                      <span>Total Price</span>
                      <span className="text-blue-600">{formatPrice(calculation.estimatedPrice)}</span>
                    </div>
                  </div>

                  {/* Adjustments & Trip Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Estimated Duration: {calculation.estimatedDuration} minutes</span>
                    </div>
                    
                    {calculation.adjustments && calculation.adjustments.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Pricing Adjustments:</h4>
                        <div className="space-y-2">
                          {calculation.adjustments.map((adjustment, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-600">{adjustment.description}</span>
                              <span className={cn(
                                adjustment.amount < 0 ? "text-green-600" : "text-orange-600"
                              )}>
                                {adjustment.amount < 0 ? '' : '+'}{formatPrice(adjustment.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Current Time Info */}
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>Current Time: {new Date().toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Peak hours (7-9 AM, 5-7 PM) may include surge pricing
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <TrendingUp className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Dynamic Surge Pricing</h3>
              <p className="text-sm text-gray-600">
                Automatic surge pricing during peak hours and high-demand periods
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Tag className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Promotional Codes</h3>
              <p className="text-sm text-gray-600">
                Advanced promo code system with usage limits and validation
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Star className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Tier-Based Pricing</h3>
              <p className="text-sm text-gray-600">
                Multiple pricing tiers with different features and rates
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}