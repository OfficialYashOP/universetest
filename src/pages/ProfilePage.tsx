import { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";

const ProfilePage = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "profile";
  
  const { profile, loading, updateProfile, uploadAvatar, uploadVerificationDocument } = useProfile();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
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

  // Update form data when profile loads
  useState(() => {
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
  });

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
    const { error } = await updateProfile(formData);
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
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profile Header */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-universe-blue via-universe-purple to-universe-cyan" />
          
          {/* Avatar & Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-card">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-universe-blue to-universe-purple text-white text-2xl">
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
              
              <div className="flex-1 pt-4 sm:pt-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{profile?.full_name || "User"}</h1>
                  {profile?.is_verified && (
                    <BadgeCheck className="w-6 h-6 text-universe-cyan" />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {profile?.email}
                  </span>
                  {profile?.university && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {profile.university.short_name || profile.university.name}
                    </span>
                  )}
                </div>
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
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Basic Info */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Basic Information
              </h2>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
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
                  <p className="text-muted-foreground capitalize">{profile?.role || "student"}</p>
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
                        You have full access to all UniVerse features.
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
                    Verify your university affiliation to unlock full access to UniVerse and get a verified badge on your profile.
                  </p>
                  
                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <h3 className="font-medium">Upload University ID</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload a clear photo of your university ID card, enrollment letter, or any official document that shows your name and university.
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
                    <CheckCircle className="w-4 h-4 text-universe-cyan flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
