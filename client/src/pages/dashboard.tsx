import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, NotebookPen, Link, Calendar, CheckCircle, ExternalLink, RefreshCw } from "lucide-react";
import { PlatformCard } from "@/components/ui/platform-card";
import { PostCard } from "@/components/ui/post-card";
import { ComposerModal } from "@/components/ui/composer-modal";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

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
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Manage your social media posts across all platforms</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Button variant="ghost" size="sm" className="relative">
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
              <span className="text-slate-400">🔔</span>
            </Button>
          </div>
          <Button onClick={() => setShowComposer(true)} className="bg-indigo-600 hover:bg-indigo-700">
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
                <p className="text-sm text-slate-500">Posts This Week</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.postsThisWeek || 0}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full">
                <NotebookPen className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Connected Platforms</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.connectedPlatforms || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Link className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Scheduled Posts</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.scheduledPosts || 0}</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Success Rate</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.successRate || "0%"}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
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
