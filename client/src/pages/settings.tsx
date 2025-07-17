import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, User, Mail, CreditCard, AlertTriangle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Settings() {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const { data: subscription } = useQuery({
    queryKey: ["/api/billing/subscription"],
    retry: false,
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/auth/delete-account");
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account and subscription have been cancelled successfully.",
      });
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This will cancel your subscription and delete all your data. This action cannot be undone."
    );
    
    if (confirmed) {
      setIsDeleting(true);
      try {
        await deleteAccountMutation.mutateAsync();
      } finally {
        setIsDeleting(false);
      }
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

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 glass p-6 rounded-2xl animate-slide-in">
          <h1 className="text-2xl font-bold gradient-text">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account and subscription settings
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    defaultValue={user?.user?.username}
                    placeholder="Enter your username"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user?.user?.email}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <Button className="animate-glow">
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </Button>
            </CardContent>
          </Card>

          {/* Billing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Billing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Subscription Status</p>
                      <p className="text-sm text-muted-foreground">Current plan status</p>
                    </div>
                    <Badge className={getStatusColor(subscription.status)}>
                      {getStatusText(subscription.status)}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">Current Plan</p>
                      <p className="text-sm text-muted-foreground">
                        {subscription.plan.nickname || 'Creator Plan'}
                      </p>
                      <p className="text-lg font-semibold mt-1">
                        {formatCurrency(subscription.plan.amount, subscription.plan.currency)}
                        <span className="text-sm text-muted-foreground">/{subscription.plan.interval}</span>
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Billing Period</p>
                      <p className="text-sm text-muted-foreground">
                        {subscription.status === 'canceled' ? 'Ends on' : 'Next billing date'}
                      </p>
                      <p className="font-semibold mt-1">
                        {format(new Date(subscription.current_period_end * 1000), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  {subscription.trial_end && subscription.trial_end > Date.now() / 1000 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="font-medium text-blue-900">Free Trial Active</p>
                      <p className="text-sm text-blue-700">
                        Your trial ends on {format(new Date(subscription.trial_end * 1000), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No active subscription</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Service */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Customer Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Need help?</p>
                  <p className="text-sm text-muted-foreground">
                    Contact our customer service team for support
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = 'mailto:clientservicesdigital@gmail.com'}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  clientservicesdigital@gmail.com
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Delete Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-slate-900">Permanently delete your account</p>
                  <p className="text-sm text-slate-500">
                    This will cancel your subscription and delete all your data. Your subscription will end at the end of the current billing period. This action cannot be undone.
                  </p>
                </div>
                <Button 
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    "Deleting..."
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
