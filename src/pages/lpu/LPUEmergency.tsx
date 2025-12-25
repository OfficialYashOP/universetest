import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Phone, 
  AlertTriangle, 
  Ambulance, 
  Shield, 
  Flame,
  Users,
  CreditCard,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface EmergencyContact {
  id: string;
  category: string;
  department: string | null;
  contact_name: string | null;
  mobile: string | null;
  landline: string[] | null;
  email: string | null;
  availability: string | null;
  is_sos: boolean;
  priority: number;
}

const categoryConfig: Record<string, { label: string; icon: typeof Ambulance; color: string }> = {
  hospital: { label: "Hospital", icon: Ambulance, color: "text-red-500" },
  women_help: { label: "Women Help Center", icon: Shield, color: "text-pink-500" },
  fire_safety: { label: "Fire & Safety", icon: Flame, color: "text-orange-500" },
  student_help: { label: "Student Help", icon: Users, color: "text-blue-500" },
  fee_help: { label: "Fee Related", icon: CreditCard, color: "text-green-500" },
};

const LPUEmergency = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [sosOpen, setSosOpen] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from("lpu_emergency_contacts")
      .select("*")
      .order("priority", { ascending: true });
    
    if (data) setContacts(data);
    setLoading(false);
  };

  const handleCall = (number: string) => {
    window.location.href = `tel:${number.replace(/-/g, '')}`;
  };

  const sosContacts = contacts.filter(c => c.is_sos);
  const groupedContacts = contacts.reduce((acc, contact) => {
    if (!acc[contact.category]) acc[contact.category] = [];
    acc[contact.category].push(contact);
    return acc;
  }, {} as Record<string, EmergencyContact[]>);

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
            <h1 className="text-2xl font-bold">Emergency Contacts</h1>
            <p className="text-muted-foreground">LPU Campus Emergency Directory</p>
          </div>
        </div>

        {/* SOS Button */}
        <Sheet open={sosOpen} onOpenChange={setSosOpen}>
          <SheetTrigger asChild>
            <Button 
              className="w-full h-16 text-lg bg-destructive hover:bg-destructive/90"
              size="lg"
            >
              <AlertTriangle className="w-6 h-6 mr-2" />
              SOS - Emergency Call
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Quick Emergency Contacts
              </SheetTitle>
            </SheetHeader>
            <div className="grid gap-3 mt-4 pb-4">
              {sosContacts.map((contact) => {
                const config = categoryConfig[contact.category];
                return (
                  <div 
                    key={contact.id}
                    className="flex items-center justify-between bg-muted rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      {config && <config.icon className={`w-5 h-5 ${config.color}`} />}
                      <div>
                        <p className="font-medium">{contact.department}</p>
                        {contact.contact_name && (
                          <p className="text-sm text-muted-foreground">{contact.contact_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {contact.mobile && (
                        <Button size="sm" variant="destructive" onClick={() => handleCall(contact.mobile!)}>
                          <Phone className="w-4 h-4 mr-1" /> Mobile
                        </Button>
                      )}
                      {contact.landline?.[0] && (
                        <Button size="sm" variant="outline" onClick={() => handleCall(contact.landline![0])}>
                          <Phone className="w-4 h-4 mr-1" /> Landline
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>

        {/* Categories Tabs */}
        <Tabs defaultValue="hospital" className="w-full">
          <TabsList className="w-full flex overflow-x-auto">
            {Object.entries(categoryConfig).map(([key, config]) => (
              <TabsTrigger key={key} value={key} className="flex-1 text-xs">
                <config.icon className={`w-4 h-4 mr-1 ${config.color}`} />
                <span className="hidden sm:inline">{config.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(categoryConfig).map(([key, config]) => (
            <TabsContent key={key} value={key} className="space-y-3 mt-4">
              {groupedContacts[key]?.map((contact) => (
                <Card key={contact.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <config.icon className={`w-4 h-4 ${config.color}`} />
                          <span className="font-medium">{contact.department}</span>
                        </div>
                        {contact.contact_name && (
                          <p className="text-sm text-muted-foreground mt-1">{contact.contact_name}</p>
                        )}
                        {contact.availability && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ⏰ {contact.availability}
                          </p>
                        )}
                        {contact.email && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ✉️ {contact.email}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {contact.mobile && (
                          <Button size="sm" onClick={() => handleCall(contact.mobile!)}>
                            <Phone className="w-4 h-4 mr-1" />
                            {contact.mobile}
                          </Button>
                        )}
                        {contact.landline?.map((num) => (
                          <Button key={num} size="sm" variant="outline" onClick={() => handleCall(num)}>
                            <Phone className="w-4 h-4 mr-1" />
                            {num}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center px-4 pb-4">
          ⚠️ Numbers are provided for assistance. Please verify in urgent situations.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default LPUEmergency;
