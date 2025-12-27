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
  Printer,
  Bike,
  MoreHorizontal,
  BadgeCheck,
  Navigation,
  Clock,
  ExternalLink,
} from "lucide-react";

// LPU coordinates
const LPU_LAT = 31.2554;
const LPU_LNG = 75.7049;

const categories = [
  { value: "all", label: "All Services", icon: MoreHorizontal },
  { value: "restaurant", label: "Restaurants", icon: UtensilsCrossed },
  { value: "cafe", label: "Cafes", icon: Coffee },
  { value: "laundry", label: "Laundry", icon: Shirt },
  { value: "print", label: "Print/Copy", icon: Printer },
  { value: "bike", label: "Bike Rental", icon: Bike },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

// Sample nearby places (these would normally come from Google Places API)
const nearbyPlaces = [
  {
    id: "p1",
    name: "Campus Cafe LPU",
    category: "cafe",
    rating: 4.2,
    reviews_count: 156,
    address: "Near Block 32, LPU Campus",
    phone: "+91 98765 43210",
    distance: "0.3 km",
    isOpen: true,
    openTime: "8:00 AM - 10:00 PM",
  },
  {
    id: "p2",
    name: "Quick Bites Restaurant",
    category: "restaurant",
    rating: 4.5,
    reviews_count: 234,
    address: "Gate 1, LPU",
    phone: "+91 98765 43211",
    distance: "0.5 km",
    isOpen: true,
    openTime: "10:00 AM - 11:00 PM",
  },
  {
    id: "p3",
    name: "Fresh & Clean Laundry",
    category: "laundry",
    rating: 4.0,
    reviews_count: 89,
    address: "Near Boys Hostel, Block 38",
    phone: "+91 98765 43212",
    distance: "0.8 km",
    isOpen: true,
    openTime: "9:00 AM - 8:00 PM",
  },
  {
    id: "p4",
    name: "Print Point Express",
    category: "print",
    rating: 4.3,
    reviews_count: 112,
    address: "Uni Mall, Ground Floor",
    phone: "+91 98765 43213",
    distance: "0.4 km",
    isOpen: true,
    openTime: "8:00 AM - 9:00 PM",
  },
  {
    id: "p5",
    name: "Campus Wheels Bike Rental",
    category: "bike",
    rating: 4.1,
    reviews_count: 67,
    address: "Gate 2, LPU Main Road",
    phone: "+91 98765 43214",
    distance: "1.2 km",
    isOpen: false,
    openTime: "7:00 AM - 7:00 PM",
  },
  {
    id: "p6",
    name: "Domino's Pizza",
    category: "restaurant",
    rating: 4.4,
    reviews_count: 345,
    address: "Gate 1 Market, LPU",
    phone: "+91 98765 43215",
    distance: "0.6 km",
    isOpen: true,
    openTime: "11:00 AM - 11:00 PM",
  },
  {
    id: "p7",
    name: "Starbucks Coffee",
    category: "cafe",
    rating: 4.6,
    reviews_count: 289,
    address: "Uni Mall, 1st Floor",
    phone: "+91 98765 43216",
    distance: "0.4 km",
    isOpen: true,
    openTime: "8:00 AM - 10:00 PM",
  },
  {
    id: "p8",
    name: "Speed Print Services",
    category: "print",
    rating: 3.9,
    reviews_count: 45,
    address: "Near Library, Block 34",
    phone: "+91 98765 43217",
    distance: "0.2 km",
    isOpen: true,
    openTime: "9:00 AM - 6:00 PM",
  },
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

  // Filter nearby places
  const filteredNearbyPlaces = nearbyPlaces.filter((place) => {
    const matchesSearch =
      place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      place.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || place.category === categoryFilter;
    return matchesSearch && matchesCategory;
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

  const getDirectionsUrl = (address: string) => {
    return `https://www.google.com/maps/dir/?api=1&origin=${LPU_LAT},${LPU_LNG}&destination=${encodeURIComponent(address)}`;
  };

  const isServiceProvider = profile?.role === "service_provider";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Nearby Services</h1>
            <p className="text-muted-foreground">
              Restaurants, cafes, laundry, print shops & bike rentals within 5km of LPU
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

        {/* Nearby Places Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Places Near LPU Campus
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNearbyPlaces.map((place) => {
              const Icon = getCategoryIcon(place.category);
              return (
                <div
                  key={place.id}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors"
                >
                  <div className="h-24 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative">
                    <Icon className="w-10 h-10 text-primary/60" />
                    <Badge
                      className={`absolute top-2 right-2 ${
                        place.isOpen
                          ? "bg-green-500/20 text-green-600 border-green-500/30"
                          : "bg-red-500/20 text-red-600 border-red-500/30"
                      }`}
                    >
                      {place.isOpen ? "Open" : "Closed"}
                    </Badge>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold line-clamp-1">{place.name}</h3>
                      <div className="flex items-center gap-1 text-amber-400 shrink-0">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-medium">{place.rating}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary" className="capitalize">
                        {place.category}
                      </Badge>
                      <span className="text-muted-foreground">
                        {place.reviews_count} reviews
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="line-clamp-1">{place.address}</span>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {place.distance}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>{place.openTime}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <a
                        href={`tel:${place.phone}`}
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full gap-1">
                          <Phone className="w-4 h-4" />
                          Call
                        </Button>
                      </a>
                      <a
                        href={getDirectionsUrl(place.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button size="sm" className="w-full gap-1">
                          <Navigation className="w-4 h-4" />
                          Directions
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User-submitted Services Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-primary" />
            Verified Local Services
          </h2>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-card rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredServices?.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <MoreHorizontal className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No verified services yet</h3>
              <p className="text-muted-foreground">
                Check out the nearby places above or add your own service
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

                      {service.address && (
                        <a
                          href={getDirectionsUrl(service.address)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline" className="w-full gap-2 mt-2">
                            <Navigation className="w-4 h-4" />
                            Get Directions
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LocalServicesPage;