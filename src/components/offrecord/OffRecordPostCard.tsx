import { useState } from "react";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { Heart, MessageCircle, Share2, MoreHorizontal, EyeOff, Pencil, Check, X, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface OffRecordPostCardProps {
  post: {
    id: string;
    content: string;
    created_at: string;
    likes_count: number;
    comments_count: number;
    user_id: string;
  };
  onLikeToggle?: () => void;
  onPostUpdated?: () => void;
  isLiked?: boolean;
}

export const OffRecordPostCard = ({ post, onLikeToggle, onPostUpdated, isLiked = false }: OffRecordPostCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Check if post is editable (within 10 minutes and owned by user)
  const postAge = differenceInMinutes(new Date(), new Date(post.created_at));
  const isOwnPost = user?.id === post.user_id;
  const canEdit = isOwnPost && postAge <= 10;
  const editTimeRemaining = Math.max(0, 10 - postAge);

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

  const handleSaveEdit = async () => {
    if (!editContent.trim() || !canEdit) return;
    
    setIsSaving(true);
    
    const { error } = await supabase
      .from("posts")
      .update({ content: editContent.trim() })
      .eq("id", post.id)
      .eq("user_id", user!.id);
    
    setIsSaving(false);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update post.",
        variant: "destructive",
      });
    } else {
      setIsEditing(false);
      toast({
        title: "Post updated",
        description: "Your post has been updated successfully.",
      });
      onPostUpdated?.();
    }
  };

  const handleCancelEdit = () => {
    setEditContent(post.content);
    setIsEditing(false);
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
        is_anonymous: true, // Comments on OffRecord are also anonymous
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
      toast({ title: "Comment posted anonymously" });
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

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-muted-foreground text-white">
              <EyeOff className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Anonymous</span>
              {isOwnPost && (
                <span className="text-xs text-primary">(You)</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              {canEdit && (
                <span className="text-primary ml-2">• {editTimeRemaining}m left to edit</span>
              )}
            </p>
          </div>
        </div>
        
        {canEdit && !isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[80px] resize-none"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {editContent.length}/500
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={!editContent.trim() || isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
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
        
        <Button variant="ghost" size="sm" className="gap-2 ml-auto" onClick={handleShare}>
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </Button>
      </div>

      {/* Comment input */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <Input
          placeholder="Comment anonymously..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmitComment()}
        />
        {comment.trim() && (
          <Button 
            size="sm" 
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
