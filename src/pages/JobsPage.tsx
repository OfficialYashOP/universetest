import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Briefcase, 
  Search,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  Phone,
  Mail,
  ExternalLink,
  Loader2,
  BadgeCheck,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

interface JobListing {
  id: string;
  title: string;
  company: string | null;
  description: string | null;
  pay: string | null;
  job_type: string | null;
  location: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  created_at: string;
  partners?: {
    business_name: string;
    status: string;
  };
}

const JOB_TYPES = [
  { value: "all", label: "All Jobs" },
  { value: "part-time", label: "Part-time" },
  { value: "full-time", label: "Full-time" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
];

const JobsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!user) return;

      // Get user's university
      const { data: profile } = await supabase
        .from("profiles")
        .select("university_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.university_id) {
        // Fetch job listings
        const { data: jobsData, error } = await supabase
          .from("job_listings")
          .select("*")
          .eq("university_id", profile.university_id)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching jobs:", error);
        } else if (jobsData) {
          // Fetch partners info separately
          const partnerIds = [...new Set(jobsData.map(j => j.partner_id))];
          const { data: partnersData } = await supabase
            .from("partners")
            .select("id, business_name, status")
            .in("id", partnerIds);

          const partnersMap = new Map(partnersData?.map(p => [p.id, p]) || []);
          
          // Only show jobs from approved partners
          const jobsWithPartners = jobsData
            .filter(job => partnersMap.get(job.partner_id)?.status === "approved")
            .map(job => ({
              ...job,
              partners: partnersMap.get(job.partner_id) || { business_name: "", status: "" }
            }));
          
          setJobs(jobsWithPartners as JobListing[]);
        }
      }
      setLoading(false);
    };

    fetchJobs();
  }, [user]);

  const filteredJobs = jobs.filter((job) => {
    const matchesType = activeType === "all" || job.job_type === activeType;
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.company?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesType && matchesSearch;
  });

  const getJobTypeBadge = (type: string | null) => {
    const colors: Record<string, string> = {
      "part-time": "bg-blue-500/10 text-blue-500",
      "full-time": "bg-green-500/10 text-green-500",
      "internship": "bg-purple-500/10 text-purple-500",
      "freelance": "bg-orange-500/10 text-orange-500",
    };
    return colors[type || ""] || "bg-muted text-muted-foreground";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Jobs & Opportunities</h1>
          <p className="text-muted-foreground">Find part-time jobs, internships, and freelance work near your campus</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs by title, company, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Job Type Tabs */}
        <Tabs value={activeType} onValueChange={setActiveType}>
          <TabsList className="flex-wrap">
            {JOB_TYPES.map((type) => (
              <TabsTrigger key={type.value} value={type.value}>
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeType} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredJobs.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "No jobs match your search." : "No job listings available yet."}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Check back later for new opportunities!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="glass-card hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedJob(job)}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Briefcase className="w-6 h-6 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-lg">{job.title}</h3>
                                  {job.job_type && (
                                    <Badge className={getJobTypeBadge(job.job_type)}>
                                      {job.job_type}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                                  {(job.company || job.partners?.business_name) && (
                                    <span className="flex items-center gap-1">
                                      <Building2 className="w-4 h-4" />
                                      {job.company || job.partners?.business_name}
                                      <BadgeCheck className="w-3 h-3 text-primary" />
                                    </span>
                                  )}
                                  {job.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      {job.location}
                                    </span>
                                  )}
                                  {job.pay && (
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="w-4 h-4" />
                                      {job.pay}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {job.description && (
                              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                                {job.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 md:flex-col md:items-end">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(job.created_at)}
                            </span>
                            <Button size="sm" variant="hero">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Job Details Dialog */}
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="max-w-2xl">
            {selectedJob && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-xl">{selectedJob.title}</DialogTitle>
                    {selectedJob.job_type && (
                      <Badge className={getJobTypeBadge(selectedJob.job_type)}>
                        {selectedJob.job_type}
                      </Badge>
                    )}
                  </div>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Company Info */}
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {selectedJob.company || selectedJob.partners?.business_name}
                        </span>
                        <Badge variant="outline" className="gap-1">
                          <BadgeCheck className="w-3 h-3 text-primary" />
                          Verified Partner
                        </Badge>
                      </div>
                      {selectedJob.location && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {selectedJob.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pay */}
                  {selectedJob.pay && (
                    <div className="flex items-center gap-2 text-lg">
                      <DollarSign className="w-5 h-5 text-primary" />
                      <span className="font-semibold">{selectedJob.pay}</span>
                    </div>
                  )}

                  {/* Description */}
                  {selectedJob.description && (
                    <div>
                      <h4 className="font-semibold mb-2">About this job</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {selectedJob.description}
                      </p>
                    </div>
                  )}

                  {/* Contact */}
                  <div>
                    <h4 className="font-semibold mb-3">Contact Information</h4>
                    <div className="flex flex-wrap gap-3">
                      {selectedJob.contact_phone && (
                        <a href={`tel:${selectedJob.contact_phone}`}>
                          <Button variant="outline" className="gap-2">
                            <Phone className="w-4 h-4" />
                            {selectedJob.contact_phone}
                          </Button>
                        </a>
                      )}
                      {selectedJob.contact_email && (
                        <a href={`mailto:${selectedJob.contact_email}`}>
                          <Button variant="outline" className="gap-2">
                            <Mail className="w-4 h-4" />
                            {selectedJob.contact_email}
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Apply Button */}
                  <div className="flex gap-3 pt-4 border-t border-border">
                    {selectedJob.contact_email && (
                      <a href={`mailto:${selectedJob.contact_email}?subject=Application for ${selectedJob.title}`} className="flex-1">
                        <Button variant="hero" className="w-full gap-2">
                          <Mail className="w-4 h-4" />
                          Apply via Email
                        </Button>
                      </a>
                    )}
                    {selectedJob.contact_phone && (
                      <a href={`tel:${selectedJob.contact_phone}`} className="flex-1">
                        <Button variant="outline" className="w-full gap-2">
                          <Phone className="w-4 h-4" />
                          Call Now
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default JobsPage;
