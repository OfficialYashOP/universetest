import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CreatePostCard } from "@/components/dashboard/CreatePostCard";
import { PostCard } from "@/components/dashboard/PostCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Loader2, Sparkles } from "lucide-react";

interface Post {
  id: string;
  content: string;
  created_at: string;
  is_anonymous: boolean;
  likes_count: number;
  comments_count: number;
  user_id: string;
  image_url: string | null;
  tags: string[] | null;
  author?: {
    full_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    role?: string;
  };
}

const Dashboard = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  const fetchPosts = async () => {
    if (!profile?.university_id) return;

    setLoading(true);

    // Fetch posts
    const { data: postsData, error } = await supabase
      .from("posts")
      .select("*")
      .eq("university_id", profile.university_id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching posts:", error);
      setLoading(false);
      return;
    }

    // Fetch author profiles for non-anonymous posts
    const nonAnonymousPosts = postsData?.filter(p => !p.is_anonymous) || [];
    const userIds = [...new Set(nonAnonymousPosts.map(p => p.user_id))];

    let profilesMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, is_verified")
        .in("id", userIds);

      profiles?.forEach(p => {
        profilesMap[p.id] = p;
      });

      // Fetch roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      roles?.forEach(r => {
        if (profilesMap[r.user_id]) {
          profilesMap[r.user_id].role = r.role;
        }
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

    // Combine posts with author info
    const postsWithAuthors = postsData?.map(post => ({
      ...post,
      author: post.is_anonymous ? undefined : profilesMap[post.user_id],
    })) || [];

    setPosts(postsWithAuthors);
    setLoading(false);
  };

  useEffect(() => {
    if (profile?.university_id) {
      fetchPosts();
    }
  }, [profile?.university_id]);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Campus Feed
          </h1>
          <p className="text-muted-foreground">
            See what's happening at {profile?.university?.name || "your university"}
          </p>
        </div>

        {/* Create Post */}
        <CreatePostCard onPostCreated={fetchPosts} />

        {/* Posts */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-muted-foreground">No posts yet</p>
              <p className="text-sm text-muted-foreground">
                Be the first to share something with your campus!
              </p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                isLiked={userLikes.has(post.id)}
                onLikeToggle={fetchPosts}
              />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
