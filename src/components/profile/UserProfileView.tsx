import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BadgeCheck,
  Loader2,
  Grid3X3,
  Users,
  UserPlus,
  UserMinus,
  MessageCircle,
  ArrowLeft,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useProfile } from "@/hooks/useProfile";
import { UnverifiedWarningDialog } from "@/components/verification/UnverifiedWarningDialog";

interface UserProfile {
  id: string;
  full_name: string | null;
  username?: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  branch: string | null;
  year_of_study: string | null;
  university_id: string | null;
  verification_status: "pending" | "verified" | "rejected" | null;
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

interface FollowUser {
  id: string;
  full_name: string | null;
  username?: string | null;
  avatar_url: string | null;
  is_verified: boolean;
}

interface UserProfileViewProps {
  userId: string;
  onClose?: () => void;
}

export const UserProfileView = ({ userId, onClose }: UserProfileViewProps) => {
  const { user } = useAuth();
  const { profile: myProfile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  
  // Warning dialog states
  const [showFollowWarning, setShowFollowWarning] = useState(false);
  const [showMessageWarning, setShowMessageWarning] = useState(false);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    fetchProfile();
    fetchPosts();
    fetchFollowData();
    if (user && !isOwnProfile) {
      checkIfFollowing();
    }
  }, [userId, user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .rpc("get_public_profile", { profile_id: userId });
    
    if (data && data[0]) {
      setProfile(data[0]);
    }
    setLoading(false);
  };

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("id, content, image_url, created_at, likes_count, comments_count")
      .eq("user_id", userId)
      .eq("is_anonymous", false)
      .order("created_at", { ascending: false });

    setPosts(data || []);
  };

  const fetchFollowData = async () => {
    // Fetch followers
    const { data: followerData } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", userId);

    if (followerData) {
      const followerIds = followerData.map(f => f.follower_id);
      const followerProfiles: FollowUser[] = [];
      
      for (const id of followerIds) {
        const { data } = await supabase
          .rpc("get_public_profile", { profile_id: id });
        if (data && data[0]) {
          followerProfiles.push(data[0]);
        }
      }
      setFollowers(followerProfiles);
    }

    // Fetch following
    const { data: followingData } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);

