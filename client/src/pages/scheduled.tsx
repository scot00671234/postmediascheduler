import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Edit, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Scheduled() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["/api/posts"],
  });

  const scheduledPosts = posts?.filter((post: any) => post.status === "scheduled") || [];

  const getPlatformIcon = (platform: string) => {
    const iconMap: Record<string, string> = {
      twitter: "🐦",
      instagram: "📷",
      linkedin: "💼",
      facebook: "📘",
      tiktok: "🎵",
      youtube: "📺",
      bluesky: "☁️",
      threads: "🧵",
      pinterest: "📌",
    };
    return iconMap[platform] || "🔗";
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
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

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 glass p-6 rounded-2xl animate-slide-in">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Scheduled Posts</h1>
            <p className="text-sm text-muted-foreground">
              Manage your scheduled content across all platforms
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="gradient-bg text-white border-white/30">
              <Calendar className="w-4 h-4 mr-1" />
              {scheduledPosts.length} Scheduled
            </Badge>
          </div>
        </div>

        {scheduledPosts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No Scheduled Posts
              </h3>
              <p className="text-slate-500 mb-4">
                You don't have any posts scheduled yet. Create a post and schedule it for later.
              </p>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Schedule a Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {scheduledPosts.map((post: any) => (
              <Card key={post.id} className="border border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <span className="font-mono text-sm text-slate-500 mr-3">
                          #{post.id}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-amber-100 text-amber-700">
                            Scheduled
                          </Badge>
                          <div className="flex items-center text-sm text-slate-500">
                            <Clock className="w-4 h-4 mr-1" />
                            {post.scheduledAt ? 
                              `${formatDistanceToNow(new Date(post.scheduledAt))} from now` :
                              "No schedule set"
                            }
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-slate-900 mb-4 line-clamp-3">
                        {post.content}
                      </p>
                      
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-slate-500">Platforms:</span>
                        {post.platforms.map((platform: any) => (
                          <div key={platform.id} className="flex items-center space-x-1">
                            <span className="text-lg">
                              {getPlatformIcon(platform.platform.name)}
                            </span>
                            <span className="text-sm text-slate-600">
                              {platform.platform.displayName}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
