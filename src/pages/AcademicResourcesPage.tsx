import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import {
  Search,
  Plus,
  BookOpen,
  FileText,
  Notebook,
  Calculator,
  GraduationCap,
  IndianRupee,
  User,
  Calendar,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const resourceTypes = [
  { value: "all", label: "All Resources", icon: GraduationCap },
  { value: "textbook", label: "Textbooks", icon: BookOpen },
  { value: "notes", label: "Notes", icon: FileText },
  { value: "assignments", label: "Assignments", icon: Notebook },
  { value: "other", label: "Other", icon: GraduationCap },
];

const conditions = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

const AcademicResourcesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    resource_type: "textbook",
    subject: "",
    condition: "good",
    price: "",
  });

  const { data: resources, isLoading } = useQuery({
    queryKey: ["academic-resources", typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("academic_resources")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (typeFilter !== "all") {
        query = query.eq("resource_type", typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const createResourceMutation = useMutation({
    mutationFn: async (resourceData: typeof newResource) => {
      if (!user || !profile?.university_id) throw new Error("Not authenticated");

      const { error } = await supabase.from("academic_resources").insert({
        title: resourceData.title,
        description: resourceData.description,
        resource_type: resourceData.resource_type,
        subject: resourceData.subject,
        condition: resourceData.condition,
        price: resourceData.price ? parseFloat(resourceData.price) : null,
        user_id: user.id,
        university_id: profile.university_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-resources"] });
      toast({
        title: "Resource listed!",
        description: "Your resource has been listed for sale.",
      });
      setIsDialogOpen(false);
      setNewResource({
        title: "",
        description: "",
        resource_type: "textbook",
        subject: "",
        condition: "good",
        price: "",
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

  const filteredResources = resources?.filter(
    (resource) =>
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    const t = resourceTypes.find((r) => r.value === type);
    return t?.icon || GraduationCap;
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "new":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "like_new":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "good":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Academic Resources</h1>
            <p className="text-muted-foreground">
              Buy and sell textbooks, notes, and study materials
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-universe-blue to-universe-purple hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Sell Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>List a Resource for Sale</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createResourceMutation.mutate(newResource);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newResource.title}
                    onChange={(e) =>
                      setNewResource({ ...newResource, title: e.target.value })
                    }
                    placeholder="e.g., Data Structures Textbook"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newResource.resource_type}
                      onValueChange={(v) =>
                        setNewResource({ ...newResource, resource_type: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {resourceTypes
                          .filter((t) => t.value !== "all")
                          .map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select
                      value={newResource.condition}
                      onValueChange={(v) =>
                        setNewResource({ ...newResource, condition: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {conditions.map((cond) => (
                          <SelectItem key={cond.value} value={cond.value}>
                            {cond.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={newResource.subject}
                    onChange={(e) =>
                      setNewResource({ ...newResource, subject: e.target.value })
                    }
                    placeholder="e.g., Computer Science, Physics"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newResource.description}
                    onChange={(e) =>
                      setNewResource({ ...newResource, description: e.target.value })
                    }
                    placeholder="Describe your resource..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={newResource.price}
                    onChange={(e) =>
                      setNewResource({ ...newResource, price: e.target.value })
                    }
                    placeholder="0 for free"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createResourceMutation.isPending}
                >
                  {createResourceMutation.isPending ? "Listing..." : "List Resource"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, subject, or description..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {resourceTypes.map((type) => (
              <Button
                key={type.value}
                variant={typeFilter === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter(type.value)}
                className={
                  typeFilter === type.value
                    ? "bg-gradient-to-r from-universe-blue to-universe-purple"
                    : ""
                }
              >
                <type.icon className="w-4 h-4 mr-1" />
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Resources Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredResources?.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No resources found</h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "Try different search terms"
                : "Be the first to list a resource!"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources?.map((resource) => {
              const Icon = getTypeIcon(resource.resource_type);
              return (
                <div
                  key={resource.id}
                  className="bg-card border border-border rounded-xl overflow-hidden hover-lift"
                >
                  <div className="h-24 bg-gradient-to-br from-universe-blue/20 to-universe-purple/20 flex items-center justify-center relative">
                    <Icon className="w-10 h-10 text-muted-foreground" />
                    {resource.price !== null && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-background/90 px-2 py-1 rounded-full">
                        <IndianRupee className="w-3 h-3 text-primary" />
                        <span className="font-semibold text-sm">
                          {resource.price === 0 ? "Free" : resource.price}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1">{resource.title}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary" className="capitalize">
                          {resource.resource_type}
                        </Badge>
                        {resource.condition && (
                          <Badge
                            variant="outline"
                            className={getConditionColor(resource.condition)}
                          >
                            {resource.condition.replace("_", " ")}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {resource.subject && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GraduationCap className="w-4 h-4" />
                        <span>{resource.subject}</span>
                      </div>
                    )}

                    {resource.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {resource.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {formatDistanceToNow(new Date(resource.created_at!), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <Button size="sm" variant="outline">
                        Contact Seller
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AcademicResourcesPage;
