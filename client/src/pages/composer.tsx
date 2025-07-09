import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { CloudUpload, Sparkles, Save, Send } from "lucide-react";

export default function Composer() {
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  const { data: platforms } = useQuery({
    queryKey: ["/api/platforms"],
  });

  const { data: connections } = useQuery({
    queryKey: ["/api/connections"],
  });

  const publishMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/publish", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Post Published",
        description: "Your post has been queued for publishing",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Publish Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const connectedPlatforms = connections?.filter((c: any) => c.isActive) || [];
  const availablePlatforms = platforms?.filter((p: any) => 
    connectedPlatforms.some((c: any) => c.platform.id === p.id)
  ) || [];

  const handlePlatformToggle = (platformName: string, checked: boolean) => {
    setSelectedPlatforms(prev => 
      checked 
        ? [...prev, platformName]
        : prev.filter(p => p !== platformName)
    );
  };

  const handlePublish = () => {
    if (!content.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter some content for your post",
        variant: "destructive",
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: "Platform Required",
        description: "Please select at least one platform",
        variant: "destructive",
      });
      return;
    }

    const scheduledAt = scheduledDate && scheduledTime 
      ? `${scheduledDate}T${scheduledTime}:00`
      : undefined;

    publishMutation.mutate({
      content,
      platforms: selectedPlatforms,
      mediaUrls,
      scheduledAt,
    });
  };

  const resetForm = () => {
    setContent("");
    setSelectedPlatforms([]);
    setScheduledDate("");
    setScheduledTime("");
    setMediaUrls([]);
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

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Compose Post</h1>
          <p className="text-sm text-slate-500">Create and schedule content for multiple platforms</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Content Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="min-h-[150px] mt-2"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-slate-500">
                      Characters: {content.length}
                    </span>
                    <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-800">
                      <Sparkles className="w-4 h-4 mr-1" />
                      AI Assistant
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label>Media</Label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors mt-2">
                    <CloudUpload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">
                      Drag and drop files here or{" "}
                      <Button variant="link" className="p-0 h-auto text-indigo-600 hover:text-indigo-800">
                        browse
                      </Button>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports images, videos up to 100MB
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label>Scheduling</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="date" className="text-xs text-slate-500">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="time" className="text-xs text-slate-500">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Platform Selection */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Target Platforms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availablePlatforms.map((platform: any) => (
                    <div key={platform.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-md">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={platform.name}
                          checked={selectedPlatforms.includes(platform.name)}
                          onCheckedChange={(checked) => handlePlatformToggle(platform.name, checked as boolean)}
                        />
                        <Label htmlFor={platform.name} className="flex items-center cursor-pointer">
                          <span className="text-lg mr-2">{getPlatformIcon(platform.name)}</span>
                          <span className="text-sm font-medium">{platform.displayName}</span>
                        </Label>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
                        ⚙️
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button variant="ghost" className="text-slate-600 hover:text-slate-800">
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={resetForm}>
              Clear
            </Button>
            <Button 
              onClick={handlePublish} 
              disabled={publishMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {publishMutation.isPending ? "Publishing..." : "Publish Now"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
