import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Share2, MoreHorizontal, BadgeCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PostCardProps {
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
      avatar_url: string | null;
      is_verified: boolean;
      role?: string;
    };
  };
  onLikeToggle?: () => void;
  isLiked?: boolean;
}

export const PostCard = ({ post, onLikeToggle, isLiked = false }: PostCardProps) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleLike = async () => {
    if (!user || isLiking) return;
    
    setIsLiking(true);
    
    if (liked) {
      // Unlike
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", user.id);
      
      setLikesCount(prev => Math.max(0, prev - 1));
    } else {
      // Like
      await supabase
        .from("post_likes")
        .insert({ post_id: post.id, user_id: user.id });
      
      setLikesCount(prev => prev + 1);
    }
    
    setLiked(!liked);
    setIsLiking(false);
    onLikeToggle?.();
  };

  const authorName = post.is_anonymous ? "Anonymous" : post.author?.full_name || "Unknown";
  const authorAvatar = post.is_anonymous ? null : post.author?.avatar_url;
  const isVerified = !post.is_anonymous && post.author?.is_verified;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={authorAvatar || ""} />
            <AvatarFallback className={cn(
              "text-white",
              post.is_anonymous 
                ? "bg-muted-foreground" 
                : "bg-gradient-to-br from-universe-blue to-universe-purple"
            )}>
              {getInitials(authorName)}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{authorName}</span>
              {isVerified && (
                <BadgeCheck className="w-4 h-4 text-universe-cyan" />
              )}
              {post.author?.role && !post.is_anonymous && (
                <Badge variant="outline" className="text-xs capitalize">
                  {post.author.role}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <p className="text-foreground whitespace-pre-wrap">{post.content}</p>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={cn(
            "gap-2",
            liked && "text-rose-500"
          )}
        >
          <Heart className={cn("w-4 h-4", liked && "fill-current")} />
          <span>{likesCount}</span>
        </Button>
        
        <Button variant="ghost" size="sm" className="gap-2">
          <MessageCircle className="w-4 h-4" />
          <span>{post.comments_count || 0}</span>
        </Button>
        
        <Button variant="ghost" size="sm" className="gap-2 ml-auto">
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </Button>
      </div>
    </div>
  );
};
