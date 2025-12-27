import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, BadgeCheck, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface FlexUPostCardProps {
  post: {
    id: string;
    content: string;
    created_at: string;
    likes_count: number;
    comments_count: number;
    user_id: string;
    image_url: string;
    author?: {
      full_name: string | null;
      username: string | null;
      avatar_url: string | null;
      is_verified: boolean;
      role?: string;
    };
  };
  onLikeToggle?: () => void;
  onPostUpdated?: () => void;
  isLiked?: boolean;
}

export const FlexUPostCard = ({ post, onLikeToggle, onPostUpdated, isLiked = false }: FlexUPostCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleLike = async () => {
    if (!user || isLiking) return;
    
    setIsLiking(true);
    
    if (liked) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", user.id);
      
      setLikesCount(prev => Math.max(0, prev - 1));
    } else {
      await supabase
        .from("post_likes")
        .insert({ post_id: post.id, user_id: user.id });
      
      setLikesCount(prev => prev + 1);
    }
    
    setLiked(!liked);
    setIsLiking(false);
    onLikeToggle?.();
  };

  const handleDoubleClick = () => {
    if (!liked && user) {
      handleLike();
    }
  };

  const handleSubmitComment = async () => {
    if (!comment.trim() || !user) return;
    
    setIsSubmittingComment(true);
    
    const { error } = await supabase
      .from("post_comments")
      .insert({
        post_id: post.id,
        user_id: user.id,
        content: comment.trim(),
        is_anonymous: false, // FlexU comments are NOT anonymous
      });
    
    setIsSubmittingComment(false);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to post comment.",
        variant: "destructive",
      });
    } else {
      setComment("");
      toast({ title: "Comment posted" });
      onPostUpdated?.();
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      toast({ title: "Link copied to clipboard" });
    } catch {
      toast({ title: "Failed to copy link", variant: "destructive" });
    }
  };

  const authorName = post.author?.full_name || "Unknown";
  const authorUsername = post.author?.username || authorName?.toLowerCase().replace(/\s+/g, '');
  const authorAvatar = post.author?.avatar_url;
  const isVerified = post.author?.is_verified;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarImage src={authorAvatar || ""} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-xs">
              {getInitials(authorName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex items-center gap-1">
            <span className="font-semibold text-sm">@{authorUsername}</span>
            {isVerified && (
              <BadgeCheck className="w-4 h-4 text-primary" />
            )}
          </div>
        </div>
        
        <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Media - Required for FlexU */}
      <div 
        className="relative aspect-square bg-muted cursor-pointer"
        onDoubleClick={handleDoubleClick}
      >
        {post.image_url.includes('.mp4') || post.image_url.includes('.webm') || post.image_url.includes('.mov') ? (
          <video
            src={post.image_url}
            controls
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={post.image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className={cn(
                "transition-transform active:scale-125",
                liked && "text-rose-500"
              )}
            >
              <Heart className={cn("w-6 h-6", liked && "fill-current")} />
            </button>
            <button>
              <MessageCircle className="w-6 h-6" />
            </button>
            <button onClick={handleShare}>
              <Send className="w-6 h-6" />
            </button>
          </div>
          <button onClick={() => setSaved(!saved)}>
            <Bookmark className={cn("w-6 h-6", saved && "fill-current")} />
          </button>
        </div>

        {/* Likes count */}
        <p className="font-semibold text-sm">{likesCount} likes</p>

        {/* Caption */}
        {post.content && (
          <div className="text-sm">
            <span className="font-semibold">@{authorUsername}</span>{" "}
            <span className="whitespace-pre-wrap">{post.content}</span>
          </div>
        )}

        {/* Comments count */}
        {(post.comments_count || 0) > 0 && (
          <button className="text-muted-foreground text-sm">
            View all {post.comments_count} comments
          </button>
        )}

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground uppercase">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
        </p>
      </div>

      {/* Comment input */}
      <div className="border-t flex items-center gap-2 p-3">
        <Input
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="border-0 bg-transparent focus-visible:ring-0 px-0"
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmitComment()}
        />
        {comment.trim() && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary font-semibold"
            onClick={handleSubmitComment}
            disabled={isSubmittingComment}
          >
            {isSubmittingComment ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Post"
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
