import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Upload, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import logo from "@/assets/logo.png";
import UniversityLogo from "@/components/university/UniversityLogo";

const VerifyPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, uploadVerificationDocument } = useProfile();
  
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const { error } = await uploadVerificationDocument(file);
    setUploading(false);

    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      setUploaded(true);
      toast({ title: "Document uploaded!", description: "Your verification is pending review." });
    }
  };

  const handleContinue = () => {
    const slug = (profile?.university as any)?.slug || "lpu";
    navigate(`/app/university/${slug}`, { replace: true });
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  const isPending = profile?.verification_status === "pending";
  const isVerified = profile?.is_verified;

  // Already verified - redirect
  if (isVerified) {
    const slug = (profile?.university as any)?.slug || "lpu";
    navigate(`/app/university/${slug}`, { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <img src={logo} alt="Sympan" className="h-12 w-12 rounded-xl" />
          <span className="text-2xl font-bold gradient-text">Sympan</span>
        </div>

        {/* University Logo */}
        {profile?.university && (
          <div className="flex justify-center">
            <UniversityLogo
              logoUrl={(profile.university as any).logo_url}
              name={(profile.university as any).name}
              size="lg"
            />
          </div>
        )}

        {/* Header */}
        <div className="text-center space-y-2">
          <Shield className="w-12 h-12 text-primary mx-auto" />
          <h1 className="text-2xl font-bold">Verify Your Identity</h1>
          <p className="text-muted-foreground">
            Upload your student ID or university email screenshot to get verified
          </p>
        </div>

        {/* Status */}
        {isPending || uploaded ? (
          <div className="text-center space-y-4 p-6 bg-muted/50 rounded-lg border">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <div>
              <h3 className="font-semibold">Verification Pending</h3>
              <p className="text-sm text-muted-foreground">
                Your document has been submitted. We'll verify your account within 24 hours.
              </p>
            </div>
            <Button variant="hero" className="w-full" onClick={handleContinue}>
              Continue to Dashboard
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Upload Area */}
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">Click to upload document</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Student ID, enrollment letter, or email screenshot
                    </p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>

            {/* Skip for now */}
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={handleContinue}
            >
              Skip for now
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              You can verify later, but some features may be restricted.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyPage;
