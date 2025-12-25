import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Search, 
  BadgeCheck, 
  MessageSquare,
  Filter,
  Loader2,
  GraduationCap,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Member {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  branch: string | null;
  year_of_study: string | null;
  is_verified: boolean;
  role?: string;
}

const roleFilters = [
  { value: "all", label: "All Members" },
  { value: "student", label: "Students" },
  { value: "senior", label: "Seniors" },
  { value: "alumni", label: "Alumni" },
  { value: "staff", label: "Staff" },
];

const CommunityPage = () => {
  const { profile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    const fetchMembers = async () => {
      if (!profile?.university_id) return;

      setLoading(true);

      // Fetch profiles from same university
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, branch, year_of_study, is_verified")
        .eq("university_id", profile.university_id)
        .neq("id", user?.id)
        .order("full_name");

      if (error) {
        console.error("Error fetching members:", error);
        setLoading(false);
        return;
      }

      // Fetch roles for all users
      const userIds = profiles?.map(p => p.id) || [];
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const rolesMap: Record<string, string> = {};
      roles?.forEach(r => {
        rolesMap[r.user_id] = r.role;
      });

      const membersWithRoles = profiles?.map(p => ({
        ...p,
        role: rolesMap[p.id] || "student",
      })) || [];

      setMembers(membersWithRoles);
      setLoading(false);
    };

    fetchMembers();
  }, [profile?.university_id, user?.id]);

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.branch?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.bio?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "alumni": return "bg-universe-purple/20 text-universe-purple border-universe-purple/30";
      case "senior": return "bg-universe-cyan/20 text-universe-cyan border-universe-cyan/30";
      case "staff": return "bg-universe-pink/20 text-universe-pink border-universe-pink/30";
      default: return "bg-primary/20 text-primary border-primary/30";
    }
  };

  const startConversation = async (memberId: string) => {
    navigate(`/dashboard/messages?new=${memberId}`);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Community
            </h1>
            <p className="text-muted-foreground">
              Connect with students, seniors, and alumni from {profile?.university?.short_name || "your university"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserCheck className="w-4 h-4" />
            <span>{members.length} members</span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, branch, or bio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {roleFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setRoleFilter(filter.value)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                  roleFilter === filter.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Members Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No members found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={member.avatar_url || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-universe-blue to-universe-purple text-white">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{member.full_name || "Unknown"}</h3>
                      {member.is_verified && (
                        <BadgeCheck className="w-4 h-4 text-universe-cyan flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={cn("text-xs capitalize", getRoleBadgeColor(member.role || "student"))}>
                        {member.role}
                      </Badge>
                      {member.year_of_study && (
                        <span className="text-xs text-muted-foreground">{member.year_of_study}</span>
                      )}
                    </div>
                    
                    {member.branch && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {member.branch}
                      </p>
                    )}
                    
                    {member.bio && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {member.bio}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 gap-2"
                  onClick={() => startConversation(member.id)}
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CommunityPage;