    if (followingData) {
      const followingIds = followingData.map(f => f.following_id);
      const followingProfiles: FollowUser[] = [];
      
      for (const id of followingIds) {
        const { data } = await supabase
          .rpc("get_public_profile", { profile_id: id });
        if (data && data[0]) {
          followingProfiles.push(data[0]);
        }
      }
      setFollowing(followingProfiles);
    }
  };

  const checkIfFollowing = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", userId)
      .maybeSingle();

    setIsFollowing(!!data);
  };

  const handleFollow = async () => {
    if (!user) return;
    
    setIsFollowLoading(true);

    if (isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", userId);
      
      setIsFollowing(false);
      setFollowers(prev => prev.filter(f => f.id !== user.id));
    } else {
      await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: userId });
      
      setIsFollowing(true);
      // Refresh followers
      await fetchFollowData();
    }

    setIsFollowLoading(false);
  };

  const handleStartChat = async () => {
    if (!user) return;
    
    setIsStartingChat(true);

    try {
      // Check if chat already exists
      const { data: existingParticipations, error: fetchError } = await supabase
        .from("chat_participants")
        .select("room_id")
        .eq("user_id", user.id);

      if (fetchError) {
        console.error("Error fetching participations:", fetchError);
      }

      const roomIds = existingParticipations?.map(p => p.room_id) || [];

      if (roomIds.length > 0) {
        const { data: otherParticipations } = await supabase
          .from("chat_participants")
          .select("room_id")
          .eq("user_id", userId)
          .in("room_id", roomIds);

        if (otherParticipations?.length) {
          // Chat already exists, navigate to it
          navigate(`/chat?room=${otherParticipations[0].room_id}`);
          setIsStartingChat(false);
          return;
        }
      }

      // Create new chat room
      const { data: newRoom, error: roomError } = await supabase
        .from("chat_rooms")
        .insert({ created_by: user.id })
        .select()
        .single();

      if (roomError || !newRoom) {
        console.error("Error creating chat room:", roomError);
        toast({ title: "Failed to create chat room", variant: "destructive" });
        setIsStartingChat(false);
        return;
      }

      // Add both participants in a single insert
      const { error: participantError } = await supabase.from("chat_participants").insert([
        { room_id: newRoom.id, user_id: user.id },
        { room_id: newRoom.id, user_id: userId },
      ]);

      if (participantError) {
        console.error("Error adding participants:", participantError);
        toast({ title: "Failed to add chat participants", variant: "destructive" });
        setIsStartingChat(false);
        return;
      }

      // Navigate to chat page with the new room
      navigate(`/chat?room=${newRoom.id}`);
    } catch (error) {
      console.error("Error starting chat:", error);
      toast({ title: "Failed to start chat", variant: "destructive" });
    } finally {
      setIsStartingChat(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 sm:gap-8 p-4">
        <Avatar className="h-20 w-20 sm:h-32 sm:w-32 border-2 border-border">
          <AvatarImage src={profile.avatar_url || ""} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-xl sm:text-3xl">
            {getInitials(profile.full_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-semibold">
                {profile.username || profile.full_name || "User"}
              </h1>
              {profile.is_verified && (
                <BadgeCheck className="w-5 h-5 text-primary" />
              )}
              {profile.verification_status === "pending" && !profile.is_verified && (
                <Badge variant="outline" className="gap-1 text-amber-600 border-amber-500/50 bg-amber-500/10">
                  <Clock className="w-3 h-3" />
                  Verification Pending
                </Badge>
              )}
            </div>
            
            {!isOwnProfile && user && (
              <div className="flex flex-col gap-2">
                {/* Not Verified Badge - only show if not pending */}
                {!profile.is_verified && profile.verification_status !== "pending" && (
                  <Badge variant="outline" className="w-fit gap-1 text-destructive border-destructive/50 bg-destructive/10">
                    <ShieldAlert className="w-3 h-3" />
                    Not Verified
                  </Badge>
                )}
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={isFollowing ? "outline" : "default"}
                    onClick={() => {
                      if (!profile.is_verified && !isFollowing) {
                        setShowFollowWarning(true);
                      } else {
                        handleFollow();
                      }
                    }}
                    disabled={isFollowLoading}
                    className="gap-1"
                  >
                    {isFollowLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Follow
                      </>
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1"
                    onClick={handleStartChat}
                    disabled={isStartingChat}
                  >
                    {isStartingChat ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        Message
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {isOwnProfile && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/profile")}
              >
                Edit Profile
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <span className="font-semibold">{posts.length}</span>
              <p className="text-sm text-muted-foreground">posts</p>
            </div>
            <button
              onClick={() => setShowFollowers(true)}
              className="text-center hover:opacity-80"
            >
              <span className="font-semibold">{followers.length}</span>
              <p className="text-sm text-muted-foreground">followers</p>
            </button>
            <button
              onClick={() => setShowFollowing(true)}
              className="text-center hover:opacity-80"
            >
              <span className="font-semibold">{following.length}</span>
              <p className="text-sm text-muted-foreground">following</p>
            </button>
          </div>

          {/* Bio */}
          <div>
            <p className="font-medium">{profile.full_name}</p>
            {profile.bio && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {profile.bio}
              </p>
            )}
            {(profile.branch || profile.year_of_study) && (
              <p className="text-sm text-muted-foreground mt-1">
                {profile.branch}
                {profile.branch && profile.year_of_study && " • "}
                {profile.year_of_study}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <Tabs defaultValue="posts" className="mt-4">
        <TabsList className="w-full justify-center border-t border-border rounded-none bg-transparent">
          <TabsTrigger value="posts" className="gap-2">
            <Grid3X3 className="w-4 h-4" />
            Posts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-0">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <Grid3X3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No posts yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="aspect-square bg-muted relative group cursor-pointer"
                >
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2">
                      <p className="text-xs text-muted-foreground line-clamp-4 text-center">
                        {post.content}
                      </p>
                    </div>
                  )}
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                    <span className="flex items-center gap-1">
                      ❤️ {post.likes_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      💬 {post.comments_count || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Followers Modal */}
      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Followers</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {followers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No followers yet</p>
            ) : (
              followers.map((follower) => (
                <FollowUserItem key={follower.id} user={follower} />
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Modal */}
      <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Following</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {following.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Not following anyone</p>
            ) : (
              following.map((followedUser) => (
                <FollowUserItem key={followedUser.id} user={followedUser} />
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const FollowUserItem = ({ user }: { user: FollowUser }) => {
  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.avatar_url || ""} />
        <AvatarFallback className="bg-primary/10">
          {getInitials(user.full_name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-medium text-sm truncate">
            {user.username || user.full_name || "User"}
          </span>
          {user.is_verified && (
            <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
          )}
        </div>
        {user.full_name && user.username && (
          <p className="text-xs text-muted-foreground truncate">{user.full_name}</p>
        )}
      </div>
    </div>
  );
};