import { useState } from "react";
import { Link } from "react-router-dom";
import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import { 
  BookOpen, 
  Calendar, 
  User, 
  ArrowRight, 
  Search,
  Tag
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const categories = [
  "All",
  "Student Life",
  "Housing",
  "Academics",
  "Career",
  "Sympan Updates"
];

const blogPosts = [
  {
    id: "1",
    slug: "ultimate-guide-finding-pg-near-campus",
    title: "The Ultimate Guide to Finding a PG Near Campus",
    excerpt: "Everything you need to know about finding safe, affordable accommodation near your university. From verification to negotiations.",
    category: "Housing",
    author: "Sympan Team",
    date: "December 20, 2024",
    readTime: "5 min read",
    featured: true
  },
  {
    id: "2",
    slug: "how-to-avoid-rental-scams",
    title: "How to Avoid Rental Scams: A Student's Guide",
    excerpt: "Learn the red flags to watch for and how Sympan helps you find verified, scam-free housing options.",
    category: "Housing",
    author: "Sympan Team",
    date: "December 18, 2024",
    readTime: "4 min read",
    featured: false
  },
  {
    id: "3",
    slug: "exam-preparation-tips-toppers",
    title: "Exam Preparation Tips from University Toppers",
    excerpt: "We interviewed top performers across universities. Here are their secrets to effective exam preparation.",
    category: "Academics",
    author: "Sympan Team",
    date: "December 15, 2024",
    readTime: "7 min read",
    featured: false
  },
  {
    id: "4",
    slug: "building-professional-network-university",
    title: "Building Your Professional Network While in University",
    excerpt: "Start networking early. Learn how to connect with alumni, seniors, and industry professionals effectively.",
    category: "Career",
    author: "Sympan Team",
    date: "December 12, 2024",
    readTime: "6 min read",
    featured: false
  },
  {
    id: "5",
    slug: "welcome-to-sympan",
    title: "Welcome to Sympan: Our Vision for Campus Communities",
    excerpt: "Introducing Sympan — the trusted platform for verified university students. Learn about our mission and features.",
    category: "Sympan Updates",
    author: "Founders",
    date: "December 10, 2024",
    readTime: "3 min read",
    featured: true
  },
  {
    id: "6",
    slug: "managing-finances-as-student",
    title: "Managing Your Finances as a University Student",
    excerpt: "Practical tips for budgeting, saving, and making the most of your limited student income.",
    category: "Student Life",
    author: "Sympan Team",
    date: "December 8, 2024",
    readTime: "5 min read",
    featured: false
  }
];

const BlogPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || post.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPost = blogPosts.find(post => post.featured);

  return (
    <PublicPageLayout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Sympan Blog</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tips, guides, and insights for university life. From housing to careers, 
            we've got you covered.
          </p>
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <div className="max-w-4xl mx-auto mb-12">
            <Link 
              to={`/blog/${featuredPost.slug}`}
              className="block bg-gradient-to-r from-universe-blue/20 to-universe-purple/20 border border-border rounded-xl p-8 hover:border-primary/50 transition-colors group"
            >
              <Badge className="mb-4 bg-primary/20 text-primary border-0">Featured</Badge>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                {featuredPost.title}
              </h2>
              <p className="text-muted-foreground mb-6">{featuredPost.excerpt}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {featuredPost.author}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {featuredPost.date}
                </span>
                <span>{featuredPost.readTime}</span>
              </div>
            </Link>
          </div>
        )}

        {/* Search & Filter */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                    activeCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Blog Grid */}
        <div className="max-w-4xl mx-auto">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No articles found matching your search.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-primary" />
                    <span className="text-sm text-primary">{post.category}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{post.date}</span>
                    <span>{post.readTime}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Newsletter CTA */}
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <div className="bg-card border border-border rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-3">Stay Updated</h2>
            <p className="text-muted-foreground mb-6">
              Get the latest tips and updates delivered to your inbox.
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <Input placeholder="Enter your email" className="flex-1" />
              <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </PublicPageLayout>
  );
};

export default BlogPage;
