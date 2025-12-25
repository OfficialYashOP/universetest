import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  User, 
  ArrowLeft, 
  Eye, 
  EyeOff,
  Building2,
  BadgeCheck,
  ArrowRight,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

interface University {
  id: string;
  name: string;
  short_name: string | null;
  logo_url: string | null;
  slug: string | null;
}

const ROLES = [
  { value: "student", label: "Student", description: "Currently enrolled" },
  { value: "senior", label: "Senior", description: "Final year student" },
  { value: "alumni", label: "Alumni", description: "Graduated" },
  { value: "staff", label: "Staff", description: "Faculty/Staff" },
] as const;

const StudentAuthPage = () => {
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
  const [universityId, setUniversityId] = useState("");
  const [role, setRole] = useState("");
  
  // Universities
  const [universities, setUniversities] = useState<University[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);

  // Redirect if already logged in
  useEffect(() => {
    const redirectUser = async () => {
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("university_id")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profileData?.university_id) {
          const { data: uniData } = await supabase
            .from("universities")
            .select("slug")
            .eq("id", profileData.university_id)
            .maybeSingle();
          
          const slug = uniData?.slug || "lpu";
          navigate(`/app/university/${slug}`, { replace: true });
        } else {
          navigate("/select-university", { replace: true });
        }
      }
    };
    
    redirectUser();
  }, [user, navigate]);

  // Fetch universities
  useEffect(() => {
    const fetchUniversities = async () => {
      const { data, error } = await supabase
        .from("universities")
        .select("id, name, short_name, logo_url, slug")
        .eq("is_active", true)
        .order("name");
      
      if (error) {
        console.error("Error fetching universities:", error);
        toast({
          title: "Error",
          description: "Failed to load universities. Please refresh.",
          variant: "destructive",
        });
      } else {
        setUniversities(data || []);
      }
      setLoadingUniversities(false);
    };
    
    fetchUniversities();
  }, [toast]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast({ title: "Error", description: "Please enter your full name.", variant: "destructive" });
      return;
    }
    if (!universityId) {
      toast({ title: "Error", description: "Please select your university.", variant: "destructive" });
      return;
    }
    if (!role) {
      toast({ title: "Error", description: "Please select your role.", variant: "destructive" });
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
    
    const { error } = await signUp(email, password, {
      full_name: fullName.trim(),
      university_id: universityId,
      role: role,
    });
    
    setIsLoading(false);
    
    if (error) {
      let message = error.message;
      if (message.includes("already registered")) {
        message = "This email is already registered. Please sign in instead.";
      }
      toast({ title: "Sign Up Failed", description: message, variant: "destructive" });
    } else {
      const selectedUni = universities.find(u => u.id === universityId);
      const slug = selectedUni?.slug || "lpu";
      
      toast({ 
        title: "Welcome to UniVerse!", 
        description: "Your account has been created successfully.",
      });
      navigate(`/app/university/${slug}`, { replace: true });
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
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!universityId) {
        toast({ title: "Error", description: "Please select your university.", variant: "destructive" });
        return;
      }
      if (!fullName.trim()) {
        toast({ title: "Error", description: "Please enter your full name.", variant: "destructive" });
        return;
      }
      if (!role) {
        toast({ title: "Error", description: "Please select your role.", variant: "destructive" });
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
    setUniversityId("");
    setRole("");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <Link 
            to="/auth" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Auth Options
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <img src={logo} alt="UniVerse" className="h-12 w-12 rounded-xl" />
            <div>
              <span className="text-2xl font-bold gradient-text">UniVerse</span>
              <p className="text-xs text-muted-foreground">Student Community</p>
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
                  ? step === 1 ? "Join Your Campus" : "Almost There!"
                  : "Welcome Back"
                }
              </h1>
              <p className="text-muted-foreground mb-8">
                {isSignUp 
                  ? step === 1 
                    ? "Tell us about yourself" 
                    : "Create your account credentials"
                  : "Sign in to access your campus community"
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
                  {/* University Selection */}
                  <div className="space-y-2">
                    <Label>Select Your University</Label>
                    {loadingUniversities ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                        {universities.map((uni) => (
                          <button
                            key={uni.id}
                            type="button"
                            onClick={() => setUniversityId(uni.id)}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                              universityId === uni.id
                                ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                                : "border-border hover:border-primary/50 hover:bg-muted"
                            }`}
                          >
                            <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center overflow-hidden p-1 flex-shrink-0">
                              {uni.logo_url ? (
                                <img src={uni.logo_url} alt={uni.name} className="w-full h-full object-contain" />
                              ) : (
                                <Building2 className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="block text-sm font-medium truncate">{uni.short_name || uni.name}</span>
                              <span className="block text-xs text-muted-foreground truncate">{uni.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    <Link to="/request-university" className="text-xs text-primary hover:underline">
                      Don't see your university? Request it
                    </Link>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-12 pl-10"
                      />
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-2">
                    <Label>I am a...</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {ROLES.map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setRole(r.value)}
                          className={`p-3 rounded-lg border transition-all text-left ${
                            role === r.value
                              ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                              : "border-border hover:border-primary/50 hover:bg-muted"
                          }`}
                        >
                          <span className="block text-sm font-medium">{r.label}</span>
                          <span className="block text-xs text-muted-foreground">{r.description}</span>
                        </button>
                      ))}
                    </div>
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
                    Back to details
                  </button>

                  <div className="space-y-2">
                    <Label htmlFor="email">University Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="yourname@university.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3 text-accent" />
                      Use your official university email for verification
                    </p>
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
                    <p className="text-xs text-muted-foreground">At least 6 characters</p>
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
                        <GraduationCap className="mr-2" />
                        Create Account
                      </>
                    )}
                  </Button>
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
                        <GraduationCap className="mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                </>
              )}
            </motion.form>
          </AnimatePresence>

          <p className="text-center text-muted-foreground mt-6">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={toggleMode}
              className="text-primary hover:underline font-medium"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
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
          <motion.img
            src={logo}
            alt="UniVerse"
            className="w-32 h-32 rounded-3xl shadow-glow mb-8"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />
          <h2 className="text-3xl font-bold mb-4">
            The Digital Campus for
            <span className="block gradient-text">Verified Students</span>
          </h2>
          <p className="text-muted-foreground max-w-sm">
            Connect with your campus community, find housing, discover services, 
            and build lifelong connections.
          </p>

          <div className="mt-12 space-y-4 text-left">
            {[
              "University-verified community",
              "Secure & scam-free platform",
              "Housing & roommate finder",
              "Academic resources sharing"
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

export default StudentAuthPage;
