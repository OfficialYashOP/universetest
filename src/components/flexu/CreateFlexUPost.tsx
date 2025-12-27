import { useState, useRef } from "react";
import { Image, Video, Send, X, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateFlexUPostProps {
  onPostCreated?: () => void;
}

export const CreateFlexUPost = ({ onPostCreated }: CreateFlexUPostProps) => {
  const { profile } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast({ 
        title: "Error", 
        description: "Please select an image or video file.", 
        variant: "destructive" 
      });
      return;
    }

    // 10MB limit for images, 50MB for videos
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ 
        title: "Error", 
        description: `File must be less than ${isVideo ? "50MB" : "10MB"}.`, 
        variant: "destructive" 
      });
      return;
    }

    setSelectedMedia(file);
    setMediaType(isImage ? "image" : "video");
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setSelectedMedia(null);
    setMediaPreview(null);
    setMediaType(null);
    if (mediaInputRef.current) {
      mediaInputRef.current.value = "";
    }
  };

  const uploadMedia = async (file: File): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    // FlexU REQUIRES media - no text-only posts allowed
    if (!selectedMedia) {
      toast({
        title: "Media required",
        description: "FlexU requires at least one image or video to post.",
        variant: "destructive",
      });
      return;
    }

    if (!user || !profile?.university_id) return;

    setIsLoading(true);
    setIsUploadingMedia(true);
    
    const mediaUrl = await uploadMedia(selectedMedia);
    setIsUploadingMedia(false);
    
    if (!mediaUrl) {
      toast({
        title: "Error",
        description: "Failed to upload media. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // FlexU posts are NEVER anonymous
    const { error } = await supabase.from("posts").insert({
      content: content.trim() || "", // Caption is optional
      user_id: user.id,
      university_id: profile.university_id,
      is_anonymous: false, // Never anonymous for FlexU
      image_url: mediaUrl,
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } else {
      setContent("");
      removeMedia();
      toast({
        title: "Posted!",
        description: "Your post is now live on FlexU.",
      });
      onPostCreated?.();
    }
  };

  const displayName = profile?.username ? `@${profile.username}` : profile?.full_name;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <p className="text-sm font-semibold mb-2">{displayName}</p>
            <p className="text-xs text-muted-foreground mb-2">
              📸 Media required • Your identity will be shown
            </p>
            <Textarea
              placeholder="Write a caption... (optional)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[60px] resize-none bg-muted border-0 focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Media Preview */}
        {mediaPreview && (
          <div className="mt-3 relative">
            {mediaType === "image" ? (
              <img
                src={mediaPreview}
                alt="Preview"
                className="w-full max-h-96 object-cover rounded-lg"
              />
            ) : (
              <video
                src={mediaPreview}
                controls
                className="w-full max-h-96 rounded-lg"
              />
            )}
            <button
              onClick={removeMedia}
              className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Media Upload Prompt */}
        {!mediaPreview && (
          <button
            onClick={() => mediaInputRef.current?.click()}
            className="mt-4 w-full border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Image className="w-6 h-6 text-muted-foreground" />
              <Video className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Click to upload an image or video</p>
            <p className="text-xs text-muted-foreground">Required to post on FlexU</p>
          </button>
        )}
      </div>

      <div className="border-t px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => mediaInputRef.current?.click()}
            className="text-primary hover:text-primary/80 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm">{selectedMedia ? "Change media" : "Add media"}</span>
          </button>
          <input
            ref={mediaInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaSelect}
            className="hidden"
          />
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={!selectedMedia || isLoading}
          size="sm"
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isUploadingMedia ? "Uploading..." : "Posting..."}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Post
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
