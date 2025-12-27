import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useFollow = (targetUserId: string | undefined) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!targetUserId) return;
    checkFollowStatus();
    fetchCounts();
  }, [targetUserId, user?.id]);

  const checkFollowStatus = async () => {
    if (!user || !targetUserId) return;
    
    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId)
      .maybeSingle();
    
    setIsFollowing(!!data);
  };

  const fetchCounts = async () => {
    if (!targetUserId) return;

    const [followersRes, followingRes] = await Promise.all([
      supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", targetUserId),
      supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", targetUserId),
    ]);

    setFollowersCount(followersRes.count || 0);
    setFollowingCount(followingRes.count || 0);
  };

  const toggleFollow = async () => {
    if (!user || !targetUserId || isLoading) return;
    
    setIsLoading(true);

    if (isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);
      
      setIsFollowing(false);
      setFollowersCount(prev => Math.max(0, prev - 1));
    } else {
      await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: targetUserId });
      
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
    }

    setIsLoading(false);
  };

  return {
    isFollowing,
    followersCount,
    followingCount,
    toggleFollow,
    isLoading,
  };
};

export const useFollowers = (userId: string | undefined) => {
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchFollowData();
  }, [userId]);

  const fetchFollowData = async () => {
    if (!userId) return;
    setLoading(true);

    const [followersRes, followingRes] = await Promise.all([
      supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", userId),
      supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId),
    ]);

    // Fetch profiles
    const followerIds = followersRes.data?.map(f => f.follower_id) || [];
    const followingIds = followingRes.data?.map(f => f.following_id) || [];

    if (followerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, is_verified")
        .in("id", followerIds);
      setFollowers(profiles || []);
    }

    if (followingIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, is_verified")
        .in("id", followingIds);
      setFollowing(profiles || []);
    }

    setLoading(false);
  };

  return { followers, following, loading, refetch: fetchFollowData };
};
