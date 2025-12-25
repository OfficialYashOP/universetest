import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Book, 
  FileText, 
  Package,
  Plus,
  Search,
  Filter,
  MapPin,
  User,
  MessageCircle,
  Loader2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

interface MarketplacePost {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  category: string;
  condition: string | null;
  images: string[] | null;
  status: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

const CATEGORIES = [
  { value: "books", label: "Books", icon: Book },
  { value: "notes", label: "Notes & Study Material", icon: FileText },
  { value: "items", label: "Used Items", icon: Package },
];

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like-new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

const MarketplacePage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [posts, setPosts] = useState<MarketplacePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userUniversityId, setUserUniversityId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "books",
    condition: "good",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Get user's university
      const { data: profile } = await supabase
        .from("profiles")
        .select("university_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.university_id) {
        setUserUniversityId(profile.university_id);

        // Fetch marketplace posts
        const { data: postsData, error } = await supabase
          .from("marketplace_posts")
          .select("*")
          .eq("university_id", profile.university_id)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching posts:", error);
        } else if (postsData) {
          // Fetch user profiles separately
          const userIds = [...new Set(postsData.map(p => p.user_id))];
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", userIds);

          const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
          
          const postsWithProfiles = postsData.map(post => ({
            ...post,
            profiles: profilesMap.get(post.user_id) || { full_name: null, avatar_url: null }
          }));
          
          setPosts(postsWithProfiles as MarketplacePost[]);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast({ title: "Error", description: "Please enter a title.", variant: "destructive" });
      return;
    }
    if (!userUniversityId) {
      toast({ title: "Error", description: "University not found.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from("marketplace_posts")
      .insert({
        user_id: user?.id,
        university_id: userUniversityId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        price: form.price ? parseFloat(form.price) : null,
        category: form.category,
        condition: form.condition,
        status: "active",
      })
      .select("*")
      .single();

    setIsSubmitting(false);

    if (error) {
      console.error("Error creating post:", error);
      toast({ title: "Error", description: "Failed to create post.", variant: "destructive" });
    } else {
      // Get user profile for the new post
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user?.id || "")
        .maybeSingle();
      
      const newPost = {
        ...data,
        profiles: profileData || { full_name: null, avatar_url: null }
      } as MarketplacePost;
      
      toast({ title: "Success", description: "Your item has been listed!" });
      setPosts([newPost, ...posts]);
      setShowCreateDialog(false);
      setForm({ title: "", description: "", price: "", category: "books", condition: "good" });
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = activeCategory === "all" || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat?.icon || Package;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Marketplace</h1>
            <p className="text-muted-foreground">Buy and sell books, notes, and used items</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="w-4 h-4 mr-2" />
                Sell Something
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>List an Item for Sale</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, category: cat.value }))}
                        className={`p-3 rounded-lg border transition-all text-center ${
                          form.category === cat.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <cat.icon className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-xs">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    placeholder="e.g., Engineering Mathematics Textbook"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the item, its condition, and why you're selling..."
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0 for free"
                      value={form.price}
                      onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select value={form.condition} onValueChange={(v) => setForm(prev => ({ ...prev, condition: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CONDITIONS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  variant="hero"
                  className="w-full"
                  onClick={handleCreate}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "List Item"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList>
            <TabsTrigger value="all">All Items</TabsTrigger>
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value} className="gap-2">
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? "No items match your search." : "No items listed yet."}
                  </p>
                  <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
                    Be the first to list something
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPosts.map((post, index) => {
                  const Icon = getCategoryIcon(post.category);
                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="glass-card hover:border-primary/50 transition-colors overflow-hidden">
                        {/* Image placeholder */}
                        <div className="aspect-video bg-muted flex items-center justify-center">
                          <Icon className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold line-clamp-2">{post.title}</h3>
                            {post.price !== null && (
                              <span className="text-lg font-bold text-primary whitespace-nowrap">
                                {post.price === 0 ? "Free" : `₹${post.price}`}
                              </span>
                            )}
                          </div>
                          {post.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {post.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="capitalize">
                                {post.category}
                              </Badge>
                              {post.condition && (
                                <Badge variant="outline" className="capitalize">
                                  {post.condition}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="w-4 h-4" />
                              <span>{post.profiles?.full_name || "Anonymous"}</span>
                            </div>
                            <Button size="sm" variant="ghost">
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Contact
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MarketplacePage;
