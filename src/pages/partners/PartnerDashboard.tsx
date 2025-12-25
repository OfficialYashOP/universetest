import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Briefcase, 
  Home, 
  Building2,
  Plus,
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  Loader2,
  MapPin,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

interface Partner {
  id: string;
  business_name: string;
  category: string;
  phone: string;
  address: string | null;
  status: string;
  created_at: string;
}

interface HousingListing {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  status: string;
  created_at: string;
}

interface JobListing {
  id: string;
  title: string;
  company: string | null;
  pay: string | null;
  job_type: string | null;
  status: string;
  created_at: string;
}

const PartnerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  
  const [partner, setPartner] = useState<Partner | null>(null);
  const [housingListings, setHousingListings] = useState<HousingListing[]>([]);
  const [jobListings, setJobListings] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [universities, setUniversities] = useState<{ id: string; name: string }[]>([]);

  // Create listing dialog state
  const [showCreateHousing, setShowCreateHousing] = useState(false);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Housing form state
  const [housingForm, setHousingForm] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    address: "",
    room_type: "single",
    gender_preference: "any",
    contact_phone: "",
    university_id: "",
  });

  // Job form state
  const [jobForm, setJobForm] = useState({
    title: "",
    company: "",
    description: "",
    pay: "",
    job_type: "part-time",
    location: "",
    contact_phone: "",
    contact_email: "",
    university_id: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth/partner?mode=login");
      return;
    }

    const fetchPartnerData = async () => {
      // Fetch partner profile
      const { data: partnerData, error: partnerError } = await supabase
        .from("partners")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (partnerError || !partnerData) {
        toast({
          title: "Access Denied",
          description: "You are not registered as a partner.",
          variant: "destructive",
        });
        navigate("/partners");
        return;
      }

      setPartner(partnerData);

      // Fetch housing listings
      const { data: housing } = await supabase
        .from("housing_listings")
        .select("id, title, price, location, status, created_at")
        .eq("partner_id", partnerData.id)
        .eq("is_vendor_listing", true)
        .order("created_at", { ascending: false });

      setHousingListings(housing || []);

      // Fetch job listings
      const { data: jobs } = await supabase
        .from("job_listings")
        .select("id, title, company, pay, job_type, status, created_at")
        .eq("partner_id", partnerData.id)
        .order("created_at", { ascending: false });

      setJobListings(jobs || []);

      // Fetch universities
      const { data: unis } = await supabase
        .from("universities")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      setUniversities(unis || []);
      setLoading(false);
    };

    fetchPartnerData();
  }, [user, navigate, toast]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/partners");
  };

  const handleCreateHousing = async () => {
    if (!partner || partner.status !== "approved") {
      toast({
        title: "Not Approved",
        description: "Your account must be approved to create listings.",
        variant: "destructive",
      });
      return;
    }

    if (!housingForm.title || !housingForm.university_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("housing_listings").insert({
      partner_id: partner.id,
      user_id: user?.id,
      university_id: housingForm.university_id,
      title: housingForm.title,
      description: housingForm.description || null,
      price: housingForm.price ? parseFloat(housingForm.price) : null,
      location: housingForm.location || null,
      address: housingForm.address || null,
      room_type: housingForm.room_type,
      gender_preference: housingForm.gender_preference,
      contact_phone: housingForm.contact_phone || null,
      listing_type: "pg",
      is_vendor_listing: true,
      status: "active",
    });

    setIsSubmitting(false);

    if (error) {
      console.error("Error creating listing:", error);
      toast({
        title: "Error",
        description: "Failed to create listing. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Housing listing created!" });
      setShowCreateHousing(false);
      setHousingForm({
        title: "",
        description: "",
        price: "",
        location: "",
        address: "",
        room_type: "single",
        gender_preference: "any",
        contact_phone: "",
        university_id: "",
      });
      // Refresh listings
      const { data: housing } = await supabase
        .from("housing_listings")
        .select("id, title, price, location, status, created_at")
        .eq("partner_id", partner.id)
        .eq("is_vendor_listing", true)
        .order("created_at", { ascending: false });
      setHousingListings(housing || []);
    }
  };

  const handleCreateJob = async () => {
    if (!partner || partner.status !== "approved") {
      toast({
        title: "Not Approved",
        description: "Your account must be approved to create listings.",
        variant: "destructive",
      });
      return;
    }

    if (!jobForm.title || !jobForm.university_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("job_listings").insert({
      partner_id: partner.id,
      university_id: jobForm.university_id,
      title: jobForm.title,
      company: jobForm.company || null,
      description: jobForm.description || null,
      pay: jobForm.pay || null,
      job_type: jobForm.job_type,
      location: jobForm.location || null,
      contact_phone: jobForm.contact_phone || null,
      contact_email: jobForm.contact_email || null,
      status: "active",
    });

    setIsSubmitting(false);

    if (error) {
      console.error("Error creating job:", error);
      toast({
        title: "Error",
        description: "Failed to create job listing. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Job listing created!" });
      setShowCreateJob(false);
      setJobForm({
        title: "",
        company: "",
        description: "",
        pay: "",
        job_type: "part-time",
        location: "",
        contact_phone: "",
        contact_email: "",
        university_id: "",
      });
      // Refresh listings
      const { data: jobs } = await supabase
        .from("job_listings")
        .select("id, title, company, pay, job_type, status, created_at")
        .eq("partner_id", partner.id)
        .order("created_at", { ascending: false });
      setJobListings(jobs || []);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-500"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-500"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/partners" className="flex items-center gap-2">
            <img src={logo} alt="Sympan" className="h-8 w-8 rounded-lg" />
            <span className="font-bold gradient-text">Sympan Partners</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Partner Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Building2 className="w-6 h-6 text-primary" />
                      {partner?.business_name}
                    </CardTitle>
                    <CardDescription className="capitalize">{partner?.category} Partner</CardDescription>
                  </div>
                  {partner && getStatusBadge(partner.status)}
                </div>
              </CardHeader>
              <CardContent>
                {partner?.status === "pending" && (
                  <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 p-3 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">Your account is pending approval. You cannot create listings until approved.</span>
                  </div>
                )}
                {partner?.status === "rejected" && (
                  <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-3 rounded-lg">
                    <XCircle className="w-5 h-5" />
                    <span className="text-sm">Your application was rejected. Please contact support for more information.</span>
                  </div>
                )}
                {partner?.status === "approved" && (
                  <div className="flex items-center gap-2 text-green-500 bg-green-500/10 p-3 rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm">Your account is approved! You can now create listings.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Listings Tabs */}
          <Tabs defaultValue="housing" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="housing" className="gap-2">
                <Home className="w-4 h-4" />
                Housing ({housingListings.length})
              </TabsTrigger>
              <TabsTrigger value="jobs" className="gap-2">
                <Briefcase className="w-4 h-4" />
                Jobs ({jobListings.length})
              </TabsTrigger>
            </TabsList>

            {/* Housing Tab */}
            <TabsContent value="housing" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Your Housing Listings</h2>
                <Dialog open={showCreateHousing} onOpenChange={setShowCreateHousing}>
                  <DialogTrigger asChild>
                    <Button variant="hero" disabled={partner?.status !== "approved"}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Listing
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Housing Listing</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>University *</Label>
                        <Select value={housingForm.university_id} onValueChange={(v) => setHousingForm(prev => ({ ...prev, university_id: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select university" /></SelectTrigger>
                          <SelectContent>
                            {universities.map(u => (
                              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input 
                          placeholder="e.g., Spacious PG near LPU Gate 1"
                          value={housingForm.title}
                          onChange={(e) => setHousingForm(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea 
                          placeholder="Describe the property..."
                          value={housingForm.description}
                          onChange={(e) => setHousingForm(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Rent (₹/month)</Label>
                          <Input 
                            type="number"
                            placeholder="5000"
                            value={housingForm.price}
                            onChange={(e) => setHousingForm(prev => ({ ...prev, price: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Room Type</Label>
                          <Select value={housingForm.room_type} onValueChange={(v) => setHousingForm(prev => ({ ...prev, room_type: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Single</SelectItem>
                              <SelectItem value="double">Double Sharing</SelectItem>
                              <SelectItem value="triple">Triple Sharing</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input 
                          placeholder="e.g., Near Gate 1"
                          value={housingForm.location}
                          onChange={(e) => setHousingForm(prev => ({ ...prev, location: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Full Address</Label>
                        <Textarea 
                          placeholder="Complete address..."
                          value={housingForm.address}
                          onChange={(e) => setHousingForm(prev => ({ ...prev, address: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Gender Preference</Label>
                          <Select value={housingForm.gender_preference} onValueChange={(v) => setHousingForm(prev => ({ ...prev, gender_preference: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any</SelectItem>
                              <SelectItem value="male">Male Only</SelectItem>
                              <SelectItem value="female">Female Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Contact Phone</Label>
                          <Input 
                            placeholder="+91 98765 43210"
                            value={housingForm.contact_phone}
                            onChange={(e) => setHousingForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                          />
                        </div>
                      </div>
                      <Button 
                        variant="hero" 
                        className="w-full" 
                        onClick={handleCreateHousing}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Listing"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {housingListings.length === 0 ? (
                <Card className="glass-card">
                  <CardContent className="py-12 text-center">
                    <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No housing listings yet.</p>
                    {partner?.status === "approved" && (
                      <Button variant="outline" className="mt-4" onClick={() => setShowCreateHousing(true)}>
                        Create Your First Listing
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {housingListings.map((listing) => (
                    <Card key={listing.id} className="glass-card">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{listing.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              {listing.price && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  ₹{listing.price}/mo
                                </span>
                              )}
                              {listing.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {listing.location}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={listing.status === "active" ? "default" : "secondary"}>
                              {listing.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Jobs Tab */}
            <TabsContent value="jobs" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Your Job Listings</h2>
                <Dialog open={showCreateJob} onOpenChange={setShowCreateJob}>
                  <DialogTrigger asChild>
                    <Button variant="hero" disabled={partner?.status !== "approved"}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Job
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Job Listing</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>University *</Label>
                        <Select value={jobForm.university_id} onValueChange={(v) => setJobForm(prev => ({ ...prev, university_id: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select university" /></SelectTrigger>
                          <SelectContent>
                            {universities.map(u => (
                              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Job Title *</Label>
                        <Input 
                          placeholder="e.g., Part-time Delivery Partner"
                          value={jobForm.title}
                          onChange={(e) => setJobForm(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Company/Business Name</Label>
                        <Input 
                          placeholder="Your company name"
                          value={jobForm.company}
                          onChange={(e) => setJobForm(prev => ({ ...prev, company: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea 
                          placeholder="Job description and requirements..."
                          value={jobForm.description}
                          onChange={(e) => setJobForm(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Pay/Stipend</Label>
                          <Input 
                            placeholder="e.g., ₹5000/month"
                            value={jobForm.pay}
                            onChange={(e) => setJobForm(prev => ({ ...prev, pay: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Job Type</Label>
                          <Select value={jobForm.job_type} onValueChange={(v) => setJobForm(prev => ({ ...prev, job_type: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="part-time">Part-time</SelectItem>
                              <SelectItem value="full-time">Full-time</SelectItem>
                              <SelectItem value="internship">Internship</SelectItem>
                              <SelectItem value="freelance">Freelance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input 
                          placeholder="e.g., Near LPU Campus"
                          value={jobForm.location}
                          onChange={(e) => setJobForm(prev => ({ ...prev, location: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Contact Phone</Label>
                          <Input 
                            placeholder="+91 98765 43210"
                            value={jobForm.contact_phone}
                            onChange={(e) => setJobForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Contact Email</Label>
                          <Input 
                            type="email"
                            placeholder="jobs@company.com"
                            value={jobForm.contact_email}
                            onChange={(e) => setJobForm(prev => ({ ...prev, contact_email: e.target.value }))}
                          />
                        </div>
                      </div>
                      <Button 
                        variant="hero" 
                        className="w-full" 
                        onClick={handleCreateJob}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Job Listing"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {jobListings.length === 0 ? (
                <Card className="glass-card">
                  <CardContent className="py-12 text-center">
                    <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No job listings yet.</p>
                    {partner?.status === "approved" && (
                      <Button variant="outline" className="mt-4" onClick={() => setShowCreateJob(true)}>
                        Post Your First Job
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {jobListings.map((job) => (
                    <Card key={job.id} className="glass-card">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{job.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              {job.company && <span>{job.company}</span>}
                              {job.pay && <span>{job.pay}</span>}
                              {job.job_type && (
                                <Badge variant="outline" className="capitalize">{job.job_type}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={job.status === "active" ? "default" : "secondary"}>
                              {job.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default PartnerDashboard;
