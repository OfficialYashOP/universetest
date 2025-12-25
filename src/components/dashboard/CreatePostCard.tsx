import { useState } from "react";
import { Image, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreatePostCardProps {
  onPostCreated?: () => void;
}

export const CreatePostCard = ({ onPostCreated }: CreatePostCardProps) => {
  const { profile } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleSubmit = async () => {
    if (!content.trim() || !user || !profile?.university_id) return;

    setIsLoading(true);
    
    const { error } = await supabase.from("posts").insert({
      content: content.trim(),
      user_id: user.id,
      university_id: profile.university_id,
      is_anonymous: isAnonymous,
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
      toast({
        title: "Posted!",
        description: "Your post has been shared with the community.",
      });
      onPostCreated?.();
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={isAnonymous ? "" : profile?.avatar_url || ""} />
          <AvatarFallback className="bg-gradient-to-br from-universe-blue to-universe-purple text-white">
            {isAnonymous ? "?" : getInitials(profile?.full_name)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-3">
          <Textarea
            placeholder="Share something with your campus..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] resize-none bg-muted border-0 focus-visible:ring-1"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
                <Label htmlFor="anonymous" className="text-sm text-muted-foreground cursor-pointer">
                  Post anonymously
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
      </div>
    </div>
  );
};
