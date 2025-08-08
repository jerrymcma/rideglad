import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Check, Star, CreditCard } from "lucide-react";
import type { Trip } from "@shared/schema";

interface TripCompleteProps {
  trip: Trip;
  onNewRide: () => void;
}

export default function TripComplete({ trip, onNewRide }: TripCompleteProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const { toast } = useToast();

  const submitRatingMutation = useMutation({
    mutationFn: async (ratingData: { rating: number; comment?: string; tripId: string; toUserId: string }) => {
      return await apiRequest('POST', '/api/ratings', ratingData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback!",
      });
    },
  });

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleSubmitRating = () => {
    if (rating > 0 && trip.driverId) {
      submitRatingMutation.mutate({
        rating,
        comment: comment.trim() || undefined,
        tripId: trip.id,
        toUserId: trip.driverId,
      });
    }
  };

  const tripDetails = [
    { label: "Distance", value: `${trip.distance?.toFixed(1) || '3.2'} km` },
    { label: "Duration", value: `${trip.duration || '12'} min` },
    { label: "Base fare", value: "$8.50" },
    { label: "Distance rate", value: "$4.00" },
  ];

  const finalPrice = trip.finalPrice || trip.estimatedPrice || "12.50";

  return (
    <div className="absolute inset-0 bg-white z-50">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-6 text-center border-b border-gray-100">
          <div className="w-16 h-16 bg-brand-green rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-brand-dark mb-2">Trip Completed!</h2>
          <p className="text-gray-medium">Thank you for riding with us</p>
        </div>

        {/* Trip Summary */}
        <div className="px-6 py-6 flex-1">
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-brand-dark">Trip Summary</span>
                <span className="text-lg font-bold text-brand-green" data-testid="text-final-price">
                  ${finalPrice}
                </span>
              </div>
              <div className="space-y-3 text-sm" data-testid="trip-details">
                {tripDetails.map((detail, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-medium">{detail.label}</span>
                    <span className="text-brand-dark">{detail.value}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${finalPrice}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driver Rating */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-brand-dark mb-4">
              How was your ride?
            </h3>
            <div className="flex justify-center space-x-2 mb-4" data-testid="rating-stars">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="w-12 h-12 flex items-center justify-center transition-transform hover:scale-110"
                  data-testid={`star-${star}`}
                >
                  <Star 
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredStar || rating) 
                        ? 'text-status-warning fill-current' 
                        : 'text-gray-300'
                    }`} 
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Add a comment (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none"
              rows={3}
              data-testid="textarea-comment"
            />
          </div>

          {/* Payment Method */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-brand-dark" data-testid="text-payment-method">
                      Visa •••• 1234
                    </p>
                    <p className="text-sm text-gray-medium">Payment completed</p>
                  </div>
                </div>
                <Check className="h-5 w-5 text-brand-green" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 space-y-3">
          <Button 
            onClick={handleSubmitRating}
            className="w-full bg-brand-green text-white py-4 rounded-xl font-semibold text-lg"
            disabled={rating === 0 || submitRatingMutation.isPending}
            data-testid="button-submit-rating"
          >
            {submitRatingMutation.isPending ? 'Submitting...' : 'Submit Rating'}
          </Button>
          <Button 
            onClick={onNewRide}
            variant="outline"
            className="w-full border border-gray-200 text-brand-dark py-4 rounded-xl font-semibold"
            data-testid="button-book-another"
          >
            Book Another Ride
          </Button>
        </div>
      </div>
    </div>
  );
}
