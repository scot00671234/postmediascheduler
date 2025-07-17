import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Calendar, 
  Settings,
  LogOut
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
    { name: "Scheduled", href: "/scheduled", icon: Calendar },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="w-64 glass flex flex-col transition-all duration-300 animate-slide-in">
      {/* Logo */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center animate-glow">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <h1 className="text-xl font-bold gradient-text">Post Media</h1>
        </div>
        <p className="text-sm text-muted-foreground">Multi-Platform Publisher</p>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item, index) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group glass-hover animate-slide-in",
                isActive
                  ? "gradient-bg text-white shadow-lg"
                  : "text-foreground hover:text-foreground",
                `animation-delay-${index * 100}ms`
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Icon className={cn(
                "w-5 h-5 mr-3 transition-transform duration-300",
                isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground",
                "group-hover:scale-110"
              )} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      {/* User Profile */}
      <div className="p-4 border-t border-white/20">
        <div className="flex items-center mb-3 glass rounded-xl p-3 animate-slide-in">
          <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center mr-3 animate-glow">
            <span className="text-white font-medium text-sm">
              {user?.user?.username?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {user?.user?.username || "User"}
            </p>
            <p className="text-xs gradient-text font-medium">Pro Plan</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start text-muted-foreground hover:text-foreground glass-hover rounded-xl transition-all duration-300"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
