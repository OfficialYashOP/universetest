import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, ShieldAlert, ShieldCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SESSION_STORAGE_KEY = "verification_reminder_shown";

export const VerificationReminderNotification = () => {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
  const [isVisible, setIsVisible] = useState(false);
  const [isSnoozed, setIsSnoozed] = useState(false);

  useEffect(() => {
    if (loading || !profile) return;

    // Check if already shown this session
    const shownThisSession = sessionStorage.getItem(SESSION_STORAGE_KEY) === "true";
    if (shownThisSession) {
      setIsVisible(false);
      return;
    }

    // Determine verification status
    const verificationStatus = profile.verification_status;
    const isVerified = profile.is_verified;

    // Don't show for verified or pending users
    if (isVerified || verificationStatus === "verified" || verificationStatus === "pending") {
      setIsVisible(false);
      return;
    }

    // Check snooze period
    const snoozeUntil = profile.verification_reminder_snooze_until 
      ? new Date(profile.verification_reminder_snooze_until) 
      : null;
    
    if (snoozeUntil && new Date() < snoozeUntil) {
      setIsVisible(false);
      return;
    }

    // If snooze has expired, clear it in the database
    if (snoozeUntil && new Date() >= snoozeUntil) {
      clearSnooze();
    }

    // Show the notification
    setIsVisible(true);
  }, [profile, loading]);

  const clearSnooze = async () => {
    if (!profile) return;
    
    await supabase
      .from("profiles")
      .update({ verification_reminder_snooze_until: null })
      .eq("id", profile.id);
  };

  const handleApplyForVerification = () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
    setIsVisible(false);
    navigate("/verification/apply");
  };

  const handleRemindIn7Days = async () => {
    if (!profile) return;

    setIsSnoozed(true);
    
    // Calculate 7 days from now in IST
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + 7);

    const { error } = await supabase
      .from("profiles")
      .update({ verification_reminder_snooze_until: snoozeUntil.toISOString() })
      .eq("id", profile.id);

    if (error) {
      toast.error("Failed to snooze reminder");
      setIsSnoozed(false);
      return;
    }

    sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
    setIsVisible(false);
    toast.success("Reminder snoozed for 7 days");
  };

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible || loading) return null;

  const isRejected = profile?.verification_status === "rejected";

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${isRejected ? "bg-destructive/10" : "bg-amber-500/10"}`}>
            {isRejected ? (
              <ShieldAlert className="h-5 w-5 text-destructive" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-amber-500" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {isRejected 
                ? "Verification rejected" 
                : "You are not verified"
              }
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isRejected 
                ? "Your verification was rejected. Please reapply with correct documents."
                : "Please apply for verification to get a blue tick on your profile."
              }
            </p>
            
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Button 
                size="sm" 
                onClick={handleApplyForVerification}
                className="h-8 text-xs"
              >
                {isRejected ? "Reapply" : "Apply for Verification"}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleRemindIn7Days}
                disabled={isSnoozed}
                className="h-8 text-xs gap-1"
              >
                <Clock className="h-3 w-3" />
                Remind in 7 days
              </Button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 -mt-1 -mr-1"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
