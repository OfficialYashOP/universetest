import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, MessageSquare, GraduationCap, Home, BookOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommunityGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number | null;
}

interface CommunityGroupsSectionProps {
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
}

const groupIcons: Record<string, React.ReactNode> = {
  general: <MessageSquare className="w-5 h-5" />,
  freshers: <Sparkles className="w-5 h-5" />,
  seniors: <GraduationCap className="w-5 h-5" />,
  "housing-living": <Home className="w-5 h-5" />,
  academics: <BookOpen className="w-5 h-5" />,
};

const groupColors: Record<string, string> = {
  general: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  freshers: "bg-green-500/20 text-green-500 border-green-500/30",
  seniors: "bg-purple-500/20 text-purple-500 border-purple-500/30",
  "housing-living": "bg-orange-500/20 text-orange-500 border-orange-500/30",
  academics: "bg-cyan-500/20 text-cyan-500 border-cyan-500/30",
};

export const CommunityGroupsSection = ({ selectedGroupId, onSelectGroup }: CommunityGroupsSectionProps) => {
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from("community_groups")
      .select("*")
      .order("display_order", { ascending: true });

    if (data) {
      setGroups(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Community Groups
      </h3>
      
      {/* All Posts button */}
      <button
        onClick={() => onSelectGroup(null)}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
          selectedGroupId === null
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50"
        )}
      >
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          selectedGroupId === null ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          <Users className="w-5 h-5" />
        </div>
        <div>
          <p className="font-medium">All Posts</p>
          <p className="text-xs text-muted-foreground">See everything</p>
        </div>
      </button>

      {/* Group buttons */}
      {groups.map(group => (
        <button
          key={group.id}
          onClick={() => onSelectGroup(group.id)}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
            selectedGroupId === group.id
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            groupColors[group.slug] || "bg-muted"
          )}>
            {groupIcons[group.slug] || <MessageSquare className="w-5 h-5" />}
          </div>
          <div>
            <p className="font-medium">{group.name}</p>
            {group.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">{group.description}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};
