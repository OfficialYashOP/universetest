import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Search,
  Users,
  BadgeCheck,
  ShieldCheck,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Building2,
  Store,
  BookOpen,
  Eye,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import lpuLogo from "@/assets/lpu-logo.png";

const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if user has admin role
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsCheckingAdmin(false);
        return;
      }

      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "staff",
      });

      if (!error && data) {
        setIsAdmin(true);
      }
      setIsCheckingAdmin(false);
    };

    checkAdminRole();
  }, [user]);

  // Fetch pending verifications
  const { data: pendingUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-pending-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("verification_status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch all users
  const { data: allUsers, isLoading: loadingAllUsers } = useQuery({
    queryKey: ["admin-all-users", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(
          `full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch pending services
  const { data: pendingServices, isLoading: loadingServices } = useQuery({
    queryKey: ["admin-pending-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("local_services")
        .select("*")
        .eq("is_admin_approved", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Verify user mutation
  const verifyUserMutation = useMutation({
    mutationFn: async ({
      userId,
      status,
    }: {
      userId: string;
      status: "verified" | "rejected";
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          verification_status: status,
          is_verified: status === "verified",
        })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
      toast({
        title: status === "verified" ? "User Verified" : "Verification Rejected",
        description: `User has been ${status}.`,
      });
      setIsVerifyDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Approve service mutation
  const approveServiceMutation = useMutation({
    mutationFn: async ({
      serviceId,
      approved,
    }: {
      serviceId: string;
      approved: boolean;
    }) => {
      if (approved) {
        const { error } = await supabase
          .from("local_services")
          .update({ is_admin_approved: true })
          .eq("id", serviceId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("local_services")
          .delete()
          .eq("id", serviceId);
        if (error) throw error;
      }
    },
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-services"] });
      toast({
        title: approved ? "Service Approved" : "Service Rejected",
        description: approved
          ? "The service is now visible to users."
          : "The service listing has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  if (isCheckingAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <ShieldCheck className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground max-w-md">
            You don't have permission to access the admin dashboard. This area is
            restricted to staff members only.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <img src={lpuLogo} alt="LPU" className="w-14 h-14" />
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage users, verifications, and content moderation
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingUsers?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Pending Verifications</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-universe-blue/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-universe-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allUsers?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-universe-purple/20 flex items-center justify-center">
                <Store className="w-5 h-5 text-universe-purple" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingServices?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Pending Services</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <BadgeCheck className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {allUsers?.filter((u) => u.is_verified).length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Verified Users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="verifications" className="space-y-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="verifications">
              <BadgeCheck className="w-4 h-4 mr-2" />
              Verifications
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              All Users
            </TabsTrigger>
            <TabsTrigger value="services">
              <Store className="w-4 h-4 mr-2" />
              Services
            </TabsTrigger>
          </TabsList>

          {/* Pending Verifications Tab */}
          <TabsContent value="verifications" className="space-y-4">
            {loadingUsers ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              </div>
            ) : pendingUsers?.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-4" />
                <h3 className="font-semibold text-lg mb-2">All caught up!</h3>
                <p className="text-muted-foreground">
                  No pending verifications at the moment.
                </p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url || ""} />
                              <AvatarFallback className="bg-gradient-to-br from-universe-blue to-universe-purple text-white text-xs">
                                {getInitials(user.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.full_name || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>{user.roll_number || "-"}</TableCell>
                        <TableCell>{user.branch || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(user.created_at!), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsVerifyDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* All Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {loadingAllUsers ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url || ""} />
                              <AvatarFallback className="bg-gradient-to-br from-universe-blue to-universe-purple text-white text-xs">
                                {getInitials(user.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.full_name || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>{getStatusBadge(user.verification_status || "pending")}</TableCell>
                        <TableCell>{user.branch || "-"}</TableCell>
                        <TableCell>{user.year_of_study || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(user.created_at!), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Pending Services Tab */}
          <TabsContent value="services" className="space-y-4">
            {loadingServices ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              </div>
            ) : pendingServices?.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-4" />
                <h3 className="font-semibold text-lg mb-2">No pending services</h3>
                <p className="text-muted-foreground">
                  All service listings have been reviewed.
                </p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingServices?.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {service.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">
                          {service.description || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {service.phone || service.website || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() =>
                                approveServiceMutation.mutate({
                                  serviceId: service.id,
                                  approved: true,
                                })
                              }
                              disabled={approveServiceMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                approveServiceMutation.mutate({
                                  serviceId: service.id,
                                  approved: false,
                                })
                              }
                              disabled={approveServiceMutation.isPending}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Verification Dialog */}
        <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Review Verification Request</DialogTitle>
              <DialogDescription>
                Review the user's details and verification documents.
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedUser.avatar_url || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-universe-blue to-universe-purple text-white text-xl">
                      {getInitials(selectedUser.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedUser.full_name || "Unknown User"}
                    </h3>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Roll Number</p>
                    <p className="font-medium">{selectedUser.roll_number || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Branch</p>
                    <p className="font-medium">{selectedUser.branch || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Year of Study</p>
                    <p className="font-medium">{selectedUser.year_of_study || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedUser.phone || "Not provided"}</p>
                  </div>
                </div>

                {selectedUser.verification_document_url && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Verification Document</p>
                    <a
                      href={selectedUser.verification_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View Document
                    </a>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsVerifyDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  verifyUserMutation.mutate({
                    userId: selectedUser.id,
                    status: "rejected",
                  })
                }
                disabled={verifyUserMutation.isPending}
              >
                Reject
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() =>
                  verifyUserMutation.mutate({
                    userId: selectedUser.id,
                    status: "verified",
                  })
                }
                disabled={verifyUserMutation.isPending}
              >
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
