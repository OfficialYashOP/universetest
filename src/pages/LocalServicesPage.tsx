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
  MapPin,
  Phone,
  Globe,
  Star,
  UtensilsCrossed,
  Coffee,
  Shirt,
  ShoppingBag,
  MoreHorizontal,
  BadgeCheck,
} from "lucide-react";

const categories = [
  { value: "all", label: "All Services", icon: MoreHorizontal },
  { value: "restaurant", label: "Restaurants", icon: UtensilsCrossed },
  { value: "cafe", label: "Cafes", icon: Coffee },
  { value: "laundry", label: "Laundry", icon: Shirt },
  { value: "grocery", label: "Grocery", icon: ShoppingBag },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

const LocalServicesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const [newService, setNewService] = useState({
    name: "",
    description: "",
    category: "restaurant",
    address: "",
    phone: "",
    website: "",
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ["local-services", categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from("local_services")
        .select("*")
        .eq("is_admin_approved", true)
        .order("rating", { ascending: false });

      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: async (serviceData: typeof newService) => {
      if (!user || !profile?.university_id) throw new Error("Not authenticated");

      const { error } = await supabase.from("local_services").insert({
        ...serviceData,
        user_id: user.id,
        university_id: profile.university_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["local-services"] });
      toast({
        title: "Service submitted",
        description: "Your service listing is pending admin approval.",
      });
      setIsDialogOpen(false);
      setNewService({
        name: "",
        description: "",
        category: "restaurant",
        address: "",
        phone: "",
        website: "",
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

  const filteredServices = services?.filter(
    (service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    const cat = categories.find((c) => c.value === category);
    return cat?.icon || MoreHorizontal;
  };

  const isServiceProvider = profile?.role === "service_provider";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Local Services</h1>
            <p className="text-muted-foreground">
              Discover trusted restaurants, cafes, and essential services near campus
            </p>
          </div>
          
          {isServiceProvider && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-universe-blue to-universe-purple hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Service</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createServiceMutation.mutate(newService);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>Service Name</Label>
                    <Input
                      value={newService.name}
                      onChange={(e) =>
                        setNewService({ ...newService, name: e.target.value })
                      }
                      placeholder="e.g., Campus Cafe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newService.category}
                      onValueChange={(v) =>
                        setNewService({ ...newService, category: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter((c) => c.value !== "all")
                          .map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newService.description}
                      onChange={(e) =>
                        setNewService({ ...newService, description: e.target.value })
                      }
                      placeholder="Describe your service..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={newService.address}
                      onChange={(e) =>
                        setNewService({ ...newService, address: e.target.value })
                      }
                      placeholder="Near Gate 3, LPU"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={newService.phone}
                        onChange={(e) =>
                          setNewService({ ...newService, phone: e.target.value })
                        }
                        placeholder="+91 9876543210"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input
                        value={newService.website}
                        onChange={(e) =>
                          setNewService({ ...newService, website: e.target.value })
                        }
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createServiceMutation.isPending}
                  >
                    {createServiceMutation.isPending ? "Submitting..." : "Submit for Approval"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat.value}
                variant={categoryFilter === cat.value ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(cat.value)}
                className={
                  categoryFilter === cat.value
                    ? "bg-gradient-to-r from-universe-blue to-universe-purple"
                    : ""
                }
              >
                <cat.icon className="w-4 h-4 mr-1" />
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredServices?.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <MoreHorizontal className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No services found</h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "Try different search terms"
                : "No services in this category yet"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices?.map((service) => {
              const Icon = getCategoryIcon(service.category);
              return (
                <div
                  key={service.id}
                  className="bg-card border border-border rounded-xl overflow-hidden hover-lift"
                >
                  <div className="h-32 bg-gradient-to-br from-universe-blue/20 to-universe-purple/20 flex items-center justify-center">
                    <Icon className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{service.name}</h3>
                          {service.is_verified && (
                            <BadgeCheck className="w-4 h-4 text-universe-cyan" />
                          )}
                        </div>
                        <Badge variant="secondary" className="mt-1 capitalize">
                          {service.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-medium">
                          {service.rating?.toFixed(1) || "New"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({service.reviews_count || 0})
                        </span>
                      </div>
                    </div>
                    
                    {service.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {service.description}
                      </p>
                    )}

                    <div className="space-y-2 text-sm">
                      {service.address && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="truncate">{service.address}</span>
                        </div>
                      )}
                      {service.phone && (
                        <a
                          href={`tel:${service.phone}`}
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Phone className="w-4 h-4" />
                          <span>{service.phone}</span>
                        </a>
                      )}
                      {service.website && (
                        <a
                          href={service.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Globe className="w-4 h-4" />
                          <span>Visit Website</span>
                        </a>
                      )}
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

export default LocalServicesPage;
