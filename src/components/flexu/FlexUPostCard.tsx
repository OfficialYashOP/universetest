import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, BadgeCheck, Loader2, Trash2, Flag, Play, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CommentsModal } from "@/components/comments/CommentsModal";
import { ReportModal } from "@/components/reports/ReportModal";
import { isVideoUrl, extractVideoInfo, getPlatformName } from "@/lib/videoUtils";

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
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const isOwnPost = user?.id === post.user_id;
  const isVideo = isVideoUrl(post.image_url);
  const videoInfo = isVideo ? extractVideoInfo(post.image_url) : null;

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

  const handleDelete = async () => {
    if (!isOwnPost) return;
    
    setIsDeleting(true);
    
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", post.id)
      .eq("user_id", user!.id);
    
    setIsDeleting(false);
    setShowDeleteDialog(false);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete post.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Post deleted",
        description: "Your post has been deleted.",
      });
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

  const openVideoLink = () => {
    if (isVideo) {
      window.open(post.image_url, "_blank", "noopener,noreferrer");
    }
  };

  const authorName = post.author?.full_name || "Unknown";
  const authorUsername = post.author?.username || authorName?.toLowerCase().replace(/\s+/g, '');
  const authorAvatar = post.author?.avatar_url;
  const isVerified = post.author?.is_verified;

  // Render media (image or video thumbnail)
  const renderMedia = () => {
    if (isVideo && videoInfo) {
      return (
        <div 
          className="relative aspect-square bg-muted cursor-pointer group"
          onClick={openVideoLink}
        >
          {videoInfo.thumbnailUrl ? (
            <img
              src={videoInfo.thumbnailUrl}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src.includes("maxresdefault")) {
                  target.src = target.src.replace("maxresdefault", "hqdefault");
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
              <div className="text-center">
                <Play className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{getPlatformName(videoInfo.platform)}</p>
              </div>
            </div>
          )}
          
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-black ml-1" />
            </div>
          </div>
          
          {/* Platform badge */}
          <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            {getPlatformName(videoInfo.platform)}
          </div>
        </div>
      );
    }

    // Regular image or uploaded video
    const isUploadedVideo = post.image_url.includes('.mp4') || post.image_url.includes('.webm') || post.image_url.includes('.mov');
    
    return (
      <div 
        className="relative aspect-square bg-muted cursor-pointer"
        onDoubleClick={handleDoubleClick}
      >
        {isUploadedVideo ? (
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
    );
  };

  return (
    <>
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwnPost ? (
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete post
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setShowReport(true)}>
                  <Flag className="w-4 h-4 mr-2" />
                  Report post
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Media */}
        {renderMedia()}

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
              <button onClick={() => setShowComments(true)}>
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
          {commentsCount > 0 && (
            <button 
              className="text-muted-foreground text-sm"
              onClick={() => setShowComments(true)}
            >
              View all {commentsCount} comments
            </button>
          )}

          {/* Timestamp */}
          <p className="text-xs text-muted-foreground uppercase">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Comments Modal */}
      <CommentsModal
        postId={post.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        isAnonymousMode={false}
        onCommentAdded={() => setCommentsCount(prev => prev + 1)}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        reportedType="post"
        reportedId={post.id}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your post will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
