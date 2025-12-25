import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Building2, 
  Search, 
  Plus,
  MapPin,
  IndianRupee,
  Users,
  Phone,
  Filter,
  Loader2,
  Home,
  BadgeCheck,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HousingListing {
  id: string;
  title: string;
  description: string | null;
  listing_type: string;
  location: string | null;
  address: string | null;
  price: number | null;
  room_type: string | null;
  gender_preference: string | null;
  amenities: string[] | null;
  contact_phone: string | null;
  is_verified: boolean;
  created_at: string;
  user_id: string;
  owner?: {
    full_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

const listingTypes = [
  { value: "all", label: "All Types" },
  { value: "pg", label: "PG/Hostel" },
  { value: "flat", label: "Flat/Apartment" },
  { value: "roommate", label: "Roommate Wanted" },
  { value: "room", label: "Single Room" },
];

const genderOptions = [
  { value: "any", label: "Any" },
  { value: "male", label: "Male Only" },
  { value: "female", label: "Female Only" },
];

const roomTypes = [
  { value: "single", label: "Single" },
  { value: "double", label: "Double Sharing" },
  { value: "triple", label: "Triple Sharing" },
  { value: "any", label: "Any" },
];

const amenitiesList = [
  "WiFi", "AC", "Attached Bathroom", "Food Included", 
  "Laundry", "Parking", "Power Backup", "Security"
];

const HousingPage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  
  const [listings, setListings] = useState<HousingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [genderFilter, setGenderFilter] = useState("any");
  const [showFilters, setShowFilters] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New listing form
  const [newListing, setNewListing] = useState({
    title: "",
    description: "",
    listing_type: "pg",
    location: "",
    address: "",
    price: "",
    room_type: "single",
    gender_preference: "any",
    amenities: [] as string[],
    contact_phone: "",
  });

  useEffect(() => {
    const fetchListings = async () => {
      if (!profile?.university_id) return;

      setLoading(true);
      
      const { data, error } = await supabase
        .from("housing_listings")
        .select("*")
        .eq("university_id", profile.university_id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching listings:", error);
        setLoading(false);
        return;
      }

      // Fetch owner profiles
      const userIds = [...new Set(data?.map(l => l.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, is_verified")
        .in("id", userIds);

      const profilesMap: Record<string, any> = {};
      profiles?.forEach(p => profilesMap[p.id] = p);

      setListings(data?.map(l => ({ ...l, owner: profilesMap[l.user_id] })) || []);
      setLoading(false);
    };

    fetchListings();
  }, [profile?.university_id]);

  const filteredListings = listings.filter(listing => {
    const matchesSearch = 
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || listing.listing_type === typeFilter;
    
    const matchesPrice = 
      (!priceRange.min || (listing.price && listing.price >= Number(priceRange.min))) &&
      (!priceRange.max || (listing.price && listing.price <= Number(priceRange.max)));
    
    const matchesGender = 
      genderFilter === "any" || 
      listing.gender_preference === "any" || 
      listing.gender_preference === genderFilter;
    
    return matchesSearch && matchesType && matchesPrice && matchesGender;
  });

  const handleCreateListing = async () => {
    if (!user || !profile?.university_id) return;
    
    if (!newListing.title.trim()) {
      toast({ title: "Error", description: "Please enter a title", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from("housing_listings")
      .insert({
        title: newListing.title.trim(),
        description: newListing.description.trim() || null,
        listing_type: newListing.listing_type,
        location: newListing.location.trim() || null,
        address: newListing.address.trim() || null,
        price: newListing.price ? Number(newListing.price) : null,
        room_type: newListing.room_type,
        gender_preference: newListing.gender_preference,
        amenities: newListing.amenities,
        contact_phone: newListing.contact_phone.trim() || null,
        user_id: user.id,
        university_id: profile.university_id,
      })
      .select()
      .single();

    setIsSubmitting(false);

    if (error) {
      toast({ title: "Error", description: "Failed to create listing", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Listing created successfully!" });
    setListings(prev => [{ ...data, owner: { full_name: profile.full_name, avatar_url: profile.avatar_url, is_verified: profile.is_verified } }, ...prev]);
    setIsDialogOpen(false);
    setNewListing({
      title: "",
      description: "",
      listing_type: "pg",
      location: "",
      address: "",
      price: "",
      room_type: "single",
      gender_preference: "any",
      amenities: [],
      contact_phone: "",
    });
  };

  const toggleAmenity = (amenity: string) => {
    setNewListing(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              Housing & Roommates
            </h1>
            <p className="text-muted-foreground">
              Find verified PGs, flats, and roommates near campus
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Post Listing
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Housing Listing</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    placeholder="e.g., Spacious PG near Gate 2"
                    value={newListing.title}
                    onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Listing Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {listingTypes.slice(1).map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setNewListing({ ...newListing, listing_type: type.value })}
                        className={cn(
                          "p-2 rounded-lg border text-sm transition-colors",
                          newListing.listing_type === type.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      placeholder="e.g., Near Gate 2"
                      value={newListing.location}
                      onChange={(e) => setNewListing({ ...newListing, location: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price (₹/month)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 8000"
                      value={newListing.price}
                      onChange={(e) => setNewListing({ ...newListing, price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Room Type</Label>
                    <select
                      value={newListing.room_type}
                      onChange={(e) => setNewListing({ ...newListing, room_type: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-muted border border-border"
                    >
                      {roomTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Gender Preference</Label>
                    <select
                      value={newListing.gender_preference}
                      onChange={(e) => setNewListing({ ...newListing, gender_preference: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-muted border border-border"
                    >
                      {genderOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    placeholder="Full address"
                    value={newListing.address}
                    onChange={(e) => setNewListing({ ...newListing, address: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    placeholder="+91 1234567890"
                    value={newListing.contact_phone}
                    onChange={(e) => setNewListing({ ...newListing, contact_phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Amenities</Label>
                  <div className="flex flex-wrap gap-2">
                    {amenitiesList.map((amenity) => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={cn(
                          "px-3 py-1 rounded-full text-sm border transition-colors",
                          newListing.amenities.includes(amenity)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe your listing..."
                    rows={3}
                    value={newListing.description}
                    onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleCreateListing}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Post Listing"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search & Filters */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by location, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {/* Type Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {listingTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setTypeFilter(type.value)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                  typeFilter === type.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="bg-card border border-border rounded-xl p-4 grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Min Price (₹)</Label>
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Price (₹)</Label>
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-muted border border-border"
                >
                  {genderOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No listings found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {listing.listing_type}
                      </Badge>
                      {listing.gender_preference && listing.gender_preference !== "any" && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          {listing.gender_preference}
                        </Badge>
                      )}
                      {listing.is_verified && (
                        <Badge className="bg-universe-cyan/20 text-universe-cyan border-0 text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg">{listing.title}</h3>
                  </div>
                  {listing.price && (
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary flex items-center">
                        <IndianRupee className="w-4 h-4" />
                        {listing.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">/month</p>
                    </div>
                  )}
                </div>

                {listing.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                    <MapPin className="w-4 h-4" />
                    {listing.location}
                  </p>
                )}

                {listing.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {listing.description}
                  </p>
                )}

                {listing.amenities && listing.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {listing.amenities.slice(0, 4).map((amenity) => (
                      <span
                        key={amenity}
                        className="text-xs bg-muted px-2 py-1 rounded-full"
                      >
                        {amenity}
                      </span>
                    ))}
                    {listing.amenities.length > 4 && (
                      <span className="text-xs text-muted-foreground">
                        +{listing.amenities.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={listing.owner?.avatar_url || ""} />
                      <AvatarFallback className="bg-muted text-xs">
                        {getInitials(listing.owner?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{listing.owner?.full_name || "Unknown"}</span>
                        {listing.owner?.is_verified && (
                          <BadgeCheck className="w-4 h-4 text-universe-cyan" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {listing.contact_phone && (
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                      <a href={`tel:${listing.contact_phone}`}>
                        <Phone className="w-4 h-4" />
                        Contact
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HousingPage;
