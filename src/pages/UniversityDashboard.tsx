import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CreatePostCard } from "@/components/dashboard/CreatePostCard";
import { PostCard } from "@/components/dashboard/PostCard";
import { HousingTab } from "@/components/dashboard/HousingTab";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Loader2, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Home, 
  Wrench, 
  BookOpen, 
  Users 
} from "lucide-react";

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

const UniversityDashboard = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  // Validate slug matches user's university
  useEffect(() => {
    if (profile?.university) {
      const userSlug = (profile.university as any)?.slug;
      console.log("[UniversityDashboard] User slug:", userSlug, "Route slug:", slug);
      
      // For now, allow viewing - in future can restrict or show explore mode
      if (userSlug && userSlug !== slug) {
        console.log("[UniversityDashboard] Exploring other university");
      }
    }
  }, [profile, slug, navigate]);

  const fetchPosts = async () => {
    if (!profile?.university_id) return;

    setLoading(true);

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

    // Fetch author profiles
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
      console.log("[UniversityDashboard] Loaded for university:", profile.university?.name);
    }
  }, [profile?.university_id]);

  const universityName = (profile?.university as any)?.name || "Your University";
  const universityShortName = (profile?.university as any)?.short_name || slug?.toUpperCase();

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            {universityShortName} Community
          </h1>
          <p className="text-muted-foreground">
            Welcome to {universityName}
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-6">
            <TabsTrigger value="feed" className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Feed</span>
            </TabsTrigger>
            <TabsTrigger value="housing" className="flex items-center gap-1.5">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Housing</span>
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
          </TabsList>

          <TabsContent value="feed" className="space-y-6">
            <CreatePostCard onPostCreated={fetchPosts} />
            
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
                  <PostCard
                    key={post.id}
                    post={post}
                    isLiked={userLikes.has(post.id)}
                    onLikeToggle={fetchPosts}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="housing">
            <HousingTab />
          </TabsContent>

          <TabsContent value="services">
            <div className="text-center py-12 text-muted-foreground">
              <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Local services coming soon</p>
              <p className="text-sm mt-1">Discover restaurants, laundry, and more</p>
            </div>
          </TabsContent>

          <TabsContent value="resources">
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Study resources coming soon</p>
              <p className="text-sm mt-1">Share and find notes, books, and study materials</p>
            </div>
          </TabsContent>

          <TabsContent value="people">
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>People directory coming soon</p>
              <p className="text-sm mt-1">Connect with students, seniors, and alumni</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default UniversityDashboard;
