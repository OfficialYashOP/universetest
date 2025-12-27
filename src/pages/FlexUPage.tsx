import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CreateFlexUPost } from "@/components/flexu/CreateFlexUPost";
import { FlexUPostCard } from "@/components/flexu/FlexUPostCard";
import { StoriesBar } from "@/components/stories/StoriesBar";
import { useRealtimePosts } from "@/hooks/useRealtimePosts";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Grid3X3, 
  Heart, 
  MessageCircle, 
  Loader2,
  Image,
  BadgeCheck,
  LayoutGrid,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Post {
  id: string;
  content: string;
  image_url: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_id: string;
  author?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

const FlexUPage = () => {
  const { user } = useAuth();
  const { posts, loading, userLikes, refetch } = useRealtimePosts("flexu");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activeTab, setActiveTab] = useState("feed");

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    
    const isLiked = userLikes.has(postId);
    
    if (isLiked) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("post_likes")
        .insert({ post_id: postId, user_id: user.id });
    }
    
    refetch();
  };

  const filteredPosts = (posts as Post[]).filter(post => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      post.content?.toLowerCase().includes(q) ||
      post.author?.full_name?.toLowerCase().includes(q) ||
      post.author?.username?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Stories Bar */}
        <StoriesBar />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Image className="w-6 h-6 text-primary" />
              FlexU
            </h1>
            <p className="text-muted-foreground text-sm">
              Share photos & videos • Your identity is shown • No anonymous posting
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="explore" className="flex items-center gap-2">
              <Grid3X3 className="w-4 h-4" />
              Explore
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-6 mt-6">
            {/* Create Post */}
            <CreateFlexUPost onPostCreated={refetch} />

            {/* Feed View */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <Image className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No posts yet</p>
                <p className="text-sm text-muted-foreground">Be the first to share a photo!</p>
              </div>
            ) : (
              <div className="max-w-xl mx-auto space-y-6">
                {filteredPosts.map(post => (
                  <FlexUPostCard
                    key={post.id}
                    post={post}
                    isLiked={userLikes.has(post.id)}
                    onLikeToggle={refetch}
                    onPostUpdated={refetch}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="explore" className="space-y-6 mt-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search posts, usernames..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Grid View */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <Image className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No photo posts yet</p>
                <p className="text-sm text-muted-foreground">Be the first to share a photo!</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 sm:gap-2">
                {filteredPosts.map(post => (
                  <button
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="relative aspect-square group overflow-hidden rounded-sm bg-muted"
                  >
                    {post.image_url.includes('.mp4') || post.image_url.includes('.webm') ? (
                      <video
                        src={post.image_url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={post.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                      <span className="flex items-center gap-1">
                        <Heart className="w-5 h-5 fill-current" />
                        {post.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-5 h-5" />
                        {post.comments_count || 0}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Post Modal */}
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            {selectedPost && (
              <div className="flex flex-col md:flex-row max-h-[90vh]">
                {/* Media */}
                <div className="md:w-1/2 bg-black flex items-center justify-center">
                  {selectedPost.image_url.includes('.mp4') || selectedPost.image_url.includes('.webm') ? (
                    <video
                      src={selectedPost.image_url}
                      controls
                      className="max-w-full max-h-[60vh] md:max-h-[80vh] object-contain"
                    />
                  ) : (
                    <img
                      src={selectedPost.image_url}
                      alt=""
                      className="max-w-full max-h-[60vh] md:max-h-[80vh] object-contain"
                    />
                  )}
                </div>
                
                {/* Details */}
                <div className="md:w-1/2 flex flex-col">
                  {/* Author Header */}
                  <div className="p-4 border-b flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedPost.author?.avatar_url || ""} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white">
                        {getInitials(selectedPost.author?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {selectedPost.author?.username || selectedPost.author?.full_name || "Unknown"}
                        </span>
                        {selectedPost.author?.is_verified && (
                          <BadgeCheck className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(selectedPost.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    <p className="whitespace-pre-wrap">{selectedPost.content}</p>
                  </div>

                  {/* Actions */}
                  <div className="p-4 border-t">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleLike(selectedPost.id)}
                        className={cn(
                          "flex items-center gap-2 transition-colors",
                          userLikes.has(selectedPost.id) ? "text-rose-500" : "text-foreground"
                        )}
                      >
                        <Heart className={cn("w-6 h-6", userLikes.has(selectedPost.id) && "fill-current")} />
                      </button>
                      <button className="text-foreground">
                        <MessageCircle className="w-6 h-6" />
                      </button>
                    </div>
                    <p className="font-semibold mt-2">{selectedPost.likes_count || 0} likes</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default FlexUPage;
