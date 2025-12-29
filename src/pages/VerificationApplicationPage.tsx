import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BadgeCheck, 
  Upload, 
  Camera, 
  FileText, 
  User, 
  GraduationCap,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentUpload {
  file: File | null;
  preview: string | null;
  uploading: boolean;
}

const VerificationApplicationPage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);

  // Form fields
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [rollNumber, setRollNumber] = useState(profile?.roll_number || "");
  const [branch, setBranch] = useState(profile?.branch || "");
  const [yearOfStudy, setYearOfStudy] = useState(profile?.year_of_study || "");

  // Document uploads
  const [collegeIdFront, setCollegeIdFront] = useState<DocumentUpload>({ file: null, preview: null, uploading: false });
  const [collegeIdBack, setCollegeIdBack] = useState<DocumentUpload>({ file: null, preview: null, uploading: false });
  const [feeReceipt, setFeeReceipt] = useState<DocumentUpload>({ file: null, preview: null, uploading: false });
  const [aadhaarFront, setAadhaarFront] = useState<DocumentUpload>({ file: null, preview: null, uploading: false });
  const [aadhaarBack, setAadhaarBack] = useState<DocumentUpload>({ file: null, preview: null, uploading: false });
  const [selfie, setSelfie] = useState<DocumentUpload>({ file: null, preview: null, uploading: false });

  // Check for existing application on mount
  useState(() => {
    const checkExisting = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("verification_applications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        setExistingApplication(data);
      }
      setCheckingExisting(false);
    };
    
    checkExisting();
  });

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<DocumentUpload>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or PDF file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    const preview = file.type.startsWith("image/") 
      ? URL.createObjectURL(file) 
      : null;

    setter({ file, preview, uploading: false });
  };

  const uploadDocument = async (
    file: File,
    documentType: string
  ): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${documentType}-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("verification-docs")
      .upload(fileName, file);

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("verification-docs")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile) {
      toast({ title: "Please log in to continue", variant: "destructive" });
      return;
    }

    // Validate required fields
    if (!fullName.trim()) {
      toast({ title: "Full name is required", variant: "destructive" });
      return;
    }

    // Validate required documents
    if (!collegeIdFront.file || !collegeIdBack.file) {
      toast({ title: "College ID (front and back) is required", variant: "destructive" });
      return;
    }

    if (!selfie.file) {
      toast({ title: "Live selfie is required for identity verification", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // Upload all documents
      const uploads: Record<string, string | null> = {};

      if (collegeIdFront.file) {
        uploads.college_id_front_url = await uploadDocument(collegeIdFront.file, "college-id-front");
      }
      if (collegeIdBack.file) {
        uploads.college_id_back_url = await uploadDocument(collegeIdBack.file, "college-id-back");
      }
      if (feeReceipt.file) {
        uploads.fee_receipt_url = await uploadDocument(feeReceipt.file, "fee-receipt");
      }
      if (aadhaarFront.file) {
        uploads.aadhaar_front_url = await uploadDocument(aadhaarFront.file, "aadhaar-front");
      }
      if (aadhaarBack.file) {
        uploads.aadhaar_back_url = await uploadDocument(aadhaarBack.file, "aadhaar-back");
      }
      if (selfie.file) {
        uploads.selfie_url = await uploadDocument(selfie.file, "selfie");
      }

      // Create application
      const { error } = await supabase
        .from("verification_applications")
        .insert({
          user_id: user.id,
          full_name: fullName.trim(),
          date_of_birth: dateOfBirth || null,
          phone: phone.trim() || null,
          university_id: profile.university_id,
          roll_number: rollNumber.trim() || null,
          branch: branch.trim() || null,
          year_of_study: yearOfStudy.trim() || null,
          ...uploads,
        });

      if (error) {
        if (error.code === "23505") {
          toast({ 
            title: "Application already exists", 
            description: "You have already submitted a verification application.",
            variant: "destructive" 
          });
        } else {
          throw error;
        }
      } else {
        // Update profile verification status to pending
        await supabase
          .from("profiles")
          .update({ verification_status: "pending" })
          .eq("id", user.id);

        toast({
          title: "Application submitted!",
          description: "Your verification application is now under review.",
        });
        navigate("/profile");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Failed to submit application",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const DocumentUploadCard = ({
    label,
    description,
    icon: Icon,
    value,
    onChange,
    required = false,
  }: {
    label: string;
    description: string;
    icon: React.ElementType;
    value: DocumentUpload;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
  }) => (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <label className={cn(
        "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all",
        value.file 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      )}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/jpg,application/pdf"
          onChange={onChange}
          className="hidden"
        />
        
        {value.preview ? (
          <img src={value.preview} alt={label} className="w-24 h-24 object-cover rounded-lg" />
        ) : value.file ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="w-10 h-10 text-primary" />
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
              {value.file.name}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Icon className="w-10 h-10 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{description}</span>
          </div>
        )}
        
        {value.file && (
          <span className="text-xs text-primary mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Uploaded
          </span>
        )}
      </label>
    </div>
  );

  if (checkingExisting) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Show existing application status
  if (existingApplication) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/profile")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>

          <Card>
            <CardHeader className="text-center">
              {existingApplication.status === "pending" && (
                <>
                  <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-amber-500" />
                  </div>
                  <CardTitle>Verification Pending</CardTitle>
                  <CardDescription>
                    Your verification application is currently under review. We'll notify you once it's processed.
                  </CardDescription>
                </>
              )}
              
              {existingApplication.status === "approved" && (
                <>
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <BadgeCheck className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-primary">Verified!</CardTitle>
                  <CardDescription>
                    Congratulations! Your account has been verified. You now have a blue verified tick on your profile.
                  </CardDescription>
                </>
              )}
              
              {existingApplication.status === "rejected" && (
                <>
                  <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <XCircle className="w-8 h-8 text-destructive" />
                  </div>
                  <CardTitle className="text-destructive">Verification Rejected</CardTitle>
                  <CardDescription>
                    Unfortunately, your verification application was not approved.
                    {existingApplication.admin_notes && (
                      <span className="block mt-2 text-foreground">
                        Reason: {existingApplication.admin_notes}
                      </span>
                    )}
                  </CardDescription>
                </>
              )}
            </CardHeader>
            
            <CardContent className="text-center">
              <Button onClick={() => navigate("/profile")}>
                Return to Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/profile")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BadgeCheck className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Apply for Verification</CardTitle>
            <CardDescription>
              Get a verified badge on your profile to show others you're a trusted member of the community.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <User className="w-5 h-5 text-primary" />
                  Personal Information
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="As per your ID"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Academic Details
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="rollNumber">Roll Number / Registration ID</Label>
                    <Input
                      id="rollNumber"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="e.g., 12345678"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch / Department</Label>
                    <Input
                      id="branch"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="yearOfStudy">Year of Study</Label>
                    <Input
                      id="yearOfStudy"
                      value={yearOfStudy}
                      onChange={(e) => setYearOfStudy(e.target.value)}
                      placeholder="e.g., 3rd Year"
                    />
                  </div>
                </div>
              </div>

              {/* Document Uploads */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <FileText className="w-5 h-5 text-primary" />
                  Document Uploads
                </div>
                
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Please ensure all documents are clear and readable. Your documents will be kept confidential and used only for verification purposes.
                  </p>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <DocumentUploadCard
                    label="College ID (Front)"
                    description="Upload front side"
                    icon={Upload}
                    value={collegeIdFront}
                    onChange={(e) => handleFileSelect(e, setCollegeIdFront)}
                    required
                  />
                  
                  <DocumentUploadCard
                    label="College ID (Back)"
                    description="Upload back side"
                    icon={Upload}
                    value={collegeIdBack}
                    onChange={(e) => handleFileSelect(e, setCollegeIdBack)}
                    required
                  />
                  
                  <DocumentUploadCard
                    label="Fee Receipt"
                    description="Latest fee receipt"
                    icon={FileText}
                    value={feeReceipt}
                    onChange={(e) => handleFileSelect(e, setFeeReceipt)}
                  />
                  
                  <DocumentUploadCard
                    label="Aadhaar Card (Front)"
                    description="Upload front side"
                    icon={Upload}
                    value={aadhaarFront}
                    onChange={(e) => handleFileSelect(e, setAadhaarFront)}
                  />
                  
                  <DocumentUploadCard
                    label="Aadhaar Card (Back)"
                    description="Upload back side"
                    icon={Upload}
                    value={aadhaarBack}
                    onChange={(e) => handleFileSelect(e, setAadhaarBack)}
                  />
                  
                  <DocumentUploadCard
                    label="Live Selfie"
                    description="Take a clear selfie"
                    icon={Camera}
                    value={selfie}
                    onChange={(e) => handleFileSelect(e, setSelfie)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <BadgeCheck className="w-4 h-4" />
                    Submit Application
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default VerificationApplicationPage;