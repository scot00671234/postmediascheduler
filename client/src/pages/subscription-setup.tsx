import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

interface PricingPlan {
  name: string;
  price: number;
  description: string;
  features: string[];
  recommended?: boolean;
}

const pricingPlans: PricingPlan[] = [
  {
    name: "Creator",
    price: 7,
    description: "Perfect for content creators and professionals",
    recommended: true,
    features: [
      "Connect X and LinkedIn accounts",
      "Unlimited posts",
      "Schedule posts",
      "Content templates",
      "Hashtag suggestions",
      "Basic analytics",
      "250MB file uploads"
    ]
  }
];

export default function SubscriptionSetup() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async ({ planName, amount }: { planName: string; amount: number }) => {
      return apiRequest(`/api/create-subscription`, {
        method: "POST",
        body: { planName, amount: amount * 100 }, // Convert to cents
      });
    },
    onSuccess: async (data) => {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe failed to load");
      }

      if (data.clientSecret) {
        // Redirect to Stripe Checkout
        const { error } = await stripe.confirmPayment({
          clientSecret: data.clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/billing?setup=success`,
          },
        });

        if (error) {
          toast({
            title: "Payment Setup Failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        // Trial started successfully without payment method
        toast({
          title: "Trial Started!",
          description: "Your 7-day free trial has begun. Add a payment method to continue after the trial.",
          variant: "default",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
        window.location.href = "/billing";
      }
    },
    onError: (error: any) => {
      console.error("Subscription creation error:", error);
      toast({
        title: "Subscription Failed",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    },
  });

  const handleSelectPlan = async (plan: PricingPlan) => {
    if (isProcessing) return;
    
    setSelectedPlan(plan.name);
    setIsProcessing(true);
    
    createSubscriptionMutation.mutate({
      planName: plan.name,
      amount: plan.price,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Start Your Free Trial
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            Choose your plan and get 7 days free to try all features
          </p>
          <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400">
            <Calendar className="h-5 w-5" />
            <span className="font-semibold">7-day free trial • No credit card required initially</span>
          </div>
        </div>

        <div className="grid grid-cols-1 max-w-md mx-auto">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative transition-all duration-200 hover:shadow-lg ${
                plan.recommended
                  ? "border-amber-500 shadow-amber-100 dark:shadow-amber-900/20"
                  : "border-gray-200 dark:border-gray-700"
              } ${
                selectedPlan === plan.name && isProcessing
                  ? "opacity-75 pointer-events-none"
                  : ""
              }`}
            >
              {plan.recommended && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-500 hover:bg-amber-600">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  {plan.name}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    ${plan.price}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">/month</span>
                </div>
                <CardDescription className="mt-2 text-gray-600 dark:text-gray-300">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isProcessing}
                  className={`w-full ${
                    plan.recommended
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                  }`}
                >
                  {selectedPlan === plan.name && isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Setting up...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Start 7-Day Trial
                    </div>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Free for 7 days, then ${plan.price}/month. Cancel anytime.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Your trial starts immediately. After 7 days, you'll be charged ${pricingPlans.find(p => p.recommended)?.price}/month unless you cancel.
            <br />
            You can upgrade, downgrade, or cancel your subscription at any time.
          </p>
        </div>
      </div>
    </div>
  );
}