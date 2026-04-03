import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Briefcase, Search, MapPin, Clock, IndianRupee, Plus, Building2, 
  GraduationCap, Loader2, ExternalLink 
} from "lucide-react";

const jobTypes = [
  { value: "all", label: "All Jobs" },
  { value: "internship", label: "Internship" },
  { value: "part-time", label: "Part-Time" },
  { value: "full-time", label: "Full-Time" },
  { value: "freelance", label: "Freelance" },
  { value: "campus", label: "On-Campus" },
];

// Demo jobs data (stored in-memory since we don't have a jobs table yet)
const demoJobs = [
  {
    id: "1",
    title: "Frontend Developer Intern",
    company: "TechCorp India",
    location: "Remote",
    type: "internship",
    salary: "₹10,000 - ₹15,000/mo",
    description: "Looking for a passionate frontend developer intern to work on React-based projects. Must have good understanding of HTML, CSS, JavaScript and React.",
    requirements: ["React.js", "HTML/CSS", "JavaScript", "Git"],
    posted_at: "2 days ago",
    apply_link: "#",
  },
  {
    id: "2",
    title: "Campus Ambassador",
    company: "Sympan",
    location: "LPU Campus",
    type: "campus",
    salary: "₹5,000/mo + Perks",
    description: "Represent Sympan on your campus. Organize events, spread awareness, and help grow the community. Great opportunity for networking!",
    requirements: ["Communication Skills", "Social Media", "Event Management"],
    posted_at: "1 day ago",
    apply_link: "#",
  },
  {
    id: "3",
    title: "Content Writer",
    company: "EduBlogs",
    location: "Remote",
    type: "freelance",
    salary: "₹500-₹1,500/article",
    description: "Write engaging articles on education, technology, and student life. Flexible timings and work from anywhere.",
    requirements: ["English Proficiency", "SEO Knowledge", "Creative Writing"],
    posted_at: "3 days ago",
    apply_link: "#",
  },
  {
    id: "4",
    title: "Data Analyst",
    company: "Analytics Hub",
    location: "Bangalore",
    type: "full-time",
    salary: "₹4,00,000 - ₹6,00,000/yr",
    description: "Analyze large datasets to derive actionable insights. Experience with Python, SQL, and data visualization tools required.",
    requirements: ["Python", "SQL", "Tableau/PowerBI", "Statistics"],
    posted_at: "5 days ago",
    apply_link: "#",
  },
  {
    id: "5",
    title: "Social Media Manager",
    company: "BrandBoost",
    location: "Remote",
    type: "part-time",
    salary: "₹8,000 - ₹12,000/mo",
    description: "Manage social media accounts for multiple brands. Create content calendars, design posts, and track engagement metrics.",
    requirements: ["Canva/Figma", "Instagram Marketing", "Analytics"],
    posted_at: "1 week ago",
    apply_link: "#",
  },
  {
    id: "6",
    title: "Android Developer Intern",
    company: "AppWorks",
    location: "Noida",
    type: "internship",
    salary: "₹12,000 - ₹18,000/mo",
    description: "Work on Android apps using Kotlin and Jetpack Compose. You'll be part of a fast-paced team shipping real products.",
    requirements: ["Kotlin", "Android SDK", "Jetpack Compose", "REST APIs"],
    posted_at: "4 days ago",
    apply_link: "#",
  },
  {
    id: "7",
    title: "Teaching Assistant",
    company: "LPU – CSE Department",
    location: "LPU Campus",
    type: "campus",
    salary: "₹3,000/mo",
    description: "Assist professors in labs and tutorials for Data Structures and Algorithms course. Open to 3rd and 4th year CSE students.",
    requirements: ["DSA Knowledge", "C++/Java", "Good Communication"],
    posted_at: "6 days ago",
    apply_link: "#",
  },
  {
    id: "8",
    title: "UI/UX Design Intern",
    company: "DesignStudio",
    location: "Remote",
    type: "internship",
    salary: "₹8,000 - ₹15,000/mo",
    description: "Design beautiful and intuitive user interfaces for mobile and web apps. Must have a portfolio showcasing UI/UX work.",
    requirements: ["Figma", "User Research", "Wireframing", "Prototyping"],
    posted_at: "3 days ago",
    apply_link: "#",
  },
  {
    id: "9",
    title: "Video Editor",
    company: "CreativeMedia",
    location: "Remote",
    type: "freelance",
    salary: "₹2,000 - ₹5,000/video",
    description: "Edit engaging short-form and long-form videos for YouTube and Instagram. Experience with Premiere Pro or DaVinci Resolve required.",
    requirements: ["Premiere Pro", "After Effects", "Color Grading"],
    posted_at: "2 days ago",
    apply_link: "#",
  },
  {
    id: "10",
    title: "ML Research Intern",
    company: "AI Labs India",
    location: "Hyderabad",
    type: "internship",
    salary: "₹20,000 - ₹30,000/mo",
    description: "Work on cutting-edge machine learning research projects. Publish papers and contribute to open-source ML frameworks.",
    requirements: ["Python", "PyTorch/TensorFlow", "NLP/CV", "Research Papers"],
    posted_at: "1 week ago",
    apply_link: "#",
  },
];

const getTypeBadgeColor = (type: string) => {
  switch (type) {
    case "internship": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "part-time": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "full-time": return "bg-green-500/20 text-green-400 border-green-500/30";
    case "freelance": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "campus": return "bg-pink-500/20 text-pink-400 border-pink-500/30";
    default: return "bg-muted text-muted-foreground";
  }
};

const JobsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredJobs = demoJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || job.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" />
              Jobs & Internships
            </h1>
            <p className="text-muted-foreground">
              Find opportunities tailored for students
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs, companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {jobTypes.map(type => (
              <Button
                key={type.value}
                variant={typeFilter === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter(type.value)}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No jobs found</p>
            </div>
          ) : (
            filteredJobs.map(job => (
              <Card key={job.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <Badge variant="outline" className={getTypeBadgeColor(job.type)}>
                          {job.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {job.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <IndianRupee className="w-3.5 h-3.5" />
                          {job.salary}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {job.posted_at}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {job.description}
                      </p>
                      <div className="flex gap-1.5 flex-wrap">
                        {job.requirements.map(req => (
                          <Badge key={req} variant="secondary" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button size="sm" className="shrink-0 gap-1">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobsPage;
