import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard, Calendar, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Subscription {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  trial_end?: number;
  plan: {
    id: string;
    nickname: string;
    amount: number;
    currency: string;
    interval: string;
  };
  cancel_at_period_end: boolean;
}

export default function Billing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // Get current subscription
  const { data: subscription, isLoading, error } = useQuery<Subscription>({
    queryKey: ["/api/subscription"],
    retry: false,
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/cancel-subscription");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will end at the current period end.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reactivate subscription mutation
  const reactivateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/reactivate-subscription");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      toast({
        title: "Subscription Reactivated",
        description: "Your subscription will continue at the end of the current period.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reactivate subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update payment method
  const updatePaymentMethod = async () => {
    setIsProcessing(true);
    try {
      const response = await apiRequest("POST", "/api/update-payment-method");
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment method. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'trialing':
        return 'Free Trial';
      case 'canceled':
        return 'Cancelled';
      case 'past_due':
        return 'Past Due';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error && error.message.includes('Stripe not configured')) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Billing Setup Required</h1>
            <p className="text-gray-600 mb-6">
              Billing features are not yet configured. The Stripe secret key is needed to manage subscriptions and cancellations.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left max-w-md mx-auto">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> You provided the restricted publishable key, but the secret key (starting with "sk_") is required for subscription management.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">No Active Subscription</h1>
            <p className="text-gray-600 mb-6">
              You don't have an active subscription. Start your free trial to access all features.
            </p>
            <Button 
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => window.location.href = '/subscription-setup'}
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-sm text-gray-500">Manage your subscription and payment methods</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Plan */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-amber-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Current Plan</CardTitle>
                  <Badge className={getStatusColor(subscription.status)}>
                    {getStatusText(subscription.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {subscription.plan.nickname || 'Post Media Plan'}
                    </h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(subscription.plan.amount, subscription.plan.currency)}
                      <span className="text-sm text-gray-500">/{subscription.plan.interval}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Next billing date</p>
                    <p className="font-semibold text-gray-900">
                      {format(new Date(subscription.current_period_end * 1000), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                {subscription.trial_end && subscription.trial_end > Date.now() / 1000 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">Free Trial Active</p>
                        <p className="text-sm text-blue-700">
                          Your trial ends on {format(new Date(subscription.trial_end * 1000), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {subscription.cancel_at_period_end && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-900">Subscription Ending</p>
                        <p className="text-sm text-yellow-700">
                          Your subscription will end on {format(new Date(subscription.current_period_end * 1000), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={updatePaymentMethod}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Update Payment Method
                  </Button>
                  
                  {subscription.cancel_at_period_end ? (
                    <Button
                      onClick={() => reactivateMutation.mutate()}
                      disabled={reactivateMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Reactivate Subscription
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={() => cancelMutation.mutate()}
                      disabled={cancelMutation.isPending}
                      className="flex-1"
                    >
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Billing History */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Billing History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(subscription.plan.amount, subscription.plan.currency)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(subscription.current_period_start * 1000), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Paid
                    </Badge>
                  </div>
                  
                  {subscription.status === 'trialing' && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">$0.00</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(subscription.current_period_start * 1000), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        Trial
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}