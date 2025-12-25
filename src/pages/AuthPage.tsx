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
import UniversityLogo from "@/components/university/UniversityLogo";

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

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signUp, signIn } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
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

  // Redirect if already logged in - go to university dashboard
  useEffect(() => {
    const redirectUser = async () => {
      if (user) {
        // Fetch user's university to get slug
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
          console.log("[AuthPage] User logged in, redirecting to:", `/app/university/${slug}`);
          navigate(`/app/university/${slug}`, { replace: true });
        } else {
          console.log("[AuthPage] User has no university, redirecting to select");
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
      // Find the selected university's slug
      const selectedUni = universities.find(u => u.id === universityId);
      const slug = selectedUni?.slug || "lpu";
      
      toast({ 
        title: "Welcome to Sympan!", 
        description: "Your account has been created successfully.",
      });
      console.log("[AuthPage] Sign up success, redirecting to:", `/app/university/${slug}`);
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
      // Redirect will happen via the useEffect when user state updates
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <img src={logo} alt="Sympan" className="h-12 w-12 rounded-xl" />
          <span className="text-2xl font-bold gradient-text">Sympan</span>
        </div>

        <h1 className="text-3xl font-bold mb-2">Welcome to Sympan</h1>
        <p className="text-muted-foreground mb-8">Choose how you want to continue</p>

        <div className="space-y-4">
          {/* Student Option */}
          <Link to="/auth/student" className="block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass-card p-6 border border-border hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">I'm a Student</h3>
                  <p className="text-sm text-muted-foreground">Students, Seniors, Alumni, Staff</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </motion.div>
          </Link>

          {/* Partner Option */}
          <Link to="/partners" className="block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass-card p-6 border border-border hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">I'm a Vendor / Poster</h3>
                  <p className="text-sm text-muted-foreground">Housing, Jobs, Local Services</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </motion.div>
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          By continuing, you agree to our{" "}
          <Link to="/terms" className="text-primary hover:underline">Terms</Link> and{" "}
          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
