import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Users, Clock, Shield, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export default function Landing() {
  const [, setLocation] = useLocation();
  
  // Check if user is authenticated and redirect to dashboard
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "X & LinkedIn Publishing",
      description: "Post to X and LinkedIn simultaneously from one place"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Smart Scheduling",
      description: "Schedule posts for optimal engagement times"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Creator Tools",
      description: "Content templates, hashtag suggestions, and analytics"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Fast & Reliable",
      description: "Lightning-fast publishing with 99.9% uptime"
    }
  ];

  const platforms = [
    { name: "X", icon: "🐦", color: "bg-blue-500" },
    { name: "LinkedIn", icon: "💼", color: "bg-blue-700" }
  ];

  const pricingPlans = [
    {
      name: "Creator",
      subtitle: "Perfect for content creators",
      price: "$7",
      period: "month",
      features: [
        "Connect X and LinkedIn accounts",
        "Unlimited posts",
        "Schedule posts",
        "Content templates",
        "Hashtag suggestions",
        "Basic analytics",
        "250MB file uploads"
      ],
      cta: "Start Free 7-Day Trial",
      popular: true,
      badge: "Most popular"
    }
  ];

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Navigation */}
        <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto glass mx-4 my-4 rounded-2xl animate-slide-in">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center animate-glow">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <h1 className="text-2xl font-bold gradient-text">Post Media</h1>
            <Badge variant="secondary" className="text-xs gradient-bg text-white">Pro</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="text-foreground hover:text-foreground glass-hover">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="gradient-bg text-white hover:shadow-lg transition-all duration-300">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <div className="glass mx-4 p-12 rounded-3xl animate-slide-in">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Publish to All Your
              <span className="gradient-text"> Social Media</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Create once, publish everywhere. The most efficient way to manage your social media presence across all platforms.
            </p>
            <div className="flex justify-center">
              <Link href="/register">
                <Button size="lg" className="gradient-bg text-white px-8 py-3 text-lg rounded-xl hover:shadow-lg transition-all duration-300 animate-glow">
                  Start Free 7-Day Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="glass mx-4 p-12 rounded-3xl animate-slide-in">
            <h2 className="text-3xl font-bold gradient-text mb-4">
              Connect X & LinkedIn
            </h2>
            <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
              The two most important platforms for creators and professionals. Post once, reach everywhere.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-12 max-w-md mx-auto">
              {platforms.map((platform) => (
                <div key={platform.name} className="flex flex-col items-center space-y-3">
                  <div className={`w-16 h-16 rounded-2xl ${platform.color} flex items-center justify-center text-white text-2xl shadow-lg`}>
                    {platform.icon}
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{platform.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-amber-25"  style={{ backgroundColor: 'rgb(255, 251, 235)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to simplify your social media workflow and maximize your reach.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your needs. No hidden fees, cancel anytime.
            </p>
          </div>
          <div className="grid grid-cols-1 max-w-md mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative bg-white border-2 ${plan.popular ? 'border-amber-400 shadow-xl' : 'border-amber-200'} rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className={`${plan.popular ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-800'} px-4 py-1`}>
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4 pt-8">
                  <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-2">{plan.subtitle}</p>
                  <div className="mt-6">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500 text-lg">/{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 px-6 pb-8">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4">
                    <Link href="/register">
                      <Button 
                        className={`w-full ${plan.popular ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-amber-100 hover:bg-amber-200 text-amber-800'} rounded-xl py-3 text-base font-semibold`}
                        size="lg"
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                    <p className="text-xs text-gray-500 text-center mt-3">
                      $0.00 due today, cancel anytime
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-amber-600 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Social Media?
          </h2>
          <p className="text-amber-100 mb-8 max-w-2xl mx-auto">
            Join thousands of creators, businesses, and agencies who trust Post Media to manage their social presence.
          </p>
          <div className="flex justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-amber-600 hover:bg-amber-50 px-8 py-3 text-lg rounded-xl">
                Start Free 7-Day Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-amber-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Post Media</h3>
              <p className="text-gray-600">
                The most efficient way to manage your social media presence across all platforms.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Features</a></li>
                <li><a href="#" className="hover:text-gray-900">Pricing</a></li>
                <li><a href="#" className="hover:text-gray-900">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Help Center</a></li>
                <li><a href="#" className="hover:text-gray-900">Contact Us</a></li>
                <li><a href="#" className="hover:text-gray-900">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-gray-900">About</a></li>
                <li><a href="#" className="hover:text-gray-900">Blog</a></li>
                <li><a href="#" className="hover:text-gray-900">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-amber-200 mt-8 pt-8 text-center text-gray-600">
            <p>&copy; 2025 Post Media. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}