import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

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
  group_id: string | null;
  author?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    role?: string;
  };
}

export const useRealtimePosts = (
  filter: "offrecord" | "flexu" | "all" = "all"
) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  const fetchPosts = useCallback(async () => {
    if (!profile?.university_id) return;

    setLoading(true);

    let query = supabase
      .from("posts")
      .select("*")
      .eq("university_id", profile.university_id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (filter === "offrecord") {
      query = query.eq("is_anonymous", true).is("image_url", null);
    } else if (filter === "flexu") {
      query = query.eq("is_anonymous", false).not("image_url", "is", null);
    }

    const { data: postsData, error } = await query;

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
        .select("id, full_name, username, avatar_url, is_verified")
        .in("id", userIds);

      profiles?.forEach(p => {
        profilesMap[p.id] = p;
      });

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

    const postsWithAuthors = postsData?.map(post => ({
      ...post,
      author: post.is_anonymous ? undefined : profilesMap[post.user_id],
    })) || [];

    setPosts(postsWithAuthors);
    setLoading(false);
  }, [profile?.university_id, filter, user?.id]);

  useEffect(() => {
    if (profile?.university_id) {
      fetchPosts();
    }
  }, [fetchPosts]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!profile?.university_id) return;

    const channel = supabase
      .channel("posts-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
          filter: `university_id=eq.${profile.university_id}`,
        },
        (payload) => {
          console.log("Posts realtime update:", payload);
          
          if (payload.eventType === "INSERT") {
            const newPost = payload.new as Post;
            
            // Apply filter
            if (filter === "offrecord" && (!newPost.is_anonymous || newPost.image_url)) return;
            if (filter === "flexu" && (newPost.is_anonymous || !newPost.image_url)) return;
            
            // Fetch author info if not anonymous
            if (!newPost.is_anonymous) {
              supabase
                .from("profiles")
                .select("id, full_name, username, avatar_url, is_verified")
                .eq("id", newPost.user_id)
                .single()
                .then(({ data: authorProfile }) => {
                  setPosts(prev => [{
                    ...newPost,
                    author: authorProfile || undefined,
                  }, ...prev]);
                });
            } else {
              setPosts(prev => [newPost, ...prev]);
            }
          } else if (payload.eventType === "DELETE") {
            setPosts(prev => prev.filter(p => p.id !== payload.old.id));
          } else if (payload.eventType === "UPDATE") {
            setPosts(prev => prev.map(p => 
              p.id === payload.new.id ? { ...p, ...payload.new } : p
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.university_id, filter]);

  return { posts, loading, userLikes, refetch: fetchPosts };
};

export const useRealtimeComments = (postId: string) => {
  const [commentsCount, setCommentsCount] = useState(0);

  useEffect(() => {
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "post_comments",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          setCommentsCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  return { commentsCount };
};
