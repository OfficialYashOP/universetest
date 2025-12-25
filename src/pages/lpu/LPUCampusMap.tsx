import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  ArrowLeft, 
  Search, 
  ZoomIn, 
  ZoomOut,
  Building,
  GraduationCap,
  Home,
  Utensils,
  Heart,
  Users,
  Navigation,
  ExternalLink,
  Phone
} from "lucide-react";
import { Link } from "react-router-dom";

// LPU Campus center coordinates: 31.2537° N, 75.7033° E
const LPU_CENTER = { lat: 31.2537, lng: 75.7033 };

// Campus locations with GPS coordinates based on the site plan
const campusLocations = [
  // Main Entrances
  { id: "main-gate-1a", name: "Main Gate 1A", category: "entry", block: "1A", lat: 31.2485, lng: 75.7025, phone: null },
  { id: "main-gate-1b", name: "Main Gate 1B", category: "entry", block: "1B", lat: 31.2488, lng: 75.7015, phone: null },
  
  // Health & Emergency
  { id: "03", name: "Uni Health Centre / Hospital", category: "health", block: "03", lat: 31.2545, lng: 75.7055, phone: "01824-444079" },
  
  // Academic Blocks - Row 1 (South)
  { id: "01", name: "School of Fashion Design", category: "academic", block: "01", lat: 31.2510, lng: 75.7030, phone: null },
  { id: "02a", name: "Mini Auditorium", category: "facility", block: "02A", lat: 31.2512, lng: 75.7035, phone: null },
  { id: "02b", name: "Campus Café", category: "food", block: "02B", lat: 31.2512, lng: 75.7040, phone: null },
  { id: "03a", name: "School of Paramedical Sciences", category: "academic", block: "03A", lat: 31.2515, lng: 75.7050, phone: null },
  { id: "03b", name: "School of Pharmacy", category: "academic", block: "03B", lat: 31.2518, lng: 75.7055, phone: null },
  
  // Academic Blocks - Row 2
  { id: "08a", name: "School of Architecture & Design", category: "academic", block: "08A", lat: 31.2525, lng: 75.7060, phone: null },
  { id: "08b", name: "School of Pharmacy (Block 08B)", category: "academic", block: "08B", lat: 31.2528, lng: 75.7065, phone: null },
  
  // Girls Hostels (South-East)
  { id: "09", name: "Girl's Hostel 1 (GH-1)", category: "hostel", block: "09", lat: 31.2520, lng: 75.7080, phone: "01824-444081" },
  { id: "10", name: "Girl's Hostel 2 (GH-2)", category: "hostel", block: "10", lat: 31.2525, lng: 75.7085, phone: "01824-444082" },
  { id: "11", name: "Girl's Hostel 3 (GH-3)", category: "hostel", block: "11", lat: 31.2530, lng: 75.7090, phone: "01824-444083" },
  { id: "12", name: "Girl's Hostel 4 (GH-4)", category: "hostel", block: "12", lat: 31.2535, lng: 75.7085, phone: "01824-444084" },
  { id: "21a", name: "Girl's Hostel 5 (GH-5)", category: "hostel", block: "21A", lat: 31.2555, lng: 75.7080, phone: "01824-444303" },
  { id: "21b", name: "Girl's Hostel 6 (GH-6)", category: "hostel", block: "21B", lat: 31.2560, lng: 75.7075, phone: "01824-444301" },
  
  // Administrative & Student Affairs
  { id: "13", name: "Division of Student Affairs (DSA)", category: "admin", block: "13", lat: 31.2540, lng: 75.7070, phone: null },
  { id: "29", name: "Office of Pro-Chancellor / Academic Affairs", category: "admin", block: "29", lat: 31.2565, lng: 75.7040, phone: null },
  { id: "30", name: "The Chancellory / HR Division", category: "admin", block: "30", lat: 31.2568, lng: 75.7035, phone: null },
  { id: "31", name: "Division of Admissions", category: "admin", block: "31", lat: 31.2570, lng: 75.7030, phone: null },
  { id: "32", name: "Office of Vice Chancellor / Examination", category: "admin", block: "32", lat: 31.2572, lng: 75.7025, phone: null },
  
  // Business & Management Schools
  { id: "14", name: "School of Business", category: "academic", block: "14", lat: 31.2545, lng: 75.7065, phone: null },
  { id: "15a", name: "Unicenter (Food Court & Shopping)", category: "food", block: "15A", lat: 31.2548, lng: 75.7060, phone: null },
  { id: "15b", name: "School of Hotel Management", category: "academic", block: "15B", lat: 31.2550, lng: 75.7055, phone: null },
  
  // Arts, Languages & Law
  { id: "18", name: "School of Arts and Languages", category: "academic", block: "18", lat: 31.2555, lng: 75.7050, phone: null },
  { id: "20", name: "School of Law", category: "academic", block: "20", lat: 31.2560, lng: 75.7065, phone: null },
  
  // Main Stage & Auditoriums
  { id: "19", name: "Sh. Baldev Raj Mittal Main Stage", category: "facility", block: "19", lat: 31.2558, lng: 75.7058, phone: null },
  { id: "35", name: "Shanti Devi Mittal Auditorium", category: "facility", block: "35", lat: 31.2575, lng: 75.7015, phone: null },
  
  // Agriculture & Sciences
  { id: "25", name: "School of Agriculture", category: "academic", block: "25", lat: 31.2562, lng: 75.7045, phone: null },
  { id: "26", name: "School of Agriculture SEEE", category: "academic", block: "26", lat: 31.2565, lng: 75.7050, phone: null },
  { id: "27", name: "School of Physical Sciences", category: "academic", block: "27", lat: 31.2568, lng: 75.7055, phone: null },
  { id: "28", name: "School of Biotechnology", category: "academic", block: "28", lat: 31.2570, lng: 75.7060, phone: null },
  
  // Engineering & Technology Schools
  { id: "33", name: "School of Computer Sciences & Engineering", category: "academic", block: "33", lat: 31.2580, lng: 75.7020, phone: null },
  { id: "34", name: "School of Computer Science & Engineering (Block 34)", category: "academic", block: "34", lat: 31.2578, lng: 75.7015, phone: null },
  { id: "36", name: "School of Electronics & Electrical Engineering", category: "academic", block: "36", lat: 31.2582, lng: 75.7010, phone: null },
  { id: "38", name: "DRD School of Computer Application", category: "academic", block: "38", lat: 31.2585, lng: 75.7005, phone: null },
  { id: "55", name: "School of Mechanical Engineering", category: "academic", block: "55", lat: 31.2610, lng: 75.6995, phone: null },
  { id: "56", name: "School of Civil Engineering", category: "academic", block: "56", lat: 31.2612, lng: 75.6990, phone: null },
  { id: "57", name: "School of Polytechnic", category: "academic", block: "57", lat: 31.2615, lng: 75.6985, phone: null },
  
  // Library & Central Facilities
  { id: "37", name: "Central Library", category: "facility", block: "37", lat: 31.2580, lng: 75.7000, phone: null },
  { id: "40", name: "Central Store", category: "facility", block: "40", lat: 31.2590, lng: 75.7010, phone: null },
  { id: "58", name: "Workshops", category: "facility", block: "58", lat: 31.2618, lng: 75.6980, phone: null },
  
  // Boys Hostels (North)
  { id: "45", name: "Boys Hostel 1 (BH-1)", category: "hostel", block: "45", lat: 31.2595, lng: 75.7050, phone: "01824-444521" },
  { id: "47", name: "Boys Hostel 7 (BH-7)", category: "hostel", block: "47", lat: 31.2600, lng: 75.7055, phone: "01824-444536" },
  { id: "48", name: "Boys Hostel 2 (BH-2)", category: "hostel", block: "48", lat: 31.2598, lng: 75.7045, phone: "01824-444524" },
  { id: "49", name: "Boys Hostel 3 (BH-3)", category: "hostel", block: "49", lat: 31.2602, lng: 75.7040, phone: "01824-444526" },
  { id: "50", name: "Boys Hostel 3A (BH-3A)", category: "hostel", block: "50", lat: 31.2605, lng: 75.7035, phone: "01824-444527" },
  { id: "51a", name: "Boys Hostel 4 (BH-4)", category: "hostel", block: "51A", lat: 31.2608, lng: 75.7030, phone: "01824-444529" },
  { id: "51b", name: "Boys Hostel 4 (BH-4B)", category: "hostel", block: "51B", lat: 31.2610, lng: 75.7025, phone: "01824-444529" },
  { id: "52", name: "Cricket Ground", category: "sports", block: "52", lat: 31.2615, lng: 75.7045, phone: null },
  { id: "53", name: "Boys Hostel 5 (BH-5)", category: "hostel", block: "53", lat: 31.2612, lng: 75.7020, phone: "01824-444530" },
  { id: "54", name: "Boys Hostel 6 (BH-6)", category: "hostel", block: "54", lat: 31.2608, lng: 75.7015, phone: "01824-444532" },
  { id: "bh8", name: "Boys Hostel 8 (BH-8)", category: "hostel", block: "BH-8", lat: 31.2606, lng: 75.7010, phone: "01824-444528" },
  
  // Food & Recreation
  { id: "food-carnival", name: "Food Carnival Arena", category: "food", block: "20", lat: 31.2552, lng: 75.7072, phone: null },
  { id: "shopper-street", name: "Shopper Street", category: "food", block: "20", lat: 31.2548, lng: 75.7075, phone: null },
  { id: "mega-events", name: "Mega Events Ground", category: "sports", block: "19", lat: 31.2545, lng: 75.7068, phone: null },
  
  // Playgrounds
  { id: "playground-north", name: "North Playground (Demo Matches for Boys)", category: "sports", block: "52", lat: 31.2620, lng: 75.7050, phone: null },
  { id: "playground-south", name: "South Playground", category: "sports", block: "9", lat: 31.2515, lng: 75.7075, phone: null },
  
  // Kiosks
  { id: "kiosk-1", name: "Kiosk (Near Block 42)", category: "food", block: "42", lat: 31.2585, lng: 75.7055, phone: null },
  { id: "kiosk-2", name: "Kiosk (Near Block 33)", category: "food", block: "33", lat: 31.2575, lng: 75.7025, phone: null },
  { id: "kiosk-3", name: "Kiosk (Near Boys Hostel)", category: "food", block: "45", lat: 31.2592, lng: 75.7048, phone: null },
  
  // Swimming Pool & Staff
  { id: "42", name: "Swimming Pool (Under Construction)", category: "sports", block: "42", lat: 31.2590, lng: 75.7060, phone: null },
  { id: "41a", name: "Staff Apartments A", category: "residential", block: "41A", lat: 31.2592, lng: 75.7065, phone: null },
  { id: "41b", name: "Staff Apartments B", category: "residential", block: "41B", lat: 31.2594, lng: 75.7068, phone: null },
  { id: "41c", name: "Staff Apartments C", category: "residential", block: "41C", lat: 31.2596, lng: 75.7070, phone: null },
  { id: "41d", name: "Staff Apartments D", category: "residential", block: "41D", lat: 31.2598, lng: 75.7072, phone: null },
];

