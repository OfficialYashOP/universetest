import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { FlexUPostCard } from "@/components/flexu/FlexUPostCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { TrendingUp, Loader2, Flame } from "lucide-react";

const TrendingPage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTrendingPosts();
  }, [profile?.university_id]);

  const fetchTrendingPosts = async () => {
    if (!profile?.university_id) return;
    setLoading(true);

    // Get posts sorted by engagement (likes + comments)
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("university_id", profile.university_id)
      .not("image_url", "is", null)
      .eq("is_anonymous", false)
      .order("likes_count", { ascending: false })
      .limit(20);

    if (error) {
      setLoading(false);
      return;
    }

    const userIds = [...new Set(data?.map(p => p.user_id) || [])];
    let profilesMap: Record<string, any> = {};
    
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, is_verified")
        .in("id", userIds);
      profiles?.forEach(p => { profilesMap[p.id] = p; });
    }

    if (user) {
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id);
      setUserLikes(new Set(likes?.map(l => l.post_id) || []));
    }

    setPosts(data?.map(post => ({ ...post, author: profilesMap[post.user_id] })) || []);
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto p-4 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" />
            Trending
          </h1>
          <p className="text-muted-foreground">Most popular posts on campus</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No trending posts yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map(post => (
              <FlexUPostCard
                key={post.id}
                post={post}
                isLiked={userLikes.has(post.id)}
                onLikeToggle={fetchTrendingPosts}
                onPostUpdated={fetchTrendingPosts}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TrendingPage;
