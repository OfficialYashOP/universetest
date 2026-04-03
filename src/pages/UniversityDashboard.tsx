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
import { useQuery } from "@tanstack/react-query";
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

// === Inline Tab Components ===

const ServicesTabContent = ({ universityId }: { universityId?: string | null }) => {
  const { data: services, isLoading } = useQuery({
    queryKey: ["local-services-tab", universityId],
    queryFn: async () => {
      if (!universityId) return [];
      const { data } = await supabase
        .from("local_services")
        .select("*")
        .eq("university_id", universityId)
        .eq("is_admin_approved", true)
        .limit(20);
      return data || [];
    },
    enabled: !!universityId,
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{services?.length || 0} services available</p>
        <Link to="/local-services"><Button variant="outline" size="sm">View All</Button></Link>
      </div>
      {(!services || services.length === 0) ? (
        <div className="text-center py-12 text-muted-foreground">
          <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No services listed yet</p>
          <Link to="/local-services"><Button variant="link" className="mt-2">Browse all services</Button></Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {services.map(s => (
            <Card key={s.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold">{s.name}</h3>
                <Badge variant="secondary" className="text-xs capitalize">{s.category}</Badge>
                {s.description && <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>}
                {s.address && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{s.address}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const ResourcesTabContent = ({ universityId }: { universityId?: string | null }) => {
  const { data: resources, isLoading } = useQuery({
    queryKey: ["resources-tab", universityId],
    queryFn: async () => {
      if (!universityId) return [];
      const { data } = await supabase
        .from("academic_resources")
        .select("*")
        .eq("university_id", universityId)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!universityId,
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{resources?.length || 0} resources shared</p>
        <Link to="/academic-resources"><Button variant="outline" size="sm">View All</Button></Link>
      </div>
      {(!resources || resources.length === 0) ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No resources shared yet</p>
          <Link to="/academic-resources"><Button variant="link" className="mt-2">Browse all resources</Button></Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {resources.map(r => (
            <Card key={r.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold">{r.title}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs capitalize">{r.resource_type}</Badge>
                  {r.condition && <Badge variant="outline" className="text-xs">{r.condition}</Badge>}
                </div>
                {r.subject && <p className="text-xs text-muted-foreground">{r.subject}</p>}
                {r.price != null && (
                  <p className="text-sm font-medium flex items-center gap-1">
                    <IndianRupee className="w-3 h-3" />
                    {r.price === 0 ? "Free" : r.price}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const PeopleTabContent = ({ universityId, currentUserId }: { universityId?: string | null; currentUserId?: string }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const { data: members, isLoading } = useQuery({
    queryKey: ["people-tab", universityId],
    queryFn: async () => {
      if (!universityId) return [];
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, bio, branch, year_of_study, is_verified")
        .eq("university_id", universityId)
        .neq("id", currentUserId || "")
        .limit(50);
      return data || [];
    },
    enabled: !!universityId,
  });

  const filtered = members?.filter(m =>
    m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.username?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search people..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Link to="/community"><Button variant="outline" size="sm">View All</Button></Link>
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No people found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => (
            <Card key={m.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate(`/user/${m.id}`)}>
              <CardContent className="p-4 flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={m.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {m.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate flex items-center gap-1">
                    {m.full_name || "Anonymous"}
                    {m.is_verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                  </p>
                  {m.username && <p className="text-xs text-muted-foreground">@{m.username}</p>}
                  {m.branch && <p className="text-xs text-muted-foreground">{m.branch} • {m.year_of_study || ""}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const demoJobsInline = [
  { id: "1", title: "Frontend Developer Intern", company: "TechCorp India", location: "Remote", type: "internship", salary: "₹10K-15K/mo", posted: "2d ago" },
  { id: "2", title: "Campus Ambassador", company: "Sympan", location: "LPU Campus", type: "campus", salary: "₹5K/mo + Perks", posted: "1d ago" },
  { id: "3", title: "Content Writer", company: "EduBlogs", location: "Remote", type: "freelance", salary: "₹500-1.5K/article", posted: "3d ago" },
  { id: "4", title: "Data Analyst", company: "Analytics Hub", location: "Bangalore", type: "full-time", salary: "₹4-6 LPA", posted: "5d ago" },
  { id: "5", title: "Social Media Manager", company: "BrandBoost", location: "Remote", type: "part-time", salary: "₹8-12K/mo", posted: "1w ago" },
];

const JobsTabContent = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Latest opportunities</p>
        <Link to="/jobs"><Button variant="outline" size="sm">View All Jobs</Button></Link>
      </div>
      <div className="space-y-3">
        {demoJobsInline.map(job => (
          <Card key={job.id} className="hover:border-primary/30 transition-colors">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold truncate">{job.title}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{job.company}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                  <span>{job.salary}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.posted}</span>
                </div>
              </div>
              <Badge variant="outline" className="text-xs capitalize shrink-0">{job.type}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UniversityDashboard;
