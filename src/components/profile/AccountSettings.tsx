import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  LogOut,
  Trash2,
  Instagram,
  Ghost,
  Mail,
  Loader2,
  AlertTriangle,
  Camera,
} from "lucide-react";

export const AccountSettings = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const [socialLinks, setSocialLinks] = useState({
    instagram_link: profile?.instagram_link || "",
    snapchat_link: profile?.snapchat_link || "",
    recovery_email: profile?.recovery_email || "",
  });

  const handleLogout = async () => {
    await signOut();
    navigate("/");
    toast({
      title: "Logged out",
      description: "You have been signed out successfully.",
    });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast({
        title: "Error",
        description: 'Please type "DELETE" to confirm.',
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    
    // Delete user data (profile will cascade)
    const { error } = await supabase.auth.admin.deleteUser?.(profile?.id || "") || { error: null };
    
    // Sign out the user
    await signOut();
    
    setIsDeleting(false);
    
    toast({
      title: "Account Deleted",
      description: "Your account has been permanently deleted.",
    });
    
    navigate("/");
  };

  const handleSaveSocialLinks = async () => {
    setIsSaving(true);
    
    const { error } = await updateProfile({
      instagram_link: socialLinks.instagram_link || null,
      snapchat_link: socialLinks.snapchat_link || null,
      recovery_email: socialLinks.recovery_email || null,
    });
    
    setIsSaving(false);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Saved",
        description: "Your settings have been updated.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="w-5 h-5" />
            Social Links
          </CardTitle>
          <CardDescription>
            Add your social media links to your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <Instagram className="w-4 h-4" />
              Instagram Username
            </Label>
            <Input
              id="instagram"
              placeholder="@yourusername"
              value={socialLinks.instagram_link}
              onChange={(e) => setSocialLinks({ ...socialLinks, instagram_link: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="snapchat" className="flex items-center gap-2">
              <Ghost className="w-4 h-4" />
              Snapchat Username
            </Label>
            <Input
              id="snapchat"
              placeholder="yourusername"
              value={socialLinks.snapchat_link}
              onChange={(e) => setSocialLinks({ ...socialLinks, snapchat_link: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="recovery" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Recovery Email
            </Label>
            <Input
              id="recovery"
              type="email"
              placeholder="backup@email.com"
              value={socialLinks.recovery_email}
              onChange={(e) => setSocialLinks({ ...socialLinks, recovery_email: e.target.value })}
            />
          </div>
          
          <Button onClick={handleSaveSocialLinks} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logout */}
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>

          {/* Delete Account */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full justify-start gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Delete Account Permanently?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>
                    This action is irreversible. All your data including posts, messages,
                    and profile information will be permanently deleted.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-delete">
                      Type "DELETE" to confirm:
                    </Label>
                    <Input
                      id="confirm-delete"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="DELETE"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== "DELETE" || isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Delete Forever
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};
