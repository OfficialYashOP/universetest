import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CreateOffRecordPost } from "@/components/offrecord/CreateOffRecordPost";
import { OffRecordPostCard } from "@/components/offrecord/OffRecordPostCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { EyeOff, Loader2 } from "lucide-react";

interface Post {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_id: string;
}

const OffRecordPage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  const fetchPosts = async () => {
    if (!profile?.university_id) return;

    setLoading(true);

    // Only fetch anonymous posts (OffRecord is anonymous-only)
    const { data: postsData, error } = await supabase
      .from("posts")
      .select("id, content, created_at, likes_count, comments_count, user_id")
      .eq("university_id", profile.university_id)
      .eq("is_anonymous", true) // Only anonymous posts
      .is("image_url", null) // No media posts
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching posts:", error);
      setLoading(false);
      return;
    }

    // Fetch user's likes
    if (user) {
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id);

      setUserLikes(new Set(likes?.map(l => l.post_id) || []));
    }

    setPosts(postsData || []);
    setLoading(false);
  };

  useEffect(() => {
    if (profile?.university_id) {
      fetchPosts();
    }
  }, [profile?.university_id]);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <EyeOff className="w-6 h-6 text-primary" />
            OffRecord
          </h1>
          <p className="text-muted-foreground">
            Share your thoughts anonymously • Text only • Edit within 10 minutes
          </p>
        </div>

        {/* Create Post */}
        <CreateOffRecordPost onPostCreated={fetchPosts} />

        {/* Posts */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <EyeOff className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No anonymous posts yet</p>
              <p className="text-sm text-muted-foreground">
                Be the first to share something anonymously!
              </p>
            </div>
          ) : (
            posts.map(post => (
              <OffRecordPostCard
                key={post.id}
                post={post}
                isLiked={userLikes.has(post.id)}
                onLikeToggle={fetchPosts}
                onPostUpdated={fetchPosts}
              />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OffRecordPage;
