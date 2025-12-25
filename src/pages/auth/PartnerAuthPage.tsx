import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, 
  Mail, 
  Lock, 
  User, 
  ArrowLeft, 
  Eye, 
  EyeOff,
  Building2,
  Phone,
  MapPin,
  ArrowRight,
  Loader2,
  Upload,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

interface University {
  id: string;
  name: string;
  short_name: string | null;
}

const PARTNER_CATEGORIES = [
  { value: "housing", label: "Housing Provider", description: "PG, Hostels, Flats" },
  { value: "jobs", label: "Job Poster", description: "Part-time, Internships" },
  { value: "restaurant", label: "Restaurant/Cafe", description: "Food & Beverages" },
  { value: "laundry", label: "Laundry Service", description: "Cleaning Services" },
  { value: "other", label: "Other Services", description: "Other local services" },
] as const;

const PartnerAuthPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signUp, signIn } = useAuth();
  
  const mode = searchParams.get("mode");
  const [isSignUp, setIsSignUp] = useState(mode !== "login");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  
  // Universities
  const [universities, setUniversities] = useState<University[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);

  // Check if already logged in as partner
  useEffect(() => {
    const checkPartnerStatus = async () => {
      if (user) {
        const { data: partnerData } = await supabase
          .from("partners")
          .select("id, status")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (partnerData) {
          navigate("/partners/dashboard", { replace: true });
        }
      }
    };
    
    checkPartnerStatus();
  }, [user, navigate]);

  // Fetch universities
  useEffect(() => {
    const fetchUniversities = async () => {
      const { data, error } = await supabase
        .from("universities")
        .select("id, name, short_name")
        .eq("is_active", true)
        .order("name");
      
      if (error) {
        console.error("Error fetching universities:", error);
      } else {
        setUniversities(data || []);
      }
      setLoadingUniversities(false);
    };
    
    fetchUniversities();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!businessName.trim()) {
      toast({ title: "Error", description: "Please enter your business name.", variant: "destructive" });
      return;
    }
    if (!category) {
      toast({ title: "Error", description: "Please select your business category.", variant: "destructive" });
      return;
    }
    if (!phone.trim()) {
      toast({ title: "Error", description: "Please enter your phone number.", variant: "destructive" });
      return;
    }
    if (!email.trim()) {
      toast({ title: "Error", description: "Please enter your email.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    
    // First create the auth user
    const { error: authError } = await signUp(email, password, {
      full_name: fullName.trim() || businessName.trim(),
      university_id: selectedUniversities[0] || "", // Partners may not have a university
      role: "partner_vendor",
    });
    
    if (authError) {
      setIsLoading(false);
      let message = authError.message;
      if (message.includes("already registered")) {
        message = "This email is already registered. Please sign in instead.";
      }
      toast({ title: "Sign Up Failed", description: message, variant: "destructive" });
      return;
    }

    // Wait for auth to complete and get user
    const { data: { user: newUser } } = await supabase.auth.getUser();
    
    if (!newUser) {
      setIsLoading(false);
      toast({ title: "Error", description: "Failed to create account.", variant: "destructive" });
      return;
    }

    // Upload document if provided
    let documentUrl = null;
    if (documentFile) {
      const fileExt = documentFile.name.split('.').pop();
      const filePath = `${newUser.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("verification-documents")
        .upload(filePath, documentFile);
      
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("verification-documents")
          .getPublicUrl(filePath);
        documentUrl = urlData.publicUrl;
      }
    }

    // Create partner profile
    const { error: partnerError } = await supabase
      .from("partners")
      .insert({
        user_id: newUser.id,
        business_name: businessName.trim(),
        category: category,
        phone: phone.trim(),
        address: address.trim() || null,
        document_url: documentUrl,
        serving_university_ids: selectedUniversities,
        status: "pending",
      });
    
    setIsLoading(false);
    
    if (partnerError) {
      console.error("Partner creation error:", partnerError);
      toast({ title: "Error", description: "Failed to create partner profile.", variant: "destructive" });
    } else {
      toast({ 
        title: "Welcome to UniVerse Partners!", 
        description: "Your application is pending approval. We'll notify you once approved.",
      });
      navigate("/partners/dashboard", { replace: true });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({ title: "Error", description: "Please enter your email.", variant: "destructive" });
      return;
    }
    if (!password) {
      toast({ title: "Error", description: "Please enter your password.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    setIsLoading(false);
    
    if (error) {
      let message = error.message;
      if (message.includes("Invalid login credentials")) {
        message = "Invalid email or password. Please try again.";
      }
      toast({ title: "Sign In Failed", description: message, variant: "destructive" });
    } else {
      toast({ title: "Welcome back!", description: "You have been signed in successfully." });
      // Check if user is a partner and redirect accordingly
      const { data: { user: loggedUser } } = await supabase.auth.getUser();
      if (loggedUser) {
        const { data: partnerData } = await supabase
          .from("partners")
          .select("id")
          .eq("user_id", loggedUser.id)
          .maybeSingle();
        
        if (partnerData) {
          navigate("/partners/dashboard", { replace: true });
        } else {
          toast({ title: "Not a Partner", description: "This account is not registered as a partner.", variant: "destructive" });
          await supabase.auth.signOut();
        }
      }
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!businessName.trim()) {
        toast({ title: "Error", description: "Please enter your business name.", variant: "destructive" });
        return;
      }
      if (!category) {
        toast({ title: "Error", description: "Please select your business category.", variant: "destructive" });
        return;
      }
      if (!phone.trim()) {
        toast({ title: "Error", description: "Please enter your phone number.", variant: "destructive" });
        return;
      }
    }
    setStep(step + 1);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setStep(1);
    setEmail("");
    setPassword("");
    setFullName("");
    setBusinessName("");
    setCategory("");
    setPhone("");
    setAddress("");
    setDocumentFile(null);
  };

  const toggleUniversity = (uniId: string) => {
    setSelectedUniversities(prev => 
      prev.includes(uniId) 
        ? prev.filter(id => id !== uniId)
        : [...prev, uniId]
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <Link 
            to="/partners" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Partners
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <img src={logo} alt="UniVerse" className="h-12 w-12 rounded-xl" />
            <div>
              <span className="text-2xl font-bold gradient-text">UniVerse</span>
              <p className="text-xs text-muted-foreground">Partners Portal</p>
            </div>
          </div>

          {/* Header */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? `signup-${step}` : "signin"}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-bold mb-2">
                {isSignUp 
                  ? step === 1 ? "Become a Partner" : "Account Details"
                  : "Partner Sign In"
                }
              </h1>
              <p className="text-muted-foreground mb-8">
                {isSignUp 
                  ? step === 1 
                    ? "Tell us about your business" 
                    : "Create your partner account"
                  : "Sign in to manage your listings"
                }
              </p>
              
              {isSignUp && (
                <div className="flex gap-2 mb-6">
                  {[1, 2].map((s) => (
                    <div
                      key={s}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        s <= step ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={`form-${isSignUp}-${step}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
              onSubmit={isSignUp ? handleSignUp : handleSignIn}
            >
              {isSignUp && step === 1 && (
                <>
                  {/* Business Name */}
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="businessName"
                        type="text"
                        placeholder="Enter your business name"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="h-12 pl-10"
                      />
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-2">
                    <Label>Business Category</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {PARTNER_CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategory(cat.value)}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                            category === cat.value
                              ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                              : "border-border hover:border-primary/50 hover:bg-muted"
                          }`}
                        >
                          <div>
                            <span className="block text-sm font-medium">{cat.label}</span>
                            <span className="block text-xs text-muted-foreground">{cat.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-12 pl-10"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address">Business Address (Optional)</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                      <Textarea
                        id="address"
                        placeholder="Enter your business address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="pl-10 min-h-[80px]"
                      />
                    </div>
                  </div>

                  {/* Universities */}
                  <div className="space-y-2">
                    <Label>Universities You Serve (Optional)</Label>
                    {loadingUniversities ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {universities.map((uni) => (
                          <button
                            key={uni.id}
                            type="button"
                            onClick={() => toggleUniversity(uni.id)}
                            className={`p-2 rounded-lg border transition-all text-left text-xs ${
                              selectedUniversities.includes(uni.id)
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {uni.short_name || uni.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button 
                    type="button" 
                    variant="hero" 
                    size="lg" 
                    className="w-full"
                    onClick={handleNextStep}
                  >
                    Continue
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </>
              )}

              {isSignUp && step === 2 && (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to business details
                  </button>

                  {/* Contact Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Contact Person Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Your name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-12 pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="business@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Document Upload */}
                  <div className="space-y-2">
                    <Label>Business Document (Optional)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="document-upload"
                      />
                      <label htmlFor="document-upload" className="cursor-pointer">
                        {documentFile ? (
                          <div className="flex items-center justify-center gap-2 text-primary">
                            <FileText className="w-5 h-5" />
                            <span className="text-sm">{documentFile.name}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Upload className="w-8 h-8" />
                            <span className="text-sm">Upload business registration or ID</span>
                            <span className="text-xs">PDF, JPG, PNG (Max 5MB)</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    variant="hero" 
                    size="lg" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Briefcase className="mr-2" />
                        Create Partner Account
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By signing up, you agree to our Terms of Service and Privacy Policy.
                    Your account will be reviewed before you can post listings.
                  </p>
                </>
              )}

              {!isSignUp && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    variant="hero" 
                    size="lg" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Briefcase className="mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                </>
              )}
            </motion.form>
          </AnimatePresence>

          <p className="text-center text-muted-foreground mt-6">
            {isSignUp ? "Already have a partner account?" : "New partner?"}{" "}
            <button
              onClick={toggleMode}
              className="text-primary hover:underline font-medium"
            >
              {isSignUp ? "Sign In" : "Register Now"}
            </button>
          </p>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-universe-purple/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-universe-blue/30 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
        
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center">
          <motion.div
            className="w-32 h-32 rounded-3xl shadow-glow mb-8 bg-gradient-to-br from-primary to-secondary flex items-center justify-center"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <Briefcase className="w-16 h-16 text-primary-foreground" />
          </motion.div>
          <h2 className="text-3xl font-bold mb-4">
            Grow Your Business with
            <span className="block gradient-text">UniVerse Partners</span>
          </h2>
          <p className="text-muted-foreground max-w-sm">
            Reach verified university students. Post housing, jobs, 
            and local services to a trusted community.
          </p>

          <div className="mt-12 space-y-4 text-left">
            {[
              "Reach verified students",
              "Post housing & PG listings",
              "Advertise local services",
              "Post job opportunities"
            ].map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-muted-foreground">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerAuthPage;
