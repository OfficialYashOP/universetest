import { useState } from "react";
import { Send, Loader2, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateOffRecordPostProps {
  onPostCreated?: () => void;
}

export const CreateOffRecordPost = ({ onPostCreated }: CreateOffRecordPostProps) => {
  const { profile } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || !user || !profile?.university_id) return;

    setIsLoading(true);
    
    // OffRecord posts are ALWAYS anonymous and NEVER have media
    const { error } = await supabase.from("posts").insert({
      content: content.trim(),
      user_id: user.id,
      university_id: profile.university_id,
      is_anonymous: true, // Always anonymous for OffRecord
      image_url: null, // Never allow media
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
      toast({
        title: "Posted anonymously!",
        description: "Your anonymous post is now live on OffRecord.",
      });
      onPostCreated?.();
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex gap-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-muted-foreground text-white">
            <EyeOff className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <EyeOff className="w-4 h-4" />
            <span>Posting anonymously • Text only</span>
          </div>
          
          <Textarea
            placeholder="Share your thoughts anonymously..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] resize-none bg-muted border-0 focus-visible:ring-1"
            maxLength={500}
          />
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {content.length}/500 characters
            </span>
            
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
                  Post Anonymously
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
