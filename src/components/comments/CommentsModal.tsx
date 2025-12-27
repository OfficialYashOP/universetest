import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { X, Send, Loader2, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  is_anonymous: boolean;
  user_id: string;
  author?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

interface CommentsModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  isAnonymousMode?: boolean; // For OffRecord comments
  onCommentAdded?: () => void;
}

export const CommentsModal = ({ 
  postId, 
  isOpen, 
  onClose, 
  isAnonymousMode = false,
  onCommentAdded 
}: CommentsModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    
    const { data: commentsData, error } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      setLoading(false);
      return;
    }

    // Fetch profiles for non-anonymous comments
    const nonAnonymous = commentsData?.filter(c => !c.is_anonymous) || [];
    const userIds = [...new Set(nonAnonymous.map(c => c.user_id))];

    let profilesMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", userIds);

      profiles?.forEach(p => {
        profilesMap[p.id] = p;
      });
    }

    const commentsWithAuthors = commentsData?.map(comment => ({
      ...comment,
      author: comment.is_anonymous ? undefined : profilesMap[comment.user_id],
    })) || [];

    setComments(commentsWithAuthors);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
    }
  }, [isOpen, postId]);

  const handleSubmit = async () => {
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from("post_comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
        is_anonymous: isAnonymousMode,
      });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to post comment.",
        variant: "destructive",
      });
    } else {
      setNewComment("");
      fetchComments();
      onCommentAdded?.();
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No comments yet</p>
              <p className="text-sm mt-1">Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {comment.is_anonymous ? (
                      <AvatarFallback className="bg-muted-foreground text-white">
                        <EyeOff className="w-4 h-4" />
                      </AvatarFallback>
                    ) : (
                      <>
                        <AvatarImage src={comment.author?.avatar_url || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-xs">
                          {getInitials(comment.author?.full_name)}
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {comment.is_anonymous 
                          ? "Anonymous" 
                          : (comment.author?.username 
                              ? `@${comment.author.username}` 
                              : comment.author?.full_name || "Unknown"
                            )
                        }
                      </span>
                      {comment.user_id === user?.id && (
                        <span className="text-xs text-primary">(You)</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t flex items-center gap-2">
          {isAnonymousMode && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
              <EyeOff className="w-3 h-3" />
              Anonymous
            </div>
          )}
          <Input
            placeholder={isAnonymousMode ? "Comment anonymously..." : "Add a comment..."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
