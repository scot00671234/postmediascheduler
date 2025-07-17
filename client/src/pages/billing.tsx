import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Billing() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const { data: subscription, error } = useQuery({
    queryKey: ["/api/billing/subscription"],
    retry: false,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/billing/cancel");
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing/subscription"] });
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  const handleCancelSubscription = async () => {
    if (window.confirm("Are you sure you want to cancel your subscription?")) {
      setIsLoading(true);
      try {
        await cancelMutation.mutateAsync();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleChangePaymentMethod = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/billing/customer-portal");
      window.location.href = response.url;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open customer portal",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

  if (error && error.message.includes('Stripe not configured')) {
    return (
      <div className="text-center py-12 glass p-8 rounded-2xl animate-slide-in">
        <h1 className="text-2xl font-bold gradient-text mb-4">Billing Setup Required</h1>
        <p className="text-muted-foreground mb-6">
          Billing features are not yet configured. Please contact support for assistance with payment setup.
        </p>
      </div>
    );
  }

  if (!subscription) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
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

              <div className="flex gap-4">
                <Button 
                  onClick={handleChangePaymentMethod}
                  disabled={isLoading}
                  variant="outline"
                >
                  Change Payment Method
                </Button>
                <Button 
                  onClick={handleCancelSubscription}
                  disabled={isLoading}
                  variant="destructive"
                >
                  Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Method */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <CreditCard className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    •••• •••• •••• {subscription.default_payment_method?.card?.last4 || '****'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {subscription.default_payment_method?.card?.brand?.toUpperCase() || 'CARD'} • 
                    Expires {subscription.default_payment_method?.card?.exp_month || 'XX'}/{subscription.default_payment_method?.card?.exp_year || 'XX'}
                  </p>
                </div>
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
  );
}