import { useState, useRef } from "react";
import { Image, Send, X, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CreatePostCardInstagramProps {
  onPostCreated?: () => void;
  groupId?: string;
}

export const CreatePostCardInstagram = ({ onPostCreated, groupId }: CreatePostCardInstagramProps) => {
  const { profile } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 10MB.", variant: "destructive" });
      return;
    }

    setSelectedImage(file);
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

  const handleSubmit = async () => {
    if (!content.trim() || !user || !profile?.university_id) return;

    setIsLoading(true);
    
    let imageUrl: string | null = null;
    
    if (selectedImage) {
      setIsUploadingImage(true);
      imageUrl = await uploadImage(selectedImage);
      setIsUploadingImage(false);
      
      if (!imageUrl) {
        toast({
          title: "Error",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    const { error } = await supabase.from("posts").insert({
      content: content.trim(),
      user_id: user.id,
      university_id: profile.university_id,
      is_anonymous: isAnonymous,
      image_url: imageUrl,
      group_id: groupId || null,
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
      setIsAnonymous(false);
      removeImage();
      toast({
        title: "Posted!",
        description: "Your post has been shared with the community.",
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
            <AvatarImage src={isAnonymous ? "" : profile?.avatar_url || ""} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white">
              {isAnonymous ? "?" : getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <p className="text-sm font-semibold mb-2">
              {isAnonymous ? "Anonymous" : displayName}
            </p>
            <Textarea
              placeholder="What's happening?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[60px] resize-none bg-muted border-0 focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="mt-3 relative">
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
        )}
      </div>

      <div className="border-t px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => imageInputRef.current?.click()}
            className="text-primary hover:text-primary/80"
          >
            <Camera className="w-6 h-6" />
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          <div className="flex items-center gap-2">
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
            <Label htmlFor="anonymous" className="text-sm text-muted-foreground cursor-pointer">
              Anonymous
            </Label>
          </div>
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || isLoading}
          size="sm"
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
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
