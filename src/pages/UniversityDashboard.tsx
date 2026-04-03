import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CreatePostCardInstagram } from "@/components/feed/CreatePostCardInstagram";
import { InstagramPostCard } from "@/components/feed/InstagramPostCard";
import { CommunityGroupsSection } from "@/components/community/CommunityGroupsSection";
import { HousingTab } from "@/components/dashboard/HousingTab";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Loader2, Sparkles, Grid3X3, MessageSquare, Home, Wrench, BookOpen, Users, Briefcase } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, MapPin, BadgeCheck, Building2, IndianRupee, Clock, ExternalLink } from "lucide-react";

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

const UniversityDashboard = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Validate slug matches user's university
  useEffect(() => {
    if (profile?.university) {
      const userSlug = (profile.university as any)?.slug;
      console.log("[UniversityDashboard] User slug:", userSlug, "Route slug:", slug);
    }
  }, [profile, slug, navigate]);

  const fetchPosts = async () => {
    if (!profile?.university_id) return;

    setLoading(true);

    let query = supabase
      .from("posts")
      .select("*")
      .eq("university_id", profile.university_id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (selectedGroupId) {
      query = query.eq("group_id", selectedGroupId);
    }

    const { data: postsData, error } = await query;

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
  };

  useEffect(() => {
    if (profile?.university_id) {
      fetchPosts();
    }
  }, [profile?.university_id, selectedGroupId]);

  const universityName = (profile?.university as any)?.name || "Your University";
  const universityShortName = (profile?.university as any)?.short_name || slug?.toUpperCase();

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              {universityShortName} Community
            </h1>
            <p className="text-muted-foreground">
              Welcome to {universityName}
            </p>
          </div>
          <Link to="/explore">
            <Button variant="outline" size="sm" className="gap-2">
              <Grid3X3 className="w-4 h-4" />
              Explore
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-6">
            <TabsTrigger value="feed" className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Feed</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-1.5">
              <Wrench className="w-4 h-4" />
              <span className="hidden sm:inline">Services</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Resources</span>
            </TabsTrigger>
            <TabsTrigger value="people" className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">People</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Jobs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-6">
            <div className="grid lg:grid-cols-[280px_1fr] gap-6">
              <aside className="hidden lg:block space-y-4">
                <CommunityGroupsSection 
                  selectedGroupId={selectedGroupId}
                  onSelectGroup={setSelectedGroupId}
                />
              </aside>
              <div className="space-y-4">
                <CreatePostCardInstagram onPostCreated={fetchPosts} groupId={selectedGroupId || undefined} />
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
                  <div className="space-y-4">
                    {posts.map(post => (
                      <InstagramPostCard
                        key={post.id}
                        post={post}
                        isLiked={userLikes.has(post.id)}
                        onLikeToggle={fetchPosts}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="services">
            <ServicesTabContent universityId={profile?.university_id} />
          </TabsContent>

          <TabsContent value="resources">
            <ResourcesTabContent universityId={profile?.university_id} />
          </TabsContent>

          <TabsContent value="people">
            <PeopleTabContent universityId={profile?.university_id} currentUserId={user?.id} />
          </TabsContent>

          <TabsContent value="jobs">
            <JobsTabContent />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default UniversityDashboard;
