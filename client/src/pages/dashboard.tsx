import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, NotebookPen, Link, Calendar, CheckCircle, ExternalLink, RefreshCw, Bell } from "lucide-react";
import { PlatformCard } from "@/components/ui/platform-card";
import { PostCard } from "@/components/ui/post-card";
import { ComposerModal } from "@/components/ui/composer-modal";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

function NotificationBell() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: "success", message: "Post published successfully to Twitter", time: "2 minutes ago" },
    { id: 2, type: "warning", message: "Post failed to publish to Instagram", time: "5 minutes ago" },
    { id: 3, type: "info", message: "Scheduled post ready for tomorrow", time: "10 minutes ago" }
  ]);

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="relative"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
        <Bell className="w-4 h-4 text-gray-600" />
      </Button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No new notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className="p-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [showComposer, setShowComposer] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/dashboard"],
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["/api/posts"],
  });

  const { data: platforms, isLoading: platformsLoading } = useQuery({
    queryKey: ["/api/platforms"],
  });

  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ["/api/connections"],
  });

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const handleRetryPost = async (postId: number) => {
    try {
      // This would typically call a retry endpoint
      toast({
        title: "Post Retry",
        description: "Retrying failed post...",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to retry post",
        variant: "destructive",
      });
    }
  };

  if (statsLoading || postsLoading || platformsLoading || connectionsLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-slate-200 rounded mb-2"></div>
                <div className="h-8 bg-slate-200 rounded"></div>
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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Manage your social media posts across all platforms</p>
        </div>
        <div className="flex items-center space-x-4">
          <NotificationBell />
          <Button onClick={() => setShowComposer(true)} className="bg-gray-900 hover:bg-gray-800">
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Posts This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.postsThisWeek || 0}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <NotebookPen className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Connected Platforms</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.connectedPlatforms || 0}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <Link className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Scheduled Posts</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.scheduledPosts || 0}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.successRate || "0%"}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <CheckCircle className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Connections */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Platform Connections</CardTitle>
          <p className="text-sm text-slate-500">Connect your social media accounts to start cross-posting</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availablePlatforms.map((platform: any) => (
              <PlatformCard key={platform.id} platform={platform} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Posts</CardTitle>
              <p className="text-sm text-slate-500">Track your latest published content</p>
            </div>
            <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-800">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {posts?.slice(0, 3).map((post: any) => (
              <PostCard key={post.id} post={post} onRetry={() => handleRetryPost(post.id)} />
            ))}
            {(!posts || posts.length === 0) && (
              <div className="text-center py-8">
                <p className="text-slate-500">No posts yet. Create your first post!</p>
                <Button onClick={() => setShowComposer(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Composer Modal */}
      <ComposerModal isOpen={showComposer} onClose={() => setShowComposer(false)} />
    </div>
  );
}