const categoryIcons: Record<string, typeof Building> = {
  academic: GraduationCap,
  hostel: Home,
  food: Utensils,
  health: Heart,
  admin: Users,
  facility: Building,
  sports: MapPin,
  entry: MapPin,
  residential: Home,
};

const categoryColors: Record<string, string> = {
  academic: "text-blue-500 bg-blue-500/10",
  hostel: "text-purple-500 bg-purple-500/10",
  food: "text-orange-500 bg-orange-500/10",
  health: "text-green-500 bg-green-500/10",
  admin: "text-gray-500 bg-gray-500/10",
  facility: "text-cyan-500 bg-cyan-500/10",
  sports: "text-emerald-500 bg-emerald-500/10",
  entry: "text-red-500 bg-red-500/10",
  residential: "text-indigo-500 bg-indigo-500/10",
};

const LPUCampusMap = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<typeof campusLocations[0] | null>(null);
  const [zoom, setZoom] = useState(1);
  const mapRef = useRef<HTMLDivElement>(null);

  const filteredLocations = campusLocations.filter((loc) => {
    const matchesSearch = 
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.block.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || loc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(campusLocations.map(l => l.category))];

  const openInGoogleMaps = (lat: number, lng: number, name: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(name)}`;
    window.open(url, '_blank');
  };

  const getDirections = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone.replace(/-/g, '')}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/lpu">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Campus Map</h1>
            <p className="text-muted-foreground">Navigate LPU Campus • {campusLocations.length} locations</p>
          </div>
        </div>

        {/* Map View */}
        <Card className="overflow-hidden">
          <CardContent className="p-0 relative">
            <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
              <Button 
                size="icon" 
                variant="secondary"
                onClick={() => setZoom(Math.min(zoom + 0.25, 3))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button 
                size="icon" 
                variant="secondary"
                onClick={() => setZoom(Math.max(zoom - 0.25, 0.5))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={() => openInGoogleMaps(LPU_CENTER.lat, LPU_CENTER.lng, "Lovely Professional University")}
                title="Open in Google Maps"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <div 
              ref={mapRef}
              className="overflow-auto max-h-[400px]"
              style={{ cursor: 'grab' }}
            >
              <img 
                src="/images/lpu-campus-map.jpg" 
                alt="LPU Campus Map"
                className="w-full transition-transform"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search block, building, or hostel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          <Button
            size="sm"
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
          >
            All ({campusLocations.length})
          </Button>
          {categories.map((cat) => {
            const Icon = categoryIcons[cat] || Building;
            const count = campusLocations.filter(l => l.category === cat).length;
            return (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
                className="capitalize whitespace-nowrap"
              >
                <Icon className={`w-4 h-4 mr-1`} />
                {cat} ({count})
              </Button>
            );
          })}
        </div>

        {/* Selected Location Details */}
        {selectedLocation && (
          <Card className="border-primary">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={categoryColors[selectedLocation.category]}>
                      {selectedLocation.category}
                    </Badge>
                    <span className="text-sm text-muted-foreground">Block {selectedLocation.block}</span>
                  </div>
                  <h3 className="font-semibold text-lg">{selectedLocation.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    📍 {selectedLocation.lat.toFixed(4)}°N, {selectedLocation.lng.toFixed(4)}°E
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSelectedLocation(null)}
                >
                  ×
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button 
                  size="sm"
                  onClick={() => getDirections(selectedLocation.lat, selectedLocation.lng)}
                >
                  <Navigation className="w-4 h-4 mr-1" />
                  Get Directions
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openInGoogleMaps(selectedLocation.lat, selectedLocation.lng, selectedLocation.name)}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Open in Maps
                </Button>
                {selectedLocation.phone && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCall(selectedLocation.phone!)}
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Call
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Locations List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Campus Locations</span>
              <Badge variant="secondary">{filteredLocations.length} found</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[350px]">
              <div className="divide-y">
                {filteredLocations.map((location) => {
                  const Icon = categoryIcons[location.category] || Building;
                  const isSelected = selectedLocation?.id === location.id;
                  return (
                    <div 
                      key={location.id}
                      className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer ${isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                      onClick={() => setSelectedLocation(location)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${categoryColors[location.category]}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{location.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Block {location.block}</span>
                            <span>•</span>
                            <span>{location.lat.toFixed(3)}°N</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {location.phone && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCall(location.phone!);
                              }}
                            >
                              <Phone className="w-4 h-4 text-green-500" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              getDirections(location.lat, location.lng);
                            }}
                          >
                            <Navigation className="w-4 h-4 text-blue-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Map Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-xs">
              {Object.entries(categoryColors).map(([cat, colorClass]) => {
                const Icon = categoryIcons[cat] || Building;
                const count = campusLocations.filter(l => l.category === cat).length;
                return (
                  <div 
                    key={cat} 
                    className={`flex items-center gap-2 capitalize p-2 rounded-lg ${colorClass}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{cat} ({count})</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-blue-500">{campusLocations.filter(l => l.category === 'academic').length}</p>
              <p className="text-xs text-muted-foreground">Academic Blocks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-purple-500">{campusLocations.filter(l => l.category === 'hostel').length}</p>
              <p className="text-xs text-muted-foreground">Hostels</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-orange-500">{campusLocations.filter(l => l.category === 'food').length}</p>
              <p className="text-xs text-muted-foreground">Food Spots</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-cyan-500">{campusLocations.filter(l => l.category === 'facility').length}</p>
              <p className="text-xs text-muted-foreground">Facilities</p>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground text-center pb-4">
          Tap any location for directions • GPS coordinates are approximate
        </p>
      </div>
    </DashboardLayout>
  );
};

export default LPUCampusMap;
