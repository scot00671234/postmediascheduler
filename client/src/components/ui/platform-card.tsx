import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface PlatformCardProps {
  platform: {
    id: number;
    name: string;
    displayName: string;
    icon: string;
    color: string;
    isConnected: boolean;
    connection?: {
      id: number;
      platformUsername: string;
      isActive: boolean;
    };
  };
}

export function PlatformCard({ platform }: PlatformCardProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const response = await apiRequest("GET", `/api/oauth/connect/${platform.name}`);
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to platform",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!platform.connection) return;
    
    setIsDisconnecting(true);
    try {
      await apiRequest("DELETE", `/api/connections/${platform.connection.id}`);
      toast({
        title: "Disconnected",
        description: `Successfully disconnected from ${platform.displayName}`,
      });
      // Refresh the page or update the query cache
      window.location.reload();
    } catch (error) {
      toast({
        title: "Disconnection Error",
        description: "Failed to disconnect from platform",
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getIconComponent = () => {
    const iconMap: Record<string, string> = {
      twitter: "🐦",
      linkedin: "💼",
    };
    return iconMap[platform.name] || "🔗";
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white text-lg"
              style={{ backgroundColor: platform.color }}
            >
              {getIconComponent()}
            </div>
            <div>
              <h4 className="font-medium text-slate-900">{platform.displayName}</h4>
              <p className="text-sm text-slate-500">
                {platform.isConnected ? `@${platform.connection?.platformUsername}` : "Not connected"}
              </p>
            </div>
          </div>
          <Badge variant={platform.isConnected ? "default" : "secondary"} className={
            platform.isConnected 
              ? "bg-green-100 text-green-700 hover:bg-green-200" 
              : "bg-slate-100 text-slate-600"
          }>
            {platform.isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
        
        {platform.isConnected ? (
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? "Disconnecting..." : "Disconnect"}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-slate-700 hover:bg-slate-100"
            >
              Settings
            </Button>
          </div>
        ) : (
          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting..." : "Connect Account"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
