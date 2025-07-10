import { useState, useEffect } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface SubscriptionFormProps {
  plan: string;
  price: string;
}

function SubscriptionForm({ plan, price }: SubscriptionFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?subscribed=true`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl"
        size="lg"
      >
        {isProcessing ? "Processing..." : `Start 7-Day Free Trial - ${price}/month after trial`}
      </Button>
      <p className="text-xs text-gray-500 text-center">
        You won't be charged until your 7-day free trial ends. Cancel anytime.
      </p>
    </form>
  );
}

export default function Subscribe() {
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("creator");
  const { toast } = useToast();

  // Check if user is authenticated
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const plans = {
    starter: {
      name: "Starter",
      price: "$7",
      priceId: "price_starter_7day_trial",
      features: [
        "5 connected social accounts",
        "Multiple accounts per platform",
        "Unlimited posts",
        "Schedule posts",
        "Carousel posts",
        "250MB file uploads"
      ]
    },
    creator: {
      name: "Creator",
      price: "$16",
      priceId: "price_creator_7day_trial",
      features: [
        "15 connected social accounts",
        "Multiple accounts per platform",
        "Unlimited posts",
        "Schedule posts",
        "Carousel posts",
        "500MB file uploads",
        "Bulk video scheduling",
        "Content studio access"
      ],
      popular: true
    },
    pro: {
      name: "Pro",
      price: "$25",
      priceId: "price_pro_7day_trial",
      features: [
        "Unlimited connected accounts",
        "Multiple accounts per platform",
        "Unlimited posts",
        "Schedule posts",
        "Carousel posts",
        "500MB file uploads",
        "Bulk video scheduling",
        "Content studio access",
        "Viral growth consulting"
      ]
    }
  };

  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      setLocation("/login");
      return;
    }

    // Create subscription setup intent
    const createSubscription = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-subscription", {
          priceId: plans[selectedPlan as keyof typeof plans].priceId,
        });
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to initialize subscription. Please try again.",
          variant: "destructive",
        });
      }
    };

    createSubscription();
  }, [user, isLoading, selectedPlan, setLocation, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Start Your Free Trial
          </h1>
          <p className="text-gray-600">
            Choose your plan and start your 7-day free trial. No charges until trial ends.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Selection */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Your Plan</h2>
            <div className="space-y-4">
              {Object.entries(plans).map(([key, plan]) => (
                <Card
                  key={key}
                  className={`cursor-pointer border-2 transition-all ${
                    selectedPlan === key
                      ? "border-amber-500 bg-amber-50"
                      : "border-gray-200 hover:border-amber-300"
                  }`}
                  onClick={() => setSelectedPlan(key)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedPlan === key
                            ? "bg-amber-500 border-amber-500"
                            : "border-gray-300"
                        }`} />
                        <div>
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          <p className="text-2xl font-bold text-gray-900">{plan.price}<span className="text-sm text-gray-500">/month</span></p>
                        </div>
                      </div>
                      {plan.popular && (
                        <Badge className="bg-amber-500 text-white">Most Popular</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="text-sm text-gray-500">
                          +{plan.features.length - 3} more features
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Information</h2>
            <Card className="border-2 border-amber-200">
              <CardHeader>
                <CardTitle className="text-lg">
                  {plans[selectedPlan as keyof typeof plans].name} Plan
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {plans[selectedPlan as keyof typeof plans].price}
                  </span>
                  <span className="text-gray-500">/month after trial</span>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>7-day free trial</strong> - You won't be charged until your trial ends
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                {clientSecret ? (
                  <Elements 
                    stripe={stripePromise} 
                    options={{ 
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#f59e0b',
                        },
                      },
                    }}
                  >
                    <SubscriptionForm 
                      plan={selectedPlan}
                      price={plans[selectedPlan as keyof typeof plans].price}
                    />
                  </Elements>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-4 border-amber-500 border-t-transparent rounded-full" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}