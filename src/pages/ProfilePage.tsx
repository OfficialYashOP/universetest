import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSettings } from "@/components/profile/AccountSettings";
import UniversityLogo from "@/components/university/UniversityLogo";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  Mail, 
  Phone, 
  BookOpen, 
  GraduationCap, 
  Building2,
  BadgeCheck,
  Shield,
  Upload,
  Camera,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Save,
  Settings,
  AlertTriangle,
  ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, differenceInDays } from "date-fns";

const ProfilePage = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "profile";
  const navigate = useNavigate();
  
  const { profile, loading, updateProfile, uploadAvatar, uploadVerificationDocument } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    bio: profile?.bio || "",
    phone: profile?.phone || "",
    branch: profile?.branch || "",
    year_of_study: profile?.year_of_study || "",
    roll_number: profile?.roll_number || "",
  });

  // Check edit limits
  const canEditUsername = !profile?.username_updated_at || 
    differenceInDays(new Date(), new Date(profile.username_updated_at)) >= 30;
  const canEditFullName = !profile?.full_name_updated_at || 
    differenceInDays(new Date(), new Date(profile.full_name_updated_at)) >= 30;

  // Fetch user role
  useEffect(() => {
    const fetchRole = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      setUserRole(data?.role || null);
    };
    fetchRole();
  }, [user]);

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
        branch: profile.branch || "",
        year_of_study: profile.year_of_study || "",
        roll_number: profile.roll_number || "",
      });
    }
  }, [profile]);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getVerificationStatus = () => {
    switch (profile?.verification_status) {
      case "verified":
        return { icon: CheckCircle, text: "Verified", color: "text-green-500 bg-green-500/10" };
      case "pending":
        return { icon: Clock, text: "Pending Review", color: "text-amber-500 bg-amber-500/10" };
      case "rejected":
        return { icon: XCircle, text: "Rejected", color: "text-destructive bg-destructive/10" };
      default:
        return { icon: Shield, text: "Not Verified", color: "text-muted-foreground bg-muted" };
    }
  };

  const getVerificationDocumentLabel = () => {
    if (userRole === "alumni") {
      return "Upload Transcript / Degree Certificate";
    }
    return "Upload University ID Card";
  };

  const getVerificationDocumentDescription = () => {
    if (userRole === "alumni") {
      return "Upload a clear photo of your transcript, degree certificate, or any official document from your university.";
    }
    return "Upload a clear photo of your university ID card, enrollment letter, or any official document that shows your name and university.";
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 5MB.", variant: "destructive" });
      return;
    }

    setIsUploadingAvatar(true);
    const { error } = await uploadAvatar(file);
    setIsUploadingAvatar(false);

    if (error) {
      toast({ title: "Error", description: "Failed to upload avatar.", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Avatar updated successfully." });
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 10MB.", variant: "destructive" });
      return;
    }

    setIsUploadingCover(true);
    
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/cover.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Error", description: "Failed to upload cover photo.", variant: "destructive" });
      setIsUploadingCover(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    await updateProfile({ cover_photo_url: data.publicUrl });
    
    setIsUploadingCover(false);
    toast({ title: "Success", description: "Cover photo updated successfully." });
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "File must be less than 10MB.", variant: "destructive" });
      return;
    }

    setIsUploadingDoc(true);
    const { error } = await uploadVerificationDocument(file);
    setIsUploadingDoc(false);

    if (error) {
      toast({ title: "Error", description: "Failed to upload document.", variant: "destructive" });
    } else {
      toast({ 
        title: "Document Submitted", 
        description: "Your verification document has been submitted for review." 
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const updates: any = { ...formData };
    
    // Track if name changed for 30-day limit
    if (formData.full_name !== profile?.full_name && canEditFullName) {
      updates.full_name_updated_at = new Date().toISOString();
    }
    
    const { error } = await updateProfile(updates);
    setIsSaving(false);

    if (error) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile updated successfully." });
      setIsEditing(false);
    }
  };

  const verificationStatus = getVerificationStatus();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Profile Header */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Cover Photo */}
          <div className="relative h-32 sm:h-48 bg-gradient-to-r from-primary via-primary/80 to-primary/60">
            {profile?.cover_photo_url && (
              <img 
                src={profile.cover_photo_url} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
            )}
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploadingCover}
              className="absolute bottom-3 right-3 p-2 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors"
            >
              {isUploadingCover ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="hidden"
            />
          </div>
          
          {/* Avatar & Info */}
          <div className="px-4 sm:px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16">
              <div className="relative">
                <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-card">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-2xl sm:text-3xl">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              
              <div className="flex-1 pt-2 sm:pt-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold">{profile?.full_name || "User"}</h1>
                  {profile?.is_verified && (
                    <BadgeCheck className="w-6 h-6 text-primary" />
                  )}
                </div>
                {profile?.username && (
                  <p className="text-muted-foreground">@{profile.username}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-muted-foreground flex-wrap text-sm">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {profile?.email}
                  </span>
                </div>
                {/* University Badge */}
                {profile?.university && (
                  <div className="flex items-center gap-2 mt-3 p-2 bg-muted rounded-lg w-fit">
                    <UniversityLogo
                      logoUrl={profile.university.logo_url}
                      name={profile.university.name}
                      shortName={profile.university.short_name || undefined}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium">{profile.university.short_name || profile.university.name}</p>
                      <p className="text-xs text-muted-foreground">{profile.university.location || "India"}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <Button
                variant={isEditing ? "outline" : "default"}
                onClick={() => {
                  if (isEditing) {
                    setFormData({
                      full_name: profile?.full_name || "",
                      bio: profile?.bio || "",
                      phone: profile?.phone || "",
                      branch: profile?.branch || "",
                      year_of_study: profile?.year_of_study || "",
                      roll_number: profile?.roll_number || "",
                    });
                  }
                  setIsEditing(!isEditing);
                }}
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-2">
              Verification
              {!profile?.is_verified && (
                <span className="w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Edit Limits Warning */}
            {isEditing && (!canEditFullName || !canEditUsername) && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-500">Edit Restrictions</p>
                  <p className="text-amber-500/80">
                    {!canEditFullName && "Full name can only be changed once every 30 days. "}
                    {!canEditUsername && "Username can only be changed once every 30 days."}
                  </p>
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Basic Information
              </h2>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="flex items-center gap-2">
                    Full Name
                    {!canEditFullName && (
                      <Badge variant="secondary" className="text-xs">Locked</Badge>
                    )}
                  </Label>
                  {isEditing ? (
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      disabled={!canEditFullName}
                    />
                  ) : (
                    <p className="text-muted-foreground">{profile?.full_name || "Not set"}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 1234567890"
                    />
                  ) : (
                    <p className="text-muted-foreground">{profile?.phone || "Not set"}</p>
                  )}
                </div>
                
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  {isEditing ? (
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell others about yourself..."
                      rows={3}
                    />
                  ) : (
                    <p className="text-muted-foreground">{profile?.bio || "No bio yet"}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Info */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Academic Information
              </h2>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="roll_number">Roll Number / ID</Label>
                  {isEditing ? (
                    <Input
                      id="roll_number"
                      value={formData.roll_number}
                      onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                      placeholder="e.g., 12345678"
                    />
                  ) : (
                    <p className="text-muted-foreground">{profile?.roll_number || "Not set"}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch / Department</Label>
                  {isEditing ? (
                    <Input
                      id="branch"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      placeholder="e.g., Computer Science"
                    />
                  ) : (
                    <p className="text-muted-foreground">{profile?.branch || "Not set"}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="year_of_study">Year of Study</Label>
                  {isEditing ? (
                    <Input
                      id="year_of_study"
                      value={formData.year_of_study}
                      onChange={(e) => setFormData({ ...formData, year_of_study: e.target.value })}
                      placeholder="e.g., 3rd Year"
                    />
                  ) : (
                    <p className="text-muted-foreground">{profile?.year_of_study || "Not set"}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Role</Label>
                  <p className="text-muted-foreground capitalize">{userRole || "student"}</p>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="verification" className="space-y-6">
            {/* Verification Status */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Verification Status
                </h2>
                <Badge className={cn("gap-1", verificationStatus.color)}>
                  <verificationStatus.icon className="w-4 h-4" />
                  {verificationStatus.text}
                </Badge>
              </div>

              {profile?.verification_status === "verified" ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="font-medium text-green-500">Your account is verified!</p>
                      <p className="text-sm text-muted-foreground">
                        You have full access to all Sympan features.
                      </p>
                    </div>
                  </div>
                </div>
              ) : profile?.verification_status === "pending" ? (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8 text-amber-500" />
                    <div>
                      <p className="font-medium text-amber-500">Verification in progress</p>
                      <p className="text-sm text-muted-foreground">
                        Your document is being reviewed. This usually takes 1-2 business days.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Verify your university affiliation to unlock full access to Sympan and get a verified badge on your profile.
                  </p>
                  
                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <h3 className="font-medium">{getVerificationDocumentLabel()}</h3>
                    <p className="text-sm text-muted-foreground">
                      {getVerificationDocumentDescription()}
                    </p>
                    
                    <div
                      onClick={() => docInputRef.current?.click()}
                      className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                        "hover:border-primary hover:bg-primary/5",
                        isUploadingDoc && "pointer-events-none opacity-50"
                      )}
                    >
                      {isUploadingDoc ? (
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="font-medium">Click to upload</p>
                          <p className="text-sm text-muted-foreground">
                            PNG, JPG or PDF up to 10MB
                          </p>
                        </>
                      )}
                    </div>
                    
                    <input
                      ref={docInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleDocumentUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Benefits */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold">Benefits of Verification</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  "Verified badge on your profile",
                  "Access to housing & roommate finder",
                  "Post and interact in campus feed",
                  "Direct messaging with other students",
                  "Access to academic resources marketplace",
                  "View and review local services",
                ].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <AccountSettings />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
