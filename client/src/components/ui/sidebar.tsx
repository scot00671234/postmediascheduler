import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Edit, 
  Calendar, 
  Link as LinkIcon, 
  Settings,
  LogOut,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

export function Sidebar() {
  const [location] = useLocation();
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Compose", href: "/compose", icon: Edit },
    { name: "Scheduled", href: "/scheduled", icon: Calendar },
    { name: "Connections", href: "/connections", icon: LinkIcon },
    { name: "Billing", href: "/billing", icon: CreditCard },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="w-64 bg-white/90 backdrop-blur-sm border-r border-amber-200 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b border-amber-200">
        <h1 className="text-xl font-bold text-amber-900">Post Media</h1>
        <p className="text-sm text-amber-700">Multi-Platform Publisher</p>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "text-amber-900 bg-amber-100"
                  : "text-amber-700 hover:text-amber-900 hover:bg-amber-50"
              )}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      {/* User Profile */}
      <div className="p-4 border-t border-amber-200">
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
            <span className="text-amber-700 font-medium text-sm">
              {user?.user?.username?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-amber-900">
              {user?.user?.username || "User"}
            </p>
            <p className="text-xs text-amber-700">Pro Plan</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start text-amber-700 hover:text-amber-900"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
