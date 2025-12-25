import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerification?: boolean;
  requireUniversity?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireVerification = false,
  requireUniversity = true 
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for both auth and profile to load
    if (!authLoading && !profileLoading) {
      setIsReady(true);
      console.log("[ProtectedRoute] Auth loaded:", !!user, "Profile loaded:", !!profile);
    }
  }, [authLoading, profileLoading, user, profile]);

  // Show loading state
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to auth
  if (!user) {
    console.log("[ProtectedRoute] No user, redirecting to /auth");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Logged in but no profile yet (edge case)
  if (!profile) {
    console.log("[ProtectedRoute] User but no profile, showing loading");
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  // Check verification requirement
  if (requireVerification && !profile.is_verified) {
    console.log("[ProtectedRoute] User not verified, redirecting to verify");
    return <Navigate to="/auth/verify" state={{ from: location }} replace />;
  }

  // Check university requirement
  if (requireUniversity && !profile.university_id) {
    console.log("[ProtectedRoute] No university, redirecting to select");
    return <Navigate to="/select-university" state={{ from: location }} replace />;
  }

  console.log("[ProtectedRoute] All checks passed, rendering children");
  return <>{children}</>;
};

export default ProtectedRoute;
