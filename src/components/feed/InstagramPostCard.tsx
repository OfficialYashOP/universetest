import { useState, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, BadgeCheck, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface InstagramPostCardProps {
  post: {
    id: string;
    content: string;
    created_at: string;
    is_anonymous: boolean;
    likes_count: number;
    comments_count: number;
    user_id: string;
    image_url?: string | null;
    tags?: string[] | null;
    author?: {
      full_name: string | null;
      username: string | null;
      avatar_url: string | null;
      is_verified: boolean;
      role?: string;
    };
  };
  onLikeToggle?: () => void;
  isLiked?: boolean;
}

export const InstagramPostCard = ({ post, onLikeToggle, isLiked = false }: InstagramPostCardProps) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comment, setComment] = useState("");
  const imageRef = useRef<HTMLImageElement>(null);

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

  const authorName = post.is_anonymous ? "Anonymous" : post.author?.full_name || "Unknown";
  const authorUsername = post.is_anonymous ? "anonymous" : post.author?.username || authorName?.toLowerCase().replace(/\s+/g, '');
  const authorAvatar = post.is_anonymous ? null : post.author?.avatar_url;
  const isVerified = !post.is_anonymous && post.author?.is_verified;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarImage src={authorAvatar || ""} />
            <AvatarFallback className={cn(
              "text-white text-xs",
              post.is_anonymous 
                ? "bg-muted-foreground" 
                : "bg-gradient-to-br from-primary to-primary/60"
            )}>
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

      {/* Image */}
      {post.image_url && (
        <div 
          className="relative aspect-square bg-muted cursor-pointer"
          onDoubleClick={handleDoubleClick}
        >
          <img
            ref={imageRef}
            src={post.image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

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
            <button>
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
        <div className="text-sm">
          <span className="font-semibold">@{authorUsername}</span>{" "}
          <span className="whitespace-pre-wrap">{post.content}</span>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.map((tag) => (
              <span key={tag} className="text-primary text-sm">
                #{tag}
              </span>
            ))}
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
        />
        {comment.trim() && (
          <Button variant="ghost" size="sm" className="text-primary font-semibold">
            Post
          </Button>
        )}
      </div>
    </div>
  );
};
