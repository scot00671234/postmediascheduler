import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { CloudUpload, X, Save, Send, Image, Video, File } from "lucide-react";
import { SiLinkedin, SiX } from "react-icons/si";

interface ComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ComposerModal({ isOpen, onClose }: ComposerModalProps) {
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: platforms } = useQuery({
    queryKey: ["/api/platforms"],
    enabled: isOpen,
  });

  const { data: connections } = useQuery({
    queryKey: ["/api/connections"],
    enabled: isOpen,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("POST", "/api/upload", formData, {
        isFormData: true,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setUploadedFiles(prev => [...prev, data]);
      setMediaUrls(prev => [...prev, data.id.toString()]);
      toast({
        title: "File Uploaded",
        description: "Your file has been uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
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
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      onClose();
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
    setUploadedFiles([]);
  };

  const handleFileUpload = (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    uploadMutation.mutate(formData);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(handleFileUpload);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== parseInt(fileId)));
    setMediaUrls(prev => prev.filter(id => id !== fileId));
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const getPlatformIcon = (platform: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      twitter: <SiX className="w-4 h-4" />,
      linkedin: <SiLinkedin className="w-4 h-4" />,
    };
    return iconMap[platform] || <span className="w-4 h-4 text-center">🔗</span>;
  };

  const getCharacterLimit = (platform: string) => {
    const limits: Record<string, number> = {
      twitter: 280,
      instagram: 2200,
      linkedin: 3000,
      facebook: 63206,
      tiktok: 2200,
      youtube: 5000,
      bluesky: 300,
      threads: 500,
      pinterest: 500,
    };
    return limits[platform] || 280;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            {/* Content Form - Left Column */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <Label htmlFor="content" className="text-sm font-medium">Post Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="min-h-[120px] mt-1 resize-none"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-500">
                    Characters: {content.length}
                  </span>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Media Files</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach(handleFileUpload);
                  }}
                  className="hidden"
                />
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center hover:border-indigo-400 transition-colors mt-1 ${
                    isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CloudUpload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-sm text-slate-600">
                    Drop files or{" "}
                    <span className="text-indigo-600 hover:text-indigo-800 cursor-pointer">
                      browse
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Images, videos up to 100MB
                  </p>
                </div>
                
                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                        <div className="flex items-center space-x-2">
                          {getFileIcon(file.mimeType)}
                          <span className="text-sm text-slate-700 truncate">{file.originalName}</span>
                          <span className="text-xs text-slate-500">
                            ({(file.size / 1024 / 1024).toFixed(1)}MB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id.toString())}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium">Schedule (Optional)</Label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="text-sm"
                  />
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Platform Selection & Preview - Right Column */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Target Platforms</Label>
                <div className="space-y-2 mt-1">
                  {availablePlatforms.map((platform: any) => (
                    <div key={platform.id} className="flex items-center space-x-2 p-2 border border-slate-200 rounded-md">
                      <Checkbox
                        id={platform.name}
                        checked={selectedPlatforms.includes(platform.name)}
                        onCheckedChange={(checked) => handlePlatformToggle(platform.name, checked as boolean)}
                      />
                      <Label htmlFor={platform.name} className="flex items-center cursor-pointer flex-1">
                        <span className="mr-2">{getPlatformIcon(platform.name)}</span>
                        <span className="text-sm">{platform.displayName}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedPlatforms.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Platform Preview</Label>
                  <div className="space-y-2 mt-1">
                    {selectedPlatforms.map((platformName) => {
                      const platform = platforms?.find((p: any) => p.name === platformName);
                      const charLimit = getCharacterLimit(platformName);
                      const isOverLimit = content.length > charLimit;
                      
                      return (
                        <Card key={platformName} className="bg-white border-slate-200">
                          <CardContent className="p-3">
                            <div className="flex items-center mb-2">
                              <span className="mr-2">{getPlatformIcon(platformName)}</span>
                              <span className="text-sm font-medium">{platform?.displayName}</span>
                            </div>
                            <p className={`text-sm ${isOverLimit ? 'text-red-600' : 'text-slate-700'}`}>
                              {content || "Your content will appear here..."}
                            </p>
                            <div className={`text-xs mt-1 ${isOverLimit ? 'text-red-500' : 'text-slate-500'}`}>
                              {content.length}/{charLimit}
                              {isOverLimit && " (over limit)"}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
          <Button variant="ghost" className="text-slate-600 hover:text-slate-800">
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handlePublish} 
              disabled={publishMutation.isPending || uploadMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {publishMutation.isPending ? "Publishing..." : "Publish Now"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
