import { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
import { Progress } from "@/components/ui/progress";
import { AccountSettings } from "@/components/profile/AccountSettings";
import UniversityLogo from "@/components/university/UniversityLogo";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ImageIcon,
  Edit3,
  Trash2,
  Sparkles,
  PartyPopper
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import defaultCover from "@/assets/default-cover.png";

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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    bio: profile?.bio || "",
    phone: profile?.phone || "",
    branch: profile?.branch || "",
    year_of_study: profile?.year_of_study || "",
    roll_number: profile?.roll_number || "",
  });

  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);

  // Check edit limits
  const canEditUsername = !profile?.username_updated_at || 
    differenceInDays(new Date(), new Date(profile.username_updated_at)) >= 30;
  const canEditFullName = !profile?.full_name_updated_at || 
    differenceInDays(new Date(), new Date(profile.full_name_updated_at)) >= 30;

  // Profile completion calculation
  const profileCompletion = useMemo(() => {
    if (!profile) return { percentage: 0, completed: 0, total: 8, fields: [] };
    
    const fields = [
      { name: "Full Name", filled: !!profile.full_name, icon: User },
      { name: "Profile Photo", filled: !!profile.avatar_url, icon: Camera },
      { name: "Bio", filled: !!profile.bio, icon: Edit3 },
      { name: "Phone", filled: !!profile.phone, icon: Phone },
      { name: "Roll Number", filled: !!profile.roll_number, icon: BadgeCheck },
      { name: "Branch", filled: !!profile.branch, icon: GraduationCap },
      { name: "Year of Study", filled: !!profile.year_of_study, icon: BookOpen },
      { name: "Cover Photo", filled: !!profile.cover_photo_url, icon: ImageIcon },
    ];
    
    const completed = fields.filter(f => f.filled).length;
    const percentage = Math.round((completed / fields.length) * 100);
    
    return { percentage, completed, total: fields.length, fields };
  }, [profile]);

  // Confetti celebration when profile reaches 100%
  const triggerConfetti = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'],
      });
    }, 250);
  }, []);

  // Watch for 100% completion
  useEffect(() => {
    if (profileCompletion.percentage === 100 && !hasShownConfetti && !loading) {
      setHasShownConfetti(true);
      setShowCompletionBanner(true);
      triggerConfetti();
      
      toast({
        title: "🎉 Profile Complete!",
        description: "Congratulations! Your profile is now 100% complete.",
      });

      // Hide banner after 10 seconds
      setTimeout(() => setShowCompletionBanner(false), 10000);
    }
  }, [profileCompletion.percentage, hasShownConfetti, loading, triggerConfetti, toast]);

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

  const handleRemoveAvatar = async () => {
    if (!profile?.avatar_url) return;
    
    setIsRemovingAvatar(true);
    const { error } = await updateProfile({ avatar_url: null });
    setIsRemovingAvatar(false);

    if (error) {
      toast({ title: "Error", description: "Failed to remove avatar.", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile photo removed." });
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

  const handleRemoveCover = async () => {
    const { error } = await updateProfile({ cover_photo_url: null });
    if (error) {
      toast({ title: "Error", description: "Failed to remove cover photo.", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Cover photo removed." });
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
        {/* Revamped Profile Header */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl">
          {/* Cover Photo with Facebook-style Controls */}
          <div className="relative h-36 sm:h-52 overflow-hidden group">
            <img 
              src={profile?.cover_photo_url || defaultCover} 
              alt="Cover" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Cover Photo Controls - Facebook Style */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    disabled={isUploadingCover}
                    className="flex items-center gap-2 px-3 py-2 bg-card/95 backdrop-blur-md rounded-lg text-foreground border border-border shadow-lg hover:bg-card transition-all duration-200 hover:scale-105"
                  >
                    {isUploadingCover ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium hidden sm:inline">Edit Cover</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-card border border-border shadow-xl z-50">
                  <DropdownMenuItem 
                    onClick={() => coverInputRef.current?.click()}
                    className="gap-3 cursor-pointer py-2.5"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{profile?.cover_photo_url ? "Update Cover Photo" : "Upload Cover Photo"}</span>
                  </DropdownMenuItem>
                  {profile?.cover_photo_url && (
                    <DropdownMenuItem 
                      onClick={handleRemoveCover}
                      className="gap-3 cursor-pointer py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove Cover Photo</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="hidden"
            />
          </div>
          
          {/* Profile Info Section */}
          <div className="relative px-4 sm:px-8 pb-6">
            {/* Avatar with Facebook-style Controls */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="relative -mt-16 sm:-mt-20 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="relative group/avatar cursor-pointer">
                      <Avatar className="h-28 w-28 sm:h-36 sm:w-36 border-4 border-card shadow-xl transition-all duration-300 group-hover/avatar:shadow-2xl">
                        <AvatarImage src={profile?.avatar_url || ""} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-white text-3xl sm:text-4xl font-semibold">
                          {getInitials(profile?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Hover Overlay with Camera Icon */}
                      <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-1">
                        {(isUploadingAvatar || isRemovingAvatar) ? (
                          <Loader2 className="w-7 h-7 text-white animate-spin" />
                        ) : (
                          <>
                            <Camera className="w-7 h-7 text-white" />
                            <span className="text-xs text-white font-medium">Edit</span>
                          </>
                        )}
                      </div>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={8} className="w-52 bg-card border border-border shadow-xl z-50">
                    <DropdownMenuItem 
                      onClick={() => avatarInputRef.current?.click()}
                      className="gap-3 cursor-pointer py-2.5"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{profile?.avatar_url ? "Update Profile Photo" : "Upload Profile Photo"}</span>
                    </DropdownMenuItem>
                    {profile?.avatar_url && (
                      <DropdownMenuItem 
                        onClick={handleRemoveAvatar}
                        className="gap-3 cursor-pointer py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remove Profile Photo</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              
              {/* User Info - Properly positioned */}
              <div className="flex-1 min-w-0 pt-2 sm:pt-4 sm:pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate transition-colors duration-300">
                    {profile?.full_name || "User"}
                  </h1>
                  {profile?.is_verified && (
                    <BadgeCheck className="w-6 h-6 sm:w-7 sm:h-7 text-primary flex-shrink-0 animate-fade-in" />
                  )}
                </div>
                
                {profile?.username && (
                  <p className="text-muted-foreground text-base sm:text-lg font-medium mt-0.5 transition-colors duration-300 hover:text-primary cursor-default">
                    @{profile.username}
                  </p>
                )}
                
                <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm sm:text-base transition-colors duration-300 hover:text-foreground">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{profile?.email}</span>
                </div>

                {/* University Badge */}
                {profile?.university && (
                  <div className="flex items-center gap-3 mt-4 p-3 bg-muted/50 backdrop-blur-sm rounded-xl w-fit border border-border/50 transition-all duration-300 hover:bg-muted hover:border-border hover:shadow-md group cursor-default">
                    <UniversityLogo
                      logoUrl={profile.university.logo_url}
                      name={profile.university.name}
                      shortName={profile.university.short_name || undefined}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                        {profile.university.short_name || profile.university.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {profile.university.location || "India"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Edit Button */}
              <div className="sm:self-start sm:mt-4">
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
                  className="gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  <Edit3 className="w-4 h-4" />
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Completion Progress */}
        {profileCompletion.percentage < 100 && (
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 transition-all duration-300 hover:shadow-md animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Complete Your Profile</h3>
              </div>
              <span className="text-sm font-medium text-primary">
                {profileCompletion.percentage}%
              </span>
            </div>
            
            <Progress 
              value={profileCompletion.percentage} 
              className="h-2.5 mb-3" 
            />
            
            <div className="flex flex-wrap gap-2">
              {profileCompletion.fields.filter(f => !f.filled).slice(0, 4).map((field) => (
                <Badge 
                  key={field.name}
                  variant="secondary" 
                  className="gap-1.5 py-1 px-2.5 cursor-pointer hover:bg-primary/10 hover:text-primary transition-all duration-200"
                  onClick={() => setIsEditing(true)}
                >
                  <field.icon className="w-3 h-3" />
                  {field.name}
                </Badge>
              ))}
              {profileCompletion.fields.filter(f => !f.filled).length > 4 && (
                <Badge variant="outline" className="py-1 px-2.5">
                  +{profileCompletion.fields.filter(f => !f.filled).length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* 100% Completion Celebration Banner */}
        {showCompletionBanner && profileCompletion.percentage === 100 && (
          <div className="bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 border border-primary/30 rounded-xl p-4 sm:p-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-primary to-purple-500 rounded-xl shadow-lg">
                  <PartyPopper className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Profile Complete!</h3>
                  <p className="text-sm text-muted-foreground">
                    Awesome! Your profile is now 100% complete. You're all set!
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCompletionBanner(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Tabs - Only Profile and Settings */}
        <Tabs defaultValue={defaultTab === "verification" ? "profile" : defaultTab} className="space-y-6">
          <TabsList className="bg-muted/50 backdrop-blur-sm p-1 rounded-xl border border-border/50">
            <TabsTrigger 
              value="profile" 
              className="rounded-lg transition-all duration-300 data-[state=active]:shadow-md"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="rounded-lg transition-all duration-300 data-[state=active]:shadow-md"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 animate-fade-in">
            {/* Edit Limits Warning */}
            {isEditing && (!canEditFullName || !canEditUsername) && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
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
            <div className="bg-card border border-border rounded-xl p-6 space-y-6 transition-all duration-300 hover:shadow-md hover:border-border/80">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="w-5 h-5 text-primary" />
                </div>
                Basic Information
              </h2>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 group">
                  <Label htmlFor="full_name" className="flex items-center gap-2 transition-colors duration-300 group-focus-within:text-primary">
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
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                  ) : (
                    <p className="text-muted-foreground py-2">{profile?.full_name || "Not set"}</p>
                  )}
                </div>
                
                <div className="space-y-2 group">
                  <Label htmlFor="phone" className="transition-colors duration-300 group-focus-within:text-primary">
                    Phone Number
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 1234567890"
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                  ) : (
                    <p className="text-muted-foreground py-2">{profile?.phone || "Not set"}</p>
                  )}
                </div>
                
                <div className="space-y-2 sm:col-span-2 group">
                  <Label htmlFor="bio" className="transition-colors duration-300 group-focus-within:text-primary">
                    Bio
                  </Label>
                  {isEditing ? (
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell others about yourself..."
                      rows={3}
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                  ) : (
                    <p className="text-muted-foreground py-2">{profile?.bio || "No bio yet"}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Info */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-6 transition-all duration-300 hover:shadow-md hover:border-border/80">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                Academic Information
              </h2>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 group">
                  <Label htmlFor="roll_number" className="transition-colors duration-300 group-focus-within:text-primary">
                    Roll Number / ID
                  </Label>
                  {isEditing ? (
                    <Input
                      id="roll_number"
                      value={formData.roll_number}
                      onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                      placeholder="e.g., 12345678"
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                  ) : (
                    <p className="text-muted-foreground py-2">{profile?.roll_number || "Not set"}</p>
                  )}
                </div>
                
                <div className="space-y-2 group">
                  <Label htmlFor="branch" className="transition-colors duration-300 group-focus-within:text-primary">
                    Branch / Department
                  </Label>
                  {isEditing ? (
                    <Input
                      id="branch"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      placeholder="e.g., Computer Science"
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                  ) : (
                    <p className="text-muted-foreground py-2">{profile?.branch || "Not set"}</p>
                  )}
                </div>
                
                <div className="space-y-2 group">
                  <Label htmlFor="year_of_study" className="transition-colors duration-300 group-focus-within:text-primary">
                    Year of Study
                  </Label>
                  {isEditing ? (
                    <Input
                      id="year_of_study"
                      value={formData.year_of_study}
                      onChange={(e) => setFormData({ ...formData, year_of_study: e.target.value })}
                      placeholder="e.g., 3rd Year"
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                  ) : (
                    <p className="text-muted-foreground py-2">{profile?.year_of_study || "Not set"}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Role</Label>
                  <p className="text-muted-foreground py-2 capitalize">{userRole || "student"}</p>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end animate-fade-in">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving} 
                  className="gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
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

          <TabsContent value="settings" className="animate-fade-in">
            <AccountSettings />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
