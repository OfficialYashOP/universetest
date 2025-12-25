import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  Search, 
  Grid3X3, 
  Heart, 
  MessageCircle, 
  X,
  Loader2,
  Image,
  BadgeCheck
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  is_anonymous: boolean;
  user_id: string;
  author?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

const ExplorePage = () => {
  const { profile } = useProfile();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPosts();
  }, [profile?.university_id]);

  const fetchPosts = async () => {
    if (!profile?.university_id) return;

    setLoading(true);
    
    // Fetch posts with images from same university
    const { data: postsData, error } = await supabase
      .from("posts")
      .select("*")
      .eq("university_id", profile.university_id)
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching posts:", error);
      setLoading(false);
      return;
    }

    // Fetch author profiles
    const nonAnonymousPosts = postsData?.filter(p => !p.is_anonymous) || [];
    const userIds = [...new Set(nonAnonymousPosts.map(p => p.user_id))];

    let profilesMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, is_verified")
        .in("id", userIds);

      profiles?.forEach(p => {
        profilesMap[p.id] = p;
      });
    }

    // Fetch user's likes
    if (user) {
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id);

      setUserLikes(new Set(likes?.map(l => l.post_id) || []));
    }

    const postsWithAuthors = postsData?.map(post => ({
      ...post,
      author: post.is_anonymous ? undefined : profilesMap[post.user_id],
    })) || [];

    setPosts(postsWithAuthors);
    setLoading(false);
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
      
      setUserLikes(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    } else {
      await supabase
        .from("post_likes")
        .insert({ post_id: postId, user_id: user.id });
      
      setUserLikes(prev => new Set(prev).add(postId));
    }
    
    fetchPosts();
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const filteredPosts = posts.filter(post => {
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Grid3X3 className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Explore</h1>
          </div>
        </div>

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

        {/* Grid */}
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
                <img
                  src={post.image_url!}
                  alt=""
                  className="w-full h-full object-cover"
                />
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

        {/* Post Modal */}
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            {selectedPost && (
              <div className="flex flex-col md:flex-row max-h-[90vh]">
                {/* Image */}
                <div className="md:w-1/2 bg-black flex items-center justify-center">
                  <img
                    src={selectedPost.image_url!}
                    alt=""
                    className="max-w-full max-h-[60vh] md:max-h-[80vh] object-contain"
                  />
                </div>
                
                {/* Details */}
                <div className="md:w-1/2 flex flex-col">
                  {/* Author Header */}
                  <div className="p-4 border-b flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedPost.is_anonymous ? "" : selectedPost.author?.avatar_url || ""} />
                      <AvatarFallback className={cn(
                        "text-white",
                        selectedPost.is_anonymous 
                          ? "bg-muted-foreground" 
                          : "bg-gradient-to-br from-primary to-primary/60"
                      )}>
                        {getInitials(selectedPost.is_anonymous ? "Anonymous" : selectedPost.author?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {selectedPost.is_anonymous ? "Anonymous" : (selectedPost.author?.username || selectedPost.author?.full_name || "Unknown")}
                        </span>
                        {!selectedPost.is_anonymous && selectedPost.author?.is_verified && (
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

export default ExplorePage;
