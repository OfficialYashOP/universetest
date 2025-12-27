import { useState, useRef } from "react";
import { Image, Link, Send, X, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateFlexUPostProps {
  onPostCreated?: () => void;
}

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB

// Regex to validate video URLs (YouTube, Vimeo, etc.)
const VIDEO_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/|dailymotion\.com\/video\/|tiktok\.com\/@[\w.-]+\/video\/|instagram\.com\/(p|reel)\/|twitter\.com\/\w+\/status\/|x\.com\/\w+\/status\/)/i;

export const CreateFlexUPost = ({ onPostCreated }: CreateFlexUPostProps) => {
  const { profile } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [mediaTab, setMediaTab] = useState<"image" | "video">("image");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ 
        title: "Error", 
        description: "Please select an image file (JPG, PNG, GIF, WebP).", 
        variant: "destructive" 
      });
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast({ 
        title: "Image too large", 
        description: "Image must be less than 4MB. Please compress or resize your image.", 
        variant: "destructive" 
      });
      return;
    }

    setSelectedImage(file);
    setVideoUrl("");
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const validateVideoUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    return VIDEO_URL_REGEX.test(url.trim());
  };

  const uploadImage = async (file: File): Promise<string | null> => {
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

  const hasMedia = selectedImage || (videoUrl && validateVideoUrl(videoUrl));

  const handleSubmit = async () => {
    if (!hasMedia) {
      toast({
        title: "Media required",
        description: "FlexU requires an image or video link to post.",
        variant: "destructive",
      });
      return;
    }

    if (!user || !profile?.university_id) return;

    setIsLoading(true);
    
    let mediaUrl: string | null = null;

    if (selectedImage) {
      setIsUploadingMedia(true);
      mediaUrl = await uploadImage(selectedImage);
      setIsUploadingMedia(false);
      
      if (!mediaUrl) {
        toast({
          title: "Error",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    } else if (videoUrl && validateVideoUrl(videoUrl)) {
      mediaUrl = videoUrl.trim();
    }

    const { error } = await supabase.from("posts").insert({
      content: content.trim() || "",
      user_id: user.id,
      university_id: profile.university_id,
      is_anonymous: false,
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
      removeImage();
      setVideoUrl("");
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
              📸 Image or video link required • Your identity will be shown
            </p>
            <Textarea
              placeholder="Write a caption... (optional)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[60px] resize-none bg-muted border-0 focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Media Selection Tabs */}
        <Tabs value={mediaTab} onValueChange={(v) => setMediaTab(v as "image" | "video")} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="image" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Upload Image
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Video Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="mt-4">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-96 object-cover rounded-lg"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                <Image className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to upload an image</p>
                <p className="text-xs text-muted-foreground">Max 4MB • JPG, PNG, GIF, WebP</p>
              </button>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageSelect}
              className="hidden"
            />
          </TabsContent>

          <TabsContent value="video" className="mt-4 space-y-3">
            <div className="space-y-2">
              <Input
                placeholder="Paste video link (YouTube, TikTok, Instagram, Vimeo...)"
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  if (e.target.value) {
                    removeImage();
                  }
                }}
                className="bg-muted border-0 focus-visible:ring-1"
              />
              <p className="text-xs text-muted-foreground">
                Supported: YouTube, TikTok, Instagram, Vimeo, Twitter/X
              </p>
            </div>
            {videoUrl && !validateVideoUrl(videoUrl) && (
              <p className="text-xs text-destructive">
                Please enter a valid video URL from YouTube, TikTok, Instagram, Vimeo, or Twitter/X
              </p>
            )}
            {videoUrl && validateVideoUrl(videoUrl) && (
              <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
                <Link className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground truncate flex-1">{videoUrl}</span>
                <button onClick={() => setVideoUrl("")} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div className="border-t px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setMediaTab("image");
              imageInputRef.current?.click();
            }}
            className="text-primary hover:text-primary/80 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm">{selectedImage ? "Change image" : "Add image"}</span>
          </button>
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={!hasMedia || isLoading}
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
