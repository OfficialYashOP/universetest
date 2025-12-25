import { useState } from "react";
import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  GraduationCap,
  Users,
  Upload,
  CheckCircle,
  Shield,
  Clock,
  Loader2,
  HelpCircle
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ROLES = [
  { value: "student", label: "Current Student" },
  { value: "alumni", label: "Alumni" },
  { value: "staff", label: "Faculty/Staff" },
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh"
];

const FAQ_ITEMS = [
  {
    question: "How long does it take to add a university?",
    answer: "It typically takes 2-4 weeks to onboard a new university, depending on verification requirements and community interest. Universities with more requests are prioritized."
  },
  {
    question: "Will I get notified when my university is added?",
    answer: "Yes! We'll email you at the address you provide as soon as your university goes live on Sympan."
  },
  {
    question: "Do you need official university approval?",
    answer: "We work independently to verify users through student IDs and university emails. Official partnerships are welcome but not required for launch."
  },
  {
    question: "What makes Sympan different from other platforms?",
    answer: "Sympan is exclusively for verified university members. Every user goes through verification, ensuring a scam-free, trusted community."
  }
];

const RequestUniversityPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    university_name: "",
    city: "",
    state: "",
    country: "India",
    role: "",
    department: "",
    interest_count: "",
    reason: "",
  });
  
  const [consents, setConsents] = useState({
    accurate: false,
    contact: false,
  });
  
  const [proofFile, setProofFile] = useState<File | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Error", description: "File must be less than 5MB", variant: "destructive" });
        return;
      }
      setProofFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.university_name.trim() ||
        !formData.city.trim() || !formData.state || !formData.role) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    
    if (!consents.accurate || !consents.contact) {
      toast({ title: "Error", description: "Please accept both consent checkboxes", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let proofUrl = null;
      
      // Upload proof file if provided
      if (proofFile) {
        const fileName = `${Date.now()}-${proofFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("request-proofs")
          .upload(fileName, proofFile);
        
        if (uploadError) {
          console.error("Upload error:", uploadError);
        } else {
          proofUrl = uploadData.path;
        }
      }
      
      // Insert request - using type assertion since types haven't regenerated yet
      const { error } = await supabase
        .from("university_requests" as any)
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          university_name: formData.university_name.trim(),
          city: formData.city.trim(),
          state: formData.state,
          country: formData.country,
          role: formData.role,
          department: formData.department.trim() || null,
          interest_count: formData.interest_count || null,
          reason: formData.reason.trim() || null,
          proof_file_url: proofUrl,
        });
      
      if (error) throw error;
      
      setIsSubmitted(true);
      toast({ title: "Request Submitted!", description: "We'll be in touch soon." });
      
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({ title: "Error", description: "Failed to submit request. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <PublicPageLayout>
        <div className="min-h-[70vh] flex items-center justify-center py-20">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
            <p className="text-muted-foreground mb-6">
              Your request has been received. We'll email you updates when onboarding starts for your university.
            </p>
            <Button variant="outline" onClick={() => window.location.href = "/"}>
              Back to Home
            </Button>
          </div>
        </div>
      </PublicPageLayout>
    );
  }

  return (
    <PublicPageLayout>
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-50" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-universe-purple/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Building2 className="w-5 h-5" />
              <span className="font-medium">University Request</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Don't See Your <span className="gradient-text">University</span>?
            </h1>
            <p className="text-lg text-muted-foreground mb-2">
              Request it here — we'll prioritize universities with the most demand.
            </p>
            <p className="text-sm text-muted-foreground">
              Only verified university communities are onboarded.
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Your Information
                </h2>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="you@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+91 1234567890"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>I am a... *</Label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleInputChange("role", e.target.value)}
                      className="w-full h-10 px-3 rounded-md bg-muted border border-border text-foreground"
                      required
                    >
                      <option value="">Select your role</option>
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* University Information */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  University Information
                </h2>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="university_name">University Name *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="university_name"
                        value={formData.university_name}
                        onChange={(e) => handleInputChange("university_name", e.target.value)}
                        placeholder="Enter full university name"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        placeholder="University city"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <select
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                      className="w-full h-10 px-3 rounded-md bg-muted border border-border text-foreground"
                      required
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Course/Department (Optional)</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange("department", e.target.value)}
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interest_count">Approx. Students Interested (Optional)</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="interest_count"
                        value={formData.interest_count}
                        onChange={(e) => handleInputChange("interest_count", e.target.value)}
                        placeholder="e.g., 50+"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reason">Why do you want Sympan at your university? (Optional)</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => handleInputChange("reason", e.target.value)}
                    placeholder="Tell us about your community needs..."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Upload Proof (Optional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Student ID card or university email screenshot helps prioritize your request.
                  </p>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-muted hover:bg-muted/80 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">{proofFile ? proofFile.name : "Choose file"}</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    {proofFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setProofFile(null)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Consent */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="accurate"
                    checked={consents.accurate}
                    onCheckedChange={(checked) => setConsents(prev => ({ ...prev, accurate: !!checked }))}
                  />
                  <Label htmlFor="accurate" className="text-sm text-muted-foreground cursor-pointer">
                    I confirm the information provided is accurate to the best of my knowledge.
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="contact"
                    checked={consents.contact}
                    onCheckedChange={(checked) => setConsents(prev => ({ ...prev, contact: !!checked }))}
                  />
                  <Label htmlFor="contact" className="text-sm text-muted-foreground cursor-pointer">
                    I agree to be contacted by Sympan regarding my university request.
                  </Label>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Building2 className="mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Why Sympan is Different</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-xl p-5 text-center">
                <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Verified Only</h3>
                <p className="text-sm text-muted-foreground">Every user is verified to prevent scams</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Trusted Community</h3>
                <p className="text-sm text-muted-foreground">Connect with real university members</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 text-center">
                <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Demand-Based</h3>
                <p className="text-sm text-muted-foreground">High-demand universities are prioritized</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6 text-primary" />
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {FAQ_ITEMS.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="bg-card border border-border rounded-lg px-4">
                  <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default RequestUniversityPage;
