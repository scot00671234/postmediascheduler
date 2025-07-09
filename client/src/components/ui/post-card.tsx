import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: {
    id: number;
    content: string;
    status: string;
    createdAt: string;
    scheduledAt?: string;
    publishedAt?: string;
    platforms: Array<{
      id: number;
      status: string;
      platformPostId?: string;
      errorMessage?: string;
      platform: {
        name: string;
        displayName: string;
        color: string;
      };
    }>;
  };
  onRetry: () => void;
}

export function PostCard({ post, onRetry }: PostCardProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      published: { label: "Published", variant: "default" as const, className: "bg-green-100 text-green-700" },
      scheduled: { label: "Scheduled", variant: "secondary" as const, className: "bg-amber-100 text-amber-700" },
      failed: { label: "Failed", variant: "destructive" as const, className: "bg-red-100 text-red-700" },
      publishing: { label: "Publishing", variant: "secondary" as const, className: "bg-blue-100 text-blue-700" },
      draft: { label: "Draft", variant: "outline" as const, className: "bg-slate-100 text-slate-700" },
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
  };

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

  const getTimeDisplay = () => {
    if (post.publishedAt) {
      return `${formatDistanceToNow(new Date(post.publishedAt))} ago`;
    }
    if (post.scheduledAt) {
      return `Scheduled for ${formatDistanceToNow(new Date(post.scheduledAt))}`;
    }
    return formatDistanceToNow(new Date(post.createdAt)) + " ago";
  };

  const statusBadge = getStatusBadge(post.status);
  const hasFailures = post.platforms.some(p => p.status === "failed");

  return (
    <Card className="border border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <span className="font-mono text-sm text-slate-500 mr-3">#{post.id}</span>
              <div className="flex items-center space-x-2">
                <Badge className={statusBadge.className}>
                  {statusBadge.label}
                </Badge>
                <span className="text-sm text-slate-500">{getTimeDisplay()}</span>
              </div>
            </div>
            
            <p className="text-slate-900 mb-3 line-clamp-3">{post.content}</p>
            
            <div className="flex items-center space-x-4 flex-wrap">
              {post.platforms.map((platform) => (
                <div key={platform.id} className="flex items-center space-x-2">
                  <span className="text-lg">{getPlatformIcon(platform.platform.name)}</span>
                  <span className={`text-sm ${
                    platform.status === "published" ? "text-green-600" : 
                    platform.status === "failed" ? "text-red-600" : 
                    "text-slate-500"
                  }`}>
                    {platform.status === "published" && "✓ Success"}
                    {platform.status === "failed" && "✗ Failed"}
                    {platform.status === "pending" && "Pending"}
                    {platform.status === "publishing" && "Publishing..."}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            {hasFailures && (
              <Button 
                variant="ghost" 
                size="sm"
                className="text-amber-600 hover:text-amber-800"
                onClick={onRetry}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              className="text-slate-400 hover:text-slate-600"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
