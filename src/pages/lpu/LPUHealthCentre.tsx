import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Heart, 
  ArrowLeft, 
  Search,
  Clock,
  Stethoscope,
  Brain,
  UserCheck,
  Building
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface HealthStaff {
  id: string;
  name: string;
  designation: string | null;
  specialization: string | null;
  role_type: string;
  uid: string | null;
  timings: string | null;
  office_contact: string | null;
  created_at: string;
}

interface HealthDirectory {
  id: string;
  department: string;
  phone_numbers: string[];
}

const healthCentreInfo = {
  availability: "24x7x365",
  shifts: [
    { name: "Morning Shift", timing: "6:00 AM to 2:00 PM" },
    { name: "Evening Shift", timing: "2:00 PM to 10:00 PM" },
    { name: "Night Shift", timing: "10:00 PM to 6:00 AM" },
  ],
  location: "Block No. 03",
  beds: 31,
  ambulances: 6,
  consultationCharges: "Free",
  opdServices: [
    "General Medicine",
    "General Surgery",
    "Eye Consultation and Eye Testing",
    "Dental Consultation and Procedures",
    "Gynae Consultation",
    "ENT Consultation",
    "Skin Consultation",
    "Ayurvedic Consultation",
    "Psychological Consultation"
  ]
};

const LPUHealthCentre = () => {
  const [staff, setStaff] = useState<HealthStaff[]>([]);
  const [directory, setDirectory] = useState<HealthDirectory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [staffRes, dirRes] = await Promise.all([
      supabase.rpc("get_health_staff_public"),
      supabase.from("lpu_health_directory").select("*").order("department"),
    ]);
    
    if (staffRes.data) {
      // Sort by name client-side since RPC doesn't support .order()
      const sortedStaff = [...staffRes.data].sort((a, b) => a.name.localeCompare(b.name));
      setStaff(sortedStaff);
    }
    if (dirRes.data) setDirectory(dirRes.data);
    setLoading(false);
  };

  const handleCall = (number: string) => {
    window.location.href = `tel:${number.replace(/-/g, '')}`;
  };

  const doctors = staff.filter(s => s.role_type === 'doctor');
  const visitingDoctors = staff.filter(s => s.role_type === 'visiting_doctor');
  const psychologists = staff.filter(s => s.role_type === 'psychologist');

  const filteredStaff = (list: HealthStaff[]) => 
    list.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.specialization && s.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const StaffCard = ({ person }: { person: HealthStaff }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{person.name}</h3>
              {person.designation && (
                <p className="text-sm text-muted-foreground">{person.designation}</p>
              )}
            </div>
            {person.uid && (
              <Badge variant="secondary" className="text-xs">
                UID: {person.uid}
              </Badge>
            )}
          </div>
          
          {person.specialization && (
            <p className="text-sm">
              <Stethoscope className="w-3 h-3 inline mr-1" />
              {person.specialization}
            </p>
          )}
          
          {person.timings && (
            <p className="text-xs text-muted-foreground">
              <Clock className="w-3 h-3 inline mr-1" />
              {person.timings}
            </p>
          )}
          
          <div className="flex flex-wrap gap-2 mt-2">
            {person.office_contact && (
              <Button size="sm" onClick={() => handleCall(person.office_contact!)}>
                <Phone className="w-4 h-4 mr-1" />
                Call
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
            <h1 className="text-2xl font-bold">Uni Health Centre</h1>
            <p className="text-muted-foreground">Block No. 03</p>
          </div>
        </div>

        {/* Status Banner */}
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="font-semibold text-green-600">Open 24×7</span>
              </div>
              <Button size="sm" onClick={() => handleCall("01824-444079")}>
                <Phone className="w-4 h-4 mr-1" />
                Reception
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center text-sm">
              {healthCentreInfo.shifts.map((shift) => (
                <div key={shift.name} className="bg-background rounded p-2">
                  <p className="font-medium text-xs">{shift.name}</p>
                  <p className="text-xs text-muted-foreground">{shift.timing}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search doctor or specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="helplines" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="helplines" className="text-xs">
              <Building className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Helplines</span>
            </TabsTrigger>
            <TabsTrigger value="doctors" className="text-xs">
              <Stethoscope className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Doctors</span>
            </TabsTrigger>
            <TabsTrigger value="visiting" className="text-xs">
              <UserCheck className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Visiting</span>
            </TabsTrigger>
            <TabsTrigger value="psych" className="text-xs">
              <Brain className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Counseling</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="helplines" className="space-y-3 mt-4">
            {directory.map((dir) => (
              <Card key={dir.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="font-medium">{dir.department}</span>
                  <div className="flex gap-2">
                    {dir.phone_numbers.map((num) => (
                      <Button key={num} size="sm" variant="outline" onClick={() => handleCall(num)}>
                        <Phone className="w-4 h-4 mr-1" />
                        {num}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="doctors" className="space-y-3 mt-4">
            {filteredStaff(doctors).map((doc) => (
              <StaffCard key={doc.id} person={doc} />
            ))}
          </TabsContent>

          <TabsContent value="visiting" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground mb-2">
              Visiting doctors are available on specific days. Check timings before visiting.
            </p>
            {filteredStaff(visitingDoctors).map((doc) => (
              <StaffCard key={doc.id} person={doc} />
            ))}
          </TabsContent>

          <TabsContent value="psych" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground mb-2">
              Confidential counseling services available for all students.
            </p>
            {filteredStaff(psychologists).map((doc) => (
              <StaffCard key={doc.id} person={doc} />
            ))}
          </TabsContent>
        </Tabs>

        {/* OPD Services */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">OPD Services Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {healthCentreInfo.opdServices.map((service) => (
                <Badge key={service} variant="secondary" className="text-xs">
                  {service}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center px-4 pb-4">
          Consultation is free. Medicines available at subsidized rates.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default LPUHealthCentre;
