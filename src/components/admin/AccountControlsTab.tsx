import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  UserX,
  UserCheck,
  Loader2,
  Shield,
  Ban,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const AccountControlsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-account-controls", searchTerm],
    queryFn: async () => {
      // Use secure RPC function that excludes sensitive personal data (phone, social links, etc.)
      const { data, error } = await supabase
        .rpc("get_admin_profiles_filtered", { search_term: searchTerm || null });
      
      if (error) throw error;
      
      // Sort by created_at descending and limit to 50
      return (data || [])
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50);
    },
  });

  const toggleAccountMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          is_active: isActive,
          account_status: isActive ? "active" : "suspended" 
        })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-account-controls"] });
      toast({
        title: isActive ? "Account Activated" : "Account Suspended",
        description: `User account has been ${isActive ? "activated" : "suspended"}.`,
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

  const getStatusBadge = (user: any) => {
    if (user.account_status === "suspended") {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          <Ban className="w-3 h-3 mr-1" />
          Suspended
        </Badge>
      );
    }
    if (user.is_active) {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
        <Clock className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            Pending
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground">
            Unverified
          </Badge>
        );
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or username..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || ""} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-xs">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-medium block">{user.full_name || "Unknown"}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>{getStatusBadge(user)}</TableCell>
                <TableCell>{getVerificationBadge(user.verification_status || "pending")}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(user.created_at!), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {user.is_active || user.account_status === "active" ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          toggleAccountMutation.mutate({
                            userId: user.id,
                            isActive: false,
                          })
                        }
                      >
                        <UserX className="w-4 h-4 mr-1" />
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() =>
                          toggleAccountMutation.mutate({
                            userId: user.id,
                            isActive: true,
                          })
                        }
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Activate
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
