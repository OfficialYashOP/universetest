import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GraduationCap,
  Plus,
  Edit,
  Eye,
  Loader2,
  Upload,
  MapPin,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  FileText,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface University {
  id: string;
  name: string;
  short_name: string | null;
  slug: string | null;
  location: string | null;
  domain: string | null;
  logo_url: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

interface UniversityRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  university_name: string;
  city: string;
  state: string;
  country: string;
  role: string;
  department: string | null;
  interest_count: string | null;
  reason: string | null;
  proof_file_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export const UniversitiesTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<UniversityRequest | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    short_name: "",
    slug: "",
    location: "",
    domain: "",
    logo_url: "",
  });
  const [uploading, setUploading] = useState(false);

  // Fetch universities
  const { data: universities, isLoading: loadingUniversities } = useQuery({
    queryKey: ["admin-universities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("universities")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as University[];
    },
  });

  // Fetch university requests
  const { data: requests, isLoading: loadingRequests } = useQuery({
    queryKey: ["admin-university-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("university_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UniversityRequest[];
    },
  });

  // Toggle university active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("universities")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-universities"] });
      toast({ title: "University status updated" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update university
  const updateUniversityMutation = useMutation({
    mutationFn: async (data: Partial<University> & { id: string }) => {
      const { id, ...updates } = data;
      const { error } = await supabase
        .from("universities")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-universities"] });
      toast({ title: "University updated" });
      setIsEditDialogOpen(false);
      setSelectedUniversity(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update request status
  const updateRequestMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      admin_notes,
    }: {
      id: string;
      status: string;
      admin_notes?: string;
    }) => {
      const { error } = await supabase
        .from("university_requests")
        .update({ status, admin_notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-university-requests"] });
      toast({ title: "Request updated" });
      setIsRequestDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUniversity) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${selectedUniversity.slug || selectedUniversity.id}/logo.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "Upload failed",
        description: uploadError.message,
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    setEditForm((prev) => ({ ...prev, logo_url: publicUrl }));
    setUploading(false);
    toast({ title: "Logo uploaded" });
  };

  const openEditDialog = (uni: University) => {
    setSelectedUniversity(uni);
    setEditForm({
      name: uni.name || "",
      short_name: uni.short_name || "",
      slug: uni.slug || "",
      location: uni.location || "",
      domain: uni.domain || "",
      logo_url: uni.logo_url || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveUniversity = () => {
    if (!selectedUniversity) return;
    updateUniversityMutation.mutate({
      id: selectedUniversity.id,
      ...editForm,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case "contacted":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Mail className="w-3 h-3 mr-1" />
            Contacted
          </Badge>
        );
      case "reviewed":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <Eye className="w-3 h-3 mr-1" />
            Reviewed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
            <Clock className="w-3 h-3 mr-1" />
            New
          </Badge>
        );
    }
  };

  const pendingRequests = requests?.filter((r) => r.status === "new") || [];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="universities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="universities" className="gap-2">
            <GraduationCap className="w-4 h-4" />
            Universities
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <FileText className="w-4 h-4" />
            Requests
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Universities List */}
        <TabsContent value="universities" className="space-y-4">
          {loadingUniversities ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>University</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {universities?.map((uni) => (
                    <TableRow key={uni.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {uni.logo_url ? (
                            <img
                              src={uni.logo_url}
                              alt={uni.name}
                              className="w-10 h-10 rounded-lg object-contain bg-white p-1"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <GraduationCap className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{uni.name}</p>
                            {uni.short_name && (
                              <p className="text-xs text-muted-foreground">
                                {uni.short_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {uni.location && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {uni.location}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {uni.domain && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Globe className="w-3 h-3" />
                            {uni.domain}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={uni.is_active || false}
                            onCheckedChange={(checked) =>
                              toggleActiveMutation.mutate({
                                id: uni.id,
                                isActive: checked,
                              })
                            }
                          />
                          <span className="text-sm">
                            {uni.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(uni)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Requests List */}
        <TabsContent value="requests" className="space-y-4">
          {loadingRequests ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : requests?.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No requests yet</h3>
              <p className="text-muted-foreground">
                University requests will appear here
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requester</TableHead>
                    <TableHead>University</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests?.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{req.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {req.email}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {req.role}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {req.university_name}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {req.city}, {req.state}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(req.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(req);
                            setIsRequestDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit University Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit University</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                {editForm.logo_url ? (
                  <img
                    src={editForm.logo_url}
                    alt="Logo"
                    className="w-16 h-16 rounded-lg object-contain bg-white p-1 border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="max-w-[200px]"
                  />
                  {uploading && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Uploading...
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Short Name</Label>
                <Input
                  placeholder="e.g., LPU"
                  value={editForm.short_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, short_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  placeholder="e.g., lpu"
                  value={editForm.slug}
                  onChange={(e) =>
                    setEditForm({ ...editForm, slug: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="City, State"
                value={editForm.location}
                onChange={(e) =>
                  setEditForm({ ...editForm, location: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Domain</Label>
              <Input
                placeholder="university.edu"
                value={editForm.domain}
                onChange={(e) =>
                  setEditForm({ ...editForm, domain: e.target.value })
                }
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveUniversity}
                disabled={updateUniversityMutation.isPending}
                className="flex-1"
              >
                {updateUniversityMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Details Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>University Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Requester</Label>
                  <p className="font-medium">{selectedRequest.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Role</Label>
                  <p className="font-medium capitalize">{selectedRequest.role}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{selectedRequest.email}</p>
              </div>

              {selectedRequest.phone && (
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedRequest.phone}</p>
                </div>
              )}

              <div className="pt-2 border-t">
                <Label className="text-muted-foreground">University</Label>
                <p className="font-medium text-lg">
                  {selectedRequest.university_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.city}, {selectedRequest.state},{" "}
                  {selectedRequest.country}
                </p>
              </div>

              {selectedRequest.department && (
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  <p>{selectedRequest.department}</p>
                </div>
              )}

              {selectedRequest.interest_count && (
                <div>
                  <Label className="text-muted-foreground">
                    Estimated Interest
                  </Label>
                  <p>{selectedRequest.interest_count} students</p>
                </div>
              )}

              {selectedRequest.reason && (
                <div>
                  <Label className="text-muted-foreground">Reason</Label>
                  <p className="text-sm">{selectedRequest.reason}</p>
                </div>
              )}

              {selectedRequest.proof_file_url && (
                <div>
                  <Label className="text-muted-foreground">Proof Document</Label>
                  <a
                    href={selectedRequest.proof_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    View Document
                  </a>
                </div>
              )}

              <div className="pt-4 border-t">
                <Label className="text-muted-foreground mb-2 block">
                  Update Status
                </Label>
                <div className="flex flex-wrap gap-2">
                  {["reviewed", "contacted", "approved", "rejected"].map(
                    (status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={
                          selectedRequest.status === status
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          updateRequestMutation.mutate({
                            id: selectedRequest.id,
                            status,
                          })
                        }
                        disabled={updateRequestMutation.isPending}
                        className="capitalize"
                      >
                        {status}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
