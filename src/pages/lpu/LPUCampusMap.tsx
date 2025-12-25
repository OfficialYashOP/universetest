import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Users
} from "lucide-react";
import { Link } from "react-router-dom";

// Campus locations based on the site plan
const campusLocations = [
  { id: "01", name: "School of Fashion Design", category: "academic", block: "01" },
  { id: "02a", name: "Mini Auditorium", category: "facility", block: "02A" },
  { id: "02b", name: "Campus Café", category: "food", block: "02B" },
  { id: "03a", name: "School of Paramedical Sciences", category: "academic", block: "03A" },
  { id: "03b", name: "School of Pharmacy", category: "academic", block: "03B" },
  { id: "08c", name: "Uni Hospital / Health Centre", category: "health", block: "03" },
  { id: "08a", name: "School of Architecture & Design", category: "academic", block: "08A" },
  { id: "08b", name: "School of Pharmacy", category: "academic", block: "08B" },
  { id: "09", name: "Girl's Hostel 1", category: "hostel", block: "09" },
  { id: "10", name: "Girl's Hostel 2", category: "hostel", block: "10" },
  { id: "11", name: "Girl's Hostel 3", category: "hostel", block: "11" },
  { id: "12", name: "Girl's Hostel 4", category: "hostel", block: "12" },
  { id: "13", name: "Division of Student Affairs", category: "admin", block: "13" },
  { id: "14", name: "School of Business", category: "academic", block: "14" },
  { id: "15a", name: "Unicenter", category: "facility", block: "15A" },
  { id: "15b", name: "School of Hotel Management", category: "academic", block: "15B" },
  { id: "18", name: "School of Arts and Languages", category: "academic", block: "18" },
  { id: "19", name: "Sh. Baldev Raj Mittal Main Stage", category: "facility", block: "19" },
  { id: "20", name: "School of Law", category: "academic", block: "20" },
  { id: "21a", name: "Girl's Hostel 5", category: "hostel", block: "21A" },
  { id: "21b", name: "Girl's Hostel 6", category: "hostel", block: "21B" },
  { id: "25", name: "School of Agriculture", category: "academic", block: "25" },
  { id: "26", name: "School of Agriculture SEEE", category: "academic", block: "26" },
  { id: "27", name: "School of Physical Sciences PEP Faculty CSE", category: "academic", block: "27" },
  { id: "28", name: "School of Biotechnology", category: "academic", block: "28" },
  { id: "29", name: "Office of the Pro-Chancellor / Division of Academic Affairs", category: "admin", block: "29" },
  { id: "30", name: "The Chancellory / Division of Human Resources", category: "admin", block: "30" },
  { id: "31", name: "Division of Admissions / Museum of Academics", category: "admin", block: "31" },
  { id: "32", name: "Office of the Vice Chancellor / Division of Examination", category: "admin", block: "32" },
  { id: "33", name: "School of Computer Sciences and Engineering", category: "academic", block: "33" },
  { id: "34", name: "School of Computer Science & Engineering", category: "academic", block: "34" },
  { id: "35", name: "Shanti Devi Mittal Auditorium", category: "facility", block: "35" },
  { id: "36", name: "School of Electronics & Electrical Engineering", category: "academic", block: "36" },
  { id: "37", name: "Central Library", category: "facility", block: "37" },
  { id: "38", name: "DRD School of Computer Application", category: "academic", block: "38" },
  { id: "40", name: "Central Store", category: "facility", block: "40" },
  { id: "45", name: "Boys Hostel 1", category: "hostel", block: "45" },
  { id: "47", name: "Boys Hostel 7", category: "hostel", block: "47" },
  { id: "48", name: "Boys Hostel 2", category: "hostel", block: "48" },
  { id: "49", name: "Boys Hostel 3", category: "hostel", block: "49" },
  { id: "50", name: "Boys Hostel 3A", category: "hostel", block: "50" },
  { id: "51a", name: "Boys Hostel 4", category: "hostel", block: "51A" },
  { id: "51b", name: "Boys Hostel 4", category: "hostel", block: "51B" },
  { id: "52", name: "Cricket Ground", category: "sports", block: "52" },
  { id: "53", name: "Boys Hostel 5", category: "hostel", block: "53" },
  { id: "54", name: "Boys Hostel 6", category: "hostel", block: "54" },
  { id: "55", name: "School of Mechanical Engineering", category: "academic", block: "55" },
  { id: "56", name: "School of Civil Engineering", category: "academic", block: "56" },
  { id: "57", name: "School of Polytechnic", category: "academic", block: "57" },
  { id: "58", name: "Workshops", category: "facility", block: "58" },
  { id: "main-gate", name: "Main Gate", category: "entry", block: "1A" },
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
};

const categoryColors: Record<string, string> = {
  academic: "text-blue-500",
  hostel: "text-purple-500",
  food: "text-orange-500",
  health: "text-green-500",
  admin: "text-gray-500",
  facility: "text-cyan-500",
  sports: "text-emerald-500",
  entry: "text-red-500",
};

const LPUCampusMap = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const filteredLocations = campusLocations.filter((loc) => {
    const matchesSearch = 
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.block.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || loc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(campusLocations.map(l => l.category))];

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
            <p className="text-muted-foreground">Navigate LPU Campus</p>
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
            </div>
            <div 
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
            placeholder="Search block or building name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            size="sm"
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map((cat) => {
            const Icon = categoryIcons[cat] || Building;
            return (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
                className="capitalize whitespace-nowrap"
              >
                <Icon className={`w-4 h-4 mr-1 ${categoryColors[cat]}`} />
                {cat}
              </Button>
            );
          })}
        </div>

        {/* Locations List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Campus Locations ({filteredLocations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <div className="divide-y">
                {filteredLocations.map((location) => {
                  const Icon = categoryIcons[location.category] || Building;
                  return (
                    <div 
                      key={location.id}
                      className="p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${categoryColors[location.category]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{location.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Block {location.block}
                          </p>
                        </div>
                        <span className="text-xs bg-muted px-2 py-1 rounded capitalize">
                          {location.category}
                        </span>
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {Object.entries(categoryColors).map(([cat, color]) => {
                const Icon = categoryIcons[cat] || Building;
                return (
                  <div key={cat} className="flex items-center gap-2 capitalize">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span>{cat}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default LPUCampusMap;
