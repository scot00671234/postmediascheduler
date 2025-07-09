import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { PlatformCard } from "@/components/ui/platform-card";

export default function Connections() {
  const { data: platforms, isLoading: platformsLoading } = useQuery({
    queryKey: ["/api/platforms"],
  });

  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ["/api/connections"],
  });

  if (platformsLoading || connectionsLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-20 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const connectedPlatforms = connections?.filter((c: any) => c.isActive) || [];
  const availablePlatforms = platforms?.map((p: any) => ({
    ...p,
    isConnected: connectedPlatforms.some((c: any) => c.platform.id === p.id),
    connection: connectedPlatforms.find((c: any) => c.platform.id === p.id),
  })) || [];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Platform Connections</h1>
          <p className="text-sm text-slate-500">Connect your social media accounts to start cross-posting</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availablePlatforms.map((platform: any) => (
            <PlatformCard key={platform.id} platform={platform} />
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Connected Platforms:</span>
                <span className="text-sm font-medium">{connectedPlatforms.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Available Platforms:</span>
                <span className="text-sm font-medium">{platforms?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
