import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  User, 
  ArrowLeft, 
  Eye, 
  EyeOff,
  Building2,
  BadgeCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12">
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
            <img src={logo} alt="UniVerse" className="h-12 w-12 rounded-xl" />
            <span className="text-2xl font-bold gradient-text">UniVerse</span>
          </div>

          {/* Header */}
          <motion.div
            key={isSignUp ? "signup" : "signin"}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold mb-2">
              {isSignUp ? "Join Your Campus" : "Welcome Back"}
            </h1>
            <p className="text-muted-foreground mb-8">
              {isSignUp 
                ? "Create your verified student account" 
                : "Sign in to access your campus community"
              }
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            key={`form-${isSignUp}-${step}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
            onSubmit={(e) => e.preventDefault()}
          >
            {isSignUp && step === 1 && (
              <>
                {/* University Selection */}
                <div className="space-y-2">
                  <Label htmlFor="university">Select Your University</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <select
                      id="university"
                      className="w-full h-12 pl-10 pr-4 rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                    >
                      <option value="">Choose university...</option>
                      <option value="lpu">Lovely Professional University (LPU)</option>
                      <option value="other">Other (Coming Soon)</option>
                    </select>
                  </div>
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
                      className="h-12 pl-10"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                {isSignUp ? "University Email" : "Email Address"}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={isSignUp ? "yourname@university.edu" : "Enter your email"}
                  className="h-12 pl-10"
                />
              </div>
              {isSignUp && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3 text-universe-cyan" />
                  Use your official university email for verification
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
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

            {isSignUp && step === 1 && (
              <div className="space-y-2">
                <Label htmlFor="role">I am a...</Label>
                <div className="grid grid-cols-2 gap-3">
                  {["Student", "Senior", "Alumni", "Staff"].map((role) => (
                    <button
                      key={role}
                      type="button"
                      className="p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium text-center"
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button variant="hero" size="lg" className="w-full">
              <GraduationCap className="mr-2" />
              {isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </motion.form>

          {/* Toggle Auth Mode */}
          <p className="text-center text-muted-foreground mt-6">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
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

          {/* Features */}
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
                <div className="w-2 h-2 rounded-full bg-universe-cyan" />
                <span className="text-muted-foreground">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
