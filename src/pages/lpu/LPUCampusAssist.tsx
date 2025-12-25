import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Phone, 
  Building2, 
  Heart, 
  MapPin, 
  AlertTriangle,
  Ambulance,
  Shield,
  Users
} from "lucide-react";
import lpuLogo from "@/assets/lpu-logo.png";

const sosContacts = [
  { name: "Hospital Reception", numbers: ["01824-444079", "01824-501227"], icon: Ambulance },
  { name: "Fire & Safety", numbers: ["01824-444201"], icon: AlertTriangle },
  { name: "Women Help Center", numbers: ["9915020408"], icon: Shield },
];

const LPUCampusAssist = () => {
  const handleCall = (number: string) => {
    window.location.href = `tel:${number.replace(/-/g, '')}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <img src={lpuLogo} alt="LPU" className="w-16 h-16 object-contain" />
          <div>
            <h1 className="text-2xl font-bold">LPU Campus Assist</h1>
            <p className="text-muted-foreground">Quick access to emergency services & campus info</p>
          </div>
        </div>

        {/* SOS Section */}
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Phone className="w-5 h-5" />
              Emergency SOS
            </CardTitle>
            <CardDescription>Tap to call immediately</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {sosContacts.map((contact) => (
                <div key={contact.name} className="flex items-center justify-between bg-background rounded-lg p-3 border">
                  <div className="flex items-center gap-3">
                    <contact.icon className="w-5 h-5 text-destructive" />
                    <span className="font-medium">{contact.name}</span>
                  </div>
                  <div className="flex gap-2">
                    {contact.numbers.map((num) => (
                      <Button
                        key={num}
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCall(num)}
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        Call
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Link to="/lpu/emergency">
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="font-semibold">Emergency Numbers</h3>
                <p className="text-sm text-muted-foreground mt-1">All emergency contacts</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/lpu/hostels">
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">Hostel Quick Dial</h3>
                <p className="text-sm text-muted-foreground mt-1">BH & GH contacts</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/lpu/health-centre">
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-semibold">Health Centre</h3>
                <p className="text-sm text-muted-foreground mt-1">Doctors & helplines</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/lpu/map">
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-semibold">Campus Map</h3>
                <p className="text-sm text-muted-foreground mt-1">Navigate campus</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Health Centre Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-green-500" />
              Uni Health Centre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-2xl font-bold text-green-500">24x7</p>
                <p className="text-xs text-muted-foreground">Open</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-2xl font-bold">31</p>
                <p className="text-xs text-muted-foreground">Beds</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-2xl font-bold">6</p>
                <p className="text-xs text-muted-foreground">Ambulances</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-2xl font-bold text-green-500">Free</p>
                <p className="text-xs text-muted-foreground">Consultation</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Location: Block No. 03 | Medicines at subsidized rates
            </p>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center px-4">
          ⚠️ Numbers are provided for assistance. Please verify in urgent situations.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default LPUCampusAssist;
